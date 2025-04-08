import { createMockBridge } from '../src';
import type { BridgeStores } from '@open-game-system/app-bridge-types';

interface TestState {
  value: number;
}

type TestEvents = 
  | { type: 'INCREMENT' }
  | { type: 'SET'; value: number };

interface TestStores extends BridgeStores {
  counter: {
    state: TestState;
    events: TestEvents;
  };
}

describe('MockBridge', () => {
  it('should create a bridge with initial state', () => {
    const bridge = createMockBridge<TestStores>({
      initialState: {
        counter: { value: 0 }
      }
    });

    const store = bridge.getStore('counter');
    expect(store).toBeDefined();
    expect(store?.getSnapshot()).toEqual({ value: 0 });
  });

  it('should track dispatched events', () => {
    const bridge = createMockBridge<TestStores>({
      initialState: {
        counter: { value: 0 }
      }
    });

    const store = bridge.getStore('counter');
    store?.dispatch({ type: 'INCREMENT' });
    store?.dispatch({ type: 'SET', value: 5 });

    expect(bridge.getHistory('counter')).toEqual([
      { type: 'INCREMENT' },
      { type: 'SET', value: 5 }
    ]);
  });

  it('should allow direct state manipulation', () => {
    const bridge = createMockBridge<TestStores>({
      initialState: {
        counter: { value: 0 }
      }
    });

    const store = bridge.getStore('counter');
    store?.produce(state => {
      state.value = 42;
    });

    expect(store?.getSnapshot()).toEqual({ value: 42 });
  });

  it('should notify subscribers of state changes', () => {
    const bridge = createMockBridge<TestStores>({
      initialState: {
        counter: { value: 0 }
      }
    });

    const store = bridge.getStore('counter');
    const listener = jest.fn();
    store?.subscribe(listener);

    store?.produce(state => {
      state.value = 42;
    });

    expect(listener).toHaveBeenCalledWith({ value: 42 });
  });

  it('should reset state and history', () => {
    const bridge = createMockBridge<TestStores>({
      initialState: {
        counter: { value: 0 }
      }
    });

    const store = bridge.getStore('counter');
    store?.produce(state => {
      state.value = 42;
    });
    store?.dispatch({ type: 'INCREMENT' });

    bridge.reset('counter');

    expect(store?.getSnapshot()).toEqual({ value: 0 });
    expect(bridge.getHistory('counter')).toEqual([]);
  });
}); 