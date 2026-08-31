export function readCssVar(el: Element | null, name: string, fallback: string): string {
  if (!el || typeof getComputedStyle === "undefined")
    return fallback;

  try {
    const value = getComputedStyle(el).getPropertyValue(name).trim();
    return value || fallback;
  }
  catch {
    return fallback;
  }
}
