/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createWebBridge } from './index';
import type { BridgeStores } from '../types';

interface CounterState {
  value: number;
}

interface CounterEvents {
  type: 'INCREMENT' | 'DECREMENT' | 'SET';
  value?: number;
}

interface TestStores extends BridgeStores {
  counter: {
    state: CounterState;
    events: CounterEvents;
  };
}

describe('Web Bridge', () => {
  let bridge: ReturnType<typeof createWebBridge<TestStores>>;
  let mockPostMessage: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockPostMessage = vi.fn();
    // Mock ReactNativeWebView
    (window as any).ReactNativeWebView = {
      postMessage: mockPostMessage
    };
    bridge = createWebBridge<TestStores>();
  });

  afterEach(() => {
    delete (window as any).ReactNativeWebView;
    vi.clearAllMocks();
  });

  describe('isSupported', () => {
    it('returns true when ReactNativeWebView is available', () => {
      expect(bridge.isSupported()).toBe(true);
    });

    it('returns false when ReactNativeWebView is not available', () => {
      delete (window as any).ReactNativeWebView;
      expect(bridge.isSupported()).toBe(false);
    });
  });

  describe('getSnapshot', () => {
    it('returns empty state initially', () => {
      expect(bridge.getSnapshot()).toEqual({});
    });

    it('returns updated state after receiving state update message', () => {
      const stateUpdate = {
        type: 'STATE_UPDATE',
        storeKey: 'counter',
        data: { value: 42 }
      };

      // Simulate message from native
      window.dispatchEvent(
        new MessageEvent('message', {
          data: JSON.stringify(stateUpdate)
        })
      );

      expect(bridge.getSnapshot()).toEqual({
        counter: { value: 42 }
      });
    });
  });

  describe('subscribe', () => {
    it('notifies listeners of state changes', () => {
      const listener = vi.fn();
      bridge.subscribe('counter', listener);

      const stateUpdate = {
        type: 'STATE_UPDATE',
        storeKey: 'counter',
        data: { value: 42 }
      };

      window.dispatchEvent(
        new MessageEvent('message', {
          data: JSON.stringify(stateUpdate)
        })
      );

      expect(listener).toHaveBeenCalledWith({ value: 42 });
    });

    it('allows unsubscribing', () => {
      const listener = vi.fn();
      const unsubscribe = bridge.subscribe('counter', listener);
      unsubscribe();

      const stateUpdate = {
        type: 'STATE_UPDATE',
        storeKey: 'counter',
        data: { value: 42 }
      };

      window.dispatchEvent(
        new MessageEvent('message', {
          data: JSON.stringify(stateUpdate)
        })
      );

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('dispatch', () => {
    it('sends events to native through postMessage', () => {
      const event: CounterEvents = { type: 'INCREMENT' };
      bridge.dispatch('counter', event);

      expect(mockPostMessage).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'EVENT',
          storeKey: 'counter',
          event
        })
      );
    });

    it('warns but does not throw when ReactNativeWebView is not available', () => {
      delete (window as any).ReactNativeWebView;
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const event: CounterEvents = { type: 'INCREMENT' };
      bridge.dispatch('counter', event);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Cannot dispatch events: ReactNativeWebView not available'
      );
      expect(mockPostMessage).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('message handling', () => {
    it('handles malformed messages gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      window.dispatchEvent(
        new MessageEvent('message', {
          data: 'not json'
        })
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error handling message:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('ignores messages with unknown types', () => {
      const listener = vi.fn();
      bridge.subscribe('counter', listener);

      const unknownMessage = {
        type: 'UNKNOWN',
        storeKey: 'counter',
        data: { value: 42 }
      };

      window.dispatchEvent(
        new MessageEvent('message', {
          data: JSON.stringify(unknownMessage)
        })
      );

      expect(listener).not.toHaveBeenCalled();
    });
  });
}); 