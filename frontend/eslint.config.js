// @ts-check
import eslint from '@eslint/js';
import boundaries from 'eslint-plugin-boundaries';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', 'src/shared/types/api.ts', 'eslint.config.js'] },
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  jsxA11y.flatConfigs.strict,
  reactHooks.configs.flat.recommended,
  {
    languageOptions: {
      globals: { ...globals.browser },
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    plugins: { 'react-refresh': reactRefresh, boundaries },
    settings: {
      'import/resolver': { typescript: { project: './tsconfig.app.json' } },
      'boundaries/include': ['src/**/*'],
      'boundaries/elements': [
        { type: 'app', pattern: 'src/app' },
        { type: 'feature', pattern: 'src/features/*', capture: ['featureName'] },
        { type: 'shared', pattern: 'src/shared' },
        { type: 'theme', pattern: 'src/theme' },
        { type: 'locales', pattern: 'src/locales' },
      ],
    },
    rules: {
      'no-console': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      'no-restricted-syntax': [
        'error',
        { selector: 'TSEnumDeclaration', message: 'Use an `as const` object.' },
        {
          selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
          message: 'Forbidden (architecture.md).',
        },
      ],
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          policies: [
            {
              from: { element: { type: 'app' } },
              allow: {
                to: { element: { types: ['app', 'feature', 'shared', 'theme', 'locales'] } },
              },
            },
            {
              from: { element: { type: 'feature' } },
              allow: { to: { element: { types: ['feature', 'shared', 'theme'] } } },
            },
            {
              from: { element: { type: 'shared' } },
              allow: { to: { element: { types: ['shared', 'theme'] } } },
            },
            { from: { element: { type: 'theme' } }, allow: { to: { element: { type: 'theme' } } } },
          ],
        },
      ],
      'no-restricted-imports': [
        'error',
        {
          paths: [{ name: '@mui/icons-material', message: 'Import icons individually.' }],
          patterns: [
            { group: ['@/features/*/*'], message: 'Import a feature only through its index.ts.' },
            { group: ['../../*'], message: 'No ../../ chains — use the @/ alias.' },
            { group: ['framer-motion'], message: 'Use motion/react.' },
          ],
        },
      ],
    },
  },
  {
    files: ['src/features/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [{ name: '@mui/icons-material', message: 'Import icons individually.' }],
          patterns: [
            { group: ['@/features/*/*'], message: 'Import a feature only through its index.ts.' },
            { group: ['@/app', '@/app/*'], message: 'Features never import app/.' },
            {
              group: ['../../*'],
              message: 'Another feature is reached only through @/features/<name>.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['vite.config.ts', 'scripts/**/*.ts'],
    languageOptions: { globals: { ...globals.node } },
  },
);
