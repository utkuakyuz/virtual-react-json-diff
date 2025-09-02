import type { DifferOptions, DiffResult, InlineDiffOptions } from "json-diff-kit";

export type DiffRow = {
  originalIndex: number;
} & DiffResult;

export type DiffRowOrCollapsed = DiffRow | CollapsedLine;

export type SegmentItem = {
  start: number;
  end: number;
  isEqual: boolean;
  isExpanded?: boolean;
  originalStart?: number;
  originalEnd?: number;
};

export type HiddenUnchangedLinesInfo = {
  hasLinesBefore: boolean;
  hasLinesAfter: boolean;
} & SegmentItem;
export type CollapsedLine = {
  type: "collapsed";
  segmentIndex: number;
  originalIndex: number;
  level: number;
  text: string;
};
export type SearchState = {
  term: string;
  results: number[];
  currentIndex: number;
};

export type VirtualizedDiffViewerProps = {
  oldValue: object;
  newValue: object;
  height: number;
  hideSearch?: boolean;
  searchTerm?: string;
  leftTitle?: string;
  rightTitle?: string;
  onSearchMatch?: (index: number) => void;
  differOptions?: DifferOptions;
  showSingleMinimap?: boolean;
  className?: string;
  miniMapWidth?: number;
  inlineDiffOptions?: InlineDiffOptions;
};

export type DiffMinimapProps = {
  leftDiff: DiffRowOrCollapsed[];
  rightDiff: DiffRowOrCollapsed[];
  height: number;
  onScroll: (scrollTop: number) => void;
  currentScrollTop: number;
  searchResults?: number[];
  currentMatchIndex?: number;
  miniMapWidth?: number;
};
