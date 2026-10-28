/* eslint-disable react/prop-types */
import { useId } from 'react';
import { Alert, Box, Button, Chip, Paper, Stack, TextField, Typography } from '@mui/material';
import FaxNumberCopy from './FaxNumberCopy';
import ClaimInsurerLogo from './ClaimInsurerLogo';

export default function ClaimFaxDestinations({ insurers, numbers, onChange, disabled, readOnly = false, renderAction }) {
  const feedbackPrefix = useId();
  const feedbackId = insurer => `${feedbackPrefix}-feedback-${insurer.id}`;
  function heading(insurer, label) {
    const phone = insurer.customer_center_phone;
    return <Box sx={{ display: 'grid', gap: 1.5, alignItems: 'center',
      gridTemplateColumns: renderAction ? { xs: 'minmax(0, 1fr)', lg: 'minmax(0, 1fr) auto minmax(0, 1.5fr)' } : 'minmax(0, 1fr)' }}>
      <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap">
        <ClaimInsurerLogo insurer={insurer} /><Typography fontWeight={700}>{insurer.name}</Typography><Chip size="small" label={label} />
      </Stack>
      {phone ? <Button sx={{ justifySelf: 'start' }} size="small" href={`tel:${phone.replace(/[^0-9]/g, '')}`}>
        고객센터 {phone}
      </Button> : renderAction && <Typography variant="body2" color="text.secondary">등록된 고객센터 번호 없음</Typography>}
      {renderAction && <Box sx={{ justifySelf: { xs: 'start', lg: 'end' }, minWidth: 0 }}>{renderAction(insurer, feedbackId(insurer))}</Box>}
    </Box>;
  }
  return <Stack spacing={2} role="region" aria-label={renderAction ? '보험사별 다운로드·발송 안내' : '보험사별 발송 안내'}>
    <Typography variant="h6" fontWeight={700}>{renderAction ? '보험사별 다운로드·발송 안내' : '보험사별 발송 안내'}</Typography>
    {insurers.some(insurer => insurer.fax_enabled !== false) && <Typography variant="body2" color="text.secondary">{readOnly
      ? 'PDF를 다운로드해 직접 팩스로 보낼 때 아래 수신 정보를 확인해 주세요. 가상팩스 번호는 이번 청구에 유효한지 보험사에 확인해 주세요.'
      : '가상팩스를 사용하는 보험사는 보험사에서 발급받은 번호를 입력해 주세요.'}</Typography>}
    {insurers.map(insurer => {
      if (insurer.fax_enabled === false) return <Paper key={insurer.id} variant="outlined" sx={{ p: 2 }}>
        <Stack spacing={1.5}>
          {heading(insurer, '다운로드 전용')}
          <Typography variant="body2">{insurer.fax_disabled_reason || '팩스 발송을 지원하지 않습니다. 파일을 다운로드해 주세요.'}</Typography>
          {renderAction && <Box id={feedbackId(insurer)} sx={{ minWidth: 0, '&:empty': { display: 'none' } }} />}
        </Stack>
      </Paper>;
      const common = insurer.fax_numbers?.[0] || '';
      const custom = numbers[insurer.id] || '';
      return <Paper key={insurer.id} variant="outlined" sx={{ p: 2 }}>
        <Stack spacing={1.5}>
          {heading(insurer, insurer.use_virtual_fax ? '가상팩스' : '공용팩스')}
          {insurer.use_virtual_fax && !readOnly && <>
            <TextField fullWidth size="small" type="tel" label={`${insurer.name} 가상팩스 번호`}
              value={custom} disabled={disabled} autoComplete="off"
              inputProps={{ maxLength: 30, pattern: '0(( |-)?[0-9]){8,11}', inputMode: 'tel' }}
              onChange={event => onChange(insurer.id, event.target.value)}
              helperText={common ? `입력하지 않으면 공용 번호 ${common}을 사용합니다.` : '보험사에서 발급받은 수신 번호를 입력해 주세요.'} />
          </>}
          {insurer.virtual_fax_guide && <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>{insurer.virtual_fax_guide}</Typography>}
          {insurer.virtual_fax_ars && <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>{insurer.virtual_fax_ars}</Typography>}
          {insurer.use_virtual_fax && !readOnly && <Alert severity="info">발급받은 번호가 이번 청구에 유효한지 확인해 주세요.</Alert>}
          <Stack direction="row" gap={0.5} alignItems="center" flexWrap="wrap">
            <Typography variant="body2">{custom ? '개별 가상팩스' : common ? '공용팩스' : '수신 팩스'}:</Typography>
            {custom || common ? <FaxNumberCopy number={custom || common} label={`${insurer.name} 팩스번호`} />
              : <Typography variant="body2">보험사에서 가상팩스 번호를 발급받아 주세요.</Typography>}
          </Stack>
          {renderAction && <Box id={feedbackId(insurer)} sx={{ minWidth: 0, '&:empty': { display: 'none' } }} />}
        </Stack>
      </Paper>;
    })}
  </Stack>;
}
