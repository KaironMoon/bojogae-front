/* eslint-disable react/prop-types */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Box, Button, Checkbox, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, Radio, RadioGroup, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import KkomakIcon from '@/pages/components/KkomakIcon';
import { getMyProfile, savePaymentContact } from '@/services/profile-service';
import { getPayments, getTerminationPreview, openBillingKey, openPayment, paymentError, paymentPost } from '@/services/payment-service';

const date = (v) => v ? new Date(v).toLocaleString('ko-KR') : '-';
const subscriptionStatuses = { ACTIVE:'구독 중', CANCELING:'자동 갱신 해지', CANCELED:'구독 종료', FAILED:'결제 실패', PENDING:'첫 결제 대기', REVIEW:'고객센터 확인 필요' };
function checkResult(verified) {
  if (verified.status === 'FAILED') throw new Error('결제가 실패했습니다. 꼬막은 지급되지 않았습니다. 결제 내역을 확인해 주세요.');
  if (['REVIEW','CANCELED'].includes(verified.status)) throw new Error('결제 내역 확인이 필요합니다. 고객센터로 문의해 주세요.');
}
export default function PaymentSection({ config, onChanged, onContactSaved }) {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [dialog, setDialog] = useState(null);
  const [cancelMode, setCancelMode] = useState('period_end');
  const [terminationQuote, setTerminationQuote] = useState(null);
  const [plan, setPlan] = useState('STANDARD');
  const [upgradeQuote, setUpgradeQuote] = useState(null);
  const [quoteBusy, setQuoteBusy] = useState(false);
  const [customer, setCustomer] = useState({ fullName:'', phoneNumber:'', email:'' });
  const [saveContact, setSaveContact] = useState(false);
  const [contactMessage, setContactMessage] = useState('');
  const returnHandled = useRef(false);
  const signupHandled = useRef(false);
  const signupPlan = useRef(null);
  const topupKey = useRef(null);
  const retryKey = useRef(null);
  const load = useCallback(async () => { setData(await getPayments()); }, []);
  const perform = useCallback(async (action) => {
    setBusy(true); setError(''); setMessage('');
    try { await action(); await load(); }
    catch (e) { setError(paymentError(e)); await load().catch(() => {}); }
    finally { if (onChanged) await onChanged().catch(() => {}); setBusy(false); }
  }, [load, onChanged]);
  useEffect(() => { load().catch((e) => setError(paymentError(e))); }, [load]);
  useEffect(() => {
    if (returnHandled.current) return;
    const params = new URLSearchParams(window.location.search);
    const id = params.get('paymentId'); const billingKey = params.get('billingKey');
    if (!params.has('paymentReturn') && !params.has('billingReturn')) return;
    returnHandled.current = true;
    // IDs supplied by the SDK redirect are verified with PortOne on the server.
    perform(async () => {
      if (params.get('code')) throw new Error(params.get('message') || '결제가 취소되었습니다.');
      if (id) checkResult(await paymentPost(`orders/${encodeURIComponent(id)}/complete`));
      else if (billingKey) checkResult(await paymentPost('subscriptions/activate', { billing_key:billingKey }));
      else throw new Error('결제 결과가 없습니다. 결제 내역을 확인해 주세요.');
      window.history.replaceState(null, '', `${window.location.pathname}#plan`);
    });
  }, [perform]);
  const sub = data?.subscription;
  const active = Boolean(sub?.is_active);
  const canRetry = Boolean(sub?.can_retry_first_payment);
  const upgrading = dialog === 'change' && config.products[plan]?.amount > config.products[sub?.plan_code]?.amount;
  useEffect(() => {
    let cancelled = false;
    setUpgradeQuote(null);
    if (!upgrading) { setQuoteBusy(false); return; }
    setQuoteBusy(true); setError('');
    paymentPost('subscriptions/upgrade-quote', { plan_code:plan })
      .then((quote) => { if (!cancelled) setUpgradeQuote(quote); })
      .catch((e) => { if (!cancelled) setError(paymentError(e)); })
      .finally(() => { if (!cancelled) setQuoteBusy(false); });
    return () => { cancelled = true; };
  }, [upgrading, plan, sub?.plan_code]);
  const consent = { accepted:true, consent_version:config.policyVersion };
  const openDialog = async (mode) => {
    setAccepted(false); setError(''); setMessage('');
    setCancelMode('period_end'); setTerminationQuote(null);
    setPlan(sub?.next_plan_code || sub?.plan_code || signupPlan.current || 'STANDARD');
    if (mode === 'cancel') {
      setDialog(mode); setQuoteBusy(true);
      try { setTerminationQuote(await getTerminationPreview()); }
      catch (e) { setError(paymentError(e)); }
      finally { setQuoteBusy(false); }
      return;
    }
    if (mode === 'retry') retryKey.current = crypto.randomUUID();
    setSaveContact(false); setContactMessage('');
    if (['subscribe','topup'].includes(mode)) {
      setBusy(true);
      try {
        const profile = await getMyProfile();
        setCustomer({ fullName:profile.name || '', phoneNumber:profile.phone || '', email:profile.pending_email || profile.email || '' });
      } catch {
        setError('내정보를 불러오지 못했습니다. 다시 시도해 주세요.');
        return;
      } finally { setBusy(false); }
    }
    setDialog(mode);
  };
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const selected = params.get('signupPlan');
    if (!data || signupHandled.current || !['BASIC','STANDARD','PRO'].includes(selected)) return;
    signupHandled.current = true;
    signupPlan.current = selected;
    setPlan(selected);
    params.delete('signupPlan');
    window.history.replaceState(null, '', `${window.location.pathname}${params.size ? `?${params}` : ''}#plan`);
    if (active) { setMessage('이미 구독 중입니다. 요금제를 바꾸려면 요금제 변경을 이용해 주세요.'); return; }
    setBusy(true); setError(''); setAccepted(false); setSaveContact(false);
    getMyProfile().then((profile) => {
      setCustomer({ fullName:profile.name || '', phoneNumber:profile.phone || '', email:profile.pending_email || profile.email || '' });
      if (canRetry) retryKey.current = crypto.randomUUID();
      setDialog(canRetry ? 'retry' : 'subscribe');
      setMessage('가입이 완료되었습니다. 선택한 요금제의 결제를 완료하면 유료 이용이 시작됩니다.');
    }).catch(() => setError('가입은 완료됐지만 결제자 정보를 불러오지 못했습니다. 구독 시작 버튼으로 다시 진행해 주세요.'))
      .finally(() => setBusy(false));
  }, [data, active, canRetry]);

  const purchase = async (topup) => {
    if (!accepted) return;
    if (!customer.fullName.trim() || !/^0\d{8,10}$/.test(customer.phoneNumber.replace(/-/g,'')) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
      throw new Error('결제자 이름·휴대폰 번호·이메일을 확인해 주세요.');
    }
    const contact = { fullName:customer.fullName.trim(), phoneNumber:customer.phoneNumber.replace(/-/g,''), email:customer.email.trim() };
    if (saveContact) {
      let updated;
      try {
        updated = await savePaymentContact({ name:contact.fullName, phone:contact.phoneNumber, email:contact.email });
      } catch {
        throw new Error('내정보 저장에 실패했습니다. 결제는 요청되지 않았습니다. 다시 시도하거나 저장 체크를 해제해 주세요.');
      }
      onContactSaved?.(updated);
      setContactMessage(updated.pending_email ? '결제자 정보를 저장했습니다. 변경한 이메일은 내정보에서 인증해 주세요.' : '결제자 정보를 내정보에 저장했습니다.');
      setSaveContact(false);
    }
    if (topup) {
      topupKey.current ||= crypto.randomUUID();
      const order = await paymentPost('orders', { ...consent, idempotency_key:topupKey.current });
      const result = await openPayment(order, contact);
      if (!result) return; // Mobile redirect continues on the return URL.
      if (result.code) throw new Error(result.message || '결제가 취소되었습니다.');
      const verified = await paymentPost(`orders/${encodeURIComponent(order.paymentId)}/complete`);
      checkResult(verified);
      if (verified.status === 'PAID') topupKey.current = null;
      setMessage(verified.status === 'PAID' ? '150꼬막이 충전되었습니다.' : '결제 확인 대기 중입니다. 다시 결제하지 말고 내역을 확인해 주세요.');
    } else {
      const request = await paymentPost('subscriptions/prepare', { ...consent, plan_code:plan });
      const result = await openBillingKey(request, contact);
      if (!result) return;
      if (result.code) throw new Error(result.message || '카드 등록이 취소되었습니다.');
      const verified = await paymentPost('subscriptions/activate', { billing_key:result.billingKey });
      checkResult(verified);
      setMessage(verified.status === 'PAID' ? '첫 구독 결제가 확인되어 꼬막이 지급되었습니다.' : '첫 결제 상태를 확인 중입니다.');
    }
  };
  return <><Paper id="plan" variant="outlined" sx={{ p:{ xs:2, md:3 }, mb:3, borderRadius:3 }}>
    <Stack spacing={2}>
      <Stack direction="row" spacing={1} alignItems="center"><KkomakIcon size={42} /><Typography variant="h6" fontWeight={800}>구독·꼬막 충전</Typography></Stack>
      <Alert severity="info">{config.testMode ? 'KG이니시스 테스트 결제입니다. ' : config.paymentTestMode || config.billingTestMode ? `KG이니시스 ${config.paymentTestMode ? '추가 충전' : '정기'} 결제는 테스트 채널입니다. ` : ''}월 제공분은 한 달 후 소멸하며, 다음 결제 승인 시 재지급됩니다.</Alert>
      {error && !dialog && <Alert severity="error">{error}</Alert>}{message && <Alert severity="success">{message}</Alert>}
      {!data && !error && <CircularProgress size={24} />}
      {data && <Box><Typography fontWeight={700}>{active ? `${config.products[sub.current_plan_code]?.name} · ${subscriptionStatuses[sub.status] || '상태 확인 필요'}` : '프리 요금제'}</Typography>
        {active && <Typography variant="body2">현재 이용기간 종료: {date(sub.period_end)}</Typography>}
        {!active && sub && !sub.period_end && <Typography variant="body2">{sub.status === 'PENDING' ? '첫 결제 대기 중입니다.' : '첫 결제가 완료되지 않았습니다.'} 첫 결제 승인 후 이용기간이 시작됩니다.</Typography>}
        {active && sub.next_plan_code && sub.next_plan_code !== sub.plan_code && <Typography>다음 결제부터 {config.products[sub.next_plan_code]?.name}</Typography>}
        {sub?.status === 'FAILED' && <Alert severity="warning">결제 실패로 새 월 제공분이 지급되지 않았습니다. 자동 재결제는 하지 않습니다.</Alert>}
      </Box>}
      <Stack direction={{ xs:'column', sm:'row' }} spacing={1}>
        {active ? <Button variant="contained" disabled={busy} onClick={() => openDialog('change')}>요금제 변경</Button> : <Button variant="contained" disabled={busy || !data} onClick={() => openDialog(canRetry ? 'retry' : 'subscribe')}>{canRetry ? '요금제 선택·재결제' : '구독 시작'}</Button>}
        {canRetry && <Button disabled={busy} onClick={() => openDialog('subscribe')}>다른 카드 등록</Button>}
        <Button variant="outlined" startIcon={<KkomakIcon />} disabled={busy || !active} onClick={() => openDialog('topup')}>9,900원 · 150꼬막 충전</Button>
        {active && <Button color="warning" disabled={busy} onClick={() => openDialog('cancel')}>구독 해지</Button>}
      </Stack>
      <Typography variant="body2" color="text.secondary">추가 충전은 유료 이용기간 중 가능합니다.</Typography>
      <Button component={Link} to="/payment-history" variant="text">결제내역 보기</Button>
      <Button disabled={busy} onClick={() => perform(load)}>새로고침</Button>
    </Stack>
  </Paper>
    <Dialog open={Boolean(dialog)} onClose={() => { if (!busy) setDialog(null); }} fullWidth maxWidth="sm" aria-labelledby="payment-dialog-title">
      <DialogTitle id="payment-dialog-title">{dialog === 'cancel' ? '구독 해지' : dialog === 'change' ? '요금제 변경' : dialog === 'topup' ? '꼬막 추가 충전' : dialog === 'retry' ? '요금제 선택·첫 결제 재시도' : '구독 시작·카드 등록'}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          {error && <Alert severity="error">{error}</Alert>}
          {dialog === 'cancel' ? <>
            <RadioGroup value={cancelMode} onChange={(e) => setCancelMode(e.target.value)}>
              <FormControlLabel value="period_end" disabled={busy} control={<Radio />} label="이용기간 종료 후 해지" />
              <FormControlLabel value="immediate" disabled={busy} control={<Radio />} label="즉시 구독 종료·자동 환불" />
            </RadioGroup>
            {cancelMode === 'period_end' ? <Alert severity="info">{date(sub?.period_end)}까지 이용하고 다음 자동 결제부터 중단합니다. 이미 결제한 구독료는 환불하지 않습니다.</Alert> : <>
              <Alert severity="warning">구독을 즉시 종료하고 월 제공 꼬막을 회수합니다. 추가 구매 꼬막은 원래 유효기간까지 유지됩니다.</Alert>
              {quoteBusy ? <CircularProgress size={24} /> : terminationQuote && <Typography fontWeight={700}>예상 구독료 환불액: {terminationQuote.amount.toLocaleString()}원</Typography>}
              <Typography variant="body2" color="text.secondary">해당 결제로 지급한 꼬막 중 남은 수량의 비율로 계산하며 원 미만은 올림합니다. 확정 금액은 해지 시점의 잔액 기준이며 환불은 결제한 카드로 처리됩니다.</Typography>
              {terminationQuote?.requires_review && <Alert severity="warning">기존 환불 확인이 필요한 결제가 있습니다. 해당 건은 관리자 확인 후 처리됩니다.</Alert>}
              <FormControlLabel control={<Checkbox checked={accepted} disabled={busy} onChange={(e) => setAccepted(e.target.checked)} />} label="즉시 이용 종료·월 제공 꼬막 회수 및 자동 환불에 동의합니다." />
            </>}
          </> : <>
          {dialog === 'change' ? <Alert severity="info">{upgrading ? '남은 이용기간의 요금 차액을 등록된 카드로 결제하면 즉시 업그레이드됩니다. 기존 잔액과 다음 결제일은 유지됩니다.' : '상위 요금제는 남은 기간의 차액 결제 후 즉시 적용되고, 하위 요금제는 다음 결제부터 적용됩니다. 기존 결제일과 등록된 카드는 유지됩니다.'}</Alert> : dialog === 'retry' ? <Alert severity="info">등록된 카드로 선택한 요금제의 첫 결제를 다시 요청합니다. 승인되면 이용기간이 시작되고 이후 매월 자동 결제됩니다.</Alert> : <Typography variant="body2">결제자 정보를 확인한 뒤 KG이니시스 결제창으로 이동합니다.</Typography>}
          {dialog === 'change' && sub?.cancel_at_period_end && <Alert severity="warning">{upgrading ? '차액 결제가 승인되면 자동 갱신 해지를 철회하고 다음 결제일부터 새 요금제 전액으로 자동 결제를 재개합니다.' : '자동 갱신 해지를 철회하고 선택한 요금제로 다음 회차부터 자동 결제를 재개합니다.'}</Alert>}
          {dialog === 'topup' ? <Typography fontWeight={700}>9,900원 · 150꼬막 · 구매일부터 1년</Typography> :
            <TextField select label="요금제" value={plan} onChange={(e) => { setAccepted(false); setUpgradeQuote(null); setPlan(e.target.value); }} disabled={busy || quoteBusy} fullWidth>
              {['BASIC','STANDARD','PRO'].map((code) => <MenuItem key={code} value={code}>{config.products[code].name} · {config.products[code].amount.toLocaleString()}원 / {config.products[code].cockles.toLocaleString()}꼬막</MenuItem>)}
            </TextField>}
          {upgrading && quoteBusy && <CircularProgress size={24} />}
          {upgrading && upgradeQuote && <Paper variant="outlined" sx={{ p:2 }}><Stack spacing={0.5}>
            <Typography fontWeight={700}>지금 결제할 차액: {upgradeQuote.amount.toLocaleString()}원</Typography>
            <Typography>추가 지급: {upgradeQuote.cockles.toLocaleString()}꼬막</Typography>
            <Typography>추가 꼬막 소멸·다음 결제일: {date(upgradeQuote.expiresAt)}</Typography>
            <Typography>다음 회차 결제: {upgradeQuote.nextAmount.toLocaleString()}원</Typography>
            <Typography variant="caption" color="text.secondary">남은 기간 비례 계산 · 금액 원 미만 버림 · 꼬막 소수점 올림 · 견적은 10분간 유효합니다.</Typography>
          </Stack></Paper>}
          {['subscribe','topup'].includes(dialog) && [['fullName','결제자 이름'],['phoneNumber','휴대폰 번호'],['email','이메일']].map(([key,label]) =>
            <TextField key={key} label={label} type={key === 'email' ? 'email' : key === 'phoneNumber' ? 'tel' : 'text'} autoComplete={key === 'email' ? 'email' : key === 'phoneNumber' ? 'tel' : 'name'} value={customer[key]} onChange={(e) => setCustomer({ ...customer, [key]:e.target.value })} disabled={busy} fullWidth required />)}
          {['subscribe','topup'].includes(dialog) && <>
            <FormControlLabel control={<Checkbox checked={saveContact} disabled={busy} onChange={(e) => setSaveContact(e.target.checked)} />} label="입력한 정보를 내정보에도 저장" />
            <Typography variant="body2" color="text.secondary">내정보에 저장하면 다음 결제부터 자동 입력됩니다. 변경한 이메일은 내정보에서 인증해 주세요.</Typography>
            {contactMessage && <Alert severity="info">{contactMessage}</Alert>}
          </>}
          <FormControlLabel control={<Checkbox checked={accepted} disabled={busy} onChange={(e) => setAccepted(e.target.checked)} />} label={<Typography variant="body2"><Link to="/terms" target="_blank">이용약관</Link>, 월 자동결제·제공분 소멸 및 구매분 1년 유효기간·미사용분 비례 환불에 동의합니다.</Typography>} />
          </>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button disabled={busy} onClick={() => setDialog(null)}>닫기</Button>
        <Button variant="contained" disabled={busy || (dialog === 'cancel' ? cancelMode === 'immediate' && (quoteBusy || !accepted || !terminationQuote) : quoteBusy || !accepted || (upgrading && !upgradeQuote))} onClick={() => perform(async () => {
          if (dialog === 'cancel') {
            if (cancelMode === 'period_end') { await paymentPost('subscriptions/cancel'); setMessage('자동 갱신을 해지했습니다. 현재 이용기간 종료까지 이용할 수 있습니다.'); }
            else { const result = await paymentPost('subscriptions/terminate', { ...consent, expected_amount:terminationQuote.amount }); setMessage(`구독을 즉시 종료했습니다. ${result.amount.toLocaleString()}원 환불을 접수했습니다. 처리 상태는 결제내역에서 확인해 주세요.`); }
          }
          else if (upgrading) { const verified = await paymentPost('subscriptions/upgrade', { ...consent, payment_id:upgradeQuote.paymentId }); checkResult(verified); setMessage(verified.status === 'PAID' ? '업그레이드가 완료되고 추가 꼬막이 지급되었습니다.' : '차액 결제 상태를 확인 중입니다. 다시 결제하지 말고 결제내역을 확인해 주세요.'); }
          else if (dialog === 'change') { await paymentPost('subscriptions/change', { ...consent, plan_code:plan }); setMessage('다음 결제부터 요금제가 변경됩니다.'); }
          else if (dialog === 'retry') { const verified = await paymentPost('subscriptions/retry', { ...consent, plan_code:plan, idempotency_key:retryKey.current }); checkResult(verified); setMessage(verified.status === 'PAID' ? '첫 구독 결제가 확인되어 꼬막이 지급되었습니다.' : '결제 상태를 확인 중입니다. 내역을 확인해 주세요.'); }
          else await purchase(dialog === 'topup');
          setDialog(null);
        })}>{busy ? '처리 중…' : dialog === 'cancel' ? cancelMode === 'immediate' ? '즉시 종료·자동 환불' : '이용기간 종료 후 해지' : upgrading ? upgradeQuote ? `${upgradeQuote.amount.toLocaleString()}원 결제·즉시 변경` : '업그레이드 견적 확인' : dialog === 'change' ? '다음 결제부터 변경' : dialog === 'topup' ? '9,900원 결제' : dialog === 'retry' ? `${config.products[plan].amount.toLocaleString()}원 재결제` : '카드 등록·첫 구독 결제'}</Button>
      </DialogActions>
    </Dialog>
  </>;
}
