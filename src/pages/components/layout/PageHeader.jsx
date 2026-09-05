import { Avatar, Box, Button, Chip, Stack, Toolbar, Typography } from "@mui/material";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import { useTheme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/auth/AuthContext";

function PageHeader() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  return (
    <Toolbar
      sx={{
        minHeight: "56px !important",
        px: { xs: 2, md: 2.5 },
        backgroundColor: theme.palette.background.header,
        justifyContent: "space-between",
        borderBottom: "1px solid #e5eaf1",
      }}
    >
      <Stack direction="row" spacing={1.25} alignItems="center">
        <Box sx={{ width: 32, height: 32, borderRadius: "8px", bgcolor: "#2563eb", color: "white", display: "grid", placeItems: "center", fontWeight: 900 }}>
          B
        </Box>
        <Typography variant="h6" component="div" sx={{ color: theme.palette.text.primary, fontWeight: 900, letterSpacing: "-0.03em" }}>
          BOJOGE
        </Typography>
        <Chip label="GA PRO Edition" size="small" sx={{ display: { xs: "none", sm: "inline-flex" }, height: 22, bgcolor: "#dbeafe", color: "#1e40af", fontSize: 10.5, fontWeight: 750 }} />
      </Stack>
      <Stack direction="row" spacing={{ xs: 0.5, sm: 1.5 }} alignItems="center">
        <Stack direction="row" spacing={0.8} alignItems="center">
          <Avatar sx={{ width: 28, height: 28, bgcolor: "#dbeafe", color: "#1d4ed8", fontSize: 10, fontWeight: 800 }}>
            {user?.role === "ADMIN" ? "AD" : "GA"}
          </Avatar>
          <Typography variant="body2" color="text.primary" sx={{ display: { xs: "none", sm: "block" }, fontWeight: 650 }}>
            {user?.display_name}
          </Typography>
        </Stack>
        <Button size="small" color="inherit" onClick={handleLogout} startIcon={<LogoutRoundedIcon />} sx={{ color: "text.secondary" }}>
          로그아웃
        </Button>
      </Stack>
    </Toolbar>
  );
}

export default PageHeader;
