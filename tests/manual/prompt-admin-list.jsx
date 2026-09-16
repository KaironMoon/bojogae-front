// 실제 API 없이 125개 프롬프트의 50개 단위 페이지 이동과 선택을 확인합니다.
import { createRoot } from 'react-dom/client';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import api from '@/services/api-caller';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import PromptsPage from '@/pages/prompts/PromptsPage';
const rows = Array.from({ length: 125 }, (_, index) => ({ id: index + 1, title: `테스트 프롬프트 ${String(index + 1).padStart(3, '0')}`, body: '설명 테스트', current_version_id: index + 1, current_version_no: 1, updated_at: '2026-09-16T12:00:00+09:00', categories: [], input_schema: [], is_deleted: false }));
api.axiosInstance.defaults.adapter = async (config) => {
  const path = new URL(config.url, 'http://localhost').pathname;
  let data;
  if (path.endsWith('/prompt-categories')) data = [];
  else if (path.endsWith('/versions')) data = [];
  else if (path.endsWith('/prompts')) {
    const page = Number(config.params.page), size = Number(config.params.page_size);
    data = { items: rows.slice((page - 1) * size, page * size), total_pages: Math.ceil(rows.length / size), total: rows.length, page, page_size: size };
  } else if (/\/prompts\/\d+$/.test(path)) data = rows.find((row) => row.id === Number(path.split('/').at(-1)));
  else throw new Error(`지원하지 않는 테스트 API: ${path}`);
  return { data, status: 200, statusText: 'OK', headers: {}, config };
};
createRoot(document.getElementById('root')).render(<ThemeProvider theme={createTheme()}><CssBaseline /><RouterProvider router={createMemoryRouter([{ path: "/", element: <PromptsPage /> }])} /></ThemeProvider>);
