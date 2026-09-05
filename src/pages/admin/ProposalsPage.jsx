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
  Typography,
} from "@mui/material";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import RestoreRoundedIcon from "@mui/icons-material/RestoreRounded";
import { useCallback, useEffect, useState } from "react";

import {
  deleteProposal,
  getAdminProposals,
  getProposal,
  proposalFileUrl,
  proposalRawResponseUrl,
  recoverProposal,
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

function AdminProposalsPage() {
  const [result, setResult] = useState({ items: [], page: 1, total_pages: 0, total: 0 });
  const [status, setStatus] = useState("");
  const [userId, setUserId] = useState("");
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [detail, setDetail] = useState(null);

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

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1440, mx: "auto" }}>
      <Typography variant="h4" sx={{ fontWeight: 800 }}>제안서 관리</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>본문을 노출하지 않고 파일, 처리 상태, 토큰 사용량을 관리합니다.</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, mb: 2 }}>
        <Stack direction={{ xs: "column", md: "row" }} gap={2} alignItems={{ md: "center" }}>
          <TextField select label="상태" value={status} onChange={(event) => setStatus(event.target.value)} sx={{ minWidth: 190 }}>
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
              <Typography variant="body2">모델 {detail.gemini_model} · thinking {detail.thinking_level} · 최대 출력 {detail.max_output_tokens.toLocaleString()}</Typography>
              <Typography variant="body2">입력 합계 {bytes(detail.total_input_bytes)} · 출력 {bytes(detail.output_bytes)}</Typography>
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
              {detail.calls.map((call) => (
                <Paper key={call.id} variant="outlined" sx={{ p: 2 }}>
                  <Typography sx={{ fontWeight: 700 }}>Gemini 호출 #{call.id} · {call.call_status}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    입력 {call.input_tokens || 0} · 출력 {call.output_tokens || 0} · 사고 {call.thought_tokens || 0} · 캐시 {call.cached_tokens || 0} · 전체 {call.total_tokens || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Interaction {call.provider_interaction_status || "-"} · 종료 사유 {call.provider_finish_reason || "-"} · 원문 {bytes(call.response_bytes)}
                    {call.response_repaired ? " · 자동 복원됨" : ""}
                  </Typography>
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
                      <Button size="small" onClick={() => window.open(proposalRawResponseUrl(detail.id), "_blank", "noopener,noreferrer")}>Gemini 원문 열기</Button>
                      <Button size="small" href={proposalRawResponseUrl(detail.id, true)}>Gemini 원문 다운로드</Button>
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
