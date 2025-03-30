import { describe, it, expect } from 'vitest';
import { Bridge } from '../src';

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
}); 