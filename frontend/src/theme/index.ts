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
