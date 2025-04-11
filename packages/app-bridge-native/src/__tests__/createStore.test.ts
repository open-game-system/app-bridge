// import { describe, it, expect, jest } from '@jest/globals'; // Add Jest imports
import { createStore } from '../index'; // Adjust path as needed
import type { State, Event, Store } from '@open-game-system/app-bridge-types';

// --- Test Setup ---
interface TestState extends State {
  count: number;
  lastEvent?: string;
  asyncOpStatus?: 'pending' | 'done';
}

type TestEvents =
  | { type: 'INCREMENT'; amount: number }
  | { type: 'DECREMENT' }
  | { type: 'ASYNC_START' }
  | { type: 'ASYNC_FINISH' }
  | { type: 'RESET' };

const initialState: TestState = { count: 0 };

const testProducer = (draft: TestState, event: TestEvents) => {
  draft.lastEvent = event.type;
  switch (event.type) {
    case 'INCREMENT':
      draft.count += event.amount;
      break;
    case 'DECREMENT':
      if (draft.count > 0) draft.count -= 1;
      break;
    case 'ASYNC_START':
      draft.asyncOpStatus = 'pending';
      break;
    case 'ASYNC_FINISH':
      draft.asyncOpStatus = 'done';
      break;
    case 'RESET':
       // Producer might not directly handle reset if store.reset() is used
       // But it could react to a RESET event if dispatched
       Object.assign(draft, initialState); // Example reset logic within producer
      break;
  }
};

// Helper delay function
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- Tests --- 
describe('createStore', () => {

  it('should initialize with the correct state', () => {
    const store = createStore<TestState, TestEvents>({ initialState });
    expect(store.getSnapshot()).toEqual(initialState);
  });

  it('should update state via dispatch and producer', async () => {
    const store = createStore<TestState, TestEvents>({ initialState, producer: testProducer });
    await store.dispatch({ type: 'INCREMENT', amount: 5 });
    expect(store.getSnapshot().count).toBe(5);
    expect(store.getSnapshot().lastEvent).toBe('INCREMENT');
    await store.dispatch({ type: 'DECREMENT' });
    expect(store.getSnapshot().count).toBe(4);
    expect(store.getSnapshot().lastEvent).toBe('DECREMENT');
  });

  it('should notify subscribe listeners on state change and immediately', async () => {
    const store = createStore<TestState, TestEvents>({ initialState, producer: testProducer });
    const listener = jest.fn();

    const unsubscribe = store.subscribe(listener);

    // Called immediately
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(initialState);

    await store.dispatch({ type: 'INCREMENT', amount: 1 });

    // Called on change
    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener).toHaveBeenCalledWith({ count: 1, lastEvent: 'INCREMENT' });

    unsubscribe();
    await store.dispatch({ type: 'DECREMENT' });

    // Not called after unsubscribe
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('should invoke listeners defined in the `on` configuration', async () => {
    const onIncrementListener = jest.fn<Promise<void> | void, [Extract<TestEvents, { type: 'INCREMENT' }>, Store<TestState, TestEvents>]>();
    const onDecrementListener = jest.fn<Promise<void> | void, [Extract<TestEvents, { type: 'DECREMENT' }>, Store<TestState, TestEvents>]>(async (event, store) => {
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

    await store.dispatch({ type: 'INCREMENT', amount: 2 });
    expect(onIncrementListener).toHaveBeenCalledTimes(1);
    expect(onIncrementListener).toHaveBeenCalledWith(expect.objectContaining({ type: 'INCREMENT', amount: 2 }), store);
    expect(onDecrementListener).not.toHaveBeenCalled();

    await store.dispatch({ type: 'DECREMENT' });
    expect(onIncrementListener).toHaveBeenCalledTimes(1); // Not called again
    expect(onDecrementListener).toHaveBeenCalledTimes(1);
    expect(onDecrementListener).toHaveBeenCalledWith(expect.objectContaining({ type: 'DECREMENT' }), store);
  });

  it('should invoke listeners added via the `store.on()` method', async () => {
    const store = createStore<TestState, TestEvents>({ initialState, producer: testProducer });
    const onIncrementListener = jest.fn<Promise<void> | void, [Extract<TestEvents, { type: 'INCREMENT' }>, Store<TestState, TestEvents>]>();
    const onDecrementListener = jest.fn<Promise<void> | void, [Extract<TestEvents, { type: 'DECREMENT' }>, Store<TestState, TestEvents>]>(async (event, store) => { await delay(5); });

    const unsubInc = store.on('INCREMENT', onIncrementListener);
    const unsubDec = store.on('DECREMENT', onDecrementListener);

    await store.dispatch({ type: 'INCREMENT', amount: 3 });
    expect(onIncrementListener).toHaveBeenCalledTimes(1);
    expect(onIncrementListener).toHaveBeenCalledWith(expect.objectContaining({ type: 'INCREMENT', amount: 3 }), store);
    expect(onDecrementListener).not.toHaveBeenCalled();

    await store.dispatch({ type: 'DECREMENT' });
    expect(onIncrementListener).toHaveBeenCalledTimes(1);
    expect(onDecrementListener).toHaveBeenCalledTimes(1);
    expect(onDecrementListener).toHaveBeenCalledWith(expect.objectContaining({ type: 'DECREMENT' }), store);

    // Test unsubscribe
    unsubInc();
    await store.dispatch({ type: 'INCREMENT', amount: 1 });
    expect(onIncrementListener).toHaveBeenCalledTimes(1); // Should not be called again

    unsubDec();
    await store.dispatch({ type: 'DECREMENT' });
    expect(onDecrementListener).toHaveBeenCalledTimes(1); // Should not be called again
  });


  it('should invoke both configured and dynamic listeners for the same event type', async () => {
    const configListener = jest.fn<Promise<void> | void, [Extract<TestEvents, { type: 'INCREMENT' }>, Store<TestState, TestEvents>]>();
    const dynamicListener = jest.fn<Promise<void> | void, [Extract<TestEvents, { type: 'INCREMENT' }>, Store<TestState, TestEvents>]>();

    const store = createStore<TestState, TestEvents>({
      initialState,
      producer: testProducer,
      on: {
        INCREMENT: configListener,
      },
    });

    store.on('INCREMENT', dynamicListener);

    await store.dispatch({ type: 'INCREMENT', amount: 7 });

    expect(configListener).toHaveBeenCalledTimes(1);
    expect(dynamicListener).toHaveBeenCalledTimes(1);
    expect(configListener).toHaveBeenCalledWith(expect.objectContaining({ type: 'INCREMENT', amount: 7 }), store);
    expect(dynamicListener).toHaveBeenCalledWith(expect.objectContaining({ type: 'INCREMENT', amount: 7 }), store);
  });

  it('should handle async listeners and await their completion', async () => {
    let asyncListenerFinished = false;
    const asyncListener = jest.fn<Promise<void> | void, [Extract<TestEvents, { type: 'ASYNC_START' }>, Store<TestState, TestEvents>]>(async (event, store) => {
      expect(store.getSnapshot().asyncOpStatus).toBe('pending');
      await delay(20);
      asyncListenerFinished = true;
      await store.dispatch({ type: 'ASYNC_FINISH' });
    });

    const store = createStore<TestState, TestEvents>({
      initialState,
      producer: testProducer,
      on: {
        ASYNC_START: asyncListener,
      },
    });

    // Dispatch returns a promise that resolves *after* listeners complete
    const dispatchPromise = store.dispatch({ type: 'ASYNC_START' });

    expect(store.getSnapshot().asyncOpStatus).toBe('pending');
    expect(asyncListener).toHaveBeenCalledTimes(1);
    expect(asyncListenerFinished).toBe(false); // Not finished yet

    await dispatchPromise; // Wait for dispatch and its listeners

    expect(asyncListenerFinished).toBe(true);
    // Check state after the listener dispatched ASYNC_FINISH
    expect(store.getSnapshot().asyncOpStatus).toBe('done');
    expect(store.getSnapshot().lastEvent).toBe('ASYNC_FINISH');
  });

  it('should reset state to initial state when store.reset() is called', async () => {
    const store = createStore<TestState, TestEvents>({ initialState, producer: testProducer });
    await store.dispatch({ type: 'INCREMENT', amount: 10 });
    expect(store.getSnapshot().count).toBe(10);

    store.reset();
    expect(store.getSnapshot()).toEqual(initialState);

    // Verify state is independent after reset
     await store.dispatch({ type: 'INCREMENT', amount: 1 });
     expect(store.getSnapshot().count).toBe(1);
  });

   it('should handle errors within async listeners gracefully', async () => {
    const errorListener = jest.fn<Promise<void> | void, [Extract<TestEvents, { type: 'INCREMENT' }>, Store<TestState, TestEvents>]>(async (event, store) => {
      await delay(5);
      throw new Error("Listener Error!");
    });
    const successfulListener = jest.fn<Promise<void> | void, [Extract<TestEvents, { type: 'INCREMENT' }>, Store<TestState, TestEvents>]>();

    const store = createStore<TestState, TestEvents>({
      initialState,
      producer: testProducer,
      on: {
        INCREMENT: errorListener,
      },
    });
    store.on('INCREMENT', successfulListener);

    // Mock console.error to check if it's called
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    // Dispatch should still complete even if a listener throws
    await store.dispatch({ type: 'INCREMENT', amount: 1 });

    expect(errorListener).toHaveBeenCalledTimes(1);
    expect(successfulListener).toHaveBeenCalledTimes(1); // Subsequent listeners should still run
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('[Native Store] Error in event listener for type "INCREMENT"'),
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });

}); 