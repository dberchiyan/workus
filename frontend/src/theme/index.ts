import { createTheme, type Shadows } from '@mui/material/styles';
import type { CSSProperties } from 'react';
import { TOKENS } from './tokens';
import { muiTypography } from './typography';

type SidebarPalette = Record<keyof (typeof TOKENS.colors.light)['sidebar'], string>;
type AvatarPalette = Record<keyof (typeof TOKENS.colors.light)['avatar'], string>;
type ChartPalette = Record<keyof (typeof TOKENS.colors.light)['chart'], string>;
type BadgePalette = Record<keyof (typeof TOKENS.colors.light)['badge'], string>;
type ShadowPalette = Record<keyof (typeof TOKENS.colors.light)['shadow'], string>;
type StatusPalette = Record<keyof (typeof TOKENS.colors.light)['status'], string>;

declare module '@mui/material/styles' {
  interface TypographyVariants {
    metric: CSSProperties;
    tableHeader: CSSProperties;
  }
  interface TypographyVariantsOptions {
    metric?: CSSProperties;
    tableHeader?: CSSProperties;
  }
  interface Palette {
    sidebar: SidebarPalette;
    avatar: AvatarPalette;
    badge: BadgePalette;
    chart: ChartPalette;
    shadow: ShadowPalette;
    status: StatusPalette;
  }
  interface PaletteOptions {
    sidebar?: SidebarPalette;
    avatar?: AvatarPalette;
    badge?: BadgePalette;
    chart?: ChartPalette;
    shadow?: ShadowPalette;
    status?: StatusPalette;
  }
}

/**
 * Soft, layered elevation (a tight contact shadow + a wide ambient one) in the scheme's shadow
 * colours, instead of Material's grey stacks: 1 = cards, 2–8 = menus and popovers, 9+ = dialogs.
 */
const SOFT = 'var(--mui-palette-shadow-soft)';
const STRONG = 'var(--mui-palette-shadow-strong)';
const elevation = (level: number): string => {
  if (level === 0) {
    return 'none';
  }
  if (level === 1) {
    return `0 1px 2px ${SOFT}`;
  }
  if (level <= 8) {
    return `0 1px 3px ${SOFT}, 0 8px 24px -4px ${STRONG}`;
  }
  return `0 2px 6px ${SOFT}, 0 24px 56px -8px ${STRONG}`;
};
const shadows = Array.from({ length: 25 }, (_, level) => elevation(level)) as Shadows;

/**
 * A pressed control gives a little (feedback, 120 ms). Only when the person allows motion; the
 * transform never moves layout.
 */
const pressable = (scale: number) => ({
  '@media (prefers-reduced-motion: no-preference)': {
    transition: 'transform 120ms ease-out, background-color 150ms, border-color 150ms, color 150ms',
    '&:active:not(:disabled)': { transform: `scale(${scale})` },
  },
});

/** One visible focus ring for every clickable control (ripples are off). */
const focusRing = (offset: number) => ({
  '&.Mui-focusVisible': {
    outline: '2px solid var(--mui-palette-primary-main)',
    outlineOffset: offset,
  },
});

export const theme = createTheme({
  // nativeColor: MUI derives tints with CSS color-mix(), so OKLCH tokens work as they are.
  cssVariables: { colorSchemeSelector: 'class', nativeColor: true },
  colorSchemes: {
    light: { palette: TOKENS.colors.light },
    dark: { palette: TOKENS.colors.dark },
  },
  breakpoints: { values: TOKENS.breakpoints },
  shape: { borderRadius: TOKENS.radius.sm },
  shadows,
  typography: muiTypography,
  components: {
    // The page reserves the scrollbar gutter (html { scrollbar-gutter: stable }), so MUI's
    // scroll lock would compensate twice and shift the page sideways when a menu/dialog opens.
    MuiModal: { defaultProps: { disableScrollLock: true } },
    // Popover (Menu, Select, Autocomplete lists) passes its own value to Modal — set below.
    MuiTypography: { defaultProps: { variantMapping: { metric: 'p', tableHeader: 'span' } } },
    // No Material ripples: state shows through colour and the focus ring.
    MuiButtonBase: {
      defaultProps: { disableRipple: true },
      styleOverrides: { root: focusRing(2) },
    },
    // Rows inside a list or menu: the ring sits inside, so it is not clipped.
    MuiMenuItem: { styleOverrides: { root: focusRing(-2) } },
    MuiListItemButton: { styleOverrides: { root: focusRing(-2) } },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { minHeight: 44, ...pressable(0.98) } },
    },
    MuiIconButton: {
      styleOverrides: { root: { minWidth: 44, minHeight: 44, ...pressable(0.94) } },
    },
    // Loading placeholders shimmer (a light sweep) — still when motion is reduced.
    MuiSkeleton: {
      defaultProps: { animation: 'wave' },
      styleOverrides: {
        root: {
          '@media (prefers-reduced-motion: reduce)': { '&::after': { animation: 'none' } },
        },
      },
    },
    // Surfaces: no dark-mode overlay gradient; menus and popovers get a hairline so they read
    // on dark backgrounds as well as by their shadow.
    MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
    MuiPopover: {
      defaultProps: { disableScrollLock: true },
      styleOverrides: {
        paper: ({ theme: t }) => ({
          borderRadius: TOKENS.radius.md,
          border: `1px solid ${t.vars.palette.divider}`,
        }),
      },
    },
    // Touch targets ≥ 44 px (ux.md), like Button and IconButton above.
    // 44 px always; the small size (compact panels) is 32 px under a mouse, 44 px under a finger.
    MuiToggleButton: {
      styleOverrides: { root: { minHeight: 44 } },
      variants: [
        {
          props: { size: 'small' },
          style: { minHeight: 32, '@media (pointer: coarse)': { minHeight: 44 } },
        },
      ],
    },
    // Page numbers stay compact under a mouse and grow to 44 px under a finger.
    MuiPaginationItem: {
      styleOverrides: {
        root: { '@media (pointer: coarse)': { minWidth: 44, height: 44, borderRadius: 22 } },
      },
    },
    // "Rows per page", the range and the page buttons wrap at phone width instead of overflowing.
    MuiTablePagination: {
      styleOverrides: {
        toolbar: { flexWrap: 'wrap', justifyContent: 'flex-end', rowGap: 4 },
        spacer: { display: 'none' },
      },
    },
    // A centred dialog on a phone keeps a 16 px edge (MUI's 32 px leaves a narrow column).
    MuiDialog: {
      styleOverrides: {
        paper: ({ theme: t, ownerState }) =>
          ownerState.fullScreen
            ? {}
            : {
                borderRadius: TOKENS.radius.lg,
                [t.breakpoints.down('sm')]: {
                  margin: 16,
                  width: 'calc(100% - 32px)',
                  maxHeight: 'calc(100% - 32px)',
                },
              },
      },
    },
    MuiTableCell: {
      // Header row reads as chrome, not data: muted, smaller, on a light band with a rule below.
      styleOverrides: {
        head: ({ theme: t }) => ({
          ...t.typography.tableHeader,
          color: t.vars.palette.text.secondary,
          backgroundColor: t.vars.palette.background.default,
          borderBottom: `1px solid ${t.vars.palette.divider}`,
        }),
      },
    },
    // Body rows answer the pointer with a quiet tint (rows open profiles and requests).
    MuiTableRow: {
      styleOverrides: {
        root: ({ theme: t }) => ({
          transition: t.transitions.create('background-color', {
            duration: t.transitions.duration.shortest,
          }),
          '.MuiTableBody-root &:hover': { backgroundColor: t.vars.palette.action.hover },
        }),
      },
    },
    // Cards are flat: a hairline and a contact shadow, the same in both schemes.
    MuiCard: {
      defaultProps: { elevation: 1 },
      styleOverrides: {
        // Every card, `outlined` included, so they all look alike.
        root: ({ theme: t }) => ({
          borderRadius: TOKENS.radius.lg,
          border: `1px solid ${t.vars.palette.divider}`,
          boxShadow: t.shadows[1],
        }),
      },
    },
  },
});

export { typographyGlobalStyles } from './typography';
export { TOKENS } from './tokens';

declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    metric: true;
    tableHeader: true;
  }
}
