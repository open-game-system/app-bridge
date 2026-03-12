# 🏗️ Architecture

## Overview

The app-bridge package provides a type-safe bridge between web games and the OpenGame App. It manages state and events across the bridge boundary, ensuring type safety and proper initialization.

## System Design

### Core Components

```mermaid
graph TD
    subgraph Web App
        RC[React Components]
        SC[Store Contexts]
        WB[Web Bridge]
    end

    subgraph Native App
        WV1[WebView 1]
        WV2[WebView 2]
        NB[Native Bridge]
        NS[Native Stores]
    end

    RC --> SC
    SC --> WB
    WB --> WV1
    WB --> WV2
    WV1 --> NB
    WV2 --> NB
    NB --> NS
    NS --> NB
    NB --> WV1
    NB --> WV2
    WV1 --> WB
    WV2 --> WB
```

### Communication Protocol

```mermaid
sequenceDiagram
    participant RC as React Component
    participant SC as Store Context
    participant WB as Web Bridge
    participant WV as WebView
    participant NB as Native Bridge
    participant NS as Native Store

    Note over WV: WebView Registration
    WV->>NB: registerWebView
    NB->>WV: injectJavaScript
    NB->>NS: Get Initial State
    NS-->>NB: Initial State
    NB-->>WV: Send Initial State

    Note over RC,WV: State Updates
    RC->>SC: Dispatch Event
    SC->>WB: dispatch
    WB->>WV: postMessage
    WV->>NB: onMessage
    NB->>NS: Update State
    NS-->>NB: State Updated
    NB-->>WV: injectJavaScript
    WV-->>WB: State Update
    WB-->>SC: State Update
    SC-->>RC: Re-render
```

### Store Initialization Flow

```mermaid
sequenceDiagram
    participant App as App
    participant WV as WebView
    participant NB as Native Bridge
    participant NS as Native Store

    App->>WV: Create WebView
    WV->>NB: registerWebView
    NB->>WV: Inject JavaScript
    NB->>NS: Initialize Stores
    NS-->>NB: Initial State
    NB-->>WV: Send Initial State
    WV-->>App: Ready
```

## Implementation Details

### Bridge Implementation

The bridge is implemented as a state management system that:

1. Manages store initialization
2. Handles bi-directional communication through WebView
3. Provides type-safe event dispatch
4. Maintains store state consistency

### WebView Integration

The WebView integration provides:

1. **Registration**
   - Native app registers WebView with bridge
   - Bridge injects necessary JavaScript
   - Bridge sets up message handlers

2. **Message Passing**
   - Web side sends events via `postMessage`
   - Native side receives events via `onMessage`
   - Native side sends state updates via `injectJavaScript`

3. **State Synchronization**
   - Native side maintains source of truth
   - State updates are sent to web via WebView
   - Web side reflects state changes in UI

### React Integration

The React integration provides:

1. Context-based store access
2. Type-safe hooks for state and events
3. Initialization state handling
4. Support state management

### Error Handling

The system implements a layered error handling approach:

1. **Bridge Level**
   - Connection errors
   - Communication failures
   - State synchronization errors

2. **Store Level**
   - Initialization errors
   - State update failures
   - Event processing errors

3. **React Level**
   - Hook usage errors (when hooks are used outside of providers)
   - Context errors
   - Component rendering errors

## Testing Architecture

```mermaid
graph TD
    subgraph Test Environment
        TC[Test Component]
        MB[Mock Bridge]
        MS1[Mock Store 1]
        MS2[Mock Store 2]
        EH[Event History]
    end

    TC --> MB
    MB --> MS1
    MB --> MS2
    MS1 --> MB
    MS2 --> MB
    MB --> EH
    MB --> TC
```

The testing architecture provides:

1. Mock bridge implementation that mimics the real bridge behavior
2. Individual mock stores with direct state manipulation
3. Event tracking for verifying dispatched events
4. State reset capabilities for test isolation
5. Support for testing initialization and error scenarios 

// Add example if any component name issues are found 