/// <reference types="bun" />

import { describe, expect, test } from "bun:test";

import { DEFAULT_DIFF_THEME, DIFF_THEMES, resolveDiffTheme } from "../themes";

describe("resolveDiffTheme", () => {
  test("returns default when theme is omitted or invalid", () => {
    expect(resolveDiffTheme()).toBe(DEFAULT_DIFF_THEME);
    expect(resolveDiffTheme(undefined)).toBe("default");
    expect(resolveDiffTheme(null)).toBe("default");
    expect(resolveDiffTheme("solarized")).toBe("default");
  });

  test("returns known palettes as-is", () => {
    for (const theme of DIFF_THEMES) {
      expect(resolveDiffTheme(theme)).toBe(theme);
    }
  });
});
