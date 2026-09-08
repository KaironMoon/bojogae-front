// Vite에서 /tests/manual/prompt-inputs.html 로 여는 격리된 UI 테스트입니다.
// 모든 API는 메모리 어댑터로 대체됩니다. 실제 DB·LLM·포인트를 사용하지 않습니다.
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { Box, Button, CssBaseline, Stack, ThemeProvider, Typography, createTheme } from "@mui/material";
import InputSchemaEditor from "../../src/pages/prompts/InputSchemaEditor";
import ProposalsPage from "../../src/pages/proposals/ProposalsPage";
import apiCaller from "../../src/services/api-caller";

let fields = [
  { key: "customer", label: "고객명", type: "text", required: true, help: "문서에 표시할 이름", max_files: 1, options: [] },
  { key: "age", label: "나이", type: "number", required: false, help: "", max_files: 1, options: [] },
  { key: "kind", label: "문서 목적", type: "select", required: true, help: "", options: ["신규 가입", "리모델링"], max_files: 1 },
  { key: "coverage", label: "기존 보장 분석표", type: "file", required: false, help: "보유한 보험 자료", max_files: 2, options: [] },
];
let submitted = null;
apiCaller.axiosInstance.defaults.adapter = async (config) => {
  let data;
  if (config.method === "post") {
    submitted = Object.fromEntries(config.data.entries());
    // Capture without starting an SSE job; the test result is displayed below.
    throw new Error("UI test: request captured, no LLM call");
  } else if (config.url.endsWith("/prompt-options")) {
    data = [
      { id: 1, title: "입력 UI 테스트 문서", current_version_id: 1, current_version_no: 1, point_cost: 1, input_schema: fields, categories: [] },
      { id: 2, title: "기본 PDF 문서", current_version_id: 2, current_version_no: 1, point_cost: 1, input_schema: [], categories: [] },
    ];
  } else if (config.url.endsWith("/points/me")) {
    data = { free_points: 100, paid_points: 0, total_points: 100, expiring_points: [] };
  } else {
    data = { items: [], total_pages: 0, total: 0 };
  }
  return { data, status: 200, statusText: "OK", headers: {}, config };
};

export default function Harness() {
  const [schema, setSchema] = useState(fields);
  const [view, setView] = useState("editor");
  const [payload, setPayload] = useState(null);
  return <ThemeProvider theme={createTheme()}><CssBaseline /><Box sx={{ p: 3 }}>
    <Typography variant="h5">격리 UI 테스트 — DB·LLM 호출 없음</Typography>
    <Stack direction="row" spacing={1} sx={{ my: 2 }}>
      <Button onClick={() => setView("editor")}>관리자 설정</Button>
      <Button onClick={() => { fields = schema; setView("document"); }}>사용자 화면</Button>
      <Button onClick={() => setPayload(submitted)}>전송 데이터 확인</Button>
    </Stack>
    {view === "editor" ? <InputSchemaEditor value={schema} onChange={setSchema} disabled={false} /> : <ProposalsPage />}
    {payload && <pre>{JSON.stringify(payload, null, 2)}</pre>}
  </Box></ThemeProvider>;
}

createRoot(document.getElementById("root")).render(<Harness />);
