import { useEffect, useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";

import { useAuth } from "@/auth/AuthContext";
import { createPageSessionTracker } from "@/services/analytics-tracker";

function AnalyticsTracker() {
  const location = useLocation();
  const { user, loading } = useAuth();
  const trackerRef = useRef(null);
  const prevPathRef = useRef(null);

  if (!trackerRef.current && typeof window !== "undefined") {
    trackerRef.current = createPageSessionTracker();
  }

  useEffect(() => {
    const tracker = trackerRef.current;
    if (!tracker) return undefined;

    const onVisibility = () => tracker.handleVisibilityChange();
    const onScroll = () => tracker.updateScroll();
    const onPageHide = () => tracker.leavePageView();

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pagehide", onPageHide);
    const interval = window.setInterval(() => tracker.heartbeat(), 30000);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pagehide", onPageHide);
      window.clearInterval(interval);
      tracker.leavePageView();
    };
  }, []);

  useEffect(() => {
    const tracker = trackerRef.current;
    if (!tracker || loading) return;
    if (user?.is_impersonating || user?.role === "ADMIN") {
      tracker.leavePageView();
      return;
    }
    const timer = window.setTimeout(() => {
      tracker.startPageView(location.pathname, document.title, prevPathRef.current);
      prevPathRef.current = location.pathname;
    }, 80);
    return () => window.clearTimeout(timer);
  }, [location.pathname, loading, user?.id, user?.role, user?.is_impersonating]);

  return null;
}

export function RootTelemetryLayout() {
  return (
    <>
      <AnalyticsTracker />
      <Outlet />
    </>
  );
}

export default AnalyticsTracker;
