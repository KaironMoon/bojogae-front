/* eslint-disable react/prop-types */
import PreviewImageCarousel from "@/pages/components/PreviewImageCarousel";
import { Alert, Box, Button, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { MAX_PREVIEW_IMAGES, promptPreviewImageUrl } from "@/services/prompt-service";

export default function PreviewImageEditor({ prompt, file, removed, disabled, onFile, onRemove }) {
  const [localUrls, setLocalUrls] = useState([]);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const files = file || [];
  const existing = (prompt?.preview_images?.length ? prompt.preview_images : prompt?.preview_image_available
    ? [{ id: "legacy", filename: prompt.preview_image_filename }] : []).filter((image) => !(removed || []).includes(image.id));
  useEffect(() => {
    const urls = (file || []).map((image) => URL.createObjectURL(image));
    setLocalUrls(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [file]);
  useEffect(() => { setError(""); }, [prompt?.id]);
  const slides = [...existing.map((image) => ({ ...image, url: promptPreviewImageUrl(prompt.id, prompt.preview_image_revision, image.id) })),
    ...files.map((image, position) => ({ filename: image.name, url: localUrls[position], position }))];
  const addFiles = (selection) => {
    if (disabled) return;
    const added = Array.from(selection || []);
    if (!added.length) return;
    if (slides.length + added.length > MAX_PREVIEW_IMAGES) { setError(`이미지는 최대 ${MAX_PREVIEW_IMAGES}장까지 등록할 수 있습니다.`); return; }
    if (added.some((image) => !["image/png", "image/jpeg", "image/webp"].includes(image.type) || !image.size || image.size > 10 * 1024 * 1024)) {
      setError("PNG·JPG·WebP 이미지를 장당 10MB 이하로 선택해 주세요."); return;
    }
    setError(""); onFile([...files, ...added]);
  };
  return (
    <Stack spacing={1.25}>
      <Typography variant="subtitle2" fontWeight={750}>결과 미리보기 이미지 (선택)</Typography>
      <Typography variant="body2" color="text.secondary">이미지 없이도 저장할 수 있습니다. PNG·JPG·WebP 최대 {MAX_PREVIEW_IMAGES}장, 장당 10MB.</Typography>
      {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
      <Box onDragEnter={(event) => { event.preventDefault(); if (!disabled) setDragging(true); }}
        onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = disabled ? "none" : "copy"; }}
        onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false); }}
        onDrop={(event) => { event.preventDefault(); setDragging(false); addFiles(event.dataTransfer.files); }}
        sx={{ p: 2, border: "2px dashed", borderColor: dragging ? "primary.main" : "divider", bgcolor: dragging ? "action.hover" : "grey.50", borderRadius: 2, opacity: disabled ? 0.6 : 1 }}>
        <Stack spacing={1.5} alignItems="center">
          <Typography color="text.secondary">이미지를 여기에 드래그앤드롭하거나 파일을 선택해 주세요.</Typography>
          <Button component="label" variant="outlined" disabled={disabled || slides.length >= MAX_PREVIEW_IMAGES}>이미지 추가
            <input hidden multiple type="file" accept="image/png,image/jpeg,image/webp" disabled={disabled || slides.length >= MAX_PREVIEW_IMAGES}
              onChange={(event) => { addFiles(event.target.files); event.target.value = ""; }} />
          </Button>
        </Stack>
      </Box>
      {slides.length > 0 && <Box sx={{ height: "clamp(220px, calc(100dvh - 330px), 640px)", minHeight: 0 }}>
        <PreviewImageCarousel key={prompt?.id || "new"} slides={slides} disabled={disabled}
          onRemove={(slide) => { setError(""); if (slide.id) onRemove(slide.id); else onFile(files.filter((_, position) => position !== slide.position)); }} />
      </Box>}
      {(files.length > 0 || removed?.length > 0) && <Typography variant="caption" color="text.secondary">저장 버튼을 누르면 이미지 변경사항이 반영됩니다.</Typography>}
    </Stack>
  );
}
