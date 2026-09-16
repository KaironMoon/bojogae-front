import { Alert, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, List, ListItemButton, ListItemText, Stack, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearPendingSocialLoginProvider } from '@/auth/social-login-storage';
import { setLastLoginMethod } from '@/auth/login-method-storage';
import { getSavedEmployeeNumber, getSavedGroupId, saveEmployeeNumber, saveGroupId } from '@/auth/group-login-storage';
import { useAuth } from '@/auth/AuthContext';
import { getGroupIdentity, groupErrorMessage, groupLogin, requestPasswordReset, searchGroups } from '@/services/group-service';

export default function GroupLoginForm() {
  const { refreshUser } = useAuth();
  const navigate = useNavigate();
  const [savedId, setSavedId] = useState(getSavedGroupId);
  const [group, setGroup] = useState(null);
  const [loadingGroup, setLoadingGroup] = useState(false);
  const [reload, setReload] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState([]);
  const [searchBusy, setSearchBusy] = useState(false);
  const [searched, setSearched] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [employee, setEmployee] = useState(() => getSavedEmployeeNumber(savedId));
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [reset, setReset] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let active = true;
    if (!savedId) { setGroup(null); setLoadingGroup(false); return; }
    setLoadingGroup(true); setError('');
    getGroupIdentity(savedId).then((value) => {
      if (active) { setGroup(value); saveGroupId(value.id); }
    }).catch((e) => {
      if (!active) return;
      setGroup(null);
      if (e.response?.status === 404) { saveGroupId(null); setSavedId(null); setError('저장된 그룹을 찾을 수 없습니다. 그룹을 다시 선택해 주세요.'); }
      else setError(groupErrorMessage(e));
    }).finally(() => { if (active) setLoadingGroup(false); });
    return () => { active = false; };
  }, [savedId, reload]);

  const openSearch = () => {
    setQuery(''); setOptions([]); setSearched(false); setSearchError(''); setDialogOpen(true);
  };
  const search = async (event) => {
    event.preventDefault(); event.stopPropagation();
    if (query.trim().length < 2) { setSearchError('그룹명을 두 글자 이상 입력해 주세요.'); return; }
    setSearchBusy(true); setSearchError(''); setOptions([]);
    try { setOptions(await searchGroups(query.trim())); setSearched(true); }
    catch (e) { setSearchError(groupErrorMessage(e)); }
    finally { setSearchBusy(false); }
  };
  const choose = (value) => {
    saveGroupId(value.id); setSavedId(value.id); setGroup(value); setDialogOpen(false);
    setEmployee(getSavedEmployeeNumber(value.id)); setPassword(''); setEmail(''); setError(''); setNotice('');
  };
  const submit = async (event) => {
    event.preventDefault();
    if (!group || loadingGroup) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const identity = { group_id: group.id, employee_number: employee.trim() };
      if (reset) {
        await requestPasswordReset({ ...identity, email: email.trim() });
        setNotice('등록 정보가 일치하면 이메일로 재설정 링크를 보내드립니다.');
      } else {
        await groupLogin({ ...identity, password });
        clearPendingSocialLoginProvider(); setLastLoginMethod('group'); saveGroupId(group.id);
        const user = await refreshUser();
        navigate(user.must_change_password ? '/group/change-password' : '/home', { replace: true });
      }
    } catch (e) { setError(groupErrorMessage(e)); }
    finally { setBusy(false); }
  };
  return <>
    <Stack component="form" spacing={1.5} onSubmit={submit}>
      {error && <Alert severity="error">{error}</Alert>}
      {notice && <Alert severity="success">{notice}</Alert>}
      <Stack direction="row" spacing={1} alignItems="center">
        <TextField label="사무실 그룹" value={loadingGroup ? '그룹 확인 중…' : group?.name || ''} placeholder="그룹을 선택해 주세요." InputProps={{ readOnly: true }} fullWidth />
        <Button variant="outlined" disabled={busy || searchBusy} onClick={openSearch} sx={{ flexShrink: 0 }}>{group || savedId ? '변경' : '그룹 선택'}</Button>
      </Stack>
      {!group && savedId && !loadingGroup && <Button onClick={() => setReload((value) => value + 1)}>다시 확인</Button>}
      <TextField label="사번" value={employee} onChange={(e) => { setEmployee(e.target.value); saveEmployeeNumber(group?.id, e.target.value); }} required inputProps={{ maxLength: 50, autoComplete: 'username' }} />
      {reset ? <TextField type="email" label="등록한 이메일" value={email} onChange={(e) => setEmail(e.target.value)} required />
        : <TextField type="password" label="비밀번호" value={password} onChange={(e) => setPassword(e.target.value)} required inputProps={{ maxLength: 128, autoComplete: 'current-password' }} />}
      <Button type="submit" variant="contained" disabled={busy || loadingGroup || !group || !employee.trim()}>{busy ? '처리 중…' : reset ? '재설정 이메일 받기' : '그룹 로그인'}</Button>
      <Button onClick={() => { setReset(!reset); setError(''); setNotice(''); }}>{reset ? '로그인으로 돌아가기' : '비밀번호를 잊으셨나요?'}</Button>
    </Stack>
    <Dialog open={dialogOpen} onClose={() => { if (!searchBusy) setDialogOpen(false); }} fullWidth maxWidth="sm">
      <DialogTitle>사무실 그룹 검색</DialogTitle>
      <DialogContent><Stack spacing={2} sx={{ pt: 1 }}>
        <Stack component="form" direction="row" spacing={1} onSubmit={search}>
          <TextField label="그룹명 검색" value={query} onChange={(e) => { setQuery(e.target.value); setOptions([]); setSearched(false); }} autoFocus fullWidth inputProps={{ maxLength: 150 }} disabled={searchBusy} />
          <Button type="submit" variant="contained" disabled={searchBusy || query.trim().length < 2}>{searchBusy ? '검색 중…' : '검색'}</Button>
        </Stack>
        {searchError && <Alert severity="error">{searchError}</Alert>}
        {searchBusy ? <CircularProgress size={24} /> : <>
          <Typography variant="body2" color="text.secondary">{searched ? options.length ? '사용할 그룹을 선택해 주세요.' : '검색 결과가 없습니다.' : '그룹명을 두 글자 이상 입력해 검색하세요.'}</Typography>
          <List aria-label="그룹 검색 결과" disablePadding>{options.map((value) => <ListItemButton key={value.id} onClick={() => choose(value)} selected={group?.id === value.id}><ListItemText primary={value.name} /></ListItemButton>)}</List>
        </>}
      </Stack></DialogContent>
      <DialogActions><Button disabled={searchBusy} onClick={() => setDialogOpen(false)}>닫기</Button></DialogActions>
    </Dialog>
  </>;
}
