/**
 * The one source of colours, radii and breakpoints for MUI and Tailwind. Colours are OKLCH
 * (perceptually even steps; MUI reads them natively — `nativeColor` in theme/index.ts).
 */
export const TOKENS = {
  breakpoints: { xs: 0, sm: 600, md: 900, lg: 1200, xl: 1536 },
  /** Controls (inputs, buttons, chips) · menus and popovers · cards and dialogs. */
  radius: { sm: 8, md: 12, lg: 16 },
  layout: { sidebarWidth: 240, railWidth: 80, topBarHeight: 64 },
  /** Max content widths (Tailwind `max-w-*`). `page` = every signed-in page (set once in AppLayout). */
  containers: { page: 1536 },
  colors: {
    light: {
      primary: {
        main: 'oklch(48.5% 0.075 219.1)',
        light: 'oklch(77.9% 0.076 215.4)',
        dark: 'oklch(38.9% 0.059 218.9)',
        contrastText: 'oklch(100.0% 0.000 0)',
      },
      secondary: {
        main: 'oklch(33.6% 0.047 240.8)',
        light: 'oklch(45.3% 0.048 239.3)',
        dark: 'oklch(25.5% 0.034 241.3)',
        contrastText: 'oklch(100.0% 0.000 0)',
      },
      error: {
        main: 'oklch(50.1% 0.178 28.7)',
        light: 'oklch(66.8% 0.155 25.4)',
        dark: 'oklch(42.0% 0.147 28.1)',
        contrastText: 'oklch(100.0% 0.000 0)',
      },
      success: {
        main: 'oklch(51.4% 0.117 153.6)',
        light: 'oklch(94.9% 0.021 158.6)',
        dark: 'oklch(39.9% 0.088 154.4)',
        contrastText: 'oklch(100.0% 0.000 0)',
      },
      background: { default: 'oklch(97.4% 0.005 275.0)', paper: 'oklch(100.0% 0.000 0)' },
      text: {
        primary: 'oklch(33.6% 0.047 240.8)',
        secondary: 'oklch(48.3% 0.033 243.6)',
        disabled: 'oklch(62.5% 0.026 240.3)',
      },
      divider: 'oklch(93.2% 0.009 236)',
      /** Shadow colours: `soft` for the contact shadow, `strong` for the ambient one. */
      shadow: { soft: 'oklch(30% 0.04 240 / 0.06)', strong: 'oklch(30% 0.04 240 / 0.12)' },
      badge: {
        activeBackground: 'oklch(93.7% 0.020 216.2)',
        activeText: 'oklch(38.9% 0.059 218.9)',
        neutralBackground: 'oklch(94.1% 0.007 247.9)',
        neutralText: 'oklch(48.3% 0.033 243.6)',
      },
      /** Blue, teal, violet, pink, amber, green, indigo, cyan — white initials ≥ 5:1 on each. */
      avatar: {
        c1: 'oklch(50.7% 0.120 254.6)',
        c2: 'oklch(51.8% 0.085 185.3)',
        c3: 'oklch(50.8% 0.152 293.1)',
        c4: 'oklch(53.7% 0.164 355.3)',
        c5: 'oklch(55.5% 0.146 49.0)',
        c6: 'oklch(51.9% 0.106 153.5)',
        c7: 'oklch(47.7% 0.151 274.6)',
        c8: 'oklch(50.7% 0.094 227.8)',
        text: 'oklch(100.0% 0.000 0)',
      },
      /**
       * Chart series in fixed order — validated categorical palette (CVD ΔE ≥ 8 between neighbours);
       * slots 3–5 sit under 3:1 on white, so charts carry labels, a legend and a table view.
       */
      chart: {
        c1: 'oklch(57.5% 0.163 255.5)',
        c2: 'oklch(67.1% 0.175 40.6)',
        c3: 'oklch(66.9% 0.141 162.1)',
        c4: 'oklch(76.4% 0.161 75.1)',
        c5: 'oklch(71.6% 0.141 357.4)',
        c6: 'oklch(52.9% 0.180 142.5)',
        c7: 'oklch(43.3% 0.167 283.6)',
        c8: 'oklch(62.3% 0.191 24.9)',
      },
      /** Light sidebar in the paper colour: a hairline apart, the active item a soft primary pill. */
      sidebar: {
        background: 'oklch(100.0% 0.000 0)',
        text: 'oklch(48.3% 0.033 243.6)',
        hover: 'oklch(96.6% 0.006 240.0)',
        active: 'oklch(93.7% 0.020 216.2)',
        activeText: 'oklch(38.9% 0.059 218.9)',
        indicator: 'oklch(48.5% 0.075 219.1)',
        border: 'oklch(93.2% 0.009 236)',
        title: 'oklch(33.6% 0.047 240.8)',
      },
    },
    dark: {
      primary: {
        main: 'oklch(77.9% 0.076 215.4)',
        light: 'oklch(85.8% 0.053 214.4)',
        dark: 'oklch(66.0% 0.084 216.1)',
        contrastText: 'oklch(21.4% 0.026 238.0)',
      },
      secondary: {
        main: 'oklch(80.3% 0.036 234.9)',
        light: 'oklch(88.2% 0.022 235.0)',
        dark: 'oklch(67.9% 0.044 235.2)',
        contrastText: 'oklch(21.4% 0.026 238.0)',
      },
      error: {
        main: 'oklch(83.4% 0.068 22.0)',
        light: 'oklch(92.2% 0.030 22.8)',
        dark: 'oklch(66.8% 0.155 25.4)',
        contrastText: 'oklch(23.4% 0.078 27.6)',
      },
      success: {
        main: 'oklch(80.7% 0.097 156.1)',
        light: 'oklch(31.6% 0.054 157.5)',
        dark: 'oklch(70.1% 0.109 157.0)',
        contrastText: 'oklch(23.6% 0.041 156.6)',
      },
      background: { default: 'oklch(21.4% 0.026 238.0)', paper: 'oklch(27.0% 0.036 238.5)' },
      text: {
        primary: 'oklch(94.4% 0.010 228.9)',
        secondary: 'oklch(79.8% 0.024 236.1)',
        disabled: 'oklch(65.2% 0.029 234.2)',
      },
      divider: 'oklch(36.3% 0.039 237.8)',
      shadow: { soft: 'oklch(0% 0 0 / 0.3)', strong: 'oklch(0% 0 0 / 0.5)' },
      badge: {
        activeBackground: 'oklch(32.2% 0.044 224.6)',
        activeText: 'oklch(85.8% 0.053 214.4)',
        neutralBackground: 'oklch(29.5% 0.034 239.4)',
        neutralText: 'oklch(79.8% 0.024 236.1)',
      },
      avatar: {
        c1: 'oklch(50.7% 0.120 254.6)',
        c2: 'oklch(51.8% 0.085 185.3)',
        c3: 'oklch(50.8% 0.152 293.1)',
        c4: 'oklch(53.7% 0.164 355.3)',
        c5: 'oklch(55.5% 0.146 49.0)',
        c6: 'oklch(51.9% 0.106 153.5)',
        c7: 'oklch(47.7% 0.151 274.6)',
        c8: 'oklch(50.7% 0.094 227.8)',
        text: 'oklch(100.0% 0.000 0)',
      },
      chart: {
        c1: 'oklch(62.2% 0.161 255.1)',
        c2: 'oklch(62.2% 0.173 40.1)',
        c3: 'oklch(62.1% 0.128 163.1)',
        c4: 'oklch(67.0% 0.143 73.2)',
        c5: 'oklch(62.2% 0.171 0.8)',
        c6: 'oklch(52.9% 0.180 142.5)',
        c7: 'oklch(67.0% 0.145 286.8)',
        c8: 'oklch(66.9% 0.159 22.3)',
      },
      sidebar: {
        background: 'oklch(18.4% 0.022 237.4)',
        text: 'oklch(79.8% 0.024 236.1)',
        hover: 'oklch(25.1% 0.032 240.5)',
        active: 'oklch(30.9% 0.040 237.5)',
        activeText: 'oklch(94.4% 0.010 228.9)',
        indicator: 'oklch(77.9% 0.076 215.4)',
        border: 'oklch(25.1% 0.032 240.5)',
        title: 'oklch(94.4% 0.010 228.9)',
      },
    },
  },
} as const;

export type ColorScheme = keyof typeof TOKENS.colors;
