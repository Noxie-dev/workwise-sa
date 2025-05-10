import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['server/tests/**/*.test.ts', 'src/**/*.test.ts', 'client/src/**/*.test.ts*'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'server/tests/',
        '**/*.d.ts',
      ],
    },
  },
});