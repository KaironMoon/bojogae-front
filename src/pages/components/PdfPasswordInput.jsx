/* eslint-disable react/prop-types */
import { TextField, Typography } from "@mui/material";

export default function PdfPasswordInput({ file, state = {}, onChange, disabled }) {
  if (state.checking) return <Typography variant="caption" role="status">PDF 암호 여부 확인 중…</Typography>;
  if (state.error) return <Typography variant="caption" color="error" role="alert">{state.error}</Typography>;
  if (!state.encrypted) return null;
  return <TextField
    fullWidth size="small" type="password" label={`${file.name} 암호`} required
    value={state.password || ""} disabled={disabled} autoComplete="off"
    inputProps={{ maxLength: 256 }} error={Boolean(state.serverError)}
    helperText={state.serverError || "암호가 설정된 PDF입니다. 보고서 생성 시 서버에서 암호를 확인합니다."}
    onChange={(event) => onChange(file, event.target.value)}
  />;
}
