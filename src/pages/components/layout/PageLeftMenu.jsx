import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
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
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "@/auth/AuthContext";
import { planName } from "@/constants/plans";
import { isAdminMenuEligible } from "@/services/admin-menu-config";
import {
  getAdminMenu,
  getCachedAdminMenu,
  subscribeAdminMenuChanges,
} from "@/services/admin-menu-service";
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

function pathMatches(pathname, targetPath) {
  if (!targetPath) return false;
  return pathname === targetPath || (targetPath !== "/home" && pathname.startsWith(`${targetPath}/`));
}

function isGroupRouteActive(pathname, item) {
  if (item.prefix && pathname.startsWith(item.prefix)) return true;
  if (item.key === "requests" && pathname.startsWith("/proposals/")) return true;
  if (item.key === "profile" && pathname.startsWith("/my-coins")) return true;
  if (item.path && pathMatches(pathname, item.path)) return true;
  return (item.children || []).some((child) => pathMatches(pathname, child.path));
}

function collectOpenGroups(items, pathname) {
  const initial = {};
  for (const item of items) {
    const hasChildren = item.kind === "group" || (item.children || []).length > 0;
    if (hasChildren && isGroupRouteActive(pathname, item)) {
      initial[item.key] = true;
    }
  }
  return initial;
}

function PageLeftMenu({ onNavigate, inDrawer = false }) { // eslint-disable-line react/prop-types
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [userMenuItems, setUserMenuItems] = useState(() => getCachedUserMenu());
  const [adminMenuItems, setAdminMenuItems] = useState(() => getCachedAdminMenu());
  const [adminMenuMode, setAdminMenuMode] = useState(() => (
    location.pathname.startsWith("/admin/") ? "admin" : "user"
  ));
  useEffect(() => {
    if (location.pathname.startsWith("/admin/")) {
      setAdminMenuMode("admin");
    }
  }, [location.pathname]);
  const [openGroups, setOpenGroups] = useState(() => collectOpenGroups(getCachedUserMenu(), location.pathname));
  const [openAdminGroups, setOpenAdminGroups] = useState(() => collectOpenGroups(getCachedAdminMenu(), location.pathname));

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
    if (user?.role !== "ADMIN") return undefined;
    let active = true;
    getAdminMenu()
      .then((res) => {
        if (active && Array.isArray(res?.items)) setAdminMenuItems(res.items);
      })
      .catch(() => {});
    const unsubscribe = subscribeAdminMenuChanges((items) => {
      if (active) setAdminMenuItems(items);
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [user?.role]);

  useEffect(() => {
    const syncOpenState = (prev, items) => {
      let changed = false;
      const next = { ...prev };
      for (const item of items) {
        const hasChildren = item.kind === "group" || (item.children || []).length > 0;
        if (hasChildren && isGroupRouteActive(location.pathname, item) && !next[item.key]) {
          next[item.key] = true;
          changed = true;
        }
      }
      return changed ? next : prev;
    };
    setOpenGroups((prev) => syncOpenState(prev, userMenuItems));
    setOpenAdminGroups((prev) => syncOpenState(prev, adminMenuItems));
  }, [location.pathname, userMenuItems, adminMenuItems]);

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
  const visibleAdminMenus = adminMenuItems.filter((item) => isAdminMenuEligible(item));

  return (
    <Box
      component="nav"
      aria-label="주요 메뉴"
      sx={{
        width: inDrawer ? "100%" : { xs: 280, sm: 264 },
        minWidth: inDrawer ? 0 : { xs: 280, sm: 264 },
        height: "100%",
        minHeight: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: "#fff",
        borderRight: inDrawer ? "none" : "1px solid var(--bojogae-line)",
        ...(inDrawer && {
          "& .MuiListItemButton-root": {
            minHeight: 44,
          },
        }),
      }}
    >
      {inDrawer && (
        <Box
          sx={{
            position: "sticky",
            top: 0,
            zIndex: 2,
            bgcolor: "#fff",
            borderBottom: "1px solid #eef1f5",
            px: 1.75,
            pt: 1.25,
            pb: user?.role === "ADMIN" ? 1.25 : 1,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 850, color: "#0f172a", letterSpacing: "-0.02em" }}>
              메뉴
            </Typography>
            <IconButton size="small" aria-label="메뉴 닫기" onClick={() => onNavigate?.()}>
              <CloseRoundedIcon fontSize="small" />
            </IconButton>
          </Box>
          {user?.role === "ADMIN" && (
            <Box
              role="tablist"
              aria-label="메뉴 영역 전환"
              sx={{
                mt: 1,
                p: 0.5,
                borderRadius: 2.5,
                bgcolor: "#F1F5F9",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 0.5,
              }}
            >
              {[
                { id: "user", label: "설계사 메뉴" },
                { id: "admin", label: "관리자 메뉴" },
              ].map((tab) => {
                const active = adminMenuMode === tab.id;
                return (
                  <Button
                    key={tab.id}
                    type="button"
                    size="small"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setAdminMenuMode(tab.id)}
                    sx={{
                      minHeight: 34,
                      borderRadius: 2,
                      fontSize: 12.5,
                      fontWeight: active ? 850 : 700,
                      color: active ? "#006E43" : "#475569",
                      bgcolor: active ? "#ECFDF5" : "transparent",
                      border: "1px solid",
                      borderColor: active ? "#03C75A" : "transparent",
                      boxShadow: active ? "0 1px 2px rgba(3,199,90,0.14)" : "none",
                      "&:hover": {
                        bgcolor: active ? "#ECFDF5" : "#E2E8F0",
                      },
                    }}
                  >
                    {tab.label}
                  </Button>
                );
              })}
            </Box>
          )}
        </Box>
      )}
      {(!inDrawer || user?.role !== "ADMIN" || adminMenuMode === "user") && (
      <List sx={{ pt: inDrawer ? 1.25 : 2, pb: 1 }}>
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
      )}

      {user?.role === "ADMIN" && (!inDrawer || adminMenuMode === "admin") && (
        <>
          {!inDrawer && <Divider sx={{ mx: 2, my: 1 }} />}
          <Typography
            variant="caption"
            sx={{ px: 2.75, pt: 1.25, pb: 0.75, color: "#94a3b8", fontWeight: 800, letterSpacing: "0.08em" }}
          >
            MANAGEMENT
          </Typography>
          <List sx={{ py: 0 }}>
            {visibleAdminMenus.map((item) => {
              const visibleChildren = (item.children || []).filter((child) => child?.visible !== false);
              if (item.kind === "group" || visibleChildren.length > 0) {
                return renderMenuGroup({
                  label: item.label,
                  icon_key: item.icon_key,
                  tone: item.tone,
                  badge: item.badge,
                  path: item.kind === "group" ? undefined : item.path,
                  items: visibleChildren,
                  open: Boolean(openAdminGroups[item.key]),
                  onToggle: () => setOpenAdminGroups((prev) => ({ ...prev, [item.key]: !prev[item.key] })),
                  prefix: item.prefix || item.key,
                });
              }
              return renderMenuItem(item);
            })}
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
