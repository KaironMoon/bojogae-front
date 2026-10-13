import { RouterProvider } from "react-router-dom";
import { CssBaseline } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";

import router from "@/routers";
import { AuthProvider } from "@/auth/AuthContext";
import ImpersonationBanner from "@/auth/ImpersonationBanner";
import { lightTheme } from "@/styles/theme";

function App() {
  return (
    <ThemeProvider theme={lightTheme}>
      <CssBaseline />
      <AuthProvider>
        <ImpersonationBanner />
        <RouterProvider router={router} />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
