import { create } from "@storybook/theming/create";

export default create({
    base: "light",
    brandTitle: "Virtual React Json Diff",
    brandUrl: "https://virtual-react-json-diff.netlify.app",
    // brandImage: "./image.png",
    brandTarget: "_self",
    gridCellSize: 20,

    // Typography
    fontBase: '"Open Sans", sans-serif',
    fontCode: "monospace",

    //
    colorPrimary: "#3A10E5",
    colorSecondary: "#585C6D",

    // UI
    appBg: "#ffffff",
    appContentBg: "#ffffff",
    appPreviewBg: "#ffffff",
    appBorderColor: "#585C6D",
    appBorderRadius: 4,

    // Text colors
    textColor: "#10162F",
    textInverseColor: "#ffffff",

    // Toolbar default and active colors
    barTextColor: "#9E9E9E",
    barSelectedColor: "#585C6D",
    barHoverColor: "#585C6D",
    barBg: "#ffffff",

    // Form colors
    inputBg: "#ffffff",
    inputBorder: "#10162F",
    inputTextColor: "#10162F",
    inputBorderRadius: 2,
});
