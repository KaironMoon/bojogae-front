import { Avatar, Box, Button, Chip, IconButton, Stack, Toolbar, Typography } from "@mui/material";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import { useTheme } from "@mui/material/styles";
import { Link as RouterLink, useNavigate } from "react-router-dom";

import { useAuth } from "@/auth/AuthContext";

function PageHeader({ onMenuClick }) { // eslint-disable-line react/prop-types
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    const returnTo = await logout();
    if (returnTo) window.location.assign(returnTo);
    else navigate("/", { replace: true });
  };

  return (
    <Toolbar
      sx={{
        minHeight: "56px !important",
        px: { xs: 2, md: 2.5 },
        backgroundColor: theme.palette.background.header,
        justifyContent: "space-between",
        borderBottom: "1px solid var(--bojogae-line)",
      }}
    >
      <Stack direction="row" spacing={1.25} alignItems="center">
        <IconButton
          edge="start"
          aria-label="메뉴 열기"
          onClick={onMenuClick}
          sx={{ display: { xs: "inline-flex", lg: "none" }, mr: 0.25 }}
        >
          <MenuRoundedIcon />
        </IconButton>
        <Stack
          component={RouterLink}
          to="/home"
          aria-label="보조개 홈으로 이동"
          direction="row"
          spacing={1.25}
          alignItems="center"
          sx={{
            color: "inherit",
            textDecoration: "none",
            borderRadius: 1,
            "&:focus-visible": { outline: "2px solid", outlineColor: "primary.main", outlineOffset: 4 },
          }}
        >
          <Box component="img" src="/bojogae-icon.png" alt="" sx={{ width: 32, height: 32, borderRadius: "8px", display: "block" }} />
          <Typography variant="h6" component="span" sx={{ color: "primary.dark", fontWeight: 900, letterSpacing: "-0.03em" }}>
            BOJOGAE
          </Typography>
        </Stack>
        <Chip label="GA PRO Edition" size="small" sx={{ display: { xs: "none", sm: "inline-flex" }, height: 22, bgcolor: "var(--bojogae-tint)", color: "var(--bojogae-accent-ink)", fontSize: 10.5, fontWeight: 750 }} />
      </Stack>
      <Stack direction="row" spacing={{ xs: 0.5, sm: 1.5 }} alignItems="center">
        <Stack direction="row" spacing={0.8} alignItems="center">
          <Avatar sx={{ width: 28, height: 28, bgcolor: "var(--bojogae-tint)", color: "var(--bojogae-accent-ink)", fontSize: 10, fontWeight: 800 }}>
            {user?.role === "ADMIN" ? "AD" : "GA"}
          </Avatar>
          <Typography variant="body2" color="text.primary" sx={{ display: { xs: "none", sm: "block" }, fontWeight: 650 }}>
            {user?.display_name}
          </Typography>
        </Stack>
        <Button
          size="small"
          color="inherit"
          onClick={handleLogout}
          startIcon={<LogoutRoundedIcon />}
          sx={{ color: "text.secondary", minWidth: { xs: 40, sm: 64 }, px: { xs: 1, sm: 1.5 }, "& .MuiButton-startIcon": { mr: { xs: 0, sm: 0.5 } } }}
        >
          <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>로그아웃</Box>
        </Button>
      </Stack>
    </Toolbar>
  );
}

export default PageHeader;
