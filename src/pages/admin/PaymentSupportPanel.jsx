import { useState } from 'react';
import { Alert, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import api from '@/services/api-caller';
import { paymentError, paymentPost } from '@/services/payment-service';

export default function PaymentSupportPanel() {
  const [userId,setUserId]=useState('');
  const [reason,setReason]=useState('');
  const [result,setResult]=useState(null);
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  const run=async(action)=>{setBusy(true);setError('');try{setResult(await action());}catch(e){setError(paymentError(e));}finally{setBusy(false);}};
  return <Paper variant="outlined" sx={{p:2,mb:3,borderRadius:3}}><Stack spacing={1.5}>
    <Typography variant="h6" fontWeight={800}>결제 고객지원</Typography>
    <Typography variant="body2">즉시 구독 종료 시 남은 월 제공 꼬막 비율로 구독료를 자동 환불합니다. 자동 정산이 어려운 결제 건과 기존 구매분 환불은 내역·계약을 확인해 정산합니다. 즉시 구독 종료는 자동 갱신과 남은 월 제공분을 중단하며, 구매 꼬막과 환불 권리는 유지됩니다.</Typography>
    {error&&<Alert severity="error">{error}</Alert>}
    <Stack direction={{xs:'column',sm:'row'}} spacing={1}>
      <TextField label="사용자 ID (탈퇴 회원 포함)" type="number" value={userId} onChange={e=>setUserId(e.target.value)} />
      <Button disabled={busy||!/^\d+$/.test(userId)} onClick={()=>run(async()=> (await api.get(`/api/v1/payments/admin/users/${userId}`)).data)}>결제 내역 조회</Button>
      <Button disabled={busy} onClick={()=>run(()=>paymentPost('admin/reconcile'))}>통보 누락·예약 복구</Button>
    </Stack>
    <TextField label="고객 요청·처리 사유" value={reason} onChange={e=>setReason(e.target.value)} multiline />
    <Button color="warning" disabled={busy||!/^\d+$/.test(userId)||!reason.trim()} onClick={()=>{if(window.confirm(`사용자 ${userId}의 구독을 즉시 종료하고 남은 월 제공분을 중단합니다. 남은 월 제공 꼬막 비율로 구독료를 자동 환불합니다.`))run(()=>paymentPost(`admin/users/${userId}/terminate`,{reason}));}}>고객 요청으로 즉시 구독 종료</Button>
    {result&&<Typography component="pre" variant="body2" sx={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',maxHeight:300,overflow:'auto'}}>{JSON.stringify(result,null,2)}</Typography>}
  </Stack></Paper>;
}
