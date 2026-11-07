import { createTheme } from '@mui/material/styles';
import type { CSSProperties } from 'react';
import { TOKENS } from './tokens';
import { muiTypography } from './typography';

type SidebarPalette = Record<keyof (typeof TOKENS.colors.light)['sidebar'], string>;
type AvatarPalette = Record<keyof (typeof TOKENS.colors.light)['avatar'], string>;
type ChartPalette = Record<keyof (typeof TOKENS.colors.light)['chart'], string>;
type BadgePalette = Record<keyof (typeof TOKENS.colors.light)['badge'], string>;

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
  }
  interface PaletteOptions {
    sidebar?: SidebarPalette;
    avatar?: AvatarPalette;
    badge?: BadgePalette;
    chart?: ChartPalette;
  }
}

export const theme = createTheme({
  cssVariables: { colorSchemeSelector: 'class' },
  colorSchemes: {
    light: { palette: TOKENS.colors.light },
    dark: { palette: TOKENS.colors.dark },
  },
  breakpoints: { values: TOKENS.breakpoints },
  shape: { borderRadius: TOKENS.radius.sm },
  typography: muiTypography,
  components: {
    // The page reserves the scrollbar gutter (html { scrollbar-gutter: stable }), so MUI's
    // scroll lock would compensate twice and shift the page sideways when a menu/dialog opens.
    MuiModal: { defaultProps: { disableScrollLock: true } },
    // Popover (Menu, Select, Autocomplete lists) passes its own value to Modal, so set it here too.
    MuiPopover: { defaultProps: { disableScrollLock: true } },
    MuiTypography: { defaultProps: { variantMapping: { metric: 'p', tableHeader: 'span' } } },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { minHeight: 44 } },
    },
    MuiIconButton: {
      styleOverrides: { root: { minWidth: 44, minHeight: 44 } },
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
    MuiCard: {
      styleOverrides: { root: { borderRadius: TOKENS.radius.lg } },
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
