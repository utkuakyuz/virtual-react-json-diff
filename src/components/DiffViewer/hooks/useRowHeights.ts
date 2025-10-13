import { useCallback, useLayoutEffect, useState } from "react";

import type { DiffRowOrCollapsed } from "../types";

function getWrapCount(el: Element) {
  const style = window.getComputedStyle(el);
  const lineHeight = Number.parseFloat(style.lineHeight);

  let lh = lineHeight;
  if (Number.isNaN(lineHeight)) {
    lh = Number.parseFloat(style.fontSize) * 1.2; // approximate
  }

  return Math.round(el.scrollHeight / lh);
}

export function useRowHeights(leftView: DiffRowOrCollapsed[], viewerRef?: React.RefObject<HTMLDivElement | null>) {
  const [rowHeights, setRowHeights] = useState<number[]>([]);

  const measureRows = useCallback(() => {
    if (!viewerRef?.current)
      return;

    const preElements = viewerRef.current.querySelectorAll("pre");
    const newHeights: number[] = [];
    for (let i = 0; i < preElements.length; i += 2) {
      const leftWraps = getWrapCount(preElements[i]);
      const rightWraps = getWrapCount(preElements[i + 1]);
      newHeights.push(Math.max(leftWraps, rightWraps));
    }
    setRowHeights(newHeights);
  }, [viewerRef]);

  useLayoutEffect(() => {
    measureRows();
  }, [leftView, measureRows]);

  useLayoutEffect(() => {
    window.addEventListener("resize", measureRows);
    return () => window.removeEventListener("resize", measureRows);
  }, [measureRows]);

  return rowHeights;
}
