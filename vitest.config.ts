import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const configDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    globals: true,
    root: configDir,
    include: ['packages/*/__tests__/**/*.test.ts', 'packages/*/test/**/*.test.ts'],
  },
});
