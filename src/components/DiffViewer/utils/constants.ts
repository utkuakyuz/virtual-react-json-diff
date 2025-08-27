export const DIFF_VIEWER_CLASS = "json-diff-viewer-theme-custom";

function getRowHeightFromCSS(): number {
  const root = document.documentElement;
  const value = getComputedStyle(root).getPropertyValue("--diff-row-height");
  return Number.parseInt(value, 10);
}

export const ROW_HEIGHT = getRowHeightFromCSS();

export const COLLAPSED_ROW_HEIGHT = 20;

export const SEARCH_DEBOUNCE_MS = 300;

export function isCollapsed(line: any): line is { type: "collapsed"; segmentIndex: number } {
  return line && typeof line === "object" && "type" in line && line.type === "collapsed";
}
