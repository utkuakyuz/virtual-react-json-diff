import type { DiffResult } from "json-diff-kit";
import type { ListChildComponentProps, ListOnScrollProps } from "react-window";

import { Differ, Viewer } from "json-diff-kit";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { VariableSizeList as List } from "react-window";

import type { DiffRowOrCollapsed, SearchState, SegmentItem, VirtualizedDiffViewerProps } from "../types";

import { SearchIcon } from "../../SearchIcon";
import { highlightMatches, performSearch } from "../utils/diffSearchUtils";
import { buildViewFromSegments, generateSegments } from "../utils/preprocessDiff";
import { DiffMinimap } from "./DiffMinimap";
import "../styles/JsonDiffCustomTheme.css";

const ROW_HEIGHT = 20;
const COLLAPSED_ROW_HEIGHT = 20;
const SEARCH_DEBOUNCE_MS = 300;
const DIFF_VIEWER_CLASS = "json-diff-viewer-theme-custom";

function isCollapsed(line: any): line is { type: "collapsed"; segmentIndex: number } {
  return line && typeof line === "object" && "type" in line && line.type === "collapsed";
}

function ViewerRow({
  index,
  style,
  data,
}: ListChildComponentProps<{
  leftDiff: DiffRowOrCollapsed[];
  rightDiff: DiffRowOrCollapsed[];
  onExpand: (segmentIndex: number) => void;
  searchTerm?: string;
}>) {
  const { onExpand, searchTerm } = data;
  const originalLeftLine = data.leftDiff[index];
  const originalRightLine = data.rightDiff[index];

  if (isCollapsed(originalLeftLine)) {
    return (
      <div className="collapsed-button" style={style}>
        <button onClick={() => onExpand(originalLeftLine.segmentIndex)} className="text-blue-500 underline">
          Show Hidden Lines
        </button>
      </div>
    );
  }

  const leftLine = { ...originalLeftLine } as DiffResult;
  const rightLine = { ...originalRightLine } as DiffResult;

  return (
    <div style={style}>
      <Viewer
        indent={1}
        className={`${DIFF_VIEWER_CLASS} ${searchTerm ? "has-search" : ""}`}
        lineNumbers
        diff={[[leftLine], [rightLine]]}
        highlightInlineDiff
        inlineDiffOptions={{ mode: "word" }}
        syntaxHighlight={{ theme: "monokai" }}
      />
    </div>
  );
}

export const VirtualizedDiffViewer: React.FC<VirtualizedDiffViewerProps> = ({
  oldValue,
  newValue,
  height,
  searchTerm,
  leftTitle,
  rightTitle,
  hideSearch,
  onSearchMatch,
  differOptions,
  className,
  miniMapWidth,
}) => {
  const listRef = useRef<List>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const [scrollTop, setScrollTop] = useState(0);

  const [segments, setSegments] = useState<SegmentItem[]>([]);
  const [searchState, setSearchState] = useState<SearchState>({
    term: "",
    results: [],
    currentIndex: 0,
  });

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
    [],
  );

  const diffData = useMemo(() => {
    if (!oldValue || !newValue)
      return [[], []];
    return differ.diff(oldValue, newValue);
  }, [oldValue, newValue, differ]);

  const [rawLeftDiff, rawRightDiff] = diffData;
  const [leftView, setLeftView] = useState<DiffRowOrCollapsed[]>([]);
  const [rightView, setRightView] = useState<DiffRowOrCollapsed[]>([]);

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

  const handleSearch = useCallback(
    (term: string) => {
      setSearchState(prev => ({ ...prev, term }));

      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      searchTimeoutRef.current = setTimeout(() => {
        const results = performSearch(term, leftView);
        setSearchState(prev => ({ ...prev, results, currentIndex: 0 }));
      }, SEARCH_DEBOUNCE_MS);
    },
    [leftView],
  );

  const navigateToMatch = useCallback(
    (direction: "next" | "prev") => {
      if (searchState.results.length === 0)
        return;

      const newIndex
                = direction === "next"
                  ? (searchState.currentIndex + 1) % searchState.results.length
                  : (searchState.currentIndex - 1 + searchState.results.length) % searchState.results.length;

      setSearchState(prev => ({ ...prev, currentIndex: newIndex }));
      const matchIndex = searchState.results[newIndex];

      listRef.current?.scrollToItem(matchIndex, "center");
      if (onSearchMatch) {
        onSearchMatch(matchIndex);
      }
    },
    [searchState.results, searchState.currentIndex, onSearchMatch],
  );

  useEffect(() => {
    if (searchTerm !== undefined) {
      handleSearch(searchTerm);
    }
  }, [searchTerm, handleSearch]);

  useEffect(() => {
    highlightMatches(searchState.term, DIFF_VIEWER_CLASS);

    const observer = new MutationObserver(() => highlightMatches(searchState.term, DIFF_VIEWER_CLASS));
    const config = { childList: true, subtree: true };

    const viewer = document.querySelector(`.${DIFF_VIEWER_CLASS}`);
    if (viewer) {
      observer.observe(viewer, config);
    }

    const listContainer = document.querySelector(".virtual-json-diff-list-container");
    if (listContainer) {
      const handleScroll = () => {
        setTimeout(() => highlightMatches(searchState.term, DIFF_VIEWER_CLASS), 100);
      };

      listContainer.addEventListener("scroll", handleScroll);

      return () => {
        observer.disconnect();
        listContainer.removeEventListener("scroll", handleScroll);
      };
    }

    return () => {
      observer.disconnect();
    };
  }, [searchState.term]);

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

  const handleHideAll = useCallback(() => {
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

  const getItemSize = useCallback(
    (index: number) => {
      const leftLine = leftView[index];
      return isCollapsed(leftLine) ? COLLAPSED_ROW_HEIGHT : ROW_HEIGHT;
    },
    [leftView],
  );

  const hasExpandedSegments = useMemo(() => segments.some(seg => seg.isEqual && seg.isExpanded), [segments]);

  const listData = useMemo(
    () => ({
      leftDiff: leftView,
      rightDiff: rightView,
      onExpand: handleExpand,
      searchTerm: searchState.term,
    }),
    [leftView, rightView, handleExpand, searchState.term],
  );

  return (
    <div className={`diff-viewer-container${className ? ` ${className}` : ""}`}>
      <div className="json-diff-header">
        {!hideSearch && (
          <div className="search-container">
            <div className="search-input-container">
              <span role="img" aria-label="search">
                <SearchIcon />
              </span>
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
                  {searchState.results.length}
                  {" "}
                  matches
                </span>
                <button onClick={() => navigateToMatch("prev")}>Previous</button>
                <button onClick={() => navigateToMatch("next")}>Next</button>
              </div>
            )}
          </div>
        )}
        <div className="json-diff-title-container">
          <div>
            <span>{leftTitle}</span>
          </div>
          <div>
            <span>{rightTitle}</span>
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: "8px" }}>
        <List
          ref={listRef}
          className="virtual-json-diff-list-container"
          height={height}
          itemCount={Math.max(leftView.length, rightView.length)}
          itemSize={getItemSize}
          overscanCount={28}
          width="100%"
          itemData={listData}
          onScroll={({ scrollOffset }: ListOnScrollProps) => {
            setScrollTop(scrollOffset);
          }}
        >
          {ViewerRow}
        </List>
        <div>
          <DiffMinimap
            leftDiff={leftView}
            rightDiff={rightView}
            height={height}
            onScroll={(scrollTop) => {
              listRef.current?.scrollTo(scrollTop);
            }}
            currentScrollTop={scrollTop}
            miniMapWidth={miniMapWidth}
            searchResults={searchState.results}
            currentMatchIndex={searchState.currentIndex}
          />
        </div>
      </div>
      {hasExpandedSegments && (
        <div className="hide-all-button">
          <button onClick={handleHideAll}>Hide All Expanded Lines</button>
        </div>
      )}
    </div>
  );
};

export default VirtualizedDiffViewer;
