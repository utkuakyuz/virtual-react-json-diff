# 📘 virtual-react-json-diff

[![NPM version][npm-image]][npm-url]
[![Downloads][download-badge]][npm-url]
![bundle size](https://badgen.net/bundlephobia/minzip/virtual-react-json-diff)
[![BuyMeACoffee](https://raw.githubusercontent.com/pachadotdev/buymeacoffee-badges/main/bmc-yellow.svg)](https://www.buymeacoffee.com/utkuakyuz)

👉 [Try it now](https://virtual-react-json-diff.netlify.app) (See the New Demo Page Including AceEditor)

A high-performance React component for visually comparing large JSON objects. Built on top of [json-diff-kit](https://www.npmjs.com/package/json-diff-kit), this viewer supports:

- Virtual scrolling for better performance (especially for large diffs)
- Custom theming (Soon new themes will be available)
- Dual Mini Map
- 🔍 Search functionality
- ⚛️ Optimized for React (uses `react-window`)

This component is developed for dealing with thousands of lines of Json Files, and seamlessly compare then render them on UI. Json Compare is a concept that has insufficient FE components available. This component brings solution to the issues of current diff viewers. Virtualized scroll gives a smooth experience while dual minimap and search ability simplifies the process of comparing JSON objects.

## Features

- **Compare Large JSON Objects** – Handles big files without freezing the UI
- **Virtualized Rendering** – Efficient DOM updates using `react-window`
- **Search Highlighting** – Find matches and scroll directly to them
- **Mini Map** – Dual scrollable minimap of Json Diff, scaled to better see comparison result
- **Customizable Styles** – Add your own class names and styles easily (checkout JsonDiffCustomTheme.css)

## Demo

To see how it works, demo available here: https://virtual-react-json-diff.netlify.app

## 📦 Installation

```bash
npm install virtual-react-json-diff
# or
yarn add virtual-react-json-diff
# or
pnpm add virtual-react-json-diff
```

## Example Screenshot

The theme is fully customizable, all colors can be changed. (And soon new themes will be available)

![ExampleScreenshot](https://raw.githubusercontent.com/utkuakyuz/virtual-react-json-diff/main/public/image-1.0.11.png)

## Usage

Modify DifferOptions and InlineDiffOptions and see the output.

Dual Minimap is defaultly shown, to hide middle minimap, just pass ShowSingleMinimap prop to Viewer.

To change Diff methods please see DifferOptions. By default virtual-react-json-diff uses following configuration.

```
new Differ({
  detectCircular: true,
  maxDepth: 20,
  showModifications: true,
  arrayDiffMethod: "lcs",
  preserveKeyOrder: "before",
  ...differOptions,
}),
```

Simply pass your json objects into Viewer Component. It will find differences and show.

```
import React from "react";
import { VirtualDiffViewer } from "virtual-react-json-diff";

const oldData = { name: "Alice", age: 25 };
const newData = { name: "Alice", age: 26, city: "NYC" };

export default function App() {
  return (
    <VirtualDiffViewer
      oldValue={oldData}
      newValue={newData}
      height={600}
      className="my-custom-diff"
    />
  );
}
```

The component exposes a root container with the class:

```
<div class="diff-viewer-container">...</div>
```

You can pass your own class name via the className prop to apply custom themes.

## Props

| Prop                | Type                      | Default            | Description                                                            |
| ------------------- | ------------------------- | ------------------ | ---------------------------------------------------------------------- |
| `oldValue`          | `object`                  | —                  | The original JSON object to compare (left side).                       |
| `newValue`          | `object`                  | —                  | The updated JSON object to compare (right side).                       |
| `height`            | `number`                  | —                  | Height of the diff viewer in pixels.                                   |
| `hideSearch`        | `boolean`                 | `false`            | Hides the search bar if set to `true`.                                 |
| `searchTerm`        | `string`                  | `""`               | Initial search keyword to highlight within the diff.                   |
| `leftTitle`         | `string`                  | —                  | Optional title to display above the left diff panel.                   |
| `rightTitle`        | `string`                  | —                  | Optional title to display above the right diff panel.                  |
| `onSearchMatch`     | `(index: number) => void` | —                  | Callback fired when a search match is found. Receives the match index. |
| `differOptions`     | `DifferOptions`           | `Given Above`      | Advanced options passed to the diffing engine.                         |
| `showSingleMinimap` | `boolean`                 | `false`            | If `true`, shows only one minimap instead of two.                      |
| `className`         | `string`                  | —                  | Custom CSS class for styling the viewer container.                     |
| `miniMapWidth`      | `number`                  | `40`               | Width of each minimap in pixels.                                       |
| `inlineDiffOptions` | `InlineDiffOptions`       | `{'mode': 'char'}` | Options for fine-tuning inline diff rendering.                         |

## 🙌 Acknowledgements

Built on top of the awesome json-diff-kit.

## 📄 License

MIT © Utku Akyüz

## 🛠️ Contributing

Pull requests, suggestions, and issues are welcome!
Check out the issues or open a PR.

[npm-url]: https://npmjs.org/package/virtual-react-json-diff
[npm-image]: https://img.shields.io/npm/v/virtual-react-json-diff.svg
[download-badge]: https://img.shields.io/npm/dm/virtual-react-json-diff.svg
