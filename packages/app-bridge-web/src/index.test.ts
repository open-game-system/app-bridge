/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createWebBridge, BridgeStores, State } from './index';
import { Operation } from 'fast-json-patch';

// Define test-specific types
interface CounterState extends State {
  value: number;
}

type CounterEvent =
  | {
      type: 'SET';
      value: number;
    }
  | {
      type: 'INCREMENT' | 'DECREMENT';
    };

interface TestStores extends BridgeStores {
  counter: {
    state: CounterState;
    events: CounterEvent;
  };
  [key: string]: {
    state: State;
    events: { type: string };
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

  describe('Bridge Ready', () => {
    it('sends BRIDGE_READY message when created', () => {
      expect(mockPostMessage).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'BRIDGE_READY'
        })
      );
    });

    it('sends BRIDGE_READY message when ReactNativeWebView becomes available', () => {
      delete (window as any).ReactNativeWebView;
      mockPostMessage = vi.fn();
      
      // Make ReactNativeWebView available
      (window as any).ReactNativeWebView = {
        postMessage: mockPostMessage
      };

      // Create bridge after ReactNativeWebView is available
      bridge = createWebBridge<TestStores>();

      expect(mockPostMessage).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'BRIDGE_READY'
        })
      );
    });
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

  describe('getStore', () => {
    it('returns undefined for uninitialized stores', () => {
      // No state has been initialized yet
      const store = bridge.getStore('counter');
      expect(store).toBeUndefined();
    });

    it('returns the same store instance for the same key', () => {
      // First initialize a store
      const stateInit = {
        type: 'STATE_INIT',
        storeKey: 'counter',
        data: { value: 0 }
      };

      window.dispatchEvent(
        new MessageEvent('message', {
          data: JSON.stringify(stateInit)
        })
      );

      // Now we can get the store
      const store1 = bridge.getStore('counter');
      const store2 = bridge.getStore('counter');
      expect(store1).toBeDefined();
      expect(store2).toBeDefined();
      expect(store1).toBe(store2);
    });

    it('returns a store with the correct methods', () => {
      // Initialize store
      const stateInit = {
        type: 'STATE_INIT',
        storeKey: 'counter',
        data: { value: 0 }
      };

      window.dispatchEvent(
        new MessageEvent('message', {
          data: JSON.stringify(stateInit)
        })
      );

      const store = bridge.getStore('counter');
      expect(store).toBeDefined();
      if (!store) throw new Error('Store not available');
      
      expect(store.getSnapshot).toBeDefined();
      expect(store.subscribe).toBeDefined();
      expect(store.dispatch).toBeDefined();
    });

    it('getSnapshot returns state immediately after initialization', () => {
      // Initialize store
      const stateInit = {
        type: 'STATE_INIT',
        storeKey: 'counter',
        data: { value: 42 }
      };

      window.dispatchEvent(
        new MessageEvent('message', {
          data: JSON.stringify(stateInit)
        })
      );

      const store = bridge.getStore('counter');
      if (!store) throw new Error('Store not available');
      expect(store.getSnapshot()).toEqual({ value: 42 });
    });

    it('getSnapshot returns updated state after receiving state update message', () => {
      // First initialize the state
      const stateInit = {
        type: 'STATE_INIT',
        storeKey: 'counter',
        data: { value: 0 }
      };

      window.dispatchEvent(
        new MessageEvent('message', {
          data: JSON.stringify(stateInit)
        })
      );

      const store = bridge.getStore('counter');
      if (!store) throw new Error('Store not available');

      // Then update it with patch operations
      const stateUpdate = {
        type: 'STATE_UPDATE',
        storeKey: 'counter',
        operations: [
          { op: 'replace', path: '/value', value: 42 }
        ] as Operation[]
      };

      window.dispatchEvent(
        new MessageEvent('message', {
          data: JSON.stringify(stateUpdate)
        })
      );

      expect(store.getSnapshot()).toEqual({ value: 42 });
    });
  });

  describe('store subscriptions', () => {
    it('subscribe notifies listeners of state changes', () => {
      // Initialize store
      const stateInit = {
        type: 'STATE_INIT',
        storeKey: 'counter',
        data: { value: 0 }
      };

      window.dispatchEvent(
        new MessageEvent('message', {
          data: JSON.stringify(stateInit)
        })
      );

      const store = bridge.getStore('counter');
      if (!store) throw new Error('Store not available');
      
      const listener = vi.fn();
      store.subscribe(listener);

      // Listener should be called immediately with current state
      expect(listener).toHaveBeenCalledWith({ value: 0 });
      
      // Reset the mock to see if it's called again with updates
      listener.mockReset();

      // Send update
      const stateUpdate = {
        type: 'STATE_UPDATE',
        storeKey: 'counter',
        operations: [
          { op: 'replace', path: '/value', value: 42 }
        ] as Operation[]
      };

      window.dispatchEvent(
        new MessageEvent('message', {
          data: JSON.stringify(stateUpdate)
        })
      );

      expect(listener).toHaveBeenCalledWith({ value: 42 });
    });

    it('subscribe allows unsubscribing', () => {
      // Initialize store
      const stateInit = {
        type: 'STATE_INIT',
        storeKey: 'counter',
        data: { value: 0 }
      };

      window.dispatchEvent(
        new MessageEvent('message', {
          data: JSON.stringify(stateInit)
        })
      );

      const store = bridge.getStore('counter');
      if (!store) throw new Error('Store not available');
      
      const listener = vi.fn();
      const unsubscribe = store.subscribe(listener);
      
      // Should be called immediately with current state
      expect(listener).toHaveBeenCalledWith({ value: 0 });
      listener.mockReset();
      
      // Unsubscribe
      unsubscribe();

      // Send update
      const stateUpdate = {
        type: 'STATE_UPDATE',
        storeKey: 'counter',
        operations: [
          { op: 'replace', path: '/value', value: 42 }
        ] as Operation[]
      };

      window.dispatchEvent(
        new MessageEvent('message', {
          data: JSON.stringify(stateUpdate)
        })
      );

      // Listener should not be called after unsubscribe
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('event dispatching', () => {
    it('dispatches events through postMessage', () => {
      // Initialize store
      const stateInit = {
        type: 'STATE_INIT',
        storeKey: 'counter',
        data: { value: 0 }
      };

      window.dispatchEvent(
        new MessageEvent('message', {
          data: JSON.stringify(stateInit)
        })
      );

      const store = bridge.getStore('counter');
      if (!store) throw new Error('Store not available');

      // Dispatch an event
      store.dispatch({ type: 'INCREMENT' });

      // Check that postMessage was called with the correct event
      expect(mockPostMessage).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'EVENT',
          storeKey: 'counter',
          event: { type: 'INCREMENT' }
        })
      );
    });

    it('handles missing ReactNativeWebView gracefully', () => {
      // Initialize store
      const stateInit = {
        type: 'STATE_INIT',
        storeKey: 'counter',
        data: { value: 0 }
      };

      window.dispatchEvent(
        new MessageEvent('message', {
          data: JSON.stringify(stateInit)
        })
      );

      const store = bridge.getStore('counter');
      if (!store) throw new Error('Store not available');

      // Remove ReactNativeWebView
      delete (window as any).ReactNativeWebView;

      // This should not throw
      store.dispatch({ type: 'INCREMENT' });
    });
  });

  describe('error handling', () => {
    it('handles invalid message data gracefully', () => {
      // Send invalid JSON
      window.dispatchEvent(
        new MessageEvent('message', {
          data: 'invalid json'
        })
      );

      // This should not throw
      expect(bridge.getStore('counter')).toBeUndefined();
    });

    it('handles unknown message types gracefully', () => {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: JSON.stringify({
            type: 'UNKNOWN',
            storeKey: 'counter',
            data: { value: 0 }
          })
        })
      );

      // This should not throw
      expect(bridge.getStore('counter')).toBeUndefined();
    });
  });
}); 