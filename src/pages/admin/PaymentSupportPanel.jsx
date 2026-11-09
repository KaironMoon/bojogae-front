import { useEffect, useRef, useState } from 'react';
import { Alert, Box, Button, Chip, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';
import api from '@/services/api-caller';
import { paymentError, paymentPost } from '@/services/payment-service';
import PaymentRefundDialog from './PaymentRefundDialog';

const statuses = { READY: '결제 대기', SCHEDULED: '예약됨', PAID: '결제 완료', FAILED: '결제 실패', CANCELED: '취소', REVIEW: '검토 필요', PENDING: '처리 중', COMPLETED: '완료', PENDING_VERIFICATION: '환불 결과 확인 중' };
const terminationMessages = {
  PENDING: '구독을 종료했습니다. 환불 처리가 진행 중입니다.',
  REVIEW: '구독을 종료했습니다. 환불 결과는 관리자 검토가 필요합니다.',
  COMPLETED: '구독 종료와 환불 처리가 완료됐습니다.',
};
const date = value => value ? new Date(value).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }) : '-';
const canRefund = order => !order.isVerification && order.status === 'PAID' && order.refunded_amount < order.amount && !['PENDING', 'REVIEW'].includes(order.refund_status);

// eslint-disable-next-line react/prop-types
export default function PaymentSupportPanel({ customer, onChanged, onBusyChange } = {}) {
  // eslint-disable-next-line react/prop-types
  const [userId, setUserId] = useState(customer ? String(customer.user_id) : '');
  const [summary, setSummary] = useState(null);
  const [reason, setReason] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  // eslint-disable-next-line react/prop-types
  const [reviewJobId, setReviewJobId] = useState(customer?.id || '');
  const reviewReasonRef = useRef(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(Boolean(customer));
  useEffect(() => { onBusyChange?.(busy); }, [busy, onBusyChange]);
  useEffect(() => {
    if (!customer) return;
    let active = true;
    // The parent mounts a new panel for each selected job, so data cannot cross customers.
    // eslint-disable-next-line react/prop-types
    api.get(`/api/v1/payments/admin/users/${customer.user_id}`).then(({ data }) => { if (active) setSummary(data); })
      .catch(e => { if (active) setError(paymentError(e)); })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [customer]);
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
    // Keep the action result even if refreshing the list fails.
    try { await load(); onChanged?.(); } catch (e) { setError(`처리 후 목록을 다시 불러오지 못했습니다. ${paymentError(e)}`); }
    return response;
  };
  const changeUser = value => {
    setUserId(value); setSummary(null); setSelectedOrder(null);
    setReviewJobId(''); setReason(''); setResult(null); setError('');
  };
  const selectOrder = order => {
    setSelectedOrder({ ...order, user_id:userId });
    setError(''); setResult(null);
  };
  const terminateSubscription = () => {
    if (!window.confirm(`사용자 ${userId}의 구독을 즉시 종료하고 남은 월 제공분을 중단합니다. 각 결제의 약관에 따라 자동 환불하거나 검토 대상으로 접수합니다.`)) return;
    run(() => refreshAfterAction(async () => {
      const response = await paymentPost(`admin/users/${userId}/terminate`, { reason });
      setReviewJobId(response.job_id);
      return response;
    }));
  };
  const orders = [...(summary?.orders || []), ...(summary?.card_verifications || []).map(order => ({ ...order, isVerification: true }))];
  const selectedReview = summary?.termination_jobs?.find(job => job.id === reviewJobId);
  return <Paper id={customer ? 'payment-customer-support' : 'payment-support'} variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 3, minWidth: 0 }}><Stack spacing={1.5}>
    <Typography variant="h6" fontWeight={800}>결제 고객지원</Typography>
    <Typography variant="body2">결제 목록의 환불 처리 버튼으로 환불을 요청하거나, 처리 사유를 입력해 선택한 건의 검토를 완료할 수 있습니다.</Typography>
    {error && !selectedOrder && <Alert severity="error">{error}</Alert>}
    {!customer && <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
      <TextField label="사용자 ID (탈퇴 회원 포함)" type="number" value={userId} disabled={busy} onChange={e => changeUser(e.target.value)} />
      <Button disabled={busy || !/^\d+$/.test(userId)} onClick={() => run(async () => { setSummary(null); await load(); return null; })}>결제 내역 조회</Button>
      <Button disabled={busy} onClick={() => run(() => paymentPost('admin/reconcile'))}>통보 누락·예약 복구</Button>
    </Stack>}
    {customer && <Button disabled={busy} onClick={() => run(async () => { await load(); return null; })}>상세 내역 새로고침</Button>}
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
    <Button color="warning" disabled={busy || !/^\d+$/.test(userId) || !reason.trim()} onClick={terminateSubscription}>고객 요청으로 즉시 구독 종료</Button>
    {result?.refund_status && <Alert severity={result.refund_status === 'REVIEW' ? 'warning' : 'info'}>
      {terminationMessages[result.refund_status]} · {result.amount.toLocaleString()}원
    </Alert>}
    {selectedReview && <Alert severity={selectedReview.status === 'REVIEW' ? 'warning' : 'info'}>선택한 {selectedReview.scope === 'WITHDRAWAL' ? '탈퇴' : '구독 종료'} 검토 · {date(selectedReview.terminated_at)} · {statuses[selectedReview.status] || selectedReview.status}</Alert>}
    <Button disabled={busy || selectedReview?.status !== 'REVIEW' || !reason.trim()} onClick={() => { if (window.confirm('환불 여부와 금액 검토를 완료하고, 필요한 환불의 완료를 확인했습니까? 검토 결과는 처리 사유에 기록해 주세요.')) run(() => refreshAfterAction(() => paymentPost(`admin/termination-jobs/${encodeURIComponent(reviewJobId)}/resolve`, { reason }))); }}>환불 검토 완료 기록</Button>
    {result && !result.refund_status && <Alert severity="info">요청 처리 결과: {statuses[result.status] || '최신 결제·검토 내역을 확인해 주세요.'}{result.refund_id && <Typography variant="caption" display="block" sx={{ overflowWrap: 'anywhere' }}>환불 요청 ID: {result.refund_id}</Typography>}</Alert>}
    {result && <Box component="details"><Box component="summary" sx={{ cursor: 'pointer' }}>처리 결과 상세</Box><Typography component="pre" variant="body2" sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{JSON.stringify(result, null, 2)}</Typography></Box>}
    <PaymentRefundDialog key={selectedOrder?.id || 'closed'} order={selectedOrder} busy={busy} error={error}
      onClose={() => setSelectedOrder(null)} onSubmit={action => run(() => refreshAfterAction(async () => {
        const response = await action();
        setSelectedOrder(null);
        return response;
      }))} />
  </Stack></Paper>;
}
