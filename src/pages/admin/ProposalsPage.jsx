import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  InputAdornment,
  Link,
  MenuItem,
  Pagination,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import LibraryBooksOutlinedIcon from "@mui/icons-material/LibraryBooksOutlined";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import ReplayRoundedIcon from "@mui/icons-material/ReplayRounded";
import RestoreRoundedIcon from "@mui/icons-material/RestoreRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/auth/AuthContext";
import { planName } from "@/constants/plans";
import { customerError, signalIdentityChange, startImpersonation } from "@/services/customer-service";
import {
  decideProposalPoints,
  deleteProposal,
  getAdminProposals,
  getProposal,
  proposalFileUrl,
  proposalRawResponseUrl,
  recoverProposal,
  rerenderProposalShare,
} from "@/services/proposal-service";
import CustomerDetailDialog from "./CustomerDetailDialog";
import GrantFreePointsDialog, { createPointRequestKey } from "./GrantFreePointsDialog";
import ManualSubscriptionDialog from "./ManualSubscriptionDialog";
import {
  AdminEmptyState,
  AdminFilterBar,
  AdminPageContainer,
  AdminPageHeader,
  AdminTableCard,
} from "./components/AdminPageShell";

const STATUSES = ["", "QUEUED", "RUNNING", "CANCEL_REQUESTED", "COMPLETED", "FAILED", "CANCELLED"];

const STATUS_COLOR = {
  COMPLETED: "success",
  FAILED: "error",
  CANCELLED: "default",
  RUNNING: "primary",
  QUEUED: "info",
  CANCEL_REQUESTED: "warning",
};

function bytes(value) {
  if (!value) return "0 B";
  return `${(value / 1024 / 1024).toFixed(2)} MB`;
}

function providerErrorMessage(value) {
  if (!value) return "";
  try {
    const parsed = JSON.parse(value);
    return parsed.stream_error?.message || parsed.message || value;
  } catch {
    return value;
  }
}

/* eslint-disable react/prop-types -- timing은 자유 형식 JSON(response_metadata.timing)이라 shape을 고정할 수 없다 */
function TimingTimeline({ timing }) {
  if (!timing) return null;
  const prep = timing.prep_ms ?? 0;
  const firstEvent = timing.first_event_ms;
  const stream = timing.stream_ms;
  const cleanup = timing.cleanup_ms ?? 0;
  const total = timing.total_ms ?? prep + (stream ?? 0);
  const grand = total + cleanup;
  if (grand <= 0) return null;

  const segments = [];
  if (prep > 0) segments.push({ key: "prep", label: `준비 ${prep}ms`, ms: prep, color: "#94a3b8" });
  if (typeof stream === "number") {
    if (typeof firstEvent === "number") {
      const wait = firstEvent;
      const rest = Math.max(stream - firstEvent, 0);
      if (wait > 0) segments.push({ key: "wait", label: `첫응답 대기 ${wait}ms`, ms: wait, color: "#f59e0b" });
      if (rest > 0) segments.push({ key: "rest", label: `스트리밍 ${rest}ms`, ms: rest, color: "#3b82f6" });
    } else if (stream > 0) {
      segments.push({ key: "stream", label: `요청 ${stream}ms`, ms: stream, color: "#3b82f6" });
    }
  } else {
    const gap = Math.max(total - prep, 0);
    if (gap > 0) segments.push({ key: "gap", label: `실패까지 ${gap}ms`, ms: gap, color: "#ef4444" });
  }
  if (cleanup > 0) segments.push({ key: "cleanup", label: `정리 ${cleanup}ms`, ms: cleanup, color: "#a855f7" });
  if (segments.length === 0) return null;

  return (
    <Box sx={{ mt: 0.75 }}>
      <Box sx={{ display: "flex", height: 10, borderRadius: 1, overflow: "hidden", border: "1px solid", borderColor: "divider" }}>
        {segments.map((seg) => (
          <Tooltip key={seg.key} title={seg.label} arrow>
            <Box sx={{ flexGrow: seg.ms, flexBasis: 0, bgcolor: seg.color, minWidth: 2 }} />
          </Tooltip>
        ))}
      </Box>
      <Stack direction="row" spacing={1.25} flexWrap="wrap" alignItems="center" sx={{ mt: 0.5 }}>
        {segments.map((seg) => (
          <Stack key={seg.key} direction="row" spacing={0.5} alignItems="center">
            <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: seg.color }} />
            <Typography variant="caption" color="text.secondary">{seg.label}</Typography>
          </Stack>
        ))}
        <Typography variant="caption" sx={{ fontWeight: 700 }}>
          총 {grand}ms{typeof timing.inline === "boolean" ? ` · ${timing.inline ? "인라인" : "업로드"}` : ""}
        </Typography>
      </Stack>
    </Box>
  );
}
/* eslint-enable react/prop-types */

const startedAt = (value) => value ? new Date(value).toLocaleString("ko-KR", { timeZone: "Asia/Seoul", hour12: false }) : "시작 전";

/* eslint-disable react/prop-types */
function ProposalOwnerLinks({ item, onSelectUser }) {
  const primaryName = item.user_name && item.user_nickname && item.user_name !== item.user_nickname
    ? `${item.user_name} (${item.user_nickname})`
    : item.user_name || item.user_nickname || item.user_display_name;
  const linkProps = {
    component: "button",
    type: "button",
    underline: "hover",
    color: "primary",
    onClick: (event) => {
      event.stopPropagation();
      onSelectUser(item);
    },
    sx: { font: "inherit", fontWeight: 700, verticalAlign: "baseline" },
  };
  return (
    <>
      {primaryName && (
        <>
          <Link {...linkProps}>{primaryName}</Link>
          {" · "}
        </>
      )}
      <Link {...linkProps}>ID {item.user_id}</Link>
      {item.user_email ? ` · ${item.user_email}` : ""}
    </>
  );
}
/* eslint-enable react/prop-types */

function AdminProposalsPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { clearIdentity } = useAuth();
  const [result, setResult] = useState({ items: [], page: 1, total_pages: 0, total: 0 });
  const [status, setStatus] = useState("");
  const [draftQuery, setDraftQuery] = useState("");
  const [query, setQuery] = useState("");
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [detail, setDetail] = useState(null);
  const [shareRerendering, setShareRerendering] = useState(false);
  const [customerTarget, setCustomerTarget] = useState(null);
  const [customerRefreshKey, setCustomerRefreshKey] = useState(0);
  const [customerActionMessage, setCustomerActionMessage] = useState("");
  const [customerActionError, setCustomerActionError] = useState("");
  const [customerWorking, setCustomerWorking] = useState(false);
  const [grantTarget, setGrantTarget] = useState(null);
  const [manualTarget, setManualTarget] = useState(null);

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    setError("");
    try {
      setResult(await getAdminProposals({
        page,
        page_size: 20,
        status: status || undefined,
        q: query || undefined,
        include_deleted: includeDeleted,
      }));
    } catch {
      setError("제안서 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [includeDeleted, query, status]);

  useEffect(() => { load(1); }, [load]);

  const search = (event) => {
    event.preventDefault();
    const nextQuery = draftQuery.trim();
    if (nextQuery === query) load(1);
    else setQuery(nextQuery);
  };

  useEffect(() => {
    if (!detail || detail.share_status !== "RENDERING") return undefined;
    let disposed = false;
    const poll = window.setInterval(async () => {
      try {
        const fresh = await getProposal(detail.id, true);
        if (!disposed) setDetail((current) => (current && current.id === fresh.id ? fresh : current));
      } catch {
        // 다음 폴링에서 재시도
      }
    }, 3000);
    return () => {
      disposed = true;
      window.clearInterval(poll);
    };
  }, [detail]);

  const openDetail = async (id) => {
    try {
      setDetail(await getProposal(id, true));
    } catch {
      setError("제안서 상세를 불러오지 못했습니다.");
    }
  };

  const openCustomerDetail = (item) => {
    if (!item?.user_id) return;
    setCustomerActionMessage("");
    setCustomerActionError("");
    setCustomerTarget({
      id: item.user_id,
      name: item.user_name,
      nickname: item.user_nickname,
      display_name: item.user_display_name,
      email: item.user_email,
    });
  };

  const impersonate = async (user) => {
    setCustomerWorking(true);
    setCustomerActionError("");
    try {
      await startImpersonation(user.id);
      clearIdentity();
      signalIdentityChange();
      window.location.assign("/home");
    } catch (err) {
      setCustomerActionError(customerError(err));
    } finally {
      setCustomerWorking(false);
    }
  };

  const toggleDelete = async (item) => {
    try {
      if (item.is_deleted) await recoverProposal(item.id);
      else if (window.confirm("이 제안서를 관리자 권한으로 삭제할까요?")) await deleteProposal(item.id, true);
      await load(result.page);
      setDetail(null);
    } catch {
      setError("삭제 상태를 변경하지 못했습니다.");
    }
  };

  const rerenderShare = async () => {
    if (!detail) return;
    setShareRerendering(true);
    setError("");
    try {
      await rerenderProposalShare(detail.id);
      setDetail((current) => (current ? { ...current, share_status: "RENDERING" } : current));
    } catch {
      setError("공유 이미지 재렌더링 요청에 실패했습니다.");
    } finally {
      setShareRerendering(false);
    }
  };

  const decidePoints = async (action) => {
    const reason = window.prompt(
      action === "REFUND" ? "꼬막 반환 사유를 입력하세요." : "차감 유지 사유를 입력하세요.",
    );
    if (!reason?.trim()) return;
    try {
      await decideProposalPoints(detail.id, action, reason.trim());
      await Promise.all([openDetail(detail.id), load(result.page)]);
    } catch {
      setError("꼬막 처리 결과를 저장하지 못했습니다.");
    }
  };

  return (
    <AdminPageContainer maxWidth={1440}>
      <AdminPageHeader
        icon={LibraryBooksOutlinedIcon}
        badge={`총 ${(result.total || 0).toLocaleString()}건`}
        title="보고서 관리"
        description="본문을 노출하지 않고 파일, 생성 상태, 토큰·꼬막 사용량을 관리합니다."
        actions={(
          <Button variant="outlined" size="small" startIcon={<RefreshRoundedIcon />} onClick={() => load(result.page)}>
            새로고침
          </Button>
        )}
      />

      {error && <Alert severity="error" onClose={() => setError("")} sx={{ mb: 2, borderRadius: 2.5 }}>{error}</Alert>}

      <AdminFilterBar>
        <Stack component="form" onSubmit={search} direction={{ xs: "column", md: "row" }} gap={1.25} alignItems={{ xs: "stretch", md: "center" }}>
          <TextField
            select
            size="small"
            label="상태"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            sx={{ minWidth: { xs: "100%", md: 180 } }}
          >
            {STATUSES.map((value) => (
              <MenuItem key={value || "ALL"} value={value}>{value || "전체 상태"}</MenuItem>
            ))}
          </TextField>
          <TextField
            size="small"
            label="검색"
            placeholder="사용자 ID, 이름, 닉네임, 이메일, 보고서 제목 검색"
            value={draftQuery}
            inputProps={{ maxLength: 100 }}
            onChange={(event) => setDraftQuery(event.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment> }}
            fullWidth
          />
          <FormControlLabel
            sx={{ whiteSpace: "nowrap", m: 0 }}
            control={<Checkbox size="small" checked={includeDeleted} onChange={(event) => setIncludeDeleted(event.target.checked)} />}
            label={<Typography variant="body2" fontWeight={650}>삭제 포함</Typography>}
          />
          <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
            <Button type="submit" variant="contained" size="small" sx={{ minHeight: 40, px: 2.5 }}>조회</Button>
            {(query || status || includeDeleted) && (
              <Button
                size="small"
                variant="outlined"
                sx={{ minHeight: 40 }}
                onClick={() => {
                  setDraftQuery("");
                  setQuery("");
                  setStatus("");
                  setIncludeDeleted(false);
                }}
              >
                초기화
              </Button>
            )}
          </Stack>
        </Stack>
      </AdminFilterBar>

      {loading ? (
        <Box sx={{ py: 10, display: "grid", placeItems: "center" }}>
          <CircularProgress />
        </Box>
      ) : !result.items.length ? (
        <AdminEmptyState
          icon={LibraryBooksOutlinedIcon}
          title={query || status ? "검색 조건에 맞는 보고서가 없습니다." : "등록된 보고서가 없습니다."}
          description="검색어나 상태 조건을 확인해 주세요."
        />
      ) : (
        <>
          {/* Mobile card list */}
          <Stack spacing={1.25} sx={{ display: { xs: "flex", md: "none" } }}>
            {result.items.map((item) => (
              <Paper key={item.id} variant="outlined" sx={{ p: 1.75, borderRadius: 3, opacity: item.is_deleted ? 0.65 : 1 }}>
                <Stack spacing={1}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
                    <Typography variant="subtitle2" fontWeight={850} sx={{ overflowWrap: "anywhere", flex: 1 }}>
                      #{item.id} · {item.title}
                    </Typography>
                    <Chip label={item.status} size="small" color={STATUS_COLOR[item.status] || "default"} />
                  </Stack>
                  <Stack direction="row" gap={0.75} flexWrap="wrap" useFlexGap>
                    <Chip
                      label={`${item.point_cost.toLocaleString()}꼬막 · ${item.point_status || "-"}`}
                      size="small"
                      color={item.point_status === "REVIEW_REQUIRED" ? "warning" : "default"}
                      variant="outlined"
                    />
                    {item.is_deleted && <Chip label="삭제됨" size="small" color="error" />}
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: "anywhere" }}>
                    <ProposalOwnerLinks item={item} onSelectUser={openCustomerDetail} />
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {item.prompt_title} v{item.prompt_version_no} · {startedAt(item.started_at)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    입력 {bytes(item.total_input_bytes)} · 출력 {bytes(item.output_bytes)} · 토큰 {item.total_tokens.toLocaleString()}
                  </Typography>
                  <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ pt: 0.75, borderTop: "1px solid #F1F5F9" }}>
                    <Button size="small" variant="outlined" onClick={() => openDetail(item.id)}>상세</Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color={item.is_deleted ? "primary" : "error"}
                      startIcon={item.is_deleted ? <RestoreRoundedIcon /> : <DeleteOutlineRoundedIcon />}
                      onClick={() => toggleDelete(item)}
                    >
                      {item.is_deleted ? "복구" : "삭제"}
                    </Button>
                  </Stack>
                </Stack>
              </Paper>
            ))}
          </Stack>

          {/* Desktop table */}
          <AdminTableCard sx={{ display: { xs: "none", md: "block" } }}>
            <Table size="small" aria-label="관리자 보고서 목록">
              <TableHead>
                <TableRow>
                  <TableCell>보고서 · 프롬프트</TableCell>
                  <TableCell>설계사</TableCell>
                  <TableCell>상태 · 꼬막</TableCell>
                  <TableCell align="right">파일 · 토큰</TableCell>
                  <TableCell align="right">관리</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {result.items.map((item) => (
                  <TableRow
                    key={item.id}
                    hover
                    onClick={() => openDetail(item.id)}
                    sx={{ cursor: "pointer", opacity: item.is_deleted ? 0.65 : 1 }}
                  >
                    <TableCell sx={{ py: 1.5, maxWidth: 340 }}>
                      <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
                        <Typography variant="body2" fontWeight={850} sx={{ overflowWrap: "anywhere" }}>
                          {item.title}
                        </Typography>
                        {item.is_deleted && <Chip label="삭제됨" size="small" color="error" sx={{ height: 20 }} />}
                      </Stack>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>
                        #{item.id} · {item.prompt_title} v{item.prompt_version_no}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                        시작 {startedAt(item.started_at)}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 260, overflowWrap: "anywhere" }}>
                      <Typography variant="body2" color="text.secondary">
                        <ProposalOwnerLinks item={item} onSelectUser={openCustomerDetail} />
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Stack spacing={0.5} alignItems="flex-start">
                        <Chip label={item.status} size="small" color={STATUS_COLOR[item.status] || "default"} sx={{ fontWeight: 750 }} />
                        <Chip
                          label={`${item.point_cost.toLocaleString()}꼬막 · ${item.point_status || "-"}`}
                          size="small"
                          color={item.point_status === "REVIEW_REQUIRED" ? "warning" : "default"}
                          variant="outlined"
                        />
                      </Stack>
                    </TableCell>
                    <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                      <Typography variant="body2" fontWeight={750} sx={{ fontVariantNumeric: "tabular-nums" }}>
                        토큰 {item.total_tokens.toLocaleString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                        입력 {bytes(item.total_input_bytes)} · 출력 {bytes(item.output_bytes)} · 호출 {item.call_count}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                      <Stack direction="row" spacing={0.75} justifyContent="flex-end" onClick={(e) => e.stopPropagation()}>
                        <Button size="small" variant="outlined" onClick={() => openDetail(item.id)}>상세</Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color={item.is_deleted ? "primary" : "error"}
                          startIcon={item.is_deleted ? <RestoreRoundedIcon /> : <DeleteOutlineRoundedIcon />}
                          onClick={() => toggleDelete(item)}
                        >
                          {item.is_deleted ? "복구" : "삭제"}
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </AdminTableCard>

          {result.total_pages > 1 && (
            <Stack alignItems="center" sx={{ mt: 2.5 }}>
              <Pagination count={result.total_pages} page={result.page} color="primary" onChange={(_, value) => load(value)} />
            </Stack>
          )}
        </>
      )}

      <Dialog open={Boolean(detail)} onClose={() => setDetail(null)} fullWidth maxWidth="md" fullScreen={isMobile}>
        <DialogTitle sx={{ fontWeight: 850, overflowWrap: "anywhere" }}>
          #{detail?.id} · {detail?.title}
        </DialogTitle>
        <DialogContent dividers>
          {detail && (
            <Stack spacing={2}>
              <Paper variant="outlined" sx={{ p: 1.75, borderRadius: 2.5, bgcolor: "#F8FAFC" }}>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1 }}>
                  <Typography variant="body2">
                    <strong>설계사:</strong> <ProposalOwnerLinks item={detail} onSelectUser={openCustomerDetail} />
                  </Typography>
                  <Typography variant="body2">
                    <strong>생성 시작:</strong> {startedAt(detail.started_at)} (KST)
                  </Typography>
                  <Typography variant="body2">
                    <strong>모델:</strong> {detail.llm_model} · thinking {detail.thinking_level} · 최대 {detail.max_output_tokens.toLocaleString()}
                  </Typography>
                  <Typography variant="body2">
                    <strong>입출력:</strong> 입력 {bytes(detail.total_input_bytes)} · 출력 {bytes(detail.output_bytes)}
                  </Typography>
                </Box>
              </Paper>

              <Alert severity={detail.point_status === "REVIEW_REQUIRED" ? "warning" : "info"}>
                <Typography variant="body2">
                  꼬막 {detail.point_cost.toLocaleString()}꼬막 · {detail.point_status || "처리 전"}
                  {detail.fault_party ? ` · 귀책 ${detail.fault_party}` : ""}
                  {detail.llm_requested_at ? " · LLM 요청됨" : " · LLM 요청 전"}
                </Typography>
                {detail.point_status === "REVIEW_REQUIRED" && (
                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    <Button size="small" variant="contained" color="success" onClick={() => decidePoints("REFUND")}>꼬막 반환</Button>
                    <Button size="small" variant="outlined" color="warning" onClick={() => decidePoints("KEEP")}>차감 유지</Button>
                  </Stack>
                )}
              </Alert>

              {detail.status === "FAILED" && (
                <Alert severity="error">
                  <Typography sx={{ fontWeight: 700 }}>
                    {detail.error_code || "generation_failed"} · {detail.retryable ? "수동 재시도 가능" : "재시도 불가"}
                  </Typography>
                  <Typography variant="body2">{detail.error_message || "생성에 실패했습니다."}</Typography>
                </Alert>
              )}

              {detail.files.map((file) => (
                <Paper key={file.id} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                  <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }} gap={1}>
                    <Typography variant="body2" sx={{ overflowWrap: "anywhere" }}>
                      {file.original_filename} · {bytes(file.size_bytes)}
                    </Typography>
                    <Stack direction="row" spacing={0.75} sx={{ flexShrink: 0 }}>
                      <Button size="small" variant="outlined" onClick={() => window.open(proposalFileUrl(detail.id, "input", { fileId: file.id, admin: true }), "_blank", "noopener,noreferrer")}>열기</Button>
                      <Button size="small" variant="outlined" href={proposalFileUrl(detail.id, "input", { fileId: file.id, admin: true, download: true })}>다운로드</Button>
                    </Stack>
                  </Stack>
                </Paper>
              ))}

              {detail.status === "COMPLETED" && (
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Button variant="contained" size="small" onClick={() => window.open(proposalFileUrl(detail.id, "output", { admin: true }), "_blank", "noopener,noreferrer")}>결과 열기</Button>
                  <Button variant="outlined" size="small" href={proposalFileUrl(detail.id, "output", { admin: true, download: true })}>결과 다운로드</Button>
                </Stack>
              )}

              {detail.status === "COMPLETED" && detail.share_uuid && (
                <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1} flexWrap="wrap">
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>공유 이미지 상태: {detail.share_status || "PENDING"}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ overflowWrap: "anywhere" }}>{detail.share_uuid}</Typography>
                    </Box>
                    <Stack direction="row" spacing={1}>
                      <Button size="small" onClick={() => window.open(`/s/${detail.share_uuid}`, "_blank", "noopener,noreferrer")}>공유 페이지 열기</Button>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={shareRerendering || detail.share_status === "RENDERING" ? <CircularProgress size={14} /> : <ReplayRoundedIcon fontSize="small" />}
                        disabled={shareRerendering || detail.share_status === "RENDERING"}
                        onClick={rerenderShare}
                      >
                        {detail.share_status === "RENDERING" ? "렌더링 중..." : "재렌더링"}
                      </Button>
                    </Stack>
                  </Stack>
                  {detail.share_status === "FAILED" && (
                    <Typography variant="caption" color="error" sx={{ display: "block", mt: 1 }}>
                      마지막 렌더링이 실패했습니다. 재렌더링을 눌러 다시 시도해 주세요.
                    </Typography>
                  )}
                </Paper>
              )}

              {detail.calls.map((call) => (
                <Paper key={call.id} variant="outlined" sx={{ p: 2, borderRadius: 2.5 }}>
                  <Typography sx={{ fontWeight: 700 }}>{call.provider} 호출 #{call.id} · {call.call_status}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    입력 {call.input_tokens || 0} · 출력 {call.output_tokens || 0} · 사고 {call.thought_tokens || 0} · 캐시 {call.cached_tokens || 0} · 전체 {call.total_tokens || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Interaction {call.provider_interaction_status || "-"} · 종료 사유 {call.provider_finish_reason || "-"} · 원문 {bytes(call.response_bytes)}
                    {call.response_repaired ? " · 자동 복원됨" : ""}
                  </Typography>
                  <TimingTimeline timing={call.response_metadata?.timing} />
                  {(call.error_code || call.provider_error_detail) && (
                    <Alert severity="error" sx={{ mt: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {call.error_code || "provider_error"}
                        {call.provider_status_code ? ` · HTTP ${call.provider_status_code}` : ""}
                      </Typography>
                      <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                        {providerErrorMessage(call.provider_error_detail) || "상세 오류 정보가 없습니다."}
                      </Typography>
                    </Alert>
                  )}
                  {call.response_available && (
                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                      <Button size="small" variant="outlined" onClick={() => window.open(proposalRawResponseUrl(detail.id), "_blank", "noopener,noreferrer")}>LLM 원문 열기</Button>
                      <Button size="small" variant="outlined" href={proposalRawResponseUrl(detail.id, true)}>LLM 원문 다운로드</Button>
                    </Stack>
                  )}
                </Paper>
              ))}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button variant="outlined" onClick={() => setDetail(null)}>닫기</Button>
        </DialogActions>
      </Dialog>

      <CustomerDetailDialog
        customer={customerTarget}
        onClose={() => setCustomerTarget(null)}
        onImpersonate={impersonate}
        onGrantPoints={(targetUser) => {
          setCustomerActionMessage("");
          setCustomerActionError("");
          setGrantTarget(targetUser);
        }}
        onManualSubscription={(targetUser) => {
          setCustomerActionMessage("");
          setCustomerActionError("");
          setManualTarget({ user: targetUser, requestKey: createPointRequestKey() });
        }}
        refreshKey={customerRefreshKey}
        actionMessage={customerActionMessage}
        working={customerWorking}
        actionError={customerActionError}
      />
      {grantTarget && (
        <GrantFreePointsDialog
          member={grantTarget}
          onClose={() => setGrantTarget(null)}
          onDone={async ({ member, amount, action }) => {
            setGrantTarget(null);
            setCustomerActionMessage(`${member.name || member.display_name} 설계사에게 ${amount.toLocaleString()}꼬막을 ${action === "RECOVER" ? "회수" : "지급"}했습니다.`);
            setCustomerRefreshKey((value) => value + 1);
          }}
        />
      )}
      {manualTarget && (
        <ManualSubscriptionDialog
          member={manualTarget.user}
          requestKey={manualTarget.requestKey}
          onClose={() => setManualTarget(null)}
          onDone={async (outcome) => {
            setManualTarget(null);
            setCustomerActionMessage(outcome.plan_code === "FREE" ? "수동 구독을 종료했습니다." : `${planName(outcome.plan_code)} 수동 구독을 적용했습니다.`);
            setCustomerRefreshKey((value) => value + 1);
          }}
        />
      )}
    </AdminPageContainer>
  );
}

export default AdminProposalsPage;
