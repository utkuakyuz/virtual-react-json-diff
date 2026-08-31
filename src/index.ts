export { default as VirtualDiffViewer } from "./components/DiffViewer";
export type {
  ChangeBlock,
  CompareStrategy,
  DiffComparisonOptions,
  DiffTheme,
  ReviewGroupingMode,
  ReviewState,
  VirtualDiffViewerRef,
} from "./components/DiffViewer/types";
export { calculateObjectCountStats } from "./components/DiffViewer/utils/objectCountUtils";
export { DIFF_THEMES } from "./components/DiffViewer/utils/themes";
export { Differ, type DiffResult } from "json-diff-kit";
