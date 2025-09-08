// VirtualDiffGrid.tsx
import type { InlineDiffOptions } from "json-diff-kit";
import type { Dispatch } from "react";
import type { ListOnScrollProps } from "react-window";

import React, { useCallback, useEffect, useMemo } from "react";
import { VariableSizeList as List } from "react-window";

import type { DiffRowOrCollapsed } from "../types";

import { useRowHeights } from "../hooks/useRowHeights";
import { COLLAPSED_ROW_HEIGHT, getRowHeightFromCSS, isCollapsed } from "../utils/constants";
import RowRendererGrid from "../utils/json-diff/row-renderer-grid";

type VirtualDiffGridProps = {
  leftDiff: DiffRowOrCollapsed[];
  rightDiff: DiffRowOrCollapsed[];
  outerRef: React.RefObject<Node | null>;
  listRef: React.RefObject<List<any>>;
  height: number;
  inlineDiffOptions?: InlineDiffOptions;
  className?: string;
  setScrollTop: Dispatch<React.SetStateAction<number>>;
  onExpand: (segmentIndex: number) => void;
};

const VirtualDiffGrid: React.FC<VirtualDiffGridProps> = ({
  leftDiff,
  rightDiff,
  outerRef,
  listRef,
  height,
  inlineDiffOptions,
  className,
  setScrollTop,
  onExpand,
}) => {
  // Virtual List Data
  const listData = useMemo(
    () => ({
      leftDiff,
      rightDiff,
      onExpand,
      inlineDiffOptions,
    }),
    [leftDiff, rightDiff, onExpand, inlineDiffOptions],
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
  const rowHeights = useRowHeights(leftDiff);
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
    <div className={classes}>
      <List
        height={height}
        width="100%"
        style={{ alignItems: "start" }}
        outerRef={outerRef}
        ref={listRef}
        className="virtual-json-diff-list-container"
        itemCount={Math.max(leftDiff.length, rightDiff.length)}
        itemSize={dynamicRowHeights}
        overscanCount={28}
        itemData={listData}
        onScroll={({ scrollOffset }: ListOnScrollProps) => setScrollTop(scrollOffset)}
      >
        {RowRendererGrid}
      </List>
    </div>
  );
};

export default VirtualDiffGrid;
