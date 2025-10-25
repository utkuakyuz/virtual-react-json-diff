import type { DiffResult } from "json-diff-kit";

import type { LineCountStats } from "../types";

export function calculateLineCountStats(diffData: [DiffResult[], DiffResult[]]): LineCountStats {
  const [leftDiff, rightDiff] = diffData;

  let added = 0;
  let removed = 0;
  let modified = 0;

  // Count changes from the left diff (removed lines)
  for (const line of leftDiff) {
    if (line.type === "remove") {
      removed++;
    }
    else if (line.type === "modify") {
      modified++;
    }
  }

  // Count changes from the right diff (added lines)
  for (const line of rightDiff) {
    if (line.type === "add") {
      added++;
    }
  }

  const total = added + removed + modified;

  return {
    added,
    removed,
    modified,
    total,
  };
}
