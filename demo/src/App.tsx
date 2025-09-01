import type { DifferOptions } from "json-diff-kit";

import { useEffect, useState } from "react";
import AceEditor from "react-ace";
import { VirtualDiffViewer } from "virtual-react-json-diff";

import "./App.css";
import Sidebar from "./components/Sidebar";
import oldValue from "./testJsons/json1.json";
import newValue from "./testJsons/json2.json";

import "ace-builds/src-noconflict/mode-json";
import "ace-builds/src-noconflict/theme-github_dark";
import "ace-builds/src-noconflict/ext-language_tools";

export default function App() {
  const [config, setConfig] = useState({
    // Main Configuration
    className: "diff-viewer-container-custom-height",
    leftTitle: "Original JSON",
    rightTitle: "Updated JSON",
    miniMapWidth: 20,
    hideSearch: false,
    height: 380,

    // Differ Configuration
    detectCircular: true,
    maxDepth: 999,
    showModifications: true,
    arrayDiffMethod: "lcs" as DifferOptions["arrayDiffMethod"],
    compareKey: "id",
    ignoreCase: false,
    ignoreCaseForKey: false,
    recursiveEqual: false,
    preserveKeyOrder: undefined as DifferOptions["preserveKeyOrder"],
  });

  const updateConfig = (key: string, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const differOptions: DifferOptions = {
    detectCircular: config.detectCircular,
    maxDepth: config.maxDepth,
    showModifications: config.showModifications,
    arrayDiffMethod: config.arrayDiffMethod,
    ...(config.arrayDiffMethod === "compare-key" ? { compareKey: config.compareKey } : {}),
    ignoreCase: config.ignoreCase,
    ignoreCaseForKey: config.ignoreCaseForKey,
    recursiveEqual: config.recursiveEqual,
    ...(config.preserveKeyOrder ? { preserveKeyOrder: config.preserveKeyOrder } : {}),
  };

  const [oldJson, setOldJson] = useState(JSON.stringify(oldValue, null, 2));
  const [newJson, setNewJson] = useState(JSON.stringify(newValue, null, 2));
  const [oldJsonError, setOldJsonError] = useState("");
  const [newJsonError, setNewJsonError] = useState("");
  const [parsedOldValue, setParsedOldValue] = useState(oldValue);
  const [parsedNewValue, setParsedNewValue] = useState(newValue);

  const validateJson = (jsonString: string) => {
    if (!jsonString.trim()) {
      return { error: "JSON cannot be empty", parsed: null };
    }

    try {
      const parsed = JSON.parse(jsonString);
      return { error: "", parsed };
    }
    catch (error) {
      return { error: `Invalid JSON: ${error instanceof Error ? error.message : "Unknown error"}`, parsed: null };
    }
  };

  useEffect(() => {
    const { error, parsed } = validateJson(oldJson);
    setOldJsonError(error);
    if (!error && parsed !== null) {
      setParsedOldValue(parsed);
    }
  }, [oldJson]);

  useEffect(() => {
    const { error, parsed } = validateJson(newJson);
    setNewJsonError(error);
    if (!error && parsed !== null) {
      setParsedNewValue(parsed);
    }
  }, [newJson]);

  const isBothJsonValid = !oldJsonError && !newJsonError && parsedOldValue !== null && parsedNewValue !== null;

  return (
    <div className="app-container">
      <Sidebar config={config} updateConfig={updateConfig} />

      <main className="main-content">
        <div>
          <div className="title-holder">
            <h1>Virtual React JSON Diff Demo</h1>
            <a href="https://www.npmjs.com/package/virtual-react-json-diff" target="blank">
              <img src="https://img.shields.io/npm/v/virtual-react-json-diff.svg" />
            </a>
            <a href="https://github.com/utkuakyuz/virtual-react-json-diff" target="blank">
              <img className="github-badge" src="https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white" />
            </a>
          </div>
          <p className="demo-description">
            Explore the powerful features of VirtualDiffViewer with comprehensive configuration options.
            Adjust the settings in the sidebar to see how different options affect the diff visualization.
          </p>

          <div className="json-editor-holder">
            <div className="json-editor-container">
              <div className="editor-header">
                <h3>Original JSON</h3>
                {oldJsonError && <span className="error-indicator">Invalid JSON</span>}
              </div>
              <AceEditor
                mode="json"
                theme="github_dark"
                onChange={setOldJson}
                value={oldJson}
                name="old-json-editor"
                width="100%"
                height="250px"
                wrapEnabled
                setOptions={{
                  useWorker: false,
                  showPrintMargin: false,
                  showGutter: true,
                  highlightActiveLine: true,
                }}
                editorProps={{ $blockScrolling: true }}
                className={oldJsonError ? "editor-error" : ""}
              />
              {oldJsonError && (
                <div className="error-message">
                  {oldJsonError}
                </div>
              )}
            </div>

            <div className="json-editor-container">
              <div className="editor-header">
                <h3>Updated JSON</h3>
                {newJsonError && <span className="error-indicator">Invalid JSON</span>}
              </div>
              <AceEditor
                mode="json"
                theme="github_dark"
                onChange={setNewJson}
                value={newJson}
                name="new-json-editor"
                width="100%"
                height="250px"
                wrapEnabled
                setOptions={{
                  useWorker: false,
                  showPrintMargin: false,
                  showGutter: true,
                  highlightActiveLine: true,
                }}
                editorProps={{ $blockScrolling: true }}
                className={newJsonError ? "editor-error" : ""}
              />
              {newJsonError && (
                <div className="error-message">
                  {newJsonError}
                </div>
              )}
            </div>
          </div>
        </div>
        {!isBothJsonValid && (
          <div className="validation-message">
            <div className="validation-content">
              <div>
                <h3>Fix JSON Validation Errors</h3>
                <p>Please correct the JSON syntax errors in the editors above to see the diff visualization.</p>
                {oldJsonError && (
                  <p>
                    <strong>Original JSON:</strong>
                    {" "}
                    {oldJsonError}
                  </p>
                )}
                {newJsonError && (
                  <p>
                    <strong>Updated JSON:</strong>
                    {" "}
                    {newJsonError}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {isBothJsonValid && (
          <VirtualDiffViewer
            className={config.className}
            leftTitle={config.leftTitle}
            rightTitle={config.rightTitle}
            height={config.height}
            miniMapWidth={config.miniMapWidth}
            hideSearch={config.hideSearch}
            oldValue={parsedOldValue}
            newValue={parsedNewValue}
            differOptions={differOptions}
          />
        )}
      </main>
    </div>
  );
}
