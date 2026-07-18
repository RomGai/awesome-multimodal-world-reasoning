export const MAX_VISIBLE_PAGE_BUTTONS = 9;

/**
 * Builds a compact pagination sequence while keeping the first two and last
 * two pages visible. String entries represent gaps between numeric buttons.
 *
 * @param {number} totalPages
 * @param {number} currentPage
 * @param {number} [maxVisible]
 * @returns {(number | string)[]}
 */
export function buildPaginationItems(totalPages, currentPage, maxVisible = MAX_VISIBLE_PAGE_BUTTONS) {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set([1, 2, totalPages - 1, totalPages]);
  let radius = 0;
  while (pages.size < maxVisible) {
    const candidates = radius === 0
      ? [currentPage]
      : [currentPage - radius, currentPage + radius];
    for (const page of candidates) {
      if (page >= 3 && page <= totalPages - 2) pages.add(page);
      if (pages.size === maxVisible) break;
    }
    radius += 1;
  }

  const orderedPages = [...pages].sort((left, right) => left - right);
  const items = [];
  for (const page of orderedPages) {
    const previous = items.at(-1);
    const previousPage = typeof previous === "number" ? previous : orderedPages[orderedPages.indexOf(page) - 1];
    if (typeof previousPage === "number" && page - previousPage > 1) {
      items.push(`ellipsis-${previousPage}-${page}`);
    }
    items.push(page);
  }
  return items;
}
