/**
 * A simplified immer-like produce function for immutable state updates
 * 
 * @param state The base state to update
 * @param updater A function that mutates a draft state which is then used to produce the next state
 * @returns A new state object with the applied changes
 */
export function produce<T extends object>(state: T, updater: (draft: T) => void): T {
  // Create a shallow copy as the draft
  const draft = { ...state } as T;
  
  // Apply updates to the draft
  updater(draft);
  
  // Return the updated draft as the new state
  return draft;
}

/**
 * Deep clone function to create a completely new object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(deepClone) as unknown as T;
  }

  const result = {} as T;
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result[key] = deepClone(obj[key]);
    }
  }

  return result;
} 