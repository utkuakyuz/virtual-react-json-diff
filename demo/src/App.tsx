import type { DifferOptions } from "json-diff-kit";

import { useEffect, useRef, useState } from "react";
import AceEditor from "react-ace";
import { VirtualDiffViewer } from "virtual-react-json-diff";
import "ace-builds/src-noconflict/mode-json";
import "ace-builds/src-noconflict/theme-github_dark";
import "ace-builds/src-noconflict/ext-language_tools";

import "./App.css";
import type { Config } from "./types";

import Sidebar from "./components/Sidebar";
import oldValue from "./testJsons/json1.json";
import newValue from "./testJsons/json2.json";
import oldValueExample2 from "./testJsons/json3.json";
import newValueExample2 from "./testJsons/json4.json";

export default function App() {
  const [activeTab, setActiveTab] = useState<"main" | "example">("main");

  const [config, setConfig] = useState<Config>({
    // Main Configuration
    className: "diff-viewer-container-custom-height",
    leftTitle: "Original JSON",
    rightTitle: "Updated JSON",
    miniMapWidth: 20,
    hideSearch: false,
    height: 380,
    showLineCount: true,
    showObjectCountStats: false,

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
    inlineDiffMode: "word",
  });

  // Store initial config for restoration
  const initialConfig = useRef<Config>(config);

  const updateConfig = (key: keyof Config, value: (Config)[keyof Config]) => {
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

  const [editorsVisible, setEditorsVisible] = useState(true);
  const [oldJson, setOldJson] = useState(JSON.stringify(oldValue, null, 2));
  const [newJson, setNewJson] = useState(JSON.stringify(newValue, null, 2));
  const [oldJsonError, setOldJsonError] = useState("");
  const [newJsonError, setNewJsonError] = useState("");
  const [parsedOldValue, setParsedOldValue] = useState(oldValue);
  const [parsedNewValue, setParsedNewValue] = useState(newValue);

  // Example tab states
  const [exampleEditorsVisible, setExampleEditorsVisible] = useState(true);
  const [exampleOldJson, setExampleOldJson] = useState(JSON.stringify(oldValueExample2, null, 2));
  const [exampleNewJson, setExampleNewJson] = useState(JSON.stringify(newValueExample2, null, 2));
  const [exampleOldJsonError, setExampleOldJsonError] = useState("");
  const [exampleNewJsonError, setExampleNewJsonError] = useState("");
  const [parsedExampleOldValue, setParsedExampleOldValue] = useState(oldValueExample2);
  const [parsedExampleNewValue, setParsedExampleNewValue] = useState(newValueExample2);

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

  // Example JSON validation
  useEffect(() => {
    const { error, parsed } = validateJson(exampleOldJson);
    setExampleOldJsonError(error);
    if (!error && parsed !== null) {
      setParsedExampleOldValue(parsed);
    }
  }, [exampleOldJson]);

  useEffect(() => {
    const { error, parsed } = validateJson(exampleNewJson);
    setExampleNewJsonError(error);
    if (!error && parsed !== null) {
      setParsedExampleNewValue(parsed);
    }
  }, [exampleNewJson]);

  const isBothJsonValid = !oldJsonError && !newJsonError && parsedOldValue !== null && parsedNewValue !== null;
  const isExampleBothJsonValid = !exampleOldJsonError && !exampleNewJsonError && parsedExampleOldValue !== null && parsedExampleNewValue !== null;

  // Update config when switching tabs
  useEffect(() => {
    if (activeTab === "example") {
      // Set example-specific config
      setConfig(prev => ({
        ...prev,
        className: "diff-viewer-container-custom-height",
        leftTitle: "User Profiles (Before)",
        rightTitle: "User Profiles (After)",
        height: 300,
        miniMapWidth: 20,
        hideSearch: false,
        showLineCount: false,
        showObjectCountStats: true,
        arrayDiffMethod: "compare-key" as DifferOptions["arrayDiffMethod"],
        compareKey: "oid",
        ignoreCase: false,
        ignoreCaseForKey: false,
        recursiveEqual: false,
        inlineDiffMode: "word",
      }));
    }
    else if (activeTab === "main") {
      // Restore initial config
      setConfig(initialConfig.current);
    }
  }, [activeTab]);

  return (
    <div className="app-container">
      <Sidebar config={config} updateConfig={updateConfig} />

      <main className="main-content">
        <div>
          <div className="title-holder">
            <h1>Virtual React JSON Diff Demo</h1>
            <a href="https://www.npmjs.com/package/virtual-react-json-diff" target="_blank" rel="noopener noreferrer">
              <img src="https://img.shields.io/npm/v/virtual-react-json-diff.svg" />
            </a>
            <a href="https://github.com/utkuakyuz/virtual-react-json-diff" target="_blank" rel="noopener noreferrer">
              <img className="github-badge" src="https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white" />
            </a>
          </div>
          <div className="subtitle-holder">
            <p className="demo-description">
              Explore the features of VirtualDiffViewer with configuration options.
              Adjust the settings in the sidebar to see different outpus of the diff visualization.
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="tab-navigation">
            <button
              className={`tab-button ${activeTab === "main" ? "active" : ""}`}
              onClick={() => setActiveTab("main")}
            >
              Main Viewer
            </button>
            <button
              className={`tab-button ${activeTab === "example" ? "active" : ""}`}
              onClick={() => setActiveTab("example")}
            >
              Array Compare By Key Example
            </button>
          </div>

          {/* Main Tab Content */}
          {activeTab === "main" && (
            <>
              <div className="example-section">
                <div className="example-header">
                  <div className="example-header-holder">
                    <h2>Configurable Diff Viewer</h2>
                    <button type="button" className="hide-editor-button" onClick={() => setEditorsVisible(prev => !prev)}>
                      {editorsVisible ? "Hide" : "Show"}
                      {" "}
                      Editors
                    </button>
                  </div>
                  <p className="example-description">
                    This is the main configurable diff viewer. Use the sidebar controls to adjust settings like
                    array diff method, compare key, line count display, and object count statistics.
                    Try switching to "compare-key" method and enabling "Show Object Count Stats" to see
                    the object counting feature in action.
                  </p>

                </div>

                {editorsVisible && (
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
                )}

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
                    showLineCount={config.showLineCount}
                    showObjectCountStats={config.showObjectCountStats}
                    inlineDiffOptions={{ mode: config.inlineDiffMode }}
                    oldValue={parsedOldValue}
                    newValue={parsedNewValue}
                    differOptions={differOptions}
                  />
                )}
              </div>
            </>
          )}

          {/* Example Tab Content */}
          {activeTab === "example" && (
            <>
              <div className="example-section">
                <div className="example-header">
                  <div className="example-header-holder">
                    <h2>Object Count Statistics Example</h2>
                    <button type="button" className="hide-editor-button" onClick={() => setExampleEditorsVisible(prev => !prev)}>
                      {exampleEditorsVisible ? "Hide" : "Show"}
                      {" "}
                      Editors
                    </button>
                  </div>
                  <p className="example-description">
                    This example demonstrates the object count statistics feature using the compare-key method.
                    It compares user profiles by their unique "oid" field, showing how many objects were added,
                    removed, or modified between the two datasets. Use the sidebar controls to adjust settings
                    and see how the object count statistics change based on your configuration.
                  </p>

                </div>

                {exampleEditorsVisible && (
                  <div className="json-editor-holder">
                    <div className="json-editor-container">
                      <div className="editor-header">
                        <h3>User Profiles (Before)</h3>
                        {exampleOldJsonError && <span className="error-indicator">Invalid JSON</span>}
                      </div>
                      <AceEditor
                        mode="json"
                        theme="github_dark"
                        onChange={setExampleOldJson}
                        value={exampleOldJson}
                        name="example-old-json-editor"
                        width="100%"
                        height="200px"
                        wrapEnabled
                        setOptions={{
                          useWorker: false,
                          showPrintMargin: false,
                          showGutter: true,
                          highlightActiveLine: true,
                        }}
                        editorProps={{ $blockScrolling: true }}
                        className={exampleOldJsonError ? "editor-error" : ""}
                      />
                      {exampleOldJsonError && (
                        <div className="error-message">
                          {exampleOldJsonError}
                        </div>
                      )}
                    </div>

                    <div className="json-editor-container">
                      <div className="editor-header">
                        <h3>User Profiles (After)</h3>
                        {exampleNewJsonError && <span className="error-indicator">Invalid JSON</span>}
                      </div>
                      <AceEditor
                        mode="json"
                        theme="github_dark"
                        onChange={setExampleNewJson}
                        value={exampleNewJson}
                        name="example-new-json-editor"
                        width="100%"
                        height="200px"
                        wrapEnabled
                        setOptions={{
                          useWorker: false,
                          showPrintMargin: false,
                          showGutter: true,
                          highlightActiveLine: true,
                        }}
                        editorProps={{ $blockScrolling: true }}
                        className={exampleNewJsonError ? "editor-error" : ""}
                      />
                      {exampleNewJsonError && (
                        <div className="error-message">
                          {exampleNewJsonError}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {!isExampleBothJsonValid && (
                  <div className="validation-message">
                    <div className="validation-content">
                      <div>
                        <h3>Fix JSON Validation Errors</h3>
                        <p>Please correct the JSON syntax errors in the editors above to see the diff visualization.</p>
                        {exampleOldJsonError && (
                          <p>
                            <strong>User Profiles (Before):</strong>
                            {" "}
                            {exampleOldJsonError}
                          </p>
                        )}
                        {exampleNewJsonError && (
                          <p>
                            <strong>User Profiles (After):</strong>
                            {" "}
                            {exampleNewJsonError}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {isExampleBothJsonValid && (
                  <VirtualDiffViewer
                    className={config.className}
                    leftTitle={config.leftTitle}
                    rightTitle={config.rightTitle}
                    height={config.height}
                    miniMapWidth={config.miniMapWidth}
                    hideSearch={config.hideSearch}
                    showLineCount={config.showLineCount}
                    showObjectCountStats={config.showObjectCountStats}
                    inlineDiffOptions={{ mode: config.inlineDiffMode }}
                    oldValue={parsedExampleOldValue}
                    newValue={parsedExampleNewValue}
                    differOptions={differOptions}
                  />
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
