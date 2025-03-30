import { describe, expect, it } from 'vitest';
import { Bridge } from '../src/bridge';

describe('Core Bridge', () => {
  it('should create a bridge instance', () => {
    const bridge = new Bridge();
    expect(bridge).toBeDefined();
    expect(bridge.getState()).toEqual({});
  });

  it('should track subscriptions', () => {
    const bridge = new Bridge();
    let notified = false;

    const unsubscribe = bridge.subscribe(() => {
      notified = true;
    });

    bridge.dispatch({ type: 'TEST_ACTION' });
    expect(notified).toBe(true);

    notified = false;
    unsubscribe();
    bridge.dispatch({ type: 'TEST_ACTION' });
    expect(notified).toBe(false);
  });

  it('should initialize with the provided state', () => {
    const initialState = { count: 0 };
    const bridge = new Bridge({ initialState });
    
    expect(bridge.getState()).toEqual(initialState);
  });
});
