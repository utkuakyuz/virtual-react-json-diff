import type { DifferOptions } from "json-diff-kit";
import type { CompareStrategy } from "virtual-react-json-diff";

export type Config = {
  // Main Configuration
  className: string;
  leftTitle: string;
  rightTitle: string;
  miniMapWidth: number;
  hideSearch: boolean;
  height: number;
  showLineCount: boolean;
  showObjectCountStats: boolean;

  // Differ Configuration
  detectCircular: boolean;
  maxDepth: number;
  showModifications: boolean;
  arrayDiffMethod: DifferOptions["arrayDiffMethod"];
  compareKey: string;
  ignoreCase: boolean;
  ignoreCaseForKey: boolean;
  recursiveEqual: boolean;
  preserveKeyOrder: DifferOptions["preserveKeyOrder"];
  inlineDiffMode: "word" | "char";

  // Comparison Options
  ignorePaths: string;
  ignoreKeys: string;
  compareStrategy: CompareStrategy;
};
