import { useEffect, useState } from 'react';
import { Alert, Button, Chip, LinearProgress, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField, Typography } from '@mui/material';
import api from '@/services/api-caller';
import { paymentError } from '@/services/payment-service';
import PaymentRefundDialog from './PaymentRefundDialog';

const PAGE_SIZE = 20;
const orderStatuses = { READY:'결제 대기', SCHEDULED:'예약됨', PAID:'결제 완료', FAILED:'결제 실패', CANCELED:'취소 완료', REVIEW:'확인 필요' };
const verificationStatuses = { READY:'카드 확인 대기', CHARGING:'승인 확인 중', CANCELING:'취소 확인 중', COMPLETED:'전액 취소 완료', FAILED:'승인 실패', REVIEW:'확인 필요' };
const refundStatuses = { PENDING:'취소 확인 중', PENDING_VERIFICATION:'취소 확인 중', REVIEW:'관리자 확인 필요', COMPLETED:'취소 완료' };
const providers = { MOBILPAY:'KG파이낸셜', PORTONE:'포트원' };
const date = value => new Date(value).toLocaleString('ko-KR', { timeZone:'Asia/Seoul' });

export default function AdminPaymentHistory() {
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [revision, setRevision] = useState(0);
  const [data, setData] = useState({ items:[], total:0 });
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const [result, setResult] = useState(null);
  const refresh = () => setRevision(value => value + 1);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setListError('');
    api.get('/api/v1/payments/admin/orders', { page:page + 1, page_size:PAGE_SIZE, q:query },
      { signal:controller.signal }).then(({ data:response }) => {
      if (controller.signal.aborted) return;
      const lastPage = Math.max(0, Math.ceil(response.total / PAGE_SIZE) - 1);
      if (page > lastPage) setPage(lastPage);
      else setData(response);
    }).catch(error => {
      if (!controller.signal.aborted) setListError(paymentError(error));
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [page, query, revision]);

  const submit = async action => {
    setBusy(true);
    setActionError('');
    try {
      setResult(await action());
      setSelected(null);
    } catch (error) {
      setActionError(paymentError(error));
    } finally {
      refresh();
      setBusy(false);
    }
  };

  return <Paper variant="outlined" sx={{ p:2, mb:3, borderRadius:3, minWidth:0 }}><Stack spacing={1.5}>
    <Typography variant="h6" fontWeight={800}>전체 결제내역</Typography>
    <Stack component="form" direction={{ xs:'column', sm:'row' }} spacing={1} onSubmit={event => {
      event.preventDefault();
      setPage(0);
      setQuery(search.trim());
      refresh();
    }}>
      <TextField size="small" label="회원명, 이메일, 회원 ID 또는 결제 ID" value={search} onChange={event => setSearch(event.target.value)} slotProps={{ htmlInput:{ maxLength:200 } }} sx={{ flexGrow:1 }} />
      <Button type="submit" variant="outlined" disabled={busy}>검색</Button>
      <Button type="button" disabled={busy || loading} onClick={refresh}>새로고침</Button>
    </Stack>
    {result && <Alert severity="info">{result.status === 'COMPLETED' ? '환불 완료' : '취소 요청을 처리했습니다. 결과는 목록에서 확인해 주세요.'}{result.refund_id && ` · 환불 요청 ID ${result.refund_id}`}</Alert>}
    {listError && <Alert severity="error">{listError}</Alert>}
    {loading && <LinearProgress aria-label="전체 결제내역 불러오는 중" />}
    <TableContainer>
      <Table size="small" aria-label="전체 결제내역" sx={{ minWidth:820 }}>
        <TableHead><TableRow>{['일시 (한국 시간)', '회원', '상품·결제 ID', '결제금액', '취소금액', '상태', '처리'].map(label => <TableCell key={label}>{label}</TableCell>)}</TableRow></TableHead>
        <TableBody>
          {!loading && !listError && !data.items.length && <TableRow><TableCell align="center" colSpan={7}>결제내역이 없습니다.</TableCell></TableRow>}
          {data.items.map(order => <TableRow key={order.id}>
            <TableCell sx={{ whiteSpace:'nowrap' }}>{date(order.paid_at || order.created_at)}</TableCell>
            <TableCell>{order.customer_name || '이름 없음'}<Typography variant="caption" display="block">회원 #{order.user_id}</Typography></TableCell>
            <TableCell sx={{ overflowWrap:'anywhere' }}>
              <Typography variant="body2" fontWeight={700}>{order.order_name}</Typography>
              <Typography variant="caption" display="block">{providers[order.payment_provider] || order.payment_provider}{order.environment === 'TEST' && ' · 테스트'}</Typography>
              <Typography variant="caption">{order.id}</Typography>
            </TableCell>
            <TableCell sx={{ whiteSpace:'nowrap' }}>{order.amount.toLocaleString()}원</TableCell>
            <TableCell sx={{ whiteSpace:'nowrap' }}>{order.refunded_amount.toLocaleString()}원</TableCell>
            <TableCell>
              <Chip size="small" label={(order.is_card_verification ? verificationStatuses : orderStatuses)[order.status] || order.status} />
              {order.refund_status && <Typography variant="caption" display="block">{refundStatuses[order.refund_status] || order.refund_status}</Typography>}
            </TableCell>
            <TableCell sx={{ whiteSpace:'nowrap' }}>{order.cancellable_amount > 0 ? <Button size="small" color="warning" disabled={busy || loading || Boolean(listError)} onClick={() => {
              setResult(null); setActionError(''); setSelected(order);
            }}>결제 취소</Button> : '—'}</TableCell>
          </TableRow>)}
        </TableBody>
      </Table>
    </TableContainer>
    <TablePagination component="div" count={data.total} page={Math.min(page, Math.max(0, Math.ceil(data.total / PAGE_SIZE) - 1))}
      onPageChange={(_, value) => setPage(value)} rowsPerPage={PAGE_SIZE} rowsPerPageOptions={[PAGE_SIZE]}
      labelDisplayedRows={({ from, to, count }) => `${count}건 중 ${from}–${to}`}
      getItemAriaLabel={type => type === 'next' ? '다음 페이지' : '이전 페이지'} />
    <PaymentRefundDialog key={selected?.id || 'closed'} order={selected} busy={busy} error={actionError} onClose={() => setSelected(null)} onSubmit={submit} />
  </Stack></Paper>;
}
