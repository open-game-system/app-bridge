import { describe, test, expect, vi, beforeEach } from 'vitest';
import { createNativeBridge, WebView } from './index';
import { Operation } from 'fast-json-patch';
import type { BridgeStoreDefinitions, State, Event, BridgeWebView } from '../types';

interface CounterState extends State {
  value: number;
}

type CounterEvents = 
  | { type: 'INCREMENT' }
  | { type: 'DECREMENT' }
  | { type: 'SET'; value?: number };

interface TestStores extends BridgeStoreDefinitions {
  counter: {
    state: CounterState;
    events: CounterEvents;
  };
}

// Create a mock WebView implementation for testing
class MockWebView implements WebView {
  public onMessage: (event: { nativeEvent: { data: string } }) => void = () => {};
  public messageQueue: string[] = [];
  
  postMessage(message: string): void {
    this.messageQueue.push(message);
  }
  
  // Helper to simulate a message event from the web to native
  simulateMessage(data: string): void {
    this.onMessage({ nativeEvent: { data } });
  }
}

describe('createNativeBridge', () => {
  test('creates a bridge with initial state', () => {
    const initialState = {
      counter: { value: 0 },
    };
    
    const bridge = createNativeBridge({
      initialState,
    });
    
    const counterStore = bridge.getStore('counter');
    expect(counterStore?.getSnapshot()).toEqual({ value: 0 });
  });
  
  test('handles multiple stores', () => {
    const initialState = {
      counter: { value: 0 },
      user: { name: 'John', loggedIn: false },
    };
    
    const bridge = createNativeBridge({
      initialState,
    });
    
    const counterStore = bridge.getStore('counter');
    const userStore = bridge.getStore('user');
    
    expect(counterStore?.getSnapshot()).toEqual({ value: 0 });
    expect(userStore?.getSnapshot()).toEqual({ name: 'John', loggedIn: false });
  });
  
  test('updates state and notifies listeners', () => {
    const initialState = {
      counter: { value: 0 },
    };
    
    const bridge = createNativeBridge({
      initialState,
    });
    
    const counterStore = bridge.getStore('counter');
    const listener = vi.fn();
    
    counterStore?.subscribe(listener);
    
    counterStore?.produce(draft => {
      draft.value = 1;
    });
    
    expect(counterStore?.getSnapshot()).toEqual({ value: 1 });
    expect(listener).toHaveBeenCalledWith({ value: 1 });
  });
  
  test('resets state to initial state', () => {
    const initialState = {
      counter: { value: 0 },
    };
    
    const bridge = createNativeBridge({
      initialState,
    });
    
    const counterStore = bridge.getStore('counter');
    const listener = vi.fn();
    
    counterStore?.subscribe(listener);
    
    counterStore?.produce(draft => {
      draft.value = 5;
    });
    
    expect(counterStore?.getSnapshot()).toEqual({ value: 5 });
    
    bridge.reset('counter');
    
    expect(counterStore?.getSnapshot()).toEqual({ value: 0 });
    expect(listener).toHaveBeenLastCalledWith({ value: 0 });
  });
  
  test('uses immer for state updates', () => {
    const initialState = {
      counter: { value: 0, history: [0] },
    };
    
    const bridge = createNativeBridge({
      initialState,
    });
    
    const counterStore = bridge.getStore('counter');
    
    // This should create a new object without mutating the original
    counterStore?.produce(draft => {
      draft.value = 1;
      (draft as any).history.push(1);
    });
    
    expect(counterStore?.getSnapshot()).toEqual({ value: 1, history: [0, 1] });
    
    // The original initialState should not be modified
    expect(initialState.counter).toEqual({ value: 0, history: [0] });
  });
  
  // WebView integration tests
  describe('WebView integration', () => {
    let bridge: ReturnType<typeof createNativeBridge>;
    let webView: MockWebView;
    
    beforeEach(() => {
      // Create a fresh bridge and WebView for each test
      bridge = createNativeBridge({
        initialState: {
          counter: { value: 0 },
          user: { name: 'John', loggedIn: false },
        },
      });
      
      webView = new MockWebView();
    });
    
    test('registers a WebView and sends initial state', () => {
      const unsubscribe = bridge.registerWebView(webView);
      
      // Should receive initial state messages for all stores
      expect(webView.messageQueue.length).toBe(2);
      
      const counterMsg = JSON.parse(webView.messageQueue[0]);
      const userMsg = JSON.parse(webView.messageQueue[1]);
      
      expect(counterMsg).toEqual({
        type: 'STATE_INIT',
        storeKey: 'counter',
        data: { value: 0 },
      });
      
      expect(userMsg).toEqual({
        type: 'STATE_INIT',
        storeKey: 'user',
        data: { name: 'John', loggedIn: false },
      });
      
      // Cleanup
      unsubscribe();
    });
    
    test('handles messages from WebView', () => {
      bridge.registerWebView(webView);
      
      // Clear the initial messages
      webView.messageQueue = [];
      
      // Simulate a message from the WebView
      webView.simulateMessage(JSON.stringify({
        type: 'EVENT',
        storeKey: 'counter',
        event: { type: 'INCREMENT' },
      }));
      
      // The counter should be incremented
      const counterStore = bridge.getStore('counter');
      expect(counterStore?.getSnapshot()).toEqual({ value: 1 });
      
      // Should receive a state update message
      expect(webView.messageQueue.length).toBe(1);
      
      const updateMsg = JSON.parse(webView.messageQueue[0]);
      
      expect(updateMsg.type).toBe('STATE_UPDATE');
      expect(updateMsg.storeKey).toBe('counter');
      expect(updateMsg.operations).toBeInstanceOf(Array);
      expect(updateMsg.operations.length).toBeGreaterThan(0);
      
      // Check that the operations properly update the state
      const testState = { value: 0 };
      updateMsg.operations.forEach((op: Operation) => {
        if (op.op === 'replace' && op.path === '/value') {
          testState.value = op.value;
        }
      });
      
      expect(testState).toEqual({ value: 1 });
    });
    
    test('calls original message handler on unsubscribe', () => {
      const originalHandler = vi.fn();
      webView.onMessage = originalHandler;
      
      const unsubscribe = bridge.registerWebView(webView);
      
      // Handler should be replaced
      expect(webView.onMessage).not.toBe(originalHandler);
      
      // Unsubscribe should restore the original handler
      unsubscribe();
      
      expect(webView.onMessage).toBe(originalHandler);
    });
    
    test('broadcasts state updates to registered WebViews', () => {
      const webView1 = new MockWebView();
      const webView2 = new MockWebView();
      
      const unsubscribe1 = bridge.registerWebView(webView1);
      const unsubscribe2 = bridge.registerWebView(webView2);
      
      // Clear initial messages
      webView1.messageQueue = [];
      webView2.messageQueue = [];
      
      // Update the counter state
      const counterStore = bridge.getStore('counter');
      counterStore?.produce(draft => {
        draft.value = 10;
      });
      
      // Both WebViews should receive the update
      expect(webView1.messageQueue.length).toBe(1);
      expect(webView2.messageQueue.length).toBe(1);
      
      const updateMsg1 = JSON.parse(webView1.messageQueue[0]);
      const updateMsg2 = JSON.parse(webView2.messageQueue[0]);
      
      expect(updateMsg1.type).toBe('STATE_UPDATE');
      expect(updateMsg1.storeKey).toBe('counter');
      expect(updateMsg2.type).toBe('STATE_UPDATE');
      expect(updateMsg2.storeKey).toBe('counter');
      
      // Cleanup
      unsubscribe1();
      unsubscribe2();
    });
    
    test('unsubscribed WebViews do not receive updates', () => {
      const unsubscribe = bridge.registerWebView(webView);
      
      // Clear initial messages
      webView.messageQueue = [];
      
      // Unsubscribe the WebView
      unsubscribe();
      
      // Update the counter state
      const counterStore = bridge.getStore('counter');
      counterStore?.produce(draft => {
        draft.value = 10;
      });
      
      // WebView should not receive the update
      expect(webView.messageQueue.length).toBe(0);
    });
    
    test('handles specific event types', () => {
      bridge.registerWebView(webView);
      
      // Clear initial messages
      webView.messageQueue = [];
      
      // Test INCREMENT event
      webView.simulateMessage(JSON.stringify({
        type: 'EVENT',
        storeKey: 'counter',
        event: { type: 'INCREMENT' },
      }));
      
      let counterStore = bridge.getStore('counter');
      expect(counterStore?.getSnapshot()).toEqual({ value: 1 });
      
      // Test DECREMENT event
      webView.simulateMessage(JSON.stringify({
        type: 'EVENT',
        storeKey: 'counter',
        event: { type: 'DECREMENT' },
      }));
      
      counterStore = bridge.getStore('counter');
      expect(counterStore?.getSnapshot()).toEqual({ value: 0 });
      
      // Test SET event
      webView.simulateMessage(JSON.stringify({
        type: 'EVENT',
        storeKey: 'counter',
        event: { type: 'SET', value: 42 },
      }));
      
      counterStore = bridge.getStore('counter');
      expect(counterStore?.getSnapshot()).toEqual({ value: 42 });
    });
    
    test('original handler is called before processing message', () => {
      const originalHandler = vi.fn();
      webView.onMessage = originalHandler;
      
      bridge.registerWebView(webView);
      
      // Simulate a message
      webView.simulateMessage(JSON.stringify({
        type: 'EVENT',
        storeKey: 'counter',
        event: { type: 'INCREMENT' },
      }));
      
      // Original handler should have been called
      expect(originalHandler).toHaveBeenCalled();
      
      // And the event should have been processed
      const counterStore = bridge.getStore('counter');
      expect(counterStore?.getSnapshot()).toEqual({ value: 1 });
    });
  });
}); 