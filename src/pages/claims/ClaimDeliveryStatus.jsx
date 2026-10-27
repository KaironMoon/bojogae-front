import { Chip } from '@mui/material';

// The server owns delivery status. Unknown values must never imply success.
// eslint-disable-next-line react/prop-types
export default function ClaimDeliveryStatus({ status }) {
  const states = { STORED: ['파일 저장 · 미전송', 'default'], PENDING: ['발송 처리 중', 'warning'],
    UNKNOWN: ['결과 확인 필요', 'warning'], SUCCESS: ['발송 성공', 'success'], FAILED: ['발송 실패', 'error'] };
  const [label, color] = states[status] || ['전송 상태 확인 필요', 'default'];
  return <Chip size="small" variant="outlined" color={color}
    label={label} role="status" aria-label={`팩스 전송 상태: ${label}`} />;
}
