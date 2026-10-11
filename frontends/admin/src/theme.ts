import { experimental_extendTheme as extendTheme } from '@mui/material/styles';

/**
 * Molley palette, adapted to MUI.
 *
 * Source of truth: molley/frontends/user/src/styles (element/index.scss for
 * the light palette, element/dark.scss for dark, app/font.scss for type).
 * Element Plus and MUI name things differently, so the mapping is:
 *
 *   el primary / accent          → palette.primary / palette.secondary
 *   el success|warning|danger|info → the same MUI keys (danger → error)
 *   el text-primary|secondary    → text.primary|secondary (text-regular → body copy)
 *   el bg-color / bg-color-page  → background.paper / background.default
 *   el border-color(-light)      → divider and outlined borders
 */
export const molleyColors = {
  primary: '#019cca', // calmer cyan
  accent: '#f2206b', // complementary pink accent
  success: '#6bb172',
  warning: '#fea807',
  danger: '#f2206b',
  info: '#a978c9',
  light: {
    textPrimary: '#23323e',
    textRegular: '#435768',
    textSecondary: '#657986',
    page: '#f2f3f5',
    surface: '#ffffff',
    border: '#a8c8d8',
    borderLight: '#bdd5e0',
  },
  dark: {
    textPrimary: '#dce5ec',
    textRegular: '#a1bbc9',
    textSecondary: '#8397a6',
    page: '#151820',
    surface: '#1a1f2a',
    hover: '#212836',
    fill: '#242936',
    border: '#2d3341',
    borderLight: '#363d4d',
    borderLighter: '#404857',
  },
};

// Molley cards lift on hover with a warm tint (element/overrides/el-card.scss).
const cardHoverShadow = {
  light: '0 2px 12px 0 rgba(211, 149, 100, 0.3), 0 0 0 1px rgba(211, 149, 100, 0.1)',
  dark: '0 2px 12px 0 rgba(211, 149, 100, 0.4), 0 0 0 1px rgba(211, 149, 100, 0.15)',
};

export const fontFamilyPrimary = [
  'Inter',
  '-apple-system',
  'BlinkMacSystemFont',
  '"Segoe UI"',
  'Roboto',
  'Oxygen',
  'Ubuntu',
  'Cantarell',
  'sans-serif',
].join(',');

export const fontFamilyMono = ['"IBM Plex Mono"', 'monospace'].join(',');

const statusPalette = {
  secondary: { main: molleyColors.accent, contrastText: '#ffffff' },
  success: { main: molleyColors.success, contrastText: '#ffffff' },
  warning: { main: molleyColors.warning, contrastText: molleyColors.light.textPrimary },
  error: { main: molleyColors.danger, contrastText: '#ffffff' },
  info: { main: molleyColors.info, contrastText: '#ffffff' },
};

const theme = extendTheme({
  colorSchemes: {
    light: {
      palette: {
        primary: { main: molleyColors.primary, contrastText: '#ffffff' },
        ...statusPalette,
        background: {
          default: molleyColors.light.page,
          paper: molleyColors.light.surface,
        },
        text: {
          primary: molleyColors.light.textPrimary,
          secondary: molleyColors.light.textSecondary,
        },
        divider: molleyColors.light.borderLight,
      },
    },
    dark: {
      palette: {
        primary: { main: molleyColors.primary, contrastText: '#ffffff' },
        ...statusPalette,
        background: {
          default: molleyColors.dark.page,
          paper: molleyColors.dark.surface,
        },
        text: {
          primary: molleyColors.dark.textPrimary,
          secondary: molleyColors.dark.textSecondary,
        },
        divider: molleyColors.dark.border,
        action: {
          hover: molleyColors.dark.hover,
          selected: molleyColors.dark.fill,
        },
      },
    },
  },
  typography: {
    fontFamily: fontFamilyPrimary,
    // Element base size is 14px on a 16px root; MUI's default fontSize of 14 matches.
    fontSize: 14,
    h1: { fontWeight: 700, letterSpacing: '-0.02em' },
    h2: { fontWeight: 700, letterSpacing: '-0.01em' },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    body1: { color: 'var(--mui-palette-text-primary)' },
    button: { textTransform: 'none', fontWeight: 500 },
  },
  shape: {
    // Element base radius
    borderRadius: 4,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        html: { WebkitFontSmoothing: 'antialiased', MozOsxFontSmoothing: 'grayscale' },
        'code, kbd, pre, samp': { fontFamily: fontFamilyMono },
      },
    },
    MuiButtonBase: {
      defaultProps: {
        disableRipple: true,
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          padding: '8px 16px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundColor: theme.vars.palette.background.paper,
          color: theme.vars.palette.text.primary,
          boxShadow: 'none',
          borderBottom: `1px solid ${theme.vars.palette.divider}`,
        }),
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: ({ theme }) => ({
          backgroundColor: theme.vars.palette.background.paper,
          color: theme.vars.palette.text.primary,
          borderRight: `1px solid ${theme.vars.palette.divider}`,
        }),
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundImage: 'none',
          border: `1px solid ${theme.vars.palette.divider}`,
          boxShadow: 'none',
        }),
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          transition: 'box-shadow 0.3s ease-in-out',
          '&:hover': {
            boxShadow: cardHoverShadow.light,
          },
          // CssVarsProvider stamps the active scheme on <html>
          '[data-mui-color-scheme="dark"] &:hover': {
            boxShadow: cardHoverShadow.dark,
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderBottom: `1px solid ${theme.vars.palette.divider}`,
        }),
        head: ({ theme }) => ({
          fontWeight: 600,
          color: theme.vars.palette.text.secondary,
          backgroundColor: theme.vars.palette.background.default,
        }),
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
          // Element tags are square-ish
          borderRadius: 4,
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          '&.Mui-selected': {
            color: theme.vars.palette.primary.main,
          },
        }),
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundColor: theme.vars.palette.primary.main,
          color: theme.vars.palette.primary.contrastText,
          fontWeight: 500,
        }),
      },
    },
  },
});

export default theme;
