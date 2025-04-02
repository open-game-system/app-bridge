import { produce as immerProduce, type Draft } from 'immer';
import type { Event, State } from '../types';

/**
 * A wrapper around Immer's produce that maintains type safety
 */
export const produce = <T>(baseState: T, recipe: (draft: Draft<T>) => void): T => {
  return immerProduce(baseState, recipe);
};

/**
 * Type guard to check if an object is a valid Event
 */
export function isEvent(value: unknown): value is Event {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    typeof (value as Event).type === 'string'
  );
}

/**
 * Type guard to check if an object is a valid State
 */
export function isState(value: unknown): value is State {
  return typeof value === 'object' && value !== null;
}

/**
 * Creates a promise that resolves after a specified delay
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retries a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts = 5,
  baseDelay = 100
): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (error) {
      attempt++;
      if (attempt >= maxAttempts) {
        throw error;
      }
      await delay(baseDelay * Math.pow(2, attempt - 1));
    }
  }
} 