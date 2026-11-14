/* eslint-disable react/prop-types */
import { useRef, useState } from "react";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import { Paper, Stack, Typography } from "@mui/material";

export default function TemplateFileDropZone({ label, accept, filename, disabled, onFiles }) {
  const input = useRef(null);
  const [dragging, setDragging] = useState(false);

  return (<>
    <input
      ref={input}
      type="file"
      hidden
      accept={accept}
      disabled={disabled}
      onChange={(event) => {
        onFiles(event.target.files);
        event.target.value = "";
      }}
    />
    <Paper
      component="button"
      type="button"
      variant="outlined"
      aria-label={`${label} 파일 선택 또는 드래그 앤 드롭`}
      disabled={disabled}
      onClick={() => input.current?.click()}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = disabled ? "none" : "copy";
        if (!disabled) setDragging(true);
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        if (!disabled) onFiles(event.dataTransfer.files);
      }}
      sx={{
        width: "100%", p: 2, borderWidth: 2, borderStyle: "dashed",
        borderColor: dragging ? "primary.main" : "divider", borderRadius: 2,
        bgcolor: dragging ? "action.selected" : "background.paper",
        cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.6 : 1,
        "&:focus-visible": { outline: "3px solid", outlineColor: "primary.light", outlineOffset: 2 },
      }}
    >
      <Stack component="span" spacing={0.5} alignItems="center">
        <CloudUploadRoundedIcon color={dragging ? "primary" : "action"} />
        <Typography component="span" variant="body2" fontWeight={700}>
          {dragging ? "여기에 파일을 놓으세요" : "파일을 끌어다 놓거나 클릭해서 선택"}
        </Typography>
        <Typography component="span" variant="caption" color="text.secondary">
          {accept.split(",").join(" / ")} · 1개 · 최대 1MB
        </Typography>
        {filename && <Typography component="span" variant="caption" sx={{ overflowWrap: "anywhere" }}>{filename}</Typography>}
      </Stack>
    </Paper>
  </>);
}
