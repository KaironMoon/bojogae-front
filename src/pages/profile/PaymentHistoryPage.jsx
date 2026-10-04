/* eslint-disable react/prop-types */
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Box, Button, CircularProgress, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, Typography } from '@mui/material';
import api from '@/services/api-caller';
import { getPayments, paymentError, paymentPost } from '@/services/payment-service';

const statuses = { READY:'결제 확인 대기', SCHEDULED:'다음 결제 예약', PAID:'결제 완료', FAILED:'결제 실패', CANCELED:'취소', REVIEW:'고객센터 확인 필요' };
const verificationStatuses = { READY:'카드 확인 대기', CHARGING:'승인 결과 확인 중', CANCELING:'전액 취소 확인 중', COMPLETED:'전액 취소 완료 · 카드 등록', FAILED:'카드 확인 결제 실패', REVIEW:'고객센터 확인 필요' };
const date = (value) => value ? new Date(value).toLocaleString('ko-KR') : '-';

export default function PaymentHistoryPage({ admin=false }) {
  const [orders, setOrders] = useState(null);
  const [terminationJobs, setTerminationJobs] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const load = useCallback(async () => {
    const data = admin ? (await api.get('/api/v1/payments/admin/reservations')).data : await getPayments();
    const items = [...(data.orders || []), ...(data.card_verifications || []).map((row) => ({ ...row, is_card_verification:true }))].sort((a,b) => new Date(b.created_at || b.paid_at || 0) - new Date(a.created_at || a.paid_at || 0));
    setOrders(items);
    setTerminationJobs(data.termination_jobs || []);
    setPage((current) => Math.min(current, Math.max(0, Math.ceil(items.length / 10) - 1)));
  }, [admin]);
  useEffect(() => { load().catch((e) => setError(paymentError(e))); }, [load]);
  const perform = async (action) => {
    setBusy(true); setError('');
    try { await action(); await load(); }
    catch (e) { setError(paymentError(e)); await load().catch(() => {}); }
    finally { setBusy(false); }
  };
  const refund = async (order) => {
    const { data:preview } = await api.get(`/api/v1/payments/orders/${encodeURIComponent(order.id)}/refund-preview`);
    if (!preview.amount) throw new Error('환불 가능한 미사용 꼬막이 없습니다.');
    if (window.confirm(`${preview.cockles}꼬막을 반환하고 ${preview.amount.toLocaleString()}원을 환불합니다. 진행하시겠습니까?`)) {
      await paymentPost(`orders/${encodeURIComponent(order.id)}/refund`, { reason:'미사용 구매 꼬막 환불 요청', expected_amount:preview.amount });
    }
  };
  return <Box sx={{ maxWidth:1100, mx:'auto', p:{ xs:2, md:3 } }}>
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
        <Typography variant="h5" fontWeight={800}>{admin ? '예약결제 목록' : '결제내역'}</Typography>
        {!admin && <Button component={Link} to="/profile#plan">구독·충전으로</Button>}
      </Stack>
      {terminationJobs.filter((job) => job.status !== 'COMPLETED').map((job) => <Alert key={job.id} severity={job.status === 'REVIEW' ? 'warning' : 'info'}>
        {job.scope === 'WITHDRAWAL' ? '탈퇴' : '즉시 구독 종료'} 환불 {job.amount.toLocaleString()}원 · {job.status === 'REVIEW' ? '관리자 확인 중' : '자동 환불 처리 중'}. 이용 종료는 완료됐으며 다시 요청하지 않아도 됩니다.
      </Alert>)}
      {error && <Alert severity="error">{error}</Alert>}
      {orders === null && !error && <CircularProgress size={24} />}
      {orders !== null && <Paper variant="outlined" sx={{ minWidth:0, borderRadius:3, overflow:'hidden' }}>
        <TableContainer>
          <Table aria-label={admin ? '예약결제 목록' : '결제내역 목록'} sx={{ minWidth:700 }}>
            <TableHead><TableRow>
              {(admin ? ['예약일시','상품·회원','금액','상태'] : ['결제일시','상품','금액','상태','처리']).map((label) => <TableCell key={label} sx={{ fontWeight:700 }}>{label}</TableCell>)}
            </TableRow></TableHead>
            <TableBody>
              {!orders.length && <TableRow><TableCell colSpan={admin ? 4 : 5} align="center" sx={{ py:5 }}>{admin ? '예약결제 내역이 없습니다.' : '결제내역이 없습니다.'}</TableCell></TableRow>}
              {orders.slice(page * 10, (page + 1) * 10).map((order) => {
                const pendingReservation = (admin || order.is_future_payment) && order.status === 'READY';
                return <TableRow key={order.id}>
                  <TableCell sx={{ whiteSpace:'nowrap' }}>{date(admin ? order.period_start : order.paid_at || order.created_at)}</TableCell>
                  <TableCell><Typography variant="body2" fontWeight={700}>{order.order_name}</Typography>
                    {admin && <Typography variant="body2">회원 #{order.user_id}</Typography>}
                    <Typography variant="caption" color="text.secondary" sx={{ overflowWrap:'anywhere' }}>{order.id}</Typography>
                  </TableCell>
                  <TableCell sx={{ whiteSpace:'nowrap' }}>{order.amount.toLocaleString()}원
                    {order.refunded_amount > 0 && <Typography variant="caption" display="block" color="text.secondary">환불 {order.refunded_amount.toLocaleString()}원</Typography>}
                  </TableCell>
                  <TableCell>{pendingReservation ? '자동결제 예약 대기' : (order.is_card_verification ? verificationStatuses : statuses)[order.status] || '상태 확인 필요'}{order.refund_status && <Typography variant="caption" display="block">환불 {({ PENDING:'처리 중', COMPLETED:'완료', REVIEW:'관리자 확인 중' })[order.refund_status]}</Typography>}</TableCell>
                  {!admin && <TableCell><Stack spacing={0.5}>
                    {!pendingReservation && !(order.is_card_verification && ['COMPLETED','FAILED'].includes(order.status)) && <Button size="small" disabled={busy} onClick={() => perform(() => paymentPost(order.is_card_verification ? `methods/verifications/${encodeURIComponent(order.id)}/check` : `orders/${encodeURIComponent(order.id)}/complete`))}>{order.is_card_verification ? '승인·취소 확인' : '결제 내역 확인'}</Button>}
                    {order.product_code === 'TOPUP' && order.status === 'PAID' && order.refunded_amount < order.amount && !['PENDING','REVIEW'].includes(order.refund_status) &&
                      <Button size="small" color="warning" disabled={busy} onClick={() => perform(() => refund(order))}>미사용분 환불</Button>}
                  </Stack></TableCell>}
                </TableRow>;
              })}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination component="div" count={orders.length} page={page} onPageChange={(_, value) => setPage(value)} rowsPerPage={10} rowsPerPageOptions={[10]} labelDisplayedRows={({ from, to, count }) => `${count}건 중 ${from}–${to}`} getItemAriaLabel={(type) => type === 'next' ? '다음 페이지' : '이전 페이지'} />
      </Paper>}
      <Button disabled={busy} onClick={() => perform(load)}>새로고침</Button>
    </Stack>
  </Box>;
}
