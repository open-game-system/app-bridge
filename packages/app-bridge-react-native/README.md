# @open-game-system/app-bridge-react-native

React Native specific hooks, components, and context utilities for the `@open-game-system/app-bridge` ecosystem.

## Installation

```bash
npm install @open-game-system/app-bridge-react-native
# or
yarn add @open-game-system/app-bridge-react-native
# or
pnpm add @open-game-system/app-bridge-react-native
```

## Features

- `BridgedWebView`: A WebView component that automatically handles bridge registration and message handling.
- `createNativeBridgeContext`: Creates a React Context setup for easy state management with the app-bridge.

## Quick Start

```tsx
import React from 'react';
import { View, Text } from 'react-native';
import {
  BridgedWebView,
  createNativeBridge,
  createNativeBridgeContext,
  createStore
} from '@open-game-system/app-bridge-react-native';
import type { AppStores } from './types';

// Create a bridge
const bridge = createNativeBridge<AppStores>();

// Create a counter store
const counterStore = createStore({
  initialState: { value: 0 },
  producer: (draft, event) => {
    switch (event.type) {
      case 'INCREMENT':
        draft.value += 1;
        break;
      case 'DECREMENT':
        draft.value -= 1;
        break;
    }
  }
});

// Register the store with the bridge
bridge.setStore('counter', counterStore);

// Create context
const BridgeContext = createNativeBridgeContext<AppStores>();
const CounterContext = BridgeContext.createStoreContext('counter');

// App component
function App() {
  return (
    <BridgeContext.Provider bridge={bridge}>
      <View style={{ flex: 1 }}>
        <Counter />
        <BridgedWebView
          bridge={bridge}
          source={{ uri: 'https://your-web-app.com' }}
          style={{ flex: 1 }}
        />
      </View>
    </BridgeContext.Provider>
  );
}

// Counter component
function Counter() {
  const count = CounterContext.useSelector(state => state.value);
  const store = CounterContext.useStore();
  
  return (
    <View>
      <Text>Count: {count}</Text>
      <Button 
        title="+" 
        onPress={() => store?.dispatch({ type: 'INCREMENT' })} 
      />
      <Button 
        title="-" 
        onPress={() => store?.dispatch({ type: 'DECREMENT' })} 
      />
    </View>
  );
}
```

## API Reference

### Components

#### `BridgedWebView`

A wrapper around `WebView` from `react-native-webview` that automatically handles bridge registration and message handling.

```tsx
<BridgedWebView
  bridge={bridge} // NativeBridge instance
  onMessage={customHandler} // Optional: your own message handler
  {...otherWebViewProps} // All other WebView props are passed through
/>
```

### Hooks and Context

#### `createNativeBridgeContext<TStores>()`

Creates a context setup for the bridge with typed store access.

```tsx
const BridgeContext = createNativeBridgeContext<AppStores>();

// In your app
<BridgeContext.Provider bridge={bridge}>
  {/* Children with access to the bridge */}
</BridgeContext.Provider>
```

#### Store Context

```tsx
const CounterContext = BridgeContext.createStoreContext('counter');

// Access the store
const store = CounterContext.useStore();

// Select state with automatic updates
const count = CounterContext.useSelector(state => state.value);
```

## License

MIT 