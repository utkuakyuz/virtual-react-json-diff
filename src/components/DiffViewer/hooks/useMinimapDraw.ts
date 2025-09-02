import { useCallback, useEffect, useMemo } from "react";

import type { DiffRowOrCollapsed } from "../types";

const SEARCH_HIGHLIGHT_COLOR = "#ffd700";
const CURRENT_MATCH_COLOR = "#ff4500";
const EQUAL_LINE_COLOR = "#363743";
const ADD_LINE_COLOR = "#4CAF50";
const REMOVE_LINE_COLOR = "#F44336";
const MODIFY_LINE_COLOR = "#FFC107";
const MINIMAP_HOVER_SCROLL_COLOR = "#7B7B7Bcc";
const MINIMAP_SCROLL_COLOR = "#7B7B7B80";

type Props = {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  height: number;
  miniMapWidth: number;
  leftDiff: DiffRowOrCollapsed[];
  rightDiff: DiffRowOrCollapsed[];
  currentScrollTop: number;
  searchResults: number[];
  currentMatchIndex: number;
  isDragging: React.MutableRefObject<boolean>;
  totalLines: number;
  ROW_HEIGHT: number;
  viewportHeight: number;
};

export function useMinimapDraw({
  canvasRef,
  height,
  miniMapWidth,
  leftDiff,
  rightDiff,
  currentScrollTop,
  searchResults,
  currentMatchIndex,
  isDragging,
  totalLines,
  ROW_HEIGHT,
  viewportHeight,
}: Props) {
  // Memoize the drawLine function since it's used in a loop
  const drawLine = useCallback((ctx: CanvasRenderingContext2D, line: DiffRowOrCollapsed, y: number, x: number, width: number) => {
    if (line.type === "collapsed") {
      ctx.fillStyle = EQUAL_LINE_COLOR;
    }
    else {
      switch (line.type) {
        case "equal":
          ctx.fillStyle = EQUAL_LINE_COLOR;
          break;
        case "add":
          ctx.fillStyle = ADD_LINE_COLOR;
          break;
        case "remove":
          ctx.fillStyle = REMOVE_LINE_COLOR;
          break;
        case "modify":
          ctx.fillStyle = MODIFY_LINE_COLOR;
          break;
      }
    }
    ctx.fillRect(x, y, width, ROW_HEIGHT);
  }, [ROW_HEIGHT]);

  const diffCanvas = useMemo(() => {
    const offscreen = document.createElement("canvas");
    offscreen.width = miniMapWidth;
    offscreen.height = height;
    const ctx = offscreen.getContext("2d");
    if (!ctx)
      return null;

    const scale = height / totalLines;

    // left diff
    leftDiff.forEach((line, index) => {
      const y = index * scale;
      drawLine(ctx, line, y, 0, miniMapWidth / 2);
    });

    // right diff
    rightDiff.forEach((line, index) => {
      const y = index * scale;
      drawLine(ctx, line, y, miniMapWidth / 2, miniMapWidth / 2);
    });

    // search highlights
    searchResults.forEach((index) => {
      const y = index * scale;
      const lineHeight = Math.max(1, scale);
      ctx.fillStyle = SEARCH_HIGHLIGHT_COLOR;
      ctx.fillRect(0, y, miniMapWidth, lineHeight);
    });

    return offscreen;
  }, [leftDiff, rightDiff, searchResults, height, totalLines, miniMapWidth, drawLine]);

  // Draw the scroll box and also differences in minimapo
  const drawScrollBox = useCallback(
    (ctx: CanvasRenderingContext2D, color: string) => {
      if (!diffCanvas)
        return;

      // Copy pre-rendered diff
      ctx.clearRect(0, 0, miniMapWidth, height);
      ctx.drawImage(diffCanvas, 0, 0);

      // Draw scroll box
      const totalContentHeight = totalLines * ROW_HEIGHT;
      const viewportTop = (currentScrollTop / totalContentHeight) * height;

      ctx.fillStyle = color;
      ctx.fillRect(0, viewportTop, miniMapWidth, viewportHeight);

      // Draw current match highlight (optional)
      if (currentMatchIndex >= 0 && searchResults[currentMatchIndex] !== undefined) {
        const scale = height / totalLines;
        const y = searchResults[currentMatchIndex] * scale;
        const lineHeight = Math.max(1, scale);
        ctx.fillStyle = CURRENT_MATCH_COLOR;
        ctx.fillRect(0, y, miniMapWidth, lineHeight);
      }
    },
    [diffCanvas, currentScrollTop, totalLines, ROW_HEIGHT, height, miniMapWidth, viewportHeight, currentMatchIndex, searchResults],
  );

  const drawMinimap = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas)
      return;

    const ctx = canvas.getContext("2d");
    if (!ctx)
      return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!isDragging.current) {
      drawScrollBox(ctx, MINIMAP_SCROLL_COLOR);
    }
    else {
      drawScrollBox(ctx, MINIMAP_HOVER_SCROLL_COLOR);
    }
  }, [leftDiff, rightDiff, height, currentScrollTop, searchResults, currentMatchIndex, drawLine, viewportHeight]);

  useEffect(() => {
    drawMinimap();
  }, [drawMinimap]);

  return { drawScrollBox, drawMinimap };
}
