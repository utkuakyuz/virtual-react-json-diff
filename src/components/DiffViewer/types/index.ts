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

export type DiffTheme = "default" | "github-dark" | "github-light" | "nord" | "tokyo-night" | "solarized-light";

export type ReviewState = "accepted" | "rejected" | "pending";

export type ReviewGroupingMode = "semantic" | "line" | "block";

export type ChangeBlock = {
  id: string;
  type: "add" | "remove" | "modify";
  startIndex: number;
  endIndex: number;
  path: string;
  leftLines: DiffRow[];
  rightLines: DiffRow[];
};

export type VirtualDiffViewerRef = {
  nextChange: () => ChangeBlock | null;
  previousChange: () => ChangeBlock | null;
  scrollToChange: (index: number) => void;
  scrollToPath: (path: string) => boolean;
  expandPath: (path: string) => boolean;
  collapsePath: (path: string) => boolean;
  expandAll: () => void;
  collapseAll: () => void;
  getCurrentChange: () => ChangeBlock | null;
  acceptAll: () => void;
  rejectAll: () => void;
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
  theme?: DiffTheme;
  miniMapWidth?: number;
  inlineDiffOptions?: InlineDiffOptions;
  overScanCount?: number;
  showLineCount?: boolean;
  showObjectCountStats?: boolean;
  comparisonOptions?: DiffComparisonOptions;
  reviewMode?: boolean;
  reviewGroupingMode?: ReviewGroupingMode;
  onAcceptChange?: (change: ChangeBlock) => void;
  onRejectChange?: (change: ChangeBlock) => void;
  onReviewChange?: (reviewState: {
    reviewStates: Record<string, ReviewState>;
    mergedJson: any;
  }) => void;
  reviewClassNames?: {
    accepted?: string;
    rejected?: string;
    pending?: string;
  };
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
  theme?: DiffTheme;
};
