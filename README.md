# @open-game-system/app-bridge

A universal bridge that connects web games and the OpenGame App through a shared state store.

## Features

- Cross-platform compatibility (Web, React, React Native/Expo, Server)
- Unified state management between web games and native applications
- Simple and intuitive API for state updates and subscriptions

## Packages

This monorepo contains the following packages:

- `@open-game-system/app-bridge`: Core functionality
- `@open-game-system/app-bridge-client`: Client-side implementation
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