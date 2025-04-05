# Expo App Example

This example demonstrates using the `@open-game-system/app-bridge` in a React Native app with Expo.

## Overview

The app consists of a native counter component and a WebView displaying a web counter. The state is synchronized between the two using the app-bridge.

## Running the App

1. Install dependencies:
```bash
npm install
```

2. Start the Expo app:
```bash
npm start
```

3. Make sure you also start the web example from the `examples/react-app` directory to serve the web part:
```bash
cd ../react-app
npm install
npm start
```

## Testing Approach

This example includes straightforward testing that focuses on the actual user experience:

1. **Visible Components**: Tests verify that all UI elements are rendered correctly
2. **User Interactions**: Tests verify that buttons respond to presses as expected
3. **State Changes**: Tests verify that the counter state updates correctly
4. **WebView Rendering**: Tests verify that the WebView is rendered with proper properties

We deliberately avoid testing implementation details like message passing between native and web. Instead, we focus on testing the app from a user's perspective.

### Running Tests

```bash
npm test
```

### Example Test

```typescript
// Simple test that verifies user-visible functionality
it('displays the counter and responds to button presses', () => {
  const { getByText } = render(<App />);
  
  // Verify the counter and buttons are displayed
  expect(getByText('Native Counter: 0')).toBeTruthy();
  expect(getByText('+')).toBeTruthy();
  
  // Click the increment button
  fireEvent.press(getByText('+'));
  
  // Verify the counter updates
  expect(getByText('Native Counter: 1')).toBeTruthy();
  
  // Click the reset button
  fireEvent.press(getByText('Reset'));
  
  // Verify the counter resets
  expect(getByText('Native Counter: 0')).toBeTruthy();
});
```

## Structure

- `App.tsx`: Main application component with WebView and counter
- `__tests__/AppBridge-test.tsx`: Tests for the app functionality 