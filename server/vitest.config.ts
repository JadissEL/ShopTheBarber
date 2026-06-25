import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        include: ['src/**/*.test.ts'],
        globals: true,
        // Neon branch computes auto-suspend; cold starts can take several seconds.
        testTimeout: 30000,
        hookTimeout: 30000,
        // Each test file warms the Neon branch (with retry) before running; see setup.ts.
        setupFiles: ['./src/__tests__/setup.ts'],
    },
});
