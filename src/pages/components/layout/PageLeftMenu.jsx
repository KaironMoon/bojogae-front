import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import {
  Box,
  Button,
  Collapse,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
} from "@mui/material";
import AnalyticsOutlinedIcon from "@mui/icons-material/AnalyticsOutlined";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import ContactPhoneOutlinedIcon from "@mui/icons-material/ContactPhoneOutlined";
import EditNoteRoundedIcon from "@mui/icons-material/EditNoteRounded";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import HelpOutlineOutlinedIcon from "@mui/icons-material/HelpOutlineOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import LibraryBooksOutlinedIcon from "@mui/icons-material/LibraryBooksOutlined";
import NewspaperOutlinedIcon from "@mui/icons-material/NewspaperOutlined";
import ReplayRoundedIcon from "@mui/icons-material/ReplayRounded";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";
import ViewCarouselOutlinedIcon from "@mui/icons-material/ViewCarouselOutlined";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "@/auth/AuthContext";
import { planName } from "@/constants/plans";
import {
  isChildEligibleForUser,
  isMenuEligibleForUser,
} from "@/services/user-menu-config";
import {
  getCachedUserMenu,
  getUserMenu,
  subscribeUserMenuChanges,
} from "@/services/user-menu-service";
import { reportHero, reportHeroBadge, reportHeroIcon } from "@/styles/reportTheme";

import { MenuBadge, MenuIcon } from "./userMenuIcons";

const ADMIN_POINT_MENU = [
  { label: "꼬막 지급·회수·내역", path: "/admin/points" },
  { label: "결제·환불 처리", path: "/admin/payment-support" },
];

const ADMIN_MENU = [
  { label: "조직 관리", path: "/admin/groups", icon: GroupOutlinedIcon },
  { label: "설계사 관리", path: "/admin/users", icon: GroupOutlinedIcon },
  { label: "꼬막 관리", items: ADMIN_POINT_MENU, icon: AccountBalanceWalletOutlinedIcon, tone: "amber" },
  { label: "예약결제 목록", path: "/admin/payment-reservations", icon: AccountBalanceWalletOutlinedIcon },
  { label: "프롬프트 관리", path: "/admin/prompts", icon: AutoAwesomeOutlinedIcon },
  { label: "보고서 관리", path: "/admin/proposals", icon: LibraryBooksOutlinedIcon, tone: "indigo" },
  { label: "환불 요청 관리", path: "/admin/refund-requests", icon: ReplayRoundedIcon, tone: "rose" },
  { label: "보고서 개선 건의 관리", path: "/admin/document-suggestions", icon: EditNoteRoundedIcon, tone: "purple" },
  { label: "사용량 / 통계", path: "/admin/usage", icon: AnalyticsOutlinedIcon },
  { label: "설정 및 서식", path: "/admin/proposal-settings", icon: TuneOutlinedIcon },
  { label: "메인 배너 관리", path: "/admin/dashboard-banners", icon: ViewCarouselOutlinedIcon },
  { label: "보험사 정보 관리", path: "/admin/insurers", icon: ContactPhoneOutlinedIcon },
  { label: "단체 문의 관리", path: "/admin/group-inquiries", icon: ContactPhoneOutlinedIcon },
];

const ADMIN_BOARD_MENU = [
  { label: "공지사항 관리", path: "/admin/boards/notices", icon: CampaignOutlinedIcon },
  { label: "업계소식 관리", path: "/admin/boards/industry-news", icon: NewspaperOutlinedIcon },
  { label: "보험 지식 관리", path: "/admin/boards/insurance-knowledge", icon: SchoolOutlinedIcon },
];

function pathMatches(pathname, targetPath) {
  return pathname === targetPath || (targetPath !== "/home" && pathname.startsWith(`${targetPath}/`));
}

function isGroupRouteActive(pathname, item) {
  if (item.prefix && pathname.startsWith(item.prefix)) return true;
  if (item.key === "requests" && pathname.startsWith("/proposals/")) return true;
  if (item.key === "profile" && pathname.startsWith("/my-coins")) return true;
  return (item.children || []).some((child) => pathMatches(pathname, child.path));
}

function PageLeftMenu({ onNavigate }) { // eslint-disable-line react/prop-types
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [userMenuItems, setUserMenuItems] = useState(() => getCachedUserMenu());
  const [openGroups, setOpenGroups] = useState(() => {
    const initial = {};
    for (const item of getCachedUserMenu()) {
      const hasChildren = item.kind === "group" || (item.children || []).length > 0;
      if (hasChildren && isGroupRouteActive(location.pathname, item)) {
        initial[item.key] = true;
      }
    }
    return initial;
  });
  const [adminBoardsOpen, setAdminBoardsOpen] = useState(location.pathname.startsWith("/admin/boards/"));
  const [adminPointsOpen, setAdminPointsOpen] = useState(ADMIN_POINT_MENU.some((item) => location.pathname === item.path));

  useEffect(() => {
    let active = true;
    getUserMenu()
      .then((items) => {
        if (active) setUserMenuItems(items);
      })
      .catch(() => {});
    const unsubscribe = subscribeUserMenuChanges((items) => {
      if (active) setUserMenuItems(items);
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    setOpenGroups((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const item of userMenuItems) {
        const hasChildren = item.kind === "group" || (item.children || []).length > 0;
        if (hasChildren && isGroupRouteActive(location.pathname, item) && !next[item.key]) {
          next[item.key] = true;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
    if (location.pathname.startsWith("/admin/boards/")) setAdminBoardsOpen(true);
    if (ADMIN_POINT_MENU.some((item) => location.pathname === item.path)) setAdminPointsOpen(true);
  }, [location.pathname, userMenuItems]);

  const isActive = (path) => pathMatches(location.pathname, path);

  const renderMenuItem = ({ key, label, path, icon, icon_key: iconKey, tone, badge }) => {
    const active = isActive(path);
    return (
      <ListItem key={key || path} disablePadding sx={{ px: 1.25, mb: 0.35 }}>
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
            color: active ? "primary.dark" : "var(--bojogae-muted)",
            position: "relative",
            "&::after": active ? {
              content: '""',
              position: "absolute",
              right: -10,
              top: 7,
              bottom: 7,
              width: 3,
              borderRadius: "3px 0 0 3px",
              bgcolor: "primary.dark",
            } : undefined,
            "&.Mui-selected": {
              bgcolor: "var(--bojogae-tint)",
              color: "primary.dark",
              "&:hover": { bgcolor: "var(--bojogae-tint-hover)" },
            },
            "&:hover": { bgcolor: "var(--bojogae-canvas)", color: "var(--bojogae-ink)" },
          }}
        >
          <MenuIcon icon={icon} iconKey={iconKey} tone={tone} />
          <ListItemText
            primary={label}
            sx={{ minWidth: 0, mr: badge ? 0.75 : 0 }}
            primaryTypographyProps={{
              fontSize: 14,
              fontWeight: active ? 750 : 550,
              letterSpacing: "-0.01em",
            }}
          />
          <MenuBadge badge={badge} />
        </ListItemButton>
      </ListItem>
    );
  };

  const renderMenuGroup = ({ label, icon, icon_key: iconKey, tone, badge, path, items, open, onToggle, prefix }) => {
    const hasOwnPath = typeof path === "string" && path.length > 0;
    const active = (hasOwnPath && isActive(path)) || items.some((item) => isActive(item.path));
    return (
      <Box key={prefix}>
        <ListItem disablePadding sx={{ px: 1.25, mb: 0.35 }}>
          <ListItemButton
            selected={active}
            aria-current={hasOwnPath && isActive(path) ? "page" : undefined}
            aria-expanded={open}
            onClick={() => {
              if (hasOwnPath) {
                navigate(path);
                onNavigate?.();
                if (!open) onToggle();
              } else {
                onToggle();
              }
            }}
            sx={{
              minHeight: 42,
              px: 1.5,
              borderRadius: 1.5,
              color: active ? "primary.dark" : "var(--bojogae-muted)",
              "&.Mui-selected": { bgcolor: "var(--bojogae-tint)", color: "primary.dark" },
              "&:hover": { bgcolor: "var(--bojogae-canvas)", color: "var(--bojogae-ink)" },
            }}
          >
            <MenuIcon icon={icon} iconKey={iconKey} tone={tone} />
            <ListItemText
              primary={label}
              sx={{ minWidth: 0, mr: badge ? 0.5 : 0 }}
              primaryTypographyProps={{ fontSize: 14, fontWeight: active ? 750 : 550 }}
            />
            {badge ? (
              <Box component="span" sx={{ mr: 0.5, display: "inline-flex" }}>
                <MenuBadge badge={badge} compact />
              </Box>
            ) : null}
            {hasOwnPath ? (
              <IconButton
                size="small"
                aria-label={`${label} 하위 메뉴 ${open ? "접기" : "펼치기"}`}
                onClick={(event) => {
                  event.stopPropagation();
                  onToggle();
                }}
                sx={{ p: 0.25, ml: 0.25, color: "inherit" }}
              >
                {open ? <ExpandLessRoundedIcon fontSize="small" /> : <ExpandMoreRoundedIcon fontSize="small" />}
              </IconButton>
            ) : (
              open ? <ExpandLessRoundedIcon fontSize="small" /> : <ExpandMoreRoundedIcon fontSize="small" />
            )}
          </ListItemButton>
        </ListItem>
        <Collapse in={open} timeout="auto" unmountOnExit>
          <List disablePadding>
            {items.map((item) => {
              const childActive = isActive(item.path);
              return (
                <ListItem key={item.key || item.path} disablePadding sx={{ px: 1.25, mb: 0.25 }}>
                  <ListItemButton
                    selected={childActive}
                    onClick={() => {
                      navigate(item.path);
                      onNavigate?.();
                    }}
                    sx={{
                      minHeight: 38,
                      pl: 5.75,
                      pr: 1.5,
                      borderRadius: 1.5,
                      color: childActive ? "primary.dark" : "var(--bojogae-muted)",
                      "&.Mui-selected": { bgcolor: "var(--bojogae-tint)" },
                    }}
                  >
                    <ListItemText
                      primary={item.label}
                      sx={{ minWidth: 0, mr: item.badge ? 0.75 : 0 }}
                      primaryTypographyProps={{ fontSize: 13.5, fontWeight: childActive ? 750 : 500 }}
                    />
                    <MenuBadge badge={item.badge} compact />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Collapse>
      </Box>
    );
  };

  const visibleUserMenus = userMenuItems.filter((item) => isMenuEligibleForUser(item, user));

  return (
    <Box
      component="nav"
      aria-label="주요 메뉴"
      sx={{
        width: { xs: 280, sm: 264 },
        minWidth: { xs: 280, sm: 264 },
        height: "100%",
        minHeight: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: "#fff",
        borderRight: "1px solid var(--bojogae-line)",
      }}
    >
      <List sx={{ pt: 2, pb: 1 }}>
        {visibleUserMenus.map((item) => {
          const visibleChildren = (item.children || []).filter((child) => isChildEligibleForUser(child, user));
          if (item.kind === "hero") {
            return (
              <Box key={item.key} sx={{ mb: 1.25 }}>
                <ListItem disablePadding sx={{ px: 1.25, mb: visibleChildren.length > 0 ? 0.5 : 0 }}>
                  <Button
                    component={Link}
                    to={item.path}
                    onClick={onNavigate}
                    aria-current={isActive(item.path) ? "page" : undefined}
                    variant="contained"
                    fullWidth
                    disableElevation
                    sx={{ ...reportHero, justifyContent: "flex-start", minHeight: 68, px: 1.75, gap: 1.25, borderRadius: "16px" }}
                  >
                    <Box component="span" sx={{ ...reportHeroIcon, width: 40, height: 40, borderRadius: "12px" }}>
                      <AutoAwesomeRoundedIcon sx={{ fontSize: 20 }} />
                    </Box>
                    <Box
                      component="span"
                      sx={{ display: "grid", justifyItems: "start", gap: 0.25, fontSize: 15, fontWeight: 900, letterSpacing: "-0.025em" }}
                    >
                      <Box component="span" aria-hidden="true" sx={reportHeroBadge}>CORE FEATURE</Box>
                      <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.75, flexWrap: "wrap" }}>
                        {item.label}
                        <MenuBadge badge={item.badge} onHero compact />
                      </Box>
                    </Box>
                    <ChevronRightRoundedIcon aria-hidden="true" sx={{ ml: "auto", fontSize: 18 }} />
                  </Button>
                </ListItem>
                {visibleChildren.length > 0 && (
                  <List disablePadding>
                    {visibleChildren.map((child) => {
                      const childActive = isActive(child.path);
                      return (
                        <ListItem key={child.key || child.path} disablePadding sx={{ px: 1.25, mb: 0.25 }}>
                          <ListItemButton
                            selected={childActive}
                            onClick={() => {
                              navigate(child.path);
                              onNavigate?.();
                            }}
                            sx={{
                              minHeight: 38,
                              pl: 4,
                              pr: 1.5,
                              borderRadius: 1.5,
                              color: childActive ? "primary.dark" : "var(--bojogae-muted)",
                              "&.Mui-selected": { bgcolor: "var(--bojogae-tint)" },
                            }}
                          >
                            <ListItemText
                              primary={child.label}
                              sx={{ minWidth: 0, mr: child.badge ? 0.75 : 0 }}
                              primaryTypographyProps={{ fontSize: 13.5, fontWeight: childActive ? 750 : 500 }}
                            />
                            <MenuBadge badge={child.badge} compact />
                          </ListItemButton>
                        </ListItem>
                      );
                    })}
                  </List>
                )}
              </Box>
            );
          }

          if (item.kind === "group" || visibleChildren.length > 0) {
            return renderMenuGroup({
              label: item.label,
              icon_key: item.icon_key,
              tone: item.tone,
              badge: item.badge,
              path: item.kind === "group" ? undefined : item.path,
              items: visibleChildren,
              open: Boolean(openGroups[item.key]),
              onToggle: () => setOpenGroups((prev) => ({ ...prev, [item.key]: !prev[item.key] })),
              prefix: item.prefix || item.key,
            });
          }

          return renderMenuItem(item);
        })}
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
            {ADMIN_MENU.map((item) => (item.items
              ? renderMenuGroup({
                ...item,
                open: adminPointsOpen,
                onToggle: () => setAdminPointsOpen((value) => !value),
                prefix: "/admin/point-menu/",
              })
              : renderMenuItem(item)))}
            {renderMenuGroup({
              label: "게시판 관리",
              icon: ArticleOutlinedIcon,
              items: ADMIN_BOARD_MENU,
              open: adminBoardsOpen,
              onToggle: () => setAdminBoardsOpen((value) => !value),
              prefix: "/admin/boards/",
            })}
            {renderMenuItem({ label: "Info", path: "/admin/info", icon: InfoOutlinedIcon })}
            {renderMenuItem({ label: "팝업 공지 관리", path: "/admin/popup-notices", icon: CampaignOutlinedIcon })}
            {renderMenuItem({ label: "FAQ 관리", path: "/admin/faqs", icon: HelpOutlineOutlinedIcon })}
            {renderMenuItem({ label: "보조개톡 오류 보고", path: "/admin/talk-error-reports", icon: HelpOutlineOutlinedIcon })}
            {renderMenuItem({ label: "보조개톡 배포 관리", path: "/admin/talk-releases", icon: ChatBubbleOutlineRoundedIcon })}
          </List>
        </>
      )}

      <Box sx={{ flex: 1 }} />
      <Box sx={{ px: 2, py: 1.75, borderTop: "1px solid #eef1f5", textAlign: "center" }}>
        {user && !user.group_id && (
          <Typography
            onClick={() => navigate("/profile#plan")}
            sx={{ color: user?.plan_code && user.plan_code !== "FREE" ? "primary.dark" : "var(--bojogae-muted)", fontSize: 11, fontWeight: 800, mb: 0.5, cursor: "pointer" }}
          >
            개인 {planName(user?.plan_code)} 요금제
          </Typography>
        )}
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
    <Typography sx={{ color: "var(--bojogae-muted)", fontSize: 11, fontWeight: 800, mb: 0.25 }}>
      BOJOGAE
    </Typography>
  );
}

export default PageLeftMenu;
