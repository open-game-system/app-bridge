/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { createBridgeContext } from './index';
import { createMockBridge } from '../testing';
import type { BridgeStores, State } from '../types';

interface CounterState extends State {
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

  // Counter component for testing
  const Counter = () => {
    const state = CounterContext.useStore();
    const dispatch = CounterContext.useDispatch();

    if (!state) return null;

    return (
      <div>
        <p>Count: {state.value}</p>
        <button onClick={() => dispatch({ type: 'INCREMENT' })}>+</button>
        <button onClick={() => dispatch({ type: 'DECREMENT' })}>-</button>
        <button onClick={() => dispatch({ type: 'SET', value: 42 })}>Set to 42</button>
      </div>
    );
  };

  // App component for testing
  const App = ({ bridge }: { bridge: ReturnType<typeof createMockBridge<TestStores>> }) => {
    return (
      <BridgeContext.Provider bridge={bridge}>
        <BridgeContext.Supported>
          <CounterContext.Provider>
            <CounterContext.Initialized>
              <Counter />
            </CounterContext.Initialized>
            <CounterContext.Initializing>
              <div>Loading counter...</div>
            </CounterContext.Initializing>
          </CounterContext.Provider>
        </BridgeContext.Supported>
        <BridgeContext.Unsupported>
          <div>Bridge not supported</div>
        </BridgeContext.Unsupported>
      </BridgeContext.Provider>
    );
  };

  describe('Bridge Provider', () => {
    it('throws error when hooks are used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<CounterContext.Provider><Counter /></CounterContext.Provider>);
      }).toThrow('Bridge not found in context');

      consoleSpy.mockRestore();
    });
  });

  describe('Bridge Support', () => {
    it('shows supported content when bridge is supported', () => {
      const mockBridge = createMockBridge<TestStores>({
        isSupported: true,
        stores: {
          counter: { value: 0 }
        }
      });

      render(<App bridge={mockBridge} />);
      expect(screen.getByText('Count: 0')).toBeInTheDocument();
    });

    it('shows unsupported content when bridge is not supported', () => {
      const mockBridge = createMockBridge<TestStores>({
        isSupported: false,
        stores: {
          counter: { value: 0 }
        }
      });

      render(<App bridge={mockBridge} />);
      expect(screen.getByText('Bridge not supported')).toBeInTheDocument();
    });
  });

  describe('Store Context', () => {
    it('shows initializing content when store is not initialized', () => {
      const mockBridge = createMockBridge<TestStores>({
        isSupported: true,
        stores: {
          counter: { value: 0 }
        }
      });

      // Override getSnapshot to return null for counter store
      const originalGetSnapshot = mockBridge.getSnapshot;
      mockBridge.getSnapshot = () => ({
        counter: null
      });

      render(<App bridge={mockBridge} />);
      expect(screen.getByText('Loading counter...')).toBeInTheDocument();

      // Restore original getSnapshot
      mockBridge.getSnapshot = originalGetSnapshot;
    });

    it('shows initialized content when store is initialized', () => {
      const mockBridge = createMockBridge<TestStores>({
        isSupported: true,
        stores: {
          counter: { value: 0 }
        }
      });

      render(<App bridge={mockBridge} />);
      expect(screen.getByText('Count: 0')).toBeInTheDocument();
    });
  });

  describe('State Updates', () => {
    it('updates state when events are dispatched', () => {
      const mockBridge = createMockBridge<TestStores>({
        isSupported: true,
        stores: {
          counter: { value: 0 }
        }
      });

      render(<App bridge={mockBridge} />);
      expect(screen.getByText('Count: 0')).toBeInTheDocument();

      // Increment
      fireEvent.click(screen.getByText('+'));
      expect(screen.getByText('Count: 1')).toBeInTheDocument();

      // Decrement
      fireEvent.click(screen.getByText('-'));
      expect(screen.getByText('Count: 0')).toBeInTheDocument();

      // Set to 42
      fireEvent.click(screen.getByText('Set to 42'));
      expect(screen.getByText('Count: 42')).toBeInTheDocument();
    });

    it('resets state when store is reset', async () => {
      const mockBridge = createMockBridge<TestStores>({
        isSupported: true,
        stores: {
          counter: { value: 0 }
        }
      });
      render(<App bridge={mockBridge} />);
      expect(screen.getByText('Count: 0')).toBeInTheDocument();

      // Increment
      fireEvent.click(screen.getByText('+'));
      expect(screen.getByText('Count: 1')).toBeInTheDocument();

      // Reset counter store
      mockBridge.reset('counter');
      
      // Wait for the DOM to update
      await screen.findByText('Count: 0');
      expect(screen.getByText('Count: 0')).toBeInTheDocument();
    });
  });
}); 