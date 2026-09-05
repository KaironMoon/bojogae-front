import { Alert, Box, Button, MenuItem, Paper, Stack, TextField, Typography } from "@mui/material";
import { useEffect, useState } from "react";

import { getProposalSettings, updateProposalSettings } from "@/services/proposal-service";


const FIELDS = [
  ["max_output_tokens", "최대 출력 토큰", 1, 65536],
  ["max_pdf_files", "최대 PDF 개수", 1, 5],
  ["max_pdf_bytes", "파일당 최대 바이트", 1, 10485760],
  ["max_active_jobs_per_user", "사용자당 활성 작업", 1, 100],
  ["max_global_running_jobs", "전체 동시 생성", 1, 100],
];

function ProposalSettingsPage() {
  const [values, setValues] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);

  useEffect(() => {
    getProposalSettings().then(setValues).catch(() => setError("설정을 불러오지 못했습니다."));
  }, []);

  const save = async () => {
    setWorking(true);
    setError("");
    setMessage("");
    try {
      const payload = { ...values };
      delete payload.updated_at;
      delete payload.updated_by;
      FIELDS.forEach(([key]) => { payload[key] = Number(payload[key]); });
      setValues(await updateProposalSettings(payload));
      setMessage("설정을 저장했습니다. 새 작업부터 적용됩니다.");
    } catch {
      setError("설정값을 확인해 주세요.");
    } finally {
      setWorking(false);
    }
  };

  if (!values) return <Box sx={{ p: 4 }}>{error ? <Alert severity="error">{error}</Alert> : "불러오는 중..."}</Box>;

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 900, mx: "auto" }}>
      <Typography variant="h4" sx={{ fontWeight: 800 }}>제안서 생성 설정</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>제한과 모델 설정은 서버가 검증하며 작업 생성 시점에 고정됩니다.</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
        <Stack spacing={2}>
          <TextField label="Gemini 모델" value={values.gemini_model} onChange={(event) => setValues({ ...values, gemini_model: event.target.value })} />
          <TextField select label="Thinking level" value={values.thinking_level} onChange={(event) => setValues({ ...values, thinking_level: event.target.value })}>
            {['minimal', 'low', 'medium', 'high'].map((level) => <MenuItem key={level} value={level}>{level}</MenuItem>)}
          </TextField>
          {FIELDS.map(([key, label, min, max]) => (
            <TextField key={key} type="number" label={label} value={values[key]} inputProps={{ min, max }} onChange={(event) => setValues({ ...values, [key]: event.target.value })} />
          ))}
          <Button variant="contained" onClick={save} disabled={working}>{working ? "저장 중..." : "저장"}</Button>
        </Stack>
      </Paper>
    </Box>
  );
}

export default ProposalSettingsPage;
