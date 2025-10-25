import type { ObjectCountStats } from "../types";

/**
 * Recursively extracts all arrays from a JSON object
 */
function extractArrays(obj: any, arrays: any[] = []): any[] {
  if (Array.isArray(obj)) {
    arrays.push(obj);
    // Also check nested objects within the array
    obj.forEach((item) => {
      if (typeof item === "object" && item !== null) {
        extractArrays(item, arrays);
      }
    });
  }
  else if (typeof obj === "object" && obj !== null) {
    Object.values(obj).forEach((value) => {
      extractArrays(value, arrays);
    });
  }
  return arrays;
}

/**
 * Checks if an array contains objects with the specified compare key
 */
function hasObjectsWithCompareKey(arr: any[], compareKey: string): boolean {
  if (!Array.isArray(arr) || arr.length === 0 || !compareKey) {
    return false;
  }

  return arr.every(item =>
    typeof item === "object"
    && item !== null
    && item !== undefined
    && compareKey in item
    && item[compareKey] !== undefined
    && item[compareKey] !== null,
  );
}

/**
 * Creates a map of objects keyed by the compare key value
 */
function createObjectMap(arr: any[], compareKey: string): Map<any, any> {
  const map = new Map();
  if (!Array.isArray(arr) || !compareKey) {
    return map;
  }

  arr.forEach((obj) => {
    if (typeof obj === "object" && obj !== null && obj !== undefined && compareKey in obj) {
      const keyValue = obj[compareKey];
      if (keyValue !== undefined && keyValue !== null) {
        map.set(keyValue, obj);
      }
    }
  });
  return map;
}

/**
 * Deep compares two objects to check if they are different
 */
function objectsAreDifferent(obj1: any, obj2: any): boolean {
  if (obj1 === obj2)
    return false;
  if (typeof obj1 !== typeof obj2)
    return true;
  if (typeof obj1 !== "object" || obj1 === null || obj2 === null)
    return obj1 !== obj2;

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length)
    return true;

  for (const key of keys1) {
    if (!keys2.includes(key))
      return true;
    if (objectsAreDifferent(obj1[key], obj2[key]))
      return true;
  }

  return false;
}

/**
 * Calculates object count statistics for compare-key method
 */
export function calculateObjectCountStats(
  oldValue: any,
  newValue: any,
  compareKey: string,
): ObjectCountStats {
  // Early return for invalid inputs
  if (!oldValue || !newValue || !compareKey || typeof compareKey !== "string") {
    return { added: 0, removed: 0, modified: 0, total: 0 };
  }

  try {
    const oldArrays = extractArrays(oldValue);
    const newArrays = extractArrays(newValue);

    const oldArraysWithKey = oldArrays.filter(arr => hasObjectsWithCompareKey(arr, compareKey));
    const newArraysWithKey = newArrays.filter(arr => hasObjectsWithCompareKey(arr, compareKey));

    if (oldArraysWithKey.length === 0 && newArraysWithKey.length === 0) {
      return { added: 0, removed: 0, modified: 0, total: 0 };
    }

    let totalAdded = 0;
    let totalRemoved = 0;
    let totalModified = 0;

    const processedOldArrays = new Set<string>();
    const processedNewArrays = new Set<string>();

    oldArraysWithKey.forEach((oldArr, oldIndex) => {
      try {
        const arraySignature = `${oldIndex}-${oldArr.length}-${JSON.stringify(oldArr.map((item: any) => item[compareKey]).sort())}`;
        if (processedOldArrays.has(arraySignature))
          return;
        processedOldArrays.add(arraySignature);

        const newArr = newArraysWithKey.find((newArr, newIndex) => {
          try {
            const newSignature = `${newIndex}-${newArr.length}-${JSON.stringify(newArr.map((item: any) => item[compareKey]).sort())}`;
            if (processedNewArrays.has(newSignature))
              return false;

            const oldKeys = oldArr.map((item: any) => item[compareKey]).sort();
            const newKeys = newArr.map((item: any) => item[compareKey]).sort();
            const commonKeys = oldKeys.filter((key: any) => newKeys.includes(key));

            return commonKeys.length > 0; // Arrays share at least one key
          }
          catch (error) {
            console.warn("Error processing new array:", error);
            return false;
          }
        });

        if (newArr) {
          const newSignature = `${newArraysWithKey.indexOf(newArr)}-${newArr.length}-${JSON.stringify(newArr.map((item: any) => item[compareKey]).sort())}`;
          processedNewArrays.add(newSignature);

          const oldMap = createObjectMap(oldArr, compareKey);
          const newMap = createObjectMap(newArr, compareKey);

          // Count added objects
          for (const [key, newObj] of newMap) {
            if (!oldMap.has(key)) {
              totalAdded++;
            }
            else {
              // Check if object was modified
              const oldObj = oldMap.get(key);
              if (objectsAreDifferent(oldObj, newObj)) {
                totalModified++;
              }
            }
          }

          // Count removed objects
          for (const [key] of oldMap) {
            if (!newMap.has(key)) {
              totalRemoved++;
            }
          }
        }
        else {
          // If no corresponding array found, all objects are considered removed
          totalRemoved += oldArr.length;
        }
      }
      catch (error) {
        console.warn("Error processing old array:", error);
      }
    });

    newArraysWithKey.forEach((newArr, newIndex) => {
      try {
        const arraySignature = `${newIndex}-${newArr.length}-${JSON.stringify(newArr.map((item: any) => item[compareKey]).sort())}`;
        if (processedNewArrays.has(arraySignature))
          return;
        processedNewArrays.add(arraySignature);

        // If this array not matched with an old array, all objects are considered added
        totalAdded += newArr.length;
      }
      catch (error) {
        console.warn("Error processing new array:", error);
      }
    });

    const total = totalAdded + totalRemoved + totalModified;

    return {
      added: totalAdded,
      removed: totalRemoved,
      modified: totalModified,
      total,
    };
  }
  catch (error) {
    console.warn("Error calculating object count stats:", error);
    return { added: 0, removed: 0, modified: 0, total: 0 };
  }
}
