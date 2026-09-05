import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Drawer,
  FormControlLabel,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Pagination,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import RestoreRoundedIcon from "@mui/icons-material/RestoreRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useBlocker } from "react-router-dom";

import {
  createPrompt,
  deletePrompt,
  deletePromptVersion,
  getPrompt,
  getPrompts,
  getPromptVersions,
  recoverPrompt,
  recoverPromptVersion,
  restorePromptVersion,
  updatePrompt,
} from "@/services/prompt-service";


const EMPTY_PROMPT = { title: "", body: "" };

function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function PromptsPage() {
  const [prompts, setPrompts] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [draft, setDraft] = useState(EMPTY_PROMPT);
  const [versions, setVersions] = useState([]);
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [includeDeletedVersions, setIncludeDeletedVersions] = useState(false);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [viewVersion, setViewVersion] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [listPage, setListPage] = useState(1);
  const [listTotalPages, setListTotalPages] = useState(0);

  const isNew = selectedId === "new";
  const isDirty = useMemo(() => {
    if (isNew) return Boolean(draft.title || draft.body);
    if (!selectedPrompt || selectedPrompt.is_deleted) return false;
    return draft.title !== selectedPrompt.title || draft.body !== selectedPrompt.body;
  }, [draft, isNew, selectedPrompt]);

  const blocker = useBlocker(
    useCallback(
      ({ currentLocation, nextLocation }) =>
        isDirty && currentLocation.pathname !== nextLocation.pathname,
      [isDirty],
    ),
  );

  useEffect(() => {
    if (blocker.state !== "blocked") return;
    if (window.confirm("저장하지 않은 변경사항이 있습니다. 페이지를 이동할까요?")) {
      blocker.proceed();
    } else {
      blocker.reset();
    }
  }, [blocker]);

  useEffect(() => {
    const warnBeforeUnload = (event) => {
      if (!isDirty) return;
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [isDirty]);

  const loadVersions = useCallback(async (promptId, showDeleted) => {
    const rows = await getPromptVersions(promptId, showDeleted);
    setVersions(rows);
  }, []);

  const loadDetail = useCallback(
    async (promptId, showDeletedVersions = includeDeletedVersions) => {
      setDetailLoading(true);
      setError("");
      try {
        const [prompt, versionRows] = await Promise.all([
          getPrompt(promptId),
          getPromptVersions(promptId, showDeletedVersions),
        ]);
        setSelectedId(promptId);
        setSelectedPrompt(prompt);
        setDraft({ title: prompt.title, body: prompt.body });
        setVersions(versionRows);
      } catch {
        setError("프롬프트를 불러오지 못했습니다.");
      } finally {
        setDetailLoading(false);
      }
    },
    [includeDeletedVersions],
  );

  const loadList = useCallback(
    async (preferredId = selectedId, targetPage = 1) => {
      setLoading(true);
      setError("");
      try {
        const result = await getPrompts(includeDeleted, targetPage, 20);
        const rows = result.items;
        setPrompts(rows);
        setListPage(result.page);
        setListTotalPages(result.total_pages);
        const nextId = rows.some((row) => row.id === preferredId)
          ? preferredId
          : rows[0]?.id ?? null;
        if (nextId) {
          await loadDetail(nextId);
        } else if (preferredId !== "new") {
          setSelectedId(null);
          setSelectedPrompt(null);
          setDraft(EMPTY_PROMPT);
          setVersions([]);
        }
      } catch {
        setError("프롬프트 목록을 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    },
    [includeDeleted, loadDetail, selectedId],
  );

  useEffect(() => {
    setListPage(1);
    loadList(selectedId, 1);
    // 삭제 항목 표시 조건이 바뀔 때만 목록을 새로 불러온다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [includeDeleted]);

  useEffect(() => {
    if (!selectedPrompt) return;
    loadVersions(selectedPrompt.id, includeDeletedVersions).catch(() => {
      setError("버전 기록을 불러오지 못했습니다.");
    });
  }, [includeDeletedVersions, loadVersions, selectedPrompt]);

  const canLeaveDraft = () =>
    !isDirty || window.confirm("저장하지 않은 변경사항을 버릴까요?");

  const selectPrompt = (promptId) => {
    if (promptId === selectedId || !canLeaveDraft()) return;
    loadDetail(promptId);
  };

  const startNewPrompt = () => {
    if (!canLeaveDraft()) return;
    setSelectedId("new");
    setSelectedPrompt(null);
    setDraft(EMPTY_PROMPT);
    setVersions([]);
    setError("");
  };

  const savePrompt = async () => {
    const title = draft.title.trim();
    if (!title || !draft.body.trim()) {
      setError("제목과 본문을 모두 입력해 주세요.");
      return;
    }
    setWorking(true);
    setError("");
    try {
      const saved = isNew
        ? await createPrompt(title, draft.body)
        : await updatePrompt(selectedPrompt.id, title, draft.body);
      setSelectedPrompt(saved);
      setSelectedId(saved.id);
      setDraft({ title: saved.title, body: saved.body });
      await Promise.all([
        loadVersions(saved.id, includeDeletedVersions),
        loadList(saved.id, listPage),
      ]);
    } catch {
      setError("프롬프트를 저장하지 못했습니다.");
    } finally {
      setWorking(false);
    }
  };

  const runConfirmedAction = async () => {
    const action = confirmAction;
    if (!action) return;
    setConfirmAction(null);
    setWorking(true);
    setError("");
    try {
      if (action.type === "delete-prompt") {
        await deletePrompt(selectedPrompt.id);
        await loadList(includeDeleted ? selectedPrompt.id : null, listPage);
      } else if (action.type === "delete-version") {
        await deletePromptVersion(selectedPrompt.id, action.version.id);
        await loadVersions(selectedPrompt.id, includeDeletedVersions);
      } else if (action.type === "restore-version") {
        const restored = await restorePromptVersion(
          selectedPrompt.id,
          action.version.id,
        );
        setSelectedPrompt(restored);
        setDraft({ title: restored.title, body: restored.body });
        await Promise.all([
          loadVersions(restored.id, includeDeletedVersions),
          loadList(restored.id, listPage),
        ]);
      }
    } catch (requestError) {
      const detail = requestError?.response?.data?.detail;
      setError(
        detail === "current_version_cannot_be_deleted"
          ? "현재 사용 중인 버전은 삭제할 수 없습니다."
          : "요청을 처리하지 못했습니다.",
      );
    } finally {
      setWorking(false);
    }
  };

  const handleRecoverPrompt = async () => {
    setWorking(true);
    setError("");
    try {
      const recovered = await recoverPrompt(selectedPrompt.id);
      setSelectedPrompt(recovered);
      setDraft({ title: recovered.title, body: recovered.body });
      await loadList(recovered.id, listPage);
    } catch {
      setError("프롬프트를 복구하지 못했습니다.");
    } finally {
      setWorking(false);
    }
  };

  const handleRecoverVersion = async (version) => {
    setWorking(true);
    setError("");
    try {
      await recoverPromptVersion(selectedPrompt.id, version.id);
      await loadVersions(selectedPrompt.id, includeDeletedVersions);
    } catch {
      setError("버전을 복구하지 못했습니다.");
    } finally {
      setWorking(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1600, mx: "auto" }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
        gap={2}
        sx={{ mb: 3 }}
      >
        <div>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            프롬프트 관리
          </Typography>
          <Typography color="text.secondary">
            프롬프트를 작성하고 저장된 버전을 관리합니다.
          </Typography>
        </div>
        <Button
          variant="contained"
          startIcon={<AddRoundedIcon />}
          onClick={startNewPrompt}
        >
          새 프롬프트
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" onClose={() => setError("")} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "340px minmax(0, 1fr)" },
          gap: 2,
          alignItems: "start",
        }}
      >
        <Paper variant="outlined" sx={{ borderRadius: 3, overflow: "hidden" }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2, py: 1.5 }}>
            <Typography sx={{ fontWeight: 750 }}>프롬프트 목록</Typography>
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={includeDeleted}
                  onChange={(event) => setIncludeDeleted(event.target.checked)}
                />
              }
              label="삭제 포함"
              slotProps={{ typography: { variant: "caption" } }}
              sx={{ mr: 0 }}
            />
          </Stack>
          <Divider />
          {loading ? (
            <Box sx={{ py: 8, display: "grid", placeItems: "center" }}>
              <CircularProgress size={28} />
            </Box>
          ) : (
            <List disablePadding sx={{ maxHeight: { lg: "calc(100vh - 280px)" }, overflowY: "auto" }}>
              {isNew && (
                <ListItemButton selected>
                  <ListItemText primary="새 프롬프트" secondary="저장 전" />
                </ListItemButton>
              )}
              {prompts.map((prompt) => (
                <ListItemButton
                  key={prompt.id}
                  selected={selectedId === prompt.id}
                  onClick={() => selectPrompt(prompt.id)}
                  sx={{ py: 1.5, opacity: prompt.is_deleted ? 0.62 : 1 }}
                >
                  <ListItemText
                    primary={
                      <Stack direction="row" gap={1} alignItems="center">
                        <Typography noWrap sx={{ fontWeight: 650, flex: 1 }}>
                          {prompt.title}
                        </Typography>
                        {prompt.is_deleted && <Chip label="삭제됨" size="small" />}
                      </Stack>
                    }
                    secondary={`v${prompt.current_version_no} · ${formatDate(prompt.updated_at)}`}
                  />
                </ListItemButton>
              ))}
              {!isNew && prompts.length === 0 && (
                <Typography color="text.secondary" variant="body2" sx={{ p: 3, textAlign: "center" }}>
                  등록된 프롬프트가 없습니다.
                </Typography>
              )}
            </List>
          )}
          {listTotalPages > 1 && (
            <>
              <Divider />
              <Box sx={{ p: 1.5, display: "flex", justifyContent: "center" }}>
                <Pagination
                  size="small"
                  count={listTotalPages}
                  page={listPage}
                  onChange={(_, value) => loadList(null, value)}
                />
              </Box>
            </>
          )}
        </Paper>

        <Paper variant="outlined" sx={{ borderRadius: 3, p: { xs: 2, md: 3 } }}>
          {detailLoading ? (
            <Box sx={{ py: 12, display: "grid", placeItems: "center" }}>
              <CircularProgress />
            </Box>
          ) : selectedId ? (
            <Stack spacing={2.5}>
              <Stack
                direction={{ xs: "column", md: "row" }}
                justifyContent="space-between"
                alignItems={{ xs: "stretch", md: "center" }}
                gap={1.5}
              >
                <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
                  <Typography variant="h6" sx={{ fontWeight: 750 }}>
                    {isNew ? "새 프롬프트" : `버전 ${selectedPrompt.current_version_no}`}
                  </Typography>
                  {isDirty && <Chip label="저장 안 됨" size="small" color="warning" />}
                  {selectedPrompt?.is_deleted && <Chip label="삭제된 프롬프트" size="small" />}
                </Stack>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {!isNew && (
                    <Button
                      variant="outlined"
                      startIcon={<HistoryRoundedIcon />}
                      onClick={() => setHistoryOpen(true)}
                    >
                      버전 기록
                    </Button>
                  )}
                  {selectedPrompt?.is_deleted ? (
                    <Button
                      variant="contained"
                      startIcon={<RestoreRoundedIcon />}
                      onClick={handleRecoverPrompt}
                      disabled={working}
                    >
                      프롬프트 복구
                    </Button>
                  ) : (
                    <>
                      {!isNew && (
                        <Button
                          color="error"
                          variant="outlined"
                          startIcon={<DeleteOutlineRoundedIcon />}
                          onClick={() => setConfirmAction({ type: "delete-prompt" })}
                          disabled={working}
                        >
                          삭제
                        </Button>
                      )}
                      <Button
                        variant="contained"
                        startIcon={<SaveRoundedIcon />}
                        onClick={savePrompt}
                        disabled={working || !isDirty}
                      >
                        저장
                      </Button>
                    </>
                  )}
                </Stack>
              </Stack>

              <TextField
                label="제목"
                value={draft.title}
                onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
                disabled={selectedPrompt?.is_deleted || working}
                inputProps={{ maxLength: 200 }}
                fullWidth
              />
              <TextField
                label="본문"
                value={draft.body}
                onChange={(event) => setDraft((current) => ({ ...current, body: event.target.value }))}
                disabled={selectedPrompt?.is_deleted || working}
                multiline
                minRows={20}
                fullWidth
                sx={{
                  "& textarea": {
                    fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", monospace',
                    fontSize: 14,
                    lineHeight: 1.65,
                  },
                }}
              />
              {!isNew && (
                <Typography variant="caption" color="text.secondary">
                  마지막 수정 {formatDate(selectedPrompt.updated_at)} · 저장할 때마다 새 버전이 생성됩니다.
                </Typography>
              )}
            </Stack>
          ) : (
            <Box sx={{ py: 12, textAlign: "center" }}>
              <Typography color="text.secondary">
                프롬프트를 선택하거나 새로 만들어 주세요.
              </Typography>
            </Box>
          )}
        </Paper>
      </Box>

      <Drawer
        anchor="right"
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        PaperProps={{ sx: { width: { xs: "100%", sm: 560 }, p: 2.5 } }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <div>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>버전 기록</Typography>
            <Typography variant="body2" color="text.secondary">
              {selectedPrompt?.title}
            </Typography>
          </div>
          <IconButton onClick={() => setHistoryOpen(false)} aria-label="버전 기록 닫기">
            <CloseRoundedIcon />
          </IconButton>
        </Stack>
        <FormControlLabel
          control={
            <Switch
              checked={includeDeletedVersions}
              onChange={(event) => setIncludeDeletedVersions(event.target.checked)}
            />
          }
          label="삭제된 버전 포함"
          sx={{ mt: 2 }}
        />
        <Divider sx={{ mb: 2 }} />
        <Stack spacing={1.5} sx={{ overflowY: "auto" }}>
          {versions.map((version) => (
            <Paper
              key={version.id}
              variant="outlined"
              sx={{ p: 2, borderRadius: 2.5, opacity: version.is_deleted ? 0.58 : 1 }}
            >
              <Stack direction="row" justifyContent="space-between" gap={2}>
                <Stack spacing={0.5} sx={{ minWidth: 0 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography sx={{ fontWeight: 750 }}>v{version.version_no}</Typography>
                    {version.is_current && <Chip label="현재" size="small" color="primary" />}
                    {version.is_deleted && <Chip label="삭제됨" size="small" />}
                  </Stack>
                  <Typography noWrap>{version.title}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatDate(version.created_at)} · {version.created_by_name || `사용자 ${version.created_by}`}
                  </Typography>
                </Stack>
                <Stack direction="row" alignItems="center">
                  <Tooltip title="내용 보기">
                    <IconButton onClick={() => setViewVersion(version)} aria-label={`버전 ${version.version_no} 보기`}>
                      <VisibilityOutlinedIcon />
                    </IconButton>
                  </Tooltip>
                  {version.is_deleted ? (
                    <Tooltip title="삭제 취소">
                      <span>
                        <IconButton
                          onClick={() => handleRecoverVersion(version)}
                          disabled={working}
                          aria-label={`버전 ${version.version_no} 삭제 취소`}
                        >
                          <RestoreRoundedIcon />
                        </IconButton>
                      </span>
                    </Tooltip>
                  ) : (
                    <>
                      {!version.is_current && (
                        <Tooltip title="이 내용으로 새 버전 생성">
                          <span>
                            <IconButton
                              onClick={() => setConfirmAction({ type: "restore-version", version })}
                              disabled={working || selectedPrompt?.is_deleted}
                              aria-label={`버전 ${version.version_no} 복원`}
                            >
                              <RestoreRoundedIcon />
                            </IconButton>
                          </span>
                        </Tooltip>
                      )}
                      <Tooltip title={version.is_current ? "현재 버전은 삭제할 수 없습니다" : "버전 삭제"}>
                        <span>
                          <IconButton
                            color="error"
                            onClick={() => setConfirmAction({ type: "delete-version", version })}
                            disabled={working || version.is_current}
                            aria-label={`버전 ${version.version_no} 삭제`}
                          >
                            <DeleteOutlineRoundedIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </>
                  )}
                </Stack>
              </Stack>
            </Paper>
          ))}
          {versions.length === 0 && (
            <Typography color="text.secondary" sx={{ py: 6, textAlign: "center" }}>
              표시할 버전이 없습니다.
            </Typography>
          )}
        </Stack>
      </Drawer>

      <Dialog open={Boolean(viewVersion)} onClose={() => setViewVersion(null)} fullWidth maxWidth="md">
        <DialogTitle>버전 {viewVersion?.version_no} · {viewVersion?.title}</DialogTitle>
        <DialogContent>
          <Box
            component="pre"
            sx={{
              m: 0,
              p: 2,
              bgcolor: "grey.50",
              borderRadius: 2,
              whiteSpace: "pre-wrap",
              overflowWrap: "anywhere",
              fontSize: 14,
              lineHeight: 1.65,
            }}
          >
            {viewVersion?.body}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewVersion(null)}>닫기</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(confirmAction)} onClose={() => setConfirmAction(null)}>
        <DialogTitle>
          {confirmAction?.type === "delete-prompt"
            ? "프롬프트를 삭제할까요?"
            : confirmAction?.type === "delete-version"
              ? `버전 ${confirmAction?.version?.version_no}을 삭제할까요?`
              : `버전 ${confirmAction?.version?.version_no}을 복원할까요?`}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirmAction?.type === "restore-version"
              ? "선택한 버전의 내용으로 새 버전이 생성됩니다. 기존 이력은 유지됩니다."
              : "삭제 플래그만 변경되며 나중에 다시 복구할 수 있습니다."}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmAction(null)}>취소</Button>
          <Button
            color={confirmAction?.type === "restore-version" ? "primary" : "error"}
            variant="contained"
            onClick={runConfirmedAction}
          >
            {confirmAction?.type === "restore-version" ? "복원" : "삭제"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default PromptsPage;
