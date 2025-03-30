# @open-game-system/app-bridge-web

Web implementation of the OpenGame App Bridge for browser and server environments.

## Installation

```bash
npm install @open-game-system/app-bridge-web
# or
yarn add @open-game-system/app-bridge-web
# or
pnpm add @open-game-system/app-bridge-web
```

## Usage

This package can be used in two ways:

### 1. Direct import

```typescript
import { WebBridge } from '@open-game-system/app-bridge-web';

const bridge = new WebBridge();
```

### 2. Client import (backward compatibility)

For backward compatibility with the client package, you can also import from the client subpath:

```typescript
import { ClientBridge } from '@open-game-system/app-bridge-web/client';

const bridge = new ClientBridge();
```

## Documentation

For more detailed documentation, see the main [@open-game-system/app-bridge](https://github.com/open-game-system/app-bridge) repository.

## License

MIT 