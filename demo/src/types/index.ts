import type { DifferOptions } from "json-diff-kit";

export type Config = {
  // Main Configuration
  className: string;
  leftTitle: string;
  rightTitle: string;
  miniMapWidth: number;
  hideSearch: boolean;
  height: number;

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
};
