// 실제 API와 DB 호출 없이 옵션 저장을 확인합니다.
import { createRoot } from 'react-dom/client';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import api from '@/services/api-caller';
import ProposalSettingsPage from '@/pages/admin/ProposalSettingsPage';
let monthlyAmount = 30;
api.axiosInstance.defaults.adapter = async (config) => {
  const path = new URL(config.url, 'http://localhost').pathname;
  let data;
  if (path.endsWith('/personal-monthly-points')) {
    if (config.method === 'put') monthlyAmount = JSON.parse(config.data).amount;
    data = { amount: monthlyAmount };
  } else if (path.endsWith('/prompt-point-costs')) data = [];
  else if (path.endsWith('/proposal-settings')) data = {
    llm_model: 'test', llm_models: [{ id: 'test', label: '테스트 모델' }], thinking_level: 'minimal',
    max_output_tokens: 65536, max_pdf_files: 5, max_pdf_bytes: 10485760, max_active_jobs_per_user: 3, max_global_running_jobs: 3,
  };
  else throw new Error(`격리 테스트에서 지원하지 않는 API: ${path}`);
  return { data, status: 200, statusText: 'OK', headers: {}, config };
};
createRoot(document.getElementById('root')).render(<ThemeProvider theme={createTheme()}><CssBaseline /><ProposalSettingsPage /></ThemeProvider>);
