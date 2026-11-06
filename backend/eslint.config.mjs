// @ts-check
import eslint from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const crossModuleInternals = [
  '../../*/repository/**',
  '../../../*/repository/**',
  '../../*/controller/**',
  '../../../*/controller/**',
];
const prismaClient = ['**/generated/prisma/**', '@prisma/client', '@prisma/client/**'];

export default tseslint.config(
  { ignores: ['dist/**', 'src/generated/**', 'node_modules/**', 'eslint.config.mjs'] },
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      globals: { ...globals.node },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
        emitDecoratorMetadata: true,
        experimentalDecorators: true,
      },
    },
    rules: {
      'no-console': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      '@typescript-eslint/no-extraneous-class': ['error', { allowWithDecorator: true }],
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      'no-restricted-syntax': [
        'error',
        { selector: 'TSEnumDeclaration', message: 'Use an `as const` object.' },
      ],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: crossModuleInternals, message: 'Use the other module’s exported service.' },
            {
              group: prismaClient,
              message: 'Prisma is used only in repositories and common/persistence.',
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      'src/modules/*/repository/**/*.ts',
      'src/common/persistence/**/*.ts',
      'src/common/security/permission.service.ts',
      'prisma/**/*.ts',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: crossModuleInternals, message: 'Use the other module’s exported service.' },
          ],
        },
      ],
    },
  },
  {
    files: ['src/modules/*/controller/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['**/repository/**'], message: 'Controllers never touch repositories.' },
            { group: prismaClient, message: 'Controllers never touch Prisma types.' },
          ],
        },
      ],
    },
  },
  {
    // Mappers turn records into DTOs (architecture.md → Record + mapper): record types only.
    files: ['src/modules/*/controller/mapper/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              regex: '/repository/(?!record/)',
              message: 'Mappers may import only record types from the repository.',
            },
            { group: prismaClient, message: 'Controllers never touch Prisma types.' },
          ],
        },
      ],
    },
  },
);
