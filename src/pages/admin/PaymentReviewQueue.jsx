import { useEffect, useState } from "react";
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
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import api from "@/services/api-caller";
import PaymentSupportPanel from "./PaymentSupportPanel";
import { AdminTableCard } from "./components/AdminPageShell";

const statuses = { REVIEW: "검토 필요", PENDING: "처리 중", COMPLETED: "완료" };
const date = (value) => value ? new Date(value).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" }) : "-";

export default function PaymentReviewQueue() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [filters, setFilters] = useState({ page: 1, status: "", q: "" });
  const [draft, setDraft] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [selectedBusy, setSelectedBusy] = useState(false);
  const reload = () => setRefresh((value) => value + 1);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    api.get("/api/v1/payments/admin/termination-jobs", { page: filters.page, page_size: 20, q: filters.q, status: filters.status || undefined })
      .then(({ data: result }) => {
        if (!active) return;
        if (filters.page > 1 && filters.page > result.total_pages) {
          setFilters((value) => ({ ...value, page: Math.max(1, result.total_pages) }));
        } else setData(result);
      })
      .catch(() => {
        if (active) {
          setData(null);
          setError("전체 검토 목록을 불러오지 못했습니다. 백엔드 반영 여부와 연결 상태를 확인한 뒤 새로고침해 주세요.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [filters, refresh]);

  return (
    <Stack spacing={2.5}>
      <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2.5 }, borderRadius: 3, minWidth: 0, bgcolor: "#FFFFFF" }}>
        <Stack spacing={2}>
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} gap={1}>
            <Box>
              <Typography variant="h6" fontWeight={850}>전체 고객 구독 종료·탈퇴 검토 목록</Typography>
              <Typography variant="body2" color="text.secondary">
                처리할 고객의 검토하기 버튼을 누르면 결제 내역과 환불 검토 창이 열립니다.
              </Typography>
            </Box>
            <Button size="small" variant="outlined" startIcon={<RefreshRoundedIcon />} onClick={reload} disabled={loading} sx={{ flexShrink: 0, alignSelf: { xs: "flex-start", sm: "center" } }}>
              새로고침
            </Button>
          </Stack>

          <Stack
            component="form"
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            onSubmit={(event) => {
              event.preventDefault();
              setFilters((value) => ({ ...value, page: 1, q: draft.trim() }));
            }}
          >
            <TextField
              size="small"
              label="이름·이메일·고객번호 검색"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              inputProps={{ maxLength: 200 }}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment> }}
              fullWidth
            />
            <TextField
              select
              size="small"
              label="검토 상태"
              value={filters.status}
              SelectProps={{ displayEmpty: true }}
              InputLabelProps={{ shrink: true }}
              onChange={(event) => setFilters((value) => ({ ...value, page: 1, status: event.target.value }))}
              sx={{ minWidth: { xs: "100%", sm: 160 }, flexShrink: 0 }}
            >
              <MenuItem value="">전체</MenuItem>
              {Object.entries(statuses).map(([key, label]) => <MenuItem key={key} value={key}>{label}</MenuItem>)}
            </TextField>
            <Button type="submit" variant="contained" sx={{ flexShrink: 0, px: 2.5 }}>검색</Button>
          </Stack>

          {error && <Alert severity="error">{error}</Alert>}
          {loading && <Box role="status" aria-label="전체 검토 목록 조회 중" sx={{ py: 4, display: "grid", placeItems: "center" }}><CircularProgress size={28} /></Box>}

          {!loading && data && (
            <>
              <Stack spacing={1.25} sx={{ display: { xs: "flex", md: "none" } }}>
                {data.items.map((job) => (
                  <Paper key={job.id} variant="outlined" sx={{ p: 1.75, borderRadius: 2.5 }}>
                    <Stack spacing={1}>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography fontWeight={800} sx={{ overflowWrap: "anywhere" }}>{job.customer_name} · #{job.user_id}</Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ overflowWrap: "anywhere" }}>{job.customer_email || "이메일 없음"}</Typography>
                        </Box>
                        <Chip size="small" color={job.status === "REVIEW" ? "warning" : "default"} label={statuses[job.status] || job.status} />
                      </Stack>
                      <Typography variant="body2">
                        {job.scope === "WITHDRAWAL" ? "탈퇴" : "구독 종료"} · {date(job.created_at)}
                      </Typography>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" fontWeight={750}>자동 환불 {job.amount.toLocaleString()}원</Typography>
                        <Button
                          size="small"
                          variant={job.status === "REVIEW" ? "contained" : "outlined"}
                          onClick={() => { setSelectedBusy(true); setSelected(job); }}
                        >
                          {job.status === "REVIEW" ? "검토하기" : "상세보기"}
                        </Button>
                      </Stack>
                    </Stack>
                  </Paper>
                ))}
                {!data.items.length && <Typography color="text.secondary" sx={{ py: 3, textAlign: "center" }}>조회된 검토 건이 없습니다.</Typography>}
              </Stack>

              <AdminTableCard sx={{ display: { xs: "none", md: "block" } }}>
                <Table size="small" aria-label="전체 구독 종료·탈퇴 검토 목록" sx={{ minWidth: 650 }}>
                  <TableHead>
                    <TableRow>
                      {["접수일 (한국 시간)", "고객", "구분", "상태", "자동 처리 환불액", "처리"].map((label) => (
                        <TableCell key={label}>{label}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.items.map((job) => (
                      <TableRow key={job.id} hover>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>{date(job.created_at)}</TableCell>
                        <TableCell sx={{ maxWidth: 260, overflowWrap: "anywhere" }}>
                          <Typography variant="body2" fontWeight={750}>{job.customer_name} · #{job.user_id}</Typography>
                          <Typography variant="caption" color="text.secondary">{job.customer_email || "이메일 없음"}</Typography>
                        </TableCell>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>{job.scope === "WITHDRAWAL" ? "탈퇴" : "구독 종료"}</TableCell>
                        <TableCell><Chip size="small" color={job.status === "REVIEW" ? "warning" : "default"} label={statuses[job.status] || job.status} /></TableCell>
                        <TableCell sx={{ whiteSpace: "nowrap", fontWeight: 700 }}>{job.amount.toLocaleString()}원</TableCell>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          <Button
                            size="small"
                            variant={job.status === "REVIEW" ? "contained" : "outlined"}
                            onClick={() => { setSelectedBusy(true); setSelected(job); }}
                          >
                            {job.status === "REVIEW" ? "검토하기" : "상세보기"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!data.items.length && <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4, color: "text.secondary" }}>조건에 맞는 검토 건이 없습니다.</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </AdminTableCard>

              <TablePagination
                component="div"
                count={data.total}
                page={filters.page - 1}
                onPageChange={(_, page) => setFilters((value) => ({ ...value, page: page + 1 }))}
                rowsPerPage={20}
                rowsPerPageOptions={[20]}
                labelDisplayedRows={({ from, to, count }) => `${count}건 중 ${from}–${to}`}
                getItemAriaLabel={(type) => (type === "next" ? "다음 페이지" : "이전 페이지")}
              />
            </>
          )}
        </Stack>
      </Paper>

      <Dialog open={Boolean(selected)} onClose={() => { if (!selectedBusy) setSelected(null); }} fullWidth maxWidth="lg" fullScreen={isMobile} aria-labelledby="review-customer-title">
        <DialogTitle id="review-customer-title" fontWeight={850}>
          {selected?.customer_name} · {selected?.scope === "WITHDRAWAL" ? "탈퇴" : "구독 종료"} 검토
        </DialogTitle>
        <DialogContent dividers>
          {selected && <PaymentSupportPanel key={selected.id} customer={selected} onChanged={reload} onBusyChange={setSelectedBusy} />}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button variant="outlined" disabled={selectedBusy} onClick={() => setSelected(null)}>목록으로</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
