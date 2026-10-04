import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  resolve: {
    alias: {
      'next/server': 'next/server.js',
    },
  },
  test: {
    environment: 'node',
    hookTimeout: 60000,
    setupFiles: ['./tests/setup.ts']
  },
});
