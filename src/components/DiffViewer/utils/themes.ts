import type { DiffTheme } from "../types";

export const DIFF_THEMES = ["default", "github-dark", "github-light", "nord", "tokyo-night", "solarized-light"] as const;

export const DEFAULT_DIFF_THEME: DiffTheme = "default";

export function resolveDiffTheme(theme?: string | null): DiffTheme {
  if (theme && (DIFF_THEMES as readonly string[]).includes(theme)) {
    return theme as DiffTheme;
  }
  return DEFAULT_DIFF_THEME;
}
