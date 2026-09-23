import { Alert, Box, Pagination, Paper, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import api from '@/services/api-caller';
import PointGrantsTable from '@/pages/admin/PointGrantsTable';
import { groupErrorMessage } from '@/services/group-service';
export default function MyCoinsPage() {
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true; setError('');
    api.get('/api/v1/points/me/grants', { page, grant_filter: 'ALL' }).then(({ data }) => { if (active) setDetail(data); }).catch((e) => { if (active) setError(groupErrorMessage(e)); });
    return () => { active = false; };
  }, [page]);
  return <Box component="main" sx={{ p: { xs: 2, md: 4 }, maxWidth: 1280, mx: 'auto' }}>
    <Paper sx={{ p: { xs: 2, sm: 3 } }}><Stack spacing={2}><Typography variant="h5" fontWeight={800}>내 포인트</Typography>{error && <Alert severity="error">{error}</Alert>}
      {detail && <><Typography sx={{ overflowWrap: 'anywhere' }}>보유 {(detail.summary.free_points + detail.summary.paid_points).toLocaleString()}P · 예약 중 {detail.summary.reserved_points}P</Typography><PointGrantsTable items={detail.items} hideType />{!detail.items.length && <Typography>지급 내역이 없습니다.</Typography>}<Pagination count={Math.max(1, detail.total_pages)} page={page} onChange={(_, value) => setPage(value)} /></>}
    </Stack></Paper>
  </Box>;
}
