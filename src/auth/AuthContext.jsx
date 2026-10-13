import { flushSync } from "react-dom";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { getCurrentUser, logout as requestLogout } from "@/services/auth-service";
import { commitPendingSocialLoginProvider } from "@/auth/social-login-storage";
import { clearLocalBrowserPush, reconcileBrowserPushUser } from '@/services/web-push-service';

import { signalIdentityChange, stopImpersonation } from "@/services/customer-service";

const AuthContext = createContext(null);

function AuthProvider({ children }) { // eslint-disable-line react/prop-types
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const clearIdentity = useCallback(() => {
    flushSync(() => { setUser(null); setLoading(true); });
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await getCurrentUser();
      commitPendingSocialLoginProvider();
      setUser(currentUser);
      return currentUser;
    } catch (error) {
      if (error.response?.data?.detail === "impersonation_expired") {
        let result;
        try {
          result = await stopImpersonation();
        } catch (stopError) {
          if (stopError.response?.status !== 401) throw stopError;
        }
        clearIdentity();
        signalIdentityChange();
        window.location.assign(result ? `/admin/users${result.target_user_id ? `?userId=${result.target_user_id}` : ""}` : "/login");
        return null;
      }
      if (error.response?.status === 401) {
        setUser(null);
        return null;
      }
      throw error;
    } finally {
      setLoading(false);
    }
  }, [clearIdentity]);

  useEffect(() => {
    refreshUser().catch(() => setLoading(false));
  }, [refreshUser]);

  useEffect(() => {
    if (!loading && !user?.is_impersonating) reconcileBrowserPushUser(user).catch(() => {});
  }, [loading, user?.id, user?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const identityChanged = event => {
      if (event.key === "bojogae.identityChanged") { clearIdentity(); window.location.reload(); }
    };
    window.addEventListener("storage", identityChanged);
    return () => window.removeEventListener("storage", identityChanged);
  }, [clearIdentity]);

  const logout = useCallback(async () => {
    if (user?.is_impersonating) {
      const result = await stopImpersonation();
      clearIdentity();
      signalIdentityChange();
      return `/admin/users${result.target_user_id ? `?userId=${result.target_user_id}` : ""}`;
    }
    await requestLogout();
    await clearLocalBrowserPush().catch(() => {});
    setUser(null);
  }, [user?.is_impersonating, clearIdentity]);

  const value = useMemo(
    () => ({ user, loading, refreshUser, logout, clearIdentity }),
    [user, loading, refreshUser, logout, clearIdentity],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}

// AuthProvider와 hook은 인증 상태를 공유하는 하나의 공개 모듈로 유지한다.
// eslint-disable-next-line react-refresh/only-export-components
export { AuthProvider, useAuth };
