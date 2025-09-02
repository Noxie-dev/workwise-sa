// vitest.config.ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.test.{ts,js}'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/client/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'client/',
        '**/*.d.ts',
        '**/*.test.{ts,js}',
        '**/types/**',
      ],
    },
    alias: {
      '@shared': path.resolve(__dirname, './shared'),
      '@server': path.resolve(__dirname, './server'),
      '@src': path.resolve(__dirname, './src'),
    },
  },
});