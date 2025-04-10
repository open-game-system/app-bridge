import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: {
    resolve: true,
    compilerOptions: {
      composite: false,
      moduleResolution: "node"
    }
  },
  splitting: false,
  sourcemap: true,
  clean: true,
  external: [
    '@open-game-system/app-bridge-types',
    '@open-game-system/app-bridge-native',
    'react',
    'react-native',
    'react-native-webview'
  ]
}); 