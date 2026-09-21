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
  MenuItem,
  Pagination,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import RestoreRoundedIcon from "@mui/icons-material/RestoreRounded";
import ReplayRoundedIcon from "@mui/icons-material/ReplayRounded";
import { useCallback, useEffect, useState } from "react";

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


const STATUSES = ["", "QUEUED", "RUNNING", "CANCEL_REQUESTED", "COMPLETED", "FAILED", "CANCELLED"];

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

// LLM 호출 단계별 소요 시간(ms)을 가로 막대 타임라인으로 보여준다.
// response_metadata는 관리자 상세 조회에만 내려오므로(일반 사용자에게는
// 노출되지 않음) 이 관리자 페이지에서만 표시한다. 구간 폭은 각 단계
// 소요 시간에 비례하고, 스트림 단계 전에 실패한 호출은 "실패까지" 구간으로
// 표시해 어디서 멈췄는지 보여준다.
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

function AdminProposalsPage() {
  const [result, setResult] = useState({ items: [], page: 1, total_pages: 0, total: 0 });
  const [status, setStatus] = useState("");
  const [userId, setUserId] = useState("");
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [detail, setDetail] = useState(null);
  const [shareRerendering, setShareRerendering] = useState(false);

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    setError("");
    try {
      setResult(await getAdminProposals({
        page,
        page_size: 20,
        status: status || undefined,
        user_id: userId || undefined,
        include_deleted: includeDeleted,
      }));
    } catch {
      setError("제안서 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [includeDeleted, status, userId]);

  useEffect(() => { load(1); }, [load]);

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
      action === "REFUND" ? "포인트 반환 사유를 입력하세요." : "차감 유지 사유를 입력하세요.",
    );
    if (!reason?.trim()) return;
    try {
      await decideProposalPoints(detail.id, action, reason.trim());
      await Promise.all([openDetail(detail.id), load(result.page)]);
    } catch {
      setError("포인트 처리 결과를 저장하지 못했습니다.");
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1440, mx: "auto" }}>
      <Typography variant="h4" sx={{ fontWeight: 800 }}>보고서 관리</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>본문을 노출하지 않고 파일, 처리 상태, 토큰 사용량을 관리합니다.</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, mb: 2 }}>
        <Stack direction={{ xs: "column", md: "row" }} gap={2} alignItems={{ md: "center" }}>
          <TextField select label="상태" value={status} onChange={(event) => setStatus(event.target.value)} sx={{ minWidth: { md: 190 } }}>
            {STATUSES.map((value) => <MenuItem key={value || "ALL"} value={value}>{value || "전체 상태"}</MenuItem>)}
          </TextField>
          <TextField label="사용자 ID" type="number" value={userId} onChange={(event) => setUserId(event.target.value)} />
          <FormControlLabel control={<Checkbox checked={includeDeleted} onChange={(event) => setIncludeDeleted(event.target.checked)} />} label="삭제 포함" />
          <Button onClick={() => load(1)}>조회</Button>
          <Typography variant="body2" color="text.secondary">총 {result.total}건</Typography>
        </Stack>
      </Paper>
      {loading ? <Box sx={{ py: 10, display: "grid", placeItems: "center" }}><CircularProgress /></Box> : (
        <Stack spacing={1.25}>
          {result.items.map((item) => (
            <Paper key={item.id} variant="outlined" sx={{ p: 2, borderRadius: 3, opacity: item.is_deleted ? 0.65 : 1 }}>
              <Stack direction={{ xs: "column", lg: "row" }} justifyContent="space-between" gap={2}>
                <Box>
                  <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap">
                    <Typography sx={{ fontWeight: 750 }}>{item.title}</Typography>
                    <Chip label={item.status} size="small" />
                    <Chip label={`${item.point_cost.toLocaleString()}P · ${item.point_status || "-"}`} size="small" color={item.point_status === "REVIEW_REQUIRED" ? "warning" : "default"} />
                    {item.is_deleted && <Chip label="삭제됨" size="small" color="error" />}
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    #{item.id} · {item.user_display_name} ({item.user_email || `ID ${item.user_id}`}) · {item.prompt_title} v{item.prompt_version_no}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    입력 {bytes(item.total_input_bytes)} · 출력 {bytes(item.output_bytes)} · 호출 {item.call_count} · 토큰 {item.total_tokens.toLocaleString()}
                  </Typography>
                </Box>
                <Stack direction="row" alignItems="center" gap={1}>
                  <Button onClick={() => openDetail(item.id)}>상세</Button>
                  <Button color={item.is_deleted ? "primary" : "error"} startIcon={item.is_deleted ? <RestoreRoundedIcon /> : <DeleteOutlineRoundedIcon />} onClick={() => toggleDelete(item)}>
                    {item.is_deleted ? "복구" : "삭제"}
                  </Button>
                </Stack>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}
      {result.total_pages > 1 && <Pagination count={result.total_pages} page={result.page} onChange={(_, value) => load(value)} sx={{ mt: 3 }} />}

      <Dialog open={Boolean(detail)} onClose={() => setDetail(null)} fullWidth maxWidth="md">
        <DialogTitle>{detail?.title}</DialogTitle>
        <DialogContent>
          {detail && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Typography variant="body2">LLM 모델 {detail.llm_model} · thinking {detail.thinking_level} · 최대 출력 {detail.max_output_tokens.toLocaleString()}</Typography>
              <Typography variant="body2">입력 합계 {bytes(detail.total_input_bytes)} · 출력 {bytes(detail.output_bytes)}</Typography>
              <Alert severity={detail.point_status === "REVIEW_REQUIRED" ? "warning" : "info"}>
                <Typography variant="body2">
                  포인트 {detail.point_cost.toLocaleString()}P · {detail.point_status || "처리 전"}
                  {detail.fault_party ? ` · 귀책 ${detail.fault_party}` : ""}
                  {detail.llm_requested_at ? " · LLM 요청됨" : " · LLM 요청 전"}
                </Typography>
                {detail.point_status === "REVIEW_REQUIRED" && (
                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    <Button size="small" variant="contained" color="success" onClick={() => decidePoints("REFUND")}>포인트 반환</Button>
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
                <Paper key={file.id} variant="outlined" sx={{ p: 1.5 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography>{file.original_filename} · {bytes(file.size_bytes)}</Typography>
                    <Stack direction="row">
                      <Button size="small" onClick={() => window.open(proposalFileUrl(detail.id, "input", { fileId: file.id, admin: true }), "_blank", "noopener,noreferrer")}>열기</Button>
                      <Button size="small" href={proposalFileUrl(detail.id, "input", { fileId: file.id, admin: true, download: true })}>다운로드</Button>
                    </Stack>
                  </Stack>
                </Paper>
              ))}
              {detail.status === "COMPLETED" && (
                <Stack direction="row">
                  <Button onClick={() => window.open(proposalFileUrl(detail.id, "output", { admin: true }), "_blank", "noopener,noreferrer")}>결과 열기</Button>
                  <Button href={proposalFileUrl(detail.id, "output", { admin: true, download: true })}>결과 다운로드</Button>
                </Stack>
              )}
              {detail.status === "COMPLETED" && detail.share_uuid && (
                <Paper variant="outlined" sx={{ p: 1.5 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1} flexWrap="wrap">
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>공유 이미지 상태: {detail.share_status || "PENDING"}</Typography>
                      <Typography variant="caption" color="text.secondary">{detail.share_uuid}</Typography>
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
                <Paper key={call.id} variant="outlined" sx={{ p: 2 }}>
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
                    <Stack direction="row" sx={{ mt: 1 }}>
                      <Button size="small" onClick={() => window.open(proposalRawResponseUrl(detail.id), "_blank", "noopener,noreferrer")}>LLM 원문 열기</Button>
                      <Button size="small" href={proposalRawResponseUrl(detail.id, true)}>LLM 원문 다운로드</Button>
                    </Stack>
                  )}
                </Paper>
              ))}
            </Stack>
          )}
        </DialogContent>
        <DialogActions><Button onClick={() => setDetail(null)}>닫기</Button></DialogActions>
      </Dialog>
    </Box>
  );
}

export default AdminProposalsPage;
