import type { Meta, StoryObj } from "@storybook/react";
import type { DifferOptions } from "json-diff-kit";

import { VirtualDiffViewer } from "../..";
import json1 from "./testJsons/json1.json";
import json2 from "./testJsons/json2.json";

// Extend the component props to include individual differ options for Storybook
type StoryProps = React.ComponentProps<typeof VirtualDiffViewer> & {
  // Individual differ options for better Storybook controls
  detectCircular?: boolean;
  maxDepth?: number;
  showModifications?: boolean;
  arrayDiffMethod?: DifferOptions["arrayDiffMethod"];
  compareKey?: string;
  ignoreCase?: boolean;
  ignoreCaseForKey?: boolean;
  recursiveEqual?: boolean;
  preserveKeyOrder?: DifferOptions["preserveKeyOrder"];
};

const meta: Meta<StoryProps> = {
  title: "Example/VirtualDiffViewer",
  component: VirtualDiffViewer,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  argTypes: {
    searchTerm: {
      description: "CSS class name for the diff viewer container",
      control: "text",
      table: {
        disable: true,
        category: "Main Configuration",
      },
    },
    onSearchMatch: {
      description: "CSS class name for the diff viewer container",
      control: "text",
      table: {
        disable: true,
        category: "Main Configuration",
      },
    },
    inlineDiffOptions: {
      description: "CSS class name for the diff viewer container",
      control: "text",
      table: {
        disable: true,
        category: "Main Configuration",
      },
    },
    className: {
      description: "CSS class name for the diff viewer container",
      control: "text",
      table: { category: "Main Configuration" },
    },
    leftTitle: {
      description: "Title for the left side of the diff viewer",
      control: "text",
      table: { category: "Main Configuration" },
    },
    rightTitle: {
      description: "Title for the right side of the diff viewer",
      control: "text",
      table: { category: "Main Configuration" },
    },
    miniMapWidth: {
      description: "Width of Minimap (default 20)",
      control: "number",
      table: { category: "Main Configuration" },
    },
    hideSearch: {
      description: "Whether to hide the search functionality",
      control: "boolean",
      table: { category: "Main Configuration" },
    },
    height: {
      description: "Height of the diff viewer in pixels",
      control: "number",
      table: { category: "Main Configuration" },
    },
    oldValue: {
      description: "The original JSON object to compare",
      control: "object",
      table: {
        disable: true,
        category: "Main Configuration",
      },
    },
    newValue: {
      description: "The new JSON object to compare against",
      control: "object",
      table: {
        disable: true,
      },
    },

    // Break down differOptions into individual controls
    detectCircular: {
      name: "🔍 Detect circular references",
      description: "Whether to detect circular reference in source objects before diff starts",
      control: "boolean",
      table: {
        category: "Differ Configuration",
      },
    },
    maxDepth: {
      name: "📏 Max depth",
      description: "Maximum depth for comparison (Infinity means no limit)",
      control: { type: "number", min: 1, max: 100, step: 1 },
      table: {
        category: "Differ Configuration",
      },
    },
    showModifications: {
      name: "✏️ Show modifications",
      description: "Support recognizing modifications (* modified sign)",
      control: "boolean",
      table: {
        category: "Differ Configuration",
      },
    },
    arrayDiffMethod: {
      name: "📊 Array diff method",
      description: "The way to diff arrays",
      control: {
        type: "select",
      },
      options: ["normal", "lcs", "unorder-normal", "unorder-lcs", "compare-key"],
      table: {
        category: "Differ Configuration",
      },
    },
    compareKey: {
      name: "🔑 Compare key",
      description: "Key to use for matching objects in arrays (only for compare-key method)",
      control: "text",
      if: { arg: "arrayDiffMethod", eq: "compare-key" },
      table: {
        category: "Differ Configuration",
      },
    },
    ignoreCase: {
      name: "🔤 Ignore case",
      description: "Whether to ignore case when comparing strings",
      control: "boolean",
      table: {
        category: "Differ Configuration",
      },
    },
    ignoreCaseForKey: {
      name: "🔤 Ignore case for key",
      description: "Whether to ignore case when comparing object keys",
      control: "boolean",
      table: {
        category: "Differ Configuration",
      },
    },
    recursiveEqual: {
      name: "🔄 Recursive equal",
      description: "Whether to use recursive equal to compare objects",
      control: "boolean",
      table: {
        category: "Differ Configuration",
      },
    },
    preserveKeyOrder: {
      name: "📑 Preserve key order",
      description: "Whether to preserve key order from input objects",
      control: {
        type: "select",
      },
      options: [undefined, "before", "after"],
      mapping: {
        "Sort (default)": undefined,
        "Before": "before",
        "After": "after",
      },
      table: {
        category: "Differ Configuration",
      },
    },

    // Hide the original differOptions control since we're breaking it down
    differOptions: {
      table: {
        disable: true,
      },
    },
  },
};

export default meta;
type Story = StoryObj<StoryProps>;

export const Primary: Story = {
  args: {
    className: "diff-viewer-container",
    leftTitle: "Left Title",
    rightTitle: "Right Title",
    hideSearch: false,
    height: 500,
    miniMapWidth: 20,
    oldValue: json1,
    newValue: json2,

    // Default values for differ configuration
    detectCircular: true,
    maxDepth: 999, // Use 999 instead of Infinity for better control compatibility
    showModifications: true,
    arrayDiffMethod: "lcs",
    compareKey: "oid",
    ignoreCase: false,
    ignoreCaseForKey: false,
    recursiveEqual: false,
    preserveKeyOrder: undefined,
  },
  // Transform the individual controls back into differOptions object
  render: (args) => {
    const {
      detectCircular,
      maxDepth,
      showModifications,
      arrayDiffMethod,
      compareKey,
      ignoreCase,
      ignoreCaseForKey,
      recursiveEqual,
      preserveKeyOrder,
      ...otherArgs
    } = args;

    const differOptions: DifferOptions = {
      detectCircular,
      maxDepth,
      showModifications,
      arrayDiffMethod,
      ...(arrayDiffMethod === "compare-key" ? { compareKey } : {}),
      ignoreCase,
      ignoreCaseForKey,
      recursiveEqual,
      ...(preserveKeyOrder ? { preserveKeyOrder } : {}),
    };

    const optionsKey = JSON.stringify({
      detectCircular,
      maxDepth,
      showModifications,
      arrayDiffMethod,
      compareKey,
      ignoreCase,
      ignoreCaseForKey,
      recursiveEqual,
      preserveKeyOrder,
    });

    return <VirtualDiffViewer {...otherArgs} differOptions={differOptions} key={optionsKey} />;
  },
};
