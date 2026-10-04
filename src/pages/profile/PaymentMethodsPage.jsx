import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Box, Button, Checkbox, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import api from '@/services/api-caller';
import { getMyProfile } from '@/services/profile-service';
import { getPaymentConfig, openBillingKey, paymentError, paymentPost } from '@/services/payment-service';

const pendingStatuses = ['REVOKING','SCHEDULING','RESTORING','REVIEW'];
export default function PaymentMethodsPage() {
  const [returnPlan] = useState(() => { const value = new URLSearchParams(window.location.search).get('plan'); return ['BASIC','STANDARD','PRO'].includes(value) ? value : null; });
  const returnTo = returnPlan ? `/profile?signupPlan=${encodeURIComponent(returnPlan)}#plan` : '/profile#plan';
  const [config, setConfig] = useState(null);
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [dialog, setDialog] = useState(null);
  const [target, setTarget] = useState(null);
  const [accepted, setAccepted] = useState(false);
  const [plan, setPlan] = useState('BASIC');
  const [customer, setCustomer] = useState({ fullName:'', phoneNumber:'', email:'' });
  const handled = useRef(false);
  const pendingKey = useRef(null);
  const retryKey = useRef(null);
  const load = useCallback(async () => {
    const result = (await api.get('/api/v1/payments/methods')).data;
    setData(result);
    return result;
  }, []);
  const confirm = useCallback(async (key) => {
    const result = await paymentPost('methods/confirm', { billing_key:key });
    if (result.status !== 'REGISTERED') throw new Error('카드 등록 결과를 확인해 주세요.');
    setMessage('카드가 목록에 등록되었습니다. 사용할 카드는 결제수단으로 사용 버튼으로 선택해 주세요.');
    pendingKey.current = null;
    window.history.replaceState(null, '', `${window.location.pathname}${returnPlan ? `?plan=${encodeURIComponent(returnPlan)}` : ''}`);
  }, [returnPlan]);
  useEffect(() => {
    if (handled.current) return;
    handled.current = true;
    (async () => {
      try {
        const cfg = await getPaymentConfig();
        setConfig(cfg);
        if (!cfg.enabled || !cfg.eligible) return;
        const params = new URLSearchParams(window.location.search);
        if (params.has('cardRegistrationReturn') || params.has('cardChangeReturn')) {
          if (params.get('code')) {
            window.history.replaceState(null, '', `${window.location.pathname}${returnPlan ? `?plan=${encodeURIComponent(returnPlan)}` : ''}`);
            throw new Error(params.get('message') || '카드 등록이 취소되었습니다.');
          }
          pendingKey.current = params.get('billingKey');
          if (!pendingKey.current) throw new Error('카드 등록 결과가 없습니다. 다시 등록해 주세요.');
          await confirm(pendingKey.current);
        }
        await load();
      } catch (e) { setError(paymentError(e)); }
      finally { setBusy(false); }
    })();
  }, [confirm, load, returnPlan]);
  const perform = async (action) => {
    setBusy(true); setError(''); setMessage('');
    try { await action(); await load(); }
    catch (e) { setError(paymentError(e)); await load().catch(() => {}); }
    finally { setBusy(false); }
  };
  const open = async () => {
    setBusy(true); setError(''); setAccepted(false);
    try {
      const profile = await getMyProfile();
      setCustomer({ fullName:profile.name || '', phoneNumber:profile.phone || '', email:profile.pending_email || profile.email || '' });
      setDialog('card');
    } catch (e) { setError(paymentError(e)); }
    finally { setBusy(false); }
  };
  const register = async () => {
    const contact = { fullName:customer.fullName.trim(), phoneNumber:customer.phoneNumber.replace(/-/g,''), email:customer.email.trim() };
    if (!contact.fullName || !/^0\d{8,10}$/.test(contact.phoneNumber) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) throw new Error('결제자 이름·휴대폰 번호·이메일을 확인해 주세요.');
    const request = await paymentPost('methods/prepare');
    const result = await openBillingKey(request, contact, `/payment-methods?cardRegistrationReturn=1${returnPlan ? `&plan=${encodeURIComponent(returnPlan)}` : ''}`);
    if (!result) return;
    if (result.code) throw new Error(result.message || '카드 등록이 취소되었습니다.');
    if (!result.billingKey) throw new Error('카드 등록 결과가 없습니다.');
    pendingKey.current = result.billingKey;
    setDialog(null);
    await confirm(result.billingKey);
  };
  const pending = pendingStatuses.includes(data?.change_status);
  return <Box sx={{ maxWidth:720, mx:'auto', p:{ xs:2, md:3 } }}><Stack spacing={2}>
    <Stack direction="row" alignItems="center" justifyContent="space-between"><Typography variant="h5" fontWeight={800}>결제수단 관리</Typography><Button component={Link} to={returnTo}>내정보로</Button></Stack>
    {busy && <CircularProgress size={24} />}
    {error && <Alert severity="error">{error}</Alert>}
    {message && <Alert severity="info">{message}</Alert>}
    {config && (!config.enabled || !config.eligible) && <Alert severity="info">{!config.eligible ? '개인 회원 계정에서 결제수단을 관리할 수 있습니다.' : '현재 결제수단 등록을 사용할 수 없습니다.'}</Alert>}
    {config?.enabled && config?.eligible && <>
      {config.billingTestMode && <Alert severity="info">KG이니시스 테스트 정기결제입니다. 국민카드 및 국민카드 계열(카카오뱅크 등)은 테스트 결제를 지원하지 않습니다.</Alert>}
      <Paper variant="outlined" sx={{ p:3, borderRadius:3 }}><Stack spacing={2}>
        <Typography fontWeight={700}>등록된 카드</Typography>
        <Typography variant="body2" color="text.secondary">카드 등록은 목록에 추가만 합니다. 등록된 카드에서 결제수단으로 사용을 선택하면 이후 구독 결제에 적용됩니다. 카드 등록·결제수단 변경으로 지금 결제되지 않습니다.</Typography>
        {data?.next_payment_at && <Typography variant="body2">다음 결제일: {new Date(data.next_payment_at).toLocaleString('ko-KR')}</Typography>}
        {pending && <Alert severity="warning">{data.change_status === 'REVIEW' ? '결제수단 변경 결과 확인이 필요합니다. 고객센터로 문의해 주세요.' : data.change_status === 'RESTORING' ? '기존 카드의 결제 예약을 복원하고 있습니다.' : '결제수단과 다음 결제 예약을 전환하고 있습니다.'} 완료 전에는 추가 변경·재결제를 진행할 수 없습니다.</Alert>}
        {data?.change_status === 'FAILED' && <Alert severity="warning">결제수단 변경에 실패했습니다. 기존 카드와 결제 예약을 유지했습니다.</Alert>}
        {!data && <Typography>{busy ? '카드 목록을 불러오는 중입니다.' : '카드 목록을 불러오지 못했습니다.'}</Typography>}
        {data?.cards.length === 0 && <Typography>등록된 카드가 없습니다.</Typography>}
        {data?.cards.map((card) => <Paper key={card.id} variant="outlined" sx={{ p:2, borderColor:card.selected ? 'primary.main' : 'divider' }}><Stack spacing={1}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap"><Typography fontWeight={700}>{card.name}</Typography>{card.selected && <Chip size="small" color="primary" label="현재 결제수단" />}</Stack>
          <Typography>{card.number}</Typography>
          {card.unavailable && <Typography variant="body2" color="error">카드 정보를 확인하지 못했습니다. 잠시 후 다시 확인해 주세요.</Typography>}
          {card.status === 'DELETING' && <Typography variant="body2">카드 삭제 결과를 확인 중입니다.</Typography>}
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {!card.selected && card.status === 'ACTIVE' && <Button variant="outlined" disabled={busy || !card.can_select || Boolean(pendingKey.current)} onClick={() => { setTarget(card); setDialog('select'); }}>결제수단으로 사용</Button>}
            <Button color="error" disabled={busy || !card.can_delete || Boolean(pendingKey.current)} onClick={() => { setTarget(card); setDialog('delete'); }}>{card.status === 'DELETING' ? '삭제 상태 확인' : '카드 삭제'}</Button>
          </Stack>
          {card.selected && <Typography variant="caption" color="text.secondary">다른 카드를 결제수단으로 선택한 뒤 삭제할 수 있습니다.</Typography>}
        </Stack></Paper>)}
        {data?.can_register && <Button variant="contained" disabled={busy || Boolean(pendingKey.current)} onClick={open}>카드 등록</Button>}
        {data && !data.plan_code && <Button component={Link} to={returnTo}>구독 시작</Button>}
        {data?.can_retry && !pending && <Button variant="outlined" disabled={busy || Boolean(pendingKey.current)} onClick={() => { setAccepted(false); setPlan(data.plan_code); retryKey.current = crypto.randomUUID(); setDialog('retry'); }}>첫 결제 재시도</Button>}
        {pendingKey.current && <Button disabled={busy} onClick={() => perform(() => confirm(pendingKey.current))}>카드 등록 결과 다시 확인</Button>}
      </Stack></Paper>
      <Stack direction="row" spacing={1}><Button disabled={busy} onClick={() => perform(load)}>새로고침</Button><Button component={Link} to="/payment-history">결제내역 보기</Button></Stack>
    </>}
  </Stack>
  <Dialog open={Boolean(dialog)} onClose={() => { if (!busy) setDialog(null); }} fullWidth maxWidth="sm">
    <DialogTitle>{dialog === 'retry' ? '첫 구독 결제 재시도' : dialog === 'select' ? '결제수단 변경' : dialog === 'delete' ? '카드 삭제' : '카드 등록'}</DialogTitle>
    <DialogContent dividers><Stack spacing={2}>
      {error && <Alert severity="error">{error}</Alert>}
      {['select','delete'].includes(dialog) ? <>
        <Typography fontWeight={700}>{target?.name} · {target?.number}</Typography>
        <Alert severity={dialog === 'delete' ? 'warning' : 'info'}>{dialog === 'delete' ? '이 카드를 목록과 PG에서 삭제합니다. 다시 사용하려면 새로 등록해야 합니다.' : '이 카드를 이후 구독 결제에 사용합니다. 지금 결제되지 않으며 요금제·이용기간·꼬막 잔액과 자동 갱신 해지 상태는 유지됩니다.'}</Alert>
      </> : dialog === 'retry' ? <>
        <Alert severity="info">현재 등록된 카드로 첫 구독 결제를 요청합니다. 승인 후 유료 이용이 시작됩니다.</Alert>
        <TextField select label="요금제" value={plan} disabled={busy} onChange={(e) => { setPlan(e.target.value); setAccepted(false); retryKey.current = crypto.randomUUID(); }}>
          {['BASIC','STANDARD','PRO'].map((code) => <MenuItem key={code} value={code}>{config?.products[code].name} · {config?.products[code].amount.toLocaleString()}원</MenuItem>)}
        </TextField>
      </> : <>
        <Alert severity="info">카드를 목록에 추가합니다. 현재 결제수단과 다음 결제 예약은 그대로 유지됩니다. 등록 후 사용할 카드를 따로 선택해 주세요.</Alert>
        {[['fullName','결제자 이름'],['phoneNumber','휴대폰 번호'],['email','이메일']].map(([key,label]) => <TextField key={key} label={label} required value={customer[key]} disabled={busy} type={key === 'email' ? 'email' : key === 'phoneNumber' ? 'tel' : 'text'} onChange={(e) => setCustomer({ ...customer, [key]:e.target.value })} />)}
      </>}
      {!['select','delete'].includes(dialog) && <FormControlLabel control={<Checkbox checked={accepted} disabled={busy} onChange={(e) => setAccepted(e.target.checked)} />} label={dialog === 'retry' ? <Typography variant="body2"><Link to="/terms" target="_blank">이용약관</Link>, 월 자동결제·제공분 소멸·미사용분 비례 환불에 동의합니다.</Typography> : '이 카드를 결제수단 목록에 저장하는 데 동의합니다.'} />}
    </Stack></DialogContent>
    <DialogActions><Button disabled={busy} onClick={() => setDialog(null)}>닫기</Button><Button variant="contained" disabled={busy || (!['select','delete'].includes(dialog) && !accepted)} onClick={() => perform(async () => {
      if (dialog === 'select') {
        const result = await paymentPost('methods/select', { method_id:target.id });
        setMessage(result.status === 'COMPLETED' ? '결제수단이 변경되었습니다. 지금 결제는 발생하지 않습니다.' : result.status === 'FAILED' ? '변경에 실패해 기존 결제수단과 예약을 유지했습니다.' : '결제수단 변경 결과를 확인 중입니다. 새로고침으로 확인해 주세요.');
        setDialog(null);
      } else if (dialog === 'delete') {
        const result = (await api.delete(`/api/v1/payments/methods/${encodeURIComponent(target.id)}`, {}, { timeout:60000 })).data;
        setMessage(result.status === 'DELETED' ? '카드가 삭제되었습니다.' : '카드 삭제 결과를 확인 중입니다. 새로고침으로 확인해 주세요.');
        setDialog(null);
      } else if (dialog === 'retry') {
        const result = await paymentPost('subscriptions/retry', { plan_code:plan, accepted:true, consent_version:config.policyVersion, idempotency_key:retryKey.current });
        setMessage(result.status === 'PAID' ? '첫 결제가 완료되었습니다.' : result.status === 'FAILED' ? '첫 결제가 실패했습니다. 결제내역을 확인해 주세요.' : '결제 결과 확인이 필요합니다. 재결제 전에 결제내역을 확인해 주세요.');
        setDialog(null);
      } else await register();
    })}>{busy ? '처리 중…' : dialog === 'retry' ? `${config?.products[plan].amount.toLocaleString()}원 결제` : dialog === 'select' ? '결제수단 변경' : dialog === 'delete' ? '카드 삭제' : '카드 등록'}</Button></DialogActions>
  </Dialog></Box>;
}
