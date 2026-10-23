import { Box, Stack, Typography } from '@mui/material';
import PaymentReviewQueue from './PaymentReviewQueue';

export default function PaymentSupportPage() {
  return <Box component="main" sx={{ p: { xs: 2, md: 4 }, maxWidth: 1280, mx: 'auto', minWidth: 0 }}>
    <Stack spacing={1} sx={{ mb: 3 }}>
      <Typography variant="h4" component="h1" fontWeight={850}>결제·환불 처리</Typography>
      <Typography color="text.secondary">사용자별 결제 내역과 구독 종료 검토 건을 확인하고 처리합니다.</Typography>
    </Stack>
    <PaymentReviewQueue />
  </Box>;
}
