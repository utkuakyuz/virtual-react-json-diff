# 📘 json-diff-view-plus

A high-performance React component for visually comparing large JSON objects. Built on top of [json-diff-kit](https://www.npmjs.com/package/json-diff-kit), this viewer supports:

- 🧠 Virtual scrolling for better performance (especially for large diffs)
- 🔍 Search functionality
- 🗺️ Mini Map
- 🎨 Custom theming
- ⚛️ Optimized for React (uses `react-window`)

This component is developed for dealing with thousands of lines of Json Files, and seamlessly compare then render them on UI


## 🚀 Features

- **Compare Large JSON Objects** – Handles big files without freezing the UI
- **Virtualized Rendering** – Efficient DOM updates using `react-window`
- **Search Highlighting** – Find matches and scroll directly to them
- **Mini Map** – A minimap of Json Diff, scaled to better see comparison result
- **Customizable Styles** – Add your own class names and styles easily (checkout JsonDiffCustomTheme.css)

## Demo 

To see how it works, demo available here: https://json-diff-view-plus.netlify.app

## 📦 Installation

```bash
npm install json-diff-view-plus
# or
yarn add json-diff-view-plus
``` 

## Example Screenshot

The theme is fully customizable, all colors can be changed. (And soon new themes will be available)

![ExampleScreenshot](https://raw.githubusercontent.com/utkuakyuz/json-diff-view-plus/main/public/image.png)

## Usage

To change Diff methods please see DifferOptions. By default json-diff-view-plus uses following configuration
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
import { VirtualDiffViewer } from "json-diff-view-plus";

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


## 🙌 Acknowledgements

Built on top of the awesome json-diff-kit.

## 📄 License

MIT © Utku Akyüz
🛠️ Contributing

---

Pull requests, suggestions, and issues are welcome!
Check out the issues or open a PR.