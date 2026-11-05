import { useEffect, useState } from 'react';
import { Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField, Typography } from '@mui/material';
import api from '@/services/api-caller';

const statuses = { REVIEW_REQUIRED: '검토 필요', REFUNDED: '반환 완료', CONSUMED: '차감 유지' };
const date = value => value ? new Date(value).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }) : '-';
const errorText = error => ({
  fax_refund_not_found: '팩스 차감 내역을 찾을 수 없습니다.',
  fax_refund_points_changed: '차감 금액이 변경됐습니다. 목록을 새로고침해 주세요.',
  fax_refund_already_decided: '이미 처리된 건입니다. 목록을 새로고침해 주세요.',
  fax_refund_in_progress: '아직 발송이 진행 중이어서 처리할 수 없습니다.',
})[error.response?.data?.detail] || '처리 결과를 확인하지 못했습니다. 목록을 새로고침해 상태를 확인해 주세요.';

export default function FaxRefundReviewQueue() {
  const [filters, setFilters] = useState({ page: 1, status: 'REVIEW_REQUIRED', q: '' });
  const [draft, setDraft] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [reason, setReason] = useState('');
  const [action, setAction] = useState('REFUND');
  const [busy, setBusy] = useState(false);
  const [decisionError, setDecisionError] = useState('');
  const [notice, setNotice] = useState('');
  const reload = () => setRefresh(value => value + 1);

  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    api.get('/api/v1/payments/admin/fax-refund-reviews', { ...filters, page_size: 20 })
      .then(({ data: result }) => {
        if (!active) return;
        if (filters.page > 1 && filters.page > result.total_pages) {
          setFilters(value => ({ ...value, page: Math.max(1, result.total_pages) }));
        } else setData(result);
      })
      .catch(() => { if (active) { setData(null); setError('팩스 꼬막 반환 목록을 불러오지 못했습니다. 새로고침해 주세요.'); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [filters, refresh]);

  const open = item => {
    setSelected(item); setReason(''); setAction('REFUND'); setDecisionError('');
  };
  const decide = async () => {
    setBusy(true); setDecisionError('');
    try {
      const { data: result } = await api.post(`/api/v1/payments/admin/fax-refund-reviews/${selected.id}/decide`, {
        action, reason: reason.trim(), expected_points: selected.point_cost,
      });
      setNotice(result.status === 'REFUNDED' ? `${result.point_cost}꼬막 반환을 완료했습니다.` : '차감 유지로 검토를 완료했습니다.');
      setSelected(null); reload();
    } catch (e) { setDecisionError(errorText(e)); }
    finally { setBusy(false); }
  };
  const reviewButton = item => <Button onClick={() => open(item)}>{item.status === 'REVIEW_REQUIRED' ? '검토하기' : '처리 내역'}</Button>;

  return <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, minWidth: 0, mb: 3 }}>
    <Stack spacing={2}>
      <Typography variant="h6" fontWeight={800}>팩스 꼬막 반환 검토</Typography>
      <Typography variant="body2" color="text.secondary">발송 결과가 불명확한 팩스의 꼬막을 반환하거나 차감을 유지합니다. 실제 수신 여부는 발송 기록과 수신처 확인을 바탕으로 판단해 주세요.</Typography>
      {notice && <Alert severity="success" onClose={() => setNotice('')}>{notice}</Alert>}
      <Stack component="form" direction={{ xs: 'column', sm: 'row' }} spacing={1} onSubmit={event => { event.preventDefault(); setFilters(value => ({ ...value, page: 1, q: draft.trim() })); }}>
        <TextField label="팩스 고객 이름·이메일·고객번호 검색" value={draft} onChange={event => setDraft(event.target.value)} inputProps={{ maxLength: 200 }} fullWidth />
        <TextField select label="팩스 처리 상태" value={filters.status} onChange={event => setFilters(value => ({ ...value, page: 1, status: event.target.value }))} sx={{ minWidth: 150 }}>
          {Object.entries(statuses).map(([key, label]) => <MenuItem key={key} value={key}>{label}</MenuItem>)}
        </TextField>
        <Button type="submit" sx={{ flexShrink: 0 }}>팩스 검색</Button>
        <Button onClick={reload} disabled={loading} sx={{ flexShrink: 0 }}>팩스 새로고침</Button>
      </Stack>
      {error && <Alert severity="error">{error}</Alert>}
      {loading && <Box role="status" aria-label="팩스 반환 검토 목록 조회 중"><CircularProgress size={28} /></Box>}
      {!loading && data && <>
        <Stack spacing={1.5} sx={{ display: { xs: 'flex', md: 'none' } }}>
          {data.items.map(item => <Paper key={item.id} variant="outlined" sx={{ p: 2 }}><Stack spacing={1}>
            <Typography fontWeight={700} sx={{ overflowWrap: 'anywhere' }}>{item.customer_name} · #{item.user_id}</Typography>
            <Typography variant="body2">{date(item.created_at)} · 팩스 시도 #{item.fax_attempt_id}</Typography>
            <Typography variant="body2">{item.point_cost}꼬막 · 확인 장수 {item.pages_sent ?? '미확인'}/{item.pages ?? '?'}장</Typography>
            <Chip size="small" label={statuses[item.status]} color={item.status === 'REVIEW_REQUIRED' ? 'warning' : 'default'} />
            {reviewButton(item)}
          </Stack></Paper>)}
          {!data.items.length && <Typography color="text.secondary">조건에 맞는 팩스 반환 검토 건이 없습니다.</Typography>}
        </Stack>
        <TableContainer sx={{ display: { xs: 'none', md: 'block' } }}>
          <Table size="small" aria-label="팩스 꼬막 반환 검토 목록">
            <TableHead><TableRow>{['접수일 (한국 시간)', '고객', '발송 기록', '꼬막', '상태', '처리'].map(label => <TableCell key={label}>{label}</TableCell>)}</TableRow></TableHead>
            <TableBody>
              {data.items.map(item => <TableRow key={item.id}>
                <TableCell>{date(item.created_at)}</TableCell>
                <TableCell sx={{ overflowWrap: 'anywhere' }}>{item.customer_name} · #{item.user_id}<Typography variant="caption" display="block">{item.customer_email}</Typography></TableCell>
                <TableCell>시도 #{item.fax_attempt_id}<Typography variant="caption" display="block">확인 {item.pages_sent ?? '미확인'}/{item.pages ?? '?'}장</Typography></TableCell>
                <TableCell>{item.point_cost}꼬막</TableCell>
                <TableCell><Chip size="small" label={statuses[item.status]} color={item.status === 'REVIEW_REQUIRED' ? 'warning' : 'default'} /></TableCell>
                <TableCell>{reviewButton(item)}</TableCell>
              </TableRow>)}
              {!data.items.length && <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}>조건에 맞는 팩스 반환 검토 건이 없습니다.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination component="div" count={data.total} page={filters.page - 1} onPageChange={(_, page) => setFilters(value => ({ ...value, page: page + 1 }))} rowsPerPage={20} rowsPerPageOptions={[20]} labelDisplayedRows={({ from, to, count }) => `${count}건 중 ${from}–${to}`} getItemAriaLabel={type => type === 'next' ? '다음 페이지' : '이전 페이지'} />
      </>}
    </Stack>
    <Dialog open={Boolean(selected)} onClose={() => { if (!busy) setSelected(null); }} fullWidth maxWidth="sm" aria-labelledby="fax-review-title">
      <DialogTitle id="fax-review-title">팩스 꼬막 반환 · 시도 #{selected?.fax_attempt_id}</DialogTitle>
      <DialogContent dividers>{selected && <Stack spacing={2}>
        <Typography>{selected.customer_name} · 고객 #{selected.user_id} · 청구 #{selected.request_id ?? '-'}</Typography>
        <Typography>차감 {selected.point_cost}꼬막 · 반환 {selected.refunded_points}꼬막 · {statuses[selected.status]}</Typography>
        <Typography>수신 확인 {selected.pages_sent ?? '미확인'}/{selected.pages ?? '?'}장 · 발송 기록 {selected.fax_status ?? '없음'}</Typography>
        <Typography>발송 시작: {date(selected.started_at)}<br />종료: {date(selected.completed_at)}</Typography>
        <Typography sx={{ overflowWrap: 'anywhere' }}>중단 사유: {selected.error_code || '기록 없음'}</Typography>
        {selected.status === 'REVIEW_REQUIRED' ? <>
          <Alert severity="info">꼬막 반환 여부를 결정합니다. 팩스가 다시 발송되지는 않습니다.</Alert>
          <TextField select label="처리 방법" value={action} disabled={busy} onChange={event => setAction(event.target.value)}>
            <MenuItem value="REFUND">{selected.point_cost}꼬막 전액 반환</MenuItem>
            <MenuItem value="KEEP">차감 유지</MenuItem>
          </TextField>
          <TextField label="검토·처리 사유" value={reason} onChange={event => setReason(event.target.value)} disabled={busy} multiline minRows={3} inputProps={{ maxLength: 500 }} required />
        </> : <Alert severity="info">처리일: {date(selected.decided_at)} · 처리 관리자: {selected.decided_by ?? '자동 처리'}<br />사유: {selected.decision_reason || '-'}</Alert>}
        {decisionError && <Alert severity="error">{decisionError}</Alert>}
      </Stack>}</DialogContent>
      <DialogActions>
        <Button disabled={busy} onClick={() => setSelected(null)}>닫기</Button>
        {selected?.status === 'REVIEW_REQUIRED' && <Button variant="contained" color={action === 'REFUND' ? 'success' : 'warning'} disabled={busy || !reason.trim()} onClick={decide}>{busy ? '처리 중…' : action === 'REFUND' ? `${selected.point_cost}꼬막 반환 확정` : '차감 유지 확정'}</Button>}
      </DialogActions>
    </Dialog>
  </Paper>;
}
