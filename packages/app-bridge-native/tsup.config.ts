import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: { resolve: true },
  splitting: false,
  sourcemap: true,
  clean: true,
  external: [
    '@open-game-system/app-bridge-types',
    'react-native',
    'react-native-webview',
    'immer',
    'fast-json-patch',
    'invariant'
  ],
}); 