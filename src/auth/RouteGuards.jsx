import { Box, CircularProgress } from "@mui/material";
import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "@/auth/AuthContext";

function LoadingScreen() {
  return (
    <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
      <CircularProgress size={32} />
    </Box>
  );
}

function destinationFor(user) {
  if (!user) return "/";
  if (user.must_change_password) return "/group/change-password";
  if (user.status === "ACTIVE") return pendingNotificationTarget() || "/home";
  if (user.status === "PENDING") return "/access-restricted";
  return "/access-restricted";
}

function pendingNotificationTarget() {
  const value = sessionStorage.getItem('bojogae.notificationTarget');
  return /^\/notifications\/[1-9]\d*$/.test(value || '') ? value : null;
}

function PublicOnlyRoute() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return user ? <Navigate to={destinationFor(user)} replace /> : <Outlet />;
}

function ActiveUserRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <LoadingScreen />;
  if (!user && /^\/notifications\/[1-9]\d*$/.test(location.pathname)) {
    sessionStorage.setItem('bojogae.notificationTarget', location.pathname);
  }
  const pending = pendingNotificationTarget();
  if (user?.status === 'ACTIVE' && !user.must_change_password && location.pathname === '/home' && pending) {
    return <Navigate to={pending} replace />;
  }
  return user?.status === "ACTIVE" && !user.must_change_password ? <Outlet /> : <Navigate to={destinationFor(user)} replace />;
}

function RestrictedUserRoute() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return user && ["PENDING", "REJECTED", "SUSPENDED"].includes(user.status) ? (
    <Outlet />
  ) : (
    <Navigate to={destinationFor(user)} replace />
  );
}

function AdminRoute() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return user?.status === "ACTIVE" && user.role === "ADMIN" && !user.must_change_password ? (
    <Outlet />
  ) : (
    <Navigate to={destinationFor(user)} replace />
  );
}

export { ActiveUserRoute, AdminRoute, PublicOnlyRoute, RestrictedUserRoute };
