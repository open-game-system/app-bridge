# Expo App Example for OpenGame App Bridge

This is an example Expo application that demonstrates the usage of the OpenGame App Bridge in a React Native environment.

## Features

- Integration with the OpenGame App Bridge
- Example of state management in React Native
- Counter demonstration with increment/decrement functionality
- List management example

## Running the Application

1. Make sure you have the Expo CLI installed:
   ```
   npm install -g expo-cli
   ```

2. Install dependencies:
   ```
   pnpm install
   ```

3. Start the development server:
   ```
   pnpm start
   ```

4. Use the Expo Go app on your mobile device to scan the QR code, or run in a simulator/emulator.

## Development Workflow

When working on this example within the monorepo:

1. First, build the library packages from the project root:
   ```
   pnpm build
   ```

2. Then you can run the Expo app:
   ```
   cd examples/expo-app
   pnpm start
   ```

3. For active development, you can keep the libraries rebuilding on changes:
   ```
   # In one terminal
   pnpm -r dev
   
   # In another terminal
   cd examples/expo-app
   pnpm start
   ```

4. Running tests:
   ```
   # Run tests once
   pnpm test
   
   # Run tests in watch mode during development
   pnpm test:watch
   ```

## Project Structure

- `App.tsx` - Main application component using the App Bridge
- `index.js` - Entry point for Expo
- `app.json` - Expo configuration
- `App.test.tsx` - Basic tests for the app

## How It Works

This example uses the standard Expo setup with no special configuration. 

During development in this monorepo, the app uses local file references:

```json
"dependencies": {
  "@open-game-system/app-bridge": "file:../../packages/core",
  "@open-game-system/app-bridge-react": "file:../../packages/react",
  "@open-game-system/app-bridge-react-native": "file:../../packages/react-native"
}
```

In a real-world application (once these packages are published), you would install them as normal npm packages:

```bash
npm install @open-game-system/app-bridge @open-game-system/app-bridge-react @open-game-system/app-bridge-react-native
```

The application imports components and hooks from these packages:

```javascript
import { BridgeProvider } from '@open-game-system/app-bridge-react';
import { ExpoBridge } from '@open-game-system/app-bridge-react-native/expo';
import { useBridge, useSelector } from '@open-game-system/app-bridge-react/hooks';
```

## Notes on Web Support

The web support for this example requires additional configuration. Currently, there are some dependency issues when building for web. If you need web support, you may need to:

1. Use a specific version of react-native-web compatible with your Expo version
2. Install additional dependencies such as `styleq` with the right version

For development purposes, it's recommended to use the native (iOS/Android) targets. 