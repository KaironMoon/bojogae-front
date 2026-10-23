import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, CircularProgress, Paper, Stack, TextField, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import { getReferral, referralError, registerReferral, saveReferralAlias } from '@/services/referral-service';

const date = value => new Date(value).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });

export default function ReferralSection() {
  const [data, setData] = useState(null);
  const [alias, setAlias] = useState('');
  const [referrer, setReferrer] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const load = useCallback(async () => {
    const result = await getReferral();
    setData(result);
    setAlias(result.alias || '');
  }, []);
  useEffect(() => {
    let active = true;
    getReferral().then(result => {
      if (active) { setData(result); setAlias(result.alias || ''); }
    }).catch(e => { if (active) setError(referralError(e)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  const perform = async action => {
    setBusy(true); setError(''); setMessage('');
    try { await action(); await load(); }
    catch (e) { setError(referralError(e)); await load().catch(() => {}); }
    finally { setBusy(false); }
  };
  if (data && !data.eligible) return null;
  return <Paper id="referral" variant="outlined" sx={{ p: { xs: 2.5, md: 3 }, mb: 3, borderRadius: 3 }}>
    <Stack spacing={2}>
      <Typography variant="h6" fontWeight={800}>추천인</Typography>
      {loading && <CircularProgress size={24} aria-label="추천인 정보 조회 중" />}
      {error && <Alert severity="error">{error}</Alert>}
      {message && <Alert severity="success">{message}</Alert>}
      {data?.eligible && <>
        <Typography variant="subtitle2" fontWeight={700}>다른 사람에게 알려줄 내 추천 정보</Typography>
        <Typography sx={{ overflowWrap: 'anywhere' }}>기본 추천 이메일: {data.email}</Typography>
        <Typography variant="body2" color="text.secondary">이메일 또는 아래 추천용 닉네임을 알려주세요. 추천용 닉네임은 프로필 닉네임과 별개이며 직접 변경할 수 있습니다. 변경해도 이미 등록된 추천 관계는 유지됩니다.</Typography>
        <TextField label="내 추천용 닉네임 (선택)" value={alias} onChange={e => setAlias(e.target.value)} disabled={busy}
          inputProps={{ maxLength: 30 }} helperText="한글·영문·숫자·점·밑줄·하이픈 2~30자. 영문은 소문자로 저장하며, 비워서 저장하면 이메일만 사용합니다." />
        <Button variant="outlined" disabled={busy || alias.trim() === (data.alias || '')} onClick={() => perform(async () => {
          await saveReferralAlias(alias); setMessage('추천용 닉네임을 저장했습니다.');
        })}>추천용 닉네임 저장</Button>
        {data.registered ? <Alert severity="success">추천인 등록이 완료되었습니다. 보너스 {data.referral.bonus_amount}꼬막 · 유효기간: {date(data.referral.bonus_expires_at)} (한국 시간)</Alert> : <>
          <Typography variant="subtitle2" fontWeight={700}>나를 추천한 사람 등록</Typography>
          <TextField label="추천인 이메일 또는 추천용 닉네임" value={referrer} disabled={busy} onChange={e => setReferrer(e.target.value)} inputProps={{ maxLength: 254 }}
            helperText="등록하면 내 계정에 50꼬막이 지급되며 30일간 사용할 수 있습니다. 추천인은 한 번만 등록할 수 있고 등록 후 변경할 수 없습니다." />
          <Button variant="contained" disabled={busy || !referrer.trim()} onClick={() => {
            if (!window.confirm('추천인을 등록하면 50꼬막이 지급되며 30일간 사용할 수 있습니다. 등록 후에는 추천인을 변경할 수 없습니다. 등록하시겠습니까?')) return;
            perform(async () => { await registerReferral(referrer); setReferrer(''); setMessage('추천인을 등록하고 보너스 50꼬막을 지급했습니다.'); });
          }}>{busy ? '처리 중…' : '추천인 등록'}</Button>
        </>}
        <Button component={Link} to="/my-coins">내꼬막에서 지급·사용 내역 확인</Button>
      </>}
      {!data && !loading && <Button disabled={busy} onClick={() => perform(load)}>다시 불러오기</Button>}
    </Stack>
  </Paper>;
}
