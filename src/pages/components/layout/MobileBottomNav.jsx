/* eslint-disable react/prop-types */
import { BottomNavigation, BottomNavigationAction, Paper } from "@mui/material";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import { useLocation, useNavigate } from "react-router-dom";

function resolveActiveTab(pathname) {
  if (pathname === "/home") return "home";
  if (pathname.startsWith("/proposals")) return "proposals";
  if (pathname.startsWith("/crm")) return "crm";
  if (pathname.startsWith("/claims")) return "claims";
  return "";
}

export default function MobileBottomNav({ onOpenMenu, menuOpen = false, hidden = false }) {
  const navigate = useNavigate();
  const location = useLocation();

  if (hidden) return null;

  const activeValue = menuOpen ? "menu" : resolveActiveTab(location.pathname);

  const handleChange = (_event, nextValue) => {
    if (nextValue === "menu") {
      onOpenMenu?.();
      return;
    }
    const routeMap = {
      home: "/home",
      proposals: "/proposals",
      crm: "/crm/customers",
      claims: "/claims/new",
    };
    const target = routeMap[nextValue];
    if (target) {
      navigate(target);
    }
  };

  return (
    <Paper
      elevation={8}
      component="nav"
      aria-label="모바일 빠른 메뉴"
      sx={{
        display: { xs: "block", md: "none" },
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: (theme) => theme.zIndex.appBar,
        borderTop: "1px solid #e2e8f0",
        bgcolor: "rgba(255, 255, 255, 0.96)",
        backdropFilter: "blur(10px)",
        pb: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <BottomNavigation
        showLabels
        value={activeValue}
        onChange={handleChange}
        sx={{
          height: 60,
          bgcolor: "transparent",
          "& .MuiBottomNavigationAction-root": {
            minWidth: 0,
            px: 0.5,
            py: 0.75,
            color: "#64748b",
            "&.Mui-selected": {
              color: "#03C75A",
            },
          },
          "& .MuiBottomNavigationAction-label": {
            fontSize: "0.7rem",
            fontWeight: 700,
            mt: 0.25,
            "&.Mui-selected": {
              fontSize: "0.72rem",
              fontWeight: 800,
            },
          },
        }}
      >
        <BottomNavigationAction value="home" label="홈" icon={<HomeRoundedIcon fontSize="small" />} />
        <BottomNavigationAction value="proposals" label="보고서" icon={<AutoAwesomeRoundedIcon fontSize="small" />} />
        <BottomNavigationAction value="crm" label="고객" icon={<PeopleAltRoundedIcon fontSize="small" />} />
        <BottomNavigationAction value="claims" label="청구" icon={<ReceiptLongRoundedIcon fontSize="small" />} />
        <BottomNavigationAction value="menu" label="전체메뉴" icon={<MenuRoundedIcon fontSize="small" />} />
      </BottomNavigation>
    </Paper>
  );
}
