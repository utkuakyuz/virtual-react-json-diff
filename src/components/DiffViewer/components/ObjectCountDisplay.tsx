import React from "react";

import type { ObjectCountStats } from "../types";

type ObjectCountDisplayProps = {
  stats: ObjectCountStats;
};

export const ObjectCountDisplay: React.FC<ObjectCountDisplayProps> = ({ stats }) => {
  if (!stats || typeof stats !== "object") {
    return null;
  }

  const { added = 0, removed = 0, modified = 0, total = 0 } = stats;

  if (total === 0) {
    return (
      <div className="object-count-display">
        <span className="object-count-item no-changes">No object changes</span>
      </div>
    );
  }

  return (
    <div className="object-count-display">
      <div className="object-count-item-sub-holder">
        {added > 0 && (
          <span className="object-count-item added">
            +
            {added}
            {" "}
            added objects
          </span>
        )}

        {removed > 0 && (
          <span className="object-count-item removed">
            -
            {removed}
            {" "}
            removed objects
          </span>
        )}
      </div>
      <div className="object-count-item-sub-holder">
        {modified > 0 && (
          <span className="object-count-item modified">
            ~
            {modified}
            {" "}
            modified objects
          </span>
        )}
        <span className="object-count-item total">
          {total}
          {" "}
          total object changes
        </span>
      </div>
    </div>
  );
};

export default ObjectCountDisplay;
