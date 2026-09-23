import { Box, Typography, Link } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Link as RouterLink } from "react-router-dom";

function PageFooter() {
  const theme = useTheme();

  return (
    <Box
      sx={{
        py: 2,
        px: { xs: 2, sm: 3 },
        backgroundColor: theme.palette.background.footer,
        color: theme.palette.text.primary,
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          gap: 1.25,
        }}
      >
        <Typography variant="body2">© {new Date().getFullYear()} BOJOGAE. All rights reserved.</Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: { xs: 1.5, sm: 2 } }}>
          <Link component={RouterLink} to="/privacy" color="inherit" underline="hover" sx={{ whiteSpace: "nowrap" }}>
            개인정보처리방침
          </Link>
          <Link component={RouterLink} to="/terms" color="inherit" underline="hover" sx={{ whiteSpace: "nowrap" }}>
            서비스이용약관
          </Link>
          <Link href="#" color="inherit" underline="hover" sx={{ whiteSpace: "nowrap" }}>
            Contact Us
          </Link>
        </Box>
      </Box>
    </Box>
  );
}

export default PageFooter;
