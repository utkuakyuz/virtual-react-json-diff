import type { DifferOptions } from "json-diff-kit";

import "./Sidebar.css";
import { useState } from "react";

import type { Config } from "../types";

type Props = { config: Config; updateConfig: (key: keyof Config, value: Config[keyof Config]) => void };

function Sidebar(props: Props) {
  const { config, updateConfig } = props;
  const [showSidebar, setShowSidebar] = useState(true);

  if (!showSidebar) {
    return (
      <div className="sidebar-collapsed" onClick={() => setShowSidebar(true)} title="Show Configuration Sidebar">
        &#9776;
      </div>
    );
  }
  return (
    <aside className="sidebar">
      <div className="config-section">
        <h2 className="section-title">Main Configuration</h2>

        <div className="sidebar-collapse" onClick={() => setShowSidebar(false)} title="Hide Sidebar">
          &#9776;
        </div>
        <div className="form-group">
          <label className="form-label">
            Left Title
            <input
              type="text"
              className="form-input"
              value={config.leftTitle}
              onChange={e => updateConfig("leftTitle", e.target.value)}
              placeholder="Left side title"
            />
          </label>
        </div>

        <div className="form-group">
          <label className="form-label">
            Right Title
            <input
              type="text"
              className="form-input"
              value={config.rightTitle}
              onChange={e => updateConfig("rightTitle", e.target.value)}
              placeholder="Right side title"
            />
          </label>
        </div>

        <div className="form-group">
          <label className="form-label">
            Height (px)
            <input
              type="number"
              className="form-input"
              value={config.height}
              onChange={e => updateConfig("height", Number(e.target.value))}
              min="300"
              max="1000"
              step="50"
            />
          </label>
        </div>

        <div className="form-group">
          <label className="form-label">
            Minimap Width
            <input
              type="number"
              className="form-input"
              value={config.miniMapWidth}
              onChange={e => updateConfig("miniMapWidth", Number(e.target.value))}
              min="0"
              max="50"
              step="5"
            />
          </label>
        </div>

        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              className="form-checkbox"
              checked={config.hideSearch}
              onChange={e => updateConfig("hideSearch", e.target.checked)}
            />
            Hide Search
          </label>
        </div>

        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              className="form-checkbox"
              checked={config.showLineCount}
              onChange={e => updateConfig("showLineCount", e.target.checked)}
            />
            Show Line Count
          </label>
          <p className="form-hint">Display statistics for added, removed, and modified lines</p>
        </div>

        <div className="form-group">
          <label className="form-label">
            CSS Class Name
            <input
              type="text"
              className="form-input"
              value={config.className}
              onChange={e => updateConfig("className", e.target.value)}
              placeholder="CSS class name"
            />
          </label>
        </div>
      </div>

      <div className="config-section">
        <h2 className="section-title">Differ Configuration</h2>

        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              className="form-checkbox"
              checked={config.detectCircular}
              onChange={e => updateConfig("detectCircular", e.target.checked)}
            />
            Detect Circular References
          </label>
          <p className="form-hint">Detect circular reference in source objects before diff starts</p>
        </div>

        <div className="form-group">
          <label className="form-label">
            Max Depth
            <input
              type="number"
              className="form-input"
              value={config.maxDepth}
              onChange={e => updateConfig("maxDepth", Number(e.target.value))}
              min="1"
              max="100"
              step="1"
            />
          </label>
          <p className="form-hint">Maximum depth for comparison (999 means no limit)</p>
        </div>

        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              className="form-checkbox"
              checked={config.showModifications}
              onChange={e => updateConfig("showModifications", e.target.checked)}
            />
            Show Modifications
          </label>
        </div>

        <div className="form-group">
          <label className="form-label">
            Inline Diff Method
            <select
              className="form-select"
              value={config.inlineDiffMode}
              onChange={e => updateConfig("inlineDiffMode", e.target.value)}
            >
              <option value="char">Character</option>
              <option value="word">Word</option>
            </select>
          </label>
        </div>

        <div className="form-group">
          <label className="form-label">
            Array Diff Method
            <select
              className="form-select"
              value={config.arrayDiffMethod}
              onChange={e => updateConfig("arrayDiffMethod", e.target.value as DifferOptions["arrayDiffMethod"])}
            >
              <option value="normal">Normal</option>
              <option value="lcs">LCS (Longest Common Subsequence)</option>
              <option value="unorder-normal">Unordered Normal</option>
              <option value="unorder-lcs">Unordered LCS</option>
              <option value="compare-key">Compare Key</option>
            </select>
          </label>
        </div>

        {config.arrayDiffMethod === "compare-key" && (
          <div className="form-group">
            <label className="form-label">
              Compare Key
              <input
                type="text"
                className="form-input"
                value={config.compareKey}
                onChange={e => updateConfig("compareKey", e.target.value)}
                placeholder="Key for matching objects"
              />
            </label>
            <p className="form-hint">Key to use for matching objects in arrays</p>
          </div>
        )}

        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              className="form-checkbox"
              checked={config.ignoreCase}
              onChange={e => updateConfig("ignoreCase", e.target.checked)}
            />
            Ignore Case
          </label>
        </div>

        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              className="form-checkbox"
              checked={config.ignoreCaseForKey}
              onChange={e => updateConfig("ignoreCaseForKey", e.target.checked)}
            />
            Ignore Case for Keys
          </label>
        </div>

        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              className="form-checkbox"
              checked={config.recursiveEqual}
              onChange={e => updateConfig("recursiveEqual", e.target.checked)}
            />
            Recursive Equal
          </label>
          <p className="form-hint">Whether to use recursive equal to compare objects</p>
        </div>

        <div className="form-group">
          <label className="form-label">
            Preserve Key Order
            <select
              className="form-select"
              value={config.preserveKeyOrder || "default"}
              onChange={e => updateConfig("preserveKeyOrder", e.target.value === "default" ? undefined : e.target.value as DifferOptions["preserveKeyOrder"])}
            >
              <option value="default">Sort (default)</option>
              <option value="before">Before</option>
              <option value="after">After</option>
            </select>
          </label>
          <p className="form-hint">Whether to preserve key order from input objects</p>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
