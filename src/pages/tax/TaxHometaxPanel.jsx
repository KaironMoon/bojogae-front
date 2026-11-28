/* eslint-disable react/prop-types */
import { useState } from "react";
import AccountBalanceOutlinedIcon from "@mui/icons-material/AccountBalanceOutlined";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import CreditCardOutlinedIcon from "@mui/icons-material/CreditCardOutlined";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import TerminalOutlinedIcon from "@mui/icons-material/TerminalOutlined";
import {
  Alert,
  Box,
  Button,
  Chip,
  Grid,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";

import { extractTaxError } from "@/services/tax-service";

const JOB_LABELS = {
  HOMETAX_BUSINESS_CARD: "홈택스 사업용 신용카드 매입",
  HOMETAX_PERSONAL_CARD: "홈택스 현금영수증·신용카드 소비내역(프리랜서)",
  HOMETAX_WITHHOLDING: "홈택스 원천징수(지급명세서) 내역",
  HOMETAX_TAX_INVOICE: "홈택스 전자세금계산서 목록",
};

const JOB_STATUS_COLOR = {
  PENDING_AUTH: "warning",
  RUNNING: "info",
  COMPLETED: "success",
  FAILED: "error",
  CANCELLED: "default",
};

const SOURCE_GUIDES = [
  {
    key: "hometax",
    title: "1. 국세청 홈택스",
    path: "조회/발급 > 현금영수증·신용카드 > 소비내역(또는 사업용카드) > 엑셀 내려받기",
    description: "연간·월별 카드/현금영수증 내역을 한 번에 내려받을 수 있습니다.",
    url: "https://www.hometax.go.kr",
    icon: AccountBalanceOutlinedIcon,
    color: "#006E43",
    bg: "#ECFDF5",
  },
  {
    key: "card",
    title: "2. 카드사 앱·웹",
    path: "신한·삼성·현대·KB·롯데·우리·하나·농협 > 세금신고용 이용내역 엑셀/CSV",
    description: "월 1회 카드사 이용내역 파일을 올리면 컬럼을 자동 인식합니다.",
    icon: CreditCardOutlinedIcon,
    color: "#2563EB",
    bg: "#EAF3FF",
  },
  {
    key: "bank",
    title: "3. 은행 인터넷뱅킹",
    path: "주거래 은행 > 거래내역 조회 > 엑셀 저장 (.xlsx / .xls / .csv)",
    description: "입금(수당)·출금(경비) 내역을 자동으로 구분해 장부에 적재합니다.",
    icon: AccountBalanceOutlinedIcon,
    color: "#6B38FB",
    bg: "#F3EEFF",
  },
];

const SUPPORTED_EXT_RE = /\.(xlsx|xls|csv|tsv)$/i;

function AgentFileUploadView({
  apiClient,
  profiles,
  jobs,
  onReload,
  onNotify,
  onGoWithholding,
}) {
  const [profileId, setProfileId] = useState(profiles[0]?.id || "");
  const [uploadDirection, setUploadDirection] = useState("EXPENSE");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);

  const activeProfileId = profileId || profiles[0]?.id || "";
  const fileJobs = jobs.filter((j) => j.job_type === "FILE_IMPORT");

  const appendFiles = (fileList) => {
    const incoming = Array.from(fileList || []).filter((file) => SUPPORTED_EXT_RE.test(file.name));
    if (incoming.length === 0) {
      onNotify("warning", ".xlsx, .xls, .csv, .tsv 형식의 엑셀·CSV 파일만 업로드할 수 있습니다.");
      return;
    }
    setSelectedFiles((prev) => {
      const seen = new Set(prev.map((f) => `${f.name}:${f.size}`));
      const next = [...prev];
      for (const file of incoming) {
        const sig = `${file.name}:${file.size}`;
        if (!seen.has(sig)) {
          seen.add(sig);
          next.push(file);
        }
      }
      return next;
    });
  };

  const handleUploadAll = async () => {
    if (selectedFiles.length === 0) return;
    setBusy(true);
    let totalImported = 0;
    let totalSkipped = 0;
    const failed = [];
    try {
      for (const file of selectedFiles) {
        try {
          const res = await apiClient.importSpreadsheet(file, activeProfileId, uploadDirection);
          totalImported += Number(res.imported_count || 0);
          totalSkipped += Number(res.skipped_duplicate_count || 0);
        } catch (err) {
          failed.push(`${file.name}: ${extractTaxError(err)}`);
        }
      }
      if (failed.length === 0) {
        onNotify(
          "success",
          `${selectedFiles.length}개 파일 업로드 완료 — 신규 ${totalImported}건 적재 (중복 ${totalSkipped}건 자동 제외)`,
        );
        setSelectedFiles([]);
      } else {
        onNotify(
          "warning",
          `신규 ${totalImported}건 적재, 일부 파일 오류: ${failed[0]}`,
        );
      }
      await onReload();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Stack spacing={2.5}>
      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, bgcolor: "#fff" }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ sm: "center" }}
          spacing={1.5}
          mb={2}
        >
          <Box>
            <Typography variant="subtitle1" fontWeight={800}>
              어디서 파일을 받나요? (별도 프로그램 설치 없음)
            </Typography>
            <Typography variant="body2" color="text.secondary">
              홈택스·카드사·은행에서 내려받은 엑셀이나 CSV를 아래에 끌어다 놓으면 중복 없이 자동으로 정리됩니다.
            </Typography>
          </Box>
          {onGoWithholding && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<PictureAsPdfOutlinedIcon />}
              onClick={onGoWithholding}
              sx={{ flexShrink: 0 }}
            >
              원천징수영수증 PDF 올리기
            </Button>
          )}
        </Stack>

        <Grid container spacing={1.5}>
          {SOURCE_GUIDES.map((guide) => {
            const Icon = guide.icon;
            return (
              <Grid item xs={12} md={4} key={guide.key}>
                <Paper
                  variant="outlined"
                  sx={{ p: 2, borderRadius: 2.5, height: "100%", bgcolor: "#F8FAFC" }}
                >
                  <Stack spacing={1} height="100%">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Box
                        sx={{
                          width: 30,
                          height: 30,
                          borderRadius: 1.5,
                          bgcolor: guide.bg,
                          color: guide.color,
                          display: "grid",
                          placeItems: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Icon sx={{ fontSize: 17 }} />
                      </Box>
                      <Typography variant="subtitle2" fontWeight={800}>
                        {guide.title}
                      </Typography>
                    </Stack>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: "#0F172A" }}>
                      {guide.path}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ flexGrow: 1 }}>
                      {guide.description}
                    </Typography>
                    {guide.url && (
                      <Box>
                        <Button
                          size="small"
                          variant="text"
                          endIcon={<OpenInNewRoundedIcon sx={{ fontSize: 14 }} />}
                          href={guide.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{ px: 0, fontWeight: 700, color: "#006E43" }}
                        >
                          홈택스 바로 열기
                        </Button>
                      </Box>
                    )}
                  </Stack>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      </Paper>

      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, bgcolor: "#fff" }}>
        <Stack spacing={2}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                size="small"
                label="적재 대상 사업장"
                value={activeProfileId}
                onChange={(e) => setProfileId(e.target.value)}
              >
                {profiles.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.business_name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                size="small"
                label="기본 거래 구분 (입금/출금 컬럼이 분리된 은행 파일은 자동 판별)"
                value={uploadDirection}
                onChange={(e) => setUploadDirection(e.target.value)}
              >
                <MenuItem value="EXPENSE">지출·카드 이용내역</MenuItem>
                <MenuItem value="INCOME">수입·입금 내역</MenuItem>
              </TextField>
            </Grid>
          </Grid>

          <Box
            component="label"
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              appendFiles(e.dataTransfer?.files);
            }}
            sx={{
              display: "block",
              p: { xs: 3, sm: 4 },
              borderRadius: 3,
              border: "2px dashed",
              borderColor: dragging ? "#03C75A" : "#CBD5E1",
              bgcolor: dragging ? "#ECFDF5" : "#F8FAFC",
              textAlign: "center",
              cursor: "pointer",
              transition: "all 140ms ease",
              "&:hover": { borderColor: "#03C75A", bgcolor: "#F0FDF4" },
            }}
          >
            <input
              hidden
              multiple
              type="file"
              accept=".xlsx,.xls,.csv,.tsv"
              onChange={(e) => {
                appendFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <CloudUploadOutlinedIcon sx={{ fontSize: 38, color: "#03C75A", mb: 1 }} />
            <Typography variant="subtitle1" fontWeight={800} color="#0F172A">
              여기에 엑셀(.xlsx, .xls) 또는 CSV 파일을 끌어다 놓거나 클릭해 선택하세요
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              여러 카드사·은행 파일을 한꺼번에 선택해도 중복 거래는 자동으로 걸러집니다.
            </Typography>
          </Box>

          {selectedFiles.length > 0 && (
            <Stack spacing={1.5}>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {selectedFiles.map((file, idx) => (
                  <Chip
                    key={`${file.name}-${idx}`}
                    label={`${file.name} (${Math.max(1, Math.round(file.size / 1024))} KB)`}
                    onDelete={() =>
                      setSelectedFiles((prev) => prev.filter((_, i) => i !== idx))
                    }
                  />
                ))}
              </Stack>
              <Stack direction="row" spacing={1.5}>
                <Button
                  variant="contained"
                  disabled={busy}
                  onClick={handleUploadAll}
                  sx={{ bgcolor: "#03C75A", "&:hover": { bgcolor: "#008A60" } }}
                >
                  {busy ? "업로드 및 AI 분류 중..." : `${selectedFiles.length}개 파일 장부에 반영하기`}
                </Button>
                <Button
                  variant="text"
                  color="inherit"
                  disabled={busy}
                  onClick={() => setSelectedFiles([])}
                >
                  선택 비우기
                </Button>
              </Stack>
            </Stack>
          )}
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, bgcolor: "#fff" }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
          <Typography variant="subtitle2" fontWeight={800}>
            최근 파일 업로드 내역
          </Typography>
          <Button size="small" startIcon={<RefreshRoundedIcon />} onClick={onReload}>
            새로고침
          </Button>
        </Stack>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>파일명</TableCell>
              <TableCell>사업장</TableCell>
              <TableCell>거래 기간</TableCell>
              <TableCell>상태</TableCell>
              <TableCell align="right">신규 적재 / 중복 제외</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {fileJobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 3, color: "text.secondary" }}>
                  아직 업로드한 엑셀·CSV 파일이 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              fileJobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell sx={{ fontWeight: 700 }}>
                    {job.meta?.filename || `파일 업로드 #${job.id}`}
                  </TableCell>
                  <TableCell>{job.business_name}</TableCell>
                  <TableCell>{`${job.period_start} ~ ${job.period_end}`}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={job.status === "COMPLETED" ? "완료" : job.status}
                      color={JOB_STATUS_COLOR[job.status] || "default"}
                    />
                  </TableCell>
                  <TableCell align="right">
                    {job.imported_count}건 / {job.skipped_duplicate_count}건
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Paper>
    </Stack>
  );
}

export default function TaxHometaxPanel({
  mode = "AGENT",
  apiClient,
  profiles = [],
  jobs = [],
  connectors = [],
  taxYear,
  onReload,
  onNotify,
  onGoWithholding,
}) {
  const [subTab, setSubTab] = useState(0);
  const [profileId, setProfileId] = useState(profiles[0]?.id || "");
  const [jobType, setJobType] = useState("HOMETAX_BUSINESS_CARD");
  const [authMethod, setAuthMethod] = useState("KAKAO");
  const [periodStart, setPeriodStart] = useState(`${taxYear}-01-01`);
  const [periodEnd, setPeriodEnd] = useState(`${taxYear}-12-31`);
  const [createdJob, setCreatedJob] = useState(null);
  const [busy, setBusy] = useState(false);

  const [uploadDirection, setUploadDirection] = useState("EXPENSE");
  const [selectedFile, setSelectedFile] = useState(null);

  const [bankForm, setBankForm] = useState({
    provider_name: "농협",
    account_label: "사업용 입출금계좌",
    masked_identifier: "",
    api_url: "",
    api_key: "",
    bank_code: "011",
    account_number: "",
    birth_date: "",
    account_password: "",
  });

  if (mode === "AGENT") {
    return (
      <AgentFileUploadView
        apiClient={apiClient}
        profiles={profiles}
        jobs={jobs}
        onReload={onReload}
        onNotify={onNotify}
        onGoWithholding={onGoWithholding}
      />
    );
  }

  const activeProfileId = profileId || profiles[0]?.id || "";
  const originUrl = typeof window !== "undefined" ? window.location.origin : "https://bojogae.net";

  const handleCreateHometaxJob = async () => {
    if (!activeProfileId) return;
    setBusy(true);
    try {
      const res = await apiClient.createHometaxJob({
        profile_id: Number(activeProfileId),
        job_type: jobType,
        auth_method: authMethod,
        period_start: periodStart,
        period_end: periodEnd,
      });
      setCreatedJob(res);
      onNotify("success", "홈택스 로컬 에이전트 작업 토큰을 발급했습니다.");
      await onReload();
    } catch (err) {
      onNotify("error", extractTaxError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleDownloadScript = async () => {
    try {
      await apiClient.downloadAgentScript();
      onNotify("success", "오픈소스 홈택스 스크래퍼(bojogae_hometax_agent.py)를 다운로드했습니다.");
    } catch (err) {
      onNotify("error", extractTaxError(err));
    }
  };

  const handleSpreadsheetUpload = async () => {
    if (!selectedFile) return;
    setBusy(true);
    try {
      const res = await apiClient.importSpreadsheet(selectedFile, activeProfileId, uploadDirection);
      onNotify(
        "success",
        `파일 적재 완료: 신규 ${res.imported_count}건 (중복 건너뜀 ${res.skipped_duplicate_count}건)`,
      );
      setSelectedFile(null);
      await onReload();
    } catch (err) {
      onNotify("error", extractTaxError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleCreateBankConnector = async () => {
    if (!activeProfileId || !bankForm.account_label.trim()) return;
    setBusy(true);
    try {
      await apiClient.createConnector({
        profile_id: Number(activeProfileId),
        connector_type: "BANK_FAST_QUERY",
        provider_name: bankForm.provider_name,
        account_label: bankForm.account_label,
        masked_identifier: bankForm.masked_identifier || bankForm.account_number.slice(-4),
        config: {
          api_url: bankForm.api_url,
          api_key: bankForm.api_key,
          bank_code: bankForm.bank_code,
          account_number: bankForm.account_number,
          birth_date: bankForm.birth_date,
          account_password: bankForm.account_password,
        },
      });
      onNotify("success", "빠른계좌조회 커넥터를 등록했습니다 (AES-GCM 암호화 저장).");
      await onReload();
    } catch (err) {
      onNotify("error", extractTaxError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleSyncBank = async (connectorId) => {
    setBusy(true);
    try {
      const res = await apiClient.syncBankConnector(connectorId, {
        period_start: periodStart,
        period_end: periodEnd,
      });
      onNotify("success", `계좌 동기화 완료: 신규 ${res.imported_count}건`);
      await onReload();
    } catch (err) {
      onNotify("error", extractTaxError(err));
    } finally {
      setBusy(false);
    }
  };

  const copyText = (text, label) => {
    navigator.clipboard?.writeText(text);
    onNotify("success", `${label}을(를) 클립보드에 복사했습니다.`);
  };

  const cmdPreview = createdJob
    ? `python bojogae_hometax_agent.py --server ${originUrl} --token ${createdJob.agent_token}`
    : "";

  return (
    <Stack spacing={2.5}>
      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: "hidden", bgcolor: "#fff" }}>
        <Tabs
          value={subTab}
          onChange={(_e, val) => setSubTab(val)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: "1px solid #E2E8F0", px: 1.5 }}
        >
          <Tab icon={<CloudUploadOutlinedIcon fontSize="small" />} iconPosition="start" label="엑셀/CSV 파일 업로드" />
          <Tab icon={<TerminalOutlinedIcon fontSize="small" />} iconPosition="start" label="홈택스 무료 스크래핑 (개발자/고급)" />
          <Tab icon={<AccountBalanceOutlinedIcon fontSize="small" />} iconPosition="start" label="은행 빠른계좌조회 (고급)" />
        </Tabs>

        <Box sx={{ p: { xs: 2, sm: 3 } }}>
          {subTab === 0 && (
            <Stack spacing={2}>
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                홈택스(사업용 신용카드·전자세금계산서), 카드사 이용내역, 서버/AI API 결제 내역 엑셀(<code>.xlsx</code>,{" "}
                <code>.xls</code>) 또는 <code>.csv</code>(UTF-8/CP949)를 올리면 컬럼을 자동 매핑합니다.
              </Alert>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={4}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="적재 대상 사업장"
                    value={activeProfileId}
                    onChange={(e) => setProfileId(e.target.value)}
                  >
                    {profiles.map((p) => (
                      <MenuItem key={p.id} value={p.id}>
                        {p.business_name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="기본 거래 구분"
                    value={uploadDirection}
                    onChange={(e) => setUploadDirection(e.target.value)}
                  >
                    <MenuItem value="EXPENSE">지출·매입 내역 (카드/경비)</MenuItem>
                    <MenuItem value="INCOME">수입·매출 내역 (입금/세금계산서)</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} md={5}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Button variant="outlined" component="label" startIcon={<CloudUploadOutlinedIcon />}>
                      {selectedFile ? selectedFile.name : "엑셀/CSV 파일 선택"}
                      <input
                        hidden
                        type="file"
                        accept=".xlsx,.xls,.csv,.tsv"
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      />
                    </Button>
                    <Button
                      variant="contained"
                      disabled={!selectedFile || busy}
                      onClick={handleSpreadsheetUpload}
                      sx={{ bgcolor: "#03C75A", "&:hover": { bgcolor: "#008A60" } }}
                    >
                      자동 매핑 업로드
                    </Button>
                  </Stack>
                </Grid>
              </Grid>
            </Stack>
          )}

          {subTab === 1 && (
            <Stack spacing={2.5}>
              <Alert severity="success" sx={{ borderRadius: 2 }}>
                <strong>운영사 전용 오픈소스 Playwright 스크래퍼:</strong> 인증서·비밀번호를 서버에 저장하지 않고,
                관리자 PC에서 <code>bojogae_hometax_agent.py</code>를 실행해 홈택스 로그인 후 JSON 응답만 전송합니다.
              </Alert>

              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="대상 사업장"
                    value={activeProfileId}
                    onChange={(e) => setProfileId(e.target.value)}
                  >
                    {profiles.map((p) => (
                      <MenuItem key={p.id} value={p.id}>
                        {p.business_name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="홈택스 수집 메뉴"
                    value={jobType}
                    onChange={(e) => setJobType(e.target.value)}
                  >
                    {Object.entries(JOB_LABELS).map(([k, v]) => (
                      <MenuItem key={k} value={k}>
                        {v}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={6} md={2}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="간편인증 수단"
                    value={authMethod}
                    onChange={(e) => setAuthMethod(e.target.value)}
                  >
                    <MenuItem value="KAKAO">카카오톡</MenuItem>
                    <MenuItem value="NAVER">네이버</MenuItem>
                    <MenuItem value="PASS">PASS</MenuItem>
                    <MenuItem value="TOSS">토스</MenuItem>
                    <MenuItem value="CERT">공동·금융인증서</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Stack direction="row" spacing={1}>
                    <TextField
                      type="date"
                      size="small"
                      label="시작일"
                      value={periodStart}
                      onChange={(e) => setPeriodStart(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                      type="date"
                      size="small"
                      label="종료일"
                      value={periodEnd}
                      onChange={(e) => setPeriodEnd(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Stack>
                </Grid>
              </Grid>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }}>
                <Button
                  variant="contained"
                  startIcon={<PlayArrowRoundedIcon />}
                  disabled={busy || !activeProfileId}
                  onClick={handleCreateHometaxJob}
                  sx={{ bgcolor: "#03C75A", "&:hover": { bgcolor: "#008A60" } }}
                >
                  1. 일회용 스크래핑 토큰 발급
                </Button>
                <Button variant="outlined" startIcon={<DownloadOutlinedIcon />} onClick={handleDownloadScript}>
                  2. 오픈소스 에이전트 (.py) 다운로드
                </Button>
                <Button variant="text" startIcon={<RefreshRoundedIcon />} onClick={onReload}>
                  수집 상태 새로고침
                </Button>
              </Stack>

              {createdJob && (
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: "#0F172A", color: "#E2E8F0" }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: "#86EFAC" }}>
                      발급 완료 (유효시간 30분) · 터미널에서 실행하세요
                    </Typography>
                    <Button
                      size="small"
                      startIcon={<ContentCopyOutlinedIcon fontSize="small" />}
                      sx={{ color: "#fff" }}
                      onClick={() => copyText(cmdPreview, "실행 명령어")}
                    >
                      명령어 복사
                    </Button>
                  </Stack>
                  <Typography component="pre" sx={{ fontSize: 12, m: 0, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                    {`pip install playwright httpx && playwright install chromium\n${cmdPreview}`}
                  </Typography>
                </Paper>
              )}

              <Box>
                <Typography variant="subtitle2" fontWeight={800} mb={1}>
                  최근 홈택스·파일 수집 작업 이력
                </Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>작업 ID</TableCell>
                      <TableCell>수집 유형</TableCell>
                      <TableCell>사업장</TableCell>
                      <TableCell>기간</TableCell>
                      <TableCell>상태</TableCell>
                      <TableCell align="right">신규 / 중복</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {jobs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 3, color: "text.secondary" }}>
                          아직 실행된 수집 작업이 없습니다.
                        </TableCell>
                      </TableRow>
                    ) : (
                      jobs.map((job) => (
                        <TableRow key={job.id}>
                          <TableCell>#{job.id}</TableCell>
                          <TableCell>{JOB_LABELS[job.job_type] || job.job_type}</TableCell>
                          <TableCell>{job.business_name}</TableCell>
                          <TableCell>{`${job.period_start} ~ ${job.period_end}`}</TableCell>
                          <TableCell>
                            <Chip size="small" label={job.status} color={JOB_STATUS_COLOR[job.status] || "default"} />
                          </TableCell>
                          <TableCell align="right">
                            {job.imported_count}건 / {job.skipped_duplicate_count}건
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Box>
            </Stack>
          )}

          {subTab === 2 && (
            <Stack spacing={2.5}>
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                법인/사업자 통장의 <strong>빠른계좌조회(조회전용)</strong>와 무료 계좌조회 API를 연결하면
                입출금 내역을 자동 수집할 수 있습니다. (계좌정보는 AES-GCM 암호화 저장)
              </Alert>

              <Grid container spacing={1.5}>
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    size="small"
                    label="은행명"
                    value={bankForm.provider_name}
                    onChange={(e) => setBankForm((p) => ({ ...p, provider_name: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    size="small"
                    label="계좌 별칭"
                    value={bankForm.account_label}
                    onChange={(e) => setBankForm((p) => ({ ...p, account_label: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="무료 계좌조회 API Endpoint (선택)"
                    placeholder="https://api.bankapi.co.kr/..."
                    value={bankForm.api_url}
                    onChange={(e) => setBankForm((p) => ({ ...p, api_url: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <TextField
                    fullWidth
                    size="small"
                    label="계좌번호"
                    value={bankForm.account_number}
                    onChange={(e) => setBankForm((p) => ({ ...p, account_number: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <TextField
                    fullWidth
                    size="small"
                    label="생년월일(6자리)/사업자번호"
                    value={bankForm.birth_date}
                    onChange={(e) => setBankForm((p) => ({ ...p, birth_date: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <TextField
                    fullWidth
                    size="small"
                    type="password"
                    label="조회 비밀번호"
                    value={bankForm.account_password}
                    onChange={(e) => setBankForm((p) => ({ ...p, account_password: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleCreateBankConnector}
                    disabled={busy}
                    sx={{ height: 40, bgcolor: "#03C75A", "&:hover": { bgcolor: "#008A60" } }}
                  >
                    빠른계좌 등록
                  </Button>
                </Grid>
              </Grid>

              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>은행</TableCell>
                    <TableCell>계좌 별칭</TableCell>
                    <TableCell>식별번호</TableCell>
                    <TableCell>최근 동기화</TableCell>
                    <TableCell align="right">작업</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {connectors.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 3, color: "text.secondary" }}>
                        등록된 빠른계좌조회 커넥터가 없습니다.
                      </TableCell>
                    </TableRow>
                  ) : (
                    connectors.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell>{c.provider_name}</TableCell>
                        <TableCell>{c.account_label}</TableCell>
                        <TableCell>{c.masked_identifier || "-"}</TableCell>
                        <TableCell>{c.last_synced_at ? new Date(c.last_synced_at).toLocaleString("ko-KR") : "미실행"}</TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Button size="small" variant="outlined" onClick={() => handleSyncBank(c.id)} disabled={busy}>
                              동기화
                            </Button>
                            <Button
                              size="small"
                              color="error"
                              onClick={async () => {
                                await apiClient.deleteConnector(c.id);
                                await onReload();
                              }}
                            >
                              삭제
                            </Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Stack>
          )}
        </Box>
      </Paper>
    </Stack>
  );
}
