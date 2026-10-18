import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Accordion, AccordionDetails, AccordionSummary, Alert, Box, Button, CircularProgress, InputAdornment,
  Paper, Stack, TextField, Typography,
} from "@mui/material";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { faqError, listFaqs } from "@/services/faq-service";

export default function FaqPage() {
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [data, setData] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true); setError("");
    const timer = setTimeout(() => {
      listFaqs(query).then((result) => { if (active) setData(result); })
        .catch((err) => { if (active) setError(faqError(err)); })
        .finally(() => { if (active) setLoading(false); });
    }, 200);
    return () => { active = false; clearTimeout(timer); };
  }, [query, reload]);

  return (
    <Box component="main" sx={{ maxWidth: 1000, mx: "auto", p: { xs: 2, md: 4 } }}>
      <Typography variant="overline" color="text.secondary">도움말 센터</Typography>
      <Typography component="h1" variant="h4" fontWeight={800}>FAQ · 자주 묻는 질문</Typography>
      <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>보조개 이용 중 궁금한 내용을 찾아보세요.</Typography>

      <TextField fullWidth label="궁금한 내용을 검색해 보세요" placeholder="보고서, 꼬막, 결제 등" value={query}
        onChange={(event) => { setQuery(event.target.value); setExpanded(false); }}
        InputProps={{ startAdornment: <InputAdornment position="start"><SearchRoundedIcon /></InputAdornment> }}
        inputProps={{ maxLength: 200, type: "search" }} />
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ minHeight: 54 }}>
        <Typography role="status" aria-live="polite" variant="body2" color="text.secondary">
          {loading ? "불러오는 중…" : error ? "" : query.trim() ? `검색 결과 ${data.total}개` : `전체 ${data.total}개`}
        </Typography>
        {query && <Button size="small" onClick={() => { setQuery(""); setExpanded(false); }}>검색 초기화</Button>}
      </Stack>

      {error && <Alert severity="info" action={<Button color="inherit" onClick={() => setReload((value) => value + 1)}>다시 시도</Button>}>{error}</Alert>}
      {loading ? <Box sx={{ py: 6, textAlign: "center" }}><CircularProgress aria-label="FAQ 불러오는 중" /></Box> : !error && <Stack spacing={1.25}>
        {data.items.map((item) => (
          <Accordion key={item.id} disableGutters expanded={expanded === item.id}
            onChange={(_, open) => setExpanded(open ? item.id : false)} elevation={0}
            sx={{ border: "1px solid", borderColor: "divider", borderRadius: "12px !important", "&::before": { display: "none" } }}>
            <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />} id={`faq-${item.id}-heading`} aria-controls={`faq-${item.id}-answer`} sx={{ minHeight: 68, px: { xs: 2, sm: 3 } }}>
              <Typography component="span" fontWeight={750} sx={{ pr: 1, overflowWrap: "anywhere" }}>{item.question}</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ px: { xs: 2, sm: 3 }, pb: 3 }}>
              <Typography color="text.secondary" sx={{ lineHeight: 1.8, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{item.answer}</Typography>
            </AccordionDetails>
          </Accordion>
        ))}
        {!data.items.length && <Paper variant="outlined" sx={{ textAlign: "center", p: { xs: 3, sm: 5 }, borderRadius: 3 }}>
          <Typography fontWeight={750}>{query.trim() ? "검색 결과가 없습니다." : "등록된 FAQ가 없습니다."}</Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>다른 검색어로 찾아보거나 1:1 문의를 이용해 주세요.</Typography>
        </Paper>}
      </Stack>}

      <Paper variant="outlined" sx={{ mt: 4, p: { xs: 2.5, sm: 3 }, borderRadius: 3 }}>
        <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "stretch", sm: "center" }} justifyContent="space-between" spacing={2}>
          <Box><Typography fontWeight={800}>찾는 답변이 없으신가요?</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: .5 }}>카카오톡 채널로 문의해 주세요.</Typography></Box>
          <Button component={Link} to="/help/contact" variant="contained" sx={{ flexShrink: 0 }}>1:1 문의하기</Button>
        </Stack>
      </Paper>
    </Box>
  );
}
