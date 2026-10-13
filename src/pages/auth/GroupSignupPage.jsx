import { Alert, Button, Checkbox, Container, FormControlLabel, Link as MuiLink, Paper, Stack, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import SignupProfileFields from '@/components/signup/SignupProfileFields';
import { getGroupApplicationStatus, groupApplicationStatuses, groupSignupError, resendGroupApplication, startGroupApplication, verifyGroupApplication, verifyGroupApplicationLink } from '@/services/group-signup-service';
const storageKey = 'bojogae.groupApplicationToken';

export default function GroupSignupPage() {
  const [params, setParams] = useSearchParams();
  const verificationToken = params.get('verify');
  const [token, setToken] = useState(() => params.get('token') || localStorage.getItem(storageKey) || '');
  const [form, setForm] = useState({ affiliation: '', branch_name: '', name: '', phone: '', email: '', terms_agreed: false });
  const [application, setApplication] = useState(null);
  const [groupCheckStatus, setGroupCheckStatus] = useState('idle');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(Boolean(verificationToken));
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [cooldown, setCooldown] = useState(0);
  useEffect(() => {
    if (!cooldown) return undefined;
    const timer = setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);
  useEffect(() => {
    let active = true;
    if (!verificationToken && !token) return undefined;
    setBusy(true);
    const request = verificationToken ? verifyGroupApplicationLink(verificationToken) : getGroupApplicationStatus(token);
    request.then((value) => {
      if (!active) return;
      setApplication(value); setError('');
      if (verificationToken) {
        localStorage.setItem(storageKey, verificationToken); setToken(verificationToken);
        setParams({}, { replace: true });
      }
    }).catch((failure) => { if (active) setError(groupSignupError(failure)); })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [verificationToken, token, setParams]);
  const run = async (operation) => {
    setBusy(true); setError(''); setNotice('');
    try { await operation(); } catch (failure) { setError(groupSignupError(failure)); }
    finally { setBusy(false); }
  };
  const submit = (event) => {
    event.preventDefault();
    run(async () => {
      const result = await startGroupApplication(form);
      localStorage.setItem(storageKey, result.token); setToken(result.token); setCooldown(60);
      setNotice('인증메일을 보냈습니다. 이메일 인증을 완료하면 신청이 접수됩니다.');
    });
  };
  const clear = () => {
    localStorage.removeItem(storageKey); setParams({}, { replace: true }); setToken(''); setApplication(null); setError(''); setNotice(''); setCode('');
  };
  return <Container component="main" maxWidth="sm" sx={{ py: 5 }}><Paper variant="outlined" sx={{ p: { xs: 3, sm: 4 }, borderRadius: 3 }}><Stack spacing={3}>
    <Typography variant="h4" component="h1" fontWeight={800}>단체 가입 신청</Typography>
    <Typography color="text.secondary">단체장 또는 담당자가 신청해 주세요. 관리자가 연락해 이용 인원과 요금을 협의하고, 결제 확인 후 개통합니다.</Typography>
    {error && <Alert severity="error">{error}</Alert>}
    {notice && <Alert severity="success">{notice}</Alert>}
    {!token && !verificationToken && <Stack component="form" spacing={2} onSubmit={submit}>
      <SignupProfileFields branchRequired onGroupCheckChange={setGroupCheckStatus} value={form} onChange={setForm} disabled={busy} nameLabel="담당자 이름" />
      <TextField label="담당자 이메일" type="email" required disabled={busy} value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} inputProps={{ autoComplete: 'email' }} />
      <FormControlLabel control={<Checkbox checked={form.terms_agreed} disabled={busy} onChange={(event) => setForm({ ...form, terms_agreed: event.target.checked })} />} label={<Typography variant="body2"><MuiLink component={Link} to="/terms" target="_blank" rel="noopener">서비스이용약관</MuiLink> 및 <MuiLink component={Link} to="/privacy" target="_blank" rel="noopener">개인정보처리방침</MuiLink>에 동의합니다. (필수)</Typography>} />
      <Button type="submit" variant="contained" disabled={busy || !form.terms_agreed || ['checking', 'duplicate'].includes(groupCheckStatus)}>이메일 인증하고 신청하기</Button>
    </Stack>}
    {token && application?.status === 'UNVERIFIED' && <Stack spacing={2}>
      <Alert severity="info">인증메일의 버튼을 누르거나 6자리 인증번호를 입력해 주세요.</Alert>
      <TextField label="6자리 인증번호" value={code} disabled={busy} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} inputProps={{ inputMode: 'numeric', maxLength: 6 }} />
      <Button variant="contained" disabled={busy || code.length !== 6} onClick={() => run(async () => setApplication(await verifyGroupApplication(token, code)))}>인증번호 확인</Button>
      <Button disabled={busy || cooldown > 0} onClick={() => run(async () => { await resendGroupApplication(token); setCooldown(60); setNotice('인증메일을 다시 보냈습니다.'); })}>{cooldown > 0 ? `${cooldown}초 후 재발송` : '인증메일 다시 받기'}</Button>
    </Stack>}
    {token && application?.verified_at && <Stack spacing={2}>
      <Typography fontWeight={700}>{application.group_name}</Typography>
      <Alert severity={application.status === 'ACTIVE' ? 'success' : 'info'}>{groupApplicationStatuses[application.status]}</Alert>
      {application.status !== 'ACTIVE' ? <Typography>신청이 접수되었습니다. 담당자가 연락드릴 예정이며, 결제 확인과 개통 전에는 서비스를 이용할 수 없습니다.</Typography> : <>
        <Typography>단체 회원 로그인에서 그룹을 선택해 접속하세요. 단체장 사번: <strong>{application.employee_number || '관리자에게 확인해 주세요.'}</strong></Typography>
        <Typography>초기 비밀번호는 사번과 같습니다. 첫 로그인 후 비밀번호를 변경해 주세요.</Typography>
      </>}
    </Stack>}
    {token && <Button disabled={busy} onClick={() => run(async () => setApplication(await getGroupApplicationStatus(token)))}>신청 현황 새로고침</Button>}
    {(token || verificationToken) && <Button disabled={busy} color="inherit" onClick={clear}>다른 단체 신청하기</Button>}
    <Button component={Link} to="/">개인 가입 / 로그인으로 돌아가기</Button>
  </Stack></Paper></Container>;
}
