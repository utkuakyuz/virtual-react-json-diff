import React from "react";

import type { LineCountStats } from "../types";

type LineCountDisplayProps = {
  stats: LineCountStats;
};

export const LineCountDisplay: React.FC<LineCountDisplayProps> = ({ stats }) => {
  if (stats.total === 0) {
    return (
      <div className="line-count-display">
        <span className="line-count-item no-changes">No changes</span>
      </div>
    );
  }

  return (
    <div className="line-count-display">
      {stats.added > 0 && (
        <span className="line-count-item added">
          +
          {stats.added}
          {" "}
          added
        </span>
      )}
      {stats.removed > 0 && (
        <span className="line-count-item removed">
          -
          {stats.removed}
          {" "}
          removed
        </span>
      )}
      {stats.modified > 0 && (
        <span className="line-count-item modified">
          ~
          {stats.modified}
          {" "}
          modified
        </span>
      )}
      <span className="line-count-item total">
        {stats.total}
        {" "}
        total changes
      </span>
    </div>
  );
};

export default LineCountDisplay;
