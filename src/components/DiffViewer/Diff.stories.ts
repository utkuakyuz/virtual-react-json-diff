import type { Meta, StoryObj } from "@storybook/react";
import { VirtualDiffViewer } from "../..";
import json1 from "./testJsons/json1.json";
import json2 from "./testJsons/json2.json";

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
    title: "Example/VirtualDiffViewer",
    component: VirtualDiffViewer,
    parameters: {
        layout: "padded", // veya "padded"
        // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    },
    // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
    tags: ["autodocs"],
    argTypes: {
        className: {
            description: "CSS class name for the diff viewer container",
            control: "text",
        },
        leftTitle: {
            description: "Title for the left side of the diff viewer",
            control: "text",
        },
        rightTitle: {
            description: "Title for the right side of the diff viewer",
            control: "text",
        },
        hideSearch: {
            description: "Whether to hide the search functionality",
            control: "boolean",
        },
        height: {
            description: "Height of the diff viewer in pixels",
            control: "number",
        },
        oldValue: {
            description: "The original JSON object to compare",
            control: "object",
        },
        newValue: {
            description: "The new JSON object to compare against",
            control: "object",
        },
        differOptions: {
            description: "Options for the diff algorithm",
            control: "object",
        },
    },
} satisfies Meta<typeof VirtualDiffViewer>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Primary: Story = {
    args: {
        className: "diff-viewer-container",
        leftTitle: "Left Title",
        rightTitle: "Right Title",
        hideSearch: false,
        height: 500,
        differOptions: { arrayDiffMethod: "lcs", preserveKeyOrder: "before" },
        oldValue: json1,
        newValue: json2,
    },
};
