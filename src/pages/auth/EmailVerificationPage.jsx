import { Alert, Box, Button, CircularProgress, Container, Paper, Stack, Typography } from "@mui/material";
import MarkEmailReadOutlinedIcon from "@mui/icons-material/MarkEmailReadOutlined";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { useAuth } from "@/auth/AuthContext";
import { verifySignupLink } from "@/services/auth-service";

function destinationFor(user) {
  if (user.status === "ACTIVE") return "/home";
  if (user.status === "PENDING") return "/approval-pending";
  return "/access-restricted";
}

function EmailVerificationPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const started = useRef(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (!token) {
      setError("인증 링크가 올바르지 않습니다.");
      return;
    }

    verifySignupLink(token)
      .then(async (user) => {
        await refreshUser();
        navigate(destinationFor(user), { replace: true });
      })
      .catch((requestError) => {
        const detail = requestError.response?.data?.detail;
        setError(
          detail === "verification_expired"
            ? "인증 링크가 만료되었거나 이미 사용되었습니다."
            : "이메일 인증을 완료하지 못했습니다.",
        );
      });
  }, [navigate, refreshUser, token]);

  return (
    <Box component="main" sx={{ minHeight: "100vh", display: "grid", placeItems: "center", p: 2, backgroundColor: "#f6f8fc" }}>
      <Container maxWidth="sm">
        <Paper elevation={0} sx={{ p: 5, border: "1px solid", borderColor: "divider", borderRadius: 4 }}>
          <Stack spacing={2.5} alignItems="center" textAlign="center">
            <MarkEmailReadOutlinedIcon color="primary" sx={{ fontSize: 48 }} />
            <Typography variant="h4" component="h1" fontWeight={800}>이메일 인증</Typography>
            {error ? (
              <>
                <Alert severity="error" sx={{ width: "100%" }}>{error}</Alert>
                <Button component={Link} to="/" variant="contained">로그인으로 돌아가기</Button>
              </>
            ) : (
              <>
                <CircularProgress size={30} />
                <Typography color="text.secondary">인증을 확인하고 있습니다.</Typography>
              </>
            )}
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}

export default EmailVerificationPage;
