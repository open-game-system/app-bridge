# 🌉 @open-game-system/app-bridge

A universal bridge that connects web games and the OpenGame App through a shared state store.

## ✨ Features

- 🌐 Cross-platform compatibility (Web, React, React Native, Server)
- 🔄 Unified state management between web games and native applications
- 🎮 Simple and intuitive API for state updates and subscriptions
- 🧪 Testing utilities for mocking bridges and stores

## 📦 Installation

```bash
# NPM
npm install @open-game-system/app-bridge

# Yarn
yarn add @open-game-system/app-bridge

# PNPM
pnpm add @open-game-system/app-bridge
```

## 🚀 Usage

The package provides different exports for different environments:

```typescript
// Core functionality and types
import { createBridge, type Store, type Bridge } from '@open-game-system/app-bridge';

// Web-specific implementation
import { createWebBridge } from '@open-game-system/app-bridge/web';

// React integration with hooks and context
import { createBridgeContext } from '@open-game-system/app-bridge/react';

// React Native integration
import { createNativeBridge } from '@open-game-system/app-bridge/native';

// Testing utilities
import { createMockNativeBridge } from '@open-game-system/app-bridge/testing';
```

## 📚 Documentation

- 🏗️ [Architecture Overview](docs/ARCHITECTURE.md)
- 📖 [Core Concepts](docs/CONCEPTS.md)
- 🧪 [Testing Strategies](docs/TESTING_STRATEGIES.md)
- 🤝 [Contributing Guide](docs/CONTRIBUTING.md)

## 🛠️ Development

This project uses pnpm as the package manager:

```bash
# Install dependencies
pnpm install

# Build the package
pnpm build

# Development mode
pnpm dev

# Run tests
pnpm test
```

## 📱 Examples

The monorepo includes example applications:

- 🎯 `examples/react-app`: A basic React application that demonstrates how to use the app-bridge with React
- 📱 `examples/react-native-app`: A React Native application that demonstrates native integration

To run the React example:

```bash
cd examples/react-app
pnpm install
pnpm dev
```

To run the React Native example:

```bash
cd examples/react-native-app
pnpm install
pnpm start
```

## 🧪 Testing

The testing utilities provide mocks for testing applications that use the App Bridge:

```typescript
import { createMockNativeBridge } from '@open-game-system/app-bridge/testing';

// Create a mock bridge for testing
const mockBridge = createMockNativeBridge<AppStores>({
  isSupported: true,
  stores: {
    counter: {
      initialState: { count: 0 }
    }
  }
});

// Use in tests
test('Counter updates correctly', async () => {
  const store = await mockBridge.getStore('counter');
  expect(store.getState().count).toBe(0);
  
  await mockBridge.produce('counter', draft => {
    draft.count += 1;
  });
  
  expect(store.getState().count).toBe(1);
});
```

For more details on testing strategies, see [docs/TESTING_STRATEGIES.md](docs/TESTING_STRATEGIES.md). 