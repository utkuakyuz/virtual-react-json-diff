# virtual-react-json-diff

[![NPM version][npm-image]][npm-url]
[![Downloads][download-badge]][npm-url]
![bundle size](https://badgen.net/bundlephobia/minzip/virtual-react-json-diff)
[![BuyMeACoffee](https://raw.githubusercontent.com/pachadotdev/buymeacoffee-badges/main/bmc-yellow.svg)](https://www.buymeacoffee.com/utkuakyuz)

**GitHub-style JSON review with selective merge.**

A virtualized React component for comparing, reviewing, and selectively merging large JSON objects — accept/reject change blocks like a pull request, get a live merged result, and stay fast on tens of thousands of lines.

👉 [Live demo](https://virtual-react-json-diff.netlify.app)

![Feature walkthrough](https://raw.githubusercontent.com/utkuakyuz/virtual-react-json-diff/main/public/features-demo.gif)

## Installation

```bash
npm install virtual-react-json-diff
```

## Quick start

```jsx
import { VirtualDiffViewer } from "virtual-react-json-diff";

<VirtualDiffViewer
  oldValue={oldData}
  newValue={newData}
  height={600}
  reviewMode
  onReviewChange={({ mergedJson }) => console.log(mergedJson)}
/>
```

## Features

* **Review & merge** — accept/reject change blocks; receive live `mergedJson`
* **Virtualized** — smooth scrolling for huge diffs via `react-window`
* **Collapse unchanged regions** — scan real edits first; expand without mounting the whole tree
* **Dual minimap** — jump across the file with visual change markers
* **Search** — highlight and navigate matches
* **Programmatic API** — `ref` methods for next/prev change, paths, expand/collapse, accept/reject all
* **Object-aware diffs** — `compare-key` array matching + object-level stats
* **Comparison controls** — ignore keys/paths, `strict` / `loose` / `type-aware` strategies

## Why this library?

Most JSON diff viewers are fine for small snippets and fall apart in production dashboards:

| Pain | What usually happens | Here |
| ---- | -------------------- | ---- |
| Large payloads | UI freezes / huge DOM | Virtualized rows stay responsive |
| Hard to *resolve* | You can only look, not merge | GitHub-style accept/reject → merged JSON |
| Dense unchanged noise | You scroll forever | Unchanged regions collapse by default |
| Array reshuffles | Noisy line diffs | Optional object-key matching + object stats |

Built for internal tools, config review UIs, CMS/migration previews, and any place you need **GitHub for JSON**.

## Comparison

How this sits next to common options (honest, feature-level — not a benchmark):

| | **virtual-react-json-diff** | **json-diff-kit** `Viewer` | **Text diff viewers** (e.g. `react-diff-viewer`) |
| --- | :---: | :---: | :---: |
| Built for structured JSON | ✅ | ✅ | ❌ (line/text oriented) |
| Virtualized scrolling | ✅ | ✅ | ❌ / rare |
| Collapse unchanged regions | ✅ | ❌ | ❌ |
| Dual minimap | ✅ | ❌ | ❌ |
| Search + jump | ✅ | ❌ | varies |
| Accept / reject → merged JSON | ✅ | ❌ | ❌ |
| Ignore keys / paths | ✅ | via differ config | ❌ |
| Object-key array matching | ✅ | ✅ | ❌ |
| Extra editor weight (Monaco, etc.) | ❌ | ❌ | ❌ |

If you only need a small side-by-side preview, `json-diff-kit` alone is often enough. If you need **GitHub-style review + selective merge on large JSON**, this package fills that gap.

## Advanced features

### Review & merge mode

![Review Mode Screenshot](https://raw.githubusercontent.com/utkuakyuz/virtual-react-json-diff/main/public/image-review-mode.png)

1. Enable `reviewMode` — each change block gets accept / reject controls
2. Accept → take the **right (new)** side; reject/pending → keep the **left (old)** side
3. Listen to `onReviewChange` for `{ reviewStates, mergedJson }`

Change blocks are hunks (for example a nested object), not arbitrary single lines — so decisions keep valid JSON structure.

Optional `reviewGroupingMode`: `"semantic"` (default), `"line"`, or `"block"`.

### Expand & collapse (with virtualization)

Unchanged stretches collapse by default. Use **Show Hidden Lines**, or the ref API (`expandPath`, `expandAll`, `collapseAll`). Expanding does **not** mount the entire JSON into the DOM — only near-viewport rows render.

### Diff configuration layers

* **`differOptions`** — how the diff is generated (arrays, depth, keys) → passed to [json-diff-kit](https://www.npmjs.com/package/json-diff-kit)
* **`comparisonOptions`** — what is ignored / how values match (`ignoreKeys`, `ignorePaths`, `compareStrategy`)

```jsx
<VirtualDiffViewer
  oldValue={oldData}
  newValue={newData}
  height={600}
  differOptions={{ arrayDiffMethod: "compare-key", compareKey: "id" }}
  comparisonOptions={{ ignoreKeys: ["updatedAt"], compareStrategy: "type-aware" }}
/>
```

## API

### Required props

| Prop       | Type     | Description                       |
| ---------- | -------- | --------------------------------- |
| `oldValue` | `object` | Original JSON object (left side). |
| `newValue` | `object` | Updated JSON object (right side). |

### Layout & display

| Prop         | Type     | Default | Description                                     |
| ------------ | -------- | ------- | ----------------------------------------------- |
| `height`     | `number` | —       | Height of the diff viewer in pixels.            |
| `leftTitle`  | `string` | —       | Optional title above the left panel.            |
| `rightTitle` | `string` | —       | Optional title above the right panel.           |
| `className`  | `string` | —       | Custom CSS class on the root container.         |

### Search & navigation

| Prop                | Type                      | Default | Description                                     |
| ------------------- | ------------------------- | ------- | ----------------------------------------------- |
| `hideSearch`        | `boolean`                 | `false` | Hide the search bar.                            |
| `searchTerm`        | `string`                  | `""`    | Initial search term.                            |
| `onSearchMatch`     | `(index: number) => void` | —       | Fired when a search match is selected.          |
| `showSingleMinimap` | `boolean`                 | `false` | Single minimap instead of dual.                 |
| `miniMapWidth`      | `number`                  | `40`    | Width of each minimap in pixels.                |

### Statistics

| Prop                   | Type      | Default | Description                                                          |
| ---------------------- | --------- | ------- | -------------------------------------------------------------------- |
| `showLineCount`        | `boolean` | `false` | Show added / removed / modified **line** counts.                     |
| `showObjectCountStats` | `boolean` | `false` | Object-level stats (needs `arrayDiffMethod: "compare-key"` + key).   |

### Diff configuration

| Prop                | Type                    | Default            | Description                                        |
| ------------------- | ----------------------- | ------------------ | -------------------------------------------------- |
| `differOptions`     | `DifferOptions`         | Engine defaults    | How the diff is generated.                         |
| `comparisonOptions` | `DiffComparisonOptions` | —                  | What is compared / ignored.                        |
| `inlineDiffOptions` | `InlineDiffOptions`     | `{ mode: "char" }` | Inline diff rendering.                             |
| `getDiffData`       | `(diff) => void`        | —                  | Raw `[DiffResult[], DiffResult[]]` callback.       |

### Review & merge

| Prop                 | Type                                                                 | Default      | Description                                         |
| -------------------- | -------------------------------------------------------------------- | ------------ | --------------------------------------------------- |
| `reviewMode`         | `boolean`                                                            | `false`      | Enable accept/reject UI + review shortcuts.         |
| `reviewGroupingMode` | `"semantic" \| "line" \| "block"`                                    | `"semantic"` | How change blocks are grouped.                      |
| `onAcceptChange`     | `(change: ChangeBlock) => void`                                      | —            | Fired when a block is accepted.                     |
| `onRejectChange`     | `(change: ChangeBlock) => void`                                      | —            | Fired when a block is rejected.                     |
| `onReviewChange`     | `(state: { reviewStates; mergedJson }) => void`                      | —            | Fired when review state or merged JSON updates.     |
| `reviewClassNames`   | `{ accepted?; rejected?; pending? }`                                 | —            | Optional row class names.                           |

```jsx
import { useRef, useState } from "react";
import { VirtualDiffViewer, type VirtualDiffViewerRef } from "virtual-react-json-diff";

function ReviewExample({ oldData, newData }) {
  const viewerRef = useRef(null);
  const [mergedJson, setMergedJson] = useState(null);

  return (
    <>
      <button onClick={() => viewerRef.current?.previousChange()}>Prev</button>
      <button onClick={() => viewerRef.current?.nextChange()}>Next</button>
      <button onClick={() => viewerRef.current?.acceptAll()}>Accept all</button>

      <VirtualDiffViewer
        ref={viewerRef}
        oldValue={oldData}
        newValue={newData}
        height={600}
        reviewMode
        onReviewChange={({ mergedJson }) => setMergedJson(mergedJson)}
      />

      <pre>{JSON.stringify(mergedJson, null, 2)}</pre>
    </>
  );
}
```

#### `VirtualDiffViewerRef`

| Method               | Returns               | Description                                      |
| -------------------- | --------------------- | ------------------------------------------------ |
| `nextChange()`       | `ChangeBlock \| null` | Next change block.                               |
| `previousChange()`   | `ChangeBlock \| null` | Previous change block.                           |
| `scrollToChange(i)`  | `void`                | Jump to change index `i`.                        |
| `scrollToPath(path)` | `boolean`             | Expand if needed, scroll to JSON path.           |
| `expandPath(path)`   | `boolean`             | Expand collapsed segment containing `path`.      |
| `collapsePath(path)` | `boolean`             | Collapse equal segment containing `path`.        |
| `expandAll()`        | `void`                | Expand all equal segments (still virtualized).   |
| `collapseAll()`      | `void`                | Collapse equal segments again.                   |
| `getCurrentChange()` | `ChangeBlock \| null` | Currently selected change.                       |
| `acceptAll()`        | `void`                | Accept every change (review mode).               |
| `rejectAll()`        | `void`                | Reject every change (review mode).               |

#### Keyboard shortcuts

Focus the viewer first.

| Key                          | Action                |
| ---------------------------- | --------------------- |
| `ArrowDown` / `j`            | Next change           |
| `ArrowUp` / `k`              | Previous change       |
| `Enter` / `a` (review mode)  | Accept current change |
| `Escape` / `r` (review mode) | Reject current change |

## Styling

Root class: `diff-viewer-container`. Pass `className` for theming.

## Releases

Publishing is automated on `main`:

1. Bump the **root** `package.json` `version` and merge to `main`
2. CI publishes to npm when that version changes
3. CI then updates `demo/package.json` and pushes a `[skip ci]` commit (does not republish)

Requires the `NPM_TOKEN` GitHub Actions secret (npm **Automation** token recommended).

## Acknowledgements

Built on [json-diff-kit](https://www.npmjs.com/package/json-diff-kit).

## License

MIT © Utku Akyüz

## Contributing

Pull requests, suggestions, and issues are welcome!

[npm-url]: https://npmjs.org/package/virtual-react-json-diff
[npm-image]: https://img.shields.io/npm/v/virtual-react-json-diff.svg
[download-badge]: https://img.shields.io/npm/dm/virtual-react-json-diff.svg
