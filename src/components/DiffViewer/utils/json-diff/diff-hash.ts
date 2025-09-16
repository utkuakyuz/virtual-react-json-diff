import type { DiffResult } from "json-diff-kit";

export function fastHash(diff: [DiffResult[], DiffResult[]]) {
  let hash = 5381; // djb2 seed
  for (const arr of diff) {
    for (const row of arr) {
      const text = row.text;
      for (let i = 0; i < text.length; i++) {
        hash = ((hash << 5) + hash) + text.charCodeAt(i);
      }
      const type = row.type;
      for (let i = 0; i < type.length; i++) {
        hash = ((hash << 5) + hash) + type.charCodeAt(i);
      }
    }
  }
  return hash >>> 0;
}
