import type { DiffResult } from "json-diff-kit";
import type { VariableSizeList as List } from "react-window";

import { Differ } from "json-diff-kit";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { DiffRowOrCollapsed, SegmentItem, VirtualizedDiffViewerProps } from "../types";

import "../styles/JsonDiffCustomTheme.css";
import { useSearch } from "../hooks/useSearch";
import { fastHash } from "../utils/json-diff/diff-hash";
import { expandSegment, hasExpandedSegments, hideAllSegments } from "../utils/json-diff/segment-util";
import { buildViewFromSegments, generateSegments } from "../utils/preprocessDiff";
import { DiffMinimap } from "./DiffMinimap";
import SearchboxHolder from "./SearchboxHolder";
import VirtualDiffGrid from "./VirtualDiffGrid";

export const VirtualizedDiffViewer: React.FC<VirtualizedDiffViewerProps> = ({
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
}) => {
  const listRef = useRef<List>(null);
  const getDiffDataRef = useRef<typeof getDiffData>();
  const lastSent = useRef<number>();
  const viewerRef = useRef<HTMLDivElement>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);

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
    return differ.diff(oldValue, newValue);
  }, [oldValue, newValue, differ]);

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

  return (
    <div className={`diff-viewer-container${className ? ` ${className}` : ""}`}>

      {/* Header & Search */}
      <div className="json-diff-header">
        <SearchboxHolder handleSearch={handleSearch} navigateMatch={navigateMatch} searchState={searchState} hideSearch={hideSearch} />

        <div className="json-diff-title-container">
          <div><span>{leftTitle}</span></div>
          <div><span>{rightTitle}</span></div>
        </div>
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
        />

        <div className="minimap-overlay">
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
};

export default VirtualizedDiffViewer;
