/* eslint-disable react/prop-types */
import { useState } from 'react';
import { Alert, Button, IconButton, Snackbar, Stack, Tooltip } from '@mui/material';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';

export default function FaxNumberCopy({ number, label = '팩스번호' }) {
  const [notice, setNotice] = useState(null);
  const digits = String(number || '').replace(/\D/g, '');
  if (!digits) return null;
  async function copy() {
    try {
      await navigator.clipboard.writeText(digits);
      setNotice({ severity: 'success', text: '팩스번호가 복사되었습니다.' });
    } catch {
      setNotice({ severity: 'error', text: '팩스번호를 복사하지 못했습니다. 번호를 직접 복사해 주세요.' });
    }
  }
  return <>
    <Stack direction="row" alignItems="center" sx={{ display: 'inline-flex' }}>
      <Button size="small" onClick={copy} aria-label={`${label} ${number} 복사`}
        sx={{ minWidth: 0, px: 0.5, whiteSpace: 'nowrap' }}>{number}</Button>
      <Tooltip title="팩스번호 복사"><IconButton size="small" onClick={copy} aria-label={`${label} 복사 아이콘`}>
        <ContentCopyOutlinedIcon fontSize="small" />
      </IconButton></Tooltip>
    </Stack>
    <Snackbar open={Boolean(notice)} autoHideDuration={2500} onClose={() => setNotice(null)}>
      <Alert severity={notice?.severity || 'success'} onClose={() => setNotice(null)}>{notice?.text}</Alert>
    </Snackbar>
  </>;
}
