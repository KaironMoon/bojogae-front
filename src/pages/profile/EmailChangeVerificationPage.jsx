import { Alert, Box, Button, CircularProgress, Container, Paper, Stack, Typography } from "@mui/material";
import MarkEmailReadOutlinedIcon from "@mui/icons-material/MarkEmailReadOutlined";
import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { useAuth } from "@/auth/AuthContext";
import { verifyEmailChangeLink } from "@/services/profile-service";

function EmailChangeVerificationPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const { user, refreshUser } = useAuth();
  const started = useRef(false);
  const [state, setState] = useState("loading");

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (!token) {
      setState("error");
      return;
    }
    verifyEmailChangeLink(token)
      .then(async () => {
        if (user) await refreshUser();
        setState("success");
      })
      .catch(() => setState("error"));
  }, [refreshUser, token, user]);

  return (
    <Box component="main" sx={{ minHeight: "100vh", display: "grid", placeItems: "center", p: 2, backgroundColor: "#f6f8fc" }}>
      <Container maxWidth="sm">
        <Paper elevation={0} sx={{ p: 5, border: "1px solid", borderColor: "divider", borderRadius: 4 }}>
          <Stack spacing={2.5} alignItems="center" textAlign="center">
            <MarkEmailReadOutlinedIcon color="primary" sx={{ fontSize: 48 }} />
            <Typography variant="h4" component="h1" fontWeight={800}>이메일 변경 인증</Typography>
            {state === "loading" && <><CircularProgress size={30} /><Typography color="text.secondary">인증을 확인하고 있습니다.</Typography></>}
            {state === "success" && <><Alert severity="success" sx={{ width: "100%" }}>이메일이 변경되었습니다.</Alert><Button component={Link} to={user ? "/profile" : "/"} variant="contained">{user ? "내 정보로 이동" : "로그인으로 이동"}</Button></>}
            {state === "error" && <><Alert severity="error" sx={{ width: "100%" }}>인증 링크가 만료되었거나 이미 사용되었습니다.</Alert><Button component={Link} to={user ? "/profile" : "/"} variant="contained">돌아가기</Button></>}
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}

export default EmailChangeVerificationPage;
