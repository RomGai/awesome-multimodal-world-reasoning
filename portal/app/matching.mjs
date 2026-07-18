export function matchesSelection(actualValues, selectedValues, mode) {
  const actual = new Set(actualValues);
  const selected = [...new Set(selectedValues)];

  if (selected.length === 0) return true;
  if (mode === "any") return selected.some((value) => actual.has(value));
  if (mode === "exact") {
    return actual.size === selected.length && selected.every((value) => actual.has(value));
  }
  return selected.every((value) => actual.has(value));
}
