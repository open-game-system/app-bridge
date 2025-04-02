import { describe, it, expect } from 'vitest';
import { createNativeBridge } from './index';
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

describe('createNativeBridge', () => {
  it('should create a bridge with initial state', () => {
    const bridge = createNativeBridge<TestStores>({
      initialState: {
        counter: { value: 42 }
      }
    });

    expect(bridge.getSnapshot().counter).toEqual({ value: 42 });
  });

  it('should handle multiple stores', () => {
    interface UserState {
      name: string;
    }

    interface UserEvents {
      type: 'SET_NAME';
      name: string;
    }

    interface MultiStores extends BridgeStores {
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

    expect(bridge.getSnapshot()).toEqual({
      counter: { value: 42 },
      user: { name: 'John' }
    });
  });

  it('should handle state updates', () => {
    const bridge = createNativeBridge<TestStores>({
      initialState: {
        counter: { value: 0 }
      }
    });

    bridge.setState('counter', { value: 100 });
    expect(bridge.getSnapshot().counter).toEqual({ value: 100 });

    bridge.setState('counter', { value: 42 });
    expect(bridge.getSnapshot().counter).toEqual({ value: 42 });
  });

  it('should handle state resets', () => {
    const bridge = createNativeBridge<TestStores>({
      initialState: {
        counter: { value: 0 }
      }
    });

    bridge.setState('counter', { value: 100 });
    expect(bridge.getSnapshot().counter).toEqual({ value: 100 });

    bridge.reset('counter');
    expect(bridge.getSnapshot().counter).toEqual({ value: 0 });
  });

  it('should handle state updates with immer', () => {
    const bridge = createNativeBridge<TestStores>({
      initialState: {
        counter: { value: 0 }
      }
    });

    bridge.produce('counter', draft => {
      draft.value = 10;
    });
    expect(bridge.getSnapshot().counter).toEqual({ value: 10 });

    bridge.produce('counter', draft => {
      draft.value = 42;
    });
    expect(bridge.getSnapshot().counter).toEqual({ value: 42 });
  });

  it('should handle state updates with immer and reset', () => {
    const bridge = createNativeBridge<TestStores>({
      initialState: {
        counter: { value: 0 }
      }
    });

    bridge.produce('counter', draft => {
      draft.value = 10;
    });
    expect(bridge.getSnapshot().counter).toEqual({ value: 10 });

    bridge.reset('counter');
    expect(bridge.getSnapshot().counter).toEqual({ value: 0 });
  });

  it('should handle state updates with immer and setState', () => {
    const bridge = createNativeBridge<TestStores>({
      initialState: {
        counter: { value: 0 }
      }
    });

    bridge.produce('counter', draft => {
      draft.value = 10;
    });
    expect(bridge.getSnapshot().counter).toEqual({ value: 10 });

    bridge.setState('counter', { value: 42 });
    expect(bridge.getSnapshot().counter).toEqual({ value: 42 });
  });
}); 