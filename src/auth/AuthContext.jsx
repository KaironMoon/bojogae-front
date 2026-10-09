import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { getCurrentUser, logout as requestLogout } from "@/services/auth-service";
import { commitPendingSocialLoginProvider } from "@/auth/social-login-storage";
import { clearLocalBrowserPush, reconcileBrowserPushUser } from '@/services/web-push-service';

const AuthContext = createContext(null);

function AuthProvider({ children }) { // eslint-disable-line react/prop-types
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await getCurrentUser();
      commitPendingSocialLoginProvider();
      setUser(currentUser);
      return currentUser;
    } catch (error) {
      if (error.response?.status === 401) {
        setUser(null);
        return null;
      }
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser().catch(() => setLoading(false));
  }, [refreshUser]);

  useEffect(() => {
    if (!loading) reconcileBrowserPushUser(user).catch(() => {});
  }, [loading, user?.id, user?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  const logout = useCallback(async () => {
    await requestLogout();
    await clearLocalBrowserPush().catch(() => {});
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, refreshUser, logout }),
    [user, loading, refreshUser, logout],
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
