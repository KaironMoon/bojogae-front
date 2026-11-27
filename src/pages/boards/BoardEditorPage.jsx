import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import AttachFileRoundedIcon from "@mui/icons-material/AttachFileRounded";
import EditNoteRoundedIcon from "@mui/icons-material/EditNoteRounded";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  FormControlLabel,
  MenuItem,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ko from "suneditor/src/lang/ko";
import SunEditor from "suneditor-react";
import "suneditor/dist/css/suneditor.min.css";

import { boardConfig, formatFileSize } from "@/services/board-config";
import { htmlHasText, plainTextToHtml, sanitizeBoardHtml } from "@/services/board-html";
import { boardError, getAdminBoardPost, saveBoardPost, uploadBoardImage } from "@/services/board-service";
import "./boards.css";

const EDITOR_OPTIONS = {
  height: "560px",
  minHeight: "360px",
  buttonList: [
    ["undo", "redo"],
    ["formatBlock", "fontSize"],
    ["bold", "underline", "italic", "strike"],
    ["fontColor", "hiliteColor", "removeFormat"],
    ["align", "list", "outdent", "indent"],
    ["table", "link", "image", "horizontalRule", "blockquote"],
    ["fullScreen", "showBlocks", "codeView"],
  ],
  imageFileInput: true,
  imageUrlInput: false,
  imageMultipleFile: true,
  imageAccept: ".png,.jpg,.jpeg,.webp,.gif",
  // SunEditor의 합산 용량 제한을 끄고 업로드 전에 파일별로 검사한다.
  imageUploadSizeLimit: 0,
};

const ACCEPTED_FILES = ".pdf,.jpg,.jpeg,.png,.webp,.gif,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.hwp,.hwpx,.txt,.csv,.zip";

export default function BoardEditorPage() {
  const { boardType, postId } = useParams();
  const navigate = useNavigate();
  const config = boardConfig(boardType);
  const firstCategory = useMemo(() => Object.keys(config?.categories || {})[0] || "", [config]);
  const [form, setForm] = useState({ category: firstCategory, title: "", content: "", isPinned: false });
  const [existingFiles, setExistingFiles] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(Boolean(postId));
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [editorKey, setEditorKey] = useState(0);
  const fileInputRef = useRef(null);
  const dragDepth = useRef(0);
  const [dragging, setDragging] = useState(false);
  const hasContent = htmlHasText(form.content);

  useEffect(() => {
    if (!postId) {
      setForm((current) => ({ ...current, category: firstCategory }));
      return;
    }
    getAdminBoardPost(boardType, postId).then((post) => {
      const content = post.content_format === "HTML" ? sanitizeBoardHtml(post.content) : plainTextToHtml(post.content);
      setForm({ category: post.category, title: post.title, content, isPinned: post.is_pinned });
      setEditorKey((key) => key + 1);
      setExistingFiles(post.files || []);
    }).catch((err) => setError(boardError(err))).finally(() => setLoading(false));
  }, [boardType, firstCategory, postId]);

  function addFiles(incoming) {
    if (working) return;
    const selected = Array.from(incoming || []);
    if (!selected.length) return;
    if (existingFiles.length + files.length + selected.length > 5) {
      setError("첨부파일은 기존 파일을 포함해 최대 5개까지 가능합니다.");
      return;
    }
    if (selected.some((file) => !ACCEPTED_FILES.split(",").some((extension) => file.name.toLowerCase().endsWith(extension)))) {
      setError("허용되지 않는 첨부파일 형식입니다.");
      return;
    }
    if (selected.some((file) => file.size > 100 * 1024 * 1024)) {
      setError("첨부파일은 파일당 최대 100MB까지 가능합니다.");
      return;
    }
    if (selected.some((file) => file.size === 0)) {
      setError("빈 파일은 첨부할 수 없습니다.");
      return;
    }
    setError("");
    setFiles((current) => [...current, ...selected]);
  }

  function selectFiles(event) {
    addFiles(event.target.files);
    event.target.value = "";
  }

  function dropFiles(event) {
    event.preventDefault();
    dragDepth.current = 0;
    setDragging(false);
    addFiles(event.dataTransfer.files);
  }

  function uploadImages(images, _info, uploadHandler) {
    const selected = Array.from(images);
    if (selected.some((file) => file.size > 30 * 1024 * 1024)) {
      setError("이미지는 파일당 30MB 이하만 올릴 수 있습니다.");
      return false;
    }
    Promise.all(selected.map(uploadBoardImage))
      .then((uploaded) => uploadHandler({ result: uploaded.map((item) => ({ url: item.url, name: item.name, size: item.size })) }))
      .catch((err) => {
        setError(boardError(err));
        uploadHandler();
      });
    return undefined;
  }

  async function submit(event) {
    event.preventDefault();
    if (!form.title.trim() || !hasContent) return;
    setWorking(true);
    setError("");
    try {
      const saved = await saveBoardPost(boardType, {
        category: form.category,
        title: form.title.trim(),
        content: form.content,
        contentFormat: "HTML",
        isPinned: form.isPinned,
        files,
        keptFileIds: existingFiles.map((file) => file.id),
      }, postId);
      navigate(`/admin/boards/${boardType}/${saved.id}`, { replace: true });
    } catch (err) {
      setError(boardError(err));
    } finally {
      setWorking(false);
    }
  }

  if (!config) {
    return (
      <Box className="board-workspace">
        <Alert severity="error">게시판을 찾을 수 없습니다.</Alert>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box className="board-workspace">
        <div className="board-editor-card">
          <Skeleton variant="text" width="35%" height={36} />
          <Skeleton variant="rounded" height={56} sx={{ mt: 2 }} />
          <Skeleton variant="rounded" height={360} sx={{ mt: 2 }} />
        </div>
      </Box>
    );
  }

  const cancelTarget = postId ? `/admin/boards/${boardType}/${postId}` : `/admin/boards/${boardType}`;

  return (
    <Box className={`board-workspace board-workspace--${boardType}`}>
      <header className={`board-hero board-hero--${boardType}`}>
        <div className="board-hero-main">
          <div className="board-hero-icon" aria-hidden="true">
            <EditNoteRoundedIcon sx={{ fontSize: 26 }} />
          </div>
          <div>
            <div className="board-hero-pill-row">
              <span className="board-hero-pill">{config.badgeText}</span>
              <span className="board-badge board-badge--slate">{postId ? "게시글 수정" : "새 글 작성"}</span>
            </div>
            <h1 className="board-hero-title">{config.label} {postId ? "수정" : "작성"}</h1>
            <p className="board-hero-desc">
              {boardType === "industry-news"
                ? "본문의 첫 번째 이미지가 왼쪽 썸네일로, 첫 번째 문단이 요약으로, 첫 번째 외부 링크가 원문 링크로 자동 표시됩니다."
                : boardType === "insurance-knowledge"
                  ? "본문의 첫 번째 이미지가 카드 썸네일로, 본문 앞부분이 카드 요약으로 자동 표시됩니다."
                  : "제목과 본문 앞부분이 공지사항 목록에 깔끔하게 요약되어 표시됩니다."}
            </p>
          </div>
        </div>
        <div className="board-hero-actions">
          <Button component={Link} to={cancelTarget} variant="outlined" startIcon={<ArrowBackRoundedIcon />}>
            돌아가기
          </Button>
        </div>
      </header>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box component="form" onSubmit={submit} className="board-editor-card">
        <Stack spacing={2.5}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              select
              required
              label="분류"
              value={form.category}
              disabled={working}
              sx={{ minWidth: { sm: 240 } }}
              onChange={(event) => setForm({ ...form, category: event.target.value })}
            >
              {Object.entries(config.categories).map(([value, label]) => (
                <MenuItem key={value} value={value}>{label}</MenuItem>
              ))}
            </TextField>
            <TextField
              required
              fullWidth
              label="제목"
              value={form.title}
              disabled={working}
              inputProps={{ maxLength: 200 }}
              helperText={`${form.title.length} / 200자`}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
            />
          </Stack>

          <Box>
            <Typography variant="subtitle2" fontWeight={750} sx={{ mb: 1 }}>내용 *</Typography>
            <SunEditor
              key={editorKey}
              lang={ko}
              defaultValue={form.content}
              disable={working}
              setOptions={EDITOR_OPTIONS}
              onChange={(content) => setForm((current) => ({ ...current, content }))}
              onImageUploadBefore={uploadImages}
            />
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
              본문 이미지: PNG, JPG, WEBP, GIF · 파일당 30MB 이하
            </Typography>
          </Box>

          <Box sx={{ px: 2, py: 1, borderRadius: "12px", bgcolor: "#f8fafc", border: "1px solid #e2e8f0" }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={form.isPinned}
                  disabled={working}
                  onChange={(event) => setForm({ ...form, isPinned: event.target.checked })}
                />
              }
              label={<Typography fontSize={14} fontWeight={700}>목록 상단에 고정</Typography>}
            />
          </Box>

          {existingFiles.length > 0 && (
            <Box>
              <Typography variant="subtitle2" fontWeight={750} sx={{ mb: 1 }}>기존 첨부파일</Typography>
              <Stack direction="row" gap={1} flexWrap="wrap">
                {existingFiles.map((file) => (
                  <Chip
                    key={file.id}
                    label={`${file.original_filename}${file.size_bytes ? ` (${formatFileSize(file.size_bytes)})` : ""}`}
                    onDelete={working ? undefined : () => setExistingFiles((items) => items.filter((item) => item.id !== file.id))}
                  />
                ))}
              </Stack>
            </Box>
          )}

          <Box>
            <input ref={fileInputRef} hidden multiple type="file" accept={ACCEPTED_FILES} disabled={working} onChange={selectFiles} />
            <Box
              component="button"
              type="button"
              disabled={working}
              aria-describedby="board-attachment-help"
              onClick={() => fileInputRef.current?.click()}
              onDragEnter={(event) => {
                event.preventDefault();
                dragDepth.current += 1;
                if (!working) setDragging(true);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = working ? "none" : "copy";
              }}
              onDragLeave={(event) => {
                event.preventDefault();
                dragDepth.current = Math.max(0, dragDepth.current - 1);
                if (dragDepth.current === 0) setDragging(false);
              }}
              onDrop={dropFiles}
              sx={{
                width: "100%",
                p: 3,
                border: "2px dashed",
                borderRadius: "14px",
                borderColor: dragging ? "primary.main" : "#cbd5e1",
                bgcolor: dragging ? "action.hover" : "#f8fafc",
                color: "text.secondary",
                font: "inherit",
                cursor: working ? "default" : "pointer",
                opacity: working ? 0.5 : 1,
                "&:hover": working ? {} : { borderColor: "primary.main", bgcolor: "#f0fdf4" },
                "&:focus-visible": { outline: "2px solid", outlineColor: "primary.main", outlineOffset: 2 },
              }}
            >
              <AttachFileRoundedIcon sx={{ fontSize: 30, mb: 0.75, color: "#006e43" }} />
              <Typography component="span" sx={{ display: "block", fontWeight: 700, color: "#121314" }}>
                {dragging ? "여기에 파일을 놓으세요" : "파일을 끌어다 놓거나 클릭하여 첨부하세요"}
              </Typography>
              <Typography component="span" variant="caption" id="board-attachment-help" sx={{ display: "block", mt: 0.75 }}>
                기존 첨부 포함 최대 5개 · 파일당 100MB · 현재 {existingFiles.length + files.length}개
              </Typography>
            </Box>
            {files.length > 0 && (
              <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mt: 1.25 }}>
                {files.map((file, index) => (
                  <Chip
                    key={`${file.name}-${index}`}
                    label={`${file.name} (${formatFileSize(file.size)})`}
                    onDelete={working ? undefined : () => setFiles((items) => items.filter((_, itemIndex) => itemIndex !== index))}
                  />
                ))}
              </Stack>
            )}
          </Box>

          <Stack direction="row" justifyContent="flex-end" spacing={1}>
            <Button component={Link} to={cancelTarget} variant="outlined" disabled={working}>취소</Button>
            <Button type="submit" variant="contained" disabled={working || !form.title.trim() || !hasContent}>
              {working ? "저장 중…" : "저장"}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
}
