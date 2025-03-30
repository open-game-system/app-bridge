import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.test.{ts,tsx}'],
    exclude: ['node_modules/**'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/**']
    }
  }
}); 