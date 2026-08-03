/// <reference types="bun" />

import { describe, expect, test } from "bun:test";
import { Differ } from "json-diff-kit";

import { computePaths, generateMergedJson, getChangeBlocks } from "../pathAndChangeUtils";

function buildDiff(oldValue: object, newValue: object) {
  const differ = new Differ({
    detectCircular: true,
    maxDepth: 999,
    showModifications: true,
    arrayDiffMethod: "lcs",
  });
  return differ.diff(oldValue, newValue) as [ReturnType<Differ["diff"]>[0], ReturnType<Differ["diff"]>[1]];
}

describe("pathAndChangeUtils", () => {
  test("getChangeBlocks groups consecutive non-equal lines", () => {
    const [left, right] = buildDiff(
      { name: "Alice", age: 25 },
      { name: "Alice", age: 26, city: "NYC" },
    );
    const leftPaths = computePaths(left);
    const rightPaths = computePaths(right);
    const blocks = getChangeBlocks(left, right, leftPaths, rightPaths);

    expect(blocks.length).toBeGreaterThan(0);
    for (const block of blocks) {
      expect(block.id).toMatch(/^change_\d+$/);
      expect(block.startIndex).toBeLessThanOrEqual(block.endIndex);
      expect(["add", "remove", "modify"]).toContain(block.type);
    }
  });

  test("generateMergedJson pending/rejected keeps left, accepted takes right", () => {
    const oldValue = { name: "Alice", age: 25 };
    const newValue = { name: "Alice", age: 26 };
    const [left, right] = buildDiff(oldValue, newValue);
    const leftPaths = computePaths(left);
    const rightPaths = computePaths(right);
    const blocks = getChangeBlocks(left, right, leftPaths, rightPaths);

    expect(blocks.length).toBeGreaterThan(0);

    const pending = generateMergedJson(left, right, blocks, {});
    expect(pending).toEqual(oldValue);

    const rejectedStates = Object.fromEntries(blocks.map(b => [b.id, "rejected" as const]));
    const rejected = generateMergedJson(left, right, blocks, rejectedStates);
    expect(rejected).toEqual(oldValue);

    const acceptedStates = Object.fromEntries(blocks.map(b => [b.id, "accepted" as const]));
    const accepted = generateMergedJson(left, right, blocks, acceptedStates);
    expect(accepted).toEqual(newValue);
  });

  test("generateMergedJson handles additions with valid JSON", () => {
    const oldValue = { a: 1 };
    const newValue = { a: 1, b: 2 };
    const [left, right] = buildDiff(oldValue, newValue);
    const blocks = getChangeBlocks(left, right, computePaths(left), computePaths(right));

    const acceptedStates = Object.fromEntries(blocks.map(b => [b.id, "accepted" as const]));
    const merged = generateMergedJson(left, right, blocks, acceptedStates);
    expect(merged).toEqual(newValue);

    const pending = generateMergedJson(left, right, blocks, {});
    expect(pending).toEqual(oldValue);
  });

  test("getChangeBlocks respects semantic, line, and block ReviewGroupingMode", () => {
    const oldValue = {
      categoryType: "Electronics",
      label: "Smartphone X100",
    };
    const newValue = {
      label: "Smartphone X200 Pro",
    };
    const [left, right] = buildDiff(oldValue, newValue);
    const leftPaths = computePaths(left);
    const rightPaths = computePaths(right);

    // 1. Semantic mode (default) -> categoryType (delete) and label (modify) should be 2 separate blocks!
    const semanticBlocks = getChangeBlocks(left, right, leftPaths, rightPaths, "semantic");
    expect(semanticBlocks.length).toBe(2);

    // 2. Block mode -> should group into 1 single block
    const hunkBlocks = getChangeBlocks(left, right, leftPaths, rightPaths, "block");
    expect(hunkBlocks.length).toBe(1);

    // 3. Line mode -> 2 separate line blocks
    const lineBlocks = getChangeBlocks(left, right, leftPaths, rightPaths, "line");
    expect(lineBlocks.length).toBe(2);
  });
});
