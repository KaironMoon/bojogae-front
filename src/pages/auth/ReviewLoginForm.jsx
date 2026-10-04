import { Alert, Button, Stack, TextField } from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { setLastLoginMethod } from '@/auth/login-method-storage';
import { reviewAccountLogin } from '@/services/auth-service';

export default function ReviewLoginForm({ enabled }) { // eslint-disable-line react/prop-types
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const { refreshUser } = useAuth();
  const navigate = useNavigate();

  const submit = async (event) => {
    event.preventDefault();
    if (working || !enabled) return;
    setWorking(true);
    setError('');
    try {
      await reviewAccountLogin(loginId.trim(), password);
      setPassword('');
      const user = await refreshUser();
      setLastLoginMethod('personal');
      navigate(user?.status === 'ACTIVE' ? '/profile#plan' : '/access-restricted', { replace: true });
    } catch (requestError) {
      setPassword('');
      setError(requestError.response?.status === 429
        ? '로그인 시도가 많아 잠겼습니다. 15분 후 다시 시도해 주세요.'
        : requestError.response?.status === 404
          ? '심사용 계정 로그인이 종료되었거나 사용할 수 없습니다.'
          : '로그인하지 못했습니다. 아이디와 비밀번호를 확인해 주세요.');
    } finally {
      setWorking(false);
    }
  };

  return (
    <Stack component="form" onSubmit={submit} spacing={1.5}>
      {!enabled && <Alert severity="info">현재 심사용 계정 로그인을 사용할 수 없습니다. 담당자에게 문의해 주세요.</Alert>}
      {error && <Alert severity="error">{error}</Alert>}
      <TextField label="아이디" value={loginId} onChange={(event) => setLoginId(event.target.value)}
        required fullWidth disabled={working || !enabled} inputProps={{ autoComplete: 'username', maxLength: 100 }} />
      <TextField label="비밀번호" type="password" value={password} onChange={(event) => setPassword(event.target.value)}
        required fullWidth disabled={working || !enabled} inputProps={{ autoComplete: 'current-password', maxLength: 256 }} />
      <Button type="submit" variant="contained" disabled={working || !enabled || !loginId.trim() || !password}
        sx={{ minHeight: 54, borderRadius: 2.5, fontWeight: 800 }}>
        {working ? '로그인 중…' : '심사용 계정 로그인'}
      </Button>
    </Stack>
  );
}
