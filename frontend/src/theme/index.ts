import { createTheme } from '@mui/material/styles';
import type { CSSProperties } from 'react';
import { TOKENS } from './tokens';
import { muiTypography } from './typography';

type SidebarPalette = Record<keyof (typeof TOKENS.colors.light)['sidebar'], string>;
type AvatarPalette = Record<keyof (typeof TOKENS.colors.light)['avatar'], string>;
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
  }
  interface PaletteOptions {
    sidebar?: SidebarPalette;
    avatar?: AvatarPalette;
    badge?: BadgePalette;
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
