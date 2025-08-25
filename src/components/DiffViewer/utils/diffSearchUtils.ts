import type { DiffRowOrCollapsed } from "../types";

export function performSearch(term: string, leftView: DiffRowOrCollapsed[]): number[] {
  if (!term)
    return [];

  const results: number[] = [];
  const searchRegex = new RegExp(term, "gi");

  leftView.forEach((line, index) => {
    if (typeof line === "object" && "text" in line && searchRegex.test(line.text)) {
      results.push(index);
    }
  });

  return results;
}

export function highlightMatches(term: string, className: string = "json-diff-viewer-theme-custom"): void {
  if (!term) {
    const elements = document.querySelectorAll(`.${className} span.token.search-match`);
    elements.forEach(element => element.classList.remove("search-match"));
    return;
  }

  const termToUse = term.replaceAll("(", "").replaceAll(")", "");
  const regex = new RegExp(termToUse, "gi");
  const elements = document.querySelectorAll(`.${className} span.token`);

  elements.forEach((element) => {
    const text = element.textContent || "";
    if (regex.test(text)) {
      element.classList.add("search-match");
    }
    else {
      element.classList.remove("search-match");
    }
  });
}
