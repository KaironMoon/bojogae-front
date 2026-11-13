import { Alert, Autocomplete, Box, Button, Chip, Paper, Stack, Tab, Tabs, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import api from "@/services/api-caller";
import { groupErrorMessage, searchGroups } from "@/services/group-service";
import { loginBackground, loginCardSx, loginProviders, loginTabsSx } from "./login-appearance";
import SocialLoginButton from "./SocialLoginButton";

const endpoint = "/api/v1/auth/sender/talk-login";
const messages = {
  sender_login_expired: "로그인 요청이 만료되었거나 이미 사용되었습니다. 보조개톡에서 다시 시작해 주세요.",
  sender_login_unavailable: "로그인 서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.",
  invalid_login_request: "입력한 정보를 확인하고 다시 시도해 주세요.",
  sender_signup_required: "보조개 웹에서 가입을 완료한 뒤 다시 로그인해 주세요.",
  group_accounts_require_group_login: "단체 계정은 단체 로그인을 사용해 주세요.",
  oauth_denied: "소셜 로그인을 취소했습니다. 보조개톡에서 다시 시작해 주세요.",
  oauth_failed: "소셜 계정을 확인하지 못했습니다. 보조개톡에서 다시 시작해 주세요.",
  password_change_required: "보조개 웹에서 비밀번호를 먼저 변경해 주세요.",
  PENDING: "가입 승인 후 로그인할 수 있습니다.",
  REJECTED: "가입 승인이 거절되었습니다. 보조개에 문의해 주세요.",
  SUSPENDED: "이용이 정지된 계정입니다. 보조개에 문의해 주세요.",
};

function TalkGroupLoginForm({ busy, onSubmit }) { // eslint-disable-line react/prop-types
  const [groupName, setGroupName] = useState("");
  const [groups, setGroups] = useState([]);
  const [searchBusy, setSearchBusy] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchNotice, setSearchNotice] = useState("");

  async function findGroups() {
    setSearchBusy(true);
    setSearchNotice("");
    setGroups([]);
    try {
      const results = await searchGroups(groupName.trim());
      setGroups(results.map((group) => group.name));
      setSearchOpen(results.length > 0);
      setSearchNotice(results.length ? "목록에서 단체를 선택해 주세요." : "검색 결과가 없습니다.");
    } catch (error) {
      setSearchNotice(groupErrorMessage(error));
    } finally {
      setSearchBusy(false);
    }
  }

  function submit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    void onSubmit("group", {
      group_name: groupName.trim(),
      employee_number: form.get("employee_number").trim(),
      password: form.get("password"),
    });
  }

  return (
    <Stack component="form" spacing={1.5} onSubmit={submit}>
      <Stack direction="row" spacing={1} alignItems="center">
        <Autocomplete
          freeSolo fullWidth options={groups} inputValue={groupName}
          open={searchOpen} onOpen={() => setSearchOpen(groups.length > 0)}
          onClose={() => setSearchOpen(false)} disabled={busy}
          loading={searchBusy} readOnly={searchBusy}
          onInputChange={(_, value, reason) => {
            setGroupName(value);
            if (reason === "input" || reason === "clear") {
              setGroups([]);
              setSearchOpen(false);
              setSearchNotice("");
            }
          }}
          renderInput={(params) => (
            <TextField {...params} label="단체명" required inputProps={{ ...params.inputProps, maxLength: 150 }} />
          )}
        />
        <Button type="button" variant="outlined" onClick={findGroups}
          disabled={busy || searchBusy || groupName.trim().length < 2} sx={{ flexShrink: 0 }}>
          {searchBusy ? "검색 중…" : "찾기"}
        </Button>
      </Stack>
      {searchNotice && <Typography role="status" variant="body2">{searchNotice}</Typography>}
      <TextField name="employee_number" label="사번" required autoComplete="username" inputProps={{ maxLength: 50 }} />
      <TextField name="password" label="비밀번호" type="password" required
        autoComplete="current-password" inputProps={{ maxLength: 128 }} />
      <Button type="submit" variant="contained" size="large" disabled={busy || searchBusy || !groupName.trim()}>
        {busy ? "확인 중…" : "단체 로그인"}
      </Button>
    </Stack>
  );
}

export default function TalkLoginPage() {
  const { hash } = useLocation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [method, setMethod] = useState("personal");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const browserCode = hash.slice(1);
  const hasRequest = /^[A-Za-z0-9_-]{64}$/.test(browserCode);
  const completed = !hash && params.get("status") === "complete";
  const callbackError = !hash && params.get("error");
  const detail = error || callbackError;
  const canSignIn = hasRequest && error !== "sender_login_expired";

  async function signIn(kind, data) {
    if (busy || !canSignIn) return;
    setBusy(true);
    setError("");
    try {
      const response = await api.post(`${endpoint}/${kind}`, { ...data, browser_code: browserCode });
      if (kind === "social") {
        window.location.replace(response.data.authorization_url);
        return;
      }
      navigate("/talk/login?status=complete", { replace: true });
    } catch (failure) {
      const code = failure.response?.data?.detail;
      setError(typeof code === "string" && messages[code] ? code : groupErrorMessage(failure));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Box component="main" sx={{ minHeight: "100dvh", display: "grid", placeItems: "center", px: 2, py: 4, background: loginBackground }}>
      <Stack alignItems="center" spacing={2.5} sx={{ width: "100%", maxWidth: 420 }}>
        <Stack alignItems="center" spacing={1.25}>
          <Chip label="BOJOGAE" color="primary" size="small" sx={{ fontWeight: 800, letterSpacing: 2 }} />
          <Typography component="h1" variant="h3" align="center"
            sx={{ fontSize: { xs: 26, sm: 32 }, fontWeight: 900, letterSpacing: "-0.025em", wordBreak: "keep-all" }}>
            보조개톡 로그인
          </Typography>
        </Stack>
        <Paper elevation={0} sx={{ ...loginCardSx, boxSizing: "border-box" }}>
          <Stack spacing={1.5}>
            {completed ? (
              <Alert severity="success">보조개톡 로그인이 완료되었습니다. 이 탭을 닫아도 됩니다.</Alert>
            ) : (
              <>
                {detail && <Alert severity="error">{messages[detail] || (error ? error : "로그인 요청을 확인할 수 없습니다. 보조개톡에서 다시 시작해 주세요.")}</Alert>}
                {detail === "sender_signup_required" && <Button component={Link} to="/login">보조개 가입하기</Button>}
                {detail === "password_change_required" && <Button component={Link} to="/login?method=group">보조개 웹에서 비밀번호 변경하기</Button>}
                {!hasRequest && !detail && <Typography color="text.secondary">보조개톡에서 ‘브라우저로 로그인’을 눌러 시작해 주세요.</Typography>}
                {canSignIn && (
                  <>
                    <Tabs value={method} onChange={(_, value) => { setMethod(value); setError(""); }}
                      variant="fullWidth" aria-label="로그인 방식" sx={loginTabsSx}>
                      <Tab value="group" label="단체 회원 로그인" id="talk-tab-group" aria-controls="talk-panel-group" disabled={busy} />
                      <Tab value="personal" label="개인 회원 로그인" id="talk-tab-personal" aria-controls="talk-panel-personal" disabled={busy} />
                    </Tabs>
                    {method === "personal" ? (
                      <Stack role="tabpanel" id="talk-panel-personal" aria-labelledby="talk-tab-personal" spacing={1.5}>
                        {loginProviders.map((provider) => (
                          <SocialLoginButton key={provider.id} provider={provider} disabled={busy}
                            onClick={() => signIn("social", { provider: provider.id })} />
                        ))}
                      </Stack>
                    ) : (
                      <Box role="tabpanel" id="talk-panel-group" aria-labelledby="talk-tab-group">
                        <TalkGroupLoginForm busy={busy} onSubmit={signIn} />
                      </Box>
                    )}
                  </>
                )}
              </>
            )}
          </Stack>
        </Paper>
      </Stack>
    </Box>
  );
}
