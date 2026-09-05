import {
  Alert,
  Box,
  Button,
  Container,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { useAuth } from "@/auth/AuthContext";
import { sendSignupEmail, verifySignupCode } from "@/services/auth-service";

const errorMessages = {
  signup_expired: "가입 요청이 만료되었습니다. 소셜 로그인을 다시 진행해 주세요.",
  email_resend_too_soon: "인증메일은 60초 후에 다시 보낼 수 있습니다.",
  email_delivery_failed: "인증메일을 보내지 못했습니다. 잠시 후 다시 시도해 주세요.",
  invalid_verification_code: "인증번호가 올바르지 않습니다.",
  verification_locked: "인증번호 입력 횟수를 초과했습니다. 인증메일을 다시 받아 주세요.",
  verification_expired: "인증번호가 만료되었습니다. 인증메일을 다시 받아 주세요.",
};

function destinationFor(user) {
  if (user.status === "ACTIVE") return "/home";
  if (user.status === "PENDING") return "/approval-pending";
  return "/access-restricted";
}

function errorCode(error) {
  return error.response?.data?.detail || "unknown";
}

function SignupCompletePage() {
  const [searchParams] = useSearchParams();
  const signupToken = searchParams.get("token") || "";
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = window.setInterval(() => {
      setCooldown((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  const requestEmail = async () => {
    setLoading(true);
    setError("");
    try {
      await sendSignupEmail(signupToken, email);
      setSent(true);
      setCooldown(60);
    } catch (requestError) {
      setError(errorCode(requestError));
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    setLoading(true);
    setError("");
    try {
      const user = await verifySignupCode(signupToken, code);
      await refreshUser();
      navigate(destinationFor(user), { replace: true });
    } catch (requestError) {
      setError(errorCode(requestError));
    } finally {
      setLoading(false);
    }
  };

  if (!signupToken) {
    return (
      <Container maxWidth="sm" sx={{ py: 10 }}>
        <Alert severity="error">유효하지 않은 가입 요청입니다.</Alert>
        <Button component={Link} to="/" sx={{ mt: 2 }}>로그인으로 돌아가기</Button>
      </Container>
    );
  }

  return (
    <Box component="main" sx={{ minHeight: "100vh", display: "grid", placeItems: "center", p: 2, backgroundColor: "#f6f8fc" }}>
      <Container maxWidth="sm">
        <Paper elevation={0} sx={{ p: { xs: 3, sm: 5 }, border: "1px solid", borderColor: "divider", borderRadius: 4 }}>
          <Stack spacing={3}>
            <Stack spacing={1} alignItems="center" textAlign="center">
              <EmailOutlinedIcon color="primary" sx={{ fontSize: 42 }} />
              <Typography variant="h4" component="h1" fontWeight={800}>가입 이메일 인증</Typography>
              <Typography color="text.secondary">
                소셜 계정과 연결할 이메일을 입력해 주세요. 같은 이메일로 인증하면 기존 계정에 연결됩니다.
              </Typography>
            </Stack>

            {error && <Alert severity="error">{errorMessages[error] || "요청을 처리하지 못했습니다."}</Alert>}

            <TextField
              label="이메일"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={loading}
              fullWidth
              autoFocus
            />
            <Button
              variant="contained"
              size="large"
              onClick={requestEmail}
              disabled={loading || !email || (sent && cooldown > 0)}
            >
              {sent && cooldown > 0 ? `${cooldown}초 후 재발송` : sent ? "인증메일 다시 보내기" : "인증메일 보내기"}
            </Button>

            {sent && (
              <Stack spacing={2}>
                <Alert severity="info">
                  메일의 인증 버튼을 누르거나 아래에 6자리 인증번호를 입력하세요.
                </Alert>
                <TextField
                  label="6자리 인증번호"
                  value={code}
                  onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  inputProps={{ inputMode: "numeric", maxLength: 6 }}
                  disabled={loading}
                  fullWidth
                />
                <Button variant="outlined" size="large" onClick={verifyCode} disabled={loading || code.length !== 6}>
                  인증번호 확인
                </Button>
              </Stack>
            )}

            <Button component={Link} to="/" color="inherit">로그인으로 돌아가기</Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}

export default SignupCompletePage;
