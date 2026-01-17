export { default as VirtualDiffViewer } from "./components/DiffViewer";
export type {
  CompareStrategy,
  DiffComparisonOptions,
} from "./components/DiffViewer/types";
export { calculateObjectCountStats } from "./components/DiffViewer/utils/objectCountUtils";
export { Differ, type DiffResult } from "json-diff-kit";
