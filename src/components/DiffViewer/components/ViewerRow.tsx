import type { DiffResult, InlineDiffOptions } from "json-diff-kit";
import type { ListChildComponentProps } from "react-window";

import { Viewer } from "json-diff-kit";
import { useCallback } from "react";

import type { CollapsedLine, DiffRowOrCollapsed } from "../types";

import { DIFF_VIEWER_CLASS, isCollapsed } from "../utils/constants";

function ViewerRow({
  index,
  style,
  data,
}: ListChildComponentProps<{
  leftDiff: DiffRowOrCollapsed[];
  rightDiff: DiffRowOrCollapsed[];
  onExpand: (segmentIndex: number) => void;
  searchTerm?: string;
  inlineDiffOptions?: InlineDiffOptions;
}>) {
  const { onExpand, searchTerm, inlineDiffOptions } = data;
  const originalLeftLine = data.leftDiff[index];
  const originalRightLine = data.rightDiff[index];

  const handleExpand = useCallback((originalLeftLine: CollapsedLine) => {
    if (isCollapsed(originalLeftLine)) {
      onExpand(originalLeftLine.segmentIndex);
    }
  }, [onExpand, originalLeftLine]);

  if (isCollapsed(originalLeftLine)) {
    return (
      <div className="collapsed-button" style={style}>
        <button onClick={() => handleExpand(originalLeftLine)} className="text-blue-500 underline">
          Show Hidden Lines
        </button>
        <button onClick={() => handleExpand(originalLeftLine)} className="text-blue-500 underline">
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
        indent={4}
        className={`${DIFF_VIEWER_CLASS} ${searchTerm ? "has-search" : ""}`}
        lineNumbers
        diff={[[leftLine], [rightLine]]}
        highlightInlineDiff
        inlineDiffOptions={{ mode: "char", ...inlineDiffOptions }}
        syntaxHighlight={{ theme: "monokai" }}
      />
    </div>
  );
}

export default ViewerRow;
