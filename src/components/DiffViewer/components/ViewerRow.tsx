import type { DiffResult } from "json-diff-kit";
import type { ListChildComponentProps } from "react-window";

import { Viewer } from "json-diff-kit";

import type { DiffRowOrCollapsed } from "../types";

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

export default ViewerRow;
