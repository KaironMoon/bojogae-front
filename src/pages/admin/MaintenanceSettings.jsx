import { useEffect, useState } from "react";
import { Alert, Button, Paper, Stack, TextField, Typography } from "@mui/material";
import apiCaller from "@/services/api-caller";

const ENDPOINT = "/api/v1/admin/maintenance";
const STATES = { off: "해제", scheduled: "예약됨", active: "점검 중", ended: "종료됨" };

function toKstInput(value) {
  if (!value) return "";
  return new Date(Date.parse(value) + 9 * 60 * 60 * 1000).toISOString().slice(0, 16);
}

export default function MaintenanceSettings() {
  const [settings, setSettings] = useState(null);
  const [draft, setDraft] = useState({});
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function show(data) {
    setSettings(data);
    setDraft({
      title: data.title, message: data.message,
      starts_at: toKstInput(data.starts_at), ends_at: toKstInput(data.ends_at),
    });
  }

  useEffect(() => {
    apiCaller.get(ENDPOINT).then(({ data }) => show(data))
      .catch(() => setError("점검 설정을 불러오지 못했습니다."));
    const timer = window.setInterval(() => {
      apiCaller.get(ENDPOINT).then(({ data }) => setSettings(data)).catch(() => {});
    }, 15_000);
    return () => window.clearInterval(timer);
  }, []);

  const update = async (action) => {
    setWorking(true);
    setError("");
    setMessage("");
    try {
      const payload = action === "stop" ? { action } : {
        action, title: draft.title, message: draft.message,
        starts_at: action === "schedule" && draft.starts_at ? `${draft.starts_at}:00+09:00` : null,
        ends_at: draft.ends_at ? `${draft.ends_at}:00+09:00` : null,
      };
      const { data } = await apiCaller.put(ENDPOINT, payload);
      show(data);
      window.dispatchEvent(new Event("bojogae.maintenanceChanged"));
      setMessage({ start: "점검을 시작했습니다.", schedule: "점검을 예약했습니다.", stop: "점검을 해제했습니다." }[action]);
    } catch (failure) {
      const detail = failure.response?.data?.detail;
      setError(failure.response?.status === 422 && typeof detail === "string" ? detail : "점검 설정을 저장하지 못했습니다. 문구와 시간을 확인해 주세요.");
    } finally {
      setWorking(false);
    }
  };

  return (
    <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, mb: 3 }}>
      <Stack spacing={2}>
        <Typography variant="h6" fontWeight={800}>서비스 점검</Typography>
        {error && <Alert severity="error">{error}</Alert>}
        {message && <Alert severity="success">{message}</Alert>}
        {settings && !settings.schema_ready && <Alert severity="warning">점검 설정 테이블을 적용하면 사용할 수 있습니다.</Alert>}
        {settings?.schema_ready && (
          <>
            <Typography color="text.secondary">현재 상태 · {STATES[settings.state]}</Typography>
            <TextField label="점검 제목" value={draft.title ?? ""} onChange={(event) => setDraft({ ...draft, title: event.target.value })} inputProps={{ maxLength: 80 }} />
            <TextField label="안내 문구" multiline minRows={2} value={draft.message ?? ""} onChange={(event) => setDraft({ ...draft, message: event.target.value })} inputProps={{ maxLength: 1000 }} />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField fullWidth label="예약 시작 (KST)" type="datetime-local" slotProps={{ inputLabel: { shrink: true } }} value={draft.starts_at ?? ""} onChange={(event) => setDraft({ ...draft, starts_at: event.target.value })} />
              <TextField fullWidth label="종료 (KST)" type="datetime-local" slotProps={{ inputLabel: { shrink: true } }} value={draft.ends_at ?? ""} onChange={(event) => setDraft({ ...draft, ends_at: event.target.value })} />
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <Button variant="contained" disabled={working || !draft.ends_at} onClick={() => update("start")}>즉시 시작</Button>
              <Button variant="outlined" disabled={working || !draft.starts_at || !draft.ends_at} onClick={() => update("schedule")}>예약 저장</Button>
              <Button color="inherit" disabled={working || !["active", "scheduled"].includes(settings.state)} onClick={() => update("stop")}>즉시 해제</Button>
            </Stack>
          </>
        )}
      </Stack>
    </Paper>
  );
}
