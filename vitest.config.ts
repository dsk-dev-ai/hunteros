import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const configDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    globals: true,
    root: configDir,
    include: ['packages/*/__tests__/**/*.test.ts', 'packages/*/test/**/*.test.ts'],
  },
});
