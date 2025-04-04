import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@open-game-system/app-bridge': resolve(__dirname, '../../packages/app-bridge/dist')
    }
  }
}); 