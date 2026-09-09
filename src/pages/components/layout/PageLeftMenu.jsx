import {
  Box,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import AnalyticsOutlinedIcon from "@mui/icons-material/AnalyticsOutlined";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "@/auth/AuthContext";


const PRIMARY_MENU = [
  { label: "Home", path: "/home", icon: HomeOutlinedIcon },
  { label: "Info", path: "/info", icon: InfoOutlinedIcon },
  { label: "문서 만들기", path: "/proposals", icon: DescriptionOutlinedIcon },
  { label: "내 정보", path: "/profile", icon: AccountCircleOutlinedIcon },
];

const ADMIN_MENU = [
  { label: "고객 관리", path: "/admin/users", icon: GroupOutlinedIcon },
  { label: "포인트 관리", path: "/admin/points", icon: AccountBalanceWalletOutlinedIcon },
  { label: "프롬프트 관리", path: "/admin/prompts", icon: AutoAwesomeOutlinedIcon },
  { label: "제안서 관리", path: "/admin/proposals", icon: DescriptionOutlinedIcon },
  { label: "사용량 / 통계", path: "/admin/usage", icon: AnalyticsOutlinedIcon },
  { label: "설정 및 서식", path: "/admin/proposal-settings", icon: TuneOutlinedIcon },
];

function PageLeftMenu({ onNavigate }) { // eslint-disable-line react/prop-types
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const isActive = (path) => (
    location.pathname === path || (path !== "/home" && location.pathname.startsWith(`${path}/`))
  );

  const renderMenuItem = ({ label, path, icon: Icon }) => {
    const active = isActive(path);
    return (
      <ListItem key={path} disablePadding sx={{ px: 1.25, mb: 0.35 }}>
        <ListItemButton
          selected={active}
          onClick={() => {
            navigate(path);
            onNavigate?.();
          }}
          sx={{
            minHeight: 42,
            px: 1.5,
            borderRadius: 1.5,
            color: active ? "primary.main" : "#526174",
            position: "relative",
            "&::after": active ? {
              content: '""',
              position: "absolute",
              right: -10,
              top: 7,
              bottom: 7,
              width: 3,
              borderRadius: "3px 0 0 3px",
              bgcolor: "primary.main",
            } : undefined,
            "&.Mui-selected": {
              bgcolor: "#eef4ff",
              color: "primary.main",
              "&:hover": { bgcolor: "#e5edff" },
            },
            "&:hover": { bgcolor: "#f6f8fc", color: "#1e293b" },
          }}
        >
          <ListItemIcon sx={{ minWidth: 34, color: "inherit" }}>
            <Icon sx={{ fontSize: 20 }} />
          </ListItemIcon>
          <ListItemText
            primary={label}
            primaryTypographyProps={{
              fontSize: 14,
              fontWeight: active ? 750 : 550,
              letterSpacing: "-0.01em",
            }}
          />
        </ListItemButton>
      </ListItem>
    );
  };

  return (
    <Box
      component="nav"
      aria-label="주요 메뉴"
      sx={{
        width: 224,
        minWidth: 224,
        height: "100%",
        minHeight: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: "#fff",
        borderRight: "1px solid #e5eaf1",
      }}
    >
      <List sx={{ pt: 2, pb: 1 }}>
        {PRIMARY_MENU.map(renderMenuItem)}
      </List>

      {user?.role === "ADMIN" && (
        <>
          <Divider sx={{ mx: 2, my: 1 }} />
          <Typography
            variant="caption"
            sx={{ px: 2.75, pt: 1.25, pb: 0.75, color: "#94a3b8", fontWeight: 800, letterSpacing: "0.08em" }}
          >
            MANAGEMENT
          </Typography>
          <List sx={{ py: 0 }}>
            {ADMIN_MENU.map(renderMenuItem)}
          </List>
        </>
      )}

      <Box sx={{ flex: 1 }} />
      <Box sx={{ px: 2, py: 1.75, borderTop: "1px solid #eef1f5", textAlign: "center" }}>
        <StackVersion />
      </Box>
    </Box>
  );
}

function StackVersion() {
  return (
    <>
      <StackedBrand />
      <Typography variant="caption" sx={{ color: "#94a3b8", fontSize: 10.5 }}>
        BOJOGAE AI Engine v2.5
      </Typography>
    </>
  );
}

function StackedBrand() {
  return (
    <Typography sx={{ color: "#64748b", fontSize: 11, fontWeight: 800, mb: 0.25 }}>
      BOJOGAE
    </Typography>
  );
}

export default PageLeftMenu;
