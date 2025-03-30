import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        'expo/index': resolve(__dirname, 'src/expo/index.ts'),
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
        '@open-game-system/app-bridge-web',
        '@open-game-system/app-bridge-react',
        /^@open-game-system\/app-bridge/,
      ],
      output: {
        hoistTransitiveImports: false,
        inlineDynamicImports: false,
        preserveModules: true,
      },
    },
  },
});
