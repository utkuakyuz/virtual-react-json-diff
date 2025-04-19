import { DiffResult } from "json-diff-kit";
import { DiffRow, SegmentItem, CollapsedLine, DiffRowOrCollapsed } from "../types";

const DEFAULT_CONTEXT_SIZE = 3;
const DEFAULT_COLLAPSE_THRESHOLD = 10;

const shouldAddTopContext = (index: number, segments: SegmentItem[], currentSegment: SegmentItem): boolean => {
    return index === 0 || (segments[index - 1].end < currentSegment.start && segments[index - 1].isEqual);
};

const isNonEmptyEqualLine = (line: DiffResult): boolean => {
    return line.type === "equal" && line.text !== "";
};

export function preprocessDiffs(
    diff: DiffResult[],
    contextSize: number = DEFAULT_CONTEXT_SIZE,
    collapseThreshold: number = DEFAULT_COLLAPSE_THRESHOLD
): DiffRowOrCollapsed[] {
    if (!Array.isArray(diff)) {
        throw new Error("Diff input must be an array");
    }

    const result: DiffRowOrCollapsed[] = [];
    let i = 0;

    while (i < diff.length) {
        if (isNonEmptyEqualLine(diff[i])) {
            let j = i;
            while (j < diff.length && isNonEmptyEqualLine(diff[j])) j++;
            const blockSize = j - i;

            if (blockSize > collapseThreshold) {
                const top = diff.slice(i, i + contextSize).map(
                    (line, idx) =>
                        ({
                            ...line,
                            originalIndex: i + idx,
                        } as DiffRow)
                );
                const bottom = diff.slice(j - contextSize, j).map(
                    (line, idx) =>
                        ({
                            ...line,
                            originalIndex: j - contextSize + idx,
                        } as DiffRow)
                );

                result.push(...top);

                if (blockSize > contextSize * 2) {
                    result.push({
                        type: "collapsed",
                        segmentIndex: result.length,
                        originalIndex: result.length,
                        level: 0,
                        text: "",
                    } as CollapsedLine);
                }

                result.push(...bottom);
            } else {
                result.push(
                    ...diff.slice(i, j).map(
                        (line, idx) =>
                            ({
                                ...line,
                                originalIndex: i + idx,
                            } as DiffRow)
                    )
                );
            }
            i = j;
        } else {
            result.push({
                ...diff[i],
                originalIndex: i,
            } as DiffRow);
            i++;
        }
    }

    return result;
}

export function generateSegments(diff: DiffResult[], contextSize: number = DEFAULT_CONTEXT_SIZE): SegmentItem[] {
    if (!Array.isArray(diff)) {
        throw new Error("Diff input must be an array");
    }

    const segments: SegmentItem[] = [];
    let i = 0;

    // Handle the first contextSize lines separately
    if (i < diff.length && isNonEmptyEqualLine(diff[i])) {
        let firstContextEnd = Math.min(i + contextSize, diff.length);
        while (firstContextEnd < diff.length && isNonEmptyEqualLine(diff[firstContextEnd])) {
            firstContextEnd++;
        }
        segments.push({ start: i, end: firstContextEnd, isEqual: true });
        i = firstContextEnd;
    }

    while (i < diff.length) {
        if (isNonEmptyEqualLine(diff[i])) {
            let j = i;
            while (j < diff.length && isNonEmptyEqualLine(diff[j])) j++;
            const blockSize = j - i;

            segments.push({ start: i, end: j, isEqual: true });
            i = j;
        } else {
            const start = Math.max(0, i - contextSize);
            const end = Math.min(diff.length, i + 1 + contextSize);

            if (start < i && (segments.length === 0 || segments[segments.length - 1].end <= start)) {
                segments.push({ start, end: i, isEqual: true });
            }

            segments.push({ start: i, end: i + 1, isEqual: false });

            if (i + 1 < end) {
                segments.push({ start: i + 1, end, isEqual: true });
            }

            i = end;
        }
    }

    return segments;
}

export function buildViewFromSegments(
    segments: SegmentItem[],
    diff: DiffResult[],
    contextSize: number = DEFAULT_CONTEXT_SIZE
): DiffRowOrCollapsed[] {
    if (!Array.isArray(segments) || !Array.isArray(diff)) {
        throw new Error("Both segments and diff must be arrays");
    }

    const result: DiffRowOrCollapsed[] = [];

    segments.forEach((segment, index) => {
        if (!segment.isEqual) {
            for (let i = segment.start; i < segment.end; i++) {
                result.push({ ...diff[i], originalIndex: i } as DiffRow);
            }
        } else {
            const segmentLength = segment.end - segment.start;

            if (segmentLength <= contextSize * 2 || segment.isExpanded) {
                for (let i = segment.start; i < segment.end; i++) {
                    result.push({ ...diff[i], originalIndex: i } as DiffRow);
                }
            } else {
                if (shouldAddTopContext(index, segments, segment)) {
                    for (let i = segment.start; i < Math.min(segment.start + contextSize, segment.end); i++) {
                        result.push({ ...diff[i], originalIndex: i } as DiffRow);
                    }
                }

                if (segment.end - (segment.start + contextSize) > contextSize) {
                    result.push({
                        type: "collapsed",
                        segmentIndex: index,
                        originalIndex: result.length,
                        level: 0,
                        text: "",
                    } as CollapsedLine);
                }

                for (let i = Math.max(segment.end - contextSize, segment.start + contextSize); i < segment.end; i++) {
                    result.push({ ...diff[i], originalIndex: i } as DiffRow);
                }
            }
        }
    });

    return result;
}
