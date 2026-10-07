import js from '@eslint/js';
import playwright from 'eslint-plugin-playwright';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      'apps/api/src/generated/**',
      'e2e/playwright-report/**',
      'e2e/test-results/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
  {
    files: ['apps/api/**/*.ts', 'e2e/**/*.ts', '**/*.config.ts', 'eslint.config.js'],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['apps/api/src/types/**/*.d.ts'],
    rules: { '@typescript-eslint/no-namespace': 'off' },
  },
  {
    files: ['apps/web/src/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  {
    // Playwright best practices: no hard waits, no missing awaits, prefer web-first assertions.
    files: ['e2e/**/*.ts'],
    ...playwright.configs['flat/recommended'],
    rules: {
      ...playwright.configs['flat/recommended'].rules,
      'playwright/no-wait-for-timeout': 'error',
      'playwright/no-force-option': 'error',
      'playwright/prefer-web-first-assertions': 'error',
      'playwright/no-raw-locators': 'warn',
    },
  },
);
