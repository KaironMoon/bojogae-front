import { Box, CircularProgress } from "@mui/material";
import { Navigate, Outlet } from "react-router-dom";

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
  if (user.status === "ACTIVE") return "/home";
  if (user.status === "PENDING") return "/approval-pending";
  return "/access-restricted";
}

function PublicOnlyRoute() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return user ? <Navigate to={destinationFor(user)} replace /> : <Outlet />;
}

function ActiveUserRoute() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return user?.status === "ACTIVE" ? <Outlet /> : <Navigate to={destinationFor(user)} replace />;
}

function PendingUserRoute() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return user?.status === "PENDING" ? <Outlet /> : <Navigate to={destinationFor(user)} replace />;
}

function RestrictedUserRoute() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return user && ["REJECTED", "SUSPENDED"].includes(user.status) ? (
    <Outlet />
  ) : (
    <Navigate to={destinationFor(user)} replace />
  );
}

function AdminRoute() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return user?.status === "ACTIVE" && user.role === "ADMIN" ? (
    <Outlet />
  ) : (
    <Navigate to={destinationFor(user)} replace />
  );
}

export { ActiveUserRoute, AdminRoute, PendingUserRoute, PublicOnlyRoute, RestrictedUserRoute };
