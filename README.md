# @open-game-system/app-bridge

A universal bridge that connects web games and the OpenGame App through a shared state store.

## Features

- Cross-platform compatibility (Web, React, React Native/Expo, Server)
- Unified state management between web games and native applications
- Simple and intuitive API for state updates and subscriptions

## Packages

This monorepo contains the following packages:

- `@open-game-system/app-bridge`: Core functionality and base implementations
- `@open-game-system/app-bridge-web`: Web-specific implementation
- `@open-game-system/app-bridge-react`: React integration
- `@open-game-system/app-bridge-react-native`: React Native integration
- `@open-game-system/app-bridge-testing`: Testing utilities

## Development

This project uses pnpm as the package manager:

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Development mode
pnpm dev

# Run tests
pnpm test
```

## Verifying Setup

To verify that your local setup is working correctly, you can run the verification script:

```bash
./scripts/verify-setup.sh
```

This script will:
1. Check that pnpm is installed
2. Install all dependencies
3. Run the linter
4. Build all packages
5. Run tests
6. Build the example React app

Alternatively, you can follow the CI workflow defined in `.github/workflows/ci.yml` which runs the same verification steps in a GitHub Actions environment.

## Examples

The monorepo includes example applications:

- `examples/react-app`: A basic React application that demonstrates how to use the app-bridge with React

To run the React example:

```bash
cd examples/react-app
pnpm install
pnpm dev
```

## License

[MIT](LICENSE)

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

## Project Structure

- `App.tsx` - Main application component using the App Bridge
- `index.js` - Entry point for Expo
- `app.json` - Expo configuration

## How It Works

This example uses Babel's module resolver plugin to directly import from the source files of each package in the monorepo. This approach has several advantages:

1. No need for complex Metro configuration
2. No need for scripts to copy or build packages
3. Changes to source files are immediately reflected in the Expo app

The babel.config.js file maps import paths from the published package names to their source locations:

```js
// Example path mapping
alias: {
  '@open-game-system/app-bridge': '../../packages/core/src',
  '@open-game-system/app-bridge-react': '../../packages/react/src',
  // ...other aliases
}
```

This approach is used by many popular React Native libraries that support monorepos.

## Notes on Web Support

The web support for this example requires additional configuration. Currently, there are some dependency issues when building for web. If you need web support, you may need to:

1. Use a specific version of react-native-web compatible with Expo 48
2. Install additional dependencies such as `styleq` with the right version

For development purposes, it's recommended to use the native (iOS/Android) targets. 