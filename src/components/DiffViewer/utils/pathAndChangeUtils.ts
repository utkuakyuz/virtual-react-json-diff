import type { DiffResult } from "json-diff-kit";

import type { ChangeBlock, DiffRow, ReviewGroupingMode } from "../types";

export function computePaths(diff: DiffResult[]): string[] {
  const paths: string[] = [];
  const stack: { type: "object" | "array" | "primitive"; key: string | number; index: number }[] = [];

  for (let i = 0; i < diff.length; i++) {
    const line = diff[i];
    const level = line.level;
    const text = line.text ? line.text.trim() : "";

    if (text === "") {
      paths.push("");
      continue;
    }

    // Pop stack to match level
    while (stack.length > level) {
      stack.pop();
    }

    // Determine current path prefix from stack
    const pathParts: string[] = [];
    for (let s = 1; s < stack.length; s++) {
      const parent = stack[s - 1];
      const current = stack[s];
      if (parent.type === "array") {
        pathParts.push(`[${current.key}]`);
      }
      else {
        pathParts.push(pathParts.length === 0 ? String(current.key) : `.${current.key}`);
      }
    }

    const parent = stack[stack.length - 1];
    let currentKey: string | null = null;

    // Check if line is closing brace/bracket
    const isClosing = text === "}" || text === "}," || text === "]" || text === "],";

    if (parent && parent.type === "array" && !isClosing) {
      // Inside an array, we are starting a new item
      const itemIndex = parent.index;
      // Build path for this item
      const itemPath = [...pathParts, `[${itemIndex}]`].join("");
      paths.push(itemPath);

      // Determine what type of item it is
      const isObject = text.startsWith("{");
      const isArray = text.startsWith("[");

      stack.push({
        type: isObject ? "object" : isArray ? "array" : "primitive",
        key: itemIndex,
        index: isArray ? 0 : -1,
      });
      parent.index++;
    }
    else if (isClosing) {
      // Closing bracket/brace
      paths.push(pathParts.join(""));
    }
    else {
      // Inside an object or at root
      // Try to match a key: "name": ...
      const keyMatch = text.match(/^"((?:[^"\\]|\\.)*)"\s*:/);
      if (keyMatch) {
        currentKey = keyMatch[1];
        const currentPath = [...pathParts, pathParts.length === 0 ? currentKey : `.${currentKey}`].join("");
        paths.push(currentPath);

        const restText = text.slice(keyMatch[0].length).trim();
        const isObject = restText.startsWith("{");
        const isArray = restText.startsWith("[");

        stack.push({
          type: isObject ? "object" : isArray ? "array" : "primitive",
          key: currentKey,
          index: isArray ? 0 : -1,
        });
      }
      else {
        // Root element or other values (like a single primitive value at root)
        if (level === 0) {
          paths.push("");
          const isObject = text.startsWith("{");
          const isArray = text.startsWith("[");
          stack.push({
            type: isObject ? "object" : isArray ? "array" : "primitive",
            key: "",
            index: isArray ? 0 : -1,
          });
        }
        else {
          paths.push(pathParts.join(""));
        }
      }
    }
  }

  return paths;
}

function getParentPath(path: string): string {
  if (!path) return "";
  const arrayMatch = path.match(/^(.*)\[\d+\]$/);
  if (arrayMatch) return arrayMatch[1];
  const lastDot = path.lastIndexOf(".");
  if (lastDot !== -1) return path.slice(0, lastDot);
  return "";
}

function shouldCombineLines(
  left: DiffResult[],
  right: DiffResult[],
  leftPaths: string[],
  rightPaths: string[],
  blockStart: number,
  currIndex: number,
  mode: ReviewGroupingMode,
): boolean {
  if (mode === "block") {
    return true;
  }
  if (mode === "line") {
    return false;
  }

  // mode === "semantic"
  const startPath = leftPaths[blockStart] || rightPaths[blockStart] || "";
  const currPath = leftPaths[currIndex] || rightPaths[currIndex] || "";

  // 1. Exact same non-empty path
  if (startPath !== "" && currPath !== "" && startPath === currPath) {
    return true;
  }

  // Check if operations from blockStart to currIndex are uniform (all add or all remove)
  let allAdd = true;
  let allRemove = true;
  for (let k = blockStart; k <= currIndex; k++) {
    if (left[k].type !== "equal" || right[k].type !== "add") allAdd = false;
    if (right[k].type !== "equal" || left[k].type !== "remove") allRemove = false;
  }

  // 2. Hierarchical child under blockStart path (e.g. inserting/deleting whole object/array)
  if (allAdd || allRemove) {
    if (startPath !== "" && (currPath.startsWith(`${startPath}.`) || currPath.startsWith(`${startPath}[`))) {
      return true;
    }
    const startLevel = left[blockStart].level ?? right[blockStart].level ?? 0;
    const currLevel = left[currIndex].level ?? right[currIndex].level ?? 0;
    if (currLevel > startLevel) {
      return true;
    }
    // Same parent array (e.g. adding multiple array items)
    const parentStart = getParentPath(startPath);
    const parentCurr = getParentPath(currPath);
    if (parentStart !== "" && parentStart === parentCurr) {
      return true;
    }
  }

  return false;
}

export function getChangeBlocks(
  left: DiffResult[],
  right: DiffResult[],
  leftPaths: string[],
  rightPaths: string[],
  groupingMode: ReviewGroupingMode = "semantic",
): ChangeBlock[] {
  const blocks: ChangeBlock[] = [];
  let currentBlock: { startIndex: number; endIndex: number } | null = null;

  for (let i = 0; i < left.length; i++) {
    const isChange = left[i].type !== "equal" || right[i].type !== "equal";
    if (isChange) {
      if (!currentBlock) {
        currentBlock = {
          startIndex: i,
          endIndex: i,
        };
      }
      else {
        if (shouldCombineLines(left, right, leftPaths, rightPaths, currentBlock.startIndex, i, groupingMode)) {
          currentBlock.endIndex = i;
        }
        else {
          blocks.push({
            id: `change_${blocks.length}`,
            type: "modify",
            startIndex: currentBlock.startIndex,
            endIndex: currentBlock.endIndex,
            path: "",
            leftLines: [],
            rightLines: [],
          });
          currentBlock = {
            startIndex: i,
            endIndex: i,
          };
        }
      }
    }
    else {
      if (currentBlock) {
        blocks.push({
          id: `change_${blocks.length}`,
          type: "modify", // will refine below
          startIndex: currentBlock.startIndex,
          endIndex: currentBlock.endIndex,
          path: "", // will compute below
          leftLines: [],
          rightLines: [],
        });
        currentBlock = null;
      }
    }
  }
  if (currentBlock) {
    blocks.push({
      id: `change_${blocks.length}`,
      type: "modify", // will refine below
      startIndex: currentBlock.startIndex,
      endIndex: currentBlock.endIndex,
      path: "",
      leftLines: [],
      rightLines: [],
    });
  }

  // Refine each block
  blocks.forEach((block) => {
    let allAdd = true;
    let allRemove = true;

    const leftLines: DiffRow[] = [];
    const rightLines: DiffRow[] = [];

    for (let i = block.startIndex; i <= block.endIndex; i++) {
      leftLines.push({ ...left[i], originalIndex: i } as DiffRow);
      rightLines.push({ ...right[i], originalIndex: i } as DiffRow);

      if (left[i].type !== "equal" || right[i].type !== "add") {
        allAdd = false;
      }
      if (right[i].type !== "equal" || left[i].type !== "remove") {
        allRemove = false;
      }
    }

    block.leftLines = leftLines;
    block.rightLines = rightLines;

    if (allAdd) {
      block.type = "add";
    }
    else if (allRemove) {
      block.type = "remove";
    }
    else {
      block.type = "modify";
    }

    // Find the path of the change.
    // We prefer the first non-empty path from leftPaths or rightPaths in this block.
    let blockPath = "";
    for (let i = block.startIndex; i <= block.endIndex; i++) {
      const p = leftPaths[i] || rightPaths[i];
      if (p) {
        blockPath = p;
        break;
      }
    }
    block.path = blockPath;
  });

  return blocks;
}

export function generateMergedJson(
  left: DiffResult[],
  right: DiffResult[],
  blocks: ChangeBlock[],
  reviewStates: Record<string, "accepted" | "rejected" | "pending">,
): any {
  const mergedLines: DiffResult[] = [];
  const lineToBlockMap: (ChangeBlock | undefined)[] = new Array(left.length);

  for (const block of blocks) {
    for (let i = block.startIndex; i <= block.endIndex; i++) {
      lineToBlockMap[i] = block;
    }
  }

  for (let i = 0; i < left.length; i++) {
    const block = lineToBlockMap[i];
    if (!block) {
      mergedLines.push(left[i]);
    }
    else {
      const state = reviewStates[block.id] || "pending";
      if (state === "accepted") {
        mergedLines.push(right[i]);
      }
      else {
        mergedLines.push(left[i]);
      }
    }
  }

  // Filter out empty placeholder lines and build raw text lines (stripped of trailing commas)
  const lines = mergedLines
    .map(line => ({
      text: line.text ? line.text.trim() : "",
      level: line.level,
    }))
    .filter(line => line.text !== "");

  const indentChar = " ";
  const indentSize = 5;
  const formattedLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const current = lines[i];
    const next = lines[i + 1];

    let text = current.text;
    // Strip trailing comma if it has one
    if (text.endsWith(",")) {
      text = text.slice(0, -1);
    }

    let needsComma = false;
    if (next) {
      const nextText = next.text;

      const isCurrentOpen = text.endsWith("{") || text.endsWith("[");
      const isNextClose = nextText.startsWith("}") || nextText.startsWith("]");

      if (!isCurrentOpen && !isNextClose) {
        needsComma = true;
      }
    }

    const indent = indentChar.repeat(current.level * indentSize);
    formattedLines.push(indent + text + (needsComma ? "," : ""));
  }

  const jsonStr = formattedLines.join("\n");
  if (!jsonStr.trim())
    return {};

  try {
    return JSON.parse(jsonStr);
  }
  catch (e) {
    console.warn("Failed to parse merged JSON string:", jsonStr, e);
    return null;
  }
}
