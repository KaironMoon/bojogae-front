import { createTheme } from "@mui/material/styles";

export const darkTheme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "#000",
      paper: "#2d2d2d",
      header: "#2d2d2d",
      footer: "#2d2d2d",
      leftMenu: "#3a3a3a",
    },
    text: {
      primary: "#fff",
    },
  },
});

export const lightTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#4361ee",
      light: "#e8edff",
      dark: "#2f46bd",
    },
    background: {
      default: "#f6f8fc",
      paper: "#ffffff",
      header: "#ffffff",
      footer: "#ffffff",
      leftMenu: "#eef2f8",
    },
    text: {
      primary: "#333",
    },
  },
  typography: {
    fontFamily: 'Pretendard, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    button: {
      textTransform: "none",
    },
  },
  shape: {
    borderRadius: 12,
  },
});
