import React, { useRef, useEffect, useCallback, useMemo } from "react";
import { DiffMinimapProps, DiffRowOrCollapsed } from "../types";

const MINIMAP_WIDTH = 100;
const ROW_HEIGHT = 20;
const SEARCH_HIGHLIGHT_COLOR = "#ffd700";
const CURRENT_MATCH_COLOR = "#ff4500";
const EQUAL_LINE_COLOR = "#363743";
const ADD_LINE_COLOR = "#4CAF50";
const REMOVE_LINE_COLOR = "#F44336";
const MODIFY_LINE_COLOR = "#FFC107";

export const DiffMinimap: React.FC<DiffMinimapProps> = ({
    leftDiff,
    rightDiff,
    height,
    onScroll,
    currentScrollTop,
    searchResults = [],
    currentMatchIndex = -1,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);

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
    }, [height, leftDiff.length, rightDiff.length, leftDiff]);

    // Memoize the drawLine function since it's used in a loop
    const drawLine = useCallback((ctx: CanvasRenderingContext2D, line: DiffRowOrCollapsed, y: number, x: number, width: number) => {
        if (line.type === "collapsed") {
            ctx.fillStyle = EQUAL_LINE_COLOR;
        } else {
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
    }, []);

    const drawMinimap = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const totalLines = Math.max(leftDiff.length, rightDiff.length);
        const scale = height / totalLines;

        leftDiff.forEach((line, index) => {
            const y = index * scale;
            drawLine(ctx, line, y, 0, MINIMAP_WIDTH / 2);
        });

        rightDiff.forEach((line, index) => {
            const y = index * scale;
            drawLine(ctx, line, y, MINIMAP_WIDTH / 2, MINIMAP_WIDTH / 2);
        });

        searchResults.forEach((index) => {
            const y = index * scale;
            const lineHeight = Math.max(1, scale);
            ctx.fillStyle = SEARCH_HIGHLIGHT_COLOR;
            ctx.fillRect(0, y, MINIMAP_WIDTH, lineHeight);
        });

        if (currentMatchIndex >= 0 && searchResults[currentMatchIndex] !== undefined) {
            const y = searchResults[currentMatchIndex] * scale;
            const lineHeight = Math.max(1, scale);
            ctx.fillStyle = CURRENT_MATCH_COLOR;
            ctx.fillRect(0, y, MINIMAP_WIDTH, lineHeight);
        }

        const totalContentHeight = totalLines * ROW_HEIGHT;
        const viewportTop = (currentScrollTop / totalContentHeight) * height;
        ctx.strokeStyle = "#2196F3";
        ctx.lineWidth = 2;
        ctx.strokeRect(0, viewportTop, MINIMAP_WIDTH, viewportHeight);
    }, [leftDiff, rightDiff, height, currentScrollTop, searchResults, currentMatchIndex, drawLine, viewportHeight]);

    useEffect(() => {
        drawMinimap();
    }, [drawMinimap]);

    const handleMouseDown = useCallback(
        (e: React.MouseEvent) => {
            isDragging.current = true;
            if (!containerRef.current) return;

            const rect = containerRef.current.getBoundingClientRect();
            const relativeY = e.clientY - rect.top;

            if (height <= 0 || totalLines <= 0) return;

            const viewportCenter = relativeY - viewportHeight / 2;
            const scrollTop = (viewportCenter / height) * totalLines * ROW_HEIGHT;

            if (!isNaN(scrollTop) && isFinite(scrollTop)) {
                onScroll(Math.max(0, scrollTop));
            }
        },
        [height, totalLines, viewportHeight, onScroll]
    );

    const handleMouseMove = useCallback(
        (e: React.MouseEvent) => {
            if (!isDragging.current || !containerRef.current) return;

            const rect = containerRef.current.getBoundingClientRect();
            const relativeY = e.clientY - rect.top;

            if (height <= 0 || totalLines <= 0) return;

            const viewportCenter = relativeY - viewportHeight / 2;
            const scrollTop = (viewportCenter / height) * totalLines * ROW_HEIGHT;

            if (isNaN(scrollTop) || !isFinite(scrollTop)) return;

            const maximumBottomLimit = e.clientY + viewportHeight / 2;

            if (maximumBottomLimit > rect.bottom) {
                const maximumScrollToBottom = rect.bottom - viewportHeight / 2 - rect.top;
                const forcedScrollTop = (maximumScrollToBottom / height) * totalLines * ROW_HEIGHT;

                if (!isNaN(forcedScrollTop) && isFinite(forcedScrollTop)) {
                    onScroll(Math.max(0, forcedScrollTop - 250));
                }
            } else {
                onScroll(Math.max(0, scrollTop));
            }
        },
        [height, totalLines, viewportHeight, onScroll]
    );

    const handleMouseUp = useCallback(() => {
        isDragging.current = false;
    }, []);

    useEffect(() => {
        window.addEventListener("mouseup", handleMouseUp);
        return () => window.removeEventListener("mouseup", handleMouseUp);
    }, [handleMouseUp]);

    return (
        <div
            ref={containerRef}
            style={{
                width: MINIMAP_WIDTH,
                height,
                position: "relative",
                cursor: "pointer",
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
        >
            <canvas
                ref={canvasRef}
                width={MINIMAP_WIDTH}
                height={height}
                style={{
                    width: "100%",
                    height: "100%",
                }}
            />
        </div>
    );
};
