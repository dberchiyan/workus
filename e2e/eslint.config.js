// @ts-check
import eslint from '@eslint/js';
import playwright from 'eslint-plugin-playwright';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    { ignores: ['node_modules/**', 'playwright-report/**', 'test-results/**', 'eslint.config.js'] },
    eslint.configs.recommended,
    ...tseslint.configs.strictTypeChecked,
    {
        languageOptions: {
            globals: globals.node,
            parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
        },
        plugins: { 'simple-import-sort': simpleImportSort },
        rules: {
            'no-empty': ['error', { allowEmptyCatch: true }],
            'no-console': 'error',
            'simple-import-sort/imports': 'error',
            'simple-import-sort/exports': 'error',
            '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
            '@typescript-eslint/explicit-module-boundary-types': 'error',
            '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
            'no-restricted-syntax': [
                'error',
                { selector: 'ExportDefaultDeclaration', message: 'Use named exports.' },
                { selector: 'TSEnumDeclaration', message: 'Use an as-const object instead of an enum.' },
            ],
        },
    },
    {
        files: ['tests/**/*.ts'],
        ...playwright.configs['flat/recommended'],
        rules: {
            ...playwright.configs['flat/recommended'].rules,
            'playwright/no-wait-for-timeout': 'error',
            'playwright/no-force-option': 'error',
            'playwright/prefer-web-first-assertions': 'error',
            'playwright/expect-expect': ['error', { assertFunctionNames: ['expect*'] }],
        },
    },
    { files: ['playwright.config.ts'], rules: { 'no-restricted-syntax': 'off' } },
);
