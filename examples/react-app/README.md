# React Web Example

This example demonstrates using the `@open-game-system/app-bridge` in a web application that communicates with a React Native app through a WebView.

## Overview

The app implements a counter that synchronizes its state between:
- The web app (this example)
- The native app (see `examples/expo-app`)

Key features:
- Real-time state synchronization
- Type-safe event dispatching
- Bridge status indicator
- Error handling and fallback UI

## Quick Start

1. Install dependencies:
```bash
pnpm install
```

2. Start the development server:
```bash
pnpm dev
```

The app will be available at `http://localhost:5173`.

## Development Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build
- `pnpm test` - Run tests
- `pnpm test:coverage` - Run tests with coverage
- `pnpm typecheck` - Check TypeScript types

## Project Structure

```
src/
├── App.tsx           # Main application component
├── Counter.tsx       # Counter component with bridge integration
├── bridge.ts         # Bridge setup and configuration
├── types.ts          # Shared type definitions
└── __tests__/       # Test files
```

### Key Files

- `App.tsx`: Sets up the bridge provider and displays bridge status
- `Counter.tsx`: Implements the counter UI and bridge integration
- `bridge.ts`: Configures the web bridge instance
- `types.ts`: Defines shared types for state and events

## Integration with Expo App

This web app is designed to run inside a WebView in the Expo app example. The integration works as follows:

1. **URL Configuration**
   - Development:
     - iOS: `http://localhost:5173`
     - Android: `http://10.0.2.2:5173`
   - Production: Configure your production URL in the Expo app

2. **Bridge Status**
   - Green indicator: Bridge is connected and working
   - Red indicator: Bridge is not available (running in standalone browser)

3. **State Synchronization**
   - Counter state is shared between web and native
   - Changes in either environment update both UIs
   - State persists across WebView reloads

## Testing

The example includes comprehensive tests focusing on user-visible functionality:

```typescript
import { render, fireEvent } from '@testing-library/react';
import { Counter } from '../Counter';

test('counter updates when buttons are clicked', () => {
  const { getByText } = render(<Counter />);
  
  // Initial state
  expect(getByText('Web Bridge Counter:')).toBeInTheDocument();
  expect(getByText('0')).toBeInTheDocument();
  
  // Increment
  fireEvent.click(getByText('+'));
  expect(getByText('1')).toBeInTheDocument();
  
  // Decrement
  fireEvent.click(getByText('-'));
  expect(getByText('0')).toBeInTheDocument();
});
```

Run tests with:
```bash
pnpm test
```

## Troubleshooting

### Common Issues

1. **Bridge Not Connecting**
   - Verify you're running inside the Expo app WebView
   - Check the URL configuration in the Expo app
   - Look for console errors in the browser dev tools

2. **State Not Syncing**
   - Ensure both apps are running (web and Expo)
   - Check the bridge status indicator
   - Verify WebView message handling in the native app

3. **Hot Reloading**
   - State resets on hot reload (expected behavior)
   - Bridge automatically reconnects
   - WebView may need manual reload in some cases

### Development vs Production

1. **Development Mode**
   - Includes detailed console logging
   - Shows bridge status indicator
   - Enables React DevTools integration

2. **Production Mode**
   - Minimal console output
   - Optimized bundle size
   - Stricter error handling

## Environment Configuration

The app supports different environments through Vite's environment variables:

```env
# .env.development
VITE_API_URL=http://localhost:5173

# .env.production
VITE_API_URL=https://your-production-url.com
```

## Type Safety

The example demonstrates full type safety with the bridge:

```typescript
// types.ts
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

## Performance Considerations

1. **State Updates**
   - Use selectors to prevent unnecessary re-renders
   - Memoize complex computations
   - Batch updates when possible

2. **Event Handling**
   - Debounce rapid events if needed
   - Use event delegation for multiple controls
   - Avoid synchronous state updates in loops