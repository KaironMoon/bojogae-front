import { Alert, Box, Button, Paper, Stack, TextField, Typography } from "@mui/material";
import { useCallback, useEffect, useState } from "react";

import { getUsage } from "@/services/proposal-service";


const EMPTY = { call_count: 0, input_tokens: 0, output_tokens: 0, thought_tokens: 0, cached_tokens: 0, total_tokens: 0 };

function Metrics({ values = EMPTY }) { // eslint-disable-line react/prop-types
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", lg: "repeat(6, 1fr)" }, gap: 1.5 }}>
      {[['호출', 'call_count'], ['입력 토큰', 'input_tokens'], ['출력 토큰', 'output_tokens'], ['사고 토큰', 'thought_tokens'], ['캐시 토큰', 'cached_tokens'], ['전체 토큰', 'total_tokens']].map(([label, key]) => (
        <Paper key={key} variant="outlined" sx={{ p: 2 }}>
          <Typography variant="caption" color="text.secondary">{label}</Typography>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>{(values[key] || 0).toLocaleString()}</Typography>
        </Paper>
      ))}
    </Box>
  );
}

function UsagePage() {
  const [filters, setFilters] = useState({ date_from: "", date_to: "", user_id: "" });
  const [data, setData] = useState({ totals: EMPTY, by_date: [], by_user: [] });
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      setData(await getUsage(Object.fromEntries(Object.entries(filters).filter(([, value]) => value))));
    } catch {
      setError("사용량을 불러오지 못했습니다.");
    }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1400, mx: "auto" }}>
      <Typography variant="h4" sx={{ fontWeight: 800 }}>Gemini 사용량</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>실제 생성 API 호출 건수와 응답 usage 토큰을 집계합니다.</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: "column", md: "row" }} gap={2}>
          <TextField type="date" label="시작일" InputLabelProps={{ shrink: true }} value={filters.date_from} onChange={(event) => setFilters({ ...filters, date_from: event.target.value })} />
          <TextField type="date" label="종료일" InputLabelProps={{ shrink: true }} value={filters.date_to} onChange={(event) => setFilters({ ...filters, date_to: event.target.value })} />
          <TextField type="number" label="사용자 ID" value={filters.user_id} onChange={(event) => setFilters({ ...filters, user_id: event.target.value })} />
          <Button variant="contained" onClick={load}>조회</Button>
        </Stack>
      </Paper>
      <Metrics values={data.totals} />
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 2, mt: 3 }}>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 750, mb: 1 }}>일자별</Typography>
          {data.by_date.map((row) => <Typography key={row.date} variant="body2" sx={{ py: 0.75 }}>{row.date} · 호출 {row.call_count} · 토큰 {row.total_tokens.toLocaleString()}</Typography>)}
          {!data.by_date.length && <Typography color="text.secondary">기록 없음</Typography>}
        </Paper>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 750, mb: 1 }}>사용자별</Typography>
          {data.by_user.map((row) => <Typography key={row.user_id} variant="body2" sx={{ py: 0.75 }}>{row.user_display_name} · 호출 {row.call_count} · 토큰 {row.total_tokens.toLocaleString()}</Typography>)}
          {!data.by_user.length && <Typography color="text.secondary">기록 없음</Typography>}
        </Paper>
      </Box>
    </Box>
  );
}

export default UsagePage;
