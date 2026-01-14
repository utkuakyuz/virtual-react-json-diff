import type { InlineDiffOptions } from "json-diff-kit";
import type { ListChildComponentProps } from "react-window";

import { useCallback } from "react";

import type { CollapsedLine, DiffRowOrCollapsed } from "../../types";

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
  }>
> = ({ index, style, data }) => {
  const indentChar = " ";
  const indentSize = 5;

  const { onExpand, inlineDiffOptions, leftDiff, rightDiff } = data;

  const leftPart = leftDiff[index];
  const rightPart = rightDiff[index];

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
        style={{
          ...style,
          display: "grid",
          gridTemplateColumns: "30px 1fr 30px 1fr",
        }}
        role="row"
        data-index={index}
      >
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

  return (
    <div
      className="grid-row"
      style={{
        ...style,
        display: "grid",
        gridTemplateColumns: "30px 1fr 30px 1fr",
      }}
      role="row"
      data-index={index}
    >
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
