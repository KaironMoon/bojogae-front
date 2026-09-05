import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import MarkEmailReadOutlinedIcon from "@mui/icons-material/MarkEmailReadOutlined";
import { useEffect, useState } from "react";

import { useAuth } from "@/auth/AuthContext";
import {
  getMyProfile,
  requestEmailChange,
  updateMyProfile,
  verifyEmailChangeCode,
} from "@/services/profile-service";

const emptyProfile = { email: "", name: "", nickname: "", phone: "" };

const errorMessages = {
  email_unchanged: "현재 사용 중인 이메일입니다.",
  email_already_in_use: "이미 다른 계정에서 사용 중인 이메일입니다.",
  email_resend_too_soon: "인증메일은 60초 후에 다시 요청할 수 있습니다.",
  email_delivery_failed: "인증메일을 보내지 못했습니다. 잠시 후 다시 시도해 주세요.",
  invalid_verification_code: "인증번호가 올바르지 않습니다.",
  verification_locked: "인증번호 입력 횟수를 초과했습니다. 인증메일을 다시 요청해 주세요.",
  verification_expired: "인증이 만료되었습니다. 이메일 변경을 다시 요청해 주세요.",
};

function requestErrorCode(error) {
  return error.response?.data?.detail || "unknown";
}

function ProfilePage() {
  const { refreshUser } = useAuth();
  const [profile, setProfile] = useState(emptyProfile);
  const [savedEmail, setSavedEmail] = useState("");
  const [requestToken, setRequestToken] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    getMyProfile()
      .then((data) => {
        setProfile({
          email: data.email,
          name: data.name || "",
          nickname: data.nickname || "",
          phone: data.phone || "",
        });
        setSavedEmail(data.email);
      })
      .catch(() => setError("profile_load_failed"))
      .finally(() => setLoading(false));
  }, []);

  const updateField = (field) => (event) => {
    setProfile((value) => ({ ...value, [field]: event.target.value }));
    setMessage("");
    setError("");
    if (field === "email") {
      setRequestToken("");
      setCode("");
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const updated = await updateMyProfile({
        name: profile.name || null,
        nickname: profile.nickname || null,
        phone: profile.phone || null,
      });
      setProfile((value) => ({
        ...value,
        name: updated.name || "",
        nickname: updated.nickname || "",
        phone: updated.phone || "",
      }));
      await refreshUser();
      setMessage("내 정보가 저장되었습니다.");
    } catch {
      setError("profile_save_failed");
    } finally {
      setSaving(false);
    }
  };

  const sendEmailChange = async () => {
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const result = await requestEmailChange(profile.email);
      setRequestToken(result.request_token);
      setCode("");
      setMessage("새 이메일로 인증메일을 보냈습니다.");
    } catch (requestError) {
      setError(requestErrorCode(requestError));
    } finally {
      setSaving(false);
    }
  };

  const confirmEmailCode = async () => {
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const updated = await verifyEmailChangeCode(requestToken, code);
      setSavedEmail(updated.email);
      setProfile((value) => ({ ...value, email: updated.email }));
      setRequestToken("");
      setCode("");
      await refreshUser();
      setMessage("이메일이 변경되었습니다.");
    } catch (requestError) {
      setError(requestErrorCode(requestError));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Box sx={{ minHeight: 420, display: "grid", placeItems: "center" }}><CircularProgress /></Box>;
  }

  const emailChanged = profile.email.trim().toLowerCase() !== savedEmail.toLowerCase();

  return (
    <Box component="main" sx={{ p: { xs: 2, md: 4 }, maxWidth: 760 }}>
      <Stack spacing={0.75} sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" fontWeight={850}>내 정보</Typography>
        <Typography color="text.secondary">이메일은 필수이며, 변경하려면 새 이메일 인증이 필요합니다.</Typography>
      </Stack>

      <Paper elevation={0} sx={{ p: { xs: 2.5, md: 4 }, border: "1px solid", borderColor: "divider", borderRadius: 3 }}>
        <Stack spacing={2.5}>
          {message && <Alert severity="success">{message}</Alert>}
          {error && (
            <Alert severity="error">
              {errorMessages[error] || (error === "profile_load_failed" ? "내 정보를 불러오지 못했습니다." : "내 정보를 저장하지 못했습니다.")}
            </Alert>
          )}

          <TextField label="이름" value={profile.name} onChange={updateField("name")} inputProps={{ maxLength: 100 }} fullWidth />
          <TextField label="닉네임" value={profile.nickname} onChange={updateField("nickname")} inputProps={{ maxLength: 50 }} fullWidth />
          <TextField
            label="전화번호"
            value={profile.phone}
            onChange={updateField("phone")}
            helperText="선택 항목 · 숫자 8~15자리, 국제번호는 + 사용 가능"
            inputProps={{ maxLength: 30, inputMode: "tel" }}
            fullWidth
          />

          <Button variant="contained" size="large" startIcon={<SaveRoundedIcon />} onClick={saveProfile} disabled={saving}>
            정보 저장
          </Button>

          <Box sx={{ borderTop: "1px solid", borderColor: "divider", pt: 3 }}>
            <Stack spacing={2}>
              <TextField
                required
                label="이메일"
                type="email"
                value={profile.email}
                onChange={updateField("email")}
                helperText={emailChanged ? "인증 전에는 기존 이메일이 유지됩니다." : "현재 인증된 이메일"}
                fullWidth
              />
              {emailChanged && (
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<MarkEmailReadOutlinedIcon />}
                  onClick={sendEmailChange}
                  disabled={saving || !profile.email}
                >
                  새 이메일 인증하기
                </Button>
              )}
              {requestToken && (
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                  <TextField
                    label="6자리 인증번호"
                    value={code}
                    onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                    inputProps={{ maxLength: 6, inputMode: "numeric" }}
                    fullWidth
                  />
                  <Button variant="contained" onClick={confirmEmailCode} disabled={saving || code.length !== 6} sx={{ minWidth: 150 }}>
                    인증번호 확인
                  </Button>
                </Stack>
              )}
            </Stack>
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
}

export default ProfilePage;
