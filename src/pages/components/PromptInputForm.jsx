/* eslint-disable react/prop-types */
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import { Alert, Box, Button, MenuItem, Paper, Stack, TextField, Typography } from "@mui/material";
import { useRef, useState } from "react";
import { fileAccept, fileTypeLabel } from "@/services/prompt-input-utils";

function FileInputField({ field, uploads, onFiles, disabled }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const selected = uploads[field.key] || [];

  const selectFiles = (fileList) => {
    if (disabled) return;
    setDragging(false);
    onFiles(field.key, Array.from(fileList || []));
  };

  return (
    <Box>
      <Typography variant="body2" fontWeight={700}>{field.label}{field.required ? " *" : ""}</Typography>
      <Typography variant="caption" color="text.secondary" display="block">
        {field.help} · {fileTypeLabel(field)} 최대 {field.max_files}개 · 파일당 10MB (전체 최대 5개)
      </Typography>
      <Paper
        component="label"
        variant="outlined"
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={`${field.label} ${fileTypeLabel(field)} 파일 선택 또는 드래그앤드롭`}
        aria-disabled={disabled}
        onDragEnter={(event) => {
          event.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          event.dataTransfer.dropEffect = disabled ? "none" : "copy";
        }}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          selectFiles(event.dataTransfer.files);
        }}
        onKeyDown={(event) => {
          if (!disabled && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        sx={{
          mt: 1,
          minHeight: 108,
          p: 2,
          display: "grid",
          placeItems: "center",
          textAlign: "center",
          borderWidth: 2,
          borderStyle: "dashed",
          borderColor: dragging ? "primary.main" : selected.length ? "success.main" : "divider",
          borderRadius: 2,
          bgcolor: dragging ? "rgba(37, 99, 235, 0.06)" : selected.length ? "rgba(22, 163, 74, 0.06)" : "#f8faff",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.6 : 1,
          transition: "border-color .15s ease, background-color .15s ease",
          "&:focus-visible": { outline: "3px solid", outlineColor: "primary.light", outlineOffset: 2 },
        }}
      >
        <input
          ref={inputRef}
          hidden
          type="file"
          accept={fileAccept(field)}
          multiple={field.max_files > 1}
          disabled={disabled}
          onChange={(event) => {
            selectFiles(event.target.files);
            event.target.value = "";
          }}
        />
        <Stack spacing={0.5} alignItems="center">
          {selected.length ? <InsertDriveFileOutlinedIcon color="success" /> : <CloudUploadRoundedIcon color={dragging ? "primary" : "action"} />}
          <Typography variant="body2" fontWeight={750}>
            {dragging ? "여기에 파일을 놓으세요" : selected.length ? `${selected.length}개 파일 선택됨` : `${fileTypeLabel(field)} 선택 또는 파일 드래그`}
          </Typography>
          <Typography variant="caption" color="text.secondary">최대 {field.max_files}개 · 파일당 10MB</Typography>
        </Stack>
      </Paper>
      <Stack spacing={0.5} sx={{ mt: 0.75 }}>
        {selected.map((file, index) => (
          <Stack key={`${file.name}-${index}`} direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
            <Typography variant="caption" sx={{ overflowWrap: "anywhere" }}>{file.name}</Typography>
            <Button size="small" color="error" disabled={disabled}
              onClick={() => onFiles(field.key, selected.filter((_, i) => i !== index))}>제거</Button>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}

export default function PromptInputForm({ fields, values = {}, uploads = {}, onValue = () => {}, onFiles = () => {}, disabled = false }) {
  return (
    <Stack spacing={2}>
      {[...new Set(fields.map((field) => field.required_group).filter(Boolean))].map((group) => (
        <Alert key={group} severity="info">{fields.filter((field) => field.required_group === group).map((field) => field.label).join(" / ")} 중 하나 이상 입력해 주세요.</Alert>
      ))}
      {fields.map((field) => field.type === "file" ? (
        <FileInputField key={field.key} field={field} uploads={uploads} onFiles={onFiles} disabled={disabled} />
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
