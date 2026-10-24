import { Alert, Button } from "@mui/material";
import { useState } from "react";
import { useAuth } from "@/auth/AuthContext";
import { customerError, signalIdentityChange, stopImpersonation } from "@/services/customer-service";

export default function ImpersonationBanner() {
  const { user, clearIdentity } = useAuth();
  const [returning, setReturning] = useState(false);
  const [error, setError] = useState("");
  if (!user?.is_impersonating) return null;
  async function returnToAdmin() {
    setReturning(true); setError("");
    try {
      const result = await stopImpersonation();
      clearIdentity();
      signalIdentityChange();
      window.location.assign(`/admin/users${result.target_user_id ? `?userId=${result.target_user_id}` : ""}`);
    } catch (err) {
      if (err.response?.status === 401) {
        clearIdentity();
        signalIdentityChange();
        window.location.assign("/login");
        return;
      }
      setError(customerError(err));
      setReturning(false);
    }
  }
  return <>
    <Alert severity="warning" sx={{ borderRadius: 0 }}
      action={<Button color="inherit" disabled={returning} onClick={returnToAdmin} sx={{ whiteSpace: "nowrap" }}>관리자로 복귀</Button>}>
      <strong>대리 접속 중 · 설계사 #{user.id} {user.display_name}</strong><br />
      관리자 {user.impersonation_actor_name} · 설계사 기능과 꼬막을 그대로 사용합니다. 모든 변경은 감사 기록에 남습니다.
    </Alert>
    {error && <Alert severity="error">{error}</Alert>}
  </>;
}
