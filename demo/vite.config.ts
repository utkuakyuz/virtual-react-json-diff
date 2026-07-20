import path from "node:path";
import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const demoRoot = path.dirname(fileURLToPath(import.meta.url));

/**
 * Local `file:../` link resolves `react` from the library root (18.x) while
 * the demo app uses React 19 — Vite then mixes two React copies and crashes.
 * Force a single React from demo/node_modules.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: {
      react: path.resolve(demoRoot, "node_modules/react"),
      "react-dom": path.resolve(demoRoot, "node_modules/react-dom"),
      "react/jsx-runtime": path.resolve(demoRoot, "node_modules/react/jsx-runtime.js"),
      "react/jsx-dev-runtime": path.resolve(
        demoRoot,
        "node_modules/react/jsx-dev-runtime.js",
      ),
    },
  },
});
