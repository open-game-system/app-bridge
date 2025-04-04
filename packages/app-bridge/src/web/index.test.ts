/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createWebBridge } from './index';
import { BridgeStoreDefinitions, State, Event } from '../types';
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

interface TestStores extends BridgeStoreDefinitions {
  counter: {
    state: CounterState;
    events: CounterEvent;
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

  describe('getStore', () => {
    it('returns undefined for uninitialize stores', () => {
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

      expect(listener).not.toHaveBeenCalled();
    });

    it('dispatch sends events to native through postMessage', () => {
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
      
      const event: CounterEvent = { type: 'INCREMENT' };
      store.dispatch(event);

      expect(mockPostMessage).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'EVENT',
          storeKey: 'counter',
          event
        })
      );
    });

    it('dispatch sends SET events with value to native through postMessage', () => {
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
      
      const event: CounterEvent = { type: 'SET', value: 42 };
      store.dispatch(event);

      expect(mockPostMessage).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'EVENT',
          storeKey: 'counter',
          event
        })
      );
    });

    it('dispatch warns but does not throw when ReactNativeWebView is not available', () => {
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
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const event: CounterEvent = { type: 'INCREMENT' };
      store.dispatch(event);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Cannot dispatch events: ReactNativeWebView not available'
      );
      expect(mockPostMessage).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('bridge.subscribe', () => {
    it('notifies listeners when stores become available', () => {
      const availabilityListener = vi.fn();
      const unsubscribe = bridge.subscribe(availabilityListener);
      
      expect(availabilityListener).not.toHaveBeenCalled();
      
      // Initialize a store
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
      
      expect(availabilityListener).toHaveBeenCalled();
      
      // Can unsubscribe
      unsubscribe();
      availabilityListener.mockReset();
      
      // Initialize another store
      const stateInit2 = {
        type: 'STATE_INIT',
        storeKey: 'user',
        data: { name: 'John' }
      };

      window.dispatchEvent(
        new MessageEvent('message', {
          data: JSON.stringify(stateInit2)
        })
      );
      
      expect(availabilityListener).not.toHaveBeenCalled();
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
      // First initialize the store so we can get it
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
      listener.mockReset(); // Clear the initial notification
      
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