import { useCallback, useEffect, useState } from "react";
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
  FormControlLabel,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import ProposalPopupNoticeDialog from "@/pages/proposals/ProposalPopupNoticeDialog";
import {
  POPUP_TARGET_PAGE_OPTIONS,
  createAdminPopupNotice,
  deleteAdminPopupNotice,
  listAdminPopupNotices,
  popupTargetPageLabel,
  updateAdminPopupNotice,
} from "@/services/proposal-popup-notice-service";

const CATEGORY_OPTIONS = [
  { value: "UPDATE", label: "업데이트 노트" },
  { value: "FEATURE", label: "새 기능" },
  { value: "BUGFIX", label: "버그 수정" },
  { value: "NOTICE", label: "주요 공지" },
];

const EMPTY_FORM = {
  title: "",
  category: "UPDATE",
  summary: "",
  content: "",
  target_pages: ["proposals"],
  is_published: false,
  starts_at: "",
  ends_at: "",
  sort_order: 0,
};

function toDatetimeLocalValue(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toIsoOrNull(localValue) {
  if (!localValue) return null;
  const parsed = new Date(localValue);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

function noticeStatusChip(notice) {
  if (!notice.is_published) {
    return { label: "비노출", color: "default", variant: "outlined" };
  }
  const now = Date.now();
  if (notice.starts_at && new Date(notice.starts_at).getTime() > now) {
    return { label: "노출 예정", color: "info", variant: "outlined" };
  }
  if (notice.ends_at && new Date(notice.ends_at).getTime() < now) {
    return { label: "기간 만료", color: "warning", variant: "outlined" };
  }
  return { label: "노출 중", color: "success", variant: "filled" };
}

function formatPeriodText(notice) {
  const fmt = (value) => {
    if (!value) return null;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleString("ko-KR", { dateStyle: "short", timeStyle: "short" });
  };
  const s = fmt(notice.starts_at);
  const e = fmt(notice.ends_at);
  if (!s && !e) return "상시 (노출 ON일 때 계속 표시)";
  if (s && e) return `${s} ~ ${e}`;
  if (s) return `${s} 이후`;
  return `${e} 까지`;
}

export default function AdminPopupNoticesPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [previewNotice, setPreviewNotice] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listAdminPopupNotices();
      setItems(data.items || []);
    } catch {
      setError("팝업 공지 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setEditorOpen(true);
  };

  const openEdit = (item) => {
    setEditingId(item.id);
    setForm({
      title: item.title || "",
      category: item.category || "UPDATE",
      summary: item.summary || "",
      content: item.content || "",
      target_pages: item.target_pages?.length ? item.target_pages : ["proposals"],
      is_published: Boolean(item.is_published),
      starts_at: toDatetimeLocalValue(item.starts_at),
      ends_at: toDatetimeLocalValue(item.ends_at),
      sort_order: item.sort_order ?? 0,
    });
    setFormError("");
    setEditorOpen(true);
  };

  const toggleTargetPage = (pageKey) => {
    setForm((current) => {
      if (pageKey === "all") {
        return { ...current, target_pages: ["all"] };
      }
      const withoutAll = (current.target_pages || []).filter((key) => key !== "all");
      const exists = withoutAll.includes(pageKey);
      const next = exists ? withoutAll.filter((key) => key !== pageKey) : [...withoutAll, pageKey];
      return { ...current, target_pages: next };
    });
  };

  const togglePublish = async (item) => {
    setSavingId(item.id);
    setError("");
    try {
      const updated = await updateAdminPopupNotice(item.id, { is_published: !item.is_published });
      setItems((prev) => prev.map((row) => (row.id === item.id ? updated : row)));
    } catch {
      setError("노출 상태를 변경하지 못했습니다.");
    } finally {
      setSavingId(null);
    }
  };

  const saveForm = async () => {
    if (!form.title.trim()) {
      setFormError("공지 제목을 입력해 주세요.");
      return;
    }
    if (!form.target_pages?.length) {
      setFormError("팝업을 노출할 페이지를 1개 이상 선택해 주세요.");
      return;
    }
    const startsIso = toIsoOrNull(form.starts_at);
    const endsIso = toIsoOrNull(form.ends_at);
    if (startsIso && endsIso && new Date(endsIso) < new Date(startsIso)) {
      setFormError("노출 종료 일시는 시작 일시 이후여야 합니다.");
      return;
    }
    setSubmitting(true);
    setFormError("");
    try {
      const payload = {
        title: form.title.trim(),
        category: form.category,
        summary: form.summary.trim(),
        content: form.content.trim(),
        target_pages: form.target_pages,
        is_published: Boolean(form.is_published),
        starts_at: startsIso,
        ends_at: endsIso,
        sort_order: Number(form.sort_order) || 0,
      };
      if (editingId) {
        await updateAdminPopupNotice(editingId, payload);
      } else {
        await createAdminPopupNotice(payload);
      }
      setEditorOpen(false);
      await load();
    } catch {
      setFormError("공지를 저장하지 못했습니다. 입력값을 확인해 주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`"${item.title}" 공지를 삭제할까요?`)) return;
    setSavingId(item.id);
    setError("");
    try {
      await deleteAdminPopupNotice(item.id);
      setItems((prev) => prev.filter((row) => row.id !== item.id));
    } catch {
      setError("공지를 삭제하지 못했습니다.");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3.5 }, maxWidth: 1120, mx: "auto" }}>
      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 2.5 }, mb: 2.5, borderRadius: "16px" }}>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }} gap={1.5}>
          <Box>
            <Typography variant="h5" fontWeight={900}>팝업 공지 관리</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              공지를 노출할 페이지(보고서 만들기, 요금 안내, 홈 등)와 노출 기간을 설정할 수 있습니다.
            </Typography>
          </Box>
          <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={openCreate} sx={{ fontWeight: 800, borderRadius: "10px" }}>
            새 공지 등록
          </Button>
        </Stack>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ py: 8, display: "grid", placeItems: "center" }}>
          <CircularProgress />
        </Box>
      ) : !items.length ? (
        <Paper variant="outlined" sx={{ p: 4, textAlign: "center", borderRadius: "16px" }}>
          <Typography color="text.secondary">등록된 팝업 공지가 없습니다.</Typography>
        </Paper>
      ) : (
        <Stack spacing={1.5}>
          {items.map((item) => {
            const chip = noticeStatusChip(item);
            const busy = savingId === item.id;
            const targetPages = item.target_pages?.length ? item.target_pages : ["proposals"];
            return (
              <Paper key={item.id} variant="outlined" sx={{ p: { xs: 2, sm: 2.25 }, borderRadius: "16px" }}>
                <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", md: "center" }} gap={2}>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Stack direction="row" alignItems="center" flexWrap="wrap" gap={0.75} sx={{ mb: 0.75 }}>
                      <Chip size="small" label={chip.label} color={chip.color} variant={chip.variant} sx={{ fontWeight: 800 }} />
                      <Chip size="small" label={CATEGORY_OPTIONS.find((c) => c.value === item.category)?.label || item.category} variant="outlined" />
                      {targetPages.map((pageKey) => (
                        <Chip
                          key={pageKey}
                          size="small"
                          color="info"
                          variant="outlined"
                          label={`노출: ${popupTargetPageLabel(pageKey)}`}
                          sx={{ fontWeight: 750 }}
                        />
                      ))}
                      {item.source_commit && (
                        <Chip size="small" label={`commit ${item.source_commit}`} sx={{ fontFamily: "monospace", fontSize: 11 }} />
                      )}
                      <Typography variant="caption" color="text.secondary">정렬 {item.sort_order}</Typography>
                    </Stack>
                    <Typography variant="subtitle1" fontWeight={850} sx={{ overflowWrap: "anywhere" }}>
                      {item.title}
                    </Typography>
                    {item.summary && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4, overflowWrap: "anywhere" }}>
                        {item.summary}
                      </Typography>
                    )}
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75 }}>
                      노출 기간: {formatPeriodText(item)}
                    </Typography>
                  </Box>

                  <Stack direction="row" alignItems="center" flexWrap="wrap" gap={1} sx={{ flexShrink: 0 }}>
                    <FormControlLabel
                      sx={{ mr: 0.5 }}
                      control={
                        <Switch
                          checked={Boolean(item.is_published)}
                          disabled={busy}
                          onChange={() => togglePublish(item)}
                          color="success"
                        />
                      }
                      label={<Typography variant="body2" fontWeight={800}>{item.is_published ? "노출 ON" : "비노출"}</Typography>}
                    />
                    <Button size="small" variant="outlined" startIcon={<VisibilityOutlinedIcon />} onClick={() => setPreviewNotice(item)}>
                      미리보기
                    </Button>
                    <Button size="small" variant="outlined" startIcon={<EditOutlinedIcon />} onClick={() => openEdit(item)}>
                      수정
                    </Button>
                    <Button size="small" color="error" startIcon={<DeleteOutlineRoundedIcon />} disabled={busy} onClick={() => handleDelete(item)}>
                      삭제
                    </Button>
                  </Stack>
                </Stack>
              </Paper>
            );
          })}
        </Stack>
      )}

      <Dialog open={editorOpen} onClose={() => !submitting && setEditorOpen(false)} fullWidth maxWidth="md">
        <DialogTitle fontWeight={900}>{editingId ? "팝업 공지 수정" : "새 팝업 공지 등록"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {formError && <Alert severity="error">{formError}</Alert>}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <TextField
                select
                size="small"
                label="분류"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                sx={{ minWidth: 160 }}
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                ))}
              </TextField>
              <TextField
                fullWidth
                size="small"
                label="제목"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                inputProps={{ maxLength: 200 }}
              />
            </Stack>

            <Box sx={{ p: 1.5, borderRadius: "12px", bgcolor: "#F8FAFC", border: "1px solid #E2E8F0" }}>
              <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1 }}>
                노출 페이지 선택 (복수 선택 가능)
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={0.75}>
                {POPUP_TARGET_PAGE_OPTIONS.map((opt) => {
                  const selected = (form.target_pages || []).includes(opt.value);
                  return (
                    <Chip
                      key={opt.value}
                      clickable
                      size="small"
                      label={opt.label}
                      color={selected ? "primary" : "default"}
                      variant={selected ? "filled" : "outlined"}
                      onClick={() => toggleTargetPage(opt.value)}
                      sx={{ fontWeight: 750 }}
                    />
                  );
                })}
              </Stack>
            </Box>

            <TextField
              fullWidth
              size="small"
              label="한 줄 요약 (블로그 상단 리드 문구)"
              value={form.summary}
              onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
              inputProps={{ maxLength: 500 }}
            />
            <TextField
              fullWidth
              multiline
              minRows={8}
              label="본문 (약식 블로그 형식: ## 소제목, - 목록, **강조**, ![설명](/api/v1/board-images/...) 지원)"
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
            />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <TextField
                size="small"
                fullWidth
                type="datetime-local"
                label="노출 시작 일시 (선택)"
                InputLabelProps={{ shrink: true }}
                value={form.starts_at}
                onChange={(e) => setForm((f) => ({ ...f, starts_at: e.target.value }))}
              />
              <TextField
                size="small"
                fullWidth
                type="datetime-local"
                label="노출 종료 일시 (선택)"
                InputLabelProps={{ shrink: true }}
                value={form.ends_at}
                onChange={(e) => setForm((f) => ({ ...f, ends_at: e.target.value }))}
              />
              <TextField
                size="small"
                type="number"
                label="정렬 순서"
                value={form.sort_order}
                onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))}
                sx={{ minWidth: 120 }}
              />
            </Stack>
            <FormControlLabel
              control={
                <Switch
                  checked={Boolean(form.is_published)}
                  onChange={(e) => setForm((f) => ({ ...f, is_published: e.target.checked }))}
                  color="success"
                />
              }
              label="사용자에게 바로 노출하기 (기본 비노출)"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditorOpen(false)} disabled={submitting}>취소</Button>
          <Button variant="contained" onClick={saveForm} disabled={submitting}>
            {submitting ? "저장 중..." : "저장"}
          </Button>
        </DialogActions>
      </Dialog>

      <ProposalPopupNoticeDialog
        open={Boolean(previewNotice)}
        notices={previewNotice ? [previewNotice] : []}
        previewMode
        onClose={() => setPreviewNotice(null)}
      />
    </Box>
  );
}
