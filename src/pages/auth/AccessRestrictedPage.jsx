import { Box, Button, Container, Paper, Stack, Typography } from "@mui/material";
import BlockRoundedIcon from "@mui/icons-material/BlockRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/auth/AuthContext";

function AccessRestrictedPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const rejected = user?.status === "REJECTED";

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", bgcolor: "background.default", p: 2 }}>
      <Container maxWidth="sm">
        <Paper sx={{ p: { xs: 3, sm: 5 }, borderRadius: 4, textAlign: "center" }} elevation={0}>
          <Stack spacing={2.5} alignItems="center">
            <BlockRoundedIcon color="error" sx={{ fontSize: 58 }} />
            <div>
              <Typography variant="h4" sx={{ fontWeight: 800 }}>
                {rejected ? "가입 승인이 거절되었습니다" : "사용이 일시 정지되었습니다"}
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                계정 상태에 대한 문의는 서비스 관리자에게 연락해 주세요.
              </Typography>
            </div>
            <Button variant="outlined" onClick={handleLogout} startIcon={<LogoutRoundedIcon />}>
              로그아웃
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}

export default AccessRestrictedPage;
