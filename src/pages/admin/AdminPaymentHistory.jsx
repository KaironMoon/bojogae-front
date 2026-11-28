import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  InputAdornment,
  LinearProgress,
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
} from "@mui/material";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import api from "@/services/api-caller";
import { paymentError } from "@/services/payment-service";
import PaymentRefundDialog from "./PaymentRefundDialog";
import { AdminEmptyState, AdminTableCard } from "./components/AdminPageShell";

const PAGE_SIZE = 20;
const orderStatuses = { READY: "결제 대기", SCHEDULED: "예약됨", PAID: "결제 완료", FAILED: "결제 실패", CANCELED: "취소 완료", REVIEW: "확인 필요" };
const verificationStatuses = { READY: "카드 확인 대기", CHARGING: "승인 확인 중", CANCELING: "취소 확인 중", COMPLETED: "전액 취소 완료", FAILED: "승인 실패", REVIEW: "확인 필요" };
const refundStatuses = { PENDING: "취소 확인 중", PENDING_VERIFICATION: "취소 확인 중", REVIEW: "관리자 확인 필요", COMPLETED: "취소 완료" };
const providers = { MOBILPAY: "KG파이낸셜", PORTONE: "포트원" };
const statusColors = { PAID: "success", FAILED: "error", REVIEW: "warning", READY: "info", SCHEDULED: "info", COMPLETED: "success" };
const date = (value) => new Date(value).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });

export default function AdminPaymentHistory() {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [revision, setRevision] = useState(0);
  const [data, setData] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [result, setResult] = useState(null);
  const refresh = () => setRevision((value) => value + 1);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setListError("");
    api.get("/api/v1/payments/admin/orders", { page: page + 1, page_size: PAGE_SIZE, q: query }, { signal: controller.signal })
      .then(({ data: response }) => {
        if (controller.signal.aborted) return;
        const lastPage = Math.max(0, Math.ceil(response.total / PAGE_SIZE) - 1);
        if (page > lastPage) setPage(lastPage);
        else setData(response);
      })
      .catch((error) => {
        if (!controller.signal.aborted) setListError(paymentError(error));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [page, query, revision]);

  const submit = async (action) => {
    setBusy(true);
    setActionError("");
    try {
      setResult(await action());
      setSelected(null);
    } catch (error) {
      setActionError(paymentError(error));
    } finally {
      refresh();
      setBusy(false);
    }
  };

  return (
    <Stack spacing={2}>
      <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2.25 }, borderRadius: 3, bgcolor: "#FFFFFF", minWidth: 0 }}>
        <Stack spacing={1.5}>
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} gap={1}>
            <Box>
              <Typography variant="h6" fontWeight={850}>전체 결제내역</Typography>
              <Typography variant="caption" color="text.secondary">총 {data.total.toLocaleString()}건</Typography>
            </Box>
            <Button size="small" variant="outlined" startIcon={<RefreshRoundedIcon />} disabled={busy || loading} onClick={refresh}>
              새로고침
            </Button>
          </Stack>
          <Stack
            component="form"
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            onSubmit={(event) => {
              event.preventDefault();
              setPage(0);
              setQuery(search.trim());
              refresh();
            }}
          >
            <TextField
              size="small"
              label="회원명, 이메일, 회원 ID 또는 결제 ID"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              slotProps={{ htmlInput: { maxLength: 200 } }}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment> }}
              fullWidth
            />
            <Button type="submit" variant="contained" disabled={busy} sx={{ flexShrink: 0, px: 2.5 }}>
              검색
            </Button>
          </Stack>
          {result && (
            <Alert severity="info">
              {result.status === "COMPLETED" ? "환불 완료" : "취소 요청을 처리했습니다. 결과는 목록에서 확인해 주세요."}
              {result.refund_id && ` · 환불 요청 ID ${result.refund_id}`}
            </Alert>
          )}
          {listError && <Alert severity="error">{listError}</Alert>}
          {loading && <LinearProgress aria-label="전체 결제내역 불러오는 중" />}
        </Stack>
      </Paper>

      {!loading && !listError && !data.items.length ? (
        <AdminEmptyState icon={ReceiptLongOutlinedIcon} title="결제내역이 없습니다." description="검색어를 변경해 다시 조회해 보세요." />
      ) : (
        <>
          <Stack spacing={1.25} sx={{ display: { xs: "flex", md: "none" } }}>
            {data.items.map((order) => {
              const statusLabel = (order.is_card_verification ? verificationStatuses : orderStatuses)[order.status] || order.status;
              return (
                <Paper key={order.id} variant="outlined" sx={{ p: 1.75, borderRadius: 3 }}>
                  <Stack spacing={1}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="subtitle2" fontWeight={850}>{order.order_name}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                          {order.customer_name || "이름 없음"} (회원 #{order.user_id}) · {date(order.paid_at || order.created_at)}
                        </Typography>
                      </Box>
                      <Chip size="small" color={statusColors[order.status] || "default"} label={statusLabel} />
                    </Stack>
                    <Typography variant="caption" color="text.secondary" sx={{ overflowWrap: "anywhere" }}>
                      {providers[order.payment_provider] || order.payment_provider}{order.environment === "TEST" && " · 테스트"} · {order.id}
                    </Typography>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ pt: 0.75, borderTop: "1px solid #F1F5F9" }}>
                      <Box>
                        <Typography variant="body2" fontWeight={850}>{order.amount.toLocaleString()}원</Typography>
                        {order.refunded_amount > 0 && (
                          <Typography variant="caption" color="error">취소 {order.refunded_amount.toLocaleString()}원</Typography>
                        )}
                      </Box>
                      {order.cancellable_amount > 0 && (
                        <Button
                          size="small"
                          variant="outlined"
                          color="warning"
                          disabled={busy || loading || Boolean(listError)}
                          onClick={() => {
                            setResult(null);
                            setActionError("");
                            setSelected(order);
                          }}
                        >
                          결제 취소
                        </Button>
                      )}
                    </Stack>
                  </Stack>
                </Paper>
              );
            })}
          </Stack>

          <AdminTableCard sx={{ display: { xs: "none", md: "block" } }}>
            <Table size="small" aria-label="전체 결제내역" sx={{ minWidth: 820 }}>
              <TableHead>
                <TableRow>
                  {["일시 (한국 시간)", "회원", "상품·결제 ID", "결제금액", "취소금액", "상태", "처리"].map((label) => (
                    <TableCell key={label}>{label}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {data.items.map((order) => (
                  <TableRow key={order.id} hover>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>{date(order.paid_at || order.created_at)}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={750}>{order.customer_name || "이름 없음"}</Typography>
                      <Typography variant="caption" color="text.secondary">회원 #{order.user_id}</Typography>
                    </TableCell>
                    <TableCell sx={{ overflowWrap: "anywhere" }}>
                      <Typography variant="body2" fontWeight={750}>{order.order_name}</Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {providers[order.payment_provider] || order.payment_provider}{order.environment === "TEST" && " · 테스트"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">{order.id}</Typography>
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap", fontWeight: 750 }}>{order.amount.toLocaleString()}원</TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>{order.refunded_amount.toLocaleString()}원</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        color={statusColors[order.status] || "default"}
                        label={(order.is_card_verification ? verificationStatuses : orderStatuses)[order.status] || order.status}
                      />
                      {order.refund_status && (
                        <Typography variant="caption" display="block" sx={{ mt: 0.25 }}>
                          {refundStatuses[order.refund_status] || order.refund_status}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {order.cancellable_amount > 0 ? (
                        <Button
                          size="small"
                          variant="outlined"
                          color="warning"
                          disabled={busy || loading || Boolean(listError)}
                          onClick={() => {
                            setResult(null);
                            setActionError("");
                            setSelected(order);
                          }}
                        >
                          결제 취소
                        </Button>
                      ) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </AdminTableCard>
        </>
      )}

      <Paper variant="outlined" sx={{ borderRadius: 3 }}>
        <TablePagination
          component="div"
          count={data.total}
          page={Math.min(page, Math.max(0, Math.ceil(data.total / PAGE_SIZE) - 1))}
          onPageChange={(_, value) => setPage(value)}
          rowsPerPage={PAGE_SIZE}
          rowsPerPageOptions={[PAGE_SIZE]}
          labelDisplayedRows={({ from, to, count }) => `${count}건 중 ${from}–${to}`}
          getItemAriaLabel={(type) => (type === "next" ? "다음 페이지" : "이전 페이지")}
        />
      </Paper>
      <PaymentRefundDialog key={selected?.id || "closed"} order={selected} busy={busy} error={actionError} onClose={() => setSelected(null)} onSubmit={submit} />
    </Stack>
  );
}
