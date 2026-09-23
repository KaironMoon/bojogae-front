import { Alert, Button, Checkbox, Chip, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { addMember, bulkPoints, createGroup, decidePurchase, deleteMember, directPurchase, editMember, getGroup, groupErrorMessage, listGroups, renameGroup, requestPurchase, resetMemberPassword, setMonthlyPoints, setMaxMembers, setMemberStatus } from '@/services/group-service';

const time = (value) => new Date(value).toLocaleString('ko-KR');
const purchaseStatus = { PENDING: '결제 확인 대기', APPROVED: '지급 완료', REJECTED: '거절' };
const emptyMember = { employee_number: '', display_name: '', email: '' };
const optionalFields = (data) => ({ ...data, display_name: data.display_name?.trim() || null, email: data.email?.trim() || null });
// 빈 값이면 인원수 제한 없음(null)으로 처리합니다.
const toMaxMembers = (value) => (value === '' || value === null || value === undefined ? null : Number(value));

export default function GroupsPage() {
  const { user, loading } = useAuth();
  const admin = user?.role === 'ADMIN';
  const [groups, setGroups] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { groupId: routeGroupId } = useParams();
  const groupId = routeGroupId && /^[1-9]\d*$/.test(routeGroupId) ? Number(routeGroupId) : '';
  const listPath = admin ? '/admin/groups' : '/group';
  const allowedGroup = admin || groupId === user?.group_id;
  const [detail, setDetail] = useState(null);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [requestKey, setRequestKey] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const canManage = admin || user?.group_role === 'LEADER';
  const refresh = useCallback(async () => {
    if (!groupId) { setDetail(null); return; }
    const data = await getGroup(groupId); setDetail(data); setName(data.group.name);
  }, [groupId]);
  useEffect(() => {
    let active = true;
    setDetail(null); setSelectedIds([]); setError(''); setNotice(''); setModal(null);
    if (groupId && canManage && allowedGroup) getGroup(groupId).then((data) => { if (active) { setDetail(data); setName(data.group.name); } }).catch((e) => { if (active) setError(groupErrorMessage(e)); });
    return () => { active = false; };
  }, [groupId, canManage, allowedGroup, user?.id]);
  useEffect(() => {
    if (!admin || groupId) return;
    let active = true;
    setGroups([]); setListLoading(true);
    const timer = setTimeout(() => listGroups(query)
      .then((rows) => { if (active) setGroups(rows); })
      .catch((e) => { if (active) setError(groupErrorMessage(e)); })
      .finally(() => { if (active) setListLoading(false); }), 300);
    return () => { active = false; clearTimeout(timer); };
  }, [admin, query, groupId]);
  if (loading) return <Typography>불러오는 중…</Typography>;
  if (!canManage) return <Navigate to="/home" replace />;
  if (!admin && !routeGroupId && user?.group_id) return <Navigate to={`/group/${user.group_id}`} replace />;
  if (routeGroupId && (!groupId || !allowedGroup)) return <Navigate to={listPath} replace />;
  const open = (type, item = null) => {
    setError(''); setNotice(''); setRequestKey(crypto.randomUUID()); setModal({ type, item, member_ids: [...selectedIds] });
    setForm(type === 'create' ? { ...emptyMember, name: '', monthly_basic_points: '', max_members: '' }
      : type === 'monthly' ? { monthly_basic_points: detail.group.monthly_basic_points }
      : type === 'members-limit' ? { max_members: detail.group.max_members ?? '' }
      : type === 'add' ? { ...emptyMember }
      : type === 'edit' ? { employee_number: item.employee_number || '', display_name: item.display_name || '', email: item.email || '' }
      : ['give', 'reclaim'].includes(type) ? { amount: '' }
      : type === 'direct' ? { amount: '', payment_reference: '' }
      : type === 'purchase' ? { amount: '' }
      : type === 'decision' ? { action: 'APPROVE', payment_reference: '' } : {});
  };
  const run = async (operation, success) => {
    setBusy(true); setError(''); setNotice('');
    try { const result = await operation(); if (result !== false) setNotice(success); }
    catch (e) { setError(groupErrorMessage(e)); }
    finally { setBusy(false); }
  };
  const submit = async (event) => {
    event.preventDefault();
    await run(async () => {
      const { type, item } = modal;
      if (type === 'create') {
        const saved = await createGroup({ ...optionalFields(form), monthly_basic_points: Number(form.monthly_basic_points), max_members: toMaxMembers(form.max_members) });
        setModal(null); navigate(`${listPath}/${saved.group.id}`);
      } else if (type === 'add') await addMember(groupId, optionalFields(form));
      else if (type === 'monthly') await setMonthlyPoints(groupId, Number(form.monthly_basic_points));
      else if (type === 'members-limit') await setMaxMembers(groupId, toMaxMembers(form.max_members));
      else if (type === 'edit') await editMember(groupId, item.id, optionalFields(form));
      else if (type === 'reset') await resetMemberPassword(groupId, item.id);
      else if (type === 'status') await setMemberStatus(groupId, item.id, item.status !== 'ACTIVE');
      else if (type === 'delete') await deleteMember(groupId, item.id);
      else if (['give', 'reclaim'].includes(type)) {
        const result = await bulkPoints(groupId, { member_ids: modal.member_ids, action: type === 'give' ? 'DISTRIBUTE' : 'RECLAIM', amount: Number(form.amount), idempotency_key: requestKey });
        setSelectedIds([]); setForm({});
        setModal(null);
        setNotice(`${result.results.length}명 ${type === 'give' ? '지급' : '회수'} · 합계 ${result.total_amount}P 처리했습니다.`);
        await refresh();
        return false;
      }
      else if (type === 'direct') await directPurchase(groupId, { amount: Number(form.amount), payment_reference: form.payment_reference.trim(), idempotency_key: requestKey });
      else if (type === 'purchase') await requestPurchase(groupId, { amount: Number(form.amount), idempotency_key: requestKey });
      else if (type === 'decision') await decidePurchase(groupId, item.id, { ...form, payment_reference: form.action === 'APPROVE' ? form.payment_reference : null });
      setModal(null);
      if (type !== 'create') await refresh();
    }, '처리했습니다.');
  };
  const field = (key, label, props = {}) => <TextField key={key} label={label} value={form[key] ?? ''} onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))} fullWidth {...props} />;
  const selectableMembers = detail?.members.filter((item) => item.group_role === 'MEMBER') || [];
  const activeMemberCount = detail?.members.filter((item) => item.status === 'ACTIVE').length || 0;
  const memberLimitReached = Boolean(detail?.group.max_members) && activeMemberCount >= detail.group.max_members;
  const selectedMembers = selectableMembers.filter((item) => selectedIds.includes(item.id));
  const allSelected = selectableMembers.length > 0 && selectedMembers.length === selectableMembers.length;
  const leader = detail?.members.find((item) => item.group_role === 'LEADER');
  return <Stack component="main" spacing={3} sx={{ p: { xs: 2, md: 4 }, maxWidth: 1440, width: '100%', mx: 'auto', boxSizing: 'border-box', minWidth: 0 }}>
    <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} gap={1.5}><Typography variant="h4" fontWeight={800}>그룹 관리</Typography>{admin && <Button variant="contained" disabled={busy} onClick={() => open('create')} sx={{ alignSelf: { xs: 'flex-start', sm: 'center' } }}>그룹·리더 등록</Button>}</Stack>
    {!modal && error && <Alert severity="error">{error}</Alert>}
    {notice && <Alert severity="success">{notice}</Alert>}
    {admin && !groupId && <>
      {admin && <TextField label="그룹명 검색" value={query} onChange={(e) => setQuery(e.target.value)} sx={{ maxWidth: 420 }} />}
      <Paper variant="outlined" sx={{ overflow: 'hidden' }}><TableContainer><Table>
        <TableHead><TableRow><TableCell>그룹명</TableCell><TableCell align="right">관리</TableCell></TableRow></TableHead>
        <TableBody>
          {groups.map((group) => <TableRow key={group.id} hover onClick={() => navigate(`${listPath}/${group.id}`)} sx={{ cursor: 'pointer' }}>
            <TableCell><Button component={Link} to={`${listPath}/${group.id}`} onClick={(event) => event.stopPropagation()} sx={{ textAlign: 'left', justifyContent: 'flex-start' }}>{group.name}</Button></TableCell>
            <TableCell align="right"><Button component={Link} to={`${listPath}/${group.id}`} onClick={(event) => event.stopPropagation()}>관리하기</Button></TableCell>
          </TableRow>)}
          {!groups.length && <TableRow><TableCell colSpan={2}>{listLoading ? '그룹 목록을 불러오는 중…' : error ? '그룹 목록을 불러오지 못했습니다.' : query ? '검색 결과가 없습니다.' : '등록된 그룹이 없습니다.'}</TableCell></TableRow>}
        </TableBody>
      </Table></TableContainer></Paper>
    </>}
    {groupId && <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2}>
      {admin && <Button component={Link} to={listPath} disabled={busy}>그룹 목록으로 돌아가기</Button>}
      <Typography variant="h6">{detail?.group.name || (error ? '그룹을 불러오지 못했습니다.' : '그룹을 불러오는 중…')}</Typography>
    </Stack>}
    {detail && <>
      <Paper sx={{ p: { xs: 2, sm: 3 }, minWidth: 0 }}><Stack spacing={2}>
        <Stack component="form" direction={{ xs: 'column', sm: 'row' }} spacing={2} onSubmit={(e) => { e.preventDefault(); run(async () => { await renameGroup(groupId, name.trim()); await refresh(); }, '그룹명을 변경했습니다.'); }}>
          <TextField label="그룹명" value={name} onChange={(e) => setName(e.target.value)} required inputProps={{ maxLength: 150 }} sx={{ flex: 1 }} />
          <Button type="submit" disabled={busy || !name.trim() || name.trim() === detail.group.name}>그룹명 변경</Button>
        </Stack>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }}><Typography>그룹 기본 지급 포인트: 1인당 매월 {detail.group.monthly_basic_points ?? 0}P · 그룹 생성일 기준 매월 지급·만료</Typography>{admin && <Button disabled={busy} onClick={() => open('monthly')} sx={{ flexShrink: 0 }}>월 지급량 설정</Button>}</Stack>
        <Typography variant="body2" color="text.secondary">지급 포인트는 분배·회수 대상에서 제외됩니다. 구매 포인트만 일괄 분배·회수할 수 있습니다.</Typography>
        <Typography fontWeight={700}>리더 포인트: 지급 {leader?.balance.free_points ?? 0}P · 구매 {leader?.balance.paid_points ?? 0}P</Typography>
        {!admin && <Button variant="outlined" disabled={busy} onClick={() => open('purchase')}>추가 포인트 구매 요청</Button>}
      </Stack></Paper>
      <Paper sx={{ p: { xs: 2, sm: 3 }, minWidth: 0 }}><Stack spacing={2}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1} flexWrap="wrap">
          <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
            <Typography variant="h6">구성원</Typography>
            <Typography variant="body2" color="text.secondary">{detail.group.max_members ? `${activeMemberCount}/${detail.group.max_members}명` : `${activeMemberCount}명 · 인원 제한 없음`}</Typography>
            {admin && <Button size="small" disabled={busy} onClick={() => open('members-limit')}>인원 제한 설정</Button>}
          </Stack>
          <Button disabled={busy || memberLimitReached} onClick={() => open('add')} sx={{ flexShrink: 0 }}>구성원 등록</Button>
        </Stack>
        {memberLimitReached && <Alert severity="warning">인원수 제한({detail.group.max_members}명)에 도달했습니다. 새 구성원을 등록하려면 인원 제한을 늘리거나 기존 구성원을 정리해 주세요.</Alert>}
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap><Typography>{selectedMembers.length}명 선택</Typography><Button variant="contained" disabled={busy || !selectedMembers.length || selectedMembers.some((item) => item.status !== 'ACTIVE')} onClick={() => open('give')}>일괄 지급</Button><Button variant="outlined" disabled={busy || !selectedMembers.length} onClick={() => open('reclaim')}>일괄 회수</Button></Stack>
        <TableContainer sx={{ maxWidth: '100%' }}><Table size="small" sx={{ minWidth: 860 }}><TableHead><TableRow><TableCell padding="checkbox"><Checkbox inputProps={{ 'aria-label': '구성원 전체 선택' }} disabled={busy || !selectableMembers.length} checked={allSelected} indeterminate={selectedMembers.length > 0 && !allSelected} onChange={(e) => setSelectedIds(e.target.checked ? selectableMembers.map((item) => item.id) : [])} /></TableCell>{['사번' , '구분명', '이메일', '상태', '지급 / 구매', '관리'].map((label) => <TableCell key={label} sx={{ whiteSpace: 'nowrap' }}>{label}</TableCell>)}</TableRow></TableHead>
          <TableBody>{detail.members.map((item) => <TableRow key={item.id} selected={selectedIds.includes(item.id)}>
            <TableCell padding="checkbox">{item.group_role === 'MEMBER' && <Checkbox inputProps={{ 'aria-label': `${item.employee_number} 선택` }} disabled={busy} checked={selectedIds.includes(item.id)} onChange={(e) => setSelectedIds((prev) => e.target.checked ? [...prev, item.id] : prev.filter((id) => id !== item.id))} />}</TableCell>
            <TableCell>{item.employee_number}{item.group_role === 'LEADER' && <Chip label="리더" size="small" sx={{ ml: 1 }} />}</TableCell>
            <TableCell>{item.display_name === item.employee_number ? '—' : item.display_name}</TableCell><TableCell>{item.email || '—'}</TableCell>
            <TableCell>{item.status === 'ACTIVE' ? '활성' : '비활성'}{item.must_change_password && <Typography variant="caption" display="block">비밀번호 변경 필요</Typography>}</TableCell>
            <TableCell sx={{ whiteSpace: 'nowrap' }}>{item.balance.free_points}P / {item.balance.paid_points}P</TableCell>
            <TableCell><Stack direction="row" flexWrap="wrap">
              <Button size="small" disabled={busy} onClick={() => open('edit', item)}>수정</Button>
              {(admin || item.group_role !== 'LEADER') && <Button size="small" disabled={busy} onClick={() => open('reset', item)}>비밀번호 초기화</Button>}
              {item.group_role === 'MEMBER' && <><Button size="small" color={item.status === 'ACTIVE' ? 'error' : 'primary'} disabled={busy} onClick={() => open('status', item)}>{item.status === 'ACTIVE' ? '비활성화' : '활성화'}</Button></>}
              {item.group_role === 'MEMBER' && !item.employee_number.startsWith('d_') && <Button size="small" color="error" disabled={busy} onClick={() => open('delete', item)}>삭제</Button>}
            </Stack></TableCell>
          </TableRow>)}</TableBody></Table></TableContainer>
      </Stack></Paper>
      <Paper sx={{ p: { xs: 2, sm: 3 }, minWidth: 0 }}><Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} gap={1} sx={{ mb: 2 }}><Typography variant="h6">추가 포인트 구매 내역</Typography>{admin && <Button variant="contained" disabled={busy || !leader || leader.status !== 'ACTIVE'} onClick={() => open('direct')}>추가 포인트 직접 지급</Button>}</Stack>
        <TableContainer sx={{ maxWidth: '100%' }}><Table size="small" sx={{ minWidth: 680 }}><TableHead><TableRow>{['요청일', '수량', '상태', '결제 확인 번호', '처리'].map((label) => <TableCell key={label} sx={{ whiteSpace: 'nowrap' }}>{label}</TableCell>)}</TableRow></TableHead><TableBody>
          {detail.purchases.map((item) => <TableRow key={item.id}><TableCell>{time(item.created_at)}</TableCell><TableCell>{item.amount}P</TableCell><TableCell>{purchaseStatus[item.status]}{item.is_direct && <Typography variant="caption" display="block">관리자 직접 지급</Typography>}</TableCell><TableCell>{item.payment_reference || '—'}</TableCell><TableCell>{admin && item.status === 'PENDING' && <Button disabled={busy} onClick={() => open('decision', item)}>결제 확인·처리</Button>}</TableCell></TableRow>)}
          {!detail.purchases.length && <TableRow><TableCell colSpan={5}>구매 요청이 없습니다.</TableCell></TableRow>}
        </TableBody></Table></TableContainer>
      </Paper>
      <Paper sx={{ p: { xs: 2, sm: 3 }, minWidth: 0 }}><Typography variant="h6" sx={{ mb: 2 }}>지급·회수 내역</Typography><TableContainer sx={{ maxWidth: '100%' }}><Table size="small" sx={{ minWidth: 620 }}><TableHead><TableRow>{['일시', '종류', '보낸 사번', '받은 사번', '수량'].map((label) => <TableCell key={label} sx={{ whiteSpace: 'nowrap' }}>{label}</TableCell>)}</TableRow></TableHead><TableBody>
        {detail.transfers.map((item) => <TableRow key={item.id}><TableCell>{time(item.created_at)}</TableCell><TableCell>{item.action === 'DISTRIBUTE' ? '지급' : '회수'}</TableCell><TableCell>{item.sender_number}</TableCell><TableCell>{item.recipient_number}</TableCell><TableCell>{item.amount}P</TableCell></TableRow>)}
        {!detail.transfers.length && <TableRow><TableCell colSpan={5}>지급·회수 내역이 없습니다.</TableCell></TableRow>}
      </TableBody></Table></TableContainer></Paper>
    </>}
    <Dialog open={!!modal} onClose={() => { if (!busy) setModal(null); }} fullWidth maxWidth="sm"><Stack component="form" onSubmit={submit}>
      <DialogTitle>{{ direct: '추가 포인트 직접 지급', monthly: '그룹 월 기본 지급 포인트 설정', 'members-limit': '인원 제한 설정', create: '그룹·리더 등록', add: '구성원 등록', edit: '계정 정보 수정', give: '일괄 지급', reclaim: '일괄 회수', purchase: '추가 포인트 구매 요청', decision: '구매 요청 처리', reset: '비밀번호 초기화', status: '구성원 상태 변경', delete: '구성원 삭제' }[modal?.type]}</DialogTitle>
      <DialogContent><Stack spacing={2} sx={{ pt: 1 }}>
        {error && <Alert severity="error">{error}</Alert>}
        {modal?.type === 'create' && <>{field('name', '그룹명', { required: true, inputProps: { maxLength: 150 } })}{field('monthly_basic_points', '그룹 기본 지급 포인트 (1인당 월 지급량)', { required: true, type: 'number', inputProps: { min: 1, max: 1000000 }, helperText: '리더 포함 활성 구성원에게 매월 지급되는 무료 포인트입니다. 그룹 생성일 기준으로 매월 지급되며 다음 지급일에 만료됩니다.' })}</>}
        {modal?.type === 'create' && field('max_members', '인원수 제한 (리더 포함, 선택)', { type: 'number', inputProps: { min: 1, max: 10000 }, helperText: '비워두면 인원수 제한이 없습니다.' })}
        {modal?.type === 'members-limit' && field('max_members', '인원수 제한 (리더 포함, 선택)', { type: 'number', inputProps: { min: 1, max: 10000 }, helperText: '비워두면 인원수 제한이 없습니다. 기존 인원은 유지되며, 초과 상태에서는 새 구성원만 등록할 수 없습니다.' })}
        {['create', 'add'].includes(modal?.type) && field('employee_number', modal?.type === 'create' ? '리더 사번' : '사번', { required: true, inputProps: { maxLength: 50 }, helperText: '기본 비밀번호는 사번과 동일하게 생성되며 첫 로그인 시 변경해야 합니다.' })}
        {modal?.type === 'edit' && field('employee_number', '사번', { required: true, inputProps: { maxLength: 50 }, helperText: '그룹 내에서 중복될 수 없습니다.' })}
        {['create', 'add', 'edit'].includes(modal?.type) && <>{field('display_name', '구분명 (선택)', { inputProps: { maxLength: 100 } })}{field('email', '이메일 (선택)', { type: 'email' })}</>}
        {modal?.type === 'monthly' && field('monthly_basic_points', '1인당 월 기본 지급 포인트', { type: 'number', required: true, inputProps: { min: 0, max: 1000000 }, helperText: '현재 주기에 이미 지급받은 구성원은 다음 지급일부터 변경 수량이 적용됩니다. 0이면 신규 지급을 중지합니다.' })}
        {['give', 'reclaim'].includes(modal?.type) && <>
          <Typography>{modal.member_ids.length}명 선택 · 구매 포인트만 처리합니다.</Typography>
          {field('amount', '1인당 포인트 수량', { type: 'number', required: true, inputProps: { min: 1, max: 1000000 } })}
          <Typography color="text.secondary">{modal.type === 'give' ? `각 구성원에게 입력 수량을 지급합니다. 총 지급량: ${Number(form.amount || 0) * modal.member_ids.length}P` : '각 구성원에게서 입력 수량만큼 회수합니다. 잔액이 부족하면 남은 구매 포인트만 회수합니다.'}</Typography>
        </>}
        {modal?.type === 'direct' && <>
          <Typography>{detail?.group.name}의 리더 {leader?.employee_number}에게 구매 포인트를 지급합니다.</Typography>
          {field('amount', '구매 포인트 수량', { type: 'number', required: true, inputProps: { min: 1, max: 1000000, step: 1 } })}
          {field('payment_reference', '결제 확인 번호', { required: true, inputProps: { maxLength: 100 } })}
          <Typography color="text.secondary">실제 결제를 확인한 후 지급하세요. 구매 요청 없이 바로 지급되며 구매 내역에 기록됩니다.</Typography>
        </>}
        {modal?.type === 'purchase' && field('amount', '포인트 수량', { type: 'number', required: true, inputProps: { min: 1, max: 1000000 } })}
        {modal?.type === 'purchase' && <Typography color="text.secondary">결제 확인 후 리더 계정에 구매 포인트가 지급됩니다.</Typography>}
        {modal?.type === 'decision' && <>{field('action', '처리', { select: true, children: [<MenuItem key="approve" value="APPROVE">결제 확인 후 지급</MenuItem>, <MenuItem key="reject" value="REJECT">거절</MenuItem>] })}{form.action === 'APPROVE' && field('payment_reference', '결제 확인 번호', { required: true, inputProps: { maxLength: 100 } })}<Typography>{modal.item.amount}P 요청입니다. 실제 결제를 확인한 후 지급하세요.</Typography></>}
        {modal?.type === 'reset' && <Typography>{modal.item.employee_number} 계정을 기본 비밀번호(사번과 동일)로 초기화합니다. 기존 로그인은 종료되며 다음 로그인 시 변경해야 합니다.</Typography>}
        {modal?.type === 'delete' && <Typography>{modal.item.employee_number} 계정을 삭제합니다. 비활성화되어 로그인할 수 없게 되고, 미사용 구매 포인트는 리더에게 자동 회수되며 기존 로그인은 종료됩니다. 사번과 이메일이 비워져 사번 {modal.item.employee_number}와 등록된 이메일 모두 이후 다른 구성원 등록에 다시 사용할 수 있습니다.</Typography>}
        {modal?.type === 'status' && <Typography>{modal.item.employee_number} 계정을 {modal.item.status === 'ACTIVE' ? '비활성화합니다. 미사용 구매 포인트만 리더에게 자동 회수되고 기존 로그인은 종료됩니다.' : '활성화합니다.'}</Typography>}
      </Stack></DialogContent>
      <DialogActions><Button disabled={busy} onClick={() => setModal(null)}>취소</Button><Button type="submit" variant="contained" disabled={busy}>{busy ? '처리 중…' : '확인'}</Button></DialogActions>
    </Stack></Dialog>
  </Stack>;
}
