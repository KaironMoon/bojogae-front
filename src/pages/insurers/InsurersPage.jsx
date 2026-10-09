import { useEffect, useState } from "react";
import {
  Accordion, AccordionDetails, AccordionSummary, Alert, Box, Button, Card,
  CardActionArea, CardActions, Chip, CircularProgress, Dialog, DialogContent,
  DialogTitle, Divider, IconButton, Link, Stack, TextField, Typography,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";
import { getInsurers } from "@/services/insurer-service";

const external = { target: "_blank", rel: "noopener noreferrer" };
const kindLabel = (insurer) => insurer.kind === "life" ? "생명보험" : "손해보험";

function logo(insurer, width = 144, height = 64) {
  return insurer.logo && (
    <Box component="svg" viewBox={insurer.logo.view_box} role="img"
      aria-label={`${insurer.name} 로고`} preserveAspectRatio="xMidYMid meet"
      sx={{ width, height, maxWidth: "100%", flexShrink: 0 }}>
      <title>{insurer.name} 로고</title>
      <image href={insurer.logo.path} width={insurer.logo.width} height={insurer.logo.height} />
    </Box>
  );
}

function browserBadges(information) {
  if (!information?.icons?.length) {
    return <Typography variant="caption" color="text.secondary">브라우저 확인 필요</Typography>;
  }
  return (
    <Stack direction="row" justifyContent="center" useFlexGap flexWrap="wrap" gap={0.75}>
      {information.icons.map(icon => (
        <Chip key={icon.name} size="small" variant="outlined" label={icon.name} title={information.value}
          icon={<Box component="img" src={icon.path} alt="" sx={{ width: 18, height: 18, objectFit: "contain" }} />}
          sx={{ height: 24, bgcolor: "background.paper" }} />
      ))}
    </Stack>
  );
}

function information(label, value) {
  return (
    <Box>
      <Typography variant="body2" fontWeight={700} sx={{ mb: 0.5 }}>{label}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-line" }}>
        {value?.value || "미확인"}
      </Typography>
    </Box>
  );
}

function sourcesFor(insurer) {
  const entries = [
    ["홈페이지", insurer.website], ["로고", insurer.logo], ["브라우저", insurer.browser],
    ["고객센터", insurer.customer_service], ["청구 안내", insurer.claim],
  ];
  for (const system of insurer.systems) {
    entries.push([system.link.label, system.link], ["브라우저", system.browser],
      ["프로그램", system.security_program], ["로그인", system.login]);
  }
  // 같은 자료의 출처는 상세 하단에서 한 번만 보여준다.
  const grouped = new Map();
  for (const [label, evidence] of entries) {
    if (!evidence) continue;
    const key = `${evidence.source_url}|${evidence.checked_at}`;
    if (!grouped.has(key)) grouped.set(key, { ...evidence, labels: new Set() });
    grouped.get(key).labels.add(label);
  }
  return [...grouped.values()].map(entry => ({ ...entry, label: [...entry.labels].join(" · ") }));
}

export default function InsurersPage() {
  const [query, setQuery] = useState("");
  const [directory, setDirectory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setLoading(true);
    setError(false);
    const timer = setTimeout(async () => {
      try {
        const result = await getInsurers(query, controller.signal);
        if (active) setDirectory(result);
      } catch {
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    }, query ? 250 : 0);
    return () => { active = false; clearTimeout(timer); controller.abort(); };
  }, [query, retry]);

  const detailLink = (link) => (
    <Button href={link.url} {...external} variant="outlined" size="small"
      endIcon={<OpenInNewOutlinedIcon />} aria-label={`${link.label} (새 창)`}>
      {link.label}
    </Button>
  );

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1440, mx: "auto" }}>
      <Typography variant="h5" component="h1" fontWeight={800}>보험사 정보·링크</Typography>
      <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
        보험사 전산으로 바로 이동하고, 필요한 정보는 카드에서 확인하세요.
      </Typography>
      <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "stretch", sm: "center" }}
        justifyContent="space-between" gap={1.5} sx={{ mb: 2.5 }}>
        <TextField label="보험사명 검색" placeholder="예: 삼성, KB" value={query}
          onChange={event => setQuery(event.target.value)} size="small" fullWidth
          slotProps={{ htmlInput: { maxLength: 100 } }} sx={{ maxWidth: 440 }} />
        {!loading && !error && directory && <Typography role="status" variant="body2" color="text.secondary" sx={{ flexShrink: 0 }}>
          {query.trim() ? `검색 결과 ${directory.total}개` : `전체 ${directory.total}개 보험사`}
        </Typography>}
      </Stack>
      <Box component="section" aria-label="보험사 목록" aria-busy={loading}>
        {loading ? (
          <Stack role="status" direction="row" alignItems="center" spacing={2} sx={{ py: 5 }}>
            <CircularProgress size={24} /><Typography>보험사 정보를 불러오는 중입니다.</Typography>
          </Stack>
        ) : error ? (
          <Alert severity="error" action={<Button color="inherit" onClick={() => setRetry(value => value + 1)}>다시 시도</Button>}>
            보험사 정보를 불러오지 못했습니다.
          </Alert>
        ) : !directory.total ? (
          <Box sx={{ py: 6, textAlign: "center" }}>
            <Typography color="text.secondary">검색 결과가 없습니다. 다른 보험사명을 입력해 주세요.</Typography>
          </Box>
        ) : (
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(3, minmax(0, 1fr))", xl: "repeat(4, minmax(0, 1fr))" }, gap: 2 }}>
            {directory.items.map(insurer => (
              <Card key={insurer.id} variant="outlined" sx={{ borderRadius: 2.5, display: "flex", flexDirection: "column", minWidth: 0 }}>
                <CardActionArea onClick={() => setSelected(insurer)} aria-label={`${insurer.name} 상세 정보`}
                  sx={{ flexGrow: 1, p: 2.5, pb: 2 }}>
                  <Stack alignItems="center" spacing={1.25}>
                    <Chip label={kindLabel(insurer)} size="small" sx={{ height: 21, fontSize: 11, alignSelf: "flex-end", bgcolor: "#f3f5f8", color: "text.secondary" }} />
                    <Box sx={{ height: 64, display: "flex", alignItems: "center", justifyContent: "center" }}>{logo(insurer)}</Box>
                    <Typography component="h2" variant="subtitle1" fontWeight={750} textAlign="center"
                      sx={{ minHeight: 48, display: "flex", alignItems: "center", overflowWrap: "anywhere", lineHeight: 1.4 }}>
                      {insurer.name}
                    </Typography>
                    <Box sx={{ minHeight: 24 }}>{browserBadges(insurer.browser)}</Box>
                  </Stack>
                </CardActionArea>
                <CardActions sx={{ px: 2, pb: 2, pt: 0, gap: 1 }}>
                  <Button fullWidth size="small" variant="contained" disableElevation
                    href={insurer.systems[0]?.link.url} {...(insurer.systems.length ? external : {})}
                    disabled={!insurer.systems.length} endIcon={insurer.systems.length ? <OpenInNewOutlinedIcon /> : null}
                    aria-label={insurer.systems.length ? `${insurer.name} 전산 바로가기 (새 창)` : `${insurer.name} 전산 주소 미확인`}>
                    {insurer.systems.length ? "전산 바로가기" : "전산 미확인"}
                  </Button>
                  <Button size="small" onClick={() => setSelected(insurer)} sx={{ flexShrink: 0, minWidth: 72 }}>상세보기</Button>
                </CardActions>
              </Card>
            ))}
          </Box>
        )}
      </Box>

      <Dialog open={!!selected} onClose={() => setSelected(null)} maxWidth="sm" fullWidth
        aria-labelledby="insurer-detail-title" slotProps={{ paper: { sx: { borderRadius: 3, m: { xs: 2, sm: 4 }, width: { xs: "calc(100% - 32px)", sm: "100%" } } } }}>
        {selected && <>
          <DialogTitle id="insurer-detail-title" sx={{ pr: 7, pb: 1 }}>
            <Typography component="span" variant="h6" fontWeight={750}>{selected.name}</Typography>
            <Chip label={kindLabel(selected)} size="small" sx={{ ml: 1, verticalAlign: "middle" }} />
            <IconButton aria-label="상세 정보 닫기" onClick={() => setSelected(null)} sx={{ position: "absolute", right: 12, top: 12 }}><CloseRoundedIcon /></IconButton>
          </DialogTitle>
          <DialogContent sx={{ px: { xs: 2.5, sm: 3 } }}>
            <Stack spacing={2.5} sx={{ pt: 1 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2}>
                {logo(selected, 128, 56)}
                {browserBadges(selected.browser)}
              </Stack>
              <Stack direction="row" useFlexGap flexWrap="wrap" gap={1}>
                {detailLink(selected.website)}
                {selected.claim && detailLink(selected.claim)}
              </Stack>
              {information("고객센터", selected.customer_service)}
              {!selected.claim && information("보험금 청구 안내", { value: "공식 홈페이지에서 확인해 주세요." })}
              <Divider />
              <Box>
                <Typography component="h3" variant="subtitle1" fontWeight={750} sx={{ mb: 1.5 }}>설계사 업무 시스템</Typography>
                {selected.systems.length ? <Stack spacing={2}>
                  {selected.systems.map(system => (
                    <Box key={system.link.url} sx={{ p: 2, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
                      <Stack spacing={2}>
                        <Box>{detailLink(system.link)}</Box>
                        {information("지원 브라우저", system.browser || selected.browser)}
                        {information("보안·필수 프로그램", system.security_program)}
                        {information("로그인·이용 권한", system.login)}
                      </Stack>
                    </Box>
                  ))}
                </Stack> : <Typography variant="body2" color="text.secondary">업무 시스템 주소·프로그램·이용 권한은 미확인입니다.</Typography>}
              </Box>
              <Typography variant="caption" color="text.secondary">
                브라우저 안내는 보험사 업무 시스템에 대한 정보입니다. 미확인 항목은 보험사 또는 소속 담당자에게 확인해 주세요.
              </Typography>
              <Accordion disableGutters elevation={0} sx={{ borderTop: "1px solid", borderColor: "divider", "&::before": { display: "none" } }}>
                <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />} sx={{ px: 0 }}>
                  <Typography variant="body2" color="text.secondary">자료 출처·확인일</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 0, pb: 1 }}>
                  <Stack spacing={1.5}>
                    {sourcesFor(selected).map(entry => (
                      <Box key={`${entry.source_url}|${entry.checked_at}`}>
                        <Typography variant="caption" sx={{ display: "block", overflowWrap: "anywhere" }}>{entry.label}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          <Link href={entry.source_url} {...external}>출처 확인 (새 창)</Link>{` · ${entry.checked_at}`}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </AccordionDetails>
              </Accordion>
            </Stack>
          </DialogContent>
        </>}
      </Dialog>
    </Box>
  );
}
