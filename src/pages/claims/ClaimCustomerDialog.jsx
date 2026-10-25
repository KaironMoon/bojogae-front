/* eslint-disable react/prop-types */
import { useEffect, useRef, useState } from 'react';
import { Alert, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle,
  List, ListItem, ListItemText, Pagination, Stack, TextField, Typography } from '@mui/material';
import { crmError, crmGet } from '@/services/crm-service';
import { formatClaimInput } from '@/services/claim-validation';

export default function ClaimCustomerDialog({ label, onClose, onSelect }) {
  const [text, setText] = useState('');
  const [search, setSearch] = useState({ q: '', page: 1 });
  const [result, setResult] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(false);
  const [error, setError] = useState('');
  const detailRequest = useRef(null);
  useEffect(() => () => detailRequest.current?.abort(), []);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError('');
    crmGet('/customers', { ...search, archived: false, page_size: 10 }, { signal: controller.signal })
      .then(data => { if (!controller.signal.aborted) setResult(data); })
      .catch(e => { if (!controller.signal.aborted) setError(crmError(e)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [search]);
  function find() {
    const query = text.trim();
    const q = /^[0-9\s()-]+$/.test(query) ? query.replace(/\D/g, '') : query;
    setLoading(true); setSearch({ q, page: 1 });
  }
  async function select(customer) {
    const controller = new AbortController();
    detailRequest.current = controller;
    setSelecting(true); setError('');
    try {
      const details = await crmGet(`/customers/${customer.id}/contract-party`, {}, { signal: controller.signal });
      if (!controller.signal.aborted) onSelect(details);
    } catch (e) {
      if (!controller.signal.aborted) setError(crmError(e));
    } finally {
      if (!controller.signal.aborted) setSelecting(false);
    }
  }
  return <Dialog open fullWidth maxWidth="sm" onClose={onClose} aria-labelledby="claim-customer-title">
    <DialogTitle id="claim-customer-title">{label} · 내 고객 불러오기</DialogTitle>
    <DialogContent>
      <Stack spacing={2} sx={{ pt: 1 }}>
        <Typography variant="body2" color="text.secondary">이름·연락처로 검색해 주세요. 주민등록번호 나머지 자리와 서명은 직접 입력해야 합니다.</Typography>
        <Stack direction="row" spacing={1}>
          <TextField autoFocus fullWidth size="small" label="고객 이름·연락처" value={text} disabled={selecting}
            inputProps={{ maxLength: 200 }} onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); find(); } }} />
          <Button onClick={find} disabled={selecting}>검색</Button>
        </Stack>
        {error && <Alert severity="error">{error}<Button disabled={selecting} onClick={() => {
          setLoading(true); setSearch(previous => ({ ...previous }));
        }}>목록 다시 불러오기</Button></Alert>}
        {loading ? <CircularProgress size={24} aria-label="내 고객 검색 중" /> : !error && <>
          {!result.items.length && <Typography color="text.secondary">검색된 고객이 없습니다.</Typography>}
          <List disablePadding aria-label="내 고객 검색 결과">
            {result.items.map(customer => <ListItem key={customer.id} divider disableGutters
              secondaryAction={<Button disabled={selecting} onClick={() => select(customer)} aria-label={`${customer.name} 고객 불러오기`}>불러오기</Button>}>
              <ListItemText sx={{ pr: 2, overflowWrap: 'anywhere' }} primary={customer.name}
                secondary={formatClaimInput('insured_phone', customer.phone) || '연락처 미등록'} />
            </ListItem>)}
          </List>
          {result.total > 10 && <Pagination count={Math.ceil(result.total / 10)} page={search.page} disabled={selecting}
            size="small" onChange={(_, page) => { setLoading(true); setSearch(previous => ({ ...previous, page })); }} />}
        </>}
        {selecting && <Typography role="status">고객 정보를 불러오는 중입니다.</Typography>}
      </Stack>
    </DialogContent>
    <DialogActions><Button onClick={onClose}>닫기</Button></DialogActions>
  </Dialog>;
}
