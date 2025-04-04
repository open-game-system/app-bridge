import { describe, expect, it, vi } from "vitest";
import type { BridgeStoreDefinitions, State } from "../types";
import { createMockBridge } from "./index";

interface CounterState extends State {
  value: number;
}

type CounterEvent =
  | { type: "INCREMENT" }
  | { type: "DECREMENT" }
  | { type: "SET"; value: number };

interface UserState extends State {
  name: string;
  age: number;
}

type UserEvent =
  | { type: "SET_NAME"; name: string }
  | { type: "SET_AGE"; age: number };

interface TestStores extends BridgeStoreDefinitions {
  counter: {
    state: CounterState;
    events: CounterEvent;
  };
  user: {
    state: UserState;
    events: UserEvent;
  };
}

describe("createMockBridge", () => {
  it("should create a bridge with initial state", () => {
    const bridge = createMockBridge<TestStores>({
      isSupported: true,
      initialState: {
        counter: { value: 42 },
      },
    });

    const counterStore = bridge.getStore("counter");
    expect(counterStore?.getSnapshot()).toEqual({ value: 42 });
  });

  it("should record dispatched events", () => {
    const bridge = createMockBridge<TestStores>({
      isSupported: true,
      initialState: {
        counter: { value: 0 },
      },
    });

    const counterStore = bridge.getStore("counter");
    if (!counterStore) throw new Error("Store not available");

    counterStore.dispatch({ type: "INCREMENT" });
    expect(bridge.getHistory("counter")).toEqual([{ type: "INCREMENT" }]);

    counterStore.dispatch({ type: "DECREMENT" });
    expect(bridge.getHistory("counter")).toEqual([
      { type: "INCREMENT" },
      { type: "DECREMENT" },
    ]);

    counterStore.dispatch({ type: "SET", value: 42 });
    expect(bridge.getHistory("counter")).toEqual([
      { type: "INCREMENT" },
      { type: "DECREMENT" },
      { type: "SET", value: 42 },
    ]);
  });

  it("should handle subscriptions", () => {
    const bridge = createMockBridge<TestStores>({
      isSupported: true,
      initialState: {
        counter: { value: 0 },
      },
    });

    const counterStore = bridge.getStore("counter");
    if (!counterStore) throw new Error("Store not available");
    const listener = vi.fn();
    counterStore.subscribe(listener);

    // Initial state
    expect(listener).toHaveBeenCalledWith({ value: 0 });

    // State updates via produce
    counterStore.produce((state: CounterState) => {
      state.value = 1;
    });
    expect(listener).toHaveBeenCalledWith({ value: 1 });
  });

  it("should handle unsubscribe", () => {
    const bridge = createMockBridge<TestStores>({
      isSupported: true,
      initialState: {
        counter: { value: 0 },
      },
    });

    const counterStore = bridge.getStore("counter");
    if (!counterStore) throw new Error("Store not available");
    const listener = vi.fn();
    const unsubscribe = counterStore.subscribe(listener);

    counterStore.produce((state: CounterState) => {
      state.value = 1;
    });
    expect(listener).toHaveBeenCalledTimes(2); // Initial + produce

    unsubscribe();
    counterStore.produce((state: CounterState) => {
      state.value = 2;
    });
    expect(listener).toHaveBeenCalledTimes(2); // No additional calls
  });

  it("should handle reset", () => {
    const bridge = createMockBridge<TestStores>({
      isSupported: true,
      initialState: {
        counter: { value: 0 },
      },
    });

    const counterStore = bridge.getStore("counter");
    if (!counterStore) throw new Error("Store not available");

    // Dispatch some events
    counterStore.dispatch({ type: "INCREMENT" });
    counterStore.dispatch({ type: "INCREMENT" });
    expect(bridge.getHistory("counter")).toHaveLength(2);

    // Reset the store
    bridge.reset("counter");
    expect(counterStore.getSnapshot()).toEqual({ value: 0 });
    expect(bridge.getHistory("counter")).toHaveLength(0);
  });

  it("should handle produce for direct state manipulation", () => {
    const bridge = createMockBridge<TestStores>({
      isSupported: true,
      initialState: {
        counter: { value: 0 },
      },
    });

    const counterStore = bridge.getStore("counter");
    if (!counterStore) throw new Error("Store not available");
    const listener = vi.fn();
    counterStore.subscribe(listener);

    counterStore.produce((state: CounterState) => {
      state.value = 42;
    });

    expect(counterStore.getSnapshot()).toEqual({ value: 42 });
    expect(listener).toHaveBeenCalledWith({ value: 42 });
  });

  it("should check if bridge is supported", () => {
    const bridge = createMockBridge<TestStores>({
      isSupported: true,
      initialState: {
        counter: { value: 0 },
      },
    });

    expect(bridge.isSupported()).toBe(true);

    const unsupportedBridge = createMockBridge<TestStores>({
      isSupported: false,
      initialState: {
        counter: { value: 0 },
      },
    });

    expect(unsupportedBridge.isSupported()).toBe(false);
  });

  describe("store availability", () => {
    it("should return undefined for unavailable stores", () => {
      const bridge = createMockBridge<TestStores>({
        initialState: {
          counter: { value: 0 },
        },
      });

      const counterStore = bridge.getStore("counter");
      expect(counterStore).toBeDefined();

      const userStore = bridge.getStore("user");
      expect(userStore).toBeUndefined();
    });

    it("should notify listeners of store availability changes", () => {
      const bridge = createMockBridge<TestStores>();
      const listener = vi.fn();
      const unsubscribe = bridge.subscribe(listener);

      // Initially no stores available
      expect(listener).toHaveBeenCalledTimes(0);
      const counterStoreBefore = bridge.getStore("counter");
      expect(counterStoreBefore).toBeUndefined();

      bridge.setState("counter", { value: 0 });

      // Make counter store available
      expect(listener).toHaveBeenCalledTimes(1);

      const counterStoreAfter = bridge.getStore("counter");
      expect(counterStoreAfter).toBeDefined();
      unsubscribe();
    });
  });

  describe("error cases", () => {
    it("should handle invalid store keys", () => {
      const bridge = createMockBridge<TestStores>();

      // Use a type assertion that maintains some type safety
      // This simulates accessing a non-existent store
      const store = bridge.getStore("invalid" as unknown as keyof TestStores);
      expect(store).toBeUndefined();
    });

  });

  describe("type safety", () => {
    it("should enforce event types", () => {
      const bridge = createMockBridge<TestStores>({
        initialState: {
          counter: { value: 0 },
        },
      });

      const counterStore = bridge.getStore("counter");
      if (!counterStore) throw new Error("Store not available");

      // Valid event
      counterStore.dispatch({ type: "INCREMENT" });

      // These tests verify compile-time type checking
      // We wrap them in functions so we can add ts-expect-error

      function dispatchInvalidType() {
        // @ts-expect-error - This should fail type checking due to invalid event type
        counterStore.dispatch({ type: "INVALID" });
      }

      function dispatchInvalidPayload() {
        // @ts-expect-error - This should fail type checking due to invalid payload type
        counterStore.dispatch({ type: "SET", value: "not a number" });
      }

      // We don't expect these to throw at runtime since we're only testing
      // the type system's ability to catch errors at compile time
      // No assertions needed as the @ts-expect-error comments verify the type checks
    });
  });

  describe("multiple stores", () => {
    it("should handle multiple stores independently", () => {
      const bridge = createMockBridge<TestStores>({
        initialState: {
          counter: { value: 0 },
          user: { name: "John", age: 30 },
        },
      });

      const counterStore = bridge.getStore("counter");
      const userStore = bridge.getStore("user");
      if (!counterStore || !userStore) throw new Error("Stores not available");

      // Update counter
      counterStore.produce((state: CounterState) => {
        state.value = 1;
      });
      expect(counterStore.getSnapshot()).toEqual({ value: 1 });
      expect(userStore.getSnapshot()).toEqual({ name: "John", age: 30 });

      // Update user
      userStore.produce((state: UserState) => {
        state.name = "Jane";
      });
      expect(counterStore.getSnapshot()).toEqual({ value: 1 });
      expect(userStore.getSnapshot()).toEqual({ name: "Jane", age: 30 });
    });

    it("should reset all stores when no key provided", () => {
      const bridge = createMockBridge<TestStores>({
        initialState: {
          counter: { value: 0 },
          user: { name: "John", age: 30 },
        },
      });

      const counterStore = bridge.getStore("counter");
      const userStore = bridge.getStore("user");
      if (!counterStore || !userStore) throw new Error("Stores not available");

      // Make some changes
      counterStore.produce((state) => {
        state.value = 42;
      });
      userStore.produce((state) => {
        state.name = "Jane";
        state.age = 25;
      });

      // Reset all stores
      bridge.reset();

      expect(counterStore.getSnapshot()).toEqual({ value: 0 });
      expect(userStore.getSnapshot()).toEqual({ name: "John", age: 30 });
      expect(bridge.getHistory("counter")).toHaveLength(0);
      expect(bridge.getHistory("user")).toHaveLength(0);
    });
  });
});
