import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import FileDropZone from "@/pages/components/FileDropZone";
import {
  formatTalkFileSize,
  formatTalkReleaseDate,
  listTalkReleases,
  saveTalkRelease,
  talkReleaseError,
  talkReleaseFiles,
} from "@/services/talk-releases";
import {
  AdminEmptyState,
  AdminPageContainer,
  AdminPageHeader,
  AdminStatCard,
  AdminStatGrid,
} from "./components/AdminPageShell";

const EMPTY = { version: "", notes: "", is_public: false, installer: null, portable: null };
const MAX_FILE_BYTES = 50 * 1024 * 1024;

export default function TalkReleasesPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [items, setItems] = useState(null);
  const [draft, setDraft] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    listTalkReleases({ admin: true, signal: controller.signal })
      .then(setItems)
      .catch((err) => { if (!controller.signal.aborted) setError(talkReleaseError(err)); });
    return () => controller.abort();
  }, []);

  const update = (field, value) => setDraft((current) => ({ ...current, [field]: value }));

  function reset(item = null, open = false) {
    setEditing(item);
    setDraft(item ? { ...EMPTY, version: item.version, notes: item.notes, is_public: item.is_public } : EMPTY);
    setDialogOpen(open);
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
      setItems((current) => [saved, ...(current || []).filter((item) => item.id !== saved.id)]);
      reset();
      setMessage(`${saved.version} 버전을 ${saved.is_public ? "공개했습니다." : "비공개로 저장했습니다."}`);
    } catch (err) {
      setError(talkReleaseError(err));
    } finally {
      setBusy(false);
    }
  }

  async function toggleVisibility(item) {
    if (busy) return;
    setBusy(true);
    setTogglingId(item.id);
    setError("");
    setMessage("");
    try {
      const saved = await saveTalkRelease({ notes: item.notes, is_public: !item.is_public }, item.id);
      setItems((current) => current.map((release) => (release.id === saved.id ? saved : release)));
      setEditing((current) => (current?.id === saved.id ? saved : current));
      if (editing?.id === saved.id) setDraft((current) => ({ ...current, is_public: saved.is_public }));
      setMessage(`${saved.version} 버전을 ${saved.is_public ? "공개했습니다." : "비공개로 전환했습니다."}`);
    } catch (err) {
      setError(talkReleaseError(err));
    } finally {
      setTogglingId(null);
      setBusy(false);
    }
  }

  const publicCount = (items || []).filter((item) => item.is_public).length;

  return (
    <AdminPageContainer maxWidth={1120}>
      <AdminPageHeader
        icon={ChatBubbleOutlineRoundedIcon}
        badge={items ? `총 ${items.length}개` : undefined}
        title="보조개톡 배포 관리"
        description="보조개톡 설치 파일과 무설치형 패키지를 등록하고 사용자 공개 여부를 제어합니다."
        actions={(
          <>
            <Button component={Link} to="/talk/download" size="small" variant="outlined" endIcon={<OpenInNewRoundedIcon />}>
              다운로드 페이지 보기
            </Button>
            <Button variant="contained" size="small" startIcon={<AddRoundedIcon />} onClick={() => reset(null, true)}>
              새 버전 등록
            </Button>
          </>
        )}
      />

      {error && <Alert severity="error" onClose={() => setError("")} sx={{ mb: 2, borderRadius: 2.5 }}>{error}</Alert>}
      {message && <Alert severity="success" onClose={() => setMessage("")} sx={{ mb: 2, borderRadius: 2.5 }}>{message}</Alert>}

      {items && (
        <AdminStatGrid columns={{ xs: "repeat(3, 1fr)" }}>
          <AdminStatCard label="전체 버전" value={`${items.length}개`} />
          <AdminStatCard label="공개 중" value={`${publicCount}개`} color="#059669" bg="#ECFDF5" />
          <AdminStatCard label="비공개" value={`${items.length - publicCount}개`} color="#64748B" bg="#F1F5F9" />
        </AdminStatGrid>
      )}

      {!items && !error ? (
        <Box sx={{ py: 8, display: "grid", placeItems: "center" }}><CircularProgress /></Box>
      ) : items?.length === 0 ? (
        <AdminEmptyState
          icon={ChatBubbleOutlineRoundedIcon}
          title="등록된 버전이 없습니다."
          description="새 버전을 등록하면 설계사 다운로드 페이지에 제공됩니다."
          action={<Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => reset(null, true)}>새 버전 등록</Button>}
        />
      ) : (
        <Paper variant="outlined" sx={{ p: { xs: 1.75, sm: 2.5 }, borderRadius: 3, bgcolor: "#FFFFFF" }}>
          <Typography component="h2" variant="h6" fontWeight={850} sx={{ mb: 2 }}>등록된 버전</Typography>
          <Stack divider={<Divider />} spacing={2}>
            {items?.map((item) => (
              <Stack key={item.id} direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} gap={1.5}>
                <Stack spacing={0.5} sx={{ minWidth: 0, overflowWrap: "anywhere" }}>
                  <Stack direction="row" alignItems="center" flexWrap="wrap" gap={1}>
                    <Typography variant="subtitle1" fontWeight={850}>{item.version}</Typography>
                    <Chip size="small" label={item.is_public ? "공개 중" : "비공개"} color={item.is_public ? "success" : "default"} sx={{ fontWeight: 750 }} />
                    <Typography variant="caption" color="text.secondary">
                      {item.published_at ? `첫 공개 ${formatTalkReleaseDate(item.published_at)}` : `등록 ${formatTalkReleaseDate(item.created_at)}`}
                    </Typography>
                  </Stack>
                  {item.notes && (
                    <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-wrap" }}>{item.notes}</Typography>
                  )}
                  <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ pt: 0.25 }}>
                    {talkReleaseFiles.map(({ kind, label }) => (
                      <Chip
                        key={kind}
                        size="small"
                        variant="outlined"
                        label={`${label}: ${item.files[kind].filename} (${formatTalkFileSize(item.files[kind].size)})`}
                      />
                    ))}
                  </Stack>
                </Stack>
                <Stack direction="row" spacing={1} sx={{ flexShrink: 0, alignSelf: { xs: "flex-end", sm: "center" } }}>
                  <Button
                    size="small"
                    variant="outlined"
                    disabled={busy}
                    aria-label={`${item.version} ${item.is_public ? "비공개로 전환" : "공개하기"}`}
                    onClick={() => toggleVisibility(item)}
                  >
                    {togglingId === item.id ? "변경 중…" : item.is_public ? "비공개 전환" : "공개하기"}
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<EditOutlinedIcon />}
                    disabled={busy}
                    aria-label={`${item.version} 수정`}
                    onClick={() => {
                      setError("");
                      setMessage("");
                      reset(item, true);
                    }}
                  >
                    수정
                  </Button>
                </Stack>
              </Stack>
            ))}
          </Stack>
        </Paper>
      )}

      <Dialog open={dialogOpen} onClose={() => !busy && reset()} fullWidth maxWidth="md" fullScreen={isMobile}>
        <Box component="form" id="talk-release-form" onSubmit={save}>
          <DialogTitle fontWeight={850}>{editing ? `${editing.version} 버전 수정` : "새 버전 등록"}</DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2}>
              {error && <Alert severity="error">{error}</Alert>}
              <TextField
                size="small"
                label="버전"
                required
                value={draft.version}
                disabled={busy || Boolean(editing)}
                inputProps={{ maxLength: 64, pattern: "[A-Za-z0-9][A-Za-z0-9._\\-]{0,63}" }}
                helperText="예시 1.0.0 또는 2026-11-15-120000"
                onChange={(event) => update("version", event.target.value)}
              />
              <TextField
                size="small"
                label="변경 내용"
                value={draft.notes}
                disabled={busy}
                multiline
                minRows={3}
                inputProps={{ maxLength: 4000 }}
                onChange={(event) => update("notes", event.target.value)}
              />
              <Stack direction={{ xs: "column", sm: "row" }} gap={2}>
                {talkReleaseFiles.map(({ kind, label, extension }) => (
                  <Stack key={kind} spacing={0.75} sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle2" fontWeight={750}>{label} ({extension})</Typography>
                    {editing ? (
                      <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, bgcolor: "#F8FAFC" }}>
                        <Typography variant="body2" sx={{ overflowWrap: "anywhere" }}>{editing.files[kind].filename}</Typography>
                      </Paper>
                    ) : (
                      <FileDropZone
                        label={`${label} (${extension})`}
                        accept={`.${extension.toLowerCase()}`}
                        maxSizeLabel="50 MiB"
                        filename={draft[kind]?.name}
                        disabled={busy}
                        onFiles={(files) => selectFile(files, kind, label, `.${extension.toLowerCase()}`)}
                      />
                    )}
                  </Stack>
                ))}
              </Stack>
              <Typography variant="caption" color="text.secondary">
                {editing ? "배포 파일을 바꾸려면 새 버전을 등록해 주세요." : "무설치형 ZIP에는 bojogaetalk.exe와 support 폴더를 함께 넣어 주세요."}
              </Typography>
              <FormControlLabel
                label="다운로드 페이지에 공개"
                control={<Switch color="success" checked={draft.is_public} disabled={busy} onChange={(event) => update("is_public", event.target.checked)} />}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button disabled={busy} onClick={() => reset()}>취소</Button>
            <Button type="submit" variant="contained" disabled={busy || (!editing && (!draft.installer || !draft.portable || !draft.version))}>
              {busy && togglingId === null ? "저장 중…" : "저장"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </AdminPageContainer>
  );
}
