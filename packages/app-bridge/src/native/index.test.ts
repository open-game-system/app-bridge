import { describe, it, expect } from 'vitest';
import { createNativeBridge } from './index';
import type { BridgeStoreDefinitions, State, Event } from '../types';

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

describe('createNativeBridge', () => {
  it('should create a bridge with initial state', () => {
    const bridge = createNativeBridge<TestStores>({
      initialState: {
        counter: { value: 42 }
      }
    });

    const counterStore = bridge.getStore('counter');
    expect(counterStore).toBeDefined();
    expect(counterStore?.getSnapshot()).toEqual({ value: 42 });
  });

  it('should handle multiple stores', () => {
    interface UserState extends State {
      name: string;
    }

    type UserEvents = 
      | { type: 'SET_NAME'; name: string };

    interface MultiStores extends BridgeStoreDefinitions {
      counter: {
        state: CounterState;
        events: CounterEvents;
      };
      user: {
        state: UserState;
        events: UserEvents;
      };
    }

    const bridge = createNativeBridge<MultiStores>({
      initialState: {
        counter: { value: 42 },
        user: { name: 'John' }
      }
    });

    const counterStore = bridge.getStore('counter');
    const userStore = bridge.getStore('user');
    
    expect(counterStore).toBeDefined();
    expect(userStore).toBeDefined();
    expect(counterStore?.getSnapshot()).toEqual({ value: 42 });
    expect(userStore?.getSnapshot()).toEqual({ name: 'John' });
  });

  it('should handle state updates', () => {
    const bridge = createNativeBridge<TestStores>({
      initialState: {
        counter: { value: 0 }
      }
    });

    const counterStore = bridge.getStore('counter');
    expect(counterStore?.getSnapshot()).toEqual({ value: 0 });

    bridge.setState('counter', { value: 100 });
    expect(counterStore?.getSnapshot()).toEqual({ value: 100 });

    bridge.setState('counter', { value: 42 });
    expect(counterStore?.getSnapshot()).toEqual({ value: 42 });
  });

  it('should handle state resets', () => {
    const bridge = createNativeBridge<TestStores>({
      initialState: {
        counter: { value: 0 }
      }
    });

    const counterStore = bridge.getStore('counter');
    expect(counterStore?.getSnapshot()).toEqual({ value: 0 });

    bridge.setState('counter', { value: 100 });
    expect(counterStore?.getSnapshot()).toEqual({ value: 100 });

    bridge.reset('counter');
    expect(counterStore?.getSnapshot()).toEqual({ value: 0 });
  });

  it('should handle state updates with immer', () => {
    const bridge = createNativeBridge<TestStores>({
      initialState: {
        counter: { value: 0 }
      }
    });

    const counterStore = bridge.getStore('counter');
    expect(counterStore?.getSnapshot()).toEqual({ value: 0 });

    bridge.produce('counter', (draft: CounterState) => {
      draft.value = 10;
    });
    expect(counterStore?.getSnapshot()).toEqual({ value: 10 });

    bridge.produce('counter', (draft: CounterState) => {
      draft.value = 42;
    });
    expect(counterStore?.getSnapshot()).toEqual({ value: 42 });
  });

  it('should handle state updates with immer and reset', () => {
    const bridge = createNativeBridge<TestStores>({
      initialState: {
        counter: { value: 0 }
      }
    });

    const counterStore = bridge.getStore('counter');
    expect(counterStore?.getSnapshot()).toEqual({ value: 0 });

    bridge.produce('counter', (draft: CounterState) => {
      draft.value = 10;
    });
    expect(counterStore?.getSnapshot()).toEqual({ value: 10 });

    bridge.reset('counter');
    expect(counterStore?.getSnapshot()).toEqual({ value: 0 });
  });

  it('should handle state updates with immer and setState', () => {
    const bridge = createNativeBridge<TestStores>({
      initialState: {
        counter: { value: 0 }
      }
    });

    const counterStore = bridge.getStore('counter');
    expect(counterStore?.getSnapshot()).toEqual({ value: 0 });

    bridge.produce('counter', (draft: CounterState) => {
      draft.value = 10;
    });
    expect(counterStore?.getSnapshot()).toEqual({ value: 10 });

    bridge.setState('counter', { value: 42 });
    expect(counterStore?.getSnapshot()).toEqual({ value: 42 });
  });
}); 