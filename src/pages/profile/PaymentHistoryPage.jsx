/* eslint-disable react/prop-types */
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from "@mui/material";
import EventRepeatOutlinedIcon from "@mui/icons-material/EventRepeatOutlined";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import api from "@/services/api-caller";
import { getPayments, paymentError, paymentPost } from "@/services/payment-service";
import {
  AdminEmptyState,
  AdminPageContainer,
  AdminPageHeader,
  AdminStatCard,
  AdminStatGrid,
  AdminTableCard,
} from "@/pages/admin/components/AdminPageShell";

const statuses = { READY: "결제 확인 대기", SCHEDULED: "다음 결제 예약", PAID: "결제 완료", FAILED: "결제 실패", CANCELED: "취소", REVIEW: "고객센터 확인 필요" };
const chargeStatuses = { DISPATCHING: "승인 결과 확인 중", REVIEW: "고객센터 확인 필요", FAILED: "결제 실패" };
const chargeReasons = {
  renewal_overdue: "예정 시각을 지나 자동 청구를 보류했습니다.",
  renewal_state_changed: "구독 또는 결제수단 상태를 확인해 주세요.",
  payment_pending_review: "승인 여부 확인 중입니다. 중복 결제를 요청하지 마세요.",
  invalid_order: "청구 예약과 주문 정보를 확인해 주세요.",
};
const verificationStatuses = {
  READY: "카드 확인 대기",
  CHARGING: "승인 결과 확인 중",
  CANCELING: "전액 취소 확인 중",
  COMPLETED: "전액 취소 완료 · 카드 등록",
  FAILED: "카드 확인 결제 실패",
  REVIEW: "고객센터 확인 필요",
};
const date = (value) => value ? new Date(value).toLocaleString("ko-KR") : "-";

export default function PaymentHistoryPage({ admin = false }) {
  const [orders, setOrders] = useState(null);
  const [billingHealth, setBillingHealth] = useState(null);
  const [terminationJobs, setTerminationJobs] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);

  const load = useCallback(async () => {
    const data = admin ? (await api.get("/api/v1/payments/admin/reservations")).data : await getPayments();
    const items = [...(data.orders || []), ...(data.card_verifications || []).map((row) => ({ ...row, is_card_verification: true }))]
      .sort((a, b) => new Date(b.created_at || b.paid_at || 0) - new Date(a.created_at || a.paid_at || 0));
    setOrders(items);
    setBillingHealth(data.billing_health || null);
    setTerminationJobs(data.termination_jobs || []);
    setPage((current) => Math.min(current, Math.max(0, Math.ceil(items.length / 10) - 1)));
  }, [admin]);

  useEffect(() => { load().catch((e) => setError(paymentError(e))); }, [load]);

  const perform = async (action) => {
    setBusy(true);
    setError("");
    try {
      await action();
      await load();
    } catch (e) {
      setError(paymentError(e));
      await load().catch(() => {});
    } finally {
      setBusy(false);
    }
  };

  const refund = async (order) => {
    const { data: preview } = await api.get(`/api/v1/payments/orders/${encodeURIComponent(order.id)}/refund-preview`);
    if (preview.requires_review) throw new Error("7일이 지났거나 사용 내역 등 확인이 필요한 결제입니다. 고객센터로 요청하시면 관계 법령에 따라 환불 여부와 금액을 안내합니다.");
    if (!preview.amount) throw new Error("환불 가능한 미사용 꼬막이 없습니다.");
    if (window.confirm(`${preview.cockles}꼬막을 반환하고 ${preview.amount.toLocaleString()}원을 환불합니다. 진행하시겠습니까?`)) {
      await paymentPost(`orders/${encodeURIComponent(order.id)}/refund`, { reason: "미사용 구매 꼬막 환불 요청", expected_amount: preview.amount });
    }
  };

  if (admin) {
    const pagedOrders = (orders || []).slice(page * 10, (page + 1) * 10);
    return (
      <AdminPageContainer maxWidth={1280}>
        <AdminPageHeader
          icon={EventRepeatOutlinedIcon}
          badge={orders ? `총 ${orders.length.toLocaleString()}건` : undefined}
          title="예약결제 목록"
          description="정기청구 예약 상태, 승인 확인 중 건수, 예약 누락 위험을 모니터링합니다."
          actions={(
            <Button variant="outlined" size="small" startIcon={<RefreshRoundedIcon />} disabled={busy} onClick={() => perform(load)}>
              새로고침
            </Button>
          )}
        />

        {billingHealth && (
          <AdminStatGrid columns={{ xs: "repeat(2, 1fr)", md: "repeat(5, 1fr)" }}>
            <AdminStatCard label="정기청구 대기" value={`${billingHealth.due}건`} color="#2563EB" bg="#EFF6FF" />
            <AdminStatCard label="승인 확인 중" value={`${billingHealth.dispatching}건`} color="#7C3AED" bg="#F5F3FF" />
            <AdminStatCard label="검토 필요" value={`${billingHealth.review}건`} color="#D97706" bg="#FFFBEB" />
            <AdminStatCard label="결제 실패" value={`${billingHealth.failed}건`} color="#DC2626" bg="#FEF2F2" />
            <AdminStatCard label="예약 누락 확인" value={`${billingHealth.missing_renewals}건`} color="#E11D48" bg="#FFF1F2" />
          </AdminStatGrid>
        )}

        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2.5 }}>{error}</Alert>}
        {orders === null && !error && (
          <Box sx={{ py: 8, display: "grid", placeItems: "center" }}><CircularProgress size={28} /></Box>
        )}

        {orders !== null && !orders.length && (
          <AdminEmptyState icon={EventRepeatOutlinedIcon} title="예약결제 내역이 없습니다." />
        )}

        {orders !== null && orders.length > 0 && (
          <>
            <Stack spacing={1.25} sx={{ display: { xs: "flex", md: "none" } }}>
              {pagedOrders.map((order) => {
                const pendingReservation = order.status === "READY";
                const statusText = chargeStatuses[order.charge_job_status]
                  || (pendingReservation ? "자동결제 예약 대기" : (order.is_card_verification ? verificationStatuses : statuses)[order.status] || "상태 확인 필요");
                return (
                  <Paper key={order.id} variant="outlined" sx={{ p: 1.75, borderRadius: 3 }}>
                    <Stack spacing={0.75}>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
                        <Typography variant="subtitle2" fontWeight={800}>{order.order_name}</Typography>
                        <Chip size="small" label={statusText} color={order.charge_job_status === "FAILED" ? "error" : "default"} />
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        회원 #{order.user_id}{order.customer_name ? ` ${order.customer_name}` : ""} · 예약 {date(order.period_start)}
                      </Typography>
                      <Typography variant="body2" fontWeight={800}>{order.amount.toLocaleString()}원</Typography>
                      {order.charge_error_code && (
                        <Typography variant="caption" color="error">
                          {chargeReasons[order.charge_error_code] || "청구 처리 상태를 확인해 주세요."}
                        </Typography>
                      )}
                    </Stack>
                  </Paper>
                );
              })}
            </Stack>

            <AdminTableCard sx={{ display: { xs: "none", md: "block" } }}>
              <Table aria-label="예약결제 목록" sx={{ minWidth: 700 }} size="small">
                <TableHead>
                  <TableRow>
                    {["예약일시", "상품·회원", "금액", "상태"].map((label) => <TableCell key={label}>{label}</TableCell>)}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pagedOrders.map((order) => {
                    const pendingReservation = order.status === "READY";
                    const statusText = chargeStatuses[order.charge_job_status]
                      || (pendingReservation ? "자동결제 예약 대기" : (order.is_card_verification ? verificationStatuses : statuses)[order.status] || "상태 확인 필요");
                    return (
                      <TableRow key={order.id} hover>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>{date(order.period_start)}</TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={750}>{order.order_name}</Typography>
                          <Typography variant="body2">회원 #{order.user_id}{order.customer_name && ` ${order.customer_name}`}</Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ overflowWrap: "anywhere" }}>{order.id}</Typography>
                        </TableCell>
                        <TableCell sx={{ whiteSpace: "nowrap", fontWeight: 750 }}>
                          {order.amount.toLocaleString()}원
                          {order.refunded_amount > 0 && (
                            <Typography variant="caption" display="block" color="text.secondary">환불 {order.refunded_amount.toLocaleString()}원</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip size="small" label={statusText} color={order.charge_job_status === "FAILED" ? "error" : "default"} />
                          {order.charge_error_code && (
                            <Typography variant="caption" display="block" color="error" sx={{ mt: 0.4 }}>
                              {chargeReasons[order.charge_error_code] || "청구 처리 상태를 확인해 주세요."}
                            </Typography>
                          )}
                          {order.refund_status && (
                            <Typography variant="caption" display="block">
                              환불 {({ PENDING: "처리 중", COMPLETED: "완료", REVIEW: "관리자 확인 중" })[order.refund_status]}
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </AdminTableCard>

            <Paper variant="outlined" sx={{ borderRadius: 3, mt: 2 }}>
              <TablePagination
                component="div"
                count={orders.length}
                page={page}
                onPageChange={(_, value) => setPage(value)}
                rowsPerPage={10}
                rowsPerPageOptions={[10]}
                labelDisplayedRows={({ from, to, count }) => `${count}건 중 ${from}–${to}`}
                getItemAriaLabel={(type) => (type === "next" ? "다음 페이지" : "이전 페이지")}
              />
            </Paper>
          </>
        )}
      </AdminPageContainer>
    );
  }

  return (
    <Box sx={{ maxWidth: 1100, mx: "auto", p: { xs: 2, md: 3 } }}>
      <Stack spacing={2}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
          <Typography variant="h5" fontWeight={800}>결제내역</Typography>
          <Button component={Link} to="/profile#plan">구독 관리로</Button>
        </Stack>
        {terminationJobs.filter((job) => job.status !== "COMPLETED").map((job) => (
          <Alert key={job.id} severity={job.status === "REVIEW" ? "warning" : "info"}>
            {job.scope === "WITHDRAWAL" ? "탈퇴" : "즉시 구독 종료"} 자동 처리 환불액 {job.amount.toLocaleString()}원 · {job.status === "REVIEW" ? "추가 환불 여부·처리 상태 관리자 검토 중" : "환불 처리 중"}. 이용 종료는 완료됐으며 다시 요청하지 않아도 됩니다.
          </Alert>
        ))}
        {error && <Alert severity="error">{error}</Alert>}
        <Button component={Link} to="/help/qna">환불 검토 문의</Button>
        {orders === null && !error && <CircularProgress size={24} />}
        {orders !== null && (
          <Paper variant="outlined" sx={{ minWidth: 0, borderRadius: 3, overflow: "hidden" }}>
            <TableContainer>
              <Table aria-label="결제내역 목록" sx={{ minWidth: 700 }}>
                <TableHead>
                  <TableRow>
                    {["결제일시", "상품", "금액", "상태", "처리"].map((label) => (
                      <TableCell key={label} sx={{ fontWeight: 700 }}>{label}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {!orders.length && <TableRow><TableCell colSpan={5} align="center" sx={{ py: 5 }}>결제내역이 없습니다.</TableCell></TableRow>}
                  {orders.slice(page * 10, (page + 1) * 10).map((order) => {
                    const pendingReservation = order.is_future_payment && order.status === "READY";
                    return (
                      <TableRow key={order.id}>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>{date(order.paid_at || order.created_at)}</TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={700}>{order.order_name}</Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ overflowWrap: "anywhere" }}>{order.id}</Typography>
                        </TableCell>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          {order.amount.toLocaleString()}원
                          {order.refunded_amount > 0 && <Typography variant="caption" display="block" color="text.secondary">환불 {order.refunded_amount.toLocaleString()}원</Typography>}
                        </TableCell>
                        <TableCell>
                          {chargeStatuses[order.charge_job_status] || (pendingReservation ? "자동결제 예약 대기" : (order.is_card_verification ? verificationStatuses : statuses)[order.status] || "상태 확인 필요")}
                          {order.refund_status && <Typography variant="caption" display="block">환불 {({ PENDING: "처리 중", COMPLETED: "완료", REVIEW: "관리자 확인 중" })[order.refund_status]}</Typography>}
                        </TableCell>
                        <TableCell>
                          <Stack spacing={0.5}>
                            {order.product_code === "TOPUP" && order.status === "PAID" && order.refunded_amount < order.amount && !["PENDING", "REVIEW"].includes(order.refund_status) && (
                              <Button size="small" color="warning" disabled={busy} onClick={() => perform(() => refund(order))}>
                                환불 가능 여부 확인
                              </Button>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={orders.length}
              page={page}
              onPageChange={(_, value) => setPage(value)}
              rowsPerPage={10}
              rowsPerPageOptions={[10]}
              labelDisplayedRows={({ from, to, count }) => `${count}건 중 ${from}–${to}`}
              getItemAriaLabel={(type) => (type === "next" ? "다음 페이지" : "이전 페이지")}
            />
          </Paper>
        )}
        <Button disabled={busy} onClick={() => perform(load)}>새로고침</Button>
      </Stack>
    </Box>
  );
}
