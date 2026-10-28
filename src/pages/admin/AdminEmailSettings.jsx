import { useEffect, useState } from "react";
import {
  Alert, Button, Checkbox, Chip, FormControlLabel, Paper, Stack, TextField, Typography,
} from "@mui/material";
import apiCaller from "@/services/api-caller";

const ENDPOINT = "/api/v1/admin/email-notifications";

export default function AdminEmailSettings() {
  const [settings, setSettings] = useState(null);
  const [draft, setDraft] = useState("");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    apiCaller.get(ENDPOINT).then(({ data }) => {
      if (active) setSettings(data);
    }).catch(() => {
      if (active) setError("메일 알림 설정을 불러오지 못했습니다. 페이지를 새로고침해 주세요.");
    });
    return () => { active = false; };
  }, []);

  const recipientsWithDraft = () => [...new Set([
    ...settings.recipients, ...draft.split(/[\s,;]+/).map((value) => value.trim().toLowerCase()).filter(Boolean),
  ])];

  const add = () => {
    setSettings({ ...settings, recipients: recipientsWithDraft() });
    setDraft("");
    setMessage("");
  };

  const save = async () => {
    setWorking(true);
    setError("");
    setMessage("");
    try {
      const { data } = await apiCaller.put(ENDPOINT, {
        recipients: recipientsWithDraft(), enabled_events: settings.enabled_events,
      });
      setSettings(data);
      setDraft("");
      setMessage("메일 알림 설정을 저장했습니다.");
    } catch (requestError) {
      setError(requestError.response?.status === 503
        ? "메일 알림용 DB 설정이 필요합니다. SQL 적용 후 다시 시도해 주세요."
        : "저장하지 못했습니다. 이메일 형식과 주소 개수(최대 50개)를 확인해 주세요.");
    } finally {
      setWorking(false);
    }
  };

  const disabled = working || !settings?.schema_ready;
  return (
    <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, mb: 3 }}>
      <Stack spacing={2}>
        <Typography variant="h6" fontWeight={800}>운영 메일 알림</Typography>
        <Typography variant="body2" color="text.secondary">
          선택한 일이 발생하면 등록된 모든 수신 주소로 메일을 보냅니다. 기본 주소는 bojoge.smith@gmail.com입니다.
        </Typography>
        {error && <Alert severity="error">{error}</Alert>}
        {message && <Alert severity="success">{message}</Alert>}
        {!settings && !error && <Typography>메일 알림 설정을 불러오는 중...</Typography>}
        {settings && <>
          {!settings.schema_ready && <Alert severity="warning">메일 알림용 DB 설정이 적용된 후 저장과 발송을 사용할 수 있습니다.</Alert>}
          <Stack direction={{ xs: "column", sm: "row" }} gap={1}>
            <TextField fullWidth size="small" label="수신 이메일 주소" value={draft} disabled={disabled}
              helperText="여러 주소는 쉼표로 구분하세요. 추가·삭제 후 저장을 눌러야 적용됩니다."
              onChange={(event) => { setDraft(event.target.value); setMessage(""); }}
              onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); add(); } }} />
            <Button variant="outlined" disabled={disabled || !draft.trim()} onClick={add} sx={{ alignSelf: "flex-start", whiteSpace: "nowrap" }}>주소 추가</Button>
          </Stack>
          <Stack direction="row" gap={1} useFlexGap flexWrap="wrap">
            {settings.recipients.map((email) => <Chip key={email} label={email} disabled={disabled}
              sx={{ maxWidth: "100%" }} onDelete={() => {
                setSettings({ ...settings, recipients: settings.recipients.filter((value) => value !== email) });
                setMessage("");
              }} />)}
          </Stack>
          {!settings.recipients.length && !draft.trim() && <Alert severity="info">수신 주소가 없으면 메일을 발송하지 않습니다.</Alert>}
          <Typography fontWeight={700}>메일을 받을 항목과 발송 시점</Typography>
          <Stack spacing={1}>
            {settings.events.map((event) => <FormControlLabel key={event.key} sx={{ alignItems: "flex-start", m: 0 }}
              control={<Checkbox disabled={disabled} checked={settings.enabled_events.includes(event.key)}
                onChange={(_, checked) => {
                  setSettings({ ...settings, enabled_events: checked
                    ? [...settings.enabled_events, event.key]
                    : settings.enabled_events.filter((key) => key !== event.key) });
                  setMessage("");
                }} />}
              label={<Stack sx={{ py: 0.75 }}><Typography fontWeight={650}>{event.label}</Typography><Typography variant="body2" color="text.secondary">{event.description}</Typography></Stack>} />)}
          </Stack>
          <Typography variant="body2" color="text.secondary">
            선택을 해제한 항목과 삭제한 수신 주소에는 대기 중인 메일도 발송하지 않습니다. 자동 꼬막 지급과 이벤트 보상은 알림 대상이 아닙니다.
          </Typography>
          <Button variant="contained" onClick={save} disabled={disabled} sx={{ alignSelf: "flex-start" }}>
            {working ? "저장 중..." : "메일 알림 설정 저장"}
          </Button>
        </>}
      </Stack>
    </Paper>
  );
}
