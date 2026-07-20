import type { InlineDiffOptions } from "json-diff-kit";
import type { Dispatch } from "react";
import type { ListOnScrollProps } from "react-window";

import React, { useCallback, useEffect, useMemo } from "react";
import { VariableSizeList as List } from "react-window";

import type { ChangeBlock, DiffRowOrCollapsed } from "../types";

import { useRowHeights } from "../hooks/useRowHeights";
import { COLLAPSED_ROW_HEIGHT, getRowHeightFromCSS, isCollapsed } from "../utils/constants";
import RowRendererGrid from "../utils/json-diff/row-renderer-grid";

type ListDataType = {
  leftDiff: DiffRowOrCollapsed[];
  rightDiff: DiffRowOrCollapsed[];
  onExpand: (segmentIndex: number) => void;
  inlineDiffOptions?: InlineDiffOptions;
  reviewMode?: boolean;
  reviewStates?: Record<string, "accepted" | "rejected" | "pending">;
  changeBlocks?: ChangeBlock[];
  activeChangeIndex?: number;
  onAccept?: (changeId: string) => void;
  onReject?: (changeId: string) => void;
  reviewClassNames?: {
    accepted?: string;
    rejected?: string;
    pending?: string;
  };
};

// @types/react-window can disagree with @types/react Component typings across versions.
const VirtualList = List as any;

type VirtualDiffGridProps = {
  leftDiff: DiffRowOrCollapsed[];
  rightDiff: DiffRowOrCollapsed[];
  listRef: React.RefObject<List<ListDataType> | null>;
  height: number;
  inlineDiffOptions?: InlineDiffOptions;
  className?: string;
  setScrollTop: Dispatch<React.SetStateAction<number>>;
  onExpand: (segmentIndex: number) => void;
  overScanCount?: number;
  viewerRef?: React.RefObject<HTMLDivElement | null>;
  listContainerRef?: React.RefObject<HTMLDivElement | null>;
  reviewMode?: boolean;
  reviewStates?: Record<string, "accepted" | "rejected" | "pending">;
  changeBlocks?: ChangeBlock[];
  activeChangeIndex?: number;
  onAccept?: (changeId: string) => void;
  onReject?: (changeId: string) => void;
  reviewClassNames?: {
    accepted?: string;
    rejected?: string;
    pending?: string;
  };
};

const VirtualDiffGrid: React.FC<VirtualDiffGridProps> = ({
  leftDiff,
  rightDiff,
  listRef,
  height,
  inlineDiffOptions,
  className,
  setScrollTop,
  onExpand,
  overScanCount = 10,
  viewerRef,
  listContainerRef,
  reviewMode,
  reviewStates,
  changeBlocks,
  activeChangeIndex,
  onAccept,
  onReject,
  reviewClassNames,
}) => {
  // Virtual List Data
  const listData = useMemo(
    () => ({
      leftDiff,
      rightDiff,
      onExpand,
      inlineDiffOptions,
      reviewMode,
      reviewStates,
      changeBlocks,
      activeChangeIndex,
      onAccept,
      onReject,
      reviewClassNames,
    }),
    [
      leftDiff,
      rightDiff,
      onExpand,
      inlineDiffOptions,
      reviewMode,
      reviewStates,
      changeBlocks,
      activeChangeIndex,
      onAccept,
      onReject,
      reviewClassNames,
    ],
  );

  const classes = [
    "json-diff-viewer",
    `json-diff-viewer-theme-custom`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  // ROW HEIGHT CALCULATION
  const ROW_HEIGHT = useMemo(() => getRowHeightFromCSS(), []);
  const rowHeights = useRowHeights(leftDiff, viewerRef, reviewMode);
  const dynamicRowHeights = useCallback(
    (index: number) => {
      const leftLine = leftDiff[index];
      if (isCollapsed(leftLine))
        return COLLAPSED_ROW_HEIGHT;
      return (rowHeights[index] ?? 1) * ROW_HEIGHT;
    },
    [leftDiff, rowHeights],
  );

  useEffect(() => {
    listRef.current?.resetAfterIndex(0, true);
  }, [rowHeights]);

  return (
    <div className={classes} ref={viewerRef as React.Ref<HTMLDivElement>}>
      <VirtualList
        height={height}
        width="100%"
        style={{ alignItems: "start" }}
        outerRef={listContainerRef}
        ref={listRef}
        className="virtual-json-diff-list-container"
        itemCount={Math.max(leftDiff.length, rightDiff.length)}
        itemSize={dynamicRowHeights}
        overscanCount={overScanCount}
        itemData={listData}
        onScroll={({ scrollOffset }: ListOnScrollProps) => setScrollTop(scrollOffset)}
      >
        {RowRendererGrid}
      </VirtualList>
    </div>
  );
};

export default VirtualDiffGrid;
