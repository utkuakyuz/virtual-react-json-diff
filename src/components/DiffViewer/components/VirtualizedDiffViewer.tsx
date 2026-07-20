import type { DiffResult } from "json-diff-kit";
import type { VariableSizeList as List } from "react-window";

import { Differ } from "json-diff-kit";
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";

import type { ChangeBlock, DiffRowOrCollapsed, LineCountStats, ObjectCountStats, SegmentItem, VirtualDiffViewerRef, VirtualizedDiffViewerProps } from "../types";

import "../styles/JsonDiffCustomTheme.css";
import { useSearch } from "../hooks/useSearch";
import { isCollapsed } from "../utils/constants";
import { preprocessObjectForDiff } from "../utils/diffComparisonOptions";
import { fastHash } from "../utils/json-diff/diff-hash";
import { expandSegment, hasExpandedSegments, hideAllSegments } from "../utils/json-diff/segment-util";
import { calculateLineCountStats } from "../utils/lineCountUtils";
import { calculateObjectCountStats } from "../utils/objectCountUtils";
import { computePaths, generateMergedJson, getChangeBlocks } from "../utils/pathAndChangeUtils";
import { buildViewFromSegments, generateSegments } from "../utils/preprocessDiff";
import { DiffMinimap } from "./DiffMinimap";
import LineCountDisplay from "./LineCountDisplay";
import ObjectCountDisplay from "./ObjectCountDisplay";
import SearchboxHolder from "./SearchboxHolder";
import VirtualDiffGrid from "./VirtualDiffGrid";

export const VirtualizedDiffViewer = forwardRef<VirtualDiffViewerRef, VirtualizedDiffViewerProps>(({
  oldValue,
  newValue,
  height,
  searchTerm,
  leftTitle,
  rightTitle,
  hideSearch,
  customDiffer,
  getDiffData,
  showSingleMinimap,
  onSearchMatch,
  differOptions,
  className,
  miniMapWidth,
  inlineDiffOptions,
  overScanCount,
  showLineCount = false,
  showObjectCountStats = false,
  comparisonOptions,

  // Review mode props
  reviewMode = false,
  onAcceptChange,
  onRejectChange,
  onReviewChange,
  reviewClassNames,
}, ref) => {
  const listRef = useRef<List | null>(null);
  const getDiffDataRef = useRef<typeof getDiffData | null>(null);
  const lastSent = useRef<number | null>(null);
  const viewerRef = useRef<HTMLDivElement | null>(null);
  const listContainerRef = useRef<HTMLDivElement | null>(null);

  const differ = customDiffer ?? useMemo(
    () =>
      new Differ({
        detectCircular: true,
        maxDepth: 20,
        showModifications: true,
        arrayDiffMethod: "lcs",
        preserveKeyOrder: "before",
        ...differOptions,
      }),
    [differOptions],
  );

  const diffData = useMemo(() => {
    if (!oldValue || !newValue)
      return [[], []];

    // Apply comparison options if provided
    const processedOld = comparisonOptions
      ? preprocessObjectForDiff(oldValue, comparisonOptions)
      : oldValue;
    const processedNew = comparisonOptions
      ? preprocessObjectForDiff(newValue, comparisonOptions)
      : newValue;

    return differ.diff(processedOld, processedNew);
  }, [oldValue, newValue, differ, comparisonOptions]);

  const lineCountStats = useMemo((): LineCountStats => {
    if (!diffData || (diffData[0].length === 0 && diffData[1].length === 0)) {
      return { added: 0, removed: 0, modified: 0, total: 0 };
    }
    return calculateLineCountStats(diffData as [DiffResult[], DiffResult[]]);
  }, [diffData]);

  const objectCountStats = useMemo((): ObjectCountStats => {
    // Only calculate object counts when using compare-key method
    if (!differOptions?.arrayDiffMethod || differOptions.arrayDiffMethod !== "compare-key" || !differOptions.compareKey) {
      return { added: 0, removed: 0, modified: 0, total: 0 };
    }

    try {
      return calculateObjectCountStats(oldValue, newValue, differOptions.compareKey);
    }
    catch (error) {
      console.warn("Error calculating object count stats:", error);
      return { added: 0, removed: 0, modified: 0, total: 0 };
    }
  }, [oldValue, newValue, differOptions]);

  const [scrollTop, setScrollTop] = useState(0);
  const [segments, setSegments] = useState<SegmentItem[]>([]);
  const [rawLeftDiff, rawRightDiff] = diffData;
  const [leftView, setLeftView] = useState<DiffRowOrCollapsed[]>([]);
  const [rightView, setRightView] = useState<DiffRowOrCollapsed[]>([]);

  useEffect(() => {
    const generatedSegments = generateSegments(rawLeftDiff);
    setSegments(generatedSegments);
  }, [rawLeftDiff]);

  const { searchState, handleSearch, navigateMatch } = useSearch(
    leftView,
    searchTerm,
    (idx) => {
      listRef.current?.scrollToItem(idx, "center");
      onSearchMatch?.(idx);
    },
    viewerRef,
    listContainerRef,
  );

  const handleExpand = useCallback(
    (index: number) => setSegments(prev => expandSegment(prev, index)),
    [],
  );

  const hideAll = useCallback(
    () => setSegments(prev => hideAllSegments(prev)),
    [],
  );

  const hasExpanded = useMemo(() => hasExpandedSegments(segments), [segments]);

  const minimapProps = {
    leftDiff: leftView,
    rightDiff: rightView,
    height,
    miniMapWidth,
    currentScrollTop: scrollTop,
    searchResults: searchState.results,
    currentMatchIndex: searchState.currentIndex,
    onScroll: (scrollTop: number) => listRef.current?.scrollTo(scrollTop),
  };

  useEffect(() => {
    const leftBuilt = buildViewFromSegments(segments, rawLeftDiff);
    const rightBuilt = buildViewFromSegments(segments, rawRightDiff);
    setLeftView(leftBuilt);
    setRightView(rightBuilt);
  }, [segments, rawLeftDiff, rawRightDiff]);

  useEffect(() => {
    getDiffDataRef.current = getDiffData;
  }, [getDiffData]);

  useEffect(() => {
    if (!getDiffDataRef.current)
      return;

    const data: [DiffResult[], DiffResult[]] = [rawLeftDiff, rawRightDiff];
    const hash = fastHash(data);

    if (lastSent.current !== hash) {
      lastSent.current = hash;
      getDiffDataRef.current(data);
    }
  }, [rawLeftDiff, rawRightDiff]);

  // --- REVIEW MODE & NAVIGATION API LOGIC ---

  // Compute paths for each line
  const leftPaths = useMemo(() => computePaths(rawLeftDiff), [rawLeftDiff]);
  const rightPaths = useMemo(() => computePaths(rawRightDiff), [rawRightDiff]);

  // Group change blocks
  const changeBlocks = useMemo(() => {
    return getChangeBlocks(rawLeftDiff, rawRightDiff, leftPaths, rightPaths);
  }, [rawLeftDiff, rawRightDiff, leftPaths, rightPaths]);

  // Review states state
  const [reviewStates, setReviewStates] = useState<Record<string, "accepted" | "rejected" | "pending">>({});
  const reviewStatesRef = useRef(reviewStates);
  const changeBlocksRef = useRef(changeBlocks);
  const rawLeftDiffRef = useRef(rawLeftDiff);
  const rawRightDiffRef = useRef(rawRightDiff);
  reviewStatesRef.current = reviewStates;
  changeBlocksRef.current = changeBlocks;
  rawLeftDiffRef.current = rawLeftDiff;
  rawRightDiffRef.current = rawRightDiff;

  const onReviewChangeRef = useRef(onReviewChange);
  onReviewChangeRef.current = onReviewChange;

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

  // Only re-notify when review decisions or mode change — not when diff array
  // identities churn (common when parents pass unstable differOptions objects).
  useEffect(() => {
    if (!reviewMode || !onReviewChangeRef.current)
      return;

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

  const scrollTargetIndex = useRef<number | null>(null);

  const scrollToRawIndex = useCallback((rawIndex: number) => {
    // Check if the raw index is inside a collapsed segment
    let collapsedSegIdx = -1;
    for (let s = 0; s < segments.length; s++) {
      const seg = segments[s];
      if (seg.isEqual && !seg.isExpanded && rawIndex >= seg.start && rawIndex < seg.end) {
        collapsedSegIdx = s;
        break;
      }
    }

    if (collapsedSegIdx !== -1) {
      // It's collapsed! Expand it first, and store the raw index to scroll after rendering
      scrollTargetIndex.current = rawIndex;
      setSegments(prev => expandSegment(prev, collapsedSegIdx));
    }
    else {
      // It is already visible! Find it in leftView
      const builtIndex = leftView.findIndex(line => !isCollapsed(line) && line.originalIndex === rawIndex);
      if (builtIndex !== -1) {
        listRef.current?.scrollToItem(builtIndex, "center");
      }
    }
  }, [segments, leftView]);

  // Re-scroll when view is updated (because segments expanded)
  useEffect(() => {
    if (scrollTargetIndex.current !== null) {
      const target = scrollTargetIndex.current;
      const builtIndex = leftView.findIndex(line => !isCollapsed(line) && line.originalIndex === target);
      if (builtIndex !== -1) {
        listRef.current?.scrollToItem(builtIndex, "center");
        scrollTargetIndex.current = null;
      }
    }
  }, [leftView]);

  const nextChange = useCallback((): ChangeBlock | null => {
    if (changeBlocks.length === 0)
      return null;
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
    if (changeBlocks.length === 0)
      return null;
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
  }, [leftPaths, rightPaths, segments]);

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
  }, [leftPaths, rightPaths, segments]);

  const expandAll = useCallback(() => {
    setSegments(prev => prev.map(seg => seg.isEqual ? { ...seg, isExpanded: true, originalStart: seg.originalStart ?? seg.start, originalEnd: seg.originalEnd ?? seg.end } : seg));
  }, []);

  const collapseAll = useCallback(() => {
    setSegments(prev => hideAllSegments(prev));
  }, []);

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

  useImperativeHandle(ref, () => ({
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
  }), [
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
  ]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "j") {
      e.preventDefault();
      nextChange();
    }
    else if (e.key === "ArrowUp" || e.key === "k") {
      e.preventDefault();
      previousChange();
    }
    else if (reviewMode) {
      if (e.key === "Enter" || e.key === "a") {
        e.preventDefault();
        const current = getCurrentChange();
        if (current) {
          handleAccept(current.id);
        }
      }
      else if (e.key === "Escape" || e.key === "r") {
        e.preventDefault();
        const current = getCurrentChange();
        if (current) {
          handleReject(current.id);
        }
      }
    }
  }, [nextChange, previousChange, reviewMode, handleAccept, handleReject, getCurrentChange]);

  return (
    <div
      className={`diff-viewer-container${className ? ` ${className}` : ""}`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      style={{ outline: "none" }}
    >

      {/* Header & Search */}
      <div className="json-diff-header">
        <SearchboxHolder handleSearch={handleSearch} navigateMatch={navigateMatch} searchState={searchState} hideSearch={hideSearch} />

        <div className="json-diff-title-container">
          <div><span>{leftTitle}</span></div>
          <div><span>{rightTitle}</span></div>
        </div>
        {showLineCount && (
          <LineCountDisplay stats={lineCountStats} />
        )}
        {showObjectCountStats && differOptions?.arrayDiffMethod === "compare-key" && differOptions?.compareKey && (
          <ObjectCountDisplay stats={objectCountStats} />
        )}
      </div>

      {/* List & Minimap */}
      <div style={{ display: "flex", gap: "8px", position: "relative" }}>
        <VirtualDiffGrid
          listRef={listRef}
          leftDiff={leftView}
          rightDiff={rightView}
          height={height}
          overScanCount={overScanCount}
          setScrollTop={setScrollTop}
          onExpand={handleExpand}
          className="virtual-json-diff-list-container"
          inlineDiffOptions={inlineDiffOptions}
          viewerRef={viewerRef}
          listContainerRef={listContainerRef}
          reviewMode={reviewMode}
          reviewStates={reviewStates}
          changeBlocks={changeBlocks}
          activeChangeIndex={activeChangeIndex}
          onAccept={handleAccept}
          onReject={handleReject}
          reviewClassNames={reviewClassNames}
        />

        <div className={`minimap-overlay${reviewMode ? " review-mode" : ""}`}>
          <div className="half left-map-holder">
            {!showSingleMinimap && (
              <DiffMinimap {...minimapProps} />

            )}
          </div>
          <div className="half right-map-holder">
            <DiffMinimap {...minimapProps} />
          </div>
        </div>
      </div>

      {/* Hide All Expanded Lines Button */}
      {hasExpanded && (
        <div className="hide-all-button">
          <button onClick={hideAll}>Hide All Expanded Lines</button>
        </div>
      )}
    </div>
  );
});

export default VirtualizedDiffViewer;
