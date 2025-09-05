import type { DiffRow } from "../types";

export const DIFF_VIEWER_CLASS = "json-diff-viewer-theme-custom";

export const DEFAULT_ROW_HEIGHT = 20; // safe fallback

export function getRowHeightFromCSS(): number {
  if (typeof document === "undefined") {
    return DEFAULT_ROW_HEIGHT;
  }

  try {
    const root = document.documentElement;
    const value = getComputedStyle(root).getPropertyValue("--diff-row-height");
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? DEFAULT_ROW_HEIGHT : parsed;
  }
  catch {
    return DEFAULT_ROW_HEIGHT;
  }
}

export const COLLAPSED_ROW_HEIGHT = 20;

export const SEARCH_DEBOUNCE_MS = 300;

export function isCollapsed(line: any): line is { type: "collapsed"; segmentIndex: number } {
  return line && typeof line === "object" && "type" in line && line.type === "collapsed";
}

// Observe DOM changes in the diff viewer and update cells with the "empty-equal-cell" class
// whenever new rows are rendered, ensuring virtualized/scroll-loaded cells are handled.
export function equalEmptyLine(cell: DiffRow) {
  if (cell.type === "equal" && cell.text.trim() === "") {
    return "empty-equal-cell";
  }
}
