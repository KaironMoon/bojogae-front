import { Avatar, Box, Button, Chip, IconButton, InputBase, Stack, Toolbar, Typography } from "@mui/material";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { useTheme } from "@mui/material/styles";
import { useEffect, useState } from "react";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "@/auth/AuthContext";

function PageHeader({ onMenuClick }) { // eslint-disable-line react/prop-types
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const currentQuery = new URLSearchParams(location.search).get("promptQuery") || "";
  const [query, setQuery] = useState(currentQuery);
  useEffect(() => setQuery(currentQuery), [currentQuery, location.pathname]);

  function searchPrompts(event) {
    event.preventDefault();
    const term = query.trim();
    navigate({ pathname: "/proposals", search: term ? new URLSearchParams({ promptQuery: term }).toString() : "" });
  }

  const handleLogout = async () => {
    const returnTo = await logout();
    if (returnTo) window.location.assign(returnTo);
    else navigate("/", { replace: true });
  };

  return (
    <Toolbar
      sx={{
        minHeight: { xs: "104px !important", md: "64px !important" },
        px: { xs: 1.5, sm: 2, lg: 3 },
        py: { xs: 1, md: 0 },
        display: "grid",
        gridTemplateColumns: { xs: "minmax(0, 1fr) auto", md: "auto minmax(0, 1fr) auto" },
        columnGap: { xs: 1, md: 2 },
        rowGap: 0.75,
        backgroundColor: theme.palette.background.header,
      }}
    >
      <Stack direction="row" spacing={1.25} alignItems="center">
        <IconButton
          edge="start"
          aria-label="메뉴 열기"
          onClick={onMenuClick}
          sx={{ display: { xs: "inline-flex", lg: "none" }, mr: 0.25, borderRadius: "12px", bgcolor: "background.default" }}
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
          <Box component="img" src="/bojogae-icon.png" alt="" sx={{ width: { xs: 32, sm: 36 }, height: { xs: 32, sm: 36 }, borderRadius: "14px", display: "block" }} />
          <Typography variant="h6" component="span" sx={{ color: "text.primary", fontWeight: 900, letterSpacing: "-0.025em" }}>
            BOJOGAE
          </Typography>
        </Stack>
        <Chip label="GA PRO Edition" size="small" sx={{ display: { xs: "none", sm: "inline-flex" }, height: 22, bgcolor: "#F5F3FF", color: "#5B21B6", border: "1px solid #DDD1FF", fontSize: 11, fontWeight: 800 }} />
      </Stack>
      <Box component="form" role="search" aria-label="프롬프트 검색" onSubmit={searchPrompts} sx={{
        gridColumn: { xs: "1 / -1", md: 2 }, gridRow: { xs: 2, md: 1 }, width: "100%", maxWidth: 576, mx: "auto",
        display: "flex", alignItems: "center", gap: 0.75, pl: 1.5, pr: 0.5, minHeight: 38,
        border: "2px solid #03C75A", borderRadius: 99, bgcolor: "background.paper",
        "&:focus-within": { boxShadow: "0 0 0 4px #D1FAE5" },
      }}>
        <Box component="span" sx={{ px: 0.9, py: 0.25, borderRadius: 99, bgcolor: "#6B38FB", color: "white", fontSize: 10, fontWeight: 850, whiteSpace: "nowrap" }}>프롬프트</Box>
        <InputBase value={query} onChange={(event) => setQuery(event.target.value)} placeholder="프롬프트 검색"
          inputProps={{ "aria-label": "프롬프트 검색어", maxLength: 100 }} sx={{ flex: 1, minWidth: 0, fontSize: 12 }} />
        <IconButton type="submit" aria-label="프롬프트 검색 실행" size="small" sx={{ bgcolor: "primary.main", color: "primary.contrastText", "&:hover": { bgcolor: "#00A84B" } }}>
          <SearchRoundedIcon sx={{ fontSize: 17 }} />
        </IconButton>
      </Box>
      <Stack direction="row" spacing={{ xs: 0.5, sm: 1.5 }} alignItems="center" sx={{ gridColumn: { xs: 2, md: 3 }, gridRow: 1, justifySelf: "end" }}>
        <Stack direction="row" spacing={0.8} alignItems="center">
          <Avatar sx={{ width: 28, height: 28, bgcolor: "#121314", color: "white", fontSize: 10, fontWeight: 850 }}>
            {user?.role === "ADMIN" ? "AD" : "GA"}
          </Avatar>
          <Typography variant="body2" color="text.primary" sx={{ display: { xs: "none", sm: "block" }, fontWeight: 650 }}>
            {user?.display_name}
          </Typography>
        </Stack>
        <Button
          size="small"
          aria-label="로그아웃"
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
