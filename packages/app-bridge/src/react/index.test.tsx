import '@testing-library/jest-dom';
import { act, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Bridge, BridgeStores } from '../types';
import { createBridgeContext } from './index';

// Test types
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

describe('React Bridge Integration', () => {
  const BridgeContext = createBridgeContext<TestStores>();
  const CounterContext = BridgeContext.createStoreContext('counter');

  const createMockBridge = (): Bridge<TestStores> => ({
    isSupported: () => true,
    getSnapshot: () => ({ counter: null }),
    subscribe: vi.fn(),
    dispatch: vi.fn(),
    produce: vi.fn(),
    setState: vi.fn(),
    reset: vi.fn()
  });

  it('should provide bridge context', () => {
    const bridge = createMockBridge();

    const { result } = renderHook(() => BridgeContext.useBridge(), {
      wrapper: ({ children }) => (
        <BridgeContext.Provider bridge={bridge}>{children}</BridgeContext.Provider>
      )
    });

    expect(result.current).toBe(bridge);
  });

  it('should provide store context', () => {
    const bridge = {
      ...createMockBridge(),
      getSnapshot: () => ({ counter: { value: 42 } })
    };

    const { result } = renderHook(() => CounterContext.useStore(), {
      wrapper: ({ children }) => (
        <BridgeContext.Provider bridge={bridge}>{children}</BridgeContext.Provider>
      )
    });

    expect(result.current).toEqual({ value: 42 });
  });

  it('should handle uninitialized stores', () => {
    const bridge = createMockBridge();

    const { result } = renderHook(() => CounterContext.useStore(), {
      wrapper: ({ children }) => (
        <BridgeContext.Provider bridge={bridge}>{children}</BridgeContext.Provider>
      )
    });

    expect(result.current).toBeNull();
  });

  it('should handle store updates', () => {
    const bridge = {
      ...createMockBridge(),
      getSnapshot: () => ({ counter: { value: 42 } })
    };

    const { result } = renderHook(() => CounterContext.useStore(), {
      wrapper: ({ children }) => (
        <BridgeContext.Provider bridge={bridge}>{children}</BridgeContext.Provider>
      )
    });

    act(() => {
      bridge.setState('counter', { value: 100 });
    });

    expect(result.current).toEqual({ value: 100 });
  });

  it('should handle store resets', () => {
    const bridge = {
      ...createMockBridge(),
      getSnapshot: () => ({ counter: { value: 42 } })
    };

    const { result } = renderHook(() => CounterContext.useStore(), {
      wrapper: ({ children }) => (
        <BridgeContext.Provider bridge={bridge}>{children}</BridgeContext.Provider>
      )
    });

    act(() => {
      bridge.reset('counter');
    });

    expect(result.current).toBeNull();
  });

  it('should handle store errors', () => {
    const bridge = {
      ...createMockBridge(),
      getSnapshot: () => ({ counter: { value: 42 } })
    };

    const { result } = renderHook(() => CounterContext.useStore(), {
      wrapper: ({ children }) => (
        <BridgeContext.Provider bridge={bridge}>{children}</BridgeContext.Provider>
      )
    });

    act(() => {
      bridge.setState('counter', null);
    });

    expect(result.current).toBeNull();
  });

  it('provides bridge through context', () => {
    const bridge = createMockBridge();
    let contextBridge: Bridge<TestStores> | undefined;

    function TestComponent() {
      contextBridge = BridgeContext.useBridge();
      return null;
    }

    render(
      <BridgeContext.Provider bridge={bridge}>
        <TestComponent />
      </BridgeContext.Provider>
    );

    expect(contextBridge).toBe(bridge);
  });

  it('handles store initialization state', () => {
    // Create bridge without initializing the store
    const bridge = createMockBridge();

    // Reset the store to null state
    act(() => {
      bridge.setState('counter', null);
    });

    function TestComponent() {
      return (
        <>
          <CounterContext.Initializing>
            <div>Loading...</div>
          </CounterContext.Initializing>
          <CounterContext.Initialized>
            <div>Ready!</div>
          </CounterContext.Initialized>
        </>
      );
    }

    render(
      <BridgeContext.Provider bridge={bridge}>
        <TestComponent />
      </BridgeContext.Provider>
    );

    // Initially shows loading
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('Ready!')).not.toBeInTheDocument();

    // Update state to initialize
    act(() => {
      bridge.setState('counter', { value: 0 });
    });

    // Now shows ready
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    expect(screen.getByText('Ready!')).toBeInTheDocument();
  });

  it('provides state through useStore and useSelector', () => {
    const bridge = createMockBridge();

    function TestComponent() {
      const state = CounterContext.useStore();
      const value = CounterContext.useSelector(s => s.value);
      return (
        <div>
          <div data-testid="raw">Raw: {state?.value}</div>
          <div data-testid="selected">Selected: {value}</div>
        </div>
      );
    }

    render(
      <BridgeContext.Provider bridge={bridge}>
        <CounterContext.Initialized>
          <TestComponent />
        </CounterContext.Initialized>
      </BridgeContext.Provider>
    );

    // Initial state
    expect(screen.getByTestId('raw')).toHaveTextContent('Raw: 0');
    expect(screen.getByTestId('selected')).toHaveTextContent('Selected: 0');

    // Update state
    act(() => {
      bridge.dispatch('counter', { type: 'SET', value: 100 });
    });

    // Updated state
    expect(screen.getByTestId('raw')).toHaveTextContent('Raw: 100');
    expect(screen.getByTestId('selected')).toHaveTextContent('Selected: 100');
  });

  it('handles bridge support state', () => {
    const bridge = createMockBridge();

    render(
      <BridgeContext.Provider bridge={bridge}>
        <BridgeContext.Supported>
          <div>Supported</div>
        </BridgeContext.Supported>
        <BridgeContext.Unsupported>
          <div>Unsupported</div>
        </BridgeContext.Unsupported>
      </BridgeContext.Provider>
    );

    expect(screen.queryByText('Supported')).not.toBeInTheDocument();
    expect(screen.getByText('Unsupported')).toBeInTheDocument();
  });

  it('allows dispatching events through useDispatch', () => {
    const bridge = createMockBridge();

    function TestComponent() {
      const value = CounterContext.useSelector(s => s.value);
      const dispatch = CounterContext.useDispatch();

      return (
        <div>
          <div data-testid="count">Count: {value}</div>
          <button onClick={() => dispatch({ type: 'INCREMENT' })}>+</button>
          <button onClick={() => dispatch({ type: 'DECREMENT' })}>-</button>
          <button onClick={() => dispatch({ type: 'SET', value: 0 })}>Reset</button>
        </div>
      );
    }

    render(
      <BridgeContext.Provider bridge={bridge}>
        <CounterContext.Initialized>
          <TestComponent />
        </CounterContext.Initialized>
      </BridgeContext.Provider>
    );

    // Initial state
    expect(screen.getByTestId('count')).toHaveTextContent('Count: 0');

    // Increment
    act(() => {
      fireEvent.click(screen.getByText('+'));
    });
    expect(screen.getByTestId('count')).toHaveTextContent('Count: 1');

    // Decrement
    act(() => {
      fireEvent.click(screen.getByText('-'));
    });
    expect(screen.getByTestId('count')).toHaveTextContent('Count: 0');

    // Set to specific value
    act(() => {
      fireEvent.click(screen.getByText('Reset'));
    });
    expect(screen.getByTestId('count')).toHaveTextContent('Count: 0');
  });

  it('throws error when using useSelector outside of Initialized', () => {
    const bridge = createMockBridge();
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    function TestComponent() {
      const value = CounterContext.useSelector(s => s.value);
      return <div>{value}</div>;
    }

    expect(() => {
      render(
        <BridgeContext.Provider bridge={bridge}>
          <TestComponent />
        </BridgeContext.Provider>
      );
    }).toThrow('Cannot use useSelector outside of a StoreContext.Initialized component');

    consoleSpy.mockRestore();
  });
}); 