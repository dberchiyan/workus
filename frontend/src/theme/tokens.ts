/** The one source of colours, radii and breakpoints for MUI and Tailwind. */
export const TOKENS = {
  breakpoints: { xs: 0, sm: 600, md: 900, lg: 1200, xl: 1536 },
  radius: { sm: 8, md: 12, lg: 20 },
  layout: { sidebarWidth: 240, railWidth: 80, topBarHeight: 64 },
  colors: {
    light: {
      primary: { main: '#21697C', light: '#7CC4D6', dark: '#174C5A', contrastText: '#FFFFFF' },
      secondary: { main: '#1F3A4D', light: '#3D5A6E', dark: '#132532', contrastText: '#FFFFFF' },
      error: { main: '#B3261E', light: '#E46962', dark: '#8C1D18', contrastText: '#FFFFFF' },
      success: { main: '#1E7A46', light: '#E3F3E9', dark: '#145531', contrastText: '#FFFFFF' },
      background: { default: '#F5F6FA', paper: '#FFFFFF' },
      text: { primary: '#1F3A4D', secondary: '#4F6170', disabled: '#7A8A96' },
      divider: '#DCE3E8',
      badge: {
        activeBackground: '#DCEEF3',
        activeText: '#174C5A',
        neutralBackground: '#E8ECF0',
        neutralText: '#4F6170',
      },
      /** Blue, teal, violet, pink, amber, green, indigo, cyan — white initials ≥ 5:1 on each. */
      avatar: {
        c1: '#2F66A8',
        c2: '#17786F',
        c3: '#6B4FB3',
        c4: '#B23A72',
        c5: '#B45309',
        c6: '#2D7A4B',
        c7: '#4650B0',
        c8: '#126F8F',
        text: '#FFFFFF',
      },
      sidebar: {
        background: '#1F3A4D',
        text: '#C9D6DF',
        hover: '#294A5F',
        active: '#2E5268',
        activeText: '#FFFFFF',
        indicator: '#7CC4D6',
      },
    },
    dark: {
      primary: { main: '#7CC4D6', light: '#A9DAE6', dark: '#4E9FB3', contrastText: '#0D1B24' },
      secondary: { main: '#A9C3D3', light: '#CBDBE5', dark: '#7E9DB0', contrastText: '#0D1B24' },
      error: { main: '#F2B8B5', light: '#F9DEDC', dark: '#E46962', contrastText: '#3B0907' },
      success: { main: '#8BD3A6', light: '#173A27', dark: '#5FB383', contrastText: '#0B2416' },
      background: { default: '#0D1B24', paper: '#152936' },
      text: { primary: '#E6EEF2', secondary: '#AFC0CB', disabled: '#7F939F' },
      divider: '#2A4150',
      badge: {
        activeBackground: '#173844',
        activeText: '#A9DAE6',
        neutralBackground: '#1C2F3C',
        neutralText: '#AFC0CB',
      },
      avatar: {
        c1: '#2F66A8',
        c2: '#17786F',
        c3: '#6B4FB3',
        c4: '#B23A72',
        c5: '#B45309',
        c6: '#2D7A4B',
        c7: '#4650B0',
        c8: '#126F8F',
        text: '#FFFFFF',
      },
      sidebar: {
        background: '#09141B',
        text: '#AFC0CB',
        hover: '#132430',
        active: '#1B3342',
        activeText: '#E6EEF2',
        indicator: '#7CC4D6',
      },
    },
  },
} as const;

export type ColorScheme = keyof typeof TOKENS.colors;
