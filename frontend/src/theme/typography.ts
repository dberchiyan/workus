import type { TypographyVariantsOptions } from '@mui/material/styles';
import type { CSSProperties } from 'react';

export const TYPE = {
    fontFamily: "'Inter Variable', system-ui, -apple-system, 'Segoe UI', sans-serif",
    fontMono: "'JetBrains Mono', ui-monospace, monospace",
    measure: '65ch',
    features: "'cv05', 'cv08', 'ss03'",
    variants: {
        h1: {
            size: 'clamp(2rem, 1.5rem + 2.5vw, 3rem)',
            weight: 700,
            leading: 1.15,
            tracking: '-0.025em',
        },
        h2: {
            size: 'clamp(1.75rem, 1.4rem + 1.75vw, 2.5rem)',
            weight: 700,
            leading: 1.2,
            tracking: '-0.02em',
        },
        h3: {
            size: 'clamp(1.5rem, 1.3rem + 1vw, 2rem)',
            weight: 650,
            leading: 1.25,
            tracking: '-0.015em',
        },
        h4: {
            size: 'clamp(1.375rem, 1.25rem + 0.6vw, 1.75rem)',
            weight: 650,
            leading: 1.3,
            tracking: '-0.01em',
        },
        h5: { size: '1.25rem', weight: 600, leading: 1.35, tracking: '-0.005em' },
        h6: { size: '1.125rem', weight: 600, leading: 1.4, tracking: '0' },
        subtitle1: { size: '1.125rem', weight: 400, leading: 1.5, tracking: '0' },
        subtitle2: { size: '0.875rem', weight: 500, leading: 1.5, tracking: '0' },
        body1: { size: '1rem', weight: 400, leading: 1.5, tracking: '0' },
        body2: { size: '0.875rem', weight: 400, leading: 1.5, tracking: '0' },
        caption: { size: '0.75rem', weight: 400, leading: 1.4, tracking: '0.01em' },
        overline: { size: '0.75rem', weight: 600, leading: 1.4, tracking: '0.08em' },
        button: { size: '1rem', weight: 600, leading: 1.5, tracking: '0' },
        tableHeader: { size: '0.8125rem', weight: 500, leading: 1.4, tracking: '0.01em' },
        metric: {
            size: 'clamp(1.75rem, 1.4rem + 1.5vw, 2.5rem)',
            weight: 700,
            leading: 1.1,
            tracking: '-0.02em',
        },
    },
    tabularVariants: ['metric'],
    wrap: {
        balance: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'subtitle1'],
        pretty: ['body1', 'body2', 'caption'],
    },
} as const;

export type TypeVariant = keyof typeof TYPE.variants;

const VARIANT_NAMES = Object.keys(TYPE.variants) as TypeVariant[];

const cssVar = (variant: TypeVariant, property: 'size' | 'weight' | 'leading' | 'tracking'): string =>
    `var(--app-${variant}-${property})`;

const TABULAR: ReadonlySet<string> = new Set(TYPE.tabularVariants);
const BALANCED: ReadonlySet<string> = new Set(TYPE.wrap.balance);
const PRETTY: ReadonlySet<string> = new Set(TYPE.wrap.pretty);

const wrapStyle = (variant: TypeVariant): CSSProperties['textWrapStyle'] =>
    BALANCED.has(variant) ? 'balance' : PRETTY.has(variant) ? 'pretty' : undefined;

const variantStyle = (variant: TypeVariant): CSSProperties => ({
    fontSize: cssVar(variant, 'size'),
    fontWeight: cssVar(variant, 'weight'),
    lineHeight: cssVar(variant, 'leading'),
    letterSpacing: cssVar(variant, 'tracking'),
    ...(TABULAR.has(variant) ? { fontVariantNumeric: 'tabular-nums' } : {}),
    ...(wrapStyle(variant) ? { textWrapStyle: wrapStyle(variant) } : {}),
});

export const muiTypography: TypographyVariantsOptions = {
    fontFamily: TYPE.fontFamily,
    ...Object.fromEntries(VARIANT_NAMES.map((variant) => [variant, variantStyle(variant)])),
    button: { ...variantStyle('button'), textTransform: 'none' },
};

export const typographyGlobalStyles = {
    html: { fontFeatureSettings: TYPE.features, fontOpticalSizing: 'auto' },
    ':root': {
        '--app-font-family': TYPE.fontFamily,
        '--app-font-mono': TYPE.fontMono,
        '--app-measure': TYPE.measure,
        ...Object.fromEntries(
            VARIANT_NAMES.flatMap((variant) => {
                const { size, weight, leading, tracking } = TYPE.variants[variant];
                return [
                    [`--app-${variant}-size`, size],
                    [`--app-${variant}-weight`, String(weight)],
                    [`--app-${variant}-leading`, String(leading)],
                    [`--app-${variant}-tracking`, tracking],
                ];
            }),
        ),
    },
    ...Object.fromEntries(
        VARIANT_NAMES.map((variant) => [
            `.app-${variant}`,
            { fontFamily: 'var(--app-font-family)', ...variantStyle(variant) },
        ]),
    ),
    '.app-tabular': { fontVariantNumeric: 'tabular-nums' },
    '.app-prose': {
        maxWidth: 'var(--app-measure)',
        ...variantStyle('body1'),
        '& h2': variantStyle('h3'),
        '& h3': variantStyle('h4'),
        '& small': variantStyle('caption'),
        '& p': { marginBlock: '0 0.5em' },
        '& ul, & ol': { marginBlock: '0 0.5em', paddingInlineStart: '1.5em' },
        '& li p': { marginBlock: 0 },
        '& > :last-child': { marginBlockEnd: 0 },
    },
} as const;
