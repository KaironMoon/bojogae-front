/* eslint-disable react/prop-types */
import { Box, Button, Paper, Stack, Typography } from '@mui/material';

export default function PaymentTransferNotice({ open, onClose }) {
  if (!open) return null;
  return <Box component="aside" role="region" aria-labelledby="payment-transfer-notice-title"
    sx={{ width: { xs: '100%', md: 300 }, flexShrink: 0, order: { xs: -1, md: 1 },
      p: 3, boxSizing: 'border-box', bgcolor: '#f8fafc', borderLeft: { md: '1px solid #e6eaee' },
      borderBottom: { xs: '1px solid #e6eaee', md: 0 } }}>
      <Stack spacing={2}>
        <Typography component="h2" id="payment-transfer-notice-title" fontSize={18} fontWeight={800}>입금 및 구독 안내</Typography>
        <Typography fontWeight={700}>현재 카드 결제는 테스트 결제 상태입니다.</Typography>
        <Typography>베이직/스탠다드 중 하나를 선택하여 해당 요금제 금액을 아래 계좌로 입금해 주세요.</Typography>
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
          <Typography variant="body2" color="text.secondary">입금 계좌 · 카카오뱅크</Typography>
          <Typography fontWeight={700} sx={{ overflowWrap: 'anywhere' }}>3333385387746</Typography>
          <Typography>예금주: 김성춘(마음AI)</Typography>
        </Paper>
        <Typography><a href="sms:01097299649">010-9729-9649</a>로 입금자명과 회원명을 문자로 알려주시면 구독 절차를 진행해 드립니다.</Typography>
        <Button variant="outlined" onClick={onClose}>안내 닫기</Button>
      </Stack>
  </Box>;
}
