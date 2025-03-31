# Core Concepts

This document explains the fundamental concepts behind the OpenGame App Bridge library.

## 1. TypeScript-First Approach

This library adopts a "TypeScript-First" philosophy. The primary public contract is defined by its strong TypeScript types and interfaces. The goal is to provide the best possible type safety and developer experience for consumers using TypeScript.

**How it works in practice:**

-   **Source as the Contract:** The `.ts` source files and the interfaces/types they export are the definitive API.
-   **Flexible Consumption:**
    -   **Direct Source Integration (Recommended for Monorepos):** Consumers can configure their build systems to resolve package imports directly to the TypeScript source files within the monorepo. This provides the tightest integration and avoids potential type mismatches. *This is the approach used in the `examples/expo-app` via `babel-plugin-module-resolver`.*
    -   **Standard Build Output:** Each package still includes a standard build process (`pnpm build`) that generates JavaScript (`.js`, `.mjs`) and type definition (`.d.ts`) files. These are necessary for publishing to npm and for consumption by projects that don't integrate the source directly.

**Benefits:**

-   **Enhanced Type Safety:** Maximizes TypeScript's benefits.
-   **Improved Developer Experience:** Richer IntelliSense, easier refactoring.
-   **Clear Contracts:** Interfaces define *what* the bridge does, decoupling consumers from implementation details.

**Considerations:**

-   **Direct Source Integration Setup:** Consuming source directly requires build tool configuration (like Babel plugins or tsconfig paths) to handle module resolution within the monorepo.
-   **Build Step for Distribution:** A build step is still necessary within each package to create distributable artifacts for publishing or broader use.

## 2. Bridge Pattern

The library employs a variation of the Bridge design pattern. The core idea is to decouple an abstraction (the concept of a shared, synchronized state store) from its multiple implementations (native environment vs. web environment).

-   **Abstraction:** Defined by the core interfaces in `packages/core`: `Store`, `Bridge`, `NativeBridge`.
-   **Implementations:**
    -   `NativeBridge` (in `packages/react-native`): The "host" or "source of truth" implementation.
    -   `WebBridge` (in `packages/web`): The "client" implementation that mirrors the state held by the native side.

This pattern allows both the native application and the web application to interact with the "bridge" concept through interfaces appropriate to their context, without needing to know the intricate details of the cross-environment communication. `packages/react` further builds on this by providing a React-specific layer over the `WebBridge`.

## 3. Store Isolation (Key-Based Features)

Instead of a single monolithic state object, the bridge manages multiple independent "stores," each identified by a unique string key. This promotes modularity and separation of concerns.

-   **`StoreDefinition`:** Each feature defines its state shape and the types of events it handles.
-   **`BridgeStores`:** A central type aggregates all `StoreDefinition`s, mapping keys to their respective definitions.
-   **Access:** Both native and web sides access stores using these keys (e.g., `bridge.getStore('myFeature')`).

This design prevents different features from accidentally interfering with each other's state and makes the overall state structure easier to manage as the application grows.

## 4. React Context Integration

`packages/react` provides a convenient and type-safe way to integrate the bridge and its stores into React applications using the context API.

-   **`createBridgeContext<AppStores>()`:** This factory function is the main entry point. It takes your application's `BridgeStores` type as a generic argument.
    -   It returns a `BridgeContext` object containing:
        -   `Provider`: Wraps your application (or relevant part) to manage the underlying bridge instance.
        -   `useBridge`: Hook to access the bridge instance directly.
        -   `Supported`/`Unsupported`: Components to conditionally render UI based on bridge availability.
        -   `createStoreContext`: A *method* on the `BridgeContext` object.
-   **`BridgeContext.createStoreContext('storeKey')`:** Called with a specific store key (e.g., `'counter'`).
    -   It returns a `StoreContext` specific to that feature store (e.g., `CounterContext`).
    -   This `StoreContext` contains:
        -   `useStore`: Hook to get the store instance (safe only within `Initialized`).
        -   `useSelector`: Hook to subscribe to parts of the store's state (safe only within `Initialized`).
        -   `Initializing`/`Initialized`: Components to handle the store's loading and ready states, ensuring hooks are used safely.

This two-step context creation (`createBridgeContext` then `createStoreContext`) ensures that all parts of the system are correctly typed according to the top-level `AppStores` definition, providing end-to-end type safety from bridge creation down to component-level state selection.

## 5. Native vs. Web Responsibilities

-   **Native Side (`NativeBridge`):**
    -   **Source of Truth:** Holds the canonical application state.
    -   **State Updates:** Responsible for *applying* state changes based on events (using reducers) or direct mutations (using `produce`).
    -   **Synchronization:** Sends state updates to connected WebViews.
    -   **Event Handling:** Receives events dispatched from WebViews.
-   **Web Side (`WebBridge`):**
    -   **State Mirror:** Receives and holds a synchronized copy of the state from the native side.
    -   **Event Dispatch:** Sends events initiated by the web application to the native side for processing.
    -   **Subscriptions:** Allows web application components to subscribe to state changes.
    -   **Environment Detection:** Determines if it's running within a compatible native host.

This separation ensures a clear flow of data: state flows *from* native *to* web, and events flow *from* web *to* native (or originate natively). 