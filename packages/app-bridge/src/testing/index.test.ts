import { describe, it, expect, vi } from 'vitest';
import { createMockBridge } from './index';
import type { State, Event, BridgeStores } from '../types';

interface CounterState extends State {
  value: number;
}

type CounterEvents = 
  | { type: 'INCREMENT' }
  | { type: 'DECREMENT' }
  | { type: 'SET'; value: number };

interface TestStores extends BridgeStores {
  counter: {
    state: CounterState;
    events: CounterEvents;
  };
}

describe('createMockBridge', () => {
  it('should create a bridge with initial state', () => {
    const bridge = createMockBridge<TestStores>({
      isSupported: true,
      stores: {
        counter: { value: 42 }
      },
    });

    expect(bridge.getSnapshot().counter).toEqual({ value: 42 });
  });

  it('should handle state updates via dispatch', () => {
    const bridge = createMockBridge<TestStores>({
      isSupported: true,
      stores: {
        counter: { value: 0 }
      },
    });

    bridge.dispatch('counter', { type: 'INCREMENT' });
    expect(bridge.getSnapshot().counter).toEqual({ value: 1 });

    bridge.dispatch('counter', { type: 'DECREMENT' });
    expect(bridge.getSnapshot().counter).toEqual({ value: 0 });

    bridge.dispatch('counter', { type: 'SET', value: 42 });
    expect(bridge.getSnapshot().counter).toEqual({ value: 42 });
  });

  it('should handle subscriptions', () => {
    const bridge = createMockBridge<TestStores>({
      isSupported: true,
      stores: {
        counter: { value: 0 }
      },
    });

    const listener = vi.fn();
    bridge.subscribe('counter', listener);

    // Initial state
    expect(listener).toHaveBeenCalledWith({ value: 0 });

    bridge.dispatch('counter', { type: 'INCREMENT' });
    expect(listener).toHaveBeenCalledWith({ value: 1 });
  });

  it('should handle unsubscribe', () => {
    const bridge = createMockBridge<TestStores>({
      isSupported: true,
      stores: {
        counter: { value: 0 }
      },
    });

    const listener = vi.fn();
    const unsubscribe = bridge.subscribe('counter', listener);

    bridge.dispatch('counter', { type: 'INCREMENT' });
    expect(listener).toHaveBeenCalledTimes(2); // Initial + INCREMENT

    unsubscribe();
    bridge.dispatch('counter', { type: 'INCREMENT' });
    expect(listener).toHaveBeenCalledTimes(2); // No additional calls
  });

  it('should handle reset', () => {
    const bridge = createMockBridge<TestStores>({
      isSupported: true,
      stores: {
        counter: { value: 0 }
      },
    });

    bridge.dispatch('counter', { type: 'INCREMENT' });
    expect(bridge.getSnapshot().counter).toEqual({ value: 1 });

    bridge.reset('counter');
    expect(bridge.getSnapshot().counter).toEqual({ value: 0 });
  });

  it('should check if bridge is supported', () => {
    const bridge = createMockBridge<TestStores>({
      isSupported: true,
      stores: {
        counter: { value: 0 }
      },
    });

    expect(bridge.isSupported()).toBe(true);

    const unsupportedBridge = createMockBridge<TestStores>({
      isSupported: false,
      stores: {
        counter: { value: 0 }
      },
    });

    expect(unsupportedBridge.isSupported()).toBe(false);
  });
}); 