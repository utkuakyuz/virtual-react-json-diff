/*
  * THIS FILE IS PART OF THE JSON-DIFF-KIT LIBRARY.
*/

import type { InlineDiffResult } from "json-diff-kit";

import type { SegmentItem } from "../../types";
import type { InlineHighlightResult } from "./get-inline-syntax-highlight";

export type InlineRenderInfo = InlineDiffResult & InlineHighlightResult;

/**
 * Merge two segments array into one, divide the segment if necessary.
 */
export function mergeSegments(tokens: InlineHighlightResult[], diffs: InlineDiffResult[]): InlineRenderInfo[] {
  const result: InlineRenderInfo[] = [];
  let token: InlineHighlightResult;
  let diff: InlineDiffResult;

  if (tokens.length && diffs.length) {
    tokens = [...tokens];
    diffs = [...diffs];
    token = { ...tokens.shift()! };
    diff = { ...diffs.shift()! };

    while (1) {
      if (token.start === diff.start) {
        const end = Math.min(token.end, diff.end);
        result.push({ ...token, ...diff, end });
        token.start = diff.start = end;
      }
      else if (token.start < diff.start) {
        const end = Math.min(token.end, diff.start);
        result.push({ ...diff, ...token, end });
        token.start = end;
      }
      else {
        const end = Math.min(token.start, diff.end);
        result.push({ ...token, ...diff, end });
        diff.start = end;
      }
      if (!tokens.length || !diffs.length)
        break;
      if (token.start === token.end)
        token = { ...tokens.shift()! };
      if (diff.start === diff.end)
        diff = { ...diffs.shift()! };
    }
  }

  if (!tokens.length)
    result.push(...diffs.map(d => ({ ...d, token: token.token || "plain" } as InlineRenderInfo)));
  if (!diffs.length)
    result.push(...tokens);

  return result;
}

export function expandSegment(prev: SegmentItem[], index: number): SegmentItem[] {
  const updated = [...prev];
  const seg = updated[index];
  if (!seg?.isEqual)
    return prev;

  updated[index] = {
    ...seg,
    isExpanded: true,
    originalStart: seg.start,
    originalEnd: seg.end,
    start: seg.start,
    end: seg.end,
  };
  return updated;
}

export function hideAllSegments(prev: SegmentItem[]): SegmentItem[] {
  return prev.map(seg => seg.isEqual && seg.isExpanded
    ? { ...seg, isExpanded: false, start: seg.originalStart ?? seg.start, end: seg.originalEnd ?? seg.end }
    : seg,
  );
}

export function hasExpandedSegments(segments: SegmentItem[]): boolean {
  return segments.some(seg => seg.isEqual && seg.isExpanded);
}
