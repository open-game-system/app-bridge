import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        bridge: resolve(__dirname, 'src/bridge.ts'),
        client: resolve(__dirname, 'src/client.ts'),
      },
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => {
        const extension = format === 'es' ? 'mjs' : 'js';
        return `${entryName}.${extension}`;
      },
    },
    rollupOptions: {
      external: [
        '@open-game-system/app-bridge',
        '@open-game-system/app-bridge/utils'
      ],
      output: {
        exports: 'named',
      },
    },
    sourcemap: true,
  },
  plugins: [
    dts({
      include: ['src/**/*.ts'],
      exclude: ['**/*.test.ts'],
    }),
  ],
});
