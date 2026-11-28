/* eslint-disable react/prop-types */
import { useState } from "react";
import AccountBalanceOutlinedIcon from "@mui/icons-material/AccountBalanceOutlined";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SmsOutlinedIcon from "@mui/icons-material/SmsOutlined";
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

export default function TaxHometaxPanel({
  mode = "AGENT",
  apiClient,
  profiles = [],
  jobs = [],
  connectors = [],
  webhookInfo = null,
  taxYear,
  onReload,
  onNotify,
}) {
  const [subTab, setSubTab] = useState(0);
  const [profileId, setProfileId] = useState(profiles[0]?.id || "");
  const [jobType, setJobType] = useState(
    mode === "COMPANY" ? "HOMETAX_BUSINESS_CARD" : "HOMETAX_PERSONAL_CARD",
  );
  const [authMethod, setAuthMethod] = useState("KAKAO");
  const [periodStart, setPeriodStart] = useState(`${taxYear}-01-01`);
  const [periodEnd, setPeriodEnd] = useState(`${taxYear}-12-31`);
  const [createdJob, setCreatedJob] = useState(null);
  const [busy, setBusy] = useState(false);

  const [uploadDirection, setUploadDirection] = useState("EXPENSE");
  const [selectedFile, setSelectedFile] = useState(null);

  const [issuedWebhookToken, setIssuedWebhookToken] = useState("");
  const [smsSample, setSmsSample] = useState(
    "[Web발신] 신한카드 11/28 14:20 48,000원 일시불 GS칼텍스 역삼주유소",
  );

  const [bankForm, setBankForm] = useState({
    provider_name: "농협",
    account_label: "주거래 입출금통장",
    masked_identifier: "",
    api_url: "",
    api_key: "",
    bank_code: "011",
    account_number: "",
    birth_date: "",
    account_password: "",
  });

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

  const handleRotateWebhook = async () => {
    if (!apiClient.rotateWebhookToken) return;
    setBusy(true);
    try {
      const res = await apiClient.rotateWebhookToken(activeProfileId || undefined);
      setIssuedWebhookToken(res.webhook_token);
      onNotify("success", "카드 승인 문자 웹훅 토큰을 새로 발급했습니다.");
      await onReload();
    } catch (err) {
      onNotify("error", extractTaxError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleTestSms = async () => {
    if (!apiClient.testCardSms) return;
    setBusy(true);
    try {
      const res = await apiClient.testCardSms({
        message: smsSample,
        profile_id: activeProfileId ? Number(activeProfileId) : undefined,
      });
      onNotify(
        "success",
        `테스트 파싱 적재 완료: ${res.parsed?.merchant_name} (${res.parsed?.amount?.toLocaleString("ko-KR")}원)`,
      );
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
          <Tab icon={<TerminalOutlinedIcon fontSize="small" />} iconPosition="start" label="홈택스 무료 스크래핑 (오픈소스)" />
          <Tab icon={<CloudUploadOutlinedIcon fontSize="small" />} iconPosition="start" label="카드·홈택스 엑셀/CSV 업로드" />
          {mode === "AGENT" && (
            <Tab icon={<SmsOutlinedIcon fontSize="small" />} iconPosition="start" label="스마트폰 카드 문자 웹훅 (0원)" />
          )}
          <Tab icon={<AccountBalanceOutlinedIcon fontSize="small" />} iconPosition="start" label="은행 빠른계좌조회 연동" />
        </Tabs>

        <Box sx={{ p: { xs: 2, sm: 3 } }}>
          {subTab === 0 && (
            <Stack spacing={2.5}>
              <Alert severity="success" sx={{ borderRadius: 2 }}>
                <strong>상용 스크래핑 API 비용 0원 구조:</strong> 인증서·비밀번호를 서버에 저장하지 않고,
                사용자 PC에서 MIT 오픈소스 Playwright 에이전트(<code>bojogae_hometax_agent.py</code>)를 실행해
                홈택스 간편인증 후 JSON 응답만 안전하게 전송합니다.
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
                <Button
                  variant="outlined"
                  startIcon={<DownloadOutlinedIcon />}
                  onClick={handleDownloadScript}
                >
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

          {subTab === 1 && (
            <Stack spacing={2}>
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                홈택스(사업용 신용카드·현금영수증·전자세금계산서), 카드사 세금신고용 이용내역, 은행 빠른계좌조회
                엑셀(<code>.xlsx</code>, <code>.xls</code>) 또는 <code>.csv</code>(UTF-8/CP949)를 올리면 컬럼을 자동 매핑합니다.
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

          {mode === "AGENT" && subTab === 2 && (
            <Stack spacing={2.5}>
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                안드로이드(문자 자동전달·모드 및 루틴) 또는 아이폰(단축어 자동화)에서 카드 결제 알림이 올 때마다
                아래 웹훅 주소로 POST 전송하면 <strong>비용 0원으로 실시간 자동 기장</strong>됩니다.
              </Alert>

              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: "#F8FAFC" }}>
                <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1.5} alignItems={{ sm: "center" }}>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={800}>
                      웹훅 엔드포인트 &amp; 인증 토큰
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      URL: <code>{`${originUrl}/api/v1/tax/webhook/card-sms`}</code>
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      현재 상태: {webhookInfo?.webhook_enabled ? `활성 (${webhookInfo.webhook_token_prefix}...)` : "미발급"}
                    </Typography>
                  </Box>
                  <Button variant="outlined" onClick={handleRotateWebhook} disabled={busy}>
                    웹훅 토큰 발급/재발급
                  </Button>
                </Stack>
                {issuedWebhookToken && (
                  <Alert
                    severity="warning"
                    sx={{ mt: 1.5 }}
                    action={
                      <Button size="small" onClick={() => copyText(issuedWebhookToken, "웹훅 토큰")}>
                        복사
                      </Button>
                    }
                  >
                    새 토큰 (1회만 표시): <code>{issuedWebhookToken}</code> · 헤더{" "}
                    <code>X-Bojogae-Tax-Token</code>에 넣어주세요.
                  </Alert>
                )}
              </Paper>

              <Stack spacing={1.5}>
                <Typography variant="subtitle2" fontWeight={800}>
                  실시간 문자 파서 테스트
                </Typography>
                <TextField
                  multiline
                  minRows={2}
                  fullWidth
                  size="small"
                  label="카드 승인 문자 샘플"
                  value={smsSample}
                  onChange={(e) => setSmsSample(e.target.value)}
                />
                <Box>
                  <Button variant="contained" onClick={handleTestSms} disabled={busy}>
                    문자 파싱 테스트 및 장부 적재
                  </Button>
                </Box>
              </Stack>
            </Stack>
          )}

          {((mode === "AGENT" && subTab === 3) || (mode === "COMPANY" && subTab === 2)) && (
            <Stack spacing={2.5}>
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                주거래 은행의 <strong>빠른계좌조회(조회전용)</strong>를 켠 뒤 무료 계좌조회 API(예: bankapi.co.kr)를 연결하면
                오픈뱅킹 심사·과금 없이 입출금 내역을 수집할 수 있습니다. (계좌정보는 AES-GCM으로 암호화 저장)
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
