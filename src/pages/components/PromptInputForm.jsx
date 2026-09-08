/* eslint-disable react/prop-types */
import { Alert, Box, Button, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { fileAccept, fileTypeLabel } from "@/services/prompt-input-utils";

export default function PromptInputForm({ fields, values = {}, uploads = {}, onValue = () => {}, onFiles = () => {}, disabled = false }) {
  return (
    <Stack spacing={2}>
      {[...new Set(fields.map((field) => field.required_group).filter(Boolean))].map((group) => (
        <Alert key={group} severity="info">{fields.filter((field) => field.required_group === group).map((field) => field.label).join(" / ")} 중 하나 이상 입력해 주세요.</Alert>
      ))}
      {fields.map((field) => field.type === "file" ? (
        <Box key={field.key}>
          <Typography variant="body2" fontWeight={700}>{field.label}{field.required ? " *" : ""}</Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            {field.help} · {fileTypeLabel(field)} 최대 {field.max_files}개 · 파일당 10MB (전체 최대 5개)
          </Typography>
          <Button component="label" variant="outlined" size="small" disabled={disabled} sx={{ mt: 1 }}>
            {fileTypeLabel(field)} 선택
            <input hidden type="file" accept={fileAccept(field)} multiple={field.max_files > 1}
              onChange={(event) => { onFiles(field.key, Array.from(event.target.files || [])); event.target.value = ""; }} />
          </Button>
          {(uploads[field.key] || []).map((file, index) => (
            <Stack key={`${file.name}-${index}`} direction="row" alignItems="center" spacing={1}>
              <Typography variant="caption" sx={{ overflowWrap: "anywhere" }}>{file.name}</Typography>
              <Button size="small" color="error" disabled={disabled}
                onClick={() => onFiles(field.key, uploads[field.key].filter((_, i) => i !== index))}>제거</Button>
            </Stack>
          ))}
        </Box>
      ) : (
        <TextField key={field.key} fullWidth size="small" label={field.label || "항목 이름"}
          helperText={field.help} required={field.required} disabled={disabled}
          type={field.type === "number" ? "number" : "text"} select={field.type === "select"}
          multiline={field.type === "text"} minRows={field.type === "text" ? 2 : undefined}
          inputProps={{ maxLength: 10000, ...(field.type === "number" ? { step: "any" } : {}) }}
          value={values[field.key] ?? ""} onChange={(event) => onValue(field.key, event.target.value)}>
          {field.type === "select" ? [
            <MenuItem key="empty" value=""><em>선택해 주세요</em></MenuItem>,
            ...(field.options || []).filter(Boolean).map((option, index) => <MenuItem key={index} value={option}>{option}</MenuItem>),
          ] : null}
        </TextField>
      ))}
      {!fields.length && <Alert severity="info">기본 PDF 업로드 화면을 사용합니다.</Alert>}
    </Stack>
  );
}
