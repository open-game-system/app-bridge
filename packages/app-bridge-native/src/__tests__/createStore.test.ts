import { describe, it, expect, vi } from "vitest"; // Use vitest imports
import { createStore } from "../index"; // Adjust path as needed
import type { State, Event, Store } from "@open-game-system/app-bridge-types";

// --- Test Setup ---
interface TestState extends State {
  count: number;
  lastEvent?: string;
  asyncOpStatus?: "pending" | "done";
}

type TestEvents =
  | { type: "INCREMENT"; amount: number }
  | { type: "DECREMENT" }
  | { type: "ASYNC_START" }
  | { type: "ASYNC_FINISH" }
  | { type: "RESET" };

const initialState: TestState = { count: 0 };

const testProducer = (draft: TestState, event: TestEvents) => {
  draft.lastEvent = event.type;
  switch (event.type) {
    case "INCREMENT":
      draft.count += event.amount;
      break;
    case "DECREMENT":
      if (draft.count > 0) draft.count -= 1;
      break;
    case "ASYNC_START":
      draft.asyncOpStatus = "pending";
      break;
    case "ASYNC_FINISH":
      draft.asyncOpStatus = "done";
      break;
    case "RESET":
      Object.assign(draft, initialState);
      break;
  }
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// --- Tests ---
describe("createStore", () => {
  it("should initialize with the correct state", () => {
    const store = createStore<TestState, TestEvents>({ initialState });
    expect(store.getSnapshot()).toEqual(initialState);
  });

  it("should update state via dispatch and producer", async () => {
    const store = createStore<TestState, TestEvents>({ initialState, producer: testProducer });
    await store.dispatch({ type: "INCREMENT", amount: 5 });
    expect(store.getSnapshot().count).toBe(5);
    expect(store.getSnapshot().lastEvent).toBe("INCREMENT");
    await store.dispatch({ type: "DECREMENT" });
    expect(store.getSnapshot().count).toBe(4);
    expect(store.getSnapshot().lastEvent).toBe("DECREMENT");
  });

  it("should notify subscribe listeners on state change and immediately", async () => {
    const store = createStore<TestState, TestEvents>({ initialState, producer: testProducer });
    const listener = vi.fn(); // Use vi.fn()

    const unsubscribe = store.subscribe(listener);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(initialState);

    await store.dispatch({ type: "INCREMENT", amount: 1 });

    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener).toHaveBeenCalledWith({ count: 1, lastEvent: "INCREMENT" });

    unsubscribe();
    await store.dispatch({ type: "DECREMENT" });

    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("should invoke listeners defined in the `on` configuration", async () => {
    // Use vi.fn() and provide types if needed, though often inferred
    const onIncrementListener =
      vi.fn<
        (
          event: Extract<TestEvents, { type: "INCREMENT" }>,
          store: Store<TestState, TestEvents>,
        ) => void
      >();
    const onDecrementListener = vi.fn<
      (
        event: Extract<TestEvents, { type: "DECREMENT" }>,
        store: Store<TestState, TestEvents>,
      ) => Promise<void>
    >(async (event, store) => {
      await delay(10);
      expect(store.getSnapshot().count).toBe(1);
    });

    const store = createStore<TestState, TestEvents>({
      initialState,
      producer: testProducer,
      on: {
        INCREMENT: onIncrementListener,
        DECREMENT: onDecrementListener,
      },
    });

    await store.dispatch({ type: "INCREMENT", amount: 2 });
    expect(onIncrementListener).toHaveBeenCalledTimes(1);
    expect(onIncrementListener).toHaveBeenCalledWith(
      expect.objectContaining({ type: "INCREMENT", amount: 2 }),
      store,
    );
    expect(onDecrementListener).not.toHaveBeenCalled();

    await store.dispatch({ type: "DECREMENT" });
    expect(onIncrementListener).toHaveBeenCalledTimes(1);
    expect(onDecrementListener).toHaveBeenCalledTimes(1);
    expect(onDecrementListener).toHaveBeenCalledWith(
      expect.objectContaining({ type: "DECREMENT" }),
      store,
    );
  });

  it("should invoke listeners added via the `store.on()` method", async () => {
    const store = createStore<TestState, TestEvents>({ initialState, producer: testProducer });
    const onIncrementListener =
      vi.fn<
        (
          event: Extract<TestEvents, { type: "INCREMENT" }>,
          store: Store<TestState, TestEvents>,
        ) => void
      >();
    const onDecrementListener = vi.fn<
      (
        event: Extract<TestEvents, { type: "DECREMENT" }>,
        store: Store<TestState, TestEvents>,
      ) => Promise<void>
    >(async (event, store) => {
      await delay(5);
    });

    const unsubInc = store.on("INCREMENT", onIncrementListener);
    const unsubDec = store.on("DECREMENT", onDecrementListener);

    await store.dispatch({ type: "INCREMENT", amount: 3 });
    expect(onIncrementListener).toHaveBeenCalledTimes(1);
    expect(onIncrementListener).toHaveBeenCalledWith(
      expect.objectContaining({ type: "INCREMENT", amount: 3 }),
      store,
    );
    expect(onDecrementListener).not.toHaveBeenCalled();

    await store.dispatch({ type: "DECREMENT" });
    expect(onIncrementListener).toHaveBeenCalledTimes(1);
    expect(onDecrementListener).toHaveBeenCalledTimes(1);
    expect(onDecrementListener).toHaveBeenCalledWith(
      expect.objectContaining({ type: "DECREMENT" }),
      store,
    );

    unsubInc();
    await store.dispatch({ type: "INCREMENT", amount: 1 });
    expect(onIncrementListener).toHaveBeenCalledTimes(1);

    unsubDec();
    await store.dispatch({ type: "DECREMENT" });
    expect(onDecrementListener).toHaveBeenCalledTimes(1);
  });

  it("should invoke both configured and dynamic listeners for the same event type", async () => {
    const configListener =
      vi.fn<
        (
          event: Extract<TestEvents, { type: "INCREMENT" }>,
          store: Store<TestState, TestEvents>,
        ) => void
      >();
    const dynamicListener =
      vi.fn<
        (
          event: Extract<TestEvents, { type: "INCREMENT" }>,
          store: Store<TestState, TestEvents>,
        ) => void
      >();

    const store = createStore<TestState, TestEvents>({
      initialState,
      producer: testProducer,
      on: {
        INCREMENT: configListener,
      },
    });

    store.on("INCREMENT", dynamicListener);

    await store.dispatch({ type: "INCREMENT", amount: 7 });

    expect(configListener).toHaveBeenCalledTimes(1);
    expect(dynamicListener).toHaveBeenCalledTimes(1);
    expect(configListener).toHaveBeenCalledWith(
      expect.objectContaining({ type: "INCREMENT", amount: 7 }),
      store,
    );
    expect(dynamicListener).toHaveBeenCalledWith(
      expect.objectContaining({ type: "INCREMENT", amount: 7 }),
      store,
    );
  });

  it("should handle async listeners and execute them without awaiting dispatch", async () => {
    let listenerPromise: Promise<void> | undefined;
    const asyncListener = vi.fn<
      (
        event: Extract<TestEvents, { type: "ASYNC_START" }>,
        store: Store<TestState, TestEvents>,
      ) => void
    >((event, store) => {
      listenerPromise = (async () => {
        expect(store.getSnapshot().asyncOpStatus).toBe("pending");
        await delay(20);
        await store.dispatch({ type: "ASYNC_FINISH" });
      })();
    });

    const store = createStore<TestState, TestEvents>({
      initialState,
      producer: testProducer,
      on: {
        ASYNC_START: asyncListener,
      },
    });

    // Dispatch should return immediately (void)
    store.dispatch({ type: "ASYNC_START" });

    expect(store.getSnapshot().asyncOpStatus).toBe("pending");
    expect(asyncListener).toHaveBeenCalledTimes(1);

    // Check that the async listener is still running
    expect(store.getSnapshot().lastEvent).toBe("ASYNC_START");

    // Wait for the listener explicitly if needed for assertion
    await listenerPromise;

    // Check state after the listener dispatched ASYNC_FINISH
    expect(store.getSnapshot().asyncOpStatus).toBe("done");
    expect(store.getSnapshot().lastEvent).toBe("ASYNC_FINISH");
  });

  it("should reset state to initial state when store.reset() is called", async () => {
    const store = createStore<TestState, TestEvents>({ initialState, producer: testProducer });
    await store.dispatch({ type: "INCREMENT", amount: 10 });
    expect(store.getSnapshot().count).toBe(10);

    store.reset();
    expect(store.getSnapshot()).toEqual(initialState);

    await store.dispatch({ type: "INCREMENT", amount: 1 });
    expect(store.getSnapshot().count).toBe(1);
  });

  it("should handle errors within async listeners gracefully (unhandled rejection)", async () => {
    const errorListener = vi.fn<
      (
        event: Extract<TestEvents, { type: "INCREMENT" }>,
        store: Store<TestState, TestEvents>,
      ) => Promise<void>
    >(async (event, store) => {
      await delay(5);
      throw new Error("Listener Error!");
    });
    const successfulListener =
      vi.fn<
        (
          event: Extract<TestEvents, { type: "INCREMENT" }>,
          store: Store<TestState, TestEvents>,
        ) => void
      >();

    const store = createStore<TestState, TestEvents>({
      initialState,
      producer: testProducer,
      on: {
        INCREMENT: errorListener,
      },
    });
    store.on("INCREMENT", successfulListener);

    // Mock console.error to check if it's called for the unhandled rejection
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    // Dispatch is synchronous
    store.dispatch({ type: "INCREMENT", amount: 1 });

    // Allow time for the async listener promise to reject
    await delay(10);

    expect(errorListener).toHaveBeenCalledTimes(1);
    expect(successfulListener).toHaveBeenCalledTimes(1); // Subsequent listeners should still run
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        '[Native Store] Unhandled promise rejection in async event listener for type "INCREMENT"',
      ),
      expect.any(Error),
    );

    consoleErrorSpy.mockRestore();
  });

  it("should not call subscribe listeners when dispatching without a producer", () => {
    // Kills mutants: L62 (stateChanged=false→true), L63 (config.producer→true), L73 (stateChanged→true)
    const store = createStore<TestState, TestEvents>({ initialState });
    const listener = vi.fn();
    store.subscribe(listener);

    // listener called once immediately by subscribe
    expect(listener).toHaveBeenCalledTimes(1);

    // dispatch without producer should NOT trigger state listeners again
    store.dispatch({ type: "INCREMENT", amount: 1 });
    expect(listener).toHaveBeenCalledTimes(1);
    // state should remain unchanged
    expect(store.getSnapshot()).toEqual(initialState);
  });

  it("should not notify state listeners when producer returns identical state", () => {
    // Kills mutant: L67 (nextState !== currentState → true)
    // Create a producer that explicitly does nothing for a certain event
    const noopProducer = (draft: TestState, event: TestEvents) => {
      if (event.type === "INCREMENT") {
        draft.count += event.amount;
      }
      // DECREMENT intentionally does nothing — no draft mutation
    };
    const store = createStore<TestState, TestEvents>({ initialState, producer: noopProducer });
    const listener = vi.fn();
    store.subscribe(listener);
    expect(listener).toHaveBeenCalledTimes(1);

    // Dispatch event that doesn't modify draft → immer returns same reference
    store.dispatch({ type: "DECREMENT" });
    expect(listener).toHaveBeenCalledTimes(1); // NOT called again

    // Verify dispatch that DOES change state still notifies
    store.dispatch({ type: "INCREMENT", amount: 1 });
    expect(listener).toHaveBeenCalledTimes(2);
    expect(store.getSnapshot().count).toBe(1);
  });

  it("should not log errors when sync event listeners succeed", () => {
    // Kills mutant: L46 (result instanceof Promise → true)
    // If mutated, calling .catch() on undefined (sync return) throws TypeError
    const syncListener = vi.fn();
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const store = createStore<TestState, TestEvents>({
      initialState,
      producer: testProducer,
      on: {
        INCREMENT: syncListener,
      },
    });

    store.dispatch({ type: "INCREMENT", amount: 1 });

    expect(syncListener).toHaveBeenCalledTimes(1);
    // No errors should be logged for a successful sync listener
    expect(consoleErrorSpy).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it("should clean up event listener map entry when last listener unsubscribes", () => {
    // Kills mutants: L102 (listeners.size === 0 → true/false/!==0, block → {})
    const store = createStore<TestState, TestEvents>({ initialState, producer: testProducer });
    const listener1 = vi.fn();
    const listener2 = vi.fn();

    const unsub1 = store.on("INCREMENT", listener1);
    const unsub2 = store.on("INCREMENT", listener2);

    store.dispatch({ type: "INCREMENT", amount: 1 });
    expect(listener1).toHaveBeenCalledTimes(1);
    expect(listener2).toHaveBeenCalledTimes(1);

    // Remove first listener — event type still has listener2
    unsub1();
    store.dispatch({ type: "INCREMENT", amount: 1 });
    expect(listener1).toHaveBeenCalledTimes(1); // not called again
    expect(listener2).toHaveBeenCalledTimes(2);

    // Remove second listener — event type has no listeners
    unsub2();
    // Re-add a listener for same event type. If the Map entry wasn't cleaned up
    // and the mutant replaced `listeners.size === 0` with `true`, the map entry
    // would have been deleted while listener2 was still in it.
    const listener3 = vi.fn();
    store.on("INCREMENT", listener3);
    store.dispatch({ type: "INCREMENT", amount: 1 });
    expect(listener3).toHaveBeenCalledTimes(1);
  });
});
