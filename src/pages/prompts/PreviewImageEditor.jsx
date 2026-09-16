import { Alert, Box, Button, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { promptPreviewImageUrl } from "@/services/prompt-service";

export default function PreviewImageEditor({ prompt, file, removed, disabled, onFile, onRemove }) {
  const [localUrl, setLocalUrl] = useState("");
  const [error, setError] = useState("");
  useEffect(() => { setError(""); }, [prompt?.id, prompt?.preview_image_revision]);
  useEffect(() => {
    if (!file) { setLocalUrl(""); return undefined; }
    const url = URL.createObjectURL(file);
    setLocalUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  const url = file ? localUrl : !removed && prompt?.preview_image_available
    ? promptPreviewImageUrl(prompt.id, prompt.preview_image_revision) : "";
  return (
    <Stack spacing={1.25}>
      <Typography variant="subtitle2" fontWeight={750}>결과 미리보기 이미지 (선택)</Typography>
      <Typography variant="body2" color="text.secondary">이미지 없이도 저장할 수 있습니다. PNG·JPG·WebP 1장, 최대 10MB.</Typography>
      {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
      {url && <Box component="img" src={url} alt="결과 미리보기" onError={() => setError("미리보기 이미지를 불러오지 못했습니다.")}
        sx={{ width: "100%", maxHeight: 320, objectFit: "contain", bgcolor: "grey.50", borderRadius: 2 }} />}
      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
        <Button component="label" variant="outlined" disabled={disabled}>
          {url ? "이미지 교체" : "이미지 업로드"}
          <input hidden type="file" accept="image/png,image/jpeg,image/webp" disabled={disabled} onChange={(event) => {
            const image = event.target.files?.[0];
            event.target.value = "";
            if (!image) return;
            if (!["image/png", "image/jpeg", "image/webp"].includes(image.type) || image.size === 0 || image.size > 10 * 1024 * 1024) {
              setError("PNG·JPG·WebP 이미지를 10MB 이하로 선택해 주세요."); return;
            }
            setError(""); onFile(image);
          }} />
        </Button>
        {url && <Button color="error" disabled={disabled} onClick={() => { setError(""); onRemove(); }}>이미지 삭제</Button>}
        <Typography variant="caption" color="text.secondary">{file?.name || (!removed && prompt?.preview_image_filename) || "등록된 이미지 없음"}</Typography>
      </Stack>
      {(file || removed) && <Typography variant="caption" color="text.secondary">저장 버튼을 누르면 이미지 변경사항이 반영됩니다.</Typography>}
    </Stack>
  );
}
