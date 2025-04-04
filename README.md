# 🌉 @open-game-system/app-bridge

A universal bridge that connects web games and the OpenGame App through a shared state store.

[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## 📚 Quick Links

- [📖 API Reference](docs/API_REFERENCE.md) - Complete API documentation
- [🏗️ Architecture](docs/ARCHITECTURE.md) - System design and patterns
- [🎯 Core Concepts](docs/CONCEPTS.md) - Key concepts and usage patterns
- [🧪 Testing](docs/TESTING_STRATEGIES.md) - Testing utilities and patterns

## 🔄 Overview

The app-bridge provides a unified way to manage state between web games and the OpenGame App:

- **Web Side**: Runs in a WebView, sending events to native and receiving state updates
- **Native Side**: Manages WebView communication and state updates
- **React Integration**: First-class React support with hooks and context providers

## 📦 Installation

```bash
# NPM
npm install @open-game-system/app-bridge

# Yarn
yarn add @open-game-system/app-bridge

# PNPM
pnpm add @open-game-system/app-bridge
```

## 🚀 Quick Start

### Shared Types

First, create a shared types file that both web and native sides can use:

```typescript
// shared/types.ts
export interface CounterState {
  value: number;
}

export interface CounterEvents {
  type: "INCREMENT" | "DECREMENT" | "SET";
  value?: number;
}

export type AppStores = {
  counter: {
    state: CounterState;
    events: CounterEvents;
  };
};
```

### Web Side (React)

```typescript
// 1. Import shared types and bridge functions
import type { AppStores } from './shared/types';
import { createWebBridge, createBridgeContext } from '@open-game-system/app-bridge';

// 2. Create the bridge with your type
const bridge = createWebBridge<AppStores>();

// 3. Create the bridge context with your type
const BridgeContext = createBridgeContext<AppStores>();

// 4. Create store contexts for each store you need
const CounterContext = BridgeContext.createStoreContext('counter');

// 5. Use in components
function Counter() {
  // Using store context hooks
  const value = CounterContext.useSelector(state => state.value);
  const store = CounterContext.useStore();

  return (
    <div>
      <p>Count: {value}</p>
      <button onClick={() => store.dispatch({ type: "INCREMENT" })}>+</button>
    </div>
  );
}

// 6. Wrap your app
function App() {
  return (
    <BridgeContext.Provider bridge={bridge}>
      <BridgeContext.Supported>
        <CounterContext.Provider>
          <Counter />
        </CounterContext.Provider>
        <CounterContext.Loading>
          <div>Waiting for counter data...</div>
        </CounterContext.Loading>
      </BridgeContext.Supported>
      <BridgeContext.Unsupported>
        <div>Bridge not supported in this environment</div>
      </BridgeContext.Unsupported>
    </BridgeContext.Provider>
  );
}

// Error handling example
function BadCounter() {
  // This will throw an error if used outside of CounterContext.Provider
  const value = CounterContext.useSelector(state => state.value);
  return <div>{value}</div>;
}
```

### Native Side (React Native)

```typescript
// 1. Import shared types
import type { AppStores } from './shared/types';
import { WebView } from 'react-native-webview';

// 2. Create the native bridge with initial state
const bridge = createNativeBridge<AppStores>({
  initialState: {
    counter: { value: 0 }
  }
});

// 3. Create a WebView wrapper component
function GameWebView() {
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    const webView = webViewRef.current;
    if (!webView) return;

    // Register the WebView with the bridge
    bridge.registerWebView(webView);
    
    // Cleanup on unmount
    return () => {
      bridge.unregisterWebView(webView);
    };
  }, []);

  return (
    <WebView
      ref={webViewRef}
      source={{ uri: 'https://your-game-url.com' }}
    />
  );
}

// 4. Use in your app
function App() {
  return (
    <View style={{ flex: 1 }}>
      <GameWebView />
    </View>
  );
}
```

### Web Side (Direct Usage)

```typescript
// 1. Import shared types
import type { AppStores } from './shared/types';
import { createWebBridge } from '@open-game-system/app-bridge';

// 2. Create the web bridge
const bridge = createWebBridge<AppStores>();

// 3. Listen for store availability
bridge.subscribe(() => {
  console.log('Store availability changed');
  
  // Check for counter store
  const counterStore = bridge.getStore('counter');
  if (counterStore) {
    console.log('Counter store is now available');
    
    // Subscribe to state changes
    counterStore.subscribe(state => {
      console.log('Counter state:', state);
      updateUI(state);
    });
    
    // Dispatch events
    document.getElementById('increment')?.addEventListener('click', () => {
      counterStore.dispatch({ type: 'INCREMENT' });
    });
  }
});

// 4. Helper function to update the UI
function updateUI(state: { value: number }) {
  const counterElement = document.getElementById('counter');
  if (counterElement) {
    counterElement.textContent = `Count: ${state.value}`;
  }
}
```

### Testing with Mock Bridge

```typescript
import { createMockBridge, createBridgeContext } from '@open-game-system/app-bridge';
import type { AppStores } from './shared/types';

describe('Counter Component', () => {
  // Create a mock bridge with initial state
  const mockBridge = createMockBridge<AppStores>({
    initialState: {
      counter: { value: 0 }
    }
  });
  
  // Create test-specific contexts
  const TestBridgeContext = createBridgeContext<AppStores>();
  const TestCounterContext = TestBridgeContext.createStoreContext('counter');

  it('renders and updates correctly', () => {
    render(
      <TestBridgeContext.Provider bridge={mockBridge}>
        <TestCounterContext.Provider>
          <Counter />
        </TestCounterContext.Provider>
      </TestBridgeContext.Provider>
    );

    // Test initial render
    expect(screen.getByText('Count: 0')).toBeInTheDocument();

    // Test user interaction
    fireEvent.click(screen.getByText('+'));
    
    // Verify event was dispatched
    expect(mockBridge.getHistory('counter')).toContainEqual({ type: "INCREMENT" });
    
    // Update state directly for testing
    const counterStore = mockBridge.getStore('counter');
    if (counterStore) {
      counterStore.produce(state => {
        state.value = 1;
      });
    }
    expect(screen.getByText('Count: 1')).toBeInTheDocument();

    // Test reset
    mockBridge.reset('counter');
    expect(screen.getByText('Count: 0')).toBeInTheDocument();
  });

  it('handles initialization states', () => {
    // Start with no initialized stores
    const emptyBridge = createMockBridge<AppStores>();
    
    render(
      <TestBridgeContext.Provider bridge={emptyBridge}>
        <TestCounterContext.Loading>
          <div>Loading...</div>
        </TestCounterContext.Loading>
        <TestCounterContext.Provider>
          <Counter />
        </TestCounterContext.Provider>
      </TestBridgeContext.Provider>
    );

    // Should show loading initially
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // Initialize the store
    emptyBridge.setState('counter', { value: 0 });

    // Should now show the counter
    expect(screen.getByText('Count: 0')).toBeInTheDocument();
  });

  it('handles bridge support states', () => {
    const mockBridge = createMockBridge<AppStores>({
      isSupported: false,
      initialState: {
        counter: { value: 0 }
      }
    });

    render(
      <TestBridgeContext.Provider bridge={mockBridge}>
        <TestBridgeContext.Supported>
          <Counter />
        </TestBridgeContext.Supported>
        <TestBridgeContext.Unsupported>
          <div>Bridge not supported</div>
        </TestBridgeContext.Unsupported>
      </TestBridgeContext.Provider>
    );

    expect(screen.getByText('Bridge not supported')).toBeInTheDocument();
  });

  it('throws error when hooks are used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<Counter />);
    }).toThrow('Store "counter" is not available');

    consoleSpy.mockRestore();
  });
});