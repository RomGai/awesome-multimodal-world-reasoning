import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { buildPaginationItems, MAX_VISIBLE_PAGE_BUTTONS } from "../app/pagination.mjs";
import { matchesSelection } from "../app/matching.mjs";
import {
  FULL_TEXT_PARADIGM_AUDIT,
  RESEARCH_PARADIGMS,
} from "../scripts/research-paradigms.mjs";

const works = JSON.parse(await readFile(new URL("../app/data/works.generated.json", import.meta.url), "utf8"));
const resources = JSON.parse(await readFile(new URL("../app/data/evaluation-resources.generated.json", import.meta.url), "utf8"));
const methodsCsv = await readFile(new URL("../source-data/world_model_methods.csv", import.meta.url), "utf8");
const benchmarksCsv = await readFile(new URL("../source-data/world_model_benchmarks.csv", import.meta.url), "utf8");
const benchmarkTable = await readFile(new URL("../source-data/tab_world_model_benchmarks.tex", import.meta.url), "utf8");
const allowedRoles = new Set([
  "TI-I", "TI-G", "TI-M", "SS-G", "SS-P", "SS-C", "SS-E",
  "AC-V", "AC-R", "AC-D", "AC-N", "AC-T",
]);
const allowedFocus = new Set(["TI", "SS", "AC"]);
const allowedParadigms = new Set(RESEARCH_PARADIGMS);

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') quoted = false;
      else field += character;
    } else if (character === '"') quoted = true;
    else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n") {
      row.push(field.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      field = "";
    } else field += character;
  }
  if (field.length || row.length) {
    row.push(field.replace(/\r$/, ""));
    rows.push(row);
  }
  return rows;
}

function csvObjects(text) {
  const rows = parseCsv(text);
  const header = rows.shift() ?? [];
  return rows
    .filter((row) => row.some(Boolean))
    .map((row) => Object.fromEntries(header.map((field, index) => [field, row[index] ?? ""])));
}

function evaluationFocusFromTable(text) {
  const focuses = new Map();
  for (const line of text.split(/\r?\n/)) {
    if (!line.includes("\\tablecite{")) continue;
    const cells = line.split(" & ");
    if (cells.length < 9) continue;
    const name = cells[0]
      .replace(/^\\rowcolor\{black!4\}/, "")
      .replace(/\\tablecite\{[^}]+\}$/, "")
      .replace(/\\&/g, "&")
      .trim();
    focuses.set(name, cells[6].split(",").map((focus) => focus.trim()).filter(Boolean));
  }
  return focuses;
}
const unsafeDisplayMarkup = /[$\\{}^]|[²³]|[\u0370-\u03ff]/u;

test("compact pagination keeps boundary pages and caps numeric buttons", () => {
  for (const currentPage of [1, 2, 3, 10, 18, 34, 35]) {
    const items = buildPaginationItems(35, currentPage);
    const pages = items.filter((item) => typeof item === "number");
    assert.ok(pages.length <= MAX_VISIBLE_PAGE_BUTTONS);
    assert.deepEqual(pages.slice(0, 2), [1, 2]);
    assert.deepEqual(pages.slice(-2), [34, 35]);
    assert.ok(pages.includes(currentPage));
  }
  assert.deepEqual(
    buildPaginationItems(35, 18).filter((item) => typeof item === "number"),
    [1, 2, 16, 17, 18, 19, 20, 34, 35],
  );
  assert.deepEqual(buildPaginationItems(5, 3), [1, 2, 3, 4, 5]);
});

test("matching modes distinguish any, all, and exact role sets", () => {
  assert.equal(matchesSelection(["TI", "SS"], ["TI"], "any"), true);
  assert.equal(matchesSelection(["TI", "SS"], ["TI", "AC"], "any"), true);
  assert.equal(matchesSelection(["TI", "SS"], ["TI", "SS"], "all"), true);
  assert.equal(matchesSelection(["TI", "SS", "AC"], ["TI", "SS"], "exact"), false);
  assert.equal(matchesSelection(["SS", "TI"], ["TI", "SS"], "exact"), true);
  assert.equal(matchesSelection(["TI"], [], "exact"), true);
});

test("expanded catalogs have unique identifiers and retain their reviewed bases", () => {
  assert.ok(works.length >= 90);
  assert.ok(resources.length >= 74);
  assert.equal(new Set(works.map((work) => work.id)).size, works.length);
  assert.equal(new Set(resources.map((resource) => resource.id)).size, resources.length);
});

test("chronology follows first public release rather than venue month", () => {
  const worksById = new Map(works.map((work) => [work.id, work]));
  const resourcesByName = new Map(resources.map((resource) => [resource.name, resource]));
  assert.equal(worksById.get("hafner2023dreamerv3")?.date, "2023-01");
  assert.equal(worksById.get("cheng2025jowa")?.date, "2024-10");
  assert.equal(worksById.get("think2drive2024")?.date, "2024-02");
  assert.equal(resourcesByName.get("WorldModelBench")?.date, "2025-02");
  assert.equal(resourcesByName.get("Physics-IQ")?.date, "2025-01");
  assert.equal(resourcesByName.get("MBench")?.date, "2026-06");
  for (const item of [...works, ...resources]) {
    assert.equal(item.year, Number(item.date.slice(0, 4)), `${item.name} has a date/year mismatch`);
  }
});

test("Table 2 and Table 3 tags stay synchronized with their portal entries", () => {
  const table2Rows = csvObjects(methodsCsv);
  const worksById = new Map(works.map((work) => [work.id, work]));
  assert.equal(table2Rows.length, 90);
  for (const row of table2Rows) {
    const work = worksById.get(row.cite_keys);
    assert.ok(work, `Missing Table 2 portal entry for ${row.method}`);
    assert.deepEqual(
      work.roles,
      row.role_tags.split(";").map((role) => role.trim()).filter(Boolean),
      `${row.method} has inconsistent Table 2 and portal roles`,
    );
  }

  const table3Rows = csvObjects(benchmarksCsv);
  const resourcesById = new Map(resources.map((resource) => [resource.id, resource]));
  const tableFocus = evaluationFocusFromTable(benchmarkTable);
  assert.equal(table3Rows.length, 74);
  for (const row of table3Rows) {
    const primaryKey = row.cite_keys.split(";")[0].trim();
    const resource = resourcesById.get(`evaluation-${row.display_order}-${primaryKey}`);
    assert.ok(resource, `Missing Table 3 portal entry for ${row.benchmark}`);
    assert.deepEqual(
      resource.focus,
      tableFocus.get(row.benchmark),
      `${row.benchmark} has inconsistent Table 3 and portal focus`,
    );
  }
});

test("every research work has valid roles, paradigms, chronology, bilingual summary, and HTTPS source", () => {
  for (const work of works) {
    assert.match(work.date, /^\d{4}-\d{2}$/);
    assert.ok(work.roles.length > 0);
    assert.ok(work.roles.every((role) => allowedRoles.has(role)));
    assert.ok(work.paradigms.length > 0);
    assert.equal(new Set(work.paradigms).size, work.paradigms.length);
    assert.ok(work.paradigms.every((paradigm) => allowedParadigms.has(paradigm)));
    assert.ok(work.summary?.en?.trim());
    assert.ok(work.summary?.zh?.trim());
    const englishWords = work.summary.en.trim().split(/\s+/).length;
    const chineseCharacters = work.summary.zh.match(/\p{Script=Han}/gu)?.length ?? 0;
    assert.ok(englishWords >= 80 && englishWords <= 120, `${work.name} has ${englishWords} English summary words`);
    assert.ok(chineseCharacters >= 140 && chineseCharacters <= 220, `${work.name} has ${chineseCharacters} Chinese summary characters`);
    assert.ok((work.links.paper ?? work.links.official)?.startsWith("https://"));
  }
});

test("full-text paradigm audit resolves the reviewed generative-latent overlap", () => {
  const worksByName = new Map(works.map((work) => [work.name.toLowerCase(), work]));
  for (const [name, expected] of Object.entries(FULL_TEXT_PARADIGM_AUDIT)) {
    const work = worksByName.get(name);
    assert.ok(work, `Missing audited Research Work: ${name}`);
    assert.deepEqual(
      work.paradigms.filter((paradigm) => paradigm !== "mllm-integrated"),
      expected,
      `${work.name} does not match its full-text paradigm audit`,
    );
  }

  const overlap = works.filter((work) =>
    work.paradigms.includes("generative-interactive")
    && work.paradigms.includes("latent-predictive"));
  assert.equal(overlap.length, 16);
});

test("every evaluation resource has focus and complete structured details", () => {
  for (const resource of resources) {
    assert.match(resource.date, /^\d{4}-\d{2}$/);
    assert.ok(resource.focus.length > 0);
    assert.ok(resource.focus.every((tag) => allowedFocus.has(tag)));
    assert.ok(resource.keywords?.en?.length > 0);
    assert.ok(resource.keywords?.zh?.length > 0);
    for (const field of ["resourceType", "target", "scale", "task", "dimensions"]) {
      assert.ok(resource[field]?.trim(), `${resource.name} is missing ${field}`);
    }
    assert.ok((resource.links.paper ?? resource.links.official)?.startsWith("https://"));
  }
});

test("all optional portal links are HTTPS and use supported relation names", () => {
  for (const item of [...works, ...resources]) {
    for (const [kind, url] of Object.entries(item.links)) {
      assert.ok(["paper", "official", "code", "project", "blog"].includes(kind));
      assert.ok(url.startsWith("https://"), `${item.name} has a non-HTTPS ${kind} link`);
    }
  }
});

test("front-end names and titles contain no raw math or LaTeX display markup", () => {
  for (const item of [...works, ...resources]) {
    assert.doesNotMatch(item.name, unsafeDisplayMarkup, `${item.name} has unsafe display markup`);
    assert.doesNotMatch(item.title, unsafeDisplayMarkup, `${item.name} title has unsafe display markup`);
    assert.ok(!item.title.startsWith("-"), `${item.name} title begins with a missing symbol`);
  }
});

test("both catalogs preserve cross-family entries", () => {
  assert.ok(works.some((work) => new Set(work.roles.map((role) => role.slice(0, 2))).size >= 2));
  assert.ok(resources.some((resource) => resource.focus.length >= 2));
});
