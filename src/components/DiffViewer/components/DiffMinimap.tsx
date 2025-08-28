import React, { useCallback, useEffect, useMemo, useRef } from "react";

import type { DiffMinimapProps } from "../types";

import { useDragScroll } from "../hooks/useDragScroll";
import { useMinimapDraw } from "../hooks/useMinimapDraw";
import { getRowHeightFromCSS } from "../utils/constants";

const MINIMAP_HOVER_SCROLL_COLOR = "#7B7B7Bcc";

export const DiffMinimap: React.FC<DiffMinimapProps> = ({
  leftDiff,
  rightDiff,
  height,
  onScroll,
  miniMapWidth = 20,
  currentScrollTop,
  searchResults = [],
  currentMatchIndex = -1,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const ROW_HEIGHT = useMemo(() => getRowHeightFromCSS(), []);

  // Memoize expensive calculations
  const { totalLines, viewportHeight } = useMemo(() => {
    const totalShownLines = height / ROW_HEIGHT;
    const totalLines = Math.max(leftDiff.length, rightDiff.length) || totalShownLines;
    const aRatio = 1 / (totalLines / totalShownLines);
    const viewportHeight = height * aRatio;

    return {
      totalLines,
      viewportHeight,
    };
  }, [height, leftDiff.length, rightDiff.length]);

  const { handleMouseDown, isDragging } = useDragScroll({
    height,
    totalLines,
    viewportHeight,
    ROW_HEIGHT,
    onScroll,
    containerRef,
  });

  const { drawMinimap, drawScrollBox } = useMinimapDraw({
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
  });

  useEffect(() => {
    drawMinimap();
  }, [drawMinimap]);

  const handleMouseLeave = () => {
    drawMinimap(); // resets full state
  };

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!containerRef.current)
        return;
      const rect = containerRef.current.getBoundingClientRect();
      const relativeY = e.clientY - rect.top; // e.client y - rect top (120)

      const totalContentHeight = totalLines * ROW_HEIGHT;
      const scrollSquareTop = (currentScrollTop / totalContentHeight) * height;

      const isHovering
      = relativeY > scrollSquareTop && relativeY < scrollSquareTop + viewportHeight;

      drawMinimap();

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (!ctx)
          return;
        if (isHovering)
          drawScrollBox(ctx, MINIMAP_HOVER_SCROLL_COLOR);
      }
    },
    [height, totalLines, viewportHeight, currentScrollTop, drawMinimap],
  );

  return (
    <div
      ref={containerRef}
      style={{
        width: miniMapWidth,
        height,
        position: "relative",
        cursor: "pointer",
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <canvas
        ref={canvasRef}
        width={miniMapWidth}
        height={height}
        style={{
          width: "100%",
          height: "100%",
        }}
      />
    </div>
  );
};
