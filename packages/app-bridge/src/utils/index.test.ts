import { describe, it, expect, vi } from 'vitest';
import { produce, isEvent, isState, isStore, isStoreDefinition, delay, retryWithBackoff } from './index';
import type { State } from '../types';

describe('Utility Functions', () => {
  describe('Type Guards', () => {
    describe('isEvent', () => {
      it('should return true for valid events', () => {
        expect(isEvent({ type: 'TEST' })).toBe(true);
        expect(isEvent({ type: 'TEST', payload: 123 })).toBe(true);
      });

      it('should return false for invalid events', () => {
        expect(isEvent(null)).toBe(false);
        expect(isEvent({})).toBe(false);
        expect(isEvent({ type: 123 })).toBe(false);
      });
    });

    describe('isState', () => {
      it('should return true for valid states', () => {
        expect(isState({})).toBe(true);
        expect(isState({ count: 0 })).toBe(true);
      });

      it('should return false for invalid states', () => {
        expect(isState(null)).toBe(false);
        expect(isState(undefined)).toBe(false);
        expect(isState('string')).toBe(false);
      });
    });

    describe('isStore', () => {
      it('should return true for valid stores', () => {
        const validStore = {
          getState: () => ({}),
          dispatch: () => {},
          subscribe: () => () => {},
        };
        expect(isStore(validStore)).toBe(true);
      });

      it('should return false for invalid stores', () => {
        expect(isStore(null)).toBe(false);
        expect(isStore({})).toBe(false);
        expect(isStore({ getState: 'not a function' })).toBe(false);
      });
    });

    describe('isStoreDefinition', () => {
      it('should return true for valid store definitions', () => {
        const validDef = {
          initialState: { count: 0 },
        };
        const validDefWithReducers = {
          initialState: { count: 0 },
          reducers: {
            increment: (state: State) => ({ ...state, count: (state as any).count + 1 }),
          },
        };
        expect(isStoreDefinition(validDef)).toBe(true);
        expect(isStoreDefinition(validDefWithReducers)).toBe(true);
      });

      it('should return false for invalid store definitions', () => {
        expect(isStoreDefinition(null)).toBe(false);
        expect(isStoreDefinition({})).toBe(false);
        expect(isStoreDefinition({ initialState: null })).toBe(false);
      });
    });
  });

  describe('Async Utilities', () => {
    describe('delay', () => {
      it('should delay for the specified time', async () => {
        const start = Date.now();
        await delay(100);
        const elapsed = Date.now() - start;
        expect(elapsed).toBeGreaterThanOrEqual(90); // Allow for small timing variations
      });
    });

    describe('retryWithBackoff', () => {
      it('should retry failed operations', async () => {
        const fn = vi.fn();
        fn.mockRejectedValueOnce(new Error('Fail 1'))
          .mockRejectedValueOnce(new Error('Fail 2'))
          .mockResolvedValueOnce('success');

        const result = await retryWithBackoff(fn, 3, 10);
        expect(result).toBe('success');
        expect(fn).toHaveBeenCalledTimes(3);
      });

      it('should throw after max attempts', async () => {
        const fn = vi.fn().mockRejectedValue(new Error('Always fails'));

        await expect(retryWithBackoff(fn, 2, 10)).rejects.toThrow('Always fails');
        expect(fn).toHaveBeenCalledTimes(2);
      });
    });
  });
}); 