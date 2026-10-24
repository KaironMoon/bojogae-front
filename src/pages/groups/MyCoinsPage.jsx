import ExpiringPoints from '@/pages/components/ExpiringPoints';
import { getPointBalance } from '@/services/proposal-service';
import KkomakIcon from '@/pages/components/KkomakIcon';
import PointBalanceDetails from '@/pages/components/PointBalanceDetails';
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
  const [balance, setBalance] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setError('');
    setLoading(true);
    setDetail(null);
    setBalance(null);
    Promise.all([api.get('/api/v1/points/me/ledger', { page }), getPointBalance()])
      .then(([{ data }, currentBalance]) => { if (active) { setDetail(data); setBalance(currentBalance); } })
      .catch((e) => { if (active) setError(groupErrorMessage(e)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [page]);

  return <Box component="main" sx={{ p: { xs: 2, md: 4 }, maxWidth: 1280, mx: 'auto' }}>
    <Paper sx={{ p: { xs: 2, sm: 3 } }}>
      <Stack spacing={2}>
        <Typography variant="h5" fontWeight={800}>내꼬막</Typography>
        <Typography variant="body2" color="text.secondary">꼬막 증가·사용 내역과 합산 잔액을 확인할 수 있습니다. 잔여 꼬막의 구성은 사용 가능 꼬막 옆 상세에서 확인해 주세요. 예약 중인 꼬막은 사용 가능 잔액에서 제외됩니다.</Typography>
        <Typography variant="body2"><Link to="/profile#plan">구독 관리</Link> · <Link to="/payment-history">결제·환불 내역</Link></Typography>
        {error && <Alert severity="error">{error}</Alert>}
        {loading && <Box role="status" aria-label="꼬막 내역 조회 중" sx={{ textAlign: 'center', py: 3 }}><CircularProgress size={28} /></Box>}
        {detail && <>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <Typography fontWeight={800}>사용 가능 꼬막</Typography>
              <KkomakIcon />
              <Typography variant="h5" fontWeight={800} color="primary.main">{balance.total_points.toLocaleString()}꼬막</Typography>
              <PointBalanceDetails balance={balance} />
            </Stack>
            <ExpiringPoints balance={balance} />
          </Paper>
          <Alert severity="info">개인 월 구독 꼬막은 결제 승인 후 지급되며 해당 구독 이용기간 종료 시 미사용분이 소멸하고 이월되지 않습니다. 업그레이드 추가 지급분도 같은 종료일에 소멸합니다. 무료체험은 가입 시 200꼬막을 한 번 지급하며 30일간 사용할 수 있습니다.</Alert>
          {detail.items.some((item) => !Number.isFinite(item.balance_after)) && <Alert severity="warning">일부 거래의 잔여 꼬막을 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.</Alert>}
          <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Table size="small" sx={{ minWidth: 600 }} aria-label="꼬막 입출금 내역">
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 750 }}>일시 (한국 시간)</TableCell>
                  <TableCell sx={{ fontWeight: 750 }}>내역</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 750 }}>충전·지급</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 750 }}>사용·소진</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 750 }}>거래 후 잔여 꼬막</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {detail.items.map((item) => <TableRow key={item.id}>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{date(item.occurred_at)}</TableCell>
                  <TableCell sx={{ overflowWrap: 'anywhere', whiteSpace: 'pre-wrap' }}>{item.description}</TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap', color: 'success.dark', fontVariantNumeric: 'tabular-nums' }}>{item.credit ? `${item.credit.toLocaleString()}꼬막` : '—'}</TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{item.debit ? `${item.debit.toLocaleString()}꼬막` : '—'}</TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{Number.isFinite(item.balance_after) ? `${item.balance_after.toLocaleString()}꼬막` : '조회 불가'}</TableCell>
                </TableRow>)}
                {!detail.items.length && <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4 }}>꼬막 입출금 내역이 없습니다.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
          {detail.total_pages > 1 && <Pagination count={detail.total_pages} page={page} onChange={(_, value) => setPage(value)} />}
        </>}
      </Stack>
    </Paper>
  </Box>;
}
