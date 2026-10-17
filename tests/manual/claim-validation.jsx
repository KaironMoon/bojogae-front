import { createRoot } from 'react-dom/client';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import ClaimsPage from '@/pages/claims/ClaimsPage';
import apiCaller from '@/services/api-caller';

apiCaller.axiosInstance.defaults.adapter = async config => {
  if (!config.url.endsWith('/claims/insurers')) throw new Error('입력 오류가 있는 상태에서 PDF 요청이 발생했습니다.');
  return { data: { items: [
    { id: '3', name: 'AIG손해보험', kind: 'DAMAGE', pages: 6 },
    { id: '1', name: 'DB손해보험', kind: 'DAMAGE', pages: 4 },
    { id: '35', name: '카디프(BNP)생명', kind: 'LIFE', pages: 4 },
  ] },
    status: 200, statusText: 'OK', headers: {}, config };
};
createRoot(document.getElementById('root')).render(<ThemeProvider theme={createTheme()}><CssBaseline /><ClaimsPage /></ThemeProvider>);
