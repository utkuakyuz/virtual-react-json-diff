import type { InlineDiffOptions } from "json-diff-kit";
import type { ListChildComponentProps } from "react-window";

import { useCallback } from "react";

import type { CollapsedLine, DiffRowOrCollapsed } from "../../types";

import { equalEmptyLine, isCollapsed } from "../constants";
import getInlineDiff from "./get-inline-diff";
import syntaxHighlightLine from "./get-inline-syntax-highlight";
import { mergeSegments } from "./segment-util";

function RowRenderer({ index, style, data }:
ListChildComponentProps<{
  leftDiff: DiffRowOrCollapsed[];
  rightDiff: DiffRowOrCollapsed[];
  onExpand: (segmentIndex: number) => void;
  inlineDiffOptions?: InlineDiffOptions;
}>) {
  const indentChar = " ";
  const indentSize = 2;

  const { onExpand, inlineDiffOptions, leftDiff, rightDiff } = data;

  const leftPart = leftDiff[index];
  const RightPart = rightDiff[index];

  // Special Render for Collapsed Lines
  if (isCollapsed(leftPart) || isCollapsed(RightPart)) {
    const originalLeftLine = leftDiff[index];

    const handleExpand = useCallback((originalLeftLine: CollapsedLine) => {
      if (isCollapsed(originalLeftLine)) {
        onExpand(originalLeftLine.segmentIndex);
      }
    }, [onExpand, originalLeftLine]);

    return (
      <tr className="collapsed-button" style={style}>
        <td></td>
        <td>
          <span className="expand-button-container">
            <button onClick={() => handleExpand(originalLeftLine as CollapsedLine)} className="text-blue-500 underline">
              Show Hidden Lines
            </button>
          </span>
        </td>
        <td></td>
        <td>
          <span className="expand-button-container">
            <button onClick={() => handleExpand(originalLeftLine as CollapsedLine)} className="text-blue-500 underline">
              Show Hidden Lines
            </button>
          </span>
        </td>

      </tr>
    );
  }

  const [lDiff, rDiff]
    = leftPart.type === "modify" && RightPart.type === "modify"
      ? getInlineDiff(leftPart.text, RightPart.text, inlineDiffOptions ?? { mode: "char" })
      : [[], []];

  const lTokens = syntaxHighlightLine(true, leftPart.text, 0);
  const rTokens = syntaxHighlightLine(true, RightPart.text, 0);

  const lResult = mergeSegments(lTokens, lDiff);
  const rResult = mergeSegments(rTokens, rDiff);

  const renderInlineResult = (text: string, result: typeof lResult, comma?: boolean) => (
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

  return (
    <tr style={style} key={index}>
      <td className={`line-${leftPart.type} line-number`}>{leftPart.lineNumber}</td>
      <td className={`line-${leftPart.type} ${equalEmptyLine(leftPart)}`}>
        <pre>
          {leftPart.text && indentChar.repeat(leftPart.level * indentSize)}
          {renderInlineResult(leftPart.text, lResult, leftPart.comma)}
        </pre>
      </td>
      <td className={`line-${RightPart.type} line-number`}>{RightPart.lineNumber}</td>
      <td className={`line-${RightPart.type} ${equalEmptyLine(RightPart)}`}>
        <pre>
          {RightPart.text && indentChar.repeat(RightPart.level * indentSize)}
          {renderInlineResult(RightPart.text, rResult, RightPart.comma)}
        </pre>
      </td>
    </tr>
  );
}

export default RowRenderer;
