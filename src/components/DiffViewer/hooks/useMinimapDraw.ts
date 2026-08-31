import { useCallback, useEffect, useMemo, useState } from "react";

import type { DiffRowOrCollapsed, DiffTheme } from "../types";

import { readMinimapColors } from "../utils/minimapColors";

type Props = {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
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
  theme?: DiffTheme;
};

export function useMinimapDraw({
  canvasRef,
  containerRef,
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
  theme,
}: Props) {
  const [paintToken, setPaintToken] = useState(0);

  useEffect(() => {
    setPaintToken(n => n + 1);
  }, [theme]);

  const colors = useMemo(
    () => readMinimapColors(containerRef.current),
    [theme, paintToken, containerRef],
  );

  const drawLine = useCallback((ctx: CanvasRenderingContext2D, line: DiffRowOrCollapsed, y: number, x: number, width: number) => {
    if (line.type === "collapsed") {
      ctx.fillStyle = colors.equal;
    }
    else {
      switch (line.type) {
        case "equal":
          ctx.fillStyle = colors.equal;
          break;
        case "add":
          ctx.fillStyle = colors.add;
          break;
        case "remove":
          ctx.fillStyle = colors.remove;
          break;
        case "modify":
          ctx.fillStyle = colors.modify;
          break;
      }
    }
    ctx.fillRect(x, y, width, ROW_HEIGHT);
  }, [ROW_HEIGHT, colors]);

  const diffCanvas = useMemo(() => {
    const offscreen = document.createElement("canvas");
    offscreen.width = miniMapWidth;
    offscreen.height = height;
    const ctx = offscreen.getContext("2d");
    if (!ctx)
      return null;

    const scale = height / totalLines;

    leftDiff.forEach((line, index) => {
      const y = index * scale;
      drawLine(ctx, line, y, 0, miniMapWidth / 2);
    });

    rightDiff.forEach((line, index) => {
      const y = index * scale;
      drawLine(ctx, line, y, miniMapWidth / 2, miniMapWidth / 2);
    });

    searchResults.forEach((index) => {
      const y = index * scale;
      const lineHeight = Math.max(1, scale);
      ctx.fillStyle = colors.search;
      ctx.fillRect(0, y, miniMapWidth, lineHeight);
    });

    return offscreen;
  }, [leftDiff, rightDiff, searchResults, height, totalLines, miniMapWidth, drawLine, colors]);

  const drawScrollBox = useCallback(
    (ctx: CanvasRenderingContext2D, color: string) => {
      if (!diffCanvas)
        return;

      ctx.clearRect(0, 0, miniMapWidth, height);
      ctx.drawImage(diffCanvas, 0, 0);

      const totalContentHeight = totalLines * ROW_HEIGHT;
      const viewportTop = (currentScrollTop / totalContentHeight) * height;

      ctx.fillStyle = color;
      ctx.fillRect(0, viewportTop, miniMapWidth, viewportHeight);

      if (currentMatchIndex >= 0 && searchResults[currentMatchIndex] !== undefined) {
        const scale = height / totalLines;
        const y = searchResults[currentMatchIndex] * scale;
        const lineHeight = Math.max(1, scale);
        ctx.fillStyle = colors.currentMatch;
        ctx.fillRect(0, y, miniMapWidth, lineHeight);
      }
    },
    [diffCanvas, currentScrollTop, totalLines, ROW_HEIGHT, height, miniMapWidth, viewportHeight, currentMatchIndex, searchResults, colors],
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
      if (containerRef.current) {
        containerRef.current.style.opacity = "0.65";
      }
      drawScrollBox(ctx, colors.scroll);
    }
    else {
      if (containerRef.current) {
        containerRef.current.style.opacity = "0.85";
      }
      drawScrollBox(ctx, colors.scrollHover);
    }
  }, [drawScrollBox, colors, canvasRef, containerRef, isDragging]);

  useEffect(() => {
    drawMinimap();
  }, [drawMinimap]);

  return { drawScrollBox, drawMinimap, scrollHoverColor: colors.scrollHover };
}
