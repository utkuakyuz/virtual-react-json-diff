import type { Differ, DifferOptions, DiffResult, InlineDiffOptions } from "json-diff-kit";

import type { CompareStrategy, DiffComparisonOptions } from "../utils/diffComparisonOptions";

export type { CompareStrategy, DiffComparisonOptions };

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

export type LineCountStats = {
  added: number;
  removed: number;
  modified: number;
  total: number;
};

export type ObjectCountStats = {
  added: number;
  removed: number;
  modified: number;
  total: number;
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
  getDiffData?: (diffData: [DiffResult[], DiffResult[]]) => void;
  differOptions?: DifferOptions;
  customDiffer?: Differ;
  showSingleMinimap?: boolean;
  className?: string;
  miniMapWidth?: number;
  inlineDiffOptions?: InlineDiffOptions;
  overScanCount?: number;
  showLineCount?: boolean;
  showObjectCountStats?: boolean;
  comparisonOptions?: DiffComparisonOptions;
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
