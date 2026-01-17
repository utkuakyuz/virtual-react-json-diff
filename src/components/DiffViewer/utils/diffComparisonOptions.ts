export type CompareStrategy
  = | "strict" 
    | "loose" 
    | "type-aware";

export type DiffComparisonOptions = {
  ignorePaths?: string[];
  ignoreKeys?: string[];
  /**
   * strict: default strict equality (===)
   * loose: loose equality where reasonable
   * type-aware: allows number/string equality like "1" === 1
   */
  compareStrategy?: CompareStrategy;
};


export function normalizeValue(value: any, strategy: CompareStrategy = "strict"): any {
  if (strategy === "strict") {
    return value;
  }

  if (value === null || value === undefined) {
    return value;
  }

  if (strategy === "type-aware") {
    if (typeof value === "string") {
      const num = Number(value);
      if (!Number.isNaN(num) && value.trim() !== "") {
        return num;
      }
      if (value === "true")
        return true;
      if (value === "false")
        return false;
    }
    return value;
  }

  if (strategy === "loose") {
    if (typeof value === "string" && value.trim() === "") {
      return null;
    }
    return value;
  }

  return value;
}

/**
 * returning new object with ignored paths/keys removed and values normalized
 */
export function preprocessObjectForDiff(
  obj: any,
  options: DiffComparisonOptions,
): any {
  const ignorePathsSet = new Set(options.ignorePaths ?? []);
  const ignoreKeysSet = new Set(options.ignoreKeys ?? []);

  function recurse(currentObj: any, currentPath: string = ""): any {
    if (currentObj === null || currentObj === undefined) {
      return currentObj;
    }

    // primitives
    if (typeof currentObj !== "object") {
      return normalizeValue(currentObj, options.compareStrategy);
    }

    // arrays
    if (Array.isArray(currentObj)) {
      return currentObj.map((item, index) => {
        const itemPath = currentPath ? `${currentPath}[${index}]` : `[${index}]`;
        return recurse(item, itemPath);
      });
    }

    // objects
    const result: Record<string, any> = {};

    for (const key in currentObj) {
      if (!Object.prototype.hasOwnProperty.call(currentObj, key)) {
        continue;
      }

      if (ignoreKeysSet.has(key)) {
        continue;
      }

      const fullPath = currentPath ? `${currentPath}.${key}` : key;
      if (ignorePathsSet.has(fullPath)) {
        continue;
      }

      const value = currentObj[key];
      if (value !== null && typeof value === "object") {
        result[key] = recurse(value, fullPath);
      }
      else {
        result[key] = normalizeValue(value, options.compareStrategy);
      }
    }

    return result;
  }

  return recurse(obj);
}
