/// <reference types="bun" />

import { act, cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, mock, test } from "bun:test";
import React, { createRef } from "react";

import type { ChangeBlock, DiffRowOrCollapsed, VirtualDiffViewerRef } from "../types";

type ReviewPayload = {
  reviewStates: Record<string, string>;
  mergedJson: unknown;
};

// Avoid react-window + dual-React issues in happy-dom; ref/review logic lives in the viewer.
mock.module("../components/VirtualDiffGrid", () => ({
  default: function MockVirtualDiffGrid({
    leftDiff,
    reviewMode,
    onAccept,
    onReject,
    changeBlocks,
    reviewStates,
  }: {
    leftDiff: DiffRowOrCollapsed[];
    reviewMode?: boolean;
    onAccept?: (id: string) => void;
    onReject?: (id: string) => void;
    changeBlocks?: { id: string; startIndex: number }[];
    reviewStates?: Record<string, string>;
  }) {
    return (
      <div data-testid="mock-diff-grid">
        <span data-testid="row-count">{leftDiff.length}</span>
        {reviewMode && changeBlocks?.[0] && (
          <button
            type="button"
            data-testid="accept-first"
            onClick={() => onAccept?.(changeBlocks[0].id)}
          >
            Accept
            {" "}
            {reviewStates?.[changeBlocks[0].id] || "pending"}
          </button>
        )}
        {reviewMode && changeBlocks?.[0] && (
          <button
            type="button"
            data-testid="reject-first"
            onClick={() => onReject?.(changeBlocks[0].id)}
          >
            Reject
          </button>
        )}
      </div>
    );
  },
}));

const { default: VirtualDiffViewer } = await import("../index");

const oldValue = { name: "Alice", age: 25, city: "SF" };
const newValue = { name: "Alice", age: 26, city: "NYC", country: "US" };

function lastReviewPayload(fn: ReturnType<typeof mock>): ReviewPayload {
  const calls = fn.mock.calls as unknown as Array<[ReviewPayload]>;
  const last = calls.at(-1);
  if (!last) {
    throw new Error("onReviewChange was not called");
  }
  return last[0];
}

afterEach(() => {
  cleanup();
});

describe("VirtualizedDiffViewer navigation & review", () => {
  test("ref nextChange / previousChange / getCurrentChange navigate change blocks", async () => {
    const ref = createRef<VirtualDiffViewerRef>();
    render(
      <VirtualDiffViewer
        ref={ref}
        oldValue={oldValue}
        newValue={newValue}
        height={400}
      />,
    );

    await waitFor(() => {
      expect(ref.current).not.toBeNull();
    });

    let first: ChangeBlock | null = null;
    let second: ChangeBlock | null = null;
    let prev: ChangeBlock | null = null;

    act(() => {
      first = ref.current!.nextChange();
    });
    expect(first).not.toBeNull();
    expect(ref.current!.getCurrentChange()?.id).toBe(first!.id);

    act(() => {
      second = ref.current!.nextChange();
    });
    expect(second).not.toBeNull();

    act(() => {
      prev = ref.current!.previousChange();
    });
    expect(prev!.id).toBe(first!.id);
  });

  test("expandAll and collapseAll are callable via ref", async () => {
    const ref = createRef<VirtualDiffViewerRef>();
    render(
      <VirtualDiffViewer
        ref={ref}
        oldValue={oldValue}
        newValue={newValue}
        height={400}
      />,
    );

    await waitFor(() => {
      expect(ref.current).not.toBeNull();
    });

    act(() => {
      ref.current!.expandAll();
      ref.current!.collapseAll();
    });
  });

  test("accept/reject updates onReviewChange merged JSON", async () => {
    const ref = createRef<VirtualDiffViewerRef>();
    const onReviewChange = mock((_payload: ReviewPayload) => {});

    render(
      <VirtualDiffViewer
        ref={ref}
        oldValue={{ a: 1 }}
        newValue={{ a: 2 }}
        height={400}
        reviewMode
        onReviewChange={onReviewChange}
      />,
    );

    await waitFor(() => {
      expect(onReviewChange).toHaveBeenCalled();
    });

    expect(lastReviewPayload(onReviewChange).mergedJson).toEqual({ a: 1 });

    act(() => {
      ref.current!.acceptAll();
    });

    await waitFor(() => {
      const latest = lastReviewPayload(onReviewChange);
      expect(latest.mergedJson).toEqual({ a: 2 });
      expect(Object.values(latest.reviewStates).every(s => s === "accepted")).toBe(true);
    });

    act(() => {
      ref.current!.rejectAll();
    });

    await waitFor(() => {
      const latest = lastReviewPayload(onReviewChange);
      expect(latest.mergedJson).toEqual({ a: 1 });
      expect(Object.values(latest.reviewStates).every(s => s === "rejected")).toBe(true);
    });
  });

  test("keyboard shortcuts navigate and accept/reject in review mode", async () => {
    const ref = createRef<VirtualDiffViewerRef>();
    const onReviewChange = mock((_payload: ReviewPayload) => {});

    const { container } = render(
      <VirtualDiffViewer
        ref={ref}
        oldValue={{ a: 1, b: 2 }}
        newValue={{ a: 9, b: 8 }}
        height={400}
        reviewMode
        onReviewChange={onReviewChange}
      />,
    );

    await waitFor(() => {
      expect(ref.current).not.toBeNull();
    });

    const root = container.querySelector(".diff-viewer-container") as HTMLElement;
    expect(root).toBeTruthy();
    root.focus();

    act(() => {
      fireEvent.keyDown(root, { key: "j" });
    });
    await waitFor(() => {
      expect(ref.current!.getCurrentChange()).not.toBeNull();
    });

    const current = ref.current!.getCurrentChange();
    act(() => {
      fireEvent.keyDown(root, { key: "a" });
    });

    await waitFor(() => {
      expect(lastReviewPayload(onReviewChange).reviewStates[current!.id]).toBe("accepted");
    });

    act(() => {
      fireEvent.keyDown(root, { key: "r" });
    });

    await waitFor(() => {
      expect(lastReviewPayload(onReviewChange).reviewStates[current!.id]).toBe("rejected");
    });

    act(() => {
      fireEvent.keyDown(root, { key: "k" });
    });
    expect(ref.current!.getCurrentChange()).not.toBeNull();
  });
});
