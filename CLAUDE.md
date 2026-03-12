# CLAUDE.md

## Project

- **Name:** app-bridge
- **Description:** Monorepo of packages for type-safe WebView-to-native communication in the Open Game System
- **Tech stack:** TypeScript, pnpm workspaces, Turborepo, tsup, Vitest (most packages), Jest (react-native)
- **Scope:** `@open-game-system/app-bridge-*` (types, web, native, react, react-native, testing)

## Knowledge Base

Start here. Load deeper docs **only when working on the relevant domain.**

| Topic | Location |
|---|---|
| Architecture & communication protocol | [docs/architecture.md](docs/architecture.md) |
| Core concepts (bridge pattern, stores, producers, React integration) | [docs/concepts.md](docs/concepts.md) |
| Testing strategies (mock bridge, WebView integration tests) | [docs/testing-strategies.md](docs/testing-strategies.md) |
| Lessons learned | [docs/lessons.md](docs/lessons.md) |

> **Progressive disclosure:** Do NOT load all docs upfront. Read this file,
> then load the specific doc relevant to your current task.

## Core Principles

- **Type safety across the bridge:** Shared type definitions in `app-bridge-types` drive all other packages
- **Native is source of truth:** Native side owns state; web side dispatches events and reflects state
- **Immer-based producers:** State mutations on the native side use Immer draft objects
- **Store lifecycle:** Stores are uninitialized (null) until the native side sets initial state

## Key Conventions

- **Monorepo structure:** All packages live under `packages/app-bridge-*`
- **Workspace dependencies:** Always use `workspace:*` for inter-package deps (never hardcoded versions)
- **Build orchestration:** `turbo run build` -- builds respect `^build` dependency chain
- **Package entry points:** Each package exports `dist/index.js` (CJS), `dist/index.mjs` (ESM), `dist/index.d.ts` (types)
- **Bundler:** tsup for all packages (configured via `tsup.config.ts` or inline in package.json)
- **Scoped packages:** All published under `@open-game-system/` scope
- **Version scheme:** `MAJOR.YYYYMMDD.PATCH` for production, `MAJOR.YYYYMMDD.PATCH-prN` for dev

## Package Dependency Graph

```
app-bridge-types          (foundation -- no internal deps)
  |
  +-- app-bridge-web      (depends on types)
  |     |
  |     +-- app-bridge-react        (depends on types + web; peers: react)
  |
  +-- app-bridge-native   (depends on types; peers: react-native, react-native-webview)
  |     |
  |     +-- app-bridge-react-native (peers: types + native + react + react-native)
  |
  +-- app-bridge-testing  (depends on types; peers: @testing-library/react)
```

## Build & Test

```bash
# Install dependencies
pnpm install

# Build all packages (respects dependency order)
pnpm build          # runs: turbo run build

# Run all tests
pnpm test           # runs: turbo run test (builds first via turbo dep chain)

# Typecheck all packages
pnpm typecheck      # runs: turbo run typecheck

# Run tests with coverage
pnpm test:coverage

# Build/test a specific package
pnpm turbo run build --filter=@open-game-system/app-bridge-web
pnpm turbo run test --filter=@open-game-system/app-bridge-react

# Build a package and all its dependencies
pnpm turbo run build --filter=@open-game-system/app-bridge-react...
```

## Git

- Main branch: `main`
- PR branches publish dev versions to GitHub Packages automatically
- Production publishes to npm on merge to `main`
- Never use `--no-verify` on git hooks
