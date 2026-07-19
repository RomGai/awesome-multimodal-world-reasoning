import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { RESEARCH_PARADIGMS } from "./research-paradigms.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const portalRoot = path.resolve(here, "..");
const load = async (...parts) => JSON.parse(await readFile(path.join(...parts), "utf8"));

const [additions, meta, works, resources] = await Promise.all([
  load(portalRoot, "data", "curated-additions.json"),
  load(portalRoot, "data", "portal-meta.json"),
  load(portalRoot, "app", "data", "works.generated.json"),
  load(portalRoot, "app", "data", "evaluation-resources.generated.json"),
]);

const errors = [];
const allowedRoles = new Set(["TI-I", "TI-G", "TI-M", "SS-G", "SS-P", "SS-C", "SS-E", "AC-V", "AC-R", "AC-D", "AC-N", "AC-T"]);
const allowedFocus = new Set(["TI", "SS", "AC"]);
const allowedParadigms = new Set(RESEARCH_PARADIGMS);

const checkLinks = (item) => {
  const values = Object.values(item.links ?? {});
  if (new Set(values).size !== values.length) errors.push(`${item.name}: duplicate link targets.`);
  for (const value of values) if (!value.startsWith("https://")) errors.push(`${item.name}: non-HTTPS link ${value}.`);
};

if (works.length !== 90 + (additions.research?.length ?? 0)) {
  errors.push(`Generated ${works.length} Research Works; expected the 90 Table 2 records plus curated additions.`);
}
if (resources.length !== 74 + (additions.evaluation?.length ?? 0)) {
  errors.push(`Generated ${resources.length} Evaluation Resources; expected the 74 Table 3 records plus curated additions.`);
}

const worksById = new Map(works.map((work) => [work.id, work]));
for (const addition of additions.research ?? []) {
  if (!worksById.has(addition.bibKey)) errors.push(`${addition.bibKey}: curated Research Work is missing from the generated catalog.`);
  if (!addition.dateBasis?.trim()) errors.push(`${addition.bibKey}: first-public-date basis is missing.`);
  if (!meta.summaries?.[addition.bibKey]?.en || !meta.summaries?.[addition.bibKey]?.zh) {
    errors.push(`${addition.bibKey}: curated Research summary is missing from portal-meta.`);
  }
}
for (const addition of additions.evaluation ?? []) {
  if (!addition.dateBasis?.trim()) errors.push(`${addition.bibKey}: first-public-date basis is missing.`);
  if (!resources.some((resource) => resource.id.endsWith(`-${addition.bibKey}`))) {
    errors.push(`${addition.bibKey}: curated Evaluation Resource is missing from the generated catalog.`);
  }
}

for (const work of works) {
  if (!/^\d{4}-\d{2}$/.test(work.date) || work.year !== Number(work.date.slice(0, 4))) errors.push(`${work.name}: invalid chronology.`);
  if (!work.roles?.length || work.roles.some((role) => !allowedRoles.has(role))) errors.push(`${work.name}: invalid roles.`);
  if (!work.paradigms?.length || work.paradigms.some((paradigm) => !allowedParadigms.has(paradigm)) || new Set(work.paradigms).size !== work.paradigms.length) errors.push(`${work.name}: invalid research paradigms.`);
  if (!work.summary?.en?.trim() || !work.summary?.zh?.trim()) errors.push(`${work.name}: missing bilingual summary.`);
  const englishWords = work.summary?.en?.trim().split(/\s+/).length ?? 0;
  const chineseCharacters = work.summary?.zh?.match(/\p{Script=Han}/gu)?.length ?? 0;
  if (englishWords < 80 || englishWords > 120) errors.push(`${work.name}: English summary has ${englishWords} words; expected 80–120.`);
  if (chineseCharacters < 140 || chineseCharacters > 220) errors.push(`${work.name}: Chinese summary has ${chineseCharacters} Han characters; expected 140–220.`);
  checkLinks(work);
}

for (const resource of resources) {
  if (!/^\d{4}-\d{2}$/.test(resource.date) || resource.year !== Number(resource.date.slice(0, 4))) errors.push(`${resource.name}: invalid chronology.`);
  if (!resource.focus?.length || resource.focus.some((tag) => !allowedFocus.has(tag))) errors.push(`${resource.name}: invalid focus.`);
  for (const field of ["resourceType", "target", "scale", "task", "dimensions"]) {
    if (!resource[field]?.trim()) errors.push(`${resource.name}: missing ${field}.`);
  }
  checkLinks(resource);
}

if (errors.length) {
  console.error(`Curation validation failed with ${errors.length} error(s):`);
  for (const error of errors.slice(0, 100)) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Curation validation passed: ${works.length} Research Works and ${resources.length} Evaluation Resources.`);
}
