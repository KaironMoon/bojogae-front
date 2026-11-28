import { useEffect, useMemo, useRef, useState } from "react";
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
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ArrowDownwardRoundedIcon from "@mui/icons-material/ArrowDownwardRounded";
import ArrowUpwardRoundedIcon from "@mui/icons-material/ArrowUpwardRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import HelpOutlineOutlinedIcon from "@mui/icons-material/HelpOutlineOutlined";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { deleteFaq, faqError, listAdminFaqs, reorderFaqs, saveFaq } from "@/services/faq-service";
import {
  AdminEmptyState,
  AdminFilterBar,
  AdminPageContainer,
  AdminPageHeader,
  AdminStatCard,
  AdminStatGrid,
} from "./components/AdminPageShell";

export default function FaqsPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [data, setData] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editor, setEditor] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [busy, setBusy] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState("all");
  const submitting = useRef(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    listAdminFaqs()
      .then((result) => { if (active) setData(result); })
      .catch((err) => { if (active) setError(faqError(err, true)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reload]);

  const refresh = () => { setError(""); setReload((value) => value + 1); };
  const run = async (operation, message) => {
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await operation();
      setNotice(message);
      setReload((value) => value + 1);
    } catch (err) {
      setError(faqError(err, true));
      if ([404, 409].includes(err.response?.status)) setReload((value) => value + 1);
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  };

  const submit = (event) => {
    event.preventDefault();
    run(async () => { await saveFaq(editor); setEditor(null); }, "FAQ를 저장했습니다.");
  };

  const move = (index, offset) => {
    const ids = data.items.map((item) => item.id);
    [ids[index], ids[index + offset]] = [ids[index + offset], ids[index]];
    run(async () => { setData(await reorderFaqs(ids, data.items)); }, "표시 순서를 변경했습니다.");
  };

  const openEditor = (item = { question: "", answer: "", is_visible: true }) => {
    setError("");
    setEditor({ ...item });
  };

  const visibleCount = useMemo(() => (data.items || []).filter((item) => item.is_visible).length, [data.items]);
  const hiddenCount = (data.items || []).length - visibleCount;
  const isFiltered = Boolean(searchQuery.trim()) || visibilityFilter !== "all";

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return (data.items || []).filter((item) => {
      if (visibilityFilter === "visible" && !item.is_visible) return false;
      if (visibilityFilter === "hidden" && item.is_visible) return false;
      if (!q) return true;
      return (item.question || "").toLowerCase().includes(q) || (item.answer || "").toLowerCase().includes(q);
    });
  }, [data.items, searchQuery, visibilityFilter]);

  return (
    <AdminPageContainer maxWidth={1140}>
      <AdminPageHeader
        icon={HelpOutlineOutlinedIcon}
        badge={`총 ${data.total}개`}
        title="FAQ 관리"
        description="자주 묻는 질문과 답변을 등록하고 사용자 노출 여부·순서를 관리합니다."
        actions={(
          <>
            <Button variant="outlined" size="small" startIcon={<RefreshRoundedIcon />} onClick={refresh} disabled={busy || loading}>
              새로고침
            </Button>
            <Button variant="contained" size="small" startIcon={<AddRoundedIcon />} disabled={busy || loading} onClick={() => openEditor()}>
              FAQ 등록
            </Button>
          </>
        )}
      />

      {notice && <Alert severity="success" onClose={() => setNotice("")} sx={{ mb: 2, borderRadius: 2.5 }}>{notice}</Alert>}
      {error && <Alert severity="error" onClose={() => setError("")} sx={{ mb: 2, borderRadius: 2.5 }}>{error}</Alert>}

      <AdminStatGrid columns={{ xs: "repeat(3, 1fr)" }}>
        <AdminStatCard label="전체 FAQ" value={`${data.total}개`} active={visibilityFilter === "all"} onClick={() => setVisibilityFilter("all")} />
        <AdminStatCard label="노출 중" value={`${visibleCount}개`} color="#059669" bg="#ECFDF5" active={visibilityFilter === "visible"} onClick={() => setVisibilityFilter("visible")} />
        <AdminStatCard label="숨김" value={`${hiddenCount}개`} color="#64748B" bg="#F1F5F9" active={visibilityFilter === "hidden"} onClick={() => setVisibilityFilter("hidden")} />
      </AdminStatGrid>

      <AdminFilterBar>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ xs: "stretch", md: "center" }} justifyContent="space-between">
          <Tabs
            value={visibilityFilter}
            onChange={(_e, next) => setVisibilityFilter(next)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ minHeight: 38, "& .MuiTab-root": { minHeight: 38, py: 0.5, fontWeight: 750 } }}
          >
            <Tab value="all" label={`전체 (${data.total})`} />
            <Tab value="visible" label={`노출 (${visibleCount})`} />
            <Tab value="hidden" label={`숨김 (${hiddenCount})`} />
          </Tabs>
          <TextField
            size="small"
            placeholder="질문·답변 내용 검색"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment> }}
            sx={{ minWidth: { md: 280 } }}
          />
        </Stack>
        {isFiltered && (
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
            검색 또는 필터 적용 중에는 순서 이동 버튼이 비활성화됩니다. 전체 보기에서 화살표로 순서를 변경해 주세요.
          </Typography>
        )}
      </AdminFilterBar>

      {loading ? (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <CircularProgress aria-label="FAQ 관리 목록 불러오는 중" />
        </Box>
      ) : filteredItems.length === 0 ? (
        <AdminEmptyState
          icon={HelpOutlineOutlinedIcon}
          title={isFiltered ? "조건에 맞는 FAQ가 없습니다." : "등록된 FAQ가 없습니다."}
          description="첫 질문을 등록해 설계사가 자주 묻는 질문에 바로 답할 수 있습니다."
          action={!isFiltered && <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => openEditor()}>FAQ 등록</Button>}
        />
      ) : (
        <Stack spacing={1.5}>
          {filteredItems.map((item, index) => (
            <Paper component="article" aria-label={`FAQ: ${item.question}`} key={item.id} variant="outlined" sx={{ p: { xs: 1.75, sm: 2.25 }, borderRadius: 3, bgcolor: "#FFFFFF" }}>
              <Stack direction="row" spacing={1.5} alignItems="flex-start">
                <Stack alignItems="center" sx={{ flexShrink: 0, bgcolor: "#F8FAFC", borderRadius: 2, p: 0.25, border: "1px solid #E2E8F0" }}>
                  <Tooltip title={isFiltered ? "전체 목록에서만 순서 이동 가능" : "위로 이동"}>
                    <span>
                      <IconButton
                        aria-label={`${item.question} 위로 이동`}
                        disabled={busy || isFiltered || index === 0}
                        onClick={() => move(index, -1)}
                        size="small"
                      >
                        <ArrowUpwardRoundedIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Typography variant="caption" fontWeight={850} color="text.secondary">
                    #{index + 1}
                  </Typography>
                  <Tooltip title={isFiltered ? "전체 목록에서만 순서 이동 가능" : "아래로 이동"}>
                    <span>
                      <IconButton
                        aria-label={`${item.question} 아래로 이동`}
                        disabled={busy || isFiltered || index === filteredItems.length - 1}
                        onClick={() => move(index, 1)}
                        size="small"
                      >
                        <ArrowDownwardRoundedIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Stack>

                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" spacing={1} alignItems="flex-start" justifyContent="space-between">
                    <Typography variant="subtitle1" fontWeight={850} sx={{ overflowWrap: "anywhere", flex: 1, lineHeight: 1.35 }}>
                      {item.question}
                    </Typography>
                    <Chip
                      size="small"
                      label={item.is_visible ? "노출 중" : "숨김"}
                      color={item.is_visible ? "success" : "default"}
                      sx={{ flexShrink: 0, fontWeight: 750 }}
                    />
                  </Stack>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      mt: 1,
                      whiteSpace: "pre-wrap",
                      overflowWrap: "anywhere",
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      lineHeight: 1.6,
                    }}
                  >
                    {item.answer}
                  </Typography>
                  <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mt: 1.5, pt: 1.25, borderTop: "1px solid #F1F5F9" }}>
                    <Button size="small" variant="outlined" startIcon={<EditOutlinedIcon />} disabled={busy} onClick={() => openEditor(item)}>
                      수정
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={item.is_visible ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
                      disabled={busy}
                      onClick={() => run(() => saveFaq({ ...item, is_visible: !item.is_visible }), item.is_visible ? "FAQ를 숨겼습니다." : "FAQ를 노출했습니다.")}
                    >
                      {item.is_visible ? "숨기기" : "노출하기"}
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteOutlineRoundedIcon />}
                      disabled={busy}
                      onClick={() => { setError(""); setRemoving(item); }}
                    >
                      삭제
                    </Button>
                  </Stack>
                </Box>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}

      <Dialog open={Boolean(editor)} onClose={() => !busy && setEditor(null)} fullWidth maxWidth="md" fullScreen={isMobile}>
        <Box component="form" onSubmit={submit}>
          <DialogTitle fontWeight={850}>{editor?.id ? "FAQ 수정" : "FAQ 등록"}</DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2}>
              {error && <Alert severity="error">{error}</Alert>}
              <TextField
                autoFocus
                required
                size="small"
                label="질문"
                value={editor?.question || ""}
                disabled={busy}
                inputProps={{ maxLength: 300 }}
                onChange={(event) => setEditor({ ...editor, question: event.target.value })}
                helperText={`${editor?.question.length || 0}/300`}
              />
              <TextField
                required
                size="small"
                label="답변"
                value={editor?.answer || ""}
                disabled={busy}
                multiline
                minRows={8}
                inputProps={{ maxLength: 10000 }}
                onChange={(event) => setEditor({ ...editor, answer: event.target.value })}
                helperText="메뉴 경로와 이용 순서를 구체적으로 안내해 주세요. 줄바꿈은 사용자 화면에 그대로 표시됩니다."
              />
              <FormControlLabel
                control={<Switch color="success" checked={editor?.is_visible || false} disabled={busy} onChange={(_, checked) => setEditor({ ...editor, is_visible: checked })} />}
                label="사용자 화면에 노출"
              />
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5, bgcolor: "#F8FAFC" }}>
                <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1 }}>답변 미리보기</Typography>
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", lineHeight: 1.8 }}>
                  {editor?.answer || "답변을 입력하면 여기에 표시됩니다."}
                </Typography>
              </Paper>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button disabled={busy} onClick={() => setEditor(null)}>취소</Button>
            <Button type="submit" variant="contained" disabled={busy || !editor?.question.trim() || !editor?.answer.trim()}>
              {busy ? "저장 중…" : "저장"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog open={Boolean(removing)} onClose={() => !busy && setRemoving(null)} fullWidth maxWidth="xs">
        <DialogTitle fontWeight={800}>FAQ를 삭제할까요?</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Typography fontWeight={700} sx={{ overflowWrap: "anywhere" }}>{removing?.question}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            사용자 화면과 관리 목록에서 제외됩니다. 잠시 노출만 중단하려면 숨기기를 이용해 주세요.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button disabled={busy} onClick={() => setRemoving(null)}>취소</Button>
          <Button variant="contained" color="error" disabled={busy} onClick={() => run(async () => { await deleteFaq(removing); setRemoving(null); }, "FAQ를 삭제했습니다.")}>삭제</Button>
        </DialogActions>
      </Dialog>
    </AdminPageContainer>
  );
}
