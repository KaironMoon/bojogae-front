import { Alert, Button, Container, Paper, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { changeGroupPassword, completePasswordReset, groupErrorMessage, groupLogin } from '@/services/group-service';

export default function GroupPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const { user, loading, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [current, setCurrent] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  if (!token && !loading && !user) return <Navigate to="/" replace />;
  if (!token && !loading && user && !user.group_id) return <Navigate to="/home" replace />;
  const submit = async (event) => {
    event.preventDefault(); setError('');
    if (password !== confirm) { setError('새 비밀번호가 일치하지 않습니다.'); return; }
    setBusy(true);
    try {
      if (token) {
        await completePasswordReset({ token, new_password: password });
        await logout();
        navigate('/?passwordChanged=1', { replace: true });
      } else {
        await changeGroupPassword({ current_password: current, new_password: password });
        try {
          await groupLogin({ group_id: user.group_id, employee_number: user.employee_number, password });
          const updatedUser = await refreshUser();
          if (!updatedUser) throw new Error('login_required');
          navigate('/home', { replace: true });
        } catch {
          await logout();
          navigate('/?passwordChanged=1', { replace: true });
        }
      }
    } catch (e) { setError(groupErrorMessage(e)); } finally { setBusy(false); }
  };
  return <Container maxWidth="sm" sx={{ py: 8 }}><Paper sx={{ p: 4 }}><Stack component="form" spacing={2} onSubmit={submit}>
    <Typography variant="h5" fontWeight={800}>{token ? '비밀번호 재설정' : '비밀번호 변경'}</Typography>
    <Typography color="text.secondary">{token ? '새 비밀번호를 설정한 후 다시 로그인해 주세요.' : '새 비밀번호를 설정하면 자동으로 로그인됩니다.'}{user?.must_change_password ? ' 서비스를 이용하려면 최초 비밀번호를 변경해야 합니다.' : ''}</Typography>
    {error && <Alert severity="error">{error}</Alert>}
    {!token && <TextField label="현재 비밀번호" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} required inputProps={{ autoComplete: 'current-password', maxLength: 128 }} />}
    <TextField label="새 비밀번호" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required helperText="8자 이상 입력하세요." inputProps={{ minLength: 8, maxLength: 128, autoComplete: 'new-password' }} />
    <TextField label="새 비밀번호 확인" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required inputProps={{ minLength: 8, maxLength: 128, autoComplete: 'new-password' }} />
    <Button type="submit" variant="contained" disabled={busy || loading}>비밀번호 변경</Button>
    <Button disabled={busy} onClick={async () => { await logout(); navigate('/'); }}>로그인 화면으로</Button>
  </Stack></Paper></Container>;
}
