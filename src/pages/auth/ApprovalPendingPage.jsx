import { Box, Button, CircularProgress, Container, Paper, Stack, Typography } from "@mui/material";
import HourglassTopRoundedIcon from "@mui/icons-material/HourglassTopRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/auth/AuthContext";

function ApprovalPendingPage() {
  const { user, refreshUser, logout } = useAuth();
  const [checking, setChecking] = useState(false);
  const navigate = useNavigate();

  const checkStatus = useCallback(async () => {
    setChecking(true);
    try {
      const currentUser = await refreshUser();
      if (currentUser?.status === "ACTIVE") navigate("/home", { replace: true });
      if (["REJECTED", "SUSPENDED"].includes(currentUser?.status)) {
        navigate("/access-restricted", { replace: true });
      }
    } catch {
      // 일시적인 네트워크 오류는 다음 자동 확인에서 재시도한다.
    } finally {
      setChecking(false);
    }
  }, [navigate, refreshUser]);

  useEffect(() => {
    const timer = window.setInterval(() => checkStatus(), 10000);
    return () => window.clearInterval(timer);
  }, [checkStatus]);

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", bgcolor: "background.default", p: 2 }}>
      <Container maxWidth="sm">
        <Paper sx={{ p: { xs: 3, sm: 5 }, borderRadius: 4, textAlign: "center" }} elevation={0}>
          <Stack spacing={2.5} alignItems="center">
            <Box sx={{ width: 64, height: 64, borderRadius: "50%", display: "grid", placeItems: "center", bgcolor: "primary.light", color: "primary.main" }}>
              <HourglassTopRoundedIcon fontSize="large" />
            </Box>
            <div>
              <Typography variant="h4" sx={{ fontWeight: 800 }}>승인을 기다리고 있어요</Typography>
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                {user?.display_name}님의 가입이 완료되었습니다. 관리자가 승인하면 바로 이용할 수 있습니다.
              </Typography>
            </div>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} width="100%">
              <Button fullWidth variant="contained" onClick={checkStatus} disabled={checking} startIcon={checking ? <CircularProgress size={16} color="inherit" /> : <RefreshRoundedIcon />}>
                승인 상태 확인
              </Button>
              <Button fullWidth variant="outlined" onClick={handleLogout} startIcon={<LogoutRoundedIcon />}>
                로그아웃
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}

export default ApprovalPendingPage;
