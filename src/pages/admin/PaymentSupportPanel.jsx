import { useRef, useState } from 'react';
import { Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';
import api from '@/services/api-caller';
import { paymentError, paymentPost } from '@/services/payment-service';

const statuses = { READY: '결제 대기', SCHEDULED: '예약됨', PAID: '결제 완료', FAILED: '결제 실패', CANCELED: '취소', REVIEW: '검토 필요', PENDING: '처리 중', COMPLETED: '완료', PENDING_VERIFICATION: '환불 결과 확인 중' };
const date = value => value ? new Date(value).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }) : '-';
const canRefund = order => !order.isVerification && order.status === 'PAID' && order.refunded_amount < order.amount && !['PENDING', 'REVIEW'].includes(order.refund_status);

export default function PaymentSupportPanel() {
  const [userId, setUserId] = useState('');
  const [summary, setSummary] = useState(null);
  const [reason, setReason] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [refundReason, setRefundReason] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [reviewJobId, setReviewJobId] = useState('');
  const reviewReasonRef = useRef(null);
  const reviewedRefundKey = useRef(null);
  const setRefundField = (setter, value) => { reviewedRefundKey.current = null; setter(value); };
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const run = async action => {
    setBusy(true); setError(''); setResult(null);
    try { setResult(await action()); }
    catch (e) { setError(paymentError(e)); }
    finally { setBusy(false); }
  };
  const load = async () => {
    const data = (await api.get(`/api/v1/payments/admin/users/${userId}`)).data;
    setSummary(data);
  };
  const refreshAfterAction = async action => {
    const response = await action();
    // A refresh failure must not erase a successful refund response or its retry key.
    try { await load(); } catch (e) { setError(`처리 후 목록을 다시 불러오지 못했습니다. ${paymentError(e)}`); }
    return response;
  };
  const changeUser = value => {
    setUserId(value); setSummary(null); setSelectedOrder(null); setRefundAmount('');
    setRefundReason(''); setReviewJobId(''); setReason(''); setResult(null); setError(''); reviewedRefundKey.current = null;
  };
  const selectOrder = order => {
    setSelectedOrder({ ...order, userId }); setRefundAmount(''); setRefundReason('');
    setError(''); setResult(null); reviewedRefundKey.current = null;
  };
  const orders = [...(summary?.orders || []), ...(summary?.card_verifications || []).map(order => ({ ...order, isVerification: true }))];
  return <Paper id="payment-support" variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 3, minWidth: 0 }}><Stack spacing={1.5}>
    <Typography variant="h6" fontWeight={800}>결제 고객지원</Typography>
    <Typography variant="body2">사용자를 조회한 뒤 결제 목록의 환불 처리 버튼을 눌러 주세요. 검토한 환불 금액과 사유를 입력하고 최종 확인하면 환불을 요청합니다.</Typography>
    {error && !selectedOrder && <Alert severity="error">{error}</Alert>}
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
      <TextField label="사용자 ID (탈퇴 회원 포함)" type="number" value={userId} disabled={busy} onChange={e => changeUser(e.target.value)} />
      <Button disabled={busy || !/^\d+$/.test(userId)} onClick={() => run(async () => { setSummary(null); await load(); return null; })}>결제 내역 조회</Button>
      <Button disabled={busy} onClick={() => run(() => paymentPost('admin/reconcile'))}>통보 누락·예약 복구</Button>
    </Stack>
    {summary && <>
      <Typography variant="subtitle2" fontWeight={800}>사용자 #{userId} 결제 목록</Typography>
      <TableContainer sx={{ maxHeight: 420, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <Table stickyHeader size="small" aria-label="고객지원 결제 목록" sx={{ minWidth: 650 }}>
          <TableHead><TableRow>{['결제일 (한국 시간)', '상품·결제 ID', '결제금액', '기환불액', '상태', '처리'].map(label => <TableCell key={label}>{label}</TableCell>)}</TableRow></TableHead>
          <TableBody>
            {orders.map(order => <TableRow key={order.id}>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>{date(order.paid_at || order.created_at)}</TableCell>
              <TableCell sx={{ minWidth: 180, maxWidth: 280 }}><Typography variant="body2" fontWeight={700}>{order.order_name}</Typography>{order.isVerification && <Typography variant="caption" display="block">카드 등록 확인 결제</Typography>}<Typography variant="caption" sx={{ overflowWrap: 'anywhere' }}>{order.id}</Typography></TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>{order.amount.toLocaleString()}원</TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>{order.refunded_amount.toLocaleString()}원</TableCell>
              <TableCell><Chip size="small" label={statuses[order.status] || order.status} />{order.refund_status && <Typography variant="caption" display="block">환불 {statuses[order.refund_status] || order.refund_status}</Typography>}</TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}><Button color="warning" disabled={busy || !canRefund(order)} onClick={() => selectOrder(order)}>환불 처리</Button></TableCell>
            </TableRow>)}
            {!orders.length && <TableRow><TableCell colSpan={6} align="center">결제 내역이 없습니다.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </TableContainer>
      {Boolean(summary.termination_jobs?.length) && <>
        <Typography variant="subtitle2" fontWeight={800}>구독 종료·탈퇴 검토 목록</Typography>
        <Stack spacing={1}>{summary.termination_jobs.map(job => <Paper key={job.id} variant="outlined" sx={{ p: 1.5 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} gap={1}>
            <Box sx={{ minWidth: 0 }}><Typography variant="body2" fontWeight={700}>{job.scope === 'WITHDRAWAL' ? '탈퇴' : '구독 종료'} · {statuses[job.status] || job.status}</Typography><Typography variant="caption" sx={{ overflowWrap: 'anywhere' }}>{job.id}</Typography><Typography variant="body2">{date(job.terminated_at)} · 자동 처리 환불액 {job.amount.toLocaleString()}원</Typography></Box>
            <Button disabled={busy || job.status !== 'REVIEW'} onClick={() => { setReviewJobId(job.id); setReason(''); setError(''); reviewReasonRef.current?.focus(); }}>검토 완료 처리</Button>
          </Stack>
        </Paper>)}</Stack>
      </>}
    </>}
    <TextField label="고객 요청·처리 사유" value={reason} disabled={busy} inputRef={reviewReasonRef} onChange={e => setReason(e.target.value)} multiline />
    <Button color="warning" disabled={busy || !/^\d+$/.test(userId) || !reason.trim()} onClick={() => { if (window.confirm(`사용자 ${userId}의 구독을 즉시 종료하고 남은 월 제공분을 중단합니다. 각 결제의 약관에 따라 자동 환불하거나 검토 대상으로 접수합니다.`)) run(() => refreshAfterAction(() => paymentPost(`admin/users/${userId}/terminate`, { reason }))); }}>고객 요청으로 즉시 구독 종료</Button>
    <TextField label="검토 완료할 구독 종료·탈퇴 작업 ID" value={reviewJobId} disabled={busy} onChange={e => setReviewJobId(e.target.value)} helperText="위 검토 목록에서 검토 완료 처리를 누르면 자동 입력됩니다. 실제 완료 기록은 아래 버튼으로 진행합니다." />
    <Button disabled={busy || !reviewJobId.trim() || !reason.trim()} onClick={() => { if (window.confirm('환불 여부와 금액 검토를 완료하고, 필요한 환불의 완료를 확인했습니까? 검토 결과는 처리 사유에 기록해 주세요.')) run(() => refreshAfterAction(() => paymentPost(`admin/termination-jobs/${encodeURIComponent(reviewJobId.trim())}/resolve`, { reason }))); }}>환불 검토 완료 기록</Button>
    {result && <Alert severity="info">요청 처리 결과: {statuses[result.status] || '최신 결제·검토 내역을 확인해 주세요.'}{result.refund_id && <Typography variant="caption" display="block" sx={{ overflowWrap: 'anywhere' }}>환불 요청 ID: {result.refund_id}</Typography>}</Alert>}
    {result && <Box component="details"><Box component="summary" sx={{ cursor: 'pointer' }}>처리 결과 상세</Box><Typography component="pre" variant="body2" sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{JSON.stringify(result, null, 2)}</Typography></Box>}
    <Dialog open={Boolean(selectedOrder)} onClose={() => { if (!busy) setSelectedOrder(null); }} fullWidth maxWidth="sm" aria-labelledby="support-refund-title">
      <DialogTitle id="support-refund-title">검토 후 환불 처리</DialogTitle>
      <DialogContent dividers><Stack spacing={2}>
        {error && <Alert severity="error">{error}</Alert>}
        <Typography fontWeight={700}>사용자 #{selectedOrder?.userId} · {selectedOrder?.order_name}</Typography>
        <TextField label="검토한 결제 ID" value={selectedOrder?.id || ''} InputProps={{ readOnly: true }} fullWidth />
        <Typography variant="body2">결제금액 {selectedOrder?.amount.toLocaleString()}원 · 기환불액 {selectedOrder?.refunded_amount.toLocaleString()}원</Typography>
        <Typography variant="body2" color="text.secondary">결제·사용 내역을 검토한 환불액을 입력해 주세요. 환불 가능 여부와 금액은 서버에서 다시 확인합니다.</Typography>
        <TextField label="검토 후 확정한 환불액 (원)" type="number" value={refundAmount} disabled={busy} onChange={e => setRefundField(setRefundAmount, e.target.value)} autoFocus />
        <TextField label="환불 처리 사유" value={refundReason} disabled={busy} onChange={e => setRefundField(setRefundReason, e.target.value)} multiline />
      </Stack></DialogContent>
      <DialogActions>
        <Button disabled={busy} onClick={() => setSelectedOrder(null)}>닫기</Button>
        <Button color="warning" variant="contained" disabled={busy || !selectedOrder || !refundReason.trim() || !/^\d+$/.test(refundAmount) || Number(refundAmount) < 1 || !Number.isSafeInteger(Number(refundAmount))} onClick={() => {
          if (!window.confirm(`사용자 ${selectedOrder.userId}의 결제 ${selectedOrder.id}에 대해 검토한 ${Number(refundAmount).toLocaleString()}원을 환불하고 해당 결제의 남은 꼬막을 회수합니다. 진행하시겠습니까?`)) return;
          reviewedRefundKey.current ||= crypto.randomUUID();
          run(() => refreshAfterAction(async () => {
            const response = await paymentPost(`admin/users/${selectedOrder.userId}/orders/${encodeURIComponent(selectedOrder.id)}/refund`, { reason: refundReason, expected_amount: Number(refundAmount), idempotency_key: reviewedRefundKey.current });
            setSelectedOrder(null);
            return response;
          }));
        }}>검토 금액으로 환불</Button>
      </DialogActions>
    </Dialog>
  </Stack></Paper>;
}
