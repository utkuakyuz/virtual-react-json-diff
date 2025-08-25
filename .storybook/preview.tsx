import type { Preview } from "@storybook/react";

import "../src/style/main.css";
import "@fontsource/inter";

import "./preview.css";

import React, { useEffect, useState } from "react";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
      expanded: true,
    },
    layout: "fullscreen",
  },
};

function withJsonEditor(Story, context) {
  const { args } = context;
  const { oldValue, newValue } = args;

  const [oldJson, setOldJson] = useState(JSON.stringify(oldValue, null, 2));
  const [newJson, setNewJson] = useState(JSON.stringify(newValue, null, 2));
  const [oldJsonError, setOldJsonError] = useState("");
  const [newJsonError, setNewJsonError] = useState("");
  const [parsedOldValue, setParsedOldValue] = useState(oldValue);
  const [parsedNewValue, setParsedNewValue] = useState(newValue);

  const validateJson = (jsonString: string) => {
    try {
      return { error: "", parsed: JSON.parse(jsonString) };
    }
    catch {
      return { error: "Invalid JSON format", parsed: null };
    }
  };

  useEffect(() => {
    const { error, parsed } = validateJson(oldJson);
    setOldJsonError(error);
    if (!error) {
      setParsedOldValue(parsed);
    }
  }, [oldJson]);

  useEffect(() => {
    const { error, parsed } = validateJson(newJson);
    setNewJsonError(error);
    if (!error) {
      setParsedNewValue(parsed);
    }
  }, [newJson]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "flex", gap: "20px" }}>
        <div style={{ flex: 1 }}>
          <h3>Old Value</h3>
          <textarea
            style={{
              width: "100%",
              height: "200px",
              padding: "10px",
              fontFamily: "monospace",
              backgroundColor: "#f5f5f5",
              border: oldJsonError ? "1px solid red" : "1px solid #ddd",
              borderRadius: "4px",
            }}
            value={oldJson}
            onChange={e => setOldJson(e.target.value)}
          />
          {oldJsonError && <div style={{ color: "red" }}>{oldJsonError}</div>}
        </div>
        <div style={{ flex: 1 }}>
          <h3>New Value</h3>
          <textarea
            style={{
              width: "100%",
              height: "200px",
              padding: "10px",
              fontFamily: "monospace",
              backgroundColor: "#f5f5f5",
              border: newJsonError ? "1px solid red" : "1px solid #ddd",
              borderRadius: "4px",
            }}
            value={newJson}
            onChange={e => setNewJson(e.target.value)}
          />
          {newJsonError && <div style={{ color: "red" }}>{newJsonError}</div>}
        </div>
      </div>
      {!oldJsonError && !newJsonError && (
        <Story {...context} args={{ ...context.args, oldValue: parsedOldValue, newValue: parsedNewValue }} />
      )}
    </div>
  );
}

export const decorators = [withJsonEditor];

export default preview;
