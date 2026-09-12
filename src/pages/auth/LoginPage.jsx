import { Alert, Box, Button, Chip, CircularProgress, Container, Paper, Stack, TextField, Typography } from "@mui/material";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { useAuth } from "@/auth/AuthContext";
import {
  clearPendingSocialLoginProvider,
  getLastSocialLoginProvider,
  setPendingSocialLoginProvider,
} from "@/auth/social-login-storage";
import { getAuthOptions, getOAuthLoginUrl, localEmailLogin } from "@/services/auth-service";

const providers = [
  {
    id: "google",
    name: "Google",
    mark: "G",
    background: "#ffffff",
    color: "#202124",
    border: "#dadce0",
    markColor: "#4285f4",
  },
  {
    id: "kakao",
    name: "카카오",
    mark: "K",
    background: "#fee500",
    color: "#191919",
    border: "#fee500",
    markColor: "#191919",
  },
  {
    id: "naver",
    name: "네이버",
    mark: "N",
    background: "#03c75a",
    color: "#ffffff",
    border: "#03c75a",
    markColor: "#ffffff",
  },
];

const errorMessages = {
  oauth_denied: "로그인이 취소되었습니다. 다시 시도해 주세요.",
  invalid_oauth_state: "로그인 요청이 만료되었습니다. 다시 시도해 주세요.",
  oauth_failed: "소셜 계정 정보를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.",
};

function LoginPage() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [searchParams] = useSearchParams();
  const error = searchParams.get("error");
  const [lastProvider] = useState(getLastSocialLoginProvider);
  const [authOptions, setAuthOptions] = useState(null);
  const [email, setEmail] = useState("bojoge.smith@gmail.com");
  const [localError, setLocalError] = useState("");
  const [localWorking, setLocalWorking] = useState(false);

  useEffect(() => {
    if (error) clearPendingSocialLoginProvider();
  }, [error]);

  useEffect(() => {
    getAuthOptions()
      .then((options) => {
        setAuthOptions(options);
        if (options.local_email_login_enabled) {
          setEmail(options.local_login_default_email || "bojoge.smith@gmail.com");
        }
      })
      .catch(() => setAuthOptions({ local_email_login_enabled: false }));
  }, []);

  const submitLocalLogin = async (event) => {
    event.preventDefault();
    setLocalWorking(true);
    setLocalError("");
    try {
      await localEmailLogin(email.trim());
      const user = await refreshUser();
      const destination = user?.status === "ACTIVE"
        ? "/home"
        : user?.status === "PENDING"
          ? "/approval-pending"
          : "/access-restricted";
      navigate(destination, { replace: true });
    } catch (requestError) {
      setLocalError(
        requestError.response?.data?.detail === "local_user_not_found"
          ? "등록된 사용자를 찾을 수 없습니다."
          : "로컬 로그인에 실패했습니다.",
      );
    } finally {
      setLocalWorking(false);
    }
  };

  const localMode = authOptions?.local_email_login_enabled === true;

  return (
    <Box
      component="main"
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        py: { xs: 4, md: 8 },
        background:
          "radial-gradient(circle at 15% 20%, rgba(67, 97, 238, .18), transparent 34%), radial-gradient(circle at 85% 80%, rgba(0, 180, 216, .16), transparent 30%), #f6f8fc",
      }}
    >
      <Container maxWidth="sm" sx={{ width: "100%" }}>
        <Stack alignItems="center" spacing={3}>
          <Stack alignItems="center" spacing={1.25}>
            <Chip label="BOJOGAE" color="primary" size="small" sx={{ fontWeight: 800, letterSpacing: 2 }} />
            <Typography variant="h3" component="h1" align="center" sx={{ fontWeight: 850, letterSpacing: "-0.04em" }}>
              반가워요.
              <br />보조개에 로그인하세요.
            </Typography>
            <Typography color="text.secondary" align="center" sx={{ maxWidth: 430 }}>
              {localMode
                ? "로컬 개발 환경에서는 등록된 이메일로 바로 로그인할 수 있습니다."
                : "별도의 비밀번호 없이 사용 중인 소셜 계정으로 가입과 로그인을 한 번에 진행합니다."}
            </Typography>
          </Stack>

          <Paper
            elevation={0}
            sx={{
              width: "100%",
              p: { xs: 2.5, sm: 4 },
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 4,
              boxShadow: "0 24px 70px rgba(31, 45, 61, .10)",
            }}
          >
            <Stack spacing={1.5}>
              {error && <Alert severity="error">{errorMessages[error] || "로그인 중 오류가 발생했습니다."}</Alert>}
              {localError && <Alert severity="error">{localError}</Alert>}

              {authOptions === null ? (
                <Box sx={{ minHeight: 120, display: "grid", placeItems: "center" }}>
                  <CircularProgress size={28} />
                </Box>
              ) : localMode ? (
                <Stack component="form" spacing={1.5} onSubmit={submitLocalLogin}>
                  <TextField
                    type="email"
                    label="이메일"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    autoFocus
                    fullWidth
                    inputProps={{ autoComplete: "email" }}
                  />
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    disabled={localWorking || !email.trim()}
                    sx={{ minHeight: 54, borderRadius: 2.5, fontWeight: 800 }}
                  >
                    {localWorking ? "로그인 중..." : "로컬 이메일로 로그인"}
                  </Button>
                </Stack>
              ) : providers.map((provider) => (
                <Button
                  key={provider.id}
                  component="a"
                  href={getOAuthLoginUrl(provider.id)}
                  onClick={() => setPendingSocialLoginProvider(provider.id)}
                  fullWidth
                  variant="outlined"
                  endIcon={<ArrowForwardRoundedIcon />}
                  sx={{
                    minHeight: 54,
                    justifyContent: "space-between",
                    px: 2,
                    borderRadius: 2.5,
                    borderColor: provider.border,
                    backgroundColor: provider.background,
                    color: provider.color,
                    fontWeight: 750,
                    "&:hover": {
                      borderColor: provider.border,
                      backgroundColor: provider.background,
                      filter: "brightness(.97)",
                    },
                  }}
                  startIcon={
                    <Box
                      component="span"
                      sx={{ width: 24, fontWeight: 900, color: provider.markColor, textAlign: "center" }}
                    >
                      {provider.mark}
                    </Box>
                  }
                >
                  <Stack component="span" direction="row" spacing={1} alignItems="center">
                    <Box component="span">{provider.name}로 계속하기</Box>
                    {lastProvider === provider.id && (
                      <Chip
                        component="span"
                        label="최근 로그인"
                        size="small"
                        sx={{
                          height: 22,
                          backgroundColor: provider.id === "kakao" ? "rgba(25, 25, 25, .12)" : "rgba(67, 97, 238, .10)",
                          color: "inherit",
                          fontSize: 11,
                          fontWeight: 800,
                        }}
                      />
                    )}
                  </Stack>
                </Button>
              ))}

              <Stack direction="row" spacing={1} alignItems="center" justifyContent="center" sx={{ pt: 1 }}>
                <LockOutlinedIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                <Typography variant="caption" color="text.secondary">
                  {localMode
                    ? "로컬 로그인은 기존에 등록된 사용자만 사용할 수 있습니다."
                    : "처음 가입한 일반 사용자는 관리자 승인 후 서비스를 이용할 수 있습니다."}
                </Typography>
              </Stack>
            </Stack>
          </Paper>

          <Typography variant="caption" color="text.secondary">
            로그인하면 서비스 운영 정책에 동의한 것으로 간주합니다.
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
}

export default LoginPage;
