"""Live HTTP audit for every unique link in the generated portal catalogs."""

from __future__ import annotations

import json
import os
import sys
from collections import Counter
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import requests


ROOT = Path(__file__).resolve().parents[1]
CATALOGS = (
    ROOT / "app" / "data" / "works.generated.json",
    ROOT / "app" / "data" / "evaluation-resources.generated.json",
)
BLOCKED_STATUSES = {401, 403, 406, 418, 429, 451}
WORKERS = max(1, int(os.environ.get("LINK_CHECK_WORKERS", "40")))
TIMEOUT = max(1.0, float(os.environ.get("LINK_CHECK_TIMEOUT_SECONDS", "12")))
HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; SurveyPortalLinkAudit/1.0; +https://localhost/)"
}


def load_links() -> dict[str, list[dict[str, str]]]:
    links: dict[str, list[dict[str, str]]] = {}
    for catalog_path in CATALOGS:
        for item in json.loads(catalog_path.read_text(encoding="utf-8")):
            for kind, url in item.get("links", {}).items():
                links.setdefault(url, []).append(
                    {"id": item["id"], "kind": kind, "name": item["name"]}
                )
    return links


def check(url: str) -> dict[str, object]:
    try:
        response = requests.head(
            url,
            headers=HEADERS,
            allow_redirects=True,
            timeout=(5, TIMEOUT),
        )
        # Some official hosts (notably GitHub) return a misleading status to
        # HEAD requests even though a normal browser GET succeeds. Confirm any
        # non-successful HEAD result before classifying the link as unavailable.
        if response.status_code >= 400:
            response = requests.get(
                url,
                headers=HEADERS,
                allow_redirects=True,
                stream=True,
                timeout=(5, TIMEOUT),
            )
        return {"url": url, "status": response.status_code, "finalUrl": response.url}
    except requests.RequestException as error:
        return {"url": url, "error": f"{type(error).__name__}: {error}"}


def main() -> int:
    links = load_links()
    urls = sorted(links)
    with ThreadPoolExecutor(max_workers=WORKERS) as pool:
        results = list(pool.map(check, urls))

    counts = Counter(str(result.get("status", "error")) for result in results)
    blocked: list[dict[str, object]] = []
    failures: list[dict[str, object]] = []
    for result in results:
        status = result.get("status")
        if isinstance(status, int) and status < 400:
            continue
        if status in BLOCKED_STATUSES:
            blocked.append(result)
        else:
            failures.append(result)

    print(
        json.dumps(
            {
                "uniqueLinks": len(urls),
                "statusCounts": dict(sorted(counts.items())),
                "blockedByRemoteSite": len(blocked),
                "hardFailures": len(failures),
            }
        )
    )
    for result in failures:
        url = str(result["url"])
        print(
            "FAIL",
            result.get("status", "ERR"),
            url,
            result.get("error", result.get("finalUrl")),
            links[url][0],
            file=sys.stderr,
        )
    for result in blocked:
        url = str(result["url"])
        print("BLOCKED", result["status"], url, links[url][0], file=sys.stderr)
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
