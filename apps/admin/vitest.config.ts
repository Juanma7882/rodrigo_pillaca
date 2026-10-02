import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    // Los flujos de formularios con userEvent tardan hasta ~4 s en local y bastante más en CI.
    testTimeout: 20_000,
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
