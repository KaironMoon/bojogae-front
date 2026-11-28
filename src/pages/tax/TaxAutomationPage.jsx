import { useCallback, useEffect, useState } from "react";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import AddBusinessOutlinedIcon from "@mui/icons-material/AddBusinessOutlined";
import CalculateOutlinedIcon from "@mui/icons-material/CalculateOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import PendingActionsOutlinedIcon from "@mui/icons-material/PendingActionsOutlined";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid,
  MenuItem,
  Paper,
  Snackbar,
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

import {
  AdminPageContainer,
  AdminPageHeader,
  AdminStatCard,
  AdminStatGrid,
  AdminTableCard,
} from "@/pages/admin/components/AdminPageShell";
import { agentTaxApi, extractTaxError, formatKrw } from "@/services/tax-service";
import TaxDisclaimerBanner from "./TaxDisclaimerBanner";
import TaxHometaxPanel from "./TaxHometaxPanel";
import TaxLedgerReviewPanel from "./TaxLedgerReviewPanel";

export default function TaxAutomationPage() {
  const currentYear = new Date().getFullYear();
  const [taxYear, setTaxYear] = useState(currentYear);
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [overview, setOverview] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [withholdings, setWithholdings] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [connectors, setConnectors] = useState([]);
  const [partnerExports, setPartnerExports] = useState([]);
  const [toast, setToast] = useState({ open: false, severity: "info", message: "" });

  const [newProfile, setNewProfile] = useState({
    business_name: "",
    industry_code: "620100",
    tax_regime: "GENERAL_VAT",
    prev_year_revenue: "0",
    business_reg_no: "",
  });

  const [whFile, setWhFile] = useState(null);
  const [whPdfPassword, setWhPdfPassword] = useState("");
  const [manualWh, setManualWh] = useState({
    tax_year: currentYear - 1,
    payer_name: "",
    payer_biz_no: "",
    gross_amount: "",
    income_tax: "",
    local_income_tax: "",
  });

  const [partnerForm, setPartnerForm] = useState({
    partner_name: "보조개 제휴 세무법인",
    partner_email: "",
    period_label: "연간 전체",
    memo: "",
  });

  const notify = useCallback((severity, message) => {
    setToast({ open: true, severity, message });
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [ov, txs, whs, jbs, conns, exps] = await Promise.all([
        agentTaxApi.getOverview({ tax_year: taxYear }),
        agentTaxApi.listTransactions({ tax_year: taxYear, limit: 500 }),
        agentTaxApi.listWithholding({ tax_year: taxYear }),
        agentTaxApi.listHometaxJobs(),
        agentTaxApi.listConnectors(),
        agentTaxApi.listPartnerExports(),
      ]);
      setOverview(ov);
      setTransactions(txs);
      setWithholdings(whs);
      setJobs(jbs);
      setConnectors(conns);
      setPartnerExports(exps);
    } catch (err) {
      notify("error", extractTaxError(err));
    } finally {
      setLoading(false);
    }
  }, [taxYear, notify]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleUpdatePrevRevenue = async (profile, rawRevenue) => {
    try {
      await agentTaxApi.updateProfile(profile.id, {
        prev_year_revenue: Math.max(0, Number(rawRevenue || 0)),
      });
      notify("success", "직전 연도 수입금액을 반영하여 장부 의무 유형을 다시 판별했습니다.");
      await loadAll();
    } catch (err) {
      notify("error", extractTaxError(err));
    }
  };

  const handleCreateProfile = async () => {
    if (!newProfile.business_name.trim()) return;
    setBusy(true);
    try {
      await agentTaxApi.createProfile({
        ...newProfile,
        prev_year_revenue: Number(newProfile.prev_year_revenue || 0),
      });
      setNewProfile({
        business_name: "",
        industry_code: "620100",
        tax_regime: "GENERAL_VAT",
        prev_year_revenue: "0",
        business_reg_no: "",
      });
      notify("success", "추가 사업장을 등록했습니다.");
      await loadAll();
    } catch (err) {
      notify("error", extractTaxError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleUploadWithholdingPdf = async () => {
    if (!whFile) return;
    setBusy(true);
    try {
      const res = await agentTaxApi.uploadWithholdingPdf(
        whFile,
        overview?.profiles?.[0]?.id,
        whPdfPassword,
      );
      setWhFile(null);
      setWhPdfPassword("");
      notify("success", `${res.payer_name} 원천징수영수증 PDF를 자동 파싱했습니다.`);
      await loadAll();
    } catch (err) {
      notify("error", extractTaxError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleCreateManualWh = async () => {
    if (!manualWh.payer_name.trim() || !manualWh.gross_amount) return;
    const gross = Number(manualWh.gross_amount);
    const inc = manualWh.income_tax ? Number(manualWh.income_tax) : Math.round(gross * 0.03);
    const loc = manualWh.local_income_tax ? Number(manualWh.local_income_tax) : Math.round(inc * 0.1);
    setBusy(true);
    try {
      await agentTaxApi.createWithholding({
        profile_id: overview?.profiles?.[0]?.id,
        tax_year: Number(manualWh.tax_year),
        payer_name: manualWh.payer_name,
        payer_biz_no: manualWh.payer_biz_no || null,
        gross_amount: gross,
        income_tax: inc,
        local_income_tax: loc,
      });
      setManualWh((p) => ({ ...p, payer_name: "", payer_biz_no: "", gross_amount: "", income_tax: "", local_income_tax: "" }));
      notify("success", "원천징수영수증을 추가했습니다.");
      await loadAll();
    } catch (err) {
      notify("error", extractTaxError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleSendPartner = async () => {
    if (!partnerForm.partner_email.trim()) return;
    setBusy(true);
    try {
      await agentTaxApi.createPartnerExport({
        tax_year: taxYear,
        ...partnerForm,
      });
      notify("success", "제휴 세무사 전달 패키지를 생성·기록했습니다.");
      await loadAll();
    } catch (err) {
      notify("error", extractTaxError(err));
    } finally {
      setBusy(false);
    }
  };

  if (loading && !overview) {
    return (
      <AdminPageContainer>
        <Box sx={{ py: 10, display: "grid", placeItems: "center" }}>
          <CircularProgress />
        </Box>
      </AdminPageContainer>
    );
  }

  const totals = overview?.totals || {};
  const isDoubleEntry = overview?.bookkeeping_type === "DOUBLE_ENTRY";

  return (
    <AdminPageContainer>
      <AdminPageHeader
        icon={CalculateOutlinedIcon}
        badge={overview?.bookkeeping_label || "간편장부 대상자"}
        title="설계사 세무자동화"
        description="홈택스 무료 스크래핑(0원)·카드 문자 웹훅·엑셀 자동 매핑으로 월 자동 기장하고 가사/업무 경비를 빠르게 분리하세요."
        actions={
          <Stack direction="row" spacing={1} alignItems="center">
            <TextField
              select
              size="small"
              label="귀속 연도"
              value={taxYear}
              onChange={(e) => setTaxYear(Number(e.target.value))}
              sx={{ width: 120 }}
            >
              {[currentYear, currentYear - 1, currentYear - 2].map((y) => (
                <MenuItem key={y} value={y}>
                  {y}년
                </MenuItem>
              ))}
            </TextField>
            <Button
              variant="outlined"
              startIcon={<DownloadOutlinedIcon />}
              onClick={() => agentTaxApi.downloadLedgerXlsx(taxYear)}
            >
              간편장부 엑셀
            </Button>
          </Stack>
        }
      />

      <Alert severity={isDoubleEntry ? "warning" : "success"} sx={{ mb: 2.5, borderRadius: 2.5 }}>
        <strong>장부 의무 자동 판별:</strong>{" "}
        {isDoubleEntry
          ? "직전 연도 수입금액 7,500만 원 이상으로 '복식부기 의무자'에 해당합니다. 제휴 세무사 원클릭 전달을 권장합니다."
          : "직전 연도 수입금액 7,500만 원 미만으로 '간편장부 대상자'입니다. 아래 장부를 정리해 홈택스 신고 시 참고할 수 있습니다."}
      </Alert>

      <AdminStatGrid>
        <AdminStatCard
          label="총수입 (사업·수당)"
          value={formatKrw(totals.total_income)}
          subtext="다중 사업체 합산"
          icon={TrendingUpRoundedIcon}
          color="#03C75A"
          bg="#ECFDF5"
        />
        <AdminStatCard
          label="업무 확정 필요경비"
          value={formatKrw(totals.confirmed_expense)}
          subtext={`가사 제외: ${formatKrw(totals.excluded_expense)}`}
          icon={FactCheckOutlinedIcon}
          color="#2563EB"
          bg="#EAF3FF"
        />
        <AdminStatCard
          label="3.3% 기납부 원천세"
          value={formatKrw(totals.withheld_total)}
          subtext={`영수증 지급총액: ${formatKrw(totals.withheld_gross)}`}
          icon={AccountBalanceWalletOutlinedIcon}
          color="#6B38FB"
          bg="#F3EEFF"
        />
        <AdminStatCard
          label="월말 미검토 거래"
          value={`${totals.pending_count || 0}건`}
          subtext="업무 확정 / 개인 제외 필요"
          icon={PendingActionsOutlinedIcon}
          color="#B42347"
          bg="#FFF0F2"
          onClick={() => setTab(0)}
        />
      </AdminStatGrid>

      <Paper variant="outlined" sx={{ borderRadius: 3, mb: 2.5, bgcolor: "#fff" }}>
        <Tabs value={tab} onChange={(_e, v) => setTab(v)} variant="scrollable" scrollButtons="auto">
          <Tab label="1. 자동 기장 & 가사·업무 분리" />
          <Tab label="2. 무료 데이터 수집 (홈택스·카드·계좌)" />
          <Tab label="3. 원천징수영수증 (3.3% 대조)" />
          <Tab label="4. 다중 사업체 & 종소세 합산" />
          <Tab label="5. 홈택스 문서 & 세무사 전달" />
        </Tabs>
      </Paper>

      {tab === 0 && (
        <TaxLedgerReviewPanel
          mode="AGENT"
          apiClient={agentTaxApi}
          profiles={overview?.profiles || []}
          transactions={transactions}
          categories={overview?.categories}
          onReload={loadAll}
          onNotify={notify}
        />
      )}

      {tab === 1 && (
        <TaxHometaxPanel
          mode="AGENT"
          apiClient={agentTaxApi}
          profiles={overview?.profiles || []}
          jobs={jobs}
          connectors={connectors}
          webhookInfo={overview?.primary_webhook}
          taxYear={taxYear}
          onReload={loadAll}
          onNotify={notify}
        />
      )}

      {tab === 2 && (
        <Stack spacing={2.5}>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, bgcolor: "#fff" }}>
            <Typography variant="subtitle1" fontWeight={800} mb={1}>
              보험사 3.3% 사업소득 원천징수영수증 PDF 자동 파싱
            </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={5}>
                <Button variant="outlined" component="label" fullWidth startIcon={<PictureAsPdfOutlinedIcon />}>
                  {whFile ? whFile.name : "원천징수영수증 PDF 선택"}
                  <input hidden type="file" accept=".pdf" onChange={(e) => setWhFile(e.target.files?.[0] || null)} />
                </Button>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  size="small"
                  type="password"
                  label="PDF 비밀번호 (생년월일 등, 없으면 공란)"
                  value={whPdfPassword}
                  onChange={(e) => setWhPdfPassword(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <Button
                  fullWidth
                  variant="contained"
                  disabled={!whFile || busy}
                  onClick={handleUploadWithholdingPdf}
                  sx={{ bgcolor: "#03C75A", "&:hover": { bgcolor: "#008A60" } }}
                >
                  PDF 추출 및 대조
                </Button>
              </Grid>
            </Grid>

            <Typography variant="subtitle2" fontWeight={750} mt={3} mb={1}>
              또는 직접 입력
            </Typography>
            <Grid container spacing={1.5}>
              <Grid item xs={6} sm={2}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="귀속연도"
                  value={manualWh.tax_year}
                  onChange={(e) => setManualWh((p) => ({ ...p, tax_year: e.target.value }))}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="지급처(보험사/GA)"
                  value={manualWh.payer_name}
                  onChange={(e) => setManualWh((p) => ({ ...p, payer_name: e.target.value }))}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="지급총액 (세전)"
                  value={manualWh.gross_amount}
                  onChange={(e) => setManualWh((p) => ({ ...p, gross_amount: e.target.value }))}
                />
              </Grid>
              <Grid item xs={6} sm={2}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="소득세 (미입력 시 3%)"
                  value={manualWh.income_tax}
                  onChange={(e) => setManualWh((p) => ({ ...p, income_tax: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} sm={2}>
                <Button fullWidth variant="outlined" onClick={handleCreateManualWh} disabled={busy} sx={{ height: 40 }}>
                  추가
                </Button>
              </Grid>
            </Grid>
          </Paper>

          <AdminTableCard>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>연도</TableCell>
                  <TableCell>지급처(보험사)</TableCell>
                  <TableCell>업종코드</TableCell>
                  <TableCell align="right">지급총액</TableCell>
                  <TableCell align="right">소득세(3%)</TableCell>
                  <TableCell align="right">지방소득세(0.3%)</TableCell>
                  <TableCell align="right">기납부세액 계</TableCell>
                  <TableCell align="right">관리</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {withholdings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4, color: "text.secondary" }}>
                      등록된 원천징수영수증이 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  withholdings.map((wh) => (
                    <TableRow key={wh.id}>
                      <TableCell>{wh.tax_year}</TableCell>
                      <TableCell>{wh.payer_name}</TableCell>
                      <TableCell>{wh.income_type_code}</TableCell>
                      <TableCell align="right">{formatKrw(wh.gross_amount)}</TableCell>
                      <TableCell align="right">{formatKrw(wh.income_tax)}</TableCell>
                      <TableCell align="right">{formatKrw(wh.local_income_tax)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>{formatKrw(wh.total_withheld)}</TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          color="error"
                          onClick={async () => {
                            await agentTaxApi.deleteWithholding(wh.id);
                            await loadAll();
                          }}
                        >
                          삭제
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </AdminTableCard>
        </Stack>
      )}

      {tab === 3 && (
        <Stack spacing={2.5}>
          <AdminTableCard>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>사업장명</TableCell>
                  <TableCell>업종코드 / 과세유형</TableCell>
                  <TableCell>직전연도 수입 (7,500만 원 기준)</TableCell>
                  <TableCell>장부의무</TableCell>
                  <TableCell align="right">총수입</TableCell>
                  <TableCell align="right">필요경비</TableCell>
                  <TableCell align="right">추정 소득금액</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(overview?.multi_business_summary || []).map((row) => {
                  const prof = overview?.profiles?.find((p) => p.id === row.profile_id);
                  return (
                    <TableRow key={row.profile_id}>
                      <TableCell sx={{ fontWeight: 700 }}>{row.business_name}</TableCell>
                      <TableCell>{`${row.industry_code} · ${row.tax_regime_label}`}</TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          defaultValue={prof?.prev_year_revenue || 0}
                          onBlur={(e) => {
                            if (prof && Number(e.target.value) !== Number(prof.prev_year_revenue)) {
                              handleUpdatePrevRevenue(prof, e.target.value);
                            }
                          }}
                          sx={{ width: 150 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={row.bookkeeping_type === "DOUBLE_ENTRY" ? "복식부기" : "간편장부"}
                          color={row.bookkeeping_type === "DOUBLE_ENTRY" ? "warning" : "success"}
                        />
                      </TableCell>
                      <TableCell align="right">{formatKrw(row.total_income)}</TableCell>
                      <TableCell align="right">{formatKrw(row.confirmed_expense)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800 }}>{formatKrw(row.net_income)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </AdminTableCard>

          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, bgcolor: "#fff" }}>
            <Stack direction="row" spacing={1} alignItems="center" mb={2}>
              <AddBusinessOutlinedIcon color="success" />
              <Typography variant="subtitle1" fontWeight={800}>
                다중 사업체 추가 등록 (5월 종합소득세 합산용)
              </Typography>
            </Stack>
            <Grid container spacing={1.5}>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="사업체명 (예: 스마트스토어)"
                  value={newProfile.business_name}
                  onChange={(e) => setNewProfile((p) => ({ ...p, business_name: e.target.value }))}
                />
              </Grid>
              <Grid item xs={6} sm={2}>
                <TextField
                  fullWidth
                  size="small"
                  label="업종코드"
                  value={newProfile.industry_code}
                  onChange={(e) => setNewProfile((p) => ({ ...p, industry_code: e.target.value }))}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="과세 유형"
                  value={newProfile.tax_regime}
                  onChange={(e) => setNewProfile((p) => ({ ...p, tax_regime: e.target.value }))}
                >
                  <MenuItem value="GENERAL_VAT">일반 부가세 과세</MenuItem>
                  <MenuItem value="SIMPLIFIED_VAT">간이과세자</MenuItem>
                  <MenuItem value="EXEMPT_BUSINESS">면세사업자</MenuItem>
                  <MenuItem value="EXEMPT_FREELANCER">프리랜서(3.3%)</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={6} sm={2}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="직전연도 수입"
                  value={newProfile.prev_year_revenue}
                  onChange={(e) => setNewProfile((p) => ({ ...p, prev_year_revenue: e.target.value }))}
                />
              </Grid>
              <Grid item xs={6} sm={2}>
                <Button
                  fullWidth
                  variant="contained"
                  disabled={busy}
                  onClick={handleCreateProfile}
                  sx={{ height: 40, bgcolor: "#03C75A", "&:hover": { bgcolor: "#008A60" } }}
                >
                  사업장 추가
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Stack>
      )}

      {tab === 4 && (
        <Grid container spacing={2.5}>
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, bgcolor: "#fff", height: "100%" }}>
              <Stack spacing={2}>
                <Typography variant="subtitle1" fontWeight={800}>
                  홈택스 업로드·참고용 장부 문서 생성
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  다중 사업장 종소세 합산표, 국세청 간편장부 표준 컬럼 원장, 경비명세서, 원천징수 명세를 생성합니다.
                </Typography>
                <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
                  <Button
                    variant="contained"
                    startIcon={<DescriptionOutlinedIcon />}
                    onClick={() => agentTaxApi.downloadLedgerXlsx(taxYear)}
                    sx={{ bgcolor: "#03C75A", "&:hover": { bgcolor: "#008A60" } }}
                  >
                    간편장부·경비명세서 (.xlsx)
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<PictureAsPdfOutlinedIcon />}
                    onClick={() => agentTaxApi.downloadSummaryPdf(taxYear)}
                  >
                    종합소득세 참고용 요약 (.pdf)
                  </Button>
                </Stack>
              </Stack>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, bgcolor: "#fff" }}>
              <Stack spacing={1.5}>
                <Typography variant="subtitle1" fontWeight={800}>
                  제휴 세무사 기장 데이터 원클릭 패키지 전달
                </Typography>
                <TextField
                  size="small"
                  label="세무사/세무법인명"
                  value={partnerForm.partner_name}
                  onChange={(e) => setPartnerForm((p) => ({ ...p, partner_name: e.target.value }))}
                />
                <TextField
                  size="small"
                  label="전달 받을 이메일"
                  placeholder="tax@example.com"
                  value={partnerForm.partner_email}
                  onChange={(e) => setPartnerForm((p) => ({ ...p, partner_email: e.target.value }))}
                />
                <TextField
                  size="small"
                  label="전달 메모"
                  value={partnerForm.memo}
                  onChange={(e) => setPartnerForm((p) => ({ ...p, memo: e.target.value }))}
                />
                <Button
                  variant="contained"
                  startIcon={<SendOutlinedIcon />}
                  onClick={handleSendPartner}
                  disabled={busy || !partnerForm.partner_email.trim()}
                >
                  세무사 전달 패키지 생성 ({partnerExports.length}건)
                </Button>
                {partnerExports.slice(0, 3).map((exp) => (
                  <Box key={exp.id} sx={{ p: 1, borderRadius: 1.5, bgcolor: "#F8FAFC", fontSize: 12 }}>
                    <ReceiptLongOutlinedIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: "middle" }} />
                    {exp.tax_year}년 · {exp.partner_name} ({exp.partner_email}) · {exp.status}
                  </Box>
                ))}
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      )}

      <TaxDisclaimerBanner />

      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast((p) => ({ ...p, open: false }))}
      >
        <Alert severity={toast.severity} onClose={() => setToast((p) => ({ ...p, open: false }))}>
          {toast.message}
        </Alert>
      </Snackbar>
    </AdminPageContainer>
  );
}
