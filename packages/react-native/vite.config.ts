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