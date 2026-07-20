import type { InlineDiffOptions } from "json-diff-kit";
import type { CSSProperties } from "react";
import type { ListChildComponentProps } from "react-window";

import { useCallback } from "react";

import type { ChangeBlock, CollapsedLine, DiffRow, DiffRowOrCollapsed } from "../../types";

import { equalEmptyLine, isCollapsed } from "../constants";
import getInlineDiff from "./get-inline-diff";
import syntaxHighlightLine from "./get-inline-syntax-highlight";
import { mergeSegments } from "./segment-util";

const RowRendererGrid: React.FC<
  ListChildComponentProps<{
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
  }>
> = ({ index, style, data }) => {
  const indentChar = " ";
  const indentSize = 5;

  const {
    onExpand,
    inlineDiffOptions,
    leftDiff,
    rightDiff,
    reviewMode,
    reviewStates,
    changeBlocks,
    activeChangeIndex,
    onAccept,
    onReject,
    reviewClassNames,
  } = data;

  const leftPart = leftDiff[index];
  const rightPart = rightDiff[index];

  const gridCols = reviewMode ? "var(--diff-review-gutter-width) 30px 1fr 30px 1fr" : "30px 1fr 30px 1fr";
  const rowStyle: CSSProperties = {
    ...(style as CSSProperties),
    display: "grid",
    gridTemplateColumns: gridCols,
  };

  // Collapsed special row -> we will render as a grid-row with two expand cells
  if (isCollapsed(leftPart) || isCollapsed(rightPart)) {
    const originalLeftLine = leftDiff[index];

    const handleExpand = useCallback((originalLeftLine: CollapsedLine) => {
      if (isCollapsed(originalLeftLine)) {
        onExpand(originalLeftLine.segmentIndex);
      }
    }, [onExpand]);

    return (
      <div
        className="grid-row collapsed-button"
        style={rowStyle}
        role="row"
        data-index={index}
      >
        {reviewMode && <div className="cell review-actions-cell" />}
        <div className="cell line-number" />
        <div className="cell">
          <span className="expand-button-container">
            <button onClick={() => handleExpand(originalLeftLine as CollapsedLine)} className="text-blue-500 underline">
              Show Hidden Lines
            </button>
          </span>
        </div>
        <div className="cell line-number" />
        <div className="cell">
          <span className="expand-button-container">
            <button onClick={() => handleExpand(originalLeftLine as CollapsedLine)} className="text-blue-500 underline">
              Show Hidden Lines
            </button>
          </span>
        </div>
      </div>
    );
  }

  // Match ChangeBlocks by raw diff index (originalIndex), not virtual list index —
  // view index diverges when equal segments are collapsed.
  const rawIndex = (leftPart as DiffRow).originalIndex;
  const block = changeBlocks?.find(b => rawIndex >= b.startIndex && rawIndex <= b.endIndex);
  const status = block ? (reviewStates?.[block.id] || "pending") : null;
  const isActive = block && changeBlocks && activeChangeIndex !== undefined && changeBlocks[activeChangeIndex]?.id === block.id;
  const showReviewActions = Boolean(reviewMode && block && rawIndex === block.startIndex);

  const [lDiff, rDiff]
    = leftPart.type === "modify" && rightPart.type === "modify"
      ? getInlineDiff(leftPart.text || "", rightPart.text || "", inlineDiffOptions ?? { mode: "char" })
      : [[], []];

  const lTokens = syntaxHighlightLine(true, leftPart.text || "", 0);
  const rTokens = syntaxHighlightLine(true, rightPart.text || "", 0);

  const lResult = mergeSegments(lTokens, lDiff);
  const rResult = mergeSegments(rTokens, rDiff);

  const renderInlineResult = (text: string, result: typeof lResult, comma?: boolean) => {
    // Guard against undefined or null text
    if (!text || typeof text !== "string") {
      return <span className="token plain"></span>;
    }

    return (
      <>
        {result.map((item, idx) => {
          const frag = text.slice(item.start, item.end);
          const className = [
            item.type ? `inline-diff-${item.type}` : "",
            item.token ? `token ${item.token}` : "",
          ]
            .filter(Boolean)
            .join(" ");
          return (
            <span key={`${idx}-${item.type}-${frag}`} className={className}>
              {frag}
            </span>
          );
        })}
        {comma && <span className="token punctuation">,</span>}
      </>
    );
  };

  const rowClasses = [
    "grid-row",
    status ? `diff-row-${status}` : "",
    status && reviewClassNames?.[status] ? reviewClassNames[status] : "",
    isActive ? "diff-change-active" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={rowClasses}
      style={rowStyle}
      role="row"
      data-index={index}
    >
      {reviewMode && (
        <div
          className={`cell review-actions-cell${showReviewActions ? " has-actions" : ""}${isActive ? " is-active" : ""}`}
          role="cell"
        >
          {showReviewActions && block && (
            <div className="review-action-buttons" data-status={status || "pending"}>
              <button
                type="button"
                className={`review-btn accept-btn ${status === "accepted" ? "active" : ""}`}
                onClick={() => onAccept?.(block.id)}
                title="Accept change"
                aria-label="Accept change"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </button>
              <button
                type="button"
                className={`review-btn reject-btn ${status === "rejected" ? "active" : ""}`}
                onClick={() => onReject?.(block.id)}
                title="Reject change"
                aria-label="Reject change"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          )}
        </div>
      )}

      <div className={`cell line-${leftPart.type} line-number`} role="cell">
        {leftPart.lineNumber}
      </div>

      <div className={`cell line-${leftPart.type} ${equalEmptyLine(leftPart)}`} role="cell">
        <pre>
          {leftPart.text && indentChar.repeat(leftPart.level * indentSize)}
          {renderInlineResult(leftPart.text || "", lResult, leftPart.comma)}
        </pre>
      </div>

      <div className={`cell line-${rightPart.type} line-number`} role="cell">
        {rightPart.lineNumber}
      </div>

      <div className={`cell line-${rightPart.type} ${equalEmptyLine(rightPart)}`} role="cell">
        <pre>
          {rightPart.text && indentChar.repeat(rightPart.level * indentSize)}
          {renderInlineResult(rightPart.text || "", rResult, rightPart.comma)}
        </pre>
      </div>
    </div>
  );
};

export default RowRendererGrid;
