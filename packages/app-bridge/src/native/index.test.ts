import { Operation } from "fast-json-patch";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { createNativeBridge, WebView } from "./index";
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
  public onMessage: (event: { nativeEvent: { data: string } }) => void =
    () => {};
  public messageQueue: string[] = [];

  postMessage(message: string): void {
    this.messageQueue.push(message);
  }

  // Helper to simulate a message event from the web to native
  simulateMessage(data: string): void {
    this.onMessage({ nativeEvent: { data } });
  }
}

describe("createNativeBridge", () => {
  test("creates a bridge with initial state", () => {
    const initialState = {
      counter: { value: 0 },
    };

    const bridge = createNativeBridge({
      initialState,
    });

    const counterStore = bridge.getStore("counter");
    expect(counterStore?.getSnapshot()).toEqual({ value: 0 });
  });

  test("handles multiple stores", () => {
    const initialState = {
      counter: { value: 0 },
      user: { name: "John", loggedIn: false },
    };

    const bridge = createNativeBridge({
      initialState,
    });

    const counterStore = bridge.getStore("counter");
    const userStore = bridge.getStore("user");

    expect(counterStore?.getSnapshot()).toEqual({ value: 0 });
    expect(userStore?.getSnapshot()).toEqual({ name: "John", loggedIn: false });
  });

  test("updates state and notifies listeners", () => {
    const initialState = {
      counter: { value: 0 },
    };

    const bridge = createNativeBridge({
      initialState,
    });

    const counterStore = bridge.getStore("counter");
    const listener = vi.fn();

    counterStore?.subscribe(listener);

    counterStore?.produce((draft) => {
      draft.value = 1;
    });

    expect(counterStore?.getSnapshot()).toEqual({ value: 1 });
    expect(listener).toHaveBeenCalledWith({ value: 1 });
  });

  test("resets state to initial state", () => {
    const initialState = {
      counter: { value: 0 },
    };

    const bridge = createNativeBridge({
      initialState,
    });

    const counterStore = bridge.getStore("counter");
    const listener = vi.fn();

    counterStore?.subscribe(listener);

    counterStore?.produce((draft) => {
      draft.value = 5;
    });

    expect(counterStore?.getSnapshot()).toEqual({ value: 5 });

    bridge.reset("counter");

    expect(counterStore?.getSnapshot()).toEqual({ value: 0 });
    expect(listener).toHaveBeenLastCalledWith({ value: 0 });
  });

  test("uses immer for state updates", () => {
    const initialState = {
      counter: { value: 0, history: [0] },
    };

    const bridge = createNativeBridge({
      initialState,
    });

    const counterStore = bridge.getStore("counter");

    // This should create a new object without mutating the original
    counterStore?.produce((draft) => {
      draft.value = 1;
      (draft as any).history.push(1);
    });

    expect(counterStore?.getSnapshot()).toEqual({ value: 1, history: [0, 1] });

    // The original initialState should not be modified
    expect(initialState.counter).toEqual({ value: 0, history: [0] });
  });

  // Test the producers feature
  describe("Producers", () => {
    test("handles events with a producer", () => {
      const config = {
        initialState: {
          counter: { value: 0 },
        },
        producers: {
          counter: (draft: CounterState, event: CounterEvents) => {
            switch (event.type) {
              case "INCREMENT":
                draft.value += 1;
                break;
              case "DECREMENT":
                draft.value -= 1;
                break;
              case "SET":
                if ("value" in event && typeof event.value === "number") {
                  draft.value = event.value;
                }
                break;
            }
          },
        }
      };

      // Use type assertion to bypass compiler checks
      const bridge = createNativeBridge<TestStores>(config as any);

      const webView = new MockWebView();
      bridge.registerWebView(webView);
      
      // Clear the initial state messages
      webView.messageQueue = [];
      
      // Simulate an INCREMENT event
      webView.simulateMessage(JSON.stringify({
        type: "EVENT",
        storeKey: "counter",
        event: { type: "INCREMENT" },
      }));
      
      // Check that the state was updated
      const counterStore = bridge.getStore("counter");
      expect(counterStore?.getSnapshot()).toEqual({ value: 1 });
      
      // Simulate a SET event
      webView.simulateMessage(JSON.stringify({
        type: "EVENT",
        storeKey: "counter",
        event: { type: "SET", value: 42 },
      }));
      
      // Check that the state was updated
      expect(counterStore?.getSnapshot()).toEqual({ value: 42 });
      
      // Simulate a DECREMENT event
      webView.simulateMessage(JSON.stringify({
        type: "EVENT",
        storeKey: "counter",
        event: { type: "DECREMENT" },
      }));
      
      // Check that the state was updated
      expect(counterStore?.getSnapshot()).toEqual({ value: 41 });
    });
    
    test("does not update state when no producer is defined", () => {
      // Create a bridge with no producers
      const bridge = createNativeBridge<TestStores>({
        initialState: {
          counter: { value: 10 },
        },
        // No producers defined
      });
      
      const webView = new MockWebView();
      const consoleLogSpy = vi.spyOn(console, "log");
      
      bridge.registerWebView(webView);
      
      // Clear the initial state messages
      webView.messageQueue = [];
      
      // Simulate an INCREMENT event
      webView.simulateMessage(JSON.stringify({
        type: "EVENT",
        storeKey: "counter",
        event: { type: "INCREMENT" },
      }));
      
      // State should not change without a producer
      const counterStore = bridge.getStore("counter");
      expect(counterStore?.getSnapshot()).toEqual({ value: 10 });
      
      // Should log that no producer was found
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("No producer found for store counter")
      );
    });
    
    test("handles events with multiple producers", () => {
      interface UserState extends State {
        name: string;
        loggedIn: boolean;
      }

      type UserEvents = { type: 'LOGIN'; username?: string };

      interface MultiStoreTest extends BridgeStoreDefinitions {
        counter: {
          state: CounterState;
          events: CounterEvents;
        };
        user: {
          state: UserState;
          events: UserEvents;
        };
      }

      const config = {
        initialState: {
          counter: { value: 0 },
          user: { name: "", loggedIn: false },
        },
        producers: {
          counter: (draft: CounterState, event: CounterEvents) => {
            if (event.type === "INCREMENT") {
              draft.value += 1;
            }
          },
          user: (draft: UserState, event: UserEvents) => {
            if (event.type === "LOGIN") {
              draft.loggedIn = true;
              if ("username" in event && typeof event.username === 'string') {
                draft.name = event.username;
              }
            }
          },
        },
      };

      const bridge = createNativeBridge<MultiStoreTest>(config as any);
      
      const webView = new MockWebView();
      bridge.registerWebView(webView);
      
      // Clear the initial state messages
      webView.messageQueue = [];
      
      // Simulate an INCREMENT event for counter
      webView.simulateMessage(JSON.stringify({
        type: "EVENT",
        storeKey: "counter",
        event: { type: "INCREMENT" },
      }));
      
      // Simulate a LOGIN event for user
      webView.simulateMessage(JSON.stringify({
        type: "EVENT",
        storeKey: "user",
        event: { type: "LOGIN", username: "john" },
      }));
      
      // Check that both stores were updated correctly
      const counterStore = bridge.getStore("counter");
      const userStore = bridge.getStore("user");
      
      expect(counterStore?.getSnapshot()).toEqual({ value: 1 });
      expect(userStore?.getSnapshot()).toEqual({ name: "john", loggedIn: true });
    });
  });

  // WebView integration tests
  describe("WebView integration", () => {
    let bridge: ReturnType<typeof createNativeBridge<TestStores>>;
    let webView: MockWebView;
    
    beforeEach(() => {
      // Create a fresh bridge and WebView for each test
      const config = {
        initialState: {
          counter: { value: 0 },
          user: { name: "John", loggedIn: false },
        },
        producers: {
          counter: (draft: CounterState, event: CounterEvents) => {
            if (event.type === "INCREMENT") {
              draft.value += 1;
            } else if (event.type === "DECREMENT") {
              draft.value -= 1;
            }
          },
        }
      };

      bridge = createNativeBridge<TestStores>(config as any);
      
      webView = new MockWebView();
    });

    test("registers a WebView and sends initial state", () => {
      const unsubscribe = bridge.registerWebView(webView);

      // Should receive initial state messages for all stores
      expect(webView.messageQueue.length).toBe(2);

      const counterMsg = JSON.parse(webView.messageQueue[0]);
      const userMsg = JSON.parse(webView.messageQueue[1]);

      expect(counterMsg).toEqual({
        type: "STATE_INIT",
        storeKey: "counter",
        data: { value: 0 },
      });

      expect(userMsg).toEqual({
        type: "STATE_INIT",
        storeKey: "user",
        data: { name: "John", loggedIn: false },
      });

      // Cleanup
      unsubscribe();
    });

    test("handles messages from WebView", () => {
      bridge.registerWebView(webView);

      // Clear the initial messages
      webView.messageQueue = [];

      // Simulate a message from the WebView
      webView.simulateMessage(
        JSON.stringify({
          type: "EVENT",
          storeKey: "counter",
          event: { type: "INCREMENT" },
        })
      );

      // The counter should be incremented
      const counterStore = bridge.getStore("counter");
      expect(counterStore?.getSnapshot()).toEqual({ value: 1 });

      // Should receive a state update message
      expect(webView.messageQueue.length).toBe(1);

      const updateMsg = JSON.parse(webView.messageQueue[0]);

      expect(updateMsg.type).toBe("STATE_UPDATE");
      expect(updateMsg.storeKey).toBe("counter");
      expect(updateMsg.operations).toBeInstanceOf(Array);
      expect(updateMsg.operations.length).toBeGreaterThan(0);

      // Check that the operations properly update the state
      const testState = { value: 0 };
      updateMsg.operations.forEach((op: Operation) => {
        if (op.op === "replace" && op.path === "/value") {
          testState.value = op.value;
        }
      });

      expect(testState).toEqual({ value: 1 });
    });

    test("calls original message handler on unsubscribe", () => {
      const originalHandler = vi.fn();
      webView.onMessage = originalHandler;

      const unsubscribe = bridge.registerWebView(webView);

      // Handler should be replaced
      expect(webView.onMessage).not.toBe(originalHandler);

      // Unsubscribe should restore the original handler
      unsubscribe();

      expect(webView.onMessage).toBe(originalHandler);
    });

    test("broadcasts state updates to registered WebViews", () => {
      const webView1 = new MockWebView();
      const webView2 = new MockWebView();

      const unsubscribe1 = bridge.registerWebView(webView1);
      const unsubscribe2 = bridge.registerWebView(webView2);

      // Clear initial messages
      webView1.messageQueue = [];
      webView2.messageQueue = [];

      // Update the counter state
      const counterStore = bridge.getStore("counter");
      counterStore?.produce((draft) => {
        draft.value = 10;
      });

      // Both WebViews should receive the update
      expect(webView1.messageQueue.length).toBe(1);
      expect(webView2.messageQueue.length).toBe(1);

      const updateMsg1 = JSON.parse(webView1.messageQueue[0]);
      const updateMsg2 = JSON.parse(webView2.messageQueue[0]);

      expect(updateMsg1.type).toBe("STATE_UPDATE");
      expect(updateMsg1.storeKey).toBe("counter");
      expect(updateMsg2.type).toBe("STATE_UPDATE");
      expect(updateMsg2.storeKey).toBe("counter");

      // Cleanup
      unsubscribe1();
      unsubscribe2();
    });

    test("unsubscribed WebViews do not receive updates", () => {
      const unsubscribe = bridge.registerWebView(webView);

      // Clear initial messages
      webView.messageQueue = [];

      // Unsubscribe the WebView
      unsubscribe();

      // Update the counter state
      const counterStore = bridge.getStore("counter");
      counterStore?.produce((draft) => {
        draft.value = 10;
      });

      // WebView should not receive the update
      expect(webView.messageQueue.length).toBe(0);
    });

    test("handles specific event types using producers", () => {
      bridge.registerWebView(webView);

      // Clear initial messages
      webView.messageQueue = [];

      // Test INCREMENT event
      webView.simulateMessage(
        JSON.stringify({
          type: "EVENT",
          storeKey: "counter",
          event: { type: "INCREMENT" },
        })
      );

      let counterStore = bridge.getStore("counter");
      expect(counterStore?.getSnapshot()).toEqual({ value: 1 });

      // Test DECREMENT event
      webView.simulateMessage(
        JSON.stringify({
          type: "EVENT",
          storeKey: "counter",
          event: { type: "DECREMENT" },
        })
      );

      counterStore = bridge.getStore("counter");
      expect(counterStore?.getSnapshot()).toEqual({ value: 0 });
    });

    test("original handler is called before processing message", () => {
      const originalHandler = vi.fn();
      webView.onMessage = originalHandler;

      bridge.registerWebView(webView);

      // Simulate a message
      webView.simulateMessage(
        JSON.stringify({
          type: "EVENT",
          storeKey: "counter",
          event: { type: "INCREMENT" },
        })
      );

      // Original handler should have been called
      expect(originalHandler).toHaveBeenCalled();

      // And the event should have been processed
      const counterStore = bridge.getStore("counter");
      expect(counterStore?.getSnapshot()).toEqual({ value: 1 });
    });
  });
});
