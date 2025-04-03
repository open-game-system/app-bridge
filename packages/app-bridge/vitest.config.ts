import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: [
      './src/web/test-setup.ts'
    ],
    globals: true,
    include: ['src/**/*.test.{ts,tsx}', 'examples/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
    deps: {
      inline: ['@testing-library/react', '@testing-library/jest-dom'],
    },
  },
});
