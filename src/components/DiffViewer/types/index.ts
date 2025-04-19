import { DiffResult, DifferOptions } from "json-diff-kit";

export interface DiffRow extends DiffResult {
    originalIndex: number;
}

export type DiffRowOrCollapsed = DiffRow | CollapsedLine;

export interface SegmentItem {
    start: number;
    end: number;
    isEqual: boolean;
    isExpanded?: boolean;
    originalStart?: number;
    originalEnd?: number;
}

export interface HiddenUnchangedLinesInfo extends SegmentItem {
    hasLinesBefore: boolean;
    hasLinesAfter: boolean;
}
export interface CollapsedLine {
    type: "collapsed";
    segmentIndex: number;
    originalIndex: number;
    level: number;
    text: string;
}
export interface SearchState {
    term: string;
    results: number[];
    currentIndex: number;
}

export interface VirtualizedDiffViewerProps {
    oldValue: object;
    newValue: object;
    height: number;
    hideSearch?: boolean;
    searchTerm?: string;
    leftTitle?: string;
    rightTitle?: string;
    onSearchMatch?: (index: number) => void;
    differOptions?: DifferOptions;
    className?: string;
}

export interface DiffMinimapProps {
    leftDiff: DiffRowOrCollapsed[];
    rightDiff: DiffRowOrCollapsed[];
    height: number;
    onScroll: (scrollTop: number) => void;
    currentScrollTop: number;
    searchResults?: number[];
    currentMatchIndex?: number;
}
