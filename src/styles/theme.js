import { createTheme } from "@mui/material/styles";
import { brand, brandCssVariables } from "./palette";

const typography = {
  fontFamily: 'Pretendard, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  button: { textTransform: "none", fontWeight: 700 },
};

export const darkTheme = createTheme({
  typography,
  palette: {
    mode: "dark",
    primary: { main: brand.accent, contrastText: brand.ink },
    background: {
      default: "#241F1D",
      paper: "#352F2D",
      header: "#352F2D",
      footer: "#352F2D",
      leftMenu: "#2D2724",
    },
    text: {
      primary: "#FBF8F5",
      secondary: "#D6C5BB",
    },
    divider: "#53453E",
  },
});

export const lightTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: brand.accent,
      light: brand.tint,
      dark: brand.accentInk,
      contrastText: brand.ink,
    },
    background: {
      default: brand.canvas,
      paper: "#ffffff",
      header: "#ffffff",
      footer: brand.canvas,
      leftMenu: "#ffffff",
    },
    text: {
      primary: brand.ink,
      secondary: brand.muted,
      disabled: "#9C8D85",
    },
    divider: brand.line,
    action: {
      hover: "rgba(232, 128, 104, 0.06)",
      selected: "rgba(232, 128, 104, 0.12)",
      focus: "rgba(155, 69, 50, 0.14)",
      disabledBackground: brand.disabled,
    },
  },
  typography,
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        ":root": brandCssVariables,
        "::selection": { backgroundColor: brand.tintHover, color: brand.ink },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 10 },
        containedPrimary: {
          color: brand.ink,
          "&:hover": { backgroundColor: brand.accentHover },
        },
        textPrimary: { color: brand.accentInk },
        outlinedPrimary: {
          color: brand.accentInk, borderColor: brand.accent,
          "&:hover": { backgroundColor: brand.tint, borderColor: brand.accentInk },
        },
      },
    },
    MuiLink: { defaultProps: { color: "primary.dark" } },
    MuiTab: { styleOverrides: { root: { "&.Mui-selected": { color: brand.accentInk } } } },
    MuiTabs: { styleOverrides: { indicator: { backgroundColor: brand.accentInk } } },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: brand.accentInk } },
        notchedOutline: { borderColor: brand.line },
      },
    },
    MuiInputLabel: { styleOverrides: { root: { "&.Mui-focused": { color: brand.accentInk } } } },
    MuiCheckbox: { styleOverrides: { colorPrimary: { "&.Mui-checked, &.MuiCheckbox-indeterminate": { color: brand.accentInk } } } },
    MuiRadio: { styleOverrides: { colorPrimary: { "&.Mui-checked": { color: brand.accentInk } } } },
    MuiCircularProgress: { styleOverrides: { colorPrimary: { color: brand.accentInk } } },
    MuiPaper: { styleOverrides: { outlined: { borderColor: brand.line } } },
  },
});
