/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths({
      projects: [resolve(__dirname, '../../tsconfig.json')]
    })
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    deps: {
      optimizer: {
        web: {
          include: [
            '@open-game-system/app-bridge-types',
            '@open-game-system/app-bridge-web',
            '@open-game-system/app-bridge-react',
            '@open-game-system/app-bridge-testing'
          ]
        }
      }
    }
  },
  resolve: {
    alias: [
      {
        find: '@open-game-system/app-bridge-types',
        replacement: resolve(__dirname, '../../packages/app-bridge-types/src')
      },
      {
        find: '@open-game-system/app-bridge-web',
        replacement: resolve(__dirname, '../../packages/app-bridge-web/src')
      },
      {
        find: '@open-game-system/app-bridge-react',
        replacement: resolve(__dirname, '../../packages/app-bridge-react/src')
      },
      {
        find: '@open-game-system/app-bridge-testing',
        replacement: resolve(__dirname, '../../packages/app-bridge-testing/src')
      }
    ]
  },
  optimizeDeps: {
    include: [
      '@open-game-system/app-bridge-types',
      '@open-game-system/app-bridge-web',
      '@open-game-system/app-bridge-react',
      '@open-game-system/app-bridge-testing'
    ]
  }
}); 