import { useCallback, useLayoutEffect, useRef, useState } from "react";

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

export function useRowHeights(
  leftView: DiffRowOrCollapsed[],
  viewerRef?: React.RefObject<HTMLDivElement | null>,
  remasureKey?: unknown,
) {
  const [rowHeights, setRowHeights] = useState<number[]>([]);
  const heightsRef = useRef(rowHeights);
  heightsRef.current = rowHeights;
  const frameRef = useRef<number | null>(null);

  const measureRows = useCallback(() => {
    if (!viewerRef?.current)
      return;

    // react-window only mounts visible rows — map by data-index, keep a sparse cache.
    const rowElements = viewerRef.current.querySelectorAll(".grid-row");
    if (rowElements.length === 0)
      return;

    const newHeights = [...heightsRef.current];
    let hasChanges = false;

    rowElements.forEach((row) => {
      const indexAttr = row.getAttribute("data-index");
      if (indexAttr === null)
        return;

      const index = Number.parseInt(indexAttr, 10);
      if (Number.isNaN(index))
        return;

      const preElements = row.querySelectorAll("pre");
      if (preElements.length < 2)
        return;

      const height = Math.max(
        getWrapCount(preElements[0]),
        getWrapCount(preElements[1]),
        1,
      );

      if (newHeights[index] !== height) {
        newHeights[index] = height;
        hasChanges = true;
      }
    });

    if (!hasChanges)
      return;

    heightsRef.current = newHeights;
    setRowHeights(newHeights);
  }, [viewerRef]);

  const scheduleMeasure = useCallback(() => {
    if (frameRef.current != null)
      cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null;
      measureRows();
    });
  }, [measureRows]);

  // Drop stale absolute indices when the virtualized view structure changes.
  useLayoutEffect(() => {
    heightsRef.current = [];
    setRowHeights([]);
  }, [leftView]);

  useLayoutEffect(() => {
    scheduleMeasure();
    return () => {
      if (frameRef.current != null)
        cancelAnimationFrame(frameRef.current);
    };
  }, [leftView, scheduleMeasure, remasureKey]);

  useLayoutEffect(() => {
    window.addEventListener("resize", scheduleMeasure);
    return () => window.removeEventListener("resize", scheduleMeasure);
  }, [scheduleMeasure]);

  return rowHeights;
}
