# Testing Strategies

Testing applications that use `@open-game-system/app-bridge` involves verifying both the individual components and their interaction with the bridge and stores. The `packages/testing` module provides utilities to facilitate this.

## Core Testing Utilities

- **`createMockNativeBridge<AppStores>(config)`**: Mocks the `NativeBridge` interface, providing a powerful way to test components with full bridge capabilities.
  - `config.isSupported`: Boolean to simulate bridge availability.
  - `config.stores`: An object where keys are store keys. Each value can configure:
    - `initialState`: Starting state for that store.
  - `isSupported()`: Returns the configured value.
  - `getStore(key)`: Returns a store instance that reflects the current state.
  - `produce(key, recipe)`: Allows direct state updates using a recipe function, similar to the real `NativeBridge`.

## Testing React Components

The primary approach involves using `createMockNativeBridge` with the React Context providers.

### 1. Testing Components with Bridge Interaction

For components that dispatch events, use selectors, or interact with multiple stores, use `createMockNativeBridge` with the main `BridgeContext.Provider`.

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { createMockNativeBridge } from '@open-game-system/app-bridge-testing';
import { BridgeContext } from '../src/contexts/bridge';
import { CounterContext } from '../src/contexts/counter';
import { CounterComponent } from '../src/components/Counter';
import type { AppStores } from '../src/types';

test('Counter component increments value via bridge', async () => {
  // 1. Create a mock native bridge with initial state
  const mockBridge = createMockNativeBridge<AppStores>({
    isSupported: true,
    stores: {
      counter: {
        initialState: { count: 5 }
      }
    }
  });

  // 2. Render component within BridgeContext Provider
  render(
    <BridgeContext.Provider bridge={mockBridge}>
      <CounterContext.Initialized>
        <CounterComponent />
      </CounterContext.Initialized>
    </BridgeContext.Provider>
  );

  // 3. Assert initial state
  expect(screen.getByText('Count: 5')).toBeInTheDocument();

  // 4. Simulate user interaction
  fireEvent.click(screen.getByText('Increment'));

  // 5. Update state using produce
  await mockBridge.produce('counter', draft => {
    draft.count += 1;
  });

  // 6. Assert component updates
  expect(await screen.findByText('Count: 6')).toBeInTheDocument();

  // 7. Verify store state
  const store = await mockBridge.getStore('counter');
  expect(store.getState().count).toBe(6);
});
```

### 2. Testing Multiple Store Interactions

When testing components that interact with multiple stores, you can use `produce` to update state across different stores:

```tsx
test('User profile updates across stores', async () => {
  const mockBridge = createMockNativeBridge<AppStores>({
    isSupported: true,
    stores: {
      user: {
        initialState: { name: 'John', isLoggedIn: false }
      },
      settings: {
        initialState: { theme: 'light' }
      }
    }
  });

  render(
    <BridgeContext.Provider bridge={mockBridge}>
      <UserContext.Initialized>
        <SettingsContext.Initialized>
          <ProfileComponent />
        </SettingsContext.Initialized>
      </UserContext.Initialized>
    </BridgeContext.Provider>
  );

  // Update user state
  await mockBridge.produce('user', draft => {
    draft.isLoggedIn = true;
  });

  // Update settings state
  await mockBridge.produce('settings', draft => {
    draft.theme = 'dark';
  });

  // Assert UI updates
  expect(await screen.findByText('Welcome back, John!')).toBeInTheDocument();
  expect(await screen.findByText('Dark Theme Active')).toBeInTheDocument();
});
```

### 3. Testing Bridge Availability States

Test how your application behaves when the bridge is not supported or stores are initializing:

```tsx
// Testing Unsupported State
test('Shows fallback when bridge is not supported', () => {
  const mockBridge = createMockNativeBridge<AppStores>({ 
    isSupported: false 
  });

  render(
    <BridgeContext.Provider bridge={mockBridge}>
      <AppLayout />
    </BridgeContext.Provider>
  );

  expect(screen.getByText('OpenGame App Required')).toBeInTheDocument();
});

// Testing Initializing State
test('Shows loading indicator while store is initializing', () => {
  const mockBridge = createMockNativeBridge<AppStores>({ 
    isSupported: true 
  });

  render(
    <BridgeContext.Provider bridge={mockBridge}>
      <CounterContext.Initializing>
        <p>Loading...</p>
      </CounterContext.Initializing>
    </BridgeContext.Provider>
  );

  expect(screen.getByText('Loading...')).toBeInTheDocument();
});
```

## Testing Native Side (React Native)

Testing React Native components follows the same principles as React components, using `createMockNativeBridge` for state management:

```tsx
import { render, fireEvent } from '@testing-library/react-native';
import { createMockNativeBridge } from '@open-game-system/app-bridge-testing';

test('Native component updates state via produce', async () => {
  const mockBridge = createMockNativeBridge<AppStores>({
    isSupported: true,
    stores: {
      game: {
        initialState: { score: 0, level: 1 }
      }
    }
  });

  render(
    <BridgeContext.Provider bridge={mockBridge}>
      <GameContext.Initialized>
        <GameComponent />
      </GameContext.Initialized>
    </BridgeContext.Provider>
  );

  // Update game state
  await mockBridge.produce('game', draft => {
    draft.score += 100;
    draft.level += 1;
  });

  // Assert UI updates
  expect(await screen.findByText('Score: 100')).toBeInTheDocument();
  expect(await screen.findByText('Level: 2')).toBeInTheDocument();
});
```

## Key Considerations

-   **Use `produce` for State Updates**: Instead of directly manipulating store state, use the `produce` method to maintain consistency with the real bridge implementation.
-   **Context Providers**: Always wrap components in the appropriate `BridgeContext.Provider` and `StoreContext.Initialized`.
-   **Async Updates**: State updates through `produce` are asynchronous. Use `async/await` and `@testing-library`'s `findBy*` queries or `waitFor` when asserting UI changes.
-   **Initial State**: Set up initial state in the `createMockNativeBridge` config to match your test scenarios.
-   **Bridge Support**: Use `isSupported` to test both supported and unsupported environments. 