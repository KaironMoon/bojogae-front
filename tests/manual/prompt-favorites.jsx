import { createRoot } from "react-dom/client";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import apiCaller from "@/services/api-caller";
import ProposalsPage from "@/pages/proposals/ProposalsPage";
const category = (id, name) => ({ id, name, parent_id: 100, parent_name: "보험", parent_sort_order: 0, sort_order: id });
const prompts = [
  { id: 1, title: "일반 암보험", is_favorite: false, categories: [category(10, "암보험")] },
  { id: 2, title: "내 암보험", is_favorite: true, categories: [category(10, "암보험")] },
  { id: 3, title: "내 간병보험", is_favorite: true, categories: [category(20, "간병보험")] },
].map((p) => ({ ...p, current_version_id: p.id, current_version_no: 1, point_cost: 1, input_schema: [] }));
apiCaller.axiosInstance.defaults.adapter = async (config) => {
  const path = config.url;
  let data;
  if (path.endsWith('/favorite')) {
    const id = Number(path.split('/').at(-2));
    const payload = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
    prompts.find((p) => p.id === id).is_favorite = payload.is_favorite;
    data = { prompt_id: id, is_favorite: payload.is_favorite };
  } else if (path.endsWith('/prompt-options')) data = prompts.map((p) => ({ ...p }));
  else if (path.endsWith('/points/me')) data = { free_points: 100, paid_points: 0, total_points: 100, expiring_points: [] };
  else if (path.endsWith('/proposals')) data = { items: [], page: 1, total_pages: 0 };
  else throw new Error(`격리 테스트에서 지원하지 않는 API: ${path}`);
  return { data, status: 200, statusText: 'OK', headers: {}, config };
};
createRoot(document.getElementById('root')).render(<ThemeProvider theme={createTheme()}><CssBaseline /><ProposalsPage /></ThemeProvider>);
