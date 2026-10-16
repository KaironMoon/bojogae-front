import KkomakIcon from '@/pages/components/KkomakIcon';
import {
  Alert, Box, CircularProgress, Pagination, Paper, Stack,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '@/services/api-caller';
import { groupErrorMessage } from '@/services/group-service';

const date = (value) => new Date(value).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });

export default function MyCoinsPage() {
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setError('');
    setLoading(true);
    setDetail(null);
    api.get('/api/v1/points/me/ledger', { page })
      .then(({ data }) => { if (active) setDetail(data); })
      .catch((e) => { if (active) setError(groupErrorMessage(e)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [page]);

  return <Box component="main" sx={{ p: { xs: 2, md: 4 }, maxWidth: 1280, mx: 'auto' }}>
    <Paper sx={{ p: { xs: 2, sm: 3 } }}>
      <Stack spacing={2}>
        <Typography variant="h5" fontWeight={800}>내 꼬막</Typography>
        <Typography variant="body2" color="text.secondary">충전·지급, 사용·차감 및 거래 후 잔여 꼬막을 확인할 수 있습니다. 구매 꼬막 충전금액은 원으로, 이용 수량은 꼬막으로 표시합니다. 문서 생성 시 표시된 수량을 차감하며, 예약 중인 수량도 사용 가능 잔액에서 제외됩니다.</Typography>
        <Typography variant="body2"><Link to="/profile#plan">꼬막 충전</Link> · <Link to="/payment-history">결제·환불 내역</Link></Typography>
        {error && <Alert severity="error">{error}</Alert>}
        {loading && <Box role="status" aria-label="꼬막 내역 조회 중" sx={{ textAlign: 'center', py: 3 }}><CircularProgress size={28} /></Box>}
        {detail && <>
          <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Table size="small" sx={{ minWidth: 600 }} aria-label="꼬막 입출금 내역">
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 750 }}>일시 (한국 시간)</TableCell>
                  <TableCell sx={{ fontWeight: 750 }}>내역</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 750 }}>충전금액</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 750 }}>충전·지급</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 750 }}>사용·차감</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 750 }}>거래 후 잔여 꼬막</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {detail.items.map((item) => <TableRow key={item.id}>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{date(item.occurred_at)}</TableCell>
                  <TableCell sx={{ overflowWrap: 'anywhere', whiteSpace: 'pre-wrap' }}>{item.description}</TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{item.payment_amount != null ? `${item.payment_amount.toLocaleString()}원` : '—'}</TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap', color: 'success.dark', fontVariantNumeric: 'tabular-nums' }}>{item.credit ? `${item.credit.toLocaleString()}꼬막` : '—'}</TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{item.debit ? `${item.debit.toLocaleString()}꼬막` : '—'}</TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{item.balance_after.toLocaleString()}꼬막</TableCell>
                </TableRow>)}
                {!detail.items.length && <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}>꼬막 입출금 내역이 없습니다.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
          {detail.total_pages > 1 && <Pagination count={detail.total_pages} page={page} onChange={(_, value) => setPage(value)} />}
          <Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-end" sx={{ pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <Typography fontWeight={800}>현재 잔액</Typography>
            <KkomakIcon />
            <Typography fontWeight={800} color="primary.main">{detail.balance.toLocaleString()}꼬막</Typography>
          </Stack>
        </>}
      </Stack>
    </Paper>
  </Box>;
}
