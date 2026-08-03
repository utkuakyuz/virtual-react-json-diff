import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DiffResult } from "json-diff-kit";
import type { ChangeBlock, ReviewGroupingMode, SegmentItem } from "../types";
import { computePaths, generateMergedJson, getChangeBlocks } from "../utils/pathAndChangeUtils";
import { expandSegment, hideAllSegments } from "../utils/json-diff/segment-util";

export interface UseReviewModeProps {
  rawLeftDiff: DiffResult[];
  rawRightDiff: DiffResult[];
  oldValue: any;
  newValue: any;
  reviewMode?: boolean;
  reviewGroupingMode?: ReviewGroupingMode;
  onAcceptChange?: (change: ChangeBlock) => void;
  onRejectChange?: (change: ChangeBlock) => void;
  onReviewChange?: (state: { reviewStates: Record<string, "accepted" | "rejected" | "pending">; mergedJson: any }) => void;
  scrollToRawIndex: (index: number) => void;
  segments: SegmentItem[];
  setSegments: React.Dispatch<React.SetStateAction<SegmentItem[]>>;
}

export function useReviewMode({
  rawLeftDiff,
  rawRightDiff,
  oldValue,
  newValue,
  reviewMode,
  reviewGroupingMode = "semantic",
  onAcceptChange,
  onRejectChange,
  onReviewChange,
  scrollToRawIndex,
  segments,
  setSegments,
}: UseReviewModeProps) {
  // Compute paths for each line
  const leftPaths = useMemo(() => computePaths(rawLeftDiff), [rawLeftDiff]);
  const rightPaths = useMemo(() => computePaths(rawRightDiff), [rawRightDiff]);

  // Group change blocks
  const changeBlocks = useMemo(() => {
    return getChangeBlocks(rawLeftDiff, rawRightDiff, leftPaths, rightPaths, reviewGroupingMode);
  }, [rawLeftDiff, rawRightDiff, leftPaths, rightPaths, reviewGroupingMode]);

  // Review states state
  const [reviewStates, setReviewStates] = useState<Record<string, "accepted" | "rejected" | "pending">>({});
  const reviewStatesRef = useRef(reviewStates);
  const changeBlocksRef = useRef(changeBlocks);
  const rawLeftDiffRef = useRef(rawLeftDiff);
  const rawRightDiffRef = useRef(rawRightDiff);
  
  // Keep refs up-to-date
  useEffect(() => {
    reviewStatesRef.current = reviewStates;
    changeBlocksRef.current = changeBlocks;
    rawLeftDiffRef.current = rawLeftDiff;
    rawRightDiffRef.current = rawRightDiff;
  }, [reviewStates, changeBlocks, rawLeftDiff, rawRightDiff]);

  const onReviewChangeRef = useRef(onReviewChange);
  useEffect(() => {
    onReviewChangeRef.current = onReviewChange;
  }, [onReviewChange]);

  // Reset reviewStates if inputs change
  useEffect(() => {
    setReviewStates({});
  }, [oldValue, newValue]);

  // Active change block index for navigation
  const [activeChangeIndex, setActiveChangeIndex] = useState<number>(-1);
  const activeChangeIndexRef = useRef(activeChangeIndex);

  const setActiveChange = useCallback((index: number) => {
    activeChangeIndexRef.current = index;
    setActiveChangeIndex(index);
  }, []);

  const handleAccept = useCallback((changeId: string) => {
    setReviewStates((prev) => {
      const next = { ...prev, [changeId]: "accepted" as const };
      const block = changeBlocksRef.current.find(b => b.id === changeId);
      if (block && onAcceptChange) {
        onAcceptChange(block);
      }
      return next;
    });
  }, [onAcceptChange]);

  const handleReject = useCallback((changeId: string) => {
    setReviewStates((prev) => {
      const next = { ...prev, [changeId]: "rejected" as const };
      const block = changeBlocksRef.current.find(b => b.id === changeId);
      if (block && onRejectChange) {
        onRejectChange(block);
      }
      return next;
    });
  }, [onRejectChange]);

  // Notify when review decisions or mode change
  useEffect(() => {
    if (!reviewMode || !onReviewChangeRef.current) return;

    const blocks = changeBlocksRef.current;
    const fullStates: Record<string, "accepted" | "rejected" | "pending"> = {};
    blocks.forEach((b) => {
      fullStates[b.id] = reviewStates[b.id] || "pending";
    });

    const mergedJson = generateMergedJson(
      rawLeftDiffRef.current,
      rawRightDiffRef.current,
      blocks,
      reviewStates,
    );
    onReviewChangeRef.current({
      reviewStates: fullStates,
      mergedJson,
    });
  }, [reviewStates, reviewMode]);

  const nextChange = useCallback((): ChangeBlock | null => {
    if (changeBlocks.length === 0) return null;
    const nextIdx = Math.min(activeChangeIndexRef.current + 1, changeBlocks.length - 1);
    setActiveChange(nextIdx);
    const change = changeBlocks[nextIdx];
    if (change) {
      scrollToRawIndex(change.startIndex);
      return change;
    }
    return null;
  }, [changeBlocks, scrollToRawIndex, setActiveChange]);

  const previousChange = useCallback((): ChangeBlock | null => {
    if (changeBlocks.length === 0) return null;
    const prevIdx = Math.max(activeChangeIndexRef.current - 1, 0);
    setActiveChange(prevIdx);
    const change = changeBlocks[prevIdx];
    if (change) {
      scrollToRawIndex(change.startIndex);
      return change;
    }
    return null;
  }, [changeBlocks, scrollToRawIndex, setActiveChange]);

  const scrollToChange = useCallback((index: number) => {
    if (index >= 0 && index < changeBlocks.length) {
      setActiveChange(index);
      scrollToRawIndex(changeBlocks[index].startIndex);
    }
  }, [changeBlocks, scrollToRawIndex, setActiveChange]);

  const scrollToPath = useCallback((path: string): boolean => {
    const rawIndex = leftPaths.includes(path) ? leftPaths.indexOf(path) : rightPaths.indexOf(path);
    if (rawIndex !== -1) {
      const changeIdx = changeBlocks.findIndex(b => rawIndex >= b.startIndex && rawIndex <= b.endIndex);
      if (changeIdx !== -1) {
        setActiveChange(changeIdx);
      }
      scrollToRawIndex(rawIndex);
      return true;
    }
    return false;
  }, [leftPaths, rightPaths, changeBlocks, scrollToRawIndex, setActiveChange]);

  const expandPath = useCallback((path: string): boolean => {
    const rawIndex = leftPaths.includes(path) ? leftPaths.indexOf(path) : rightPaths.indexOf(path);
    if (rawIndex !== -1) {
      let collapsedSegIdx = -1;
      for (let s = 0; s < segments.length; s++) {
        const seg = segments[s];
        if (seg.isEqual && !seg.isExpanded && rawIndex >= seg.start && rawIndex < seg.end) {
          collapsedSegIdx = s;
          break;
        }
      }
      if (collapsedSegIdx !== -1) {
        setSegments(prev => expandSegment(prev, collapsedSegIdx));
        return true;
      }
    }
    return false;
  }, [leftPaths, rightPaths, segments, setSegments]);

  const collapsePath = useCallback((path: string): boolean => {
    const rawIndex = leftPaths.includes(path) ? leftPaths.indexOf(path) : rightPaths.indexOf(path);
    if (rawIndex !== -1) {
      let expandedSegIdx = -1;
      for (let s = 0; s < segments.length; s++) {
        const seg = segments[s];
        if (seg.isEqual && seg.isExpanded && rawIndex >= (seg.originalStart ?? seg.start) && rawIndex < (seg.originalEnd ?? seg.end)) {
          expandedSegIdx = s;
          break;
        }
      }
      if (expandedSegIdx !== -1) {
        setSegments(prev => prev.map((seg, idx) => idx === expandedSegIdx ? { ...seg, isExpanded: false, start: seg.originalStart ?? seg.start, end: seg.originalEnd ?? seg.end } : seg));
        return true;
      }
    }
    return false;
  }, [leftPaths, rightPaths, segments, setSegments]);

  const expandAll = useCallback(() => {
    setSegments(prev => prev.map(seg => seg.isEqual ? { ...seg, isExpanded: true, originalStart: seg.originalStart ?? seg.start, originalEnd: seg.originalEnd ?? seg.end } : seg));
  }, [setSegments]);

  const collapseAll = useCallback(() => {
    setSegments(prev => hideAllSegments(prev));
  }, [setSegments]);

  const getCurrentChange = useCallback((): ChangeBlock | null => {
    return changeBlocks[activeChangeIndexRef.current] || null;
  }, [changeBlocks]);

  const acceptAll = useCallback(() => {
    setReviewStates(() => {
      const next: Record<string, "accepted"> = {};
      changeBlocks.forEach((b) => {
        next[b.id] = "accepted";
        if (onAcceptChange) {
          onAcceptChange(b);
        }
      });
      return next;
    });
  }, [changeBlocks, onAcceptChange]);

  const rejectAll = useCallback(() => {
    setReviewStates(() => {
      const next: Record<string, "rejected"> = {};
      changeBlocks.forEach((b) => {
        next[b.id] = "rejected";
        if (onRejectChange) {
          onRejectChange(b);
        }
      });
      return next;
    });
  }, [changeBlocks, onRejectChange]);

  return {
    reviewStates,
    changeBlocks,
    activeChangeIndex,
    handleAccept,
    handleReject,
    nextChange,
    previousChange,
    scrollToChange,
    scrollToPath,
    expandPath,
    collapsePath,
    expandAll,
    collapseAll,
    getCurrentChange,
    acceptAll,
    rejectAll,
  };
}
