import type { DiffResult } from "json-diff-kit";

export function fastHash(diff: [DiffResult[], DiffResult[]]) {
  let hash = 0;
  for (const arr of diff) {
    for (const row of arr) {
      hash = (hash + row.text.length + row.type.charCodeAt(0)) >>> 0;
    }
  }
  return hash;
}
