import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Counter } from './Counter';
import { createMockBridge } from '@open-game-system/app-bridge-testing';
import { createBridgeContext } from '@open-game-system/app-bridge-react';
import type { AppStores } from './types';
import type { Bridge } from '@open-game-system/app-bridge-types';

// Create test-specific contexts
const TestBridgeContext = createBridgeContext<AppStores>();
const TestCounterContext = TestBridgeContext.createStoreContext('counter');

describe('Counter', () => {
  let mockBridge: Bridge<AppStores>;

  beforeEach(() => {
    // Reset the bridge before each test
    const baseMockBridge = createMockBridge<AppStores>({
      initialState: {
        counter: { value: 0 }
      }
    });

    // Add required setStore method to satisfy Bridge interface
    mockBridge = {
      ...baseMockBridge,
      setStore: (key, store) => {
        if (store === undefined) {
          baseMockBridge.setState(key, { value: 0 });
        } else {
          baseMockBridge.setState(key, store.getSnapshot());
        }
      }
    };
  });

  it('renders initial counter value', () => {
    render(
      <TestBridgeContext.Provider bridge={mockBridge}>
        <TestCounterContext.Provider>
          <Counter BridgeContext={TestBridgeContext} CounterContext={TestCounterContext} />
        </TestCounterContext.Provider>
      </TestBridgeContext.Provider>
    );

    expect(screen.getByText('Web Bridge Counter:')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('increments counter when + button is clicked', async () => {
    render(
      <TestBridgeContext.Provider bridge={mockBridge}>
        <TestCounterContext.Provider>
          <Counter BridgeContext={TestBridgeContext} CounterContext={TestCounterContext} />
        </TestCounterContext.Provider>
      </TestBridgeContext.Provider>
    );

    fireEvent.click(screen.getByText('+'));
    
    // Check that the event was dispatched
    const history = (mockBridge as any).getHistory('counter');
    expect(history).toContainEqual({ type: 'INCREMENT' });

    // Update the state to simulate what would happen in the real app
    await act(async () => {
      const store = mockBridge.getStore('counter');
      (store as any).setState({ value: 1 });
    });

    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('decrements counter when - button is clicked', async () => {
    render(
      <TestBridgeContext.Provider bridge={mockBridge}>
        <TestCounterContext.Provider>
          <Counter BridgeContext={TestBridgeContext} CounterContext={TestCounterContext} />
        </TestCounterContext.Provider>
      </TestBridgeContext.Provider>
    );

    fireEvent.click(screen.getByText('-'));
    
    // Check that the event was dispatched
    const history = (mockBridge as any).getHistory('counter');
    expect(history).toContainEqual({ type: 'DECREMENT' });

    // Update the state to simulate what would happen in the real app
    await act(async () => {
      const store = mockBridge.getStore('counter');
      (store as any).setState({ value: -1 });
    });

    expect(screen.getByText('-1')).toBeInTheDocument();
  });

  it('sets counter value when Set Value button is clicked', async () => {
    render(
      <TestBridgeContext.Provider bridge={mockBridge}>
        <TestCounterContext.Provider>
          <Counter BridgeContext={TestBridgeContext} CounterContext={TestCounterContext} />
        </TestCounterContext.Provider>
      </TestBridgeContext.Provider>
    );

    // Find the input and set its value
    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '42' } });

    // Click the Set Value button
    fireEvent.click(screen.getByText('Set Value'));
    
    // Check that the event was dispatched
    const history = (mockBridge as any).getHistory('counter');
    expect(history).toContainEqual({ type: 'SET', value: 42 });

    // Update the state to simulate what would happen in the real app
    await act(async () => {
      const store = mockBridge.getStore('counter');
      (store as any).setState({ value: 42 });
    });

    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('shows loading state when store is not available', () => {
    const emptyBridge = {
      ...createMockBridge<AppStores>({
        isSupported: true
      }),
      setStore: () => {} // Add required setStore method
    };

    render(
      <TestBridgeContext.Provider bridge={emptyBridge}>
        <TestCounterContext.Provider>
          <Counter BridgeContext={TestBridgeContext} CounterContext={TestCounterContext} />
        </TestCounterContext.Provider>
        <TestCounterContext.Loading>
          <div>Waiting for counter data from native app...</div>
        </TestCounterContext.Loading>
      </TestBridgeContext.Provider>
    );

    expect(screen.getByText('Waiting for counter data from native app...')).toBeInTheDocument();
  });

  it('shows unsupported message when bridge is not supported', () => {
    const unsupportedBridge = {
      ...createMockBridge<AppStores>({
        isSupported: false,
        initialState: {
          counter: { value: 0 }
        }
      }),
      setStore: () => {} // Add required setStore method
    };

    render(
      <TestBridgeContext.Provider bridge={unsupportedBridge}>
        <Counter BridgeContext={TestBridgeContext} CounterContext={TestCounterContext} />
      </TestBridgeContext.Provider>
    );

    expect(screen.getByText('Bridge reports as unsupported')).toBeInTheDocument();
  });
});
