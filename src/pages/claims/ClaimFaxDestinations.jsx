import { Alert, Button, Chip, Paper, Stack, TextField, Typography } from '@mui/material';

// eslint-disable-next-line react/prop-types
export default function ClaimFaxDestinations({ insurers, numbers, onChange, disabled, readOnly = false }) {
  return <Stack spacing={2}>
    <Typography variant="h6" fontWeight={700}>보험사별 수신 팩스 번호</Typography>
    <Typography variant="body2" color="text.secondary">가상팩스를 사용하는 보험사는 보험사에서 발급받은 번호를 입력해 주세요.</Typography>
    {/* eslint-disable-next-line react/prop-types */}
    {insurers.map(insurer => {
      const common = insurer.fax_numbers?.[0] || '';
      const custom = numbers[insurer.id] || '';
      return <Paper key={insurer.id} variant="outlined" sx={{ p: 2 }}>
        <Stack spacing={1.5}>
          <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap">
            <Typography fontWeight={700}>{insurer.name}</Typography>
            <Chip size="small" label={insurer.use_virtual_fax ? '가상팩스' : '공용팩스'} />
          </Stack>
          {insurer.use_virtual_fax && !readOnly && <>
            <TextField fullWidth size="small" type="tel" label={`${insurer.name} 가상팩스 번호`}
              value={custom} disabled={disabled} required={!common} autoComplete="off"
              inputProps={{ maxLength: 30, pattern: '0(( |-)?[0-9]){8,11}', inputMode: 'tel' }}
              onChange={event => onChange(insurer.id, event.target.value)}
              helperText={common ? `입력하지 않으면 공용 번호 ${common}을 사용합니다.` : '보험사에서 발급받은 수신 번호를 입력해 주세요.'} />
            {insurer.customer_center_phone && <Button sx={{ alignSelf: 'flex-start' }} size="small"
              href={`tel:${insurer.customer_center_phone.replace(/[^0-9]/g, '')}`}>
              고객센터 {insurer.customer_center_phone}
            </Button>}
            {insurer.virtual_fax_ars && <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>{insurer.virtual_fax_ars}</Typography>}
            <Alert severity="info">발급받은 번호가 이번 청구에 유효한지 확인해 주세요.</Alert>
          </>}
          {(readOnly || !insurer.use_virtual_fax) && <Typography variant="body2">
            {custom ? '개별 가상팩스' : '공용팩스'}: {custom || common || '번호 확인 필요'}
          </Typography>}
        </Stack>
      </Paper>;
    })}
  </Stack>;
}
