/* eslint-disable react/prop-types */
import { useRef, useState } from 'react';
import { Alert, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, Stack, TextField, Typography } from '@mui/material';
import { paymentPost } from '@/services/payment-service';

export default function PaymentRefundDialog({ order, busy, error, onClose, onSubmit }) {
  const [amount, setAmount] = useState(() => order?.cancellable_amount ? String(order.cancellable_amount) : '');
  const [reason, setReason] = useState('');
  const [deductCockles, setDeductCockles] = useState(true);
  const requestKey = useRef(null);
  const refundAmount = Number(amount);
  const valid = /^\d+$/.test(amount) && Number.isSafeInteger(refundAmount) && refundAmount > 0
    && (order?.cancellable_amount == null || refundAmount <= order.cancellable_amount);

  const submit = () => {
    const userId = order.user_id;
    const cocklesMessage = deductCockles ? '해당 결제의 남은 꼬막을 회수합니다.' : '해당 결제의 남은 꼬막을 유지합니다.';
    if (!window.confirm(`사용자 ${userId}의 결제 ${order.id}에 대해 ${refundAmount.toLocaleString()}원을 취소합니다. ${cocklesMessage} 진행하시겠습니까?`)) return;
    requestKey.current ||= crypto.randomUUID();
    onSubmit(() => paymentPost(`admin/users/${userId}/orders/${encodeURIComponent(order.id)}/refund`, {
      reason: reason.trim(), expected_amount: refundAmount, idempotency_key: requestKey.current,
      deduct_cockles: deductCockles,
    }));
  };

  return <Dialog open={Boolean(order)} onClose={() => { if (!busy) onClose(); }} fullWidth maxWidth="sm" aria-labelledby="support-refund-title">
    <DialogTitle id="support-refund-title">결제 취소·환불</DialogTitle>
    <DialogContent dividers><Stack spacing={2}>
      {error && <Alert severity="error">{error}</Alert>}
      <Typography fontWeight={700}>사용자 #{order?.user_id} · {order?.order_name}</Typography>
      <TextField label="결제 ID" value={order?.id || ''} slotProps={{ input:{ readOnly:true } }} fullWidth />
      <Typography variant="body2">결제금액 {order?.amount.toLocaleString()}원 · 기환불액 {order?.refunded_amount.toLocaleString()}원</Typography>
      <Typography variant="body2" color="text.secondary">결제·사용 내역을 검토한 뒤 취소 금액을 입력해 주세요. 취소 가능 여부와 금액은 서버에서 다시 확인합니다.</Typography>
      <TextField label="취소 금액 (원)" type="number" value={amount} disabled={busy} onChange={e => { requestKey.current = null; setAmount(e.target.value); }} autoFocus />
      <TextField label="취소 사유" value={reason} disabled={busy} onChange={e => { requestKey.current = null; setReason(e.target.value); }} slotProps={{ htmlInput:{ maxLength:200 } }} multiline />
      <FormControlLabel control={<Checkbox checked={deductCockles} disabled={busy}
        onChange={e => setDeductCockles(e.target.checked)} />} label="해당 결제의 남은 꼬막 회수" />
    </Stack></DialogContent>
    <DialogActions>
      <Button disabled={busy} onClick={onClose}>닫기</Button>
      <Button color="warning" variant="contained" disabled={busy || !order || !reason.trim() || !valid} onClick={submit}>결제 취소 요청</Button>
    </DialogActions>
  </Dialog>;
}
