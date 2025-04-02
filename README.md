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
// 1. Import shared types
import type { AppStores } from './shared/types';

// 2. Create the bridge
const bridge = createBridge<AppStores>();

// 3. Set up React context
const BridgeContext = createBridgeContext<AppStores>();
const CounterContext = BridgeContext.createStoreContext('counter');

// 4. Use in components
function Counter() {
  // Using store context hooks
  const value = CounterContext.useSelector(state => state.value);
  const dispatch = CounterContext.useDispatch();

  return (
    <div>
      <p>Count: {value}</p>
      <button onClick={() => dispatch({ type: "INCREMENT" })}>+</button>
    </div>
  );
}

// 5. Wrap your app
function App() {
  return (
    <BridgeContext.Provider bridge={bridge}>
      <BridgeContext.Supported>
        <CounterContext.Initialized>
          <Counter />
        </CounterContext.Initialized>
      </BridgeContext.Supported>
      <BridgeContext.Unsupported>
        <div>Bridge not supported in this environment</div>
      </BridgeContext.Unsupported>
    </BridgeContext.Provider>
  );
}

// Error handling example
function BadCounter() {
  // This will throw an error if used outside of BridgeContext.Provider
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
  stores: {
    counter: {
      initialState: { value: 0 }
    }
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

### Testing with Mock Bridge

```typescript
import { createMockBridge } from '@open-game-system/app-bridge/testing';
import type { AppStores } from './shared/types';

describe('Counter Component', () => {
  // Create a mock bridge with initial state
  const mockBridge = createMockBridge<AppStores>({
    stores: {
      counter: { value: 0 }
    }
  });

  it('renders and updates correctly', () => {
    render(
      <BridgeContext.Provider bridge={mockBridge}>
        <CounterContext.Initialized>
          <Counter />
        </CounterContext.Initialized>
      </BridgeContext.Provider>
    );

    // Test initial render
    expect(screen.getByText('Count: 0')).toBeInTheDocument();

    // Test user interaction
    fireEvent.click(screen.getByText('+'));
    expect(screen.getByText('Count: 1')).toBeInTheDocument();

    // Test direct state updates
    mockBridge.reset('counter');
    expect(screen.queryByText(/Count:/)).not.toBeInTheDocument();
  });

  it('handles initialization states', () => {
    render(
      <BridgeContext.Provider bridge={mockBridge}>
        <CounterContext.Initializing>
          <div>Loading...</div>
        </CounterContext.Initializing>
        <CounterContext.Initialized>
          <Counter />
        </CounterContext.Initialized>
      </BridgeContext.Provider>
    );

    // Should show loading initially
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // Initialize the store
    mockBridge.dispatch('counter', { type: 'SET', value: 0 });

    // Should now show the counter
    expect(screen.getByText('Count: 0')).toBeInTheDocument();
  });

  it('handles bridge support states', () => {
    const mockBridge = createMockBridge<AppStores>({
      isSupported: false,
      stores: {
        counter: { value: 0 }
      }
    });

    render(
      <BridgeContext.Provider bridge={mockBridge}>
        <BridgeContext.Supported>
          <Counter />
        </BridgeContext.Supported>
        <BridgeContext.Unsupported>
          <div>Bridge not supported</div>
        </BridgeContext.Unsupported>
      </BridgeContext.Provider>
    );

    expect(screen.getByText('Bridge not supported')).toBeInTheDocument();
  });

  it('throws error when hooks are used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<Counter />);
    }).toThrow('useBridge must be used within a BridgeProvider');

    consoleSpy.mockRestore();
  });
});
```

## 📱 Examples

The repository includes example applications:

- 🎯 `examples/react-app`: A basic React web application
- 📱 `examples/expo-app`: An Expo/React Native application

To run the examples:

```bash
# React example
cd examples/react-app
pnpm install
pnpm dev

# Expo example
cd examples/expo-app
pnpm install
pnpm start
```

## 🛠️ Development

```bash
# Install dependencies
pnpm install

# Build the package
pnpm build

# Development mode with watch
pnpm dev

# Run tests
pnpm test
``` 