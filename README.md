# 🌉 @open-game-system/app-bridge

A universal bridge that connects web games and the OpenGame App through a shared state store.

[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## 📚 Quick Links

- [🏗️ Architecture](docs/ARCHITECTURE.md) - System design and patterns
- [🎯 Core Concepts](docs/CONCEPTS.md) - Key concepts and usage patterns
- [🧪 Testing](docs/TESTING_STRATEGIES.md) - Testing utilities and patterns

## 🔄 Overview

The app-bridge provides a unified way to manage state between web games and the OpenGame App:

- **Web Side**: Runs in a WebView, sending events to native and receiving state updates
- **Native Side**: Manages WebView communication and state updates
- **React Integration**: First-class React support with hooks and context providers

## 📦 Packages

The app-bridge is split into several packages for better modularity:

- `@open-game-system/app-bridge-types`: Core type definitions
- `@open-game-system/app-bridge-web`: Web-specific implementation
- `@open-game-system/app-bridge-native`: React Native specific code
- `@open-game-system/app-bridge-react`: React hooks and components for web apps
- `@open-game-system/app-bridge-react-native`: React hooks and components for React Native apps
- `@open-game-system/app-bridge-testing`: Testing utilities

## 📥 Installation

Choose the packages you need based on your use case:

### For Web Apps

```bash
# Required packages for web apps
pnpm add @open-game-system/app-bridge-web @open-game-system/app-bridge-react @open-game-system/app-bridge-types
```

### For React Native Apps

```bash
# Required packages for React Native apps
pnpm add @open-game-system/app-bridge-native @open-game-system/app-bridge-react-native @open-game-system/app-bridge-types
```

### For Testing

```bash
# Add testing utilities as a dev dependency
pnpm add -D @open-game-system/app-bridge-testing
```

## 🚀 Quick Start

### Shared Types

First, create a shared types file that both web and native sides can use:

```typescript
// shared/types.ts
export interface CounterState {
  value: number;
}

export type CounterEvents =
  | { type: "INCREMENT" }
  | { type: "DECREMENT" }
  | { type: "SET"; value: number };

export type AppStores = {
  counter: {
    state: CounterState;
    events: CounterEvents;
  };
};
```

### Web Side (React)

```typescript
// 1. Import from the appropriate packages
import type { AppStores } from "./shared/types";
import { createWebBridge } from "@open-game-system/app-bridge-web";
import { createBridgeContext } from "@open-game-system/app-bridge-react";

// 2. Create the bridge with your type
const bridge = createWebBridge<AppStores>();

// 3. Create the bridge context with your type
const BridgeContext = createBridgeContext<AppStores>();

// 4. Create store contexts for each store you need
const CounterContext = BridgeContext.createStoreContext("counter");

// 5. Use in components
function Counter() {
  // Using store context hooks
  const value = CounterContext.useSelector((state) => state.value);
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
```

### Native Side (React Native)

```typescript
// 1. Import from the appropriate packages
import type { AppStores, CounterState, CounterEvents } from "./shared/types"; // Ensure types are defined
import {
  createNativeBridge,
  createStore,
} from "@open-game-system/app-bridge-native";
import { WebView } from "react-native-webview";
import { useRef, useEffect, useSyncExternalStore, Text, Button } from "react"; // Add Button/Text imports

// 2. Create the native bridge
const bridge = createNativeBridge<AppStores>();

// 3. Create and configure the counter store
const counterStore = createStore<CounterState, CounterEvents>({
  initialState: { value: 0 },
  producer: (draft, event) => {
    switch (event.type) {
      case "INCREMENT":
        draft.value += 1;
        break;
      case "DECREMENT":
         if (draft.value > 0) draft.value -= 1;
        break;
      case "SET":
        draft.value = event.value;
        break;
    }
  },
  // Add optional declarative listener
  on: {
      INCREMENT: (event, store) => {
          console.log(`[Store Config] Incremented. New value: ${store.getSnapshot().value}`);
      }
  }
});

// 4. Register the store with the bridge
bridge.setStore("counter", counterStore);

// 5. Create a WebView wrapper component
function GameWebView() {
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    // Register WebView and get cleanup function
    const unregister = bridge.registerWebView(webViewRef.current);

    // Optional: Add dynamic listener example
    const unsubscribeSet = counterStore.on('SET', (event) => {
        console.log(`[Dynamic Listener] Counter set to: ${event.value}`);
    });

    // Cleanup on unmount
    return () => {
        unregister();
        unsubscribeSet();
    };
  }, [webViewRef]); // Dependency on ref is correct

  return (
    <>
      <WebView
        ref={webViewRef}
        source={{ uri: "https://your-game-url.com" }} // Replace with actual URL/local server
        onMessage={(event) => bridge.handleWebMessage(event.nativeEvent.data)} // Pass event.nativeEvent.data
      />
      {/* Add Example UI to interact with the store */}
      <CounterControls />
      <Status webViewRef={webViewRef} />
    </>
  );
}

// Example controls to dispatch events to the store
const CounterControls = () => {
    const handleInc = () => counterStore.dispatch({ type: 'INCREMENT'});
    const handleDec = () => counterStore.dispatch({ type: 'DECREMENT'});
    const handleSet = () => counterStore.dispatch({ type: 'SET', value: 10 });

    return (
        <>
            <Button title="Increment Native" onPress={handleInc} />
            <Button title="Decrement Native" onPress={handleDec} />
            <Button title="Set Native to 10" onPress={handleSet} />
        </>
    )
}

// Status component remains similar, but pass ref
const Status = ({ webViewRef }: { webViewRef: React.RefObject<WebView> }) => {
  // Hook requires webView instance, not just the ref object directly
  const isReady = useSyncExternalStore(
    (callback) => bridge.subscribeToReadyState(webViewRef.current, callback),
    () => bridge.getReadyState(webViewRef.current),
    () => bridge.getReadyState(webViewRef.current) // Server snapshot
  );

  return <Text>Bridge Status: {isReady ? "Ready" : "Connecting..."}</Text>;
};
```

### Testing with Mock Bridge

```typescript
import { createMockBridge } from "@open-game-system/app-bridge-testing";
import { createBridgeContext } from "@open-game-system/app-bridge-react";
import type { AppStores } from "./shared/types";

describe("Counter Component", () => {
  const mockBridge = createMockBridge<AppStores>({
    initialState: {
      counter: { value: 0 },
    },
  });

  const TestBridgeContext = createBridgeContext<AppStores>();
  const TestCounterContext = TestBridgeContext.createStoreContext("counter");

  it("renders and updates correctly", () => {
    render(
      <TestBridgeContext.Provider bridge={mockBridge}>
        <TestCounterContext.Provider>
          <Counter />
        </TestCounterContext.Provider>
      </TestBridgeContext.Provider>
    );

    expect(screen.getByText("Count: 0")).toBeInTheDocument();

    fireEvent.click(screen.getByText("+"));
    expect(mockBridge.getHistory("counter")).toContainEqual({
      type: "INCREMENT",
    });
  });
});
```

## 📚 Examples

Check out our example apps:

- [React Web Example](examples/react-app) - Shows web integration
- [React Native Example](examples/expo-app) - Shows native integration

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to contribute to this project.

## 📄 License

MIT © OpenGame System

<!-- NPM_TOKEN test - Updated token on April 11, 2025 -->
