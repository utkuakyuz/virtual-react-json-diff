import { readCssVar } from "./cssVars";

const FALLBACK_MINIMAP_COLORS = {
  equal: "#363743",
  add: "#4CAF50",
  remove: "#F44336",
  modify: "#FFC107",
  search: "#ffd700",
  currentMatch: "#ff4500",
  scroll: "#7B7B7B80",
  scrollHover: "#7B7B7Bcc",
};

export type MinimapColors = typeof FALLBACK_MINIMAP_COLORS;

export function readMinimapColors(from: Element | null): MinimapColors {
  const root = from?.closest(".diff-viewer-container") ?? from;
  return {
    equal: readCssVar(root, "--diff-minimap-equal", FALLBACK_MINIMAP_COLORS.equal),
    add: readCssVar(root, "--diff-minimap-add", FALLBACK_MINIMAP_COLORS.add),
    remove: readCssVar(root, "--diff-minimap-remove", FALLBACK_MINIMAP_COLORS.remove),
    modify: readCssVar(root, "--diff-minimap-modify", FALLBACK_MINIMAP_COLORS.modify),
    search: readCssVar(root, "--diff-minimap-search", FALLBACK_MINIMAP_COLORS.search),
    currentMatch: readCssVar(root, "--diff-minimap-current-match", FALLBACK_MINIMAP_COLORS.currentMatch),
    scroll: readCssVar(root, "--diff-minimap-scroll", FALLBACK_MINIMAP_COLORS.scroll),
    scrollHover: readCssVar(root, "--diff-minimap-scroll-hover", FALLBACK_MINIMAP_COLORS.scrollHover),
  };
}
