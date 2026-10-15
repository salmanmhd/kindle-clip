import { configDefaults, defineConfig } from 'vitest/config';
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
    // Playwright specs run with `npx playwright test`, not Vitest
    exclude: [...configDefaults.exclude, 'tests/**/*.spec.ts'],
    hookTimeout: 60000,
    setupFiles: ['./tests/setup.ts']
  },
});
