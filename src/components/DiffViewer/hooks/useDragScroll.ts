// hooks/useDragScroll.ts
import { useCallback, useEffect, useRef } from "react";

type UseDragScrollParams = {
  height: number;
  totalLines: number;
  viewportHeight: number;
  ROW_HEIGHT: number;
  onScroll: (scrollTop: number) => void;
  containerRef: React.RefObject<HTMLDivElement>;
};

type UseDragScrollReturn = {
  handleMouseDown: (e: React.MouseEvent) => void;
  isDragging: React.MutableRefObject<boolean>;
};

export function useDragScroll({
  height,
  totalLines,
  viewportHeight,
  ROW_HEIGHT,
  onScroll,
  containerRef,
}: UseDragScrollParams): UseDragScrollReturn {
  const isDragging = useRef(false);

  const isValidScroll = useCallback((scrollTop: number): boolean => {
    return !Number.isNaN(scrollTop) && Number.isFinite(scrollTop);
  }, []);

  const calculateScrollFromMouseY = useCallback((relativeY: number): number => {
    const viewportCenter = relativeY - viewportHeight / 2;
    return (viewportCenter / height) * totalLines * ROW_HEIGHT;
  }, [height, totalLines, viewportHeight, ROW_HEIGHT]);

  const calculateMaxScroll = useCallback((): number => {
    const totalContentHeight = totalLines * ROW_HEIGHT;
    return Math.max(0, totalContentHeight - height);
  }, [totalLines, ROW_HEIGHT, height]);

  // Handle boundary-constrained scrolling
  const handleBoundaryScroll = useCallback((e: MouseEvent, rect: DOMRect): void => {
    const relativeY = e.clientY - rect.top;
    const maxScroll = calculateMaxScroll();

    const cursorBottom = e.clientY + viewportHeight / 2;

    if (cursorBottom > rect.bottom) {
      // This prevents the viewport indicator from going past the minimap bottom
      const constrainedRelativeY = rect.bottom - rect.top - viewportHeight / 2;
      const constrainedScrollTop = calculateScrollFromMouseY(constrainedRelativeY);

      if (isValidScroll(constrainedScrollTop)) {
        onScroll(Math.min(maxScroll, Math.max(0, constrainedScrollTop)));
      }
    }
    else {
      // Normal scrolling within bounds
      const scrollTop = calculateScrollFromMouseY(relativeY);

      if (isValidScroll(scrollTop)) {
        onScroll(Math.min(maxScroll, Math.max(0, scrollTop)));
      }
    }
  }, [calculateScrollFromMouseY, calculateMaxScroll, isValidScroll, onScroll, viewportHeight]);

  // Handle mouse movement during drag
  const handleWindowMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current || !containerRef.current)
      return;

    if (height <= 0 || totalLines <= 0)
      return;

    const rect = containerRef.current.getBoundingClientRect();
    handleBoundaryScroll(e, rect);
  }, [
    containerRef,
    height,
    totalLines,
    handleBoundaryScroll,
  ]);

  // Handle mouse up - stop dragging and cleanup
  const handleWindowMouseUp = useCallback(() => {
    isDragging.current = false;
    window.removeEventListener("mousemove", handleWindowMouseMove);
    window.removeEventListener("mouseup", handleWindowMouseUp);
  }, [handleWindowMouseMove]);

  // Handle initial mouse down - start dragging
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;

    window.addEventListener("mousemove", handleWindowMouseMove);
    window.addEventListener("mouseup", handleWindowMouseUp);

    if (!containerRef.current)
      return;

    const rect = containerRef.current.getBoundingClientRect();
    handleBoundaryScroll(e.nativeEvent, rect);
  }, [
    handleWindowMouseMove,
    handleWindowMouseUp,
    containerRef,
    handleBoundaryScroll,
  ]);

  useEffect(() => {
    const handleMouseUp = () => {
      isDragging.current = false;
    };

    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, []);

  return {
    handleMouseDown,
    isDragging,
  };
}
