import { Chip } from '@mui/material';

// The server owns delivery status. Unknown values must never imply success.
// eslint-disable-next-line react/prop-types
export default function ClaimDeliveryStatus({ status }) {
  const stored = status === 'STORED';
  const label = stored ? '미전송 · 저장됨' : '전송 상태 확인 필요';
  return <Chip size="small" variant="outlined" color={stored ? 'warning' : 'default'}
    label={label} role="status" aria-label={`팩스 전송 상태: ${label}`} />;
}
