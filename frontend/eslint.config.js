// @ts-check
import eslint from '@eslint/js';
import boundaries from 'eslint-plugin-boundaries';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const RESTRICTED_SYNTAX = [
    { selector: 'TSEnumDeclaration', message: 'Use an `as const` object.' },
    {
        selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
        message: 'Forbidden (architecture.md).',
    },
    {
        selector: "JSXAttribute[name.name='color'] Literal[value=/^text[.]/]",
        message: 'Use color="textSecondary" / "textPrimary" / "textDisabled".',
    },
    {
        selector: "BinaryExpression[operator=/^[!=]==$/] > MemberExpression[property.name='role']",
        message: 'Decide by role through ACCESS / useAccess() (features/auth/access.ts).',
    },
];

const IMPORT_META_ENV = {
    selector: "MemberExpression[object.type='MetaProperty'][property.name='env']",
    message: 'Read configuration from `@/shared/config/env` (checked against a schema).',
};

export default tseslint.config(
    {
        ignores: [
            'dist*'],
            'boundaries/elements': [
                { type: 'app', pattern: 'src/app' },
                { type: 'feature', pattern: 'src/features/employee*', '!@/features/employee*'],
                            message: 'Import a feature only through its index.ts.',
                        },
                        { group: ['../..*.{ts,tsx}'],
        rules: {
            'no-restricted-imports': [
                'error',
                {
                    paths: [{ name: '@mui/icons-material', message: 'Import icons individually.' }],
                    patterns: [
                        {
                            group: ['@/features*'],
                            message: 'Import a feature only through its index.ts.',
                        },
                        { group: ['@/app', '@/app*.{ts,tsx}'],
        rules: {
            'no-restricted-imports': [
                'error',
                {
                    paths: [{ name: '@mui/icons-material', message: 'Import icons individually.' }],
                    patterns: [
                        {
                            group: ['@/features*'],
                            message: 'Import a feature only through its index.ts.',
                        },
                        { group: ['@/app', '@/app**', '!..*.ts'],
        languageOptions: { globals: { ...globals.node } },
    },
    {
        files: ['src/shared/config/env.ts'],
        rules: { 'no-restricted-syntax': ['error', ...RESTRICTED_SYNTAX] },
    },
    {
        files: ['*.config.ts'],
        rules: { 'no-restricted-syntax': 'off' },
    },
    {
        files: [
            'src/theme*.ts',
            'src*.ts',
            'src/features/auth/components/app-preview.tsx',
        ],
        rules: { '@typescript-eslint/no-magic-numbers': 'off' },
    },
);
