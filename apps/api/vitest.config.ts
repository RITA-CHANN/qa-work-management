import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    // Unit tests must not need a real .env; give env.ts what it needs at import time.
    env: {
      DATABASE_URL: 'postgresql://unit:unit@localhost:5432/unit',
      DATABASE_URL_TEST: 'postgresql://unit:unit@localhost:5432/unit',
      LOG_LEVEL: 'silent',
    },
  },
});
