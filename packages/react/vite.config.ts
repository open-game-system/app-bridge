import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        hooks: resolve(__dirname, 'src/hooks.ts'),
        context: resolve(__dirname, 'src/context.ts')
      },
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => 
        `${entryName}.${format === 'es' ? 'mjs' : 'js'}`,
    },
    rollupOptions: {
      external: [
        'react', 
        'react-dom',
        '@open-game-system/app-bridge',
        '@open-game-system/app-bridge-client'
      ]
    },
    sourcemap: true,
    minify: false
  },
  plugins: [dts()]
}); 