import type { ListOnScrollProps } from "react-window";

import { Differ } from "json-diff-kit";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { VariableSizeList as List } from "react-window";

import type { DiffRowOrCollapsed, SegmentItem, VirtualizedDiffViewerProps } from "../types";

import { SearchIcon } from "../../SearchIcon";
import "../styles/JsonDiffCustomTheme.css";
import { useRowHeights } from "../hooks/useRowHeights";
import { useSearch } from "../hooks/useSearch";
import { COLLAPSED_ROW_HEIGHT, getRowHeightFromCSS, isCollapsed } from "../utils/constants";
import { buildViewFromSegments, generateSegments } from "../utils/preprocessDiff";
import { DiffMinimap } from "./DiffMinimap";
import ViewerRow from "./ViewerRow";

export const VirtualizedDiffViewer: React.FC<VirtualizedDiffViewerProps> = ({
  oldValue,
  newValue,
  height,
  searchTerm,
  leftTitle,
  rightTitle,
  hideSearch,
  showSingleMinimap,
  onSearchMatch,
  differOptions,
  className,
  miniMapWidth,
  inlineDiffOptions,
}) => {
  const listRef = useRef<List>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const [segments, setSegments] = useState<SegmentItem[]>([]);

  const ROW_HEIGHT = useMemo(() => getRowHeightFromCSS(), []);

  const differ = useMemo(
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

  const [rawLeftDiff, rawRightDiff] = diffData;
  const [leftView, setLeftView] = useState<DiffRowOrCollapsed[]>([]);
  const [rightView, setRightView] = useState<DiffRowOrCollapsed[]>([]);

  const rowHeights = useRowHeights(leftView);

  useEffect(() => {
    const generatedSegments = generateSegments(rawLeftDiff);
    setSegments(generatedSegments);
  }, [rawLeftDiff]);

  useEffect(() => {
    const leftBuilt = buildViewFromSegments(segments, rawLeftDiff);
    const rightBuilt = buildViewFromSegments(segments, rawRightDiff);
    setLeftView(leftBuilt);
    setRightView(rightBuilt);
  }, [segments, rawLeftDiff, rawRightDiff]);

  useEffect(() => {
    listRef.current?.resetAfterIndex(0);
  }, [leftView]);

  const { searchState, handleSearch, navigateMatch } = useSearch(
    leftView,
    searchTerm,
    (idx) => {
      listRef.current?.scrollToItem(idx, "center");
      onSearchMatch?.(idx);
    },
  );

  const handleExpand = useCallback((segmentIndex: number) => {
    setSegments((prev) => {
      const updated = [...prev];
      const seg = updated[segmentIndex];

      if (!seg || !seg.isEqual)
        return prev;

      const expandedSegment = {
        ...seg,
        isExpanded: true,
        originalStart: seg.start,
        originalEnd: seg.end,
        start: seg.start,
        end: seg.end,
      };

      updated[segmentIndex] = expandedSegment;

      return updated;
    });
  }, []);

  const hideAllSegments = useCallback(() => {
    setSegments((prev) => {
      return prev.map((seg) => {
        if (seg.isEqual && seg.isExpanded) {
          return {
            ...seg,
            isExpanded: false,
            start: seg.originalStart ?? seg.start,
            end: seg.originalEnd ?? seg.end,
          };
        }
        return seg;
      });
    });
  }, []);

  useEffect(() => {
    listRef.current?.resetAfterIndex(0, true);
  }, [rowHeights]);

  const getItemSize = useCallback(
    (index: number) => {
      const leftLine = leftView[index];
      if (isCollapsed(leftLine))
        return COLLAPSED_ROW_HEIGHT;
      return (rowHeights[index] ?? 1) * ROW_HEIGHT;
    },
    [leftView, rowHeights],
  );

  const hasExpandedSegments = useMemo(
    () => segments.some(seg => seg.isEqual && seg.isExpanded),
    [segments],
  );

  const listData = useMemo(
    () => ({
      leftDiff: leftView,
      rightDiff: rightView,
      onExpand: handleExpand,
      searchTerm: searchState.term,
      inlineDiffOptions,
    }),
    [leftView, rightView, handleExpand, searchState.term, inlineDiffOptions],
  );

  return (
    <div className={`diff-viewer-container${className ? ` ${className}` : ""}`}>
      {/* Header & Search */}
      <div className="json-diff-header">
        {!hideSearch && (
          <div className="search-container">
            <div className="search-input-container">
              <span role="img" aria-label="search"><SearchIcon /></span>
              <input
                type="text"
                placeholder="Search in JSON..."
                value={searchState.term}
                onChange={e => handleSearch(e.target.value)}
              />
            </div>
            {searchState.results.length > 0 && (
              <div className="search-results">
                <span>
                  {searchState.currentIndex + 1}
                  {" "}
                  of
                  {" "}
                  {searchState.results.length}
                  {" "}
                  matches
                </span>
                <button onClick={() => navigateMatch("prev")}>Previous</button>
                <button onClick={() => navigateMatch("next")}>Next</button>
              </div>
            )}
          </div>
        )}
        <div className="json-diff-title-container">
          <div><span>{leftTitle}</span></div>
          <div><span>{rightTitle}</span></div>
        </div>
      </div>

      {/* List & Minimap */}
      <div style={{ display: "flex", gap: "8px", position: "relative" }}>
        <List
          ref={listRef}
          className="virtual-json-diff-list-container"
          height={height}
          itemCount={Math.max(leftView.length, rightView.length)}
          itemSize={getItemSize}
          overscanCount={28}
          width="100%"
          itemData={listData}
          onScroll={({ scrollOffset }: ListOnScrollProps) => setScrollTop(scrollOffset)}
        >
          {ViewerRow}
        </List>

        <div className="minimap-overlay">
          <div className="half left-map-holder">
            {!showSingleMinimap && (
              <DiffMinimap
                leftDiff={leftView}
                rightDiff={rightView}
                height={height}
                miniMapWidth={miniMapWidth}
                currentScrollTop={scrollTop}
                searchResults={searchState.results}
                currentMatchIndex={searchState.currentIndex}
                onScroll={scrollTop => listRef.current?.scrollTo(scrollTop)}
              />
            )}
          </div>
          <div className="half right-map-holder">
            <DiffMinimap
              leftDiff={leftView}
              rightDiff={rightView}
              height={height}
              miniMapWidth={miniMapWidth}
              currentScrollTop={scrollTop}
              searchResults={searchState.results}
              currentMatchIndex={searchState.currentIndex}
              onScroll={scrollTop => listRef.current?.scrollTo(scrollTop)}
            />
          </div>
        </div>
      </div>

      {/* Hide All Expanded Lines Button */}
      {hasExpandedSegments && (
        <div className="hide-all-button">
          <button onClick={hideAllSegments}>Hide All Expanded Lines</button>
        </div>
      )}
    </div>
  );
};

export default VirtualizedDiffViewer;
