import { createTheme } from '@mui/material/styles';
import { TOKENS } from './tokens';
import { muiTypography } from './typography';

type SidebarPalette = Record<keyof (typeof TOKENS.colors.light)['sidebar'], string>;

declare module '@mui/material/styles' {
  interface Palette {
    sidebar: SidebarPalette;
  }
  interface PaletteOptions {
    sidebar?: SidebarPalette;
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
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { minHeight: 44 } },
    },
    MuiIconButton: {
      styleOverrides: { root: { minWidth: 44, minHeight: 44 } },
    },
    MuiCard: {
      styleOverrides: { root: { borderRadius: TOKENS.radius.lg } },
    },
  },
});

export { typographyGlobalStyles } from './typography';
export { TOKENS } from './tokens';
