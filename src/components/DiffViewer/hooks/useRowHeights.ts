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

function heightsEqual(a: number[], b: number[]) {
  if (a.length !== b.length)
    return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i])
      return false;
  }
  return true;
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

    const preElements = viewerRef.current.querySelectorAll("pre");
    if (preElements.length < 2)
      return;

    const newHeights: number[] = [];
    for (let i = 0; i < preElements.length; i += 2) {
      const left = preElements[i];
      const right = preElements[i + 1];
      if (!left || !right)
        break;
      const leftWraps = getWrapCount(left);
      const rightWraps = getWrapCount(right);
      newHeights.push(Math.max(leftWraps, rightWraps, 1));
    }

    if (heightsEqual(heightsRef.current, newHeights))
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
