import AttachFileRoundedIcon from "@mui/icons-material/AttachFileRounded";
import {
  Alert, Box, Button, Checkbox, Chip, FormControlLabel, MenuItem, Paper,
  Stack, TextField, Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { boardConfig } from "@/services/board-config";
import { boardError, getAdminBoardPost, saveBoardPost } from "@/services/board-service";


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

  useEffect(() => {
    if (!postId) {
      setForm(current => ({ ...current, category: firstCategory }));
      return;
    }
    getAdminBoardPost(boardType, postId).then(post => {
      setForm({ category: post.category, title: post.title, content: post.content, isPinned: post.is_pinned });
      setExistingFiles(post.files || []);
    }).catch(err => setError(boardError(err))).finally(() => setLoading(false));
  }, [boardType, firstCategory, postId]);

  function selectFiles(event) {
    const selected = Array.from(event.target.files || []);
    if (existingFiles.length + selected.length > 5) {
      setError("첨부파일은 기존 파일을 포함해 최대 5개까지 가능합니다.");
      event.target.value = "";
      return;
    }
    setError("");
    setFiles(selected);
  }

  async function submit(event) {
    event.preventDefault();
    if (!form.title.trim() || !form.content.trim()) return;
    setWorking(true);
    setError("");
    try {
      const saved = await saveBoardPost(boardType, {
        category: form.category,
        title: form.title.trim(),
        content: form.content.trim(),
        isPinned: form.isPinned,
        files,
        keptFileIds: existingFiles.map(file => file.id),
      }, postId);
      navigate(`/admin/boards/${boardType}/${saved.id}`, { replace: true });
    } catch (err) {
      setError(boardError(err));
    } finally {
      setWorking(false);
    }
  }

  if (!config) return <Alert severity="error">게시판을 찾을 수 없습니다.</Alert>;
  if (loading) return <Box sx={{ p: 4 }}><Typography color="text.secondary">게시글을 불러오는 중입니다.</Typography></Box>;

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 900, mx: "auto" }}>
      <Typography variant="h4" fontWeight={800} sx={{ mb: 3 }}>{config.label} {postId ? "수정" : "작성"}</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Paper component="form" onSubmit={submit} variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
        <Stack spacing={2.5}>
          <TextField select required label="분류" value={form.category} disabled={working} onChange={event => setForm({ ...form, category: event.target.value })}>
            {Object.entries(config.categories).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
          </TextField>
          <TextField required label="제목" value={form.title} disabled={working} inputProps={{ maxLength: 200 }} onChange={event => setForm({ ...form, title: event.target.value })} />
          <TextField required multiline minRows={14} label="내용" value={form.content} disabled={working} inputProps={{ maxLength: 50000 }} onChange={event => setForm({ ...form, content: event.target.value })} />
          <FormControlLabel control={<Checkbox checked={form.isPinned} disabled={working} onChange={event => setForm({ ...form, isPinned: event.target.checked })} />} label="목록 상단에 고정" />
          {existingFiles.length > 0 && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>기존 첨부파일</Typography>
              <Stack direction="row" gap={1} flexWrap="wrap">
                {existingFiles.map(file => <Chip key={file.id} label={file.original_filename} onDelete={working ? undefined : () => setExistingFiles(items => items.filter(item => item.id !== file.id))} />)}
              </Stack>
            </Box>
          )}
          <Box>
            <Button component="label" variant="outlined" startIcon={<AttachFileRoundedIcon />} disabled={working || existingFiles.length >= 5}>
              첨부파일 선택
              <input hidden multiple type="file" accept={ACCEPTED_FILES} onChange={selectFiles} />
            </Button>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>최대 5개, 파일당 10MB</Typography>
            {files.length > 0 && <Typography variant="body2" sx={{ mt: 1 }}>새 파일: {files.map(file => file.name).join(", ")}</Typography>}
          </Box>
          <Stack direction="row" justifyContent="flex-end" spacing={1}>
            <Button component={Link} to={postId ? `/admin/boards/${boardType}/${postId}` : `/admin/boards/${boardType}`} disabled={working}>취소</Button>
            <Button type="submit" variant="contained" disabled={working || !form.title.trim() || !form.content.trim()}>{working ? "저장 중…" : "저장"}</Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
}
