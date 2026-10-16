/* eslint-disable react/prop-types */
import { useState } from 'react';
import { Alert, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from '@mui/material';
import { getPointBalance } from '@/services/proposal-service';

const amount = (value) => Number.isFinite(value) ? `${value.toLocaleString()}꼬막` : '조회 불가';

export default function PointBalanceDetails({ balance, label = '잔여 꼬막 상세' }) {
  const [open, setOpen] = useState(false);
  const [loadedBalance, setLoadedBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const current = balance || loadedBalance;

  const show = async () => {
    setOpen(true);
    setError(false);
    if (balance) return;
    setLoadedBalance(null);
    setLoading(true);
    try { setLoadedBalance(await getPointBalance()); }
    catch { setError(true); }
    finally { setLoading(false); }
  };

  return <>
    <Button size="small" onClick={show} aria-label={label}>상세</Button>
    <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs" aria-label={label}>
      <DialogTitle>{label}</DialogTitle>
      <DialogContent>
        {loading && <CircularProgress size={24} aria-label="잔여 꼬막 조회 중" />}
        {error && <Alert severity="error">잔여 꼬막을 불러오지 못했습니다. 닫은 뒤 다시 시도해 주세요.</Alert>}
        {!loading && !error && current && <Stack spacing={2}>
          <Typography fontWeight={800}>총 잔여 꼬막: {amount(current.total_points)}</Typography>
          <Typography>지급 꼬막: {amount(current.free_points)}</Typography>
          <Typography>구매 꼬막: {amount(current.paid_points)}</Typography>
          <Typography variant="body2" color="text.secondary">현재 사용할 수 있는 잔여 꼬막만 표시합니다. 지급 꼬막에는 월 구독 및 기타 지급분이 포함됩니다.</Typography>
        </Stack>}
      </DialogContent>
      <DialogActions><Button onClick={() => setOpen(false)}>닫기</Button></DialogActions>
    </Dialog>
  </>;
}
