import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { getTemplateDemoDefaults, previewTemplateDemo, runTemplateDemo } from "@/services/template-demo-service";


const MAX_PDF_BYTES = 10 * 1024 * 1024;

function errorMessage(error, fallback) {
  const detail = error.response?.data?.detail;
  return (typeof detail === "object" ? detail?.message : null) || fallback;
}

function copyText(value) {
  return navigator.clipboard.writeText(value);
}

function ConfigEditor({ title, description, value, onChange, rows = 10 }) { // eslint-disable-line react/prop-types
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await copyText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };

  return (
    <Accordion disableGutters variant="outlined" sx={{ borderRadius: "12px !important", overflow: "hidden" }}>
      <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
        <Box sx={{ flex: 1 }}>
          <Typography fontWeight={800}>{title}</Typography>
          <Typography variant="caption" color="text.secondary">{description}</Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={1}>
          <TextField
            value={value}
            onChange={(event) => onChange(event.target.value)}
            multiline
            minRows={rows}
            maxRows={24}
            fullWidth
            inputProps={{ spellCheck: false }}
            sx={{ "& textarea": { fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 12.5 } }}
          />
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button size="small" startIcon={<ContentCopyRoundedIcon />} onClick={copy}>
              {copied ? "복사됨" : "복사"}
            </Button>
          </Box>
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}

function Step({ number, title, active, complete }) { // eslint-disable-line react/prop-types
  return (
    <Paper variant="outlined" sx={{ p: 1.5, borderColor: active ? "primary.main" : complete ? "success.light" : "divider", bgcolor: active ? "#eff6ff" : "#fff" }}>
      <Stack direction="row" spacing={1} alignItems="center">
        <Chip size="small" color={complete ? "success" : active ? "primary" : "default"} label={number} />
        <Typography variant="body2" fontWeight={750}>{title}</Typography>
      </Stack>
    </Paper>
  );
}

function TemplateDemoPage() {
  const [config, setConfig] = useState({ prompt: "", shellHtml: "", contentTemplate: "", jsonSchema: "", sampleData: "" });
  const [pdf, setPdf] = useState(null);
  const [loadingDefaults, setLoadingDefaults] = useState(true);
  const [working, setWorking] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);

  const loadDefaults = useCallback(async () => {
    setLoadingDefaults(true);
    setError("");
    try {
      const defaults = await getTemplateDemoDefaults();
      setConfig({
        prompt: defaults.prompt,
        shellHtml: defaults.shell_html,
        contentTemplate: defaults.content_template,
        jsonSchema: defaults.json_schema,
        sampleData: defaults.sample_data,
      });
    } catch (requestError) {
      setError(errorMessage(requestError, "데모 초기값을 불러오지 못했습니다."));
    } finally {
      setLoadingDefaults(false);
    }
  }, []);

  useEffect(() => { loadDefaults(); }, [loadDefaults]);

  const choosePdf = useCallback((files) => {
    const selected = Array.from(files || [])[0];
    setResult(null);
    if (!selected) return;
    if (!selected.name.toLowerCase().endsWith(".pdf") || selected.size > MAX_PDF_BYTES) {
      setPdf(null);
      setError("10MB 이하의 PDF 파일 한 개를 선택해 주세요.");
      return;
    }
    setError("");
    setPdf(selected);
  }, []);

  const run = async () => {
    if (!pdf) {
      setError("분석할 PDF를 선택해 주세요.");
      return;
    }
    try {
      JSON.parse(config.jsonSchema);
    } catch {
      setError("JSON 스키마 문법을 확인해 주세요.");
      return;
    }
    setWorking(true);
    setError("");
    setResult(null);
    try {
      setResult(await runTemplateDemo({
        pdf,
        prompt: config.prompt,
        shellHtml: config.shellHtml,
        contentTemplate: config.contentTemplate,
        jsonSchema: config.jsonSchema,
      }));
    } catch (requestError) {
      setError(errorMessage(requestError, "PDF 분석 또는 HTML 조합에 실패했습니다."));
    } finally {
      setWorking(false);
    }
  };

  const previewSample = async () => {
    try {
      JSON.parse(config.sampleData);
    } catch {
      setError("샘플 JSON 문법을 확인해 주세요.");
      return;
    }
    setWorking(true);
    setError("");
    setResult(null);
    try {
      setResult(await previewTemplateDemo({
        shellHtml: config.shellHtml,
        contentTemplate: config.contentTemplate,
        sampleData: config.sampleData,
      }));
    } catch (requestError) {
      setError(errorMessage(requestError, "샘플 JSON과 HTML 템플릿 조합에 실패했습니다."));
    } finally {
      setWorking(false);
    }
  };

  const responseJson = useMemo(() => result ? JSON.stringify({
    render_mode: result.render_mode,
    template_decision: result.template_decision,
    data: result.data,
    partial_html_modules: result.partial_html_modules,
    partial_html: result.partial_html,
  }, null, 2) : "", [result]);

  const resultStats = useMemo(() => {
    const groups = result?.data?.coverage_groups || [];
    return {
      groups: groups.length,
      coverages: groups.reduce((count, group) => count + (group.items?.length || 0), 0),
      evidence: result?.data?.evidence?.length || 0,
    };
  }, [result]);

  const openHtml = () => {
    const url = URL.createObjectURL(new Blob([result.output_html], { type: "text/html;charset=utf-8" }));
    window.open(url, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(url), 60000);
  };

  const downloadHtml = () => {
    const url = URL.createObjectURL(new Blob([result.output_html], { type: "text/html;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${pdf?.name.replace(/\.pdf$/i, "") || "template-demo"}.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1500, mx: "auto" }}>
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={850}>PDF → HTML 테크 데모</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            Gemini는 보험사 공통 JSON v2를 항상 추출하고, HTML 부분 템플릿과 껍데기 조합 및 금액 계산은 서버가 처리합니다.
          </Typography>
        </Box>
        <Button startIcon={<RestartAltRoundedIcon />} onClick={loadDefaults} disabled={working || loadingDefaults}>
          초기값 복원
        </Button>
      </Stack>

      {error && <Alert severity="error" onClose={() => setError("")} sx={{ mb: 2 }}>{error}</Alert>}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(4, 1fr)" }, gap: 1, mb: 3 }}>
        <Step number="1" title="PDF 입력" complete={Boolean(pdf)} />
        <Step number="2" title="JSON 추출" active={working} complete={Boolean(result)} />
        <Step number="3" title="서버 조합" active={working} complete={Boolean(result)} />
        <Step number="4" title="HTML 확인" active={Boolean(result)} complete={Boolean(result)} />
      </Box>

      {loadingDefaults ? (
        <Paper variant="outlined" sx={{ minHeight: 300, display: "grid", placeItems: "center" }}><CircularProgress /></Paper>
      ) : (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "minmax(380px, 0.85fr) minmax(0, 1.5fr)" }, gap: 3 }}>
          <Stack spacing={2}>
            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
              <Typography fontWeight={800} sx={{ mb: 1.5 }}>1. PDF 입력</Typography>
              <Box
                role="button"
                tabIndex={0}
                onClick={() => !working && fileInputRef.current?.click()}
                onKeyDown={(event) => { if (["Enter", " "].includes(event.key)) fileInputRef.current?.click(); }}
                onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(event) => { event.preventDefault(); setDragging(false); choosePdf(event.dataTransfer.files); }}
                sx={{ p: 3, textAlign: "center", border: "2px dashed", borderColor: dragging ? "primary.main" : pdf ? "success.main" : "divider", borderRadius: 2.5, cursor: "pointer", bgcolor: dragging ? "#eff6ff" : "background.default" }}
              >
                <input ref={fileInputRef} hidden type="file" accept="application/pdf,.pdf" onChange={(event) => { choosePdf(event.target.files); event.target.value = ""; }} />
                <CloudUploadRoundedIcon color={pdf ? "success" : "action"} sx={{ fontSize: 42 }} />
                <Typography fontWeight={800}>{pdf ? pdf.name : "PDF를 드래그하거나 클릭하세요"}</Typography>
                <Typography variant="caption" color="text.secondary">PDF 1개 · 최대 10MB</Typography>
              </Box>
              <Button fullWidth variant="contained" size="large" startIcon={working ? <CircularProgress color="inherit" size={18} /> : <PlayArrowRoundedIcon />} disabled={working || !pdf} onClick={run} sx={{ mt: 2 }}>
                {working ? "Gemini 분석 및 서버 조합 중..." : "데모 실행"}
              </Button>
              <Button fullWidth variant="outlined" size="large" disabled={working} onClick={previewSample} sx={{ mt: 1 }}>
                샘플 JSON으로 조합 · Gemini 비용 0원
              </Button>
            </Paper>

            <Typography fontWeight={850}>선수 가공 입력값</Typography>
            <ConfigEditor title="HTML이 제거된 추출 프롬프트" description="원본 프롬프트의 HTML 샘플과 출력 앵커를 제거한 지시문입니다." value={config.prompt} onChange={(value) => setConfig((current) => ({ ...current, prompt: value }))} rows={12} />
            <ConfigEditor title="JSON Schema" description="Gemini의 구조화 출력과 서버 검증에 사용합니다." value={config.jsonSchema} onChange={(value) => setConfig((current) => ({ ...current, jsonSchema: value }))} rows={14} />
            <ConfigEditor title="샘플 JSON 데이터 v2" description="PDF와 Gemini 호출 없이 서버 조합을 검증하는 복사 가능한 데이터 세트입니다." value={config.sampleData} onChange={(value) => setConfig((current) => ({ ...current, sampleData: value }))} rows={14} />
            <ConfigEditor title="HTML 부분 템플릿" description="추출 JSON을 서버에서 Jinja 문법으로 바인딩합니다." value={config.contentTemplate} onChange={(value) => setConfig((current) => ({ ...current, contentTemplate: value }))} rows={14} />
            <ConfigEditor title="HTML 껍데기" description="제공한 템플릿 v7의 #reportContent 내부에 부분 HTML을 주입합니다." value={config.shellHtml} onChange={(value) => setConfig((current) => ({ ...current, shellHtml: value }))} rows={14} />
          </Stack>

          <Stack spacing={2}>
            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
              <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={1}>
                <Box>
                  <Typography fontWeight={850}>2. Gemini 응답</Typography>
                  <Typography variant="body2" color="text.secondary">JSON 데이터와 필요한 경우의 부분 HTML을 구분해 표시합니다.</Typography>
                </Box>
                {result && (
                  <Chip
                    color={result.render_mode === "template" ? "success" : result.render_mode === "hybrid" ? "info" : "warning"}
                    label={result.render_mode === "template" ? "기존 템플릿" : result.render_mode === "hybrid" ? "템플릿 + 부분 HTML" : "부분 HTML"}
                  />
                )}
              </Stack>
              {result ? (
                <>
                  <Alert severity="info" sx={{ my: 2 }}>
                    {result.template_decision?.reason || result.decision_reason}
                  </Alert>
                  <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mb: 2 }}>
                    <Chip size="small" label={`스키마 ${result.data?.schema_version || "-"}`} />
                    <Chip size="small" label={`담보 그룹 ${resultStats.groups}`} />
                    <Chip size="small" label={`담보 ${resultStats.coverages}`} />
                    <Chip size="small" label={`근거 ${resultStats.evidence}`} />
                    {result.partial_html_modules?.length > 0 && (
                      <Chip size="small" color="info" label={`신규 HTML: ${result.partial_html_modules.join(", ")}`} />
                    )}
                    {result.template_decision?.missing_required_modules?.length > 0 && (
                      <Chip
                        size="small"
                        color="warning"
                        label={`누락: ${result.template_decision.missing_required_modules.join(", ")}`}
                      />
                    )}
                  </Stack>
                  <TextField value={responseJson} multiline minRows={13} maxRows={24} fullWidth InputProps={{ readOnly: true }} sx={{ "& textarea": { fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 12.5 } }} />
                </>
              ) : (
                <Box sx={{ minHeight: 300, display: "grid", placeItems: "center", color: "text.secondary" }}><Typography>실행 후 구조화 응답이 표시됩니다.</Typography></Box>
              )}
            </Paper>

            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
              <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={1} sx={{ mb: 2 }}>
                <Box>
                  <Typography fontWeight={850}>3. 서버 조합 결과</Typography>
                  <Typography variant="body2" color="text.secondary">껍데기와 부분 템플릿을 조합한 최종 HTML입니다.</Typography>
                </Box>
                {result && (
                  <Stack direction="row" spacing={1}>
                    <Button size="small" startIcon={<OpenInNewRoundedIcon />} onClick={openHtml}>새 창</Button>
                    <Button size="small" variant="contained" startIcon={<DownloadRoundedIcon />} onClick={downloadHtml}>다운로드</Button>
                  </Stack>
                )}
              </Stack>
              <Box sx={{ minHeight: 620, border: "1px solid", borderColor: "divider", borderRadius: 2, overflow: "hidden", bgcolor: "#f8fafc" }}>
                {result ? (
                  <Box component="iframe" title="완성 HTML 미리보기" srcDoc={result.output_html} sandbox="allow-scripts allow-downloads" sx={{ width: "100%", height: 760, border: 0, display: "block" }} />
                ) : (
                  <Box sx={{ height: 620, display: "grid", placeItems: "center", color: "text.secondary" }}><Typography>완성 HTML 미리보기</Typography></Box>
                )}
              </Box>
            </Paper>
          </Stack>
        </Box>
      )}
    </Box>
  );
}

export default TemplateDemoPage;
