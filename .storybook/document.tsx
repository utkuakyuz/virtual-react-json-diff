import React from "react";
import { DocsPage, DocsContainer } from "@storybook/addon-docs";
import { Source } from "@storybook/blocks";

const CustomDocsPage = (props) => {
    const { context } = props;

    const importStatement = `
  // Import statement
  import <<comp>> from '@react-noxui';
  `;

    return (
        <DocsContainer context={context}>
            <DocsPage />
            <Source code={importStatement} language="jsx" dark />
        </DocsContainer>
    );
};

export default CustomDocsPage;
