# Architecture

This document describes the current architecture of `virtual-react-json-diff` and outlines future directions for the project.

## Overview

`virtual-react-json-diff` is a high-performance React component for comparing and visualizing differences between large JSON objects. It leverages virtualized rendering to handle tens of thousands of lines without freezing the UI.

**Key responsibilities:**
- Generate diff data from two JSON objects
- Transform diff data into a virtualized view
- Provide search, change-block navigation, and statistics
- Optional review/merge mode (accept/reject hunks → merged JSON)
- Imperative ref API (`scrollToPath`, expand/collapse, accept/reject all)
- Handle user interaction (expand/collapse, scrolling, minimap, keyboard)

**What it is not:**
- A generic JSON diff algorithm (delegated to `json-diff-kit`)
- A standalone CLI tool
- A framework-agnostic library (currently React-only)
- A full VCS-style 3-way merge or patch-file generator

---

## Current Architecture

### Technology Stack

| Layer | Technology |
|-------|-----------|
| **Diff Engine** | `json-diff-kit` |
| **Virtualization** | `react-window` (VariableSizeList) |
| **UI Framework** | React 18+ |
| **Build System** | Rollup |

### Component Hierarchy

```
VirtualizedDiffViewer (forwardRef → VirtualDiffViewerRef)
├── SearchboxHolder
├── LineCountDisplay
├── ObjectCountDisplay
├── VirtualDiffGrid
│   └── react-window (VariableSizeList)
│       └── Row Renderer
│           ├── Review gutter (accept/reject) when reviewMode
│           └── Left / Right panes
└── DiffMinimap (x2; padded when reviewMode)
```

### Directory Structure

```
src/
├── index.ts                     # Public API (viewer, Differ, ChangeBlock, ref types)
└── components/
    └── DiffViewer/
        ├── components/          # UI Components
        │   ├── VirtualizedDiffViewer.tsx  # Main orchestrator + ref API
        │   ├── VirtualDiffGrid.tsx        # Virtualized list wrapper
        │   ├── DiffMinimap.tsx            # Visual navigation
        │   └── ...
        ├── hooks/               # React-specific logic
        │   ├── useSearch.ts
        │   ├── useRowHeights.ts           # Sparse cache keyed by data-index
        │   └── ...
        ├── utils/               # Core orchestration logic
        │   ├── preprocessDiff.ts           # Segment generation + view building
        │   ├── pathAndChangeUtils.ts       # Paths, ChangeBlocks, merge JSON
        │   ├── diffComparisonOptions.ts    # Value normalization
        │   ├── lineCountUtils.ts           # Statistics
        │   ├── objectCountUtils.ts         # Object-level stats
        │   └── json-diff/
        │       ├── row-renderer-grid.tsx   # JSX rendering + review UI
        │       ├── get-inline-diff.ts      # Inline diff logic
        │       └── ...
        ├── types/               # TypeScript definitions
        └── __tests__/           # Component + util tests (Bun + happy-dom)
```

---

## Diff Lifecycle

The diff process follows a clear pipeline from raw input to rendered UI:

### Step 1: Input Preprocessing (Optional)

**Location:** `diffComparisonOptions.ts`

If `comparisonOptions` are provided:
- Ignore specific keys or paths (`ignoreKeys`, `ignorePaths`)
- Normalize values based on comparison strategy (`strict`, `loose`, `type-aware`)
- Return preprocessed JSON objects ready for diffing

**Example:**
```typescript
const processedOld = preprocessObjectForDiff(oldValue, {
  ignoreKeys: ["updatedAt"],
  compareStrategy: "type-aware"
});
```

### Step 2: Diff Generation

**Location:** `VirtualizedDiffViewer.tsx`

- Create or reuse a `Differ` instance from `json-diff-kit`
- Pass processed objects to `differ.diff(old, new)`
- Receive raw diff results: `[leftDiff, rightDiff]`

**Output:** Two arrays of `DiffResult[]` representing line-by-line changes

### Step 3: Segment Generation

**Location:** `preprocessDiff.ts` → `generateSegments()`

- Analyze the left diff to identify "equal" vs "changed" blocks
- Split the diff into segments (continuous blocks of equal or changed lines)
- Track segment metadata: `{ start, end, isEqual, isExpanded? }`

**Purpose:** Enable efficient expand/collapse of unchanged regions

### Step 4: View Building

**Location:** `preprocessDiff.ts` → `buildViewFromSegments()`

- Walk through segments
- For changed segments: include all lines
- For equal segments:
  - If small or expanded: include all lines
  - If large and collapsed: include top/bottom context + collapsed marker
- Preserve `originalIndex` on each row so later steps can map virtual list rows back to raw diff indices
- Generate `DiffRowOrCollapsed[]` for both left and right views

**Output:** Two virtualized views ready for rendering

### Step 5: Paths & Change Blocks

**Location:** `pathAndChangeUtils.ts`

- `computePaths()` — derive JSONPath-like strings per raw diff line
- `getChangeBlocks()` — group consecutive non-equal lines into `ChangeBlock` hunks (`add` / `remove` / `modify`)
- Used by programmatic navigation (`nextChange`, `scrollToPath`, …) and review mode

### Step 6: Statistics Calculation

**Location:** `lineCountUtils.ts`, `objectCountUtils.ts`

- **Line stats:** Count added/removed/modified lines from raw diff
- **Object stats:** When using `compare-key` array diffing, recursively extract object arrays and count changes at the object level

### Step 7: Search Indexing (Optional)

**Location:** `useSearch.ts`

- If search is enabled, index text content from both views
- Track line numbers of matches
- Provide navigation functions (`next`, `previous`)

### Step 8: Review / Merge (Optional)

**Location:** `VirtualizedDiffViewer.tsx` + `pathAndChangeUtils.ts` → `generateMergedJson()`

When `reviewMode` is enabled:
- Track per-block `ReviewState` (`pending` | `accepted` | `rejected`)
- On accept/reject (UI, keyboard, or ref API), rebuild a merged JSON by selecting left vs right lines per block
- Notify host via `onReviewChange({ reviewStates, mergedJson })`
- `onReviewChange` is held in a ref so parent callbacks do not re-trigger an update loop

### Step 9: Virtualized Rendering

**Location:** `VirtualDiffGrid.tsx` → `row-renderer-grid.tsx`

- Use `react-window` to render only visible rows
- Match review/highlight state via `originalIndex` (not virtual list index)
- For each row:
  - Detect row type (`add`, `remove`, `modify`, `equal`, `collapsed`)
  - Apply syntax highlighting and review status classes
  - Render inline diffs for `modify` rows
  - Render accept/reject controls on the first line of each change block
  - Render expand/collapse controls for `collapsed` rows

### Step 10: Minimap Drawing

**Location:** `DiffMinimap.tsx`, `useMinimapDraw.ts`

- Draw a canvas-based overview of the entire diff
- Highlight changes, search results, and viewport position
- Enable jump-to-location on click
- When `reviewMode` is on, overlay gets left padding so minimaps stay aligned with panes

---

## Responsibility Boundaries

The project is composed of three logical layers, each with distinct responsibilities:

### Layer 1: Diff Engine (`json-diff-kit`)

**Responsibilities:**
- Core diff algorithm (Myers diff, LCS)
- Support for different array comparison methods (`compare-key`, `lcs`, `unorder-normal`)
- Detect circular references
- Provide raw diff output

**This library does NOT:**
- Generate diffs from scratch
- Implement diffing algorithms

**Boundary:**  
Input: Two JSON objects + `DifferOptions`  
Output: `[DiffResult[], DiffResult[]]`

### Layer 2: Diff Orchestration (This Library)

**Responsibilities:**
- Preprocess input objects (ignoreKeys, normalization)
- Segment generation (collapse/expand logic)
- View building from segments
- Path computation and change-block grouping
- Selective merge JSON from review states
- Statistics calculation (line counts, object counts)
- Search and navigation logic
- Row height calculation for virtualization

**This layer is mostly framework-agnostic.** The logic in `utils/` could theoretically be used with Vue, Svelte, or vanilla JS.

**Files:**
- `utils/preprocessDiff.ts`
- `utils/pathAndChangeUtils.ts`
- `utils/diffComparisonOptions.ts`
- `utils/lineCountUtils.ts`
- `utils/objectCountUtils.ts`
- `utils/diffSearchUtils.ts`

**Boundary:**  
Input: `DiffResult[]` + user options (+ optional review states)  
Output: Structured view models, change blocks, optional merged JSON

### Layer 3: UI Adapter (React Components)

**Responsibilities:**
- Render JSX for each row type (including review gutter)
- Manage React state and lifecycle (`reviewStates`, active change index)
- Expose imperative `VirtualDiffViewerRef` API
- Integrate with `react-window`
- Handle user events (clicks, scrolls, keyboard: j/k, a/r, Enter/Escape)
- Draw canvas-based minimaps

**This layer is React-specific.**

**Files:**
- `components/VirtualizedDiffViewer.tsx`
- `components/VirtualDiffGrid.tsx`
- `components/DiffMinimap.tsx`
- `hooks/useSearch.ts`
- `hooks/useRowHeights.ts`
- `utils/json-diff/row-renderer-grid.tsx`

**Boundary:**  
Input: View models + React props  
Output: Rendered UI + callbacks / ref methods

---

## Future Architecture Vision (Headless Core)

### What "Headless" Means

A **headless library** is a UI-agnostic package that provides:
- Core business logic
- State management primitives
- Framework-independent functions

**Examples:**
- `@tanstack/table-core` (used by React Table, Vue Table, Solid Table)
- `downshift` (render props for autocomplete logic)
- `react-hook-form` core logic

### Why Headless?

**Current limitation:** The diff orchestration logic (Layer 2) is tightly coupled with React components (Layer 3). This prevents:
- Using the same logic in Vue, Svelte, Angular
- Building CLI tools or Node.js utilities
- Testing logic without React

**Benefits of headless architecture:**
- **Reusability:** Core logic can power React, Vue, Svelte adapters
- **Testability:** Business logic can be tested without React Testing Library
- **Flexibility:** Users can build custom UIs while reusing orchestration
- **Bundle Size:** Consumers can tree-shake unused features

### High-Level Approach

The vision is to refactor the codebase into three packages:

```
@virtual-json-diff/core          # Headless orchestration logic
@virtual-json-diff/react         # React adapter (current library)
@virtual-json-diff/vue           # Vue adapter (future)
```

**Core exports might include:**
- `createDiffEngine(options)` → stateful diff engine
- `preprocessObjects(old, new, options)` → normalized objects
- `generateSegments(diff)` → segment array
- `buildView(segments, diff)` → view model
- `getChangeBlocks(diff, paths)` → navigation/review hunks
- `generateMergedJson(diff, blocks, reviewStates)` → selective merge result
- `calculateStats(diff)` → statistics
- `createSearchIndex(view)` → search state

**React adapter would consume core:**
```typescript
import { createDiffEngine, generateSegments } from '@virtual-json-diff/core';
import { useMemo } from 'react';

function useDiffView(oldValue, newValue, options) {
  const engine = useMemo(() => createDiffEngine(options), [options]);
  const diff = useMemo(() => engine.diff(oldValue, newValue), [oldValue, newValue]);
  const segments = useMemo(() => generateSegments(diff[0]), [diff]);
  // ... render with react-window
}
```

### Important Notes

- **This is a future direction, not a breaking change**
- Current users of `virtual-react-json-diff` will continue to work
- The React adapter would be the default entry point
- Migration path TBD (likely major version bump)

---

## Non-Goals (For Now)

To avoid overcommitment and maintain focus, the following are **explicitly out of scope** for now:

### Not Planned

- **Multi-framework support in this repository:** Vue/Svelte adapters would be separate packages
- **CLI tool:** Diffing JSON from the command line
- **Patch-file / unified-diff export:** Generating `.patch` or applying external patches
- **3-way merge:** Comparing more than two objects (base / ours / theirs)
- **Non-JSON data:** XML, YAML, TOML diffing
- **Server-side rendering:** Full SSR/SSG support (may work but not tested)
- **Diff editing:** Inline modification of JSON text inside the viewer

### Already Supported (Do Not Treat As Future Work)

- **Selective review/merge:** Accept/reject change blocks and receive `mergedJson` via `onReviewChange`
- **Programmatic navigation:** Ref API + Arrow/j/k (and a/r in review mode)

### Might Consider Later

- **Horizontal scrolling:** Currently relies on word wrap
- **Line-level diffing for arrays:** Compact single-line diffs for small arrays
- **Undo/redo for review decisions:** History for accept/reject and expand/collapse
- **Custom diff algorithms:** Plugin system for alternative diff engines
- **Accessibility improvements:** Stronger screen reader / ARIA coverage beyond current keyboard shortcuts

---

## Contributing

If you're interested in contributing to the headless refactor or have ideas for the architecture, please open a GitHub issue to discuss before submitting a PR.

For general contributions, see [CONTRIBUTING.md](./CONTRIBUTING.md) (if it exists) or open an issue.
