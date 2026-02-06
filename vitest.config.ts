import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'backend/**/*.test.ts'],
    environmentMatchGlobs: [['backend/**/*.test.ts', 'node']],
    globals: true,
  },
});
