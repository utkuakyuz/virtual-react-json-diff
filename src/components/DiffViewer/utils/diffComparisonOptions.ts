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

export function shouldIgnorePath(currentPath: string, ignorePaths: string[]): boolean {
  if (!ignorePaths || ignorePaths.length === 0)
    return false;
  return ignorePaths.includes(currentPath);
}

export function shouldIgnoreKey(key: string, ignoreKeys: string[]): boolean {
  if (!ignoreKeys || ignoreKeys.length === 0)
    return false;
  return ignoreKeys.includes(key);
}

export function normalizeValue(value: any, strategy: CompareStrategy = "strict"): any {
  if (strategy === "strict") {
    return value;
  }

  if (value === null || value === undefined) {
    return value;
  }

  if (strategy === "type-aware") {
    // Convert strings that look like numbers to numbers
    if (typeof value === "string") {
      const num = Number(value);
      if (!Number.isNaN(num) && value.trim() !== "") {
        return num;
      }
    }
    // Convert booleans
    if (typeof value === "string") {
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
  currentPath: string = "",
): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  // primitives
  if (typeof obj !== "object") {
    return normalizeValue(obj, options.compareStrategy);
  }

  // arrays
  if (Array.isArray(obj)) {
    return obj.map((item, index) => {
      const itemPath = currentPath ? `${currentPath}[${index}]` : `[${index}]`;
      return preprocessObjectForDiff(item, options, itemPath);
    });
  }

  // objects
  const result: Record<string, any> = {};
  const { ignorePaths = [], ignoreKeys = [] } = options;

  for (const key in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) {
      continue;
    }

    if (shouldIgnoreKey(key, ignoreKeys)) {
      continue;
    }

    const fullPath = currentPath ? `${currentPath}.${key}` : key;
    if (shouldIgnorePath(fullPath, ignorePaths)) {
      continue;
    }

    const value = obj[key];
    if (value !== null && typeof value === "object") {
      result[key] = preprocessObjectForDiff(value, options, fullPath);
    }
    else {
      result[key] = normalizeValue(value, options.compareStrategy);
    }
  }

  return result;
}
