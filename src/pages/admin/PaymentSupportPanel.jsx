import { useRef, useState } from 'react';
import { Alert, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import api from '@/services/api-caller';
import { paymentError, paymentPost } from '@/services/payment-service';

export default function PaymentSupportPanel() {
  const [userId,setUserId]=useState('');
  const [reason,setReason]=useState('');
  const [paymentId,setPaymentId]=useState('');
  const [refundAmount,setRefundAmount]=useState('');
  const [reviewJobId,setReviewJobId]=useState('');
  const reviewedRefundKey=useRef(null);
  const setRefundField=(setter,value)=>{reviewedRefundKey.current=null;setter(value);};
  const [result,setResult]=useState(null);
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  const run=async(action)=>{setBusy(true);setError('');try{setResult(await action());}catch(e){setError(paymentError(e));}finally{setBusy(false);}};
  return <Paper variant="outlined" sx={{p:2,mb:3,borderRadius:3}}><Stack spacing={1.5}>
    <Typography variant="h6" fontWeight={800}>결제 고객지원</Typography>
    <Typography variant="body2">결제 후 7일 이내 꼬막 미사용 시 전액 자동 환불합니다. 그 외 건은 계약·사용 내역과 관계 법령을 검토하여 금액을 결정합니다. 즉시 구독 종료는 자동 갱신과 남은 월 제공분을 중단합니다.</Typography>
    {error&&<Alert severity="error">{error}</Alert>}
    <Stack direction={{xs:'column',sm:'row'}} spacing={1}>
      <TextField label="사용자 ID (탈퇴 회원 포함)" type="number" value={userId} onChange={e=>setRefundField(setUserId,e.target.value)} />
      <Button disabled={busy||!/^\d+$/.test(userId)} onClick={()=>run(async()=> (await api.get(`/api/v1/payments/admin/users/${userId}`)).data)}>결제 내역 조회</Button>
      <Button disabled={busy} onClick={()=>run(()=>paymentPost('admin/reconcile'))}>통보 누락·예약 복구</Button>
    </Stack>
    <TextField label="고객 요청·처리 사유" value={reason} onChange={e=>setRefundField(setReason,e.target.value)} multiline />
    <Button color="warning" disabled={busy||!/^\d+$/.test(userId)||!reason.trim()} onClick={()=>{if(window.confirm(`사용자 ${userId}의 구독을 즉시 종료하고 남은 월 제공분을 중단합니다. 각 결제의 약관에 따라 자동 환불하거나 검토 대상으로 접수합니다.`))run(()=>paymentPost(`admin/users/${userId}/terminate`,{reason}));}}>고객 요청으로 즉시 구독 종료</Button>
    <Typography variant="subtitle2">검토 후 환불 처리</Typography>
    <TextField label="검토한 결제 ID" value={paymentId} onChange={e=>setRefundField(setPaymentId,e.target.value)} />
    <TextField label="검토 후 확정한 환불액 (원)" type="number" value={refundAmount} onChange={e=>setRefundField(setRefundAmount,e.target.value)} />
    <Button color="warning" disabled={busy||!/^\d+$/.test(userId)||!paymentId.trim()||!reason.trim()||!/^\d+$/.test(refundAmount)||Number(refundAmount)<1||!Number.isSafeInteger(Number(refundAmount))} onClick={()=>{if(window.confirm(`사용자 ${userId}의 결제 ${paymentId}에 대해 검토한 ${Number(refundAmount).toLocaleString()}원을 환불하고 해당 결제의 남은 꼬막을 회수합니다. 진행하시겠습니까?`)){reviewedRefundKey.current ||= crypto.randomUUID();run(()=>paymentPost(`admin/users/${userId}/orders/${encodeURIComponent(paymentId.trim())}/refund`,{reason,expected_amount:Number(refundAmount),idempotency_key:reviewedRefundKey.current}));}}}>검토 금액으로 환불</Button>
    <TextField label="검토 완료할 구독 종료·탈퇴 작업 ID" value={reviewJobId} onChange={e=>setReviewJobId(e.target.value)} />
    <Button disabled={busy||!reviewJobId.trim()||!reason.trim()} onClick={()=>{if(window.confirm('환불 여부와 금액 검토를 완료하고, 필요한 환불의 완료를 확인했습니까? 검토 결과는 처리 사유에 기록해 주세요.'))run(()=>paymentPost(`admin/termination-jobs/${encodeURIComponent(reviewJobId.trim())}/resolve`,{reason}));}}>환불 검토 완료 기록</Button>
    {result&&<Typography component="pre" variant="body2" sx={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',maxHeight:300,overflow:'auto'}}>{JSON.stringify(result,null,2)}</Typography>}
  </Stack></Paper>;
}
