# @open-game-system/app-bridge Bootstrap Guide

I need to set up a TypeScript monorepo for the @open-game-system/app-bridge library suite with the following specifications:

## Project Overview
- A universal bridge that connects web games and the OpenGame App through a shared state store
- Cross-platform compatibility (Web, React, React Native/Expo, Server)
- Pre-compiled approach (instead of TypeScript-first) for better Expo compatibility

## Monorepo Structure
Use the following directory structure:
```
@open-game-system/app-bridge/
├── package.json                 # Root package.json for the monorepo
├── pnpm-workspace.yaml          # PNPM workspace configuration
├── tsconfig.json                # Base TSConfig
├── vitest.config.ts             # Root Vitest configuration
├── biome.json                   # Biome configuration
├── .gitignore
├── README.md                    # Main documentation
├── packages/
│   ├── core/                    # Core functionality
│   │   ├── package.json         # Published as @open-game-system/app-bridge
│   │   ├── tsconfig.json
│   │   ├── vite.config.ts
│   │   └── src/
│   │       ├── index.ts
│   │       ├── types.ts
│   │       ├── bridge.ts        # Bridge implementation
│   │       └── utils/
│   │           ├── index.ts
│   │           └── produce.ts   # Immutable state updates (immer-like)
│   │
│   ├── client/                  # Client-side implementation
│   │   ├── package.json         # Published as @open-game-system/app-bridge-client
│   │   ├── tsconfig.json
│   │   ├── vite.config.ts
│   │   └── src/
│   │       ├── index.ts
│   │       └── bridge.ts
│   │
│   ├── react/                   # React implementation
│   │   ├── package.json         # Published as @open-game-system/app-bridge-react
│   │   ├── tsconfig.json
│   │   ├── vite.config.ts
│   │   └── src/
│   │       ├── index.ts
│   │       ├── hooks.ts
│   │       └── context.ts
│   │
│   ├── react-native/            # React Native implementation
│   │   ├── package.json         # Published as @open-game-system/app-bridge-react-native
│   │   ├── tsconfig.json
│   │   ├── vite.config.ts       # Main Vite config
│   │   ├── vite.rn.config.ts    # RN-specific build config
│   │   └── src/
│   │       ├── index.ts
│   │       ├── bridge.ts
│   │       └── expo/
│   │           └── index.ts
│   │
│   └── testing/                 # Testing utilities
│       ├── package.json         # Published as @open-game-system/app-bridge-testing
│       ├── tsconfig.json
│       ├── vite.config.ts
│       └── src/
│           ├── index.ts
│           ├── mockBridge.ts
│           └── mockStore.ts
│
└── examples/                    # Example applications
    ├── react-app/
    └── expo-app/
```

## Technology Stack
- **Package Manager**: pnpm
- **Build System**: Vite (with vite-plugin-dts for types)
- **Testing Framework**: Vitest
- **Linting & Formatting**: Biome
- **State Management**: Custom store implementation

## Setup Steps

1. Initialize the monorepo root package
2. Create each package in the packages directory with proper dependencies
3. Configure Vite for each package
4. Set up the special RN build for Expo compatibility

## Package.json Files

### Root package.json
```json
{
  "name": "@open-game-system/app-bridge-monorepo",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "build": "pnpm -r build",
    "dev": "pnpm -r dev",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "biome check .",
    "format": "biome format --write .",
    "lint:fix": "biome check --apply .",
    "changeset": "changeset",
    "version-packages": "changeset version",
    "release": "pnpm build && changeset publish"
  },
  "devDependencies": {
    "@biomejs/biome": "1.3.3",
    "@changesets/cli": "^2.26.1",
    "typescript": "^5.0.4",
    "vite": "^4.3.5",
    "vitest": "^0.30.1",
    "vite-plugin-dts": "^2.3.0"
  }
}
```

### pnpm-workspace.yaml
```yaml
packages:
  - 'packages/*'
  - 'examples/*'
```

### Core Package (packages/core/package.json)
```json
{
  "name": "@open-game-system/app-bridge",
  "version": "0.1.0",
  "description": "Core functionality for the OpenGame App Bridge",
  "main": "dist/index.js",
  "module": "dist/index.mjs",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "default": "./dist/index.js"
    },
    "./types": {
      "types": "./dist/types.d.ts",
      "import": "./dist/types.mjs",
      "require": "./dist/types.js"
    },
    "./utils": {
      "types": "./dist/utils/index.d.ts",
      "import": "./dist/utils/index.mjs",
      "require": "./dist/utils/index.js"
    }
  },
  "files": [
    "dist",
    "README.md"
  ],
  "scripts": {
    "build": "vite build",
    "dev": "vite build --watch",
    "test": "vitest run"
  },
  "devDependencies": {
    "@biomejs/biome": "1.3.3",
    "vite": "^4.3.5",
    "vite-plugin-dts": "^2.3.0",
    "vitest": "^0.30.1",
    "typescript": "^5.0.4"
  }
}
```

### Client Package (packages/client/package.json)
```json
{
  "name": "@open-game-system/app-bridge-client",
  "version": "0.1.0",
  "description": "Client-side implementation of the OpenGame App Bridge",
  "main": "dist/index.js",
  "module": "dist/index.mjs",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "default": "./dist/index.js"
    },
    "./bridge": {
      "types": "./dist/bridge.d.ts",
      "import": "./dist/bridge.mjs",
      "require": "./dist/bridge.js"
    }
  },
  "files": [
    "dist",
    "README.md"
  ],
  "scripts": {
    "build": "vite build",
    "dev": "vite build --watch",
    "test": "vitest run"
  },
  "dependencies": {
    "@open-game-system/app-bridge": "workspace:*"
  },
  "devDependencies": {
    "@biomejs/biome": "1.3.3",
    "vite": "^4.3.5",
    "vite-plugin-dts": "^2.3.0",
    "vitest": "^0.30.1",
    "typescript": "^5.0.4"
  }
}
```

### React Package (packages/react/package.json)
```json
{
  "name": "@open-game-system/app-bridge-react",
  "version": "0.1.0",
  "description": "React integration for the OpenGame App Bridge",
  "main": "dist/index.js",
  "module": "dist/index.mjs",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "default": "./dist/index.js"
    },
    "./hooks": {
      "types": "./dist/hooks.d.ts",
      "import": "./dist/hooks.mjs",
      "require": "./dist/hooks.js"
    },
    "./context": {
      "types": "./dist/context.d.ts",
      "import": "./dist/context.mjs",
      "require": "./dist/context.js"
    }
  },
  "files": [
    "dist",
    "README.md"
  ],
  "scripts": {
    "build": "vite build",
    "dev": "vite build --watch",
    "test": "vitest run"
  },
  "dependencies": {
    "@open-game-system/app-bridge": "workspace:*",
    "@open-game-system/app-bridge-client": "workspace:*"
  },
  "peerDependencies": {
    "react": ">=16.8.0",
    "react-dom": ">=16.8.0"
  },
  "devDependencies": {
    "@biomejs/biome": "1.3.3",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "vite": "^4.3.5",
    "vite-plugin-dts": "^2.3.0",
    "vitest": "^0.30.1",
    "typescript": "^5.0.4"
  }
}
```

### React Native Package (packages/react-native/package.json)
```json
{
  "name": "@open-game-system/app-bridge-react-native",
  "version": "0.1.0",
  "description": "React Native integration for the OpenGame App Bridge",
  "main": "lib/index.js",
  "module": "dist/index.mjs",
  "types": "dist/index.d.ts",
  "react-native": "lib/index.js",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "react-native": "./lib/index.js",
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "default": "./lib/index.js"
    },
    "./expo": {
      "types": "./dist/expo/index.d.ts",
      "react-native": "./lib/expo/index.js",
      "import": "./dist/expo/index.mjs",
      "require": "./dist/expo/index.js",
      "default": "./lib/expo/index.js"
    }
  },
  "files": [
    "dist",
    "lib",
    "README.md"
  ],
  "scripts": {
    "build": "vite build",
    "dev": "vite build --watch",
    "test": "vitest run"
  },
  "dependencies": {
    "@open-game-system/app-bridge": "workspace:*",
    "@open-game-system/app-bridge-react": "workspace:*"
  },
  "peerDependencies": {
    "expo": ">=45.0.0",
    "react": ">=16.8.0",
    "react-native": ">=0.64.0"
  },
  "devDependencies": {
    "@biomejs/biome": "1.3.3",
    "@types/react": "^18.2.0",
    "@types/react-native": "^0.72.0",
    "expo": "^48.0.0",
    "react": "^18.2.0",
    "react-native": "^0.72.0",
    "vite": "^4.3.5",
    "vite-plugin-dts": "^2.3.0",
    "vitest": "^0.30.1",
    "typescript": "^5.0.4"
  }
}
```

### Testing Package (packages/testing/package.json)
```json
{
  "name": "@open-game-system/app-bridge-testing",
  "version": "0.1.0",
  "description": "Testing utilities for the OpenGame App Bridge",
  "main": "dist/index.js",
  "module": "dist/index.mjs",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "default": "./dist/index.js"
    }
  },
  "files": [
    "dist",
    "README.md"
  ],
  "scripts": {
    "build": "vite build",
    "dev": "vite build --watch",
    "test": "vitest run"
  },
  "dependencies": {
    "@open-game-system/app-bridge": "workspace:*"
  },
  "devDependencies": {
    "@biomejs/biome": "1.3.3",
    "vite": "^4.3.5",
    "vite-plugin-dts": "^2.3.0",
    "vitest": "^0.30.1",
    "typescript": "^5.0.4"
  }
}
```

## Build Configuration Files

### Root tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "strict": true,
    "declaration": true,
    "sourceMap": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "lib": ["ES2020", "DOM"],
    "jsx": "react-jsx"
  },
  "exclude": ["node_modules", "dist", "lib"]
}
```

### Core Package tsconfig.json (packages/core/tsconfig.json)
```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

### Core Package Vite Config (packages/core/vite.config.ts)
```typescript
import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        types: resolve(__dirname, 'src/types.ts'),
        'utils/index': resolve(__dirname, 'src/utils/index.ts')
      },
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => 
        `${entryName}.${format === 'es' ? 'mjs' : 'js'}`,
    },
    rollupOptions: {
      external: [] // No external dependencies for core
    },
    sourcemap: true,
    minify: false
  },
  plugins: [dts()]
});
```

### React Native Package Vite Configs
Main Vite Config (packages/react-native/vite.config.ts):
```typescript
import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';
import { execSync } from 'child_process';

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        'expo/index': resolve(__dirname, 'src/expo/index.ts')
      },
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => 
        `${entryName}.${format === 'es' ? 'mjs' : 'js'}`,
    },
    rollupOptions: {
      external: [
        'react', 
        'react-native', 
        'expo',
        '@open-game-system/app-bridge',
        '@open-game-system/app-bridge-react'
      ]
    },
    sourcemap: true,
    minify: false
  },
  plugins: [
    dts(),
    {
      name: 'react-native-build',
      closeBundle() {
        console.log('Building React Native specific bundle...');
        execSync('vite build --config vite.rn.config.ts', { stdio: 'inherit' });
      }
    }
  ]
});
```

React Native Specific Config (packages/react-native/vite.rn.config.ts):
```typescript
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        'expo/index': resolve(__dirname, 'src/expo/index.ts')
      },
      formats: ['cjs'],
      fileName: (_, entryName) => `${entryName}.js`,
    },
    target: 'es2017',
    minify: false,
    outDir: 'lib',
    sourcemap: false,
    rollupOptions: {
      external: [
        'react', 
        'react-native', 
        'expo',
        '@open-game-system/app-bridge',
        '@open-game-system/app-bridge-react'
      ],
      output: {
        hoistTransitiveImports: false,
        inlineDynamicImports: false,
        preserveModules: true
      }
    }
  }
});
```

### Root Vitest Config (vitest.config.ts)
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['packages/**/tests/**/*.test.{ts,tsx}'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['**/node_modules/**', '**/dist/**', '**/lib/**']
    }
  }
});
```

### Biome Config (biome.json)
```json
{
  "$schema": "https://biomejs.dev/schemas/1.3.3/schema.json",
  "organizeImports": {
    "enabled": true
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "correctness": {
        "noUnusedVariables": "error"
      },
      "suspicious": {
        "noExplicitAny": "warn"
      },
      "style": {
        "useConst": "error"
      }
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "trailingComma": "es5",
      "semicolons": "always"
    }
  }
}
```

### Key Implementation Details

1. The core package should provide:
   - Basic store interfaces and types
   - Bridge implementation foundation
   - Utility functions (like produce for immutable updates)

2. The client package handles:
   - Web browser specific implementation
   - Communication with native side

3. The React package provides:
   - Context providers
   - React-specific hooks (useStore, useSelector)
   - Component helpers for different states

4. The React Native package needs:
   - React Native specific bridge implementation
   - Expo integration
   - Metro-compatible build output

5. The testing package contains:
   - Mock implementations of bridges and stores
   - Testing utilities for projects using the library

Start by setting up the directory structure and configuration files. After that, I'll implement the core functionality, then build out each package in sequence.