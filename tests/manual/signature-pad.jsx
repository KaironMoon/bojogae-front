import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Box, Button, CssBaseline, ThemeProvider, Typography, createTheme } from '@mui/material';
import SignaturePad from '@/pages/claims/SignaturePad';

// eslint-disable-next-line react-refresh/only-export-components
function SignatureCheck() {
  const [value, setValue] = useState('');
  const [visible, setVisible] = useState(true);
  const [wide, setWide] = useState(true);
  return <Box sx={{ m: 4, maxWidth: wide ? 850 : 330 }}>
    <Typography variant="h5">서명 좌표 검증</Typography>
    <Typography>입력한 위치와 선이 일치하는지, 크기 변경과 화면 전환 후에도 유지되는지 확인합니다.</Typography>
    <Button onClick={() => setWide(v => !v)}>입력 폭 전환</Button>
    <Button onClick={() => setVisible(v => !v)}>서명 화면 전환</Button>
    {visible && <SignaturePad label="테스트 서명" value={value} onChange={setValue} />}
    <Typography role="status">{value ? '서명 저장됨' : '서명 없음'}</Typography>
    {value && <Box component="img" src={value} alt="저장된 서명 이미지" sx={{ maxWidth: '100%', border: '1px dashed #999' }} />}
  </Box>;
}
createRoot(document.getElementById('root')).render(<ThemeProvider theme={createTheme()}><CssBaseline /><SignatureCheck /></ThemeProvider>);
