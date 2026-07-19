#!/usr/bin/env python3
"""Normalize portal chronology to each work's first public release month.

The preferred source is arXiv v1. If a formal venue or official release
predates arXiv, the earlier existing month is retained. Entries whose venue is
arXiv always follow the arXiv identifier month.
"""

from __future__ import annotations

import csv
import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "source-data"
DATA = ROOT / "data"

# These papers have official arXiv versions that are not encoded in the local
# BibTeX entry or current link override.
MANUAL_ARXIV_IDS = {
    "cheng2025jowa": "2410.00564",
    "hafner2023dreamerv3": "2301.04104",
    "seo2023maskedwm": "2206.14244",
    "think2drive2024": "2402.16720",
    "unisim2023sensor": "2308.01898",
    "wmabench2025": "2506.21876",
    "li2025worldmodelbench": "2502.20694",
    "motamed2025physicsiq": "2501.09038",
}

# Public long-form sources without an arXiv v1 date.
MANUAL_PUBLIC_RELEASES = {
    "chi2025evabench": (
        "2025-05",
        "OpenReview public release: 2025-05-01",
    ),
}


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def bib_entries(text: str) -> dict[str, str]:
    starts = list(re.finditer(r"@\w+\s*\{\s*([^,\s]+)\s*,", text))
    return {
        match.group(1): text[
            match.start() : starts[index + 1].start()
            if index + 1 < len(starts)
            else len(text)
        ]
        for index, match in enumerate(starts)
    }


def arxiv_id_for(
    bib_key: str,
    entries: dict[str, str],
    paper_overrides: dict[str, str],
    fulltext_overrides: dict[str, str],
) -> str | None:
    if bib_key in MANUAL_ARXIV_IDS:
        return MANUAL_ARXIV_IDS[bib_key]

    text = " ".join(
        [
            bib_key,
            entries.get(bib_key, ""),
            paper_overrides.get(bib_key, ""),
            fulltext_overrides.get(bib_key, ""),
        ]
    )
    matches = re.findall(
        r"(?<!\d)(\d{4}\.\d{4,5})(?:v\d+)?(?!\d)", text
    )
    if matches:
        return matches[0]
    if re.fullmatch(r"arxiv\d{9}", bib_key):
        return f"{bib_key[5:9]}.{bib_key[9:]}"
    return None


def arxiv_month(arxiv_id: str) -> str:
    compact = arxiv_id.replace(".", "")
    year = 2000 + int(compact[:2])
    month = int(compact[2:4])
    if not 1 <= month <= 12:
        raise ValueError(f"Invalid arXiv identifier month: {arxiv_id}")
    return f"{year:04d}-{month:02d}"


def normalized_date(
    bib_key: str,
    venue: str,
    current_date: str,
    entries: dict[str, str],
    paper_overrides: dict[str, str],
    fulltext_overrides: dict[str, str],
) -> tuple[str, str | None]:
    manual = MANUAL_PUBLIC_RELEASES.get(bib_key)
    arxiv_id = arxiv_id_for(
        bib_key, entries, paper_overrides, fulltext_overrides
    )

    candidates: list[tuple[str, str]] = []
    if manual:
        candidates.append(manual)
    if arxiv_id:
        month = arxiv_month(arxiv_id)
        candidates.append(
            (month, f"Initial arXiv release (v1): {month} [{arxiv_id}]")
        )

    if not candidates:
        return current_date, None

    arxiv_only = venue.strip().lower() == "arxiv"
    if arxiv_only and arxiv_id:
        month = arxiv_month(arxiv_id)
        return month, f"Initial arXiv release (v1): {month} [{arxiv_id}]"

    earlier = [candidate for candidate in candidates if candidate[0] <= current_date]
    if not earlier:
        return current_date, None
    return min(earlier, key=lambda candidate: candidate[0])


def update_csv(
    path: Path,
    entries: dict[str, str],
    paper_overrides: dict[str, str],
    fulltext_overrides: dict[str, str],
) -> tuple[int, int]:
    with path.open(encoding="utf-8-sig", newline="") as handle:
        rows = list(csv.reader(handle))
    header = rows[0]
    key_index = header.index("cite_keys")
    venue_index = header.index("venue")
    year_index = header.index("year")
    date_indexes = [
        index for index, name in enumerate(header) if name == "chronology_month"
    ]
    basis_indexes = [
        index for index, name in enumerate(header) if name == "chronology_basis"
    ]

    changed_dates = 0
    changed_years = 0
    for row in rows[1:]:
        bib_key = row[key_index].split(";")[0]
        current_date = row[date_indexes[0]]
        new_date, new_basis = normalized_date(
            bib_key,
            row[venue_index],
            current_date,
            entries,
            paper_overrides,
            fulltext_overrides,
        )
        if new_date != current_date:
            changed_dates += 1
        if row[year_index] != new_date[:4]:
            changed_years += 1
        row[year_index] = new_date[:4]
        for index in date_indexes:
            row[index] = new_date
        if new_basis:
            for index in basis_indexes:
                row[index] = new_basis

    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.writer(handle, quoting=csv.QUOTE_ALL, lineterminator="\n")
        writer.writerows(rows)
    return changed_dates, changed_years


def update_additions(
    path: Path,
    entries: dict[str, str],
    paper_overrides: dict[str, str],
    fulltext_overrides: dict[str, str],
) -> tuple[int, int]:
    additions = load_json(path)
    changed_dates = 0
    changed_years = 0

    for view in ("research", "evaluation"):
        for item in additions[view]:
            current_date = item["date"]
            new_date, new_basis = normalized_date(
                item["bibKey"],
                item["venue"],
                current_date,
                entries,
                paper_overrides,
                fulltext_overrides,
            )
            if new_date != current_date:
                changed_dates += 1
            if new_date[:4] != current_date[:4]:
                changed_years += 1
            item["date"] = new_date
            if new_basis:
                item["dateBasis"] = new_basis
            elif "dateBasis" not in item:
                item["dateBasis"] = (
                    f"Formal venue or official public release: {new_date}"
                )

    path.write_text(
        json.dumps(additions, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    return changed_dates, changed_years


def main() -> None:
    metadata = load_json(DATA / "portal-meta.json")
    entries = bib_entries((SOURCE / "survey.bib").read_text(encoding="utf-8"))
    paper_overrides = metadata.get("paperOverrides", {})
    fulltext_overrides = metadata.get("fullTextOverrides", {})

    totals = [0, 0]
    for csv_name in ("world_model_methods.csv", "world_model_benchmarks.csv"):
        result = update_csv(
            SOURCE / csv_name,
            entries,
            paper_overrides,
            fulltext_overrides,
        )
        totals[0] += result[0]
        totals[1] += result[1]

    result = update_additions(
        DATA / "curated-additions.json",
        entries,
        paper_overrides,
        fulltext_overrides,
    )
    totals[0] += result[0]
    totals[1] += result[1]
    print(
        f"Normalized {totals[0]} entry dates; {totals[1]} entries changed year."
    )


if __name__ == "__main__":
    main()
