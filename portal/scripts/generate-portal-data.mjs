import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { classifyResearchParadigms } from "./research-paradigms.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = path.join(projectRoot, "source-data");
const csvPath = path.join(sourceRoot, "world_model_methods.csv");
const benchmarkCsvPath = path.join(sourceRoot, "world_model_benchmarks.csv");
const benchmarkTablePath = path.join(sourceRoot, "tab_world_model_benchmarks.tex");
const bibPath = path.join(sourceRoot, "survey.bib");
const metaPath = path.join(projectRoot, "data", "portal-meta.json");
const additionsPath = path.join(projectRoot, "data", "curated-additions.json");
const outputPath = path.join(projectRoot, "app", "data", "works.generated.json");
const evaluationOutputPath = path.join(projectRoot, "app", "data", "evaluation-resources.generated.json");

const expectedFields = [
  "primary_block", "subgroup", "display_order", "section_anchor", "method",
  "cite_keys", "venue", "year", "chronology_month", "chronology_basis",
  "backbone", "wm_architecture", "params_total", "params_trainable", "role_tags",
  "input_modalities", "feedback_modalities", "state_representation", "prediction_target",
  "control_variables", "intervention_variables", "training_strategy", "objective_algorithm",
  "training_data", "training_data_type", "training_scale_value", "training_scale_unit",
  "applications", "benchmarks", "evaluation_type", "verified_from_primary", "evidence_note"
];

const expectedBenchmarkFields = [
  "section6_block", "section6_subgroup", "section6_anchor", "display_order",
  "benchmark", "cite_keys", "venue", "year", "chronology_month",
  "chronology_basis", "domains", "resource_type", "modalities", "target_outputs",
  "scale_value", "scale_unit", "task", "evaluation_unit", "main_dimensions",
  "main_metrics", "display_dimensions_metrics", "display_dimensions", "display_metrics",
  "conditioning", "intervention", "reference_type", "judge_type", "loop_setting",
  "verified_from_primary", "evidence_note"
];

const domainTranslations = {
  "General": "通用",
  "Physical": "物理",
  "Robotics": "机器人",
  "Driving": "自动驾驶",
  "Games": "游戏",
  "Navigation": "导航",
  "3D/4D": "三维/四维",
  "Physical AI": "物理智能",
  "Digital Worlds": "数字世界"
};

const officialReleaseKeys = new Set([
  "deepmind2024genie2", "deepmind2025genie3", "decart2024oasis",
  "odyssey2025worldmodel", "runway2025gwm1", "worldlabs2025marble",
  "onex2025worldmodel", "waabi2022world"
]);

const allowedRoles = new Set([
  "TI-I", "TI-G", "TI-M", "SS-G", "SS-P", "SS-C", "SS-E",
  "AC-V", "AC-R", "AC-D", "AC-N", "AC-T"
]);

const keywordRules = [
  [/game|atari|minecraft|doom|playable/i, ["Games", "游戏"]],
  [/robot|manipulation|humanoid|vla|embodied|physical ai/i, ["Robotics", "机器人"]],
  [/driv|traffic|vehicle|carla/i, ["Driving", "自动驾驶"]],
  [/navig|trajectory|spatial memory/i, ["Navigation", "导航"]],
  [/planning|planner|mpc|action ranking/i, ["Planning", "规划"]],
  [/control|policy|reinforcement/i, ["Control", "控制"]],
  [/video|visual world|future image|frame/i, ["Video worlds", "视频世界"]],
  [/3d|4d|geometry|geometric|occupancy|lidar|depth/i, ["3D & geometry", "三维与几何"]],
  [/physical|physics|causal|counterfactual/i, ["Physics & causality", "物理与因果"]],
  [/tool|software|web agent|coding|external state/i, ["Tool worlds", "工具世界"]],
  [/memory|long-horizon|persistent/i, ["Long-horizon memory", "长程记忆"]],
  [/multimodal reasoning|ambiguity/i, ["Multimodal reasoning", "多模态推理"]],
  [/simulation|simulator|world generation/i, ["Simulation", "仿真"]]
];

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (field.length || row.length) {
    row.push(field.replace(/\r$/, ""));
    rows.push(row);
  }
  return rows;
}

function parseBibliography(text) {
  const entries = new Map();
  const matcher = /(?:^|\n)@(\w+)\{([^,]+),([\s\S]*?)(?=\n@\w+\{|\s*$)/g;
  for (const match of text.matchAll(matcher)) {
    entries.set(match[2].trim(), { type: match[1].toLowerCase(), body: match[3] });
  }
  return entries;
}

function bibField(body, field) {
  const expression = new RegExp(`^\\s*${field}\\s*=\\s*[{"]([^}"]+)`, "im");
  return body.match(expression)?.[1]?.trim() ?? null;
}

function bibTitleField(body) {
  const match = /^\s*title\s*=\s*/im.exec(body);
  if (!match) return null;
  const start = match.index + match[0].length;
  const delimiter = body[start];
  if (delimiter === "{") {
    let depth = 1;
    for (let index = start + 1; index < body.length; index += 1) {
      if (body[index] === "{") depth += 1;
      if (body[index] === "}") depth -= 1;
      if (depth === 0) return body.slice(start + 1, index).trim();
    }
  }
  if (delimiter === "\"") {
    for (let index = start + 1; index < body.length; index += 1) {
      if (body[index] === "\"" && body[index - 1] !== "\\") return body.slice(start + 1, index).trim();
    }
  }
  return null;
}

function cleanBibTitle(title) {
  let cleaned = title;
  cleaned = cleaned
    .replace(/\\omega\b/g, "Omega")
    .replace(/\\tau\s*\^\s*\{?2\}?/g, "Tau2")
    .replace(/\\tau\b/g, "Tau")
    .replace(/\\pi\b/g, "Pi");
  for (let pass = 0; pass < 4; pass += 1) {
    cleaned = cleaned.replace(/\\(?:textit|textbf|texttt|textsc|emph|mathrm|mathbf|mathit|operatorname)\s*\{([^{}]*)\}/g, "$1");
    cleaned = cleaned.replace(/\{([^{}]*)\}/g, "$1");
  }
  return cleaned
    .replace(/\$([^$]*)\$/g, "$1")
    .replace(/\\([&%#$])/g, "$1")
    .replace(/\\_/g, "_")
    .replace(/\^\s*\{?([0-9]+)\}?/g, "$1")
    .replace(/--+/g, "-")
    .replace(/~/g, " ")
    .replace(/\\[a-zA-Z]+/g, "")
    .replace(/[{}]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function primaryUrl(key, entry, overrides) {
  if (overrides[key]) return overrides[key];
  const eprint = bibField(entry.body, "eprint");
  if (eprint) return `https://arxiv.org/abs/${eprint}`;
  const doi = bibField(entry.body, "doi");
  if (doi) return `https://doi.org/${doi}`;
  const journalArxiv = entry.body.match(/arXiv(?:\s+preprint)?\s+arXiv:([0-9]{4}\.[0-9]{4,5})/i)?.[1];
  if (journalArxiv) return `https://arxiv.org/abs/${journalArxiv}`;
  const keyArxiv = key.match(/^arxiv(\d{4})(\d{5})$/);
  if (keyArxiv) return `https://arxiv.org/abs/${keyArxiv[1]}.${keyArxiv[2]}`;
  return bibField(entry.body, "url");
}

function keywordsFor(row) {
  const haystack = `${row.applications}; ${row.subgroup}; ${row.role_tags}`;
  const pairs = keywordRules.filter(([rule]) => rule.test(haystack)).map(([, pair]) => pair);
  const selected = pairs.slice(0, 3);
  if (!selected.length) selected.push(["World models", "世界模型"]);
  return {
    en: selected.map(([en]) => en),
    zh: selected.map(([, zh]) => zh)
  };
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

function scaleFor(row) {
  if (row.scale_value === "NR") return "NR";
  const values = row.scale_value.split(";").map((value) => value.trim());
  const units = row.scale_unit.split(";").map((unit) => unit.trim());
  if (values.length === units.length) return values.map((value, index) => `${value} ${units[index]}`).join("; ");
  return `${row.scale_value} ${row.scale_unit}`.trim();
}

function isOfficialRelease(entry, key) {
  const hasPaperLocator = Boolean(
    bibField(entry.body, "eprint") ||
    bibField(entry.body, "doi") ||
    entry.body.match(/arXiv(?:\s+preprint)?\s+arXiv:([0-9]{4}\.[0-9]{4,5})/i) ||
    key.match(/^arxiv\d{9}$/i)
  );
  return entry.type === "misc" && !hasPaperLocator;
}

const [csvText, benchmarkCsvText, benchmarkTableText, bibText, metaText, additionsText] = await Promise.all([
  readFile(csvPath, "utf8"),
  readFile(benchmarkCsvPath, "utf8"),
  readFile(benchmarkTablePath, "utf8"),
  readFile(bibPath, "utf8"),
  readFile(metaPath, "utf8"),
  readFile(additionsPath, "utf8")
]);

const meta = JSON.parse(metaText);
const additions = JSON.parse(additionsText);
const csvRows = parseCsv(csvText);
const header = csvRows.shift();
if (!header || header.slice(0, expectedFields.length).join("|") !== expectedFields.join("|")) {
  throw new Error("world_model_methods.csv no longer matches the expected Table 2 schema.");
}

const bibliography = parseBibliography(bibText);
const seen = new Set();
const works = csvRows.filter((cells) => cells.some(Boolean)).map((cells, index) => {
  const row = Object.fromEntries(expectedFields.map((field, fieldIndex) => [field, cells[fieldIndex] ?? ""]));
  const id = row.cite_keys.trim();
  if (!id || seen.has(id)) throw new Error(`Duplicate or missing citation key at row ${index + 2}.`);
  seen.add(id);
  const entry = bibliography.get(id);
  if (!entry) throw new Error(`Missing bibliography entry for ${id}.`);
  const roleSource = meta.roleOverrides?.[id]?.join(";") ?? row.role_tags;
  const effectiveRow = { ...row, role_tags: roleSource };
  const roles = roleSource.split(";").map((role) => role.trim()).filter(Boolean);
  const invalidRole = roles.find((role) => !allowedRoles.has(role));
  if (invalidRole) throw new Error(`Invalid role ${invalidRole} on ${row.method}.`);
  if (!/^\d{4}-\d{2}$/.test(row.chronology_month)) throw new Error(`Invalid date on ${row.method}.`);
  if (row.year !== row.chronology_month.slice(0, 4)) throw new Error(`Date/year mismatch on ${row.method}.`);
  const url = primaryUrl(id, entry, meta.paperOverrides);
  if (!url?.startsWith("https://")) throw new Error(`Missing HTTPS primary source for ${row.method}.`);
  const primaryKind = officialReleaseKeys.has(id) ? "official" : "paper";
  return {
    id,
    name: row.method,
    title: cleanBibTitle(bibTitleField(entry.body) ?? row.method),
    venue: row.venue,
    date: row.chronology_month,
    year: Number(row.year),
    roles,
    keywords: keywordsFor(effectiveRow),
    summary: meta.summaries?.[id],
    applications: row.applications,
    links: {
      [primaryKind]: url,
      ...(meta.links[id] ?? {})
    }
  };
});

if (works.length !== 90) throw new Error(`Expected 90 Table 2 works, found ${works.length}.`);

for (const addition of additions.research ?? []) {
  const id = addition.bibKey;
  if (!id || seen.has(id)) throw new Error(`Duplicate or missing curated Research Work key ${id || "(empty)"}.`);
  const entry = bibliography.get(id);
  if (!entry) throw new Error(`Missing bibliography entry for curated Research Work ${id}.`);
  const roles = addition.roles ?? [];
  if (!roles.length || roles.some((role) => !allowedRoles.has(role))) throw new Error(`Curated Research Work ${id} has invalid roles.`);
  if (!/^\d{4}-\d{2}$/.test(addition.date ?? "")) throw new Error(`Curated Research Work ${id} has an invalid date.`);
  if (!addition.dateBasis?.trim()) throw new Error(`Curated Research Work ${id} lacks a first-public-date basis.`);
  if (!addition.keywords?.en?.length || !addition.keywords?.zh?.length) throw new Error(`Curated Research Work ${id} lacks bilingual topics.`);
  const summary = meta.summaries?.[id];
  if (!summary?.en || !summary?.zh) throw new Error(`Curated Research Work ${id} lacks a bilingual full-text summary.`);
  const url = primaryUrl(id, entry, meta.paperOverrides);
  if (!url?.startsWith("https://")) throw new Error(`Curated Research Work ${id} lacks an HTTPS primary source.`);
  const primaryKind = officialReleaseKeys.has(id) || isOfficialRelease(entry, id) ? "official" : "paper";
  seen.add(id);
  works.push({
    id,
    name: addition.name ?? cleanBibTitle(bibTitleField(entry.body) ?? id),
    title: cleanBibTitle(bibTitleField(entry.body) ?? addition.name ?? id),
    venue: addition.venue,
    date: addition.date,
    year: Number(addition.date.slice(0, 4)),
    roles,
    keywords: addition.keywords,
    summary,
    applications: addition.applications ?? "",
    links: { [primaryKind]: url, ...(meta.links[id] ?? {}) }
  });
}

for (const work of works) {
  if (!work.summary?.en?.trim() || !work.summary?.zh?.trim()) {
    throw new Error(`Research Work ${work.name} lacks a bilingual full-text summary.`);
  }
  work.paradigms = classifyResearchParadigms(work);
}

const benchmarkCsvRows = parseCsv(benchmarkCsvText);
const benchmarkHeader = benchmarkCsvRows.shift();
if (!benchmarkHeader || benchmarkHeader.slice(0, expectedBenchmarkFields.length).join("|") !== expectedBenchmarkFields.join("|")) {
  throw new Error("world_model_benchmarks.csv no longer matches the expected Table 3 schema.");
}

const evaluationFocus = evaluationFocusFromTable(benchmarkTableText);
const missingEvaluationSources = [];
const evaluationResources = benchmarkCsvRows.filter((cells) => cells.some(Boolean)).map((cells, index) => {
  const row = Object.fromEntries(expectedBenchmarkFields.map((field, fieldIndex) => [field, cells[fieldIndex] ?? ""]));
  const citeKeys = row.cite_keys.split(";").map((key) => key.trim()).filter(Boolean);
  const primaryKey = citeKeys[0];
  const entry = bibliography.get(primaryKey);
  if (!entry) throw new Error(`Missing bibliography entry for Table 3 resource ${row.benchmark}.`);
  const override = meta.evaluationOverrides?.[primaryKey] ?? {};
  const url = primaryUrl(primaryKey, entry, meta.paperOverrides);
  if (!url?.startsWith("https://")) missingEvaluationSources.push(`${row.benchmark} (${primaryKey})`);
  const focus = override.focus ?? evaluationFocus.get(row.benchmark);
  if (!focus?.length) throw new Error(`Missing evaluation focus for Table 3 resource ${row.benchmark}.`);
  if (focus.some((tag) => !["TI", "SS", "AC"].includes(tag)) || new Set(focus).size !== focus.length) {
    throw new Error(`Invalid Table 3 evaluation focus for ${row.benchmark}: ${focus.join(", ")}.`);
  }
  const domains = override.domains ?? row.domains.split(";").map((domain) => domain.trim()).filter(Boolean);
  if (!Array.isArray(domains) || !domains.length) throw new Error(`Missing domains for Table 3 resource ${row.benchmark}.`);
  if (!/^\d{4}-\d{2}$/.test(row.chronology_month)) throw new Error(`Invalid date on ${row.benchmark}.`);
  if (row.year !== row.chronology_month.slice(0, 4)) throw new Error(`Date/year mismatch on ${row.benchmark}.`);
  const links = citeKeys.reduce((allLinks, key) => ({ ...allLinks, ...(meta.links[key] ?? {}) }), {});
  const primaryKind = isOfficialRelease(entry, primaryKey) ? "official" : "paper";
  return {
    id: `evaluation-${row.display_order}-${primaryKey}`,
    name: row.benchmark,
    title: cleanBibTitle(bibTitleField(entry.body) ?? row.benchmark),
    venue: row.venue,
    date: row.chronology_month,
    year: Number(row.year),
    focus,
    keywords: {
      en: domains,
      zh: domains.map((domain) => domainTranslations[domain] ?? domain)
    },
    resourceType: override.resourceType ?? row.resource_type,
    target: override.target ?? row.target_outputs,
    scale: override.scale ?? scaleFor(row),
    task: override.task ?? row.task,
    dimensions: override.dimensions ?? row.display_dimensions_metrics,
    links: {
      ...(url ? { [primaryKind]: url } : {}),
      ...links
    }
  };
});

if (evaluationResources.length !== 74) throw new Error(`Expected 74 Table 3 resources, found ${evaluationResources.length}.`);
const seenEvaluation = new Set(evaluationResources.map((resource) => resource.id.replace(/^evaluation-\d+-/, "")));
for (const [index, addition] of (additions.evaluation ?? []).entries()) {
  const id = addition.bibKey;
  if (!id || seenEvaluation.has(id)) throw new Error(`Duplicate or missing curated Evaluation Resource key ${id || "(empty)"}.`);
  const entry = bibliography.get(id);
  if (!entry) throw new Error(`Missing bibliography entry for curated Evaluation Resource ${id}.`);
  const focus = addition.focus ?? [];
  if (!focus.length || focus.some((tag) => !["TI", "SS", "AC"].includes(tag)) || new Set(focus).size !== focus.length) {
    throw new Error(`Curated Evaluation Resource ${id} has invalid Evaluation Focus tags.`);
  }
  if (!/^\d{4}-\d{2}$/.test(addition.date ?? "")) throw new Error(`Curated Evaluation Resource ${id} has an invalid date.`);
  if (!addition.dateBasis?.trim()) throw new Error(`Curated Evaluation Resource ${id} lacks a first-public-date basis.`);
  if (!addition.keywords?.en?.length || !addition.keywords?.zh?.length) throw new Error(`Curated Evaluation Resource ${id} lacks bilingual domains.`);
  for (const field of ["resourceType", "target", "scale", "task", "dimensions"]) {
    if (!addition[field]) throw new Error(`Curated Evaluation Resource ${id} lacks ${field}.`);
  }
  const url = primaryUrl(id, entry, meta.paperOverrides);
  const primaryKind = isOfficialRelease(entry, id) ? "official" : "paper";
  seenEvaluation.add(id);
  evaluationResources.push({
    id: `evaluation-curated-${index + 1}-${id}`,
    name: addition.name,
    title: cleanBibTitle(bibTitleField(entry.body) ?? addition.name),
    venue: addition.venue,
    date: addition.date,
    year: Number(addition.date.slice(0, 4)),
    focus,
    keywords: addition.keywords,
    resourceType: addition.resourceType,
    target: addition.target,
    scale: addition.scale,
    task: addition.task,
    dimensions: addition.dimensions,
    links: { ...(url ? { [primaryKind]: url } : {}), ...(meta.links[id] ?? {}) }
  });
}

for (const resource of evaluationResources) {
  for (const field of ["resourceType", "target", "scale", "task", "dimensions"]) {
    if (!resource[field]?.trim()) throw new Error(`Evaluation Resource ${resource.name} lacks ${field}.`);
  }
}
if (missingEvaluationSources.length) {
  console.warn(`Table 3 resources without a verified primary URL (${missingEvaluationSources.length}): ${missingEvaluationSources.join(", ")}`);
}

await mkdir(path.dirname(outputPath), { recursive: true });
await Promise.all([
  writeFile(outputPath, `${JSON.stringify(works, null, 2)}\n`, "utf8"),
  writeFile(evaluationOutputPath, `${JSON.stringify(evaluationResources, null, 2)}\n`, "utf8")
]);
console.log(`Generated ${works.length} research works and ${evaluationResources.length} evaluation resources.`);
