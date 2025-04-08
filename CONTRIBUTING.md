# Contributing to App Bridge

We love your input! We want to make contributing to App Bridge as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## Development Process

We use GitHub to host code, to track issues and feature requests, as well as accept pull requests.

1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code lints.
6. Issue that pull request!

## Project Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/app-bridge.git
   cd app-bridge
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Build all packages:
   ```bash
   pnpm build
   ```

4. Run tests:
   ```bash
   pnpm test
   ```

## Package Structure

The project is organized as a monorepo with the following packages:

- `@open-game-system/app-bridge-types`: Core type definitions
- `@open-game-system/app-bridge-web`: Web-specific implementation
- `@open-game-system/app-bridge-native`: React Native specific code
- `@open-game-system/app-bridge-react`: React hooks and components
- `@open-game-system/app-bridge-testing`: Testing utilities

## Development Workflow

1. Make changes in the appropriate package(s)
2. Run tests for affected packages:
   ```bash
   pnpm test --filter "./packages/app-bridge-*"
   ```
3. Build affected packages:
   ```bash
   pnpm build --filter "./packages/app-bridge-*"
   ```
4. Test changes in example apps:
   ```bash
   cd examples/react-app
   pnpm dev
   ```

## Pull Request Process

1. Update the README.md with details of changes to the interface, if applicable.
2. Update the documentation in the `docs/` directory.
3. The PR may be merged once you have the sign-off of at least one other developer.

## Any contributions you make will be under the MIT Software License

In short, when you submit code changes, your submissions are understood to be under the same [MIT License](http://choosealicense.com/licenses/mit/) that covers the project. Feel free to contact the maintainers if that's a concern.

## Report bugs using GitHub's [issue tracker](https://github.com/open-game-system/app-bridge/issues)

We use GitHub issues to track public bugs. Report a bug by [opening a new issue](https://github.com/open-game-system/app-bridge/issues/new).

## Write bug reports with detail, background, and sample code

**Great Bug Reports** tend to have:

- A quick summary and/or background
- Steps to reproduce
  - Be specific!
  - Give sample code if you can.
- What you expected would happen
- What actually happens
- Notes (possibly including why you think this might be happening, or stuff you tried that didn't work)

## License

By contributing, you agree that your contributions will be licensed under its MIT License. 