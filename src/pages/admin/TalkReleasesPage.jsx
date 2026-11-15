import { Alert, Button, Checkbox, Chip, Divider, FormControlLabel, Paper, Stack, TextField, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import FileDropZone from "@/pages/components/FileDropZone";
import {
  formatTalkFileSize, formatTalkReleaseDate, listTalkReleases, saveTalkRelease, talkReleaseError, talkReleaseFiles,
} from "@/services/talk-releases";

const EMPTY = { version: "", notes: "", is_public: false, installer: null, portable: null };
const MAX_FILE_BYTES = 50 * 1024 * 1024;
const panel = { p: { xs: 2, sm: 3 }, borderRadius: 3 };

export default function TalkReleasesPage() {
  const [items, setItems] = useState(null);
  const [draft, setDraft] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    listTalkReleases({ admin: true, signal: controller.signal })
      .then(setItems)
      .catch(err => { if (!controller.signal.aborted) setError(talkReleaseError(err)); });
    return () => controller.abort();
  }, []);

  const update = (field, value) => setDraft(current => ({ ...current, [field]: value }));

  function reset(item = null) {
    setEditing(item);
    setDraft(item ? { ...EMPTY, version: item.version, notes: item.notes, is_public: item.is_public } : EMPTY);
  }

  function selectFile(files, kind, label, extension) {
    if (!files.length) return;
    const file = files[0];
    if (files.length !== 1 || !file.name.toLowerCase().endsWith(extension)) {
      setError(`${label} ${extension} 파일을 한 개 선택해 주세요.`);
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError("파일당 최대 50 MiB까지 등록할 수 있습니다.");
      return;
    }
    setError("");
    setMessage("");
    update(kind, file);
  }

  async function save(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);
    try {
      const saved = await saveTalkRelease(draft, editing?.id);
      setItems(current => [saved, ...(current || []).filter(item => item.id !== saved.id)]);
      reset();
      setMessage(`${saved.version} 버전을 ${saved.is_public ? "공개했습니다." : "비공개로 저장했습니다."}`);
    } catch (err) {
      setError(talkReleaseError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Stack spacing={2.5} sx={{ p: { xs: 2, md: 4 }, maxWidth: 1000, mx: "auto" }}>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} gap={1}>
        <Typography component="h1" variant="h4" fontWeight={800}>보조개톡 배포 관리</Typography>
        <Button component={Link} to="/talk/download" variant="outlined" sx={{ alignSelf: { xs: "flex-start", sm: "center" } }}>다운로드 페이지 보기</Button>
      </Stack>
      {error && <Alert severity="error">{error}</Alert>}
      {message && <Alert severity="success">{message}</Alert>}
      <Paper component="form" id="talk-release-form" onSubmit={save} variant="outlined" sx={panel}>
        <Stack spacing={2}>
          <Typography component="h2" variant="h6" fontWeight={750}>{editing ? `${editing.version} 버전 수정` : "새 버전 등록"}</Typography>
          <TextField label="버전" required value={draft.version} disabled={busy || Boolean(editing)}
            inputProps={{ maxLength: 64, pattern: "[A-Za-z0-9][A-Za-z0-9._\\-]{0,63}" }}
            helperText="예시 1.0.0 또는 2026-11-15-120000"
            onChange={event => update("version", event.target.value)} />
          <TextField label="변경 내용" value={draft.notes} disabled={busy}
            multiline minRows={3} inputProps={{ maxLength: 4000 }}
            onChange={event => update("notes", event.target.value)} />
          <Stack direction={{ xs: "column", sm: "row" }} gap={2}>
            {talkReleaseFiles.map(({ kind, label, extension }) => (
              <Stack key={kind} spacing={0.75} sx={{ flex: 1, minWidth: 0 }}>
                <Typography fontWeight={700}>{label} ({extension})</Typography>
                {editing
                  ? <Typography variant="body2" sx={{ overflowWrap: "anywhere" }}>{editing.files[kind].filename}</Typography>
                  : <FileDropZone label={`${label} (${extension})`} accept={`.${extension.toLowerCase()}`}
                    maxSizeLabel="50 MiB" filename={draft[kind]?.name} disabled={busy}
                    onFiles={files => selectFile(files, kind, label, `.${extension.toLowerCase()}`)} />}
              </Stack>
            ))}
          </Stack>
          <Typography variant="body2" color="text.secondary">
            {editing ? "배포 파일을 바꾸려면 새 버전을 등록해 주세요." : "무설치형 ZIP에는 bojogaetalk.exe와 support 폴더를 함께 넣어 주세요."}
          </Typography>
          <FormControlLabel label="다운로드 페이지에 공개" control={
            <Checkbox checked={draft.is_public} disabled={busy} onChange={event => update("is_public", event.target.checked)} />
          } />
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            {editing && <Button disabled={busy} onClick={() => reset()}>취소</Button>}
            <Button type="submit" variant="contained" disabled={busy || (!editing && (!draft.installer || !draft.portable || !draft.version))}>
              {busy ? "저장 중…" : "저장"}
            </Button>
          </Stack>
        </Stack>
      </Paper>
      <Paper variant="outlined" sx={panel}>
        <Typography component="h2" variant="h6" fontWeight={750} sx={{ mb: 2 }}>등록된 버전</Typography>
        {!items && !error && <Typography role="status">불러오는 중…</Typography>}
        {items?.length === 0 && <Typography color="text.secondary">등록된 버전이 없습니다.</Typography>}
        <Stack divider={<Divider />} spacing={1.5}>
          {items?.map(item => (
            <Stack key={item.id} direction="row" justifyContent="space-between" alignItems="center" gap={1}>
              <Stack spacing={0.5} sx={{ minWidth: 0, overflowWrap: "anywhere" }}>
                <Stack direction="row" alignItems="center" flexWrap="wrap" gap={1}>
                  <Typography fontWeight={750}>{item.version}</Typography>
                  <Chip size="small" label={item.is_public ? "공개" : "비공개"} color={item.is_public ? "success" : "default"} />
                </Stack>
                <Typography variant="body2" color="text.secondary">{item.published_at ? `첫 공개 ${formatTalkReleaseDate(item.published_at)}` : `등록 ${formatTalkReleaseDate(item.created_at)}`}</Typography>
                {talkReleaseFiles.map(({ kind, label }) => <Typography key={kind} variant="body2">
                  {label} · {item.files[kind].filename} · {formatTalkFileSize(item.files[kind].size)}
                </Typography>)}
              </Stack>
              <Button disabled={busy} aria-label={`${item.version} 수정`} onClick={() => {
                reset(item);
                setError("");
                setMessage("");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}>수정</Button>
            </Stack>
          ))}
        </Stack>
      </Paper>
    </Stack>
  );
}
