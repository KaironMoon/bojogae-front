import { useCallback, useEffect, useState } from "react";
import AccountBalanceOutlinedIcon from "@mui/icons-material/AccountBalanceOutlined";
import CalculateOutlinedIcon from "@mui/icons-material/CalculateOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import SyncRoundedIcon from "@mui/icons-material/SyncRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import {
  Alert,
  Box,
  Button,
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
} from "./components/AdminPageShell";
import { adminTaxApi, extractTaxError, formatKrw } from "@/services/tax-service";
import TaxDisclaimerBanner from "@/pages/tax/TaxDisclaimerBanner";
import TaxAccountingFormatGuide from "@/pages/tax/TaxAccountingFormatGuide";
import TaxHometaxPanel from "@/pages/tax/TaxHometaxPanel";
import TaxLedgerReviewPanel from "@/pages/tax/TaxLedgerReviewPanel";

const PERIOD_OPTIONS = [
  { code: "ALL", label: "연간 전체" },
  { code: "Q1", label: "1기 예정 (1~3월)" },
  { code: "Q2", label: "1기 확정 (4~6월)" },
  { code: "H1", label: "1기 전체 (1~6월)" },
  { code: "Q3", label: "2기 예정 (7~9월)" },
  { code: "Q4", label: "2기 확정 (10~12월)" },
  { code: "H2", label: "2기 전체 (7~12월)" },
];

export default function AdminTaxAutomationPage() {
  const currentYear = new Date().getFullYear();
  const [taxYear, setTaxYear] = useState(currentYear);
  const [periodCode, setPeriodCode] = useState("ALL");
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [overview, setOverview] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [connectors, setConnectors] = useState([]);
  const [partnerExports, setPartnerExports] = useState([]);
  const [toast, setToast] = useState({ open: false, severity: "info", message: "" });

  const [partnerForm, setPartnerForm] = useState({
    partner_name: "마음 AI 담당 세무법인",
    partner_email: "",
    period_label: "부가세 신고자료",
    memo: "",
  });

  const notify = useCallback((severity, message) => {
    setToast({ open: true, severity, message });
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [ov, txs, jbs, conns, exps] = await Promise.all([
        adminTaxApi.getOverview({ tax_year: taxYear, period_code: periodCode }),
        adminTaxApi.listTransactions({ tax_year: taxYear, period_code: periodCode, limit: 600 }),
        adminTaxApi.listHometaxJobs(),
        adminTaxApi.listConnectors(),
        adminTaxApi.listPartnerExports(),
      ]);
      setOverview(ov);
      setTransactions(txs);
      setJobs(jbs);
      setConnectors(conns);
      setPartnerExports(exps);
    } catch (err) {
      notify("error", extractTaxError(err));
    } finally {
      setLoading(false);
    }
  }, [taxYear, periodCode, notify]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleSyncPg = async () => {
    if (!overview) return;
    setBusy(true);
    try {
      const res = await adminTaxApi.syncPgPayments({
        period_start: overview.period_start,
        period_end: overview.period_end,
        profile_id: overview.profile?.id,
      });
      notify(
        "success",
        `PG 결제(payment_orders) 동기화 완료: 스캔 ${res.scanned_orders}건 → 신규 ${res.imported_count}건 (중복 ${res.skipped_duplicate_count}건)`,
      );
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
      await adminTaxApi.createPartnerExport({
        tax_year: taxYear,
        ...partnerForm,
      });
      notify("success", "마음 AI 운영사 세무 전달 패키지를 기록했습니다.");
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

  const profile = overview?.profile || {};
  const vat = overview?.vat_summary || {};
  const profilesList = profile.id ? [profile] : [];

  return (
    <AdminPageContainer>
      <AdminPageHeader
        icon={CalculateOutlinedIcon}
        badge={`일반 부가세 과세사업자 · ${profile.business_reg_no || "621-58-01016"}`}
        title={`세무자동화 (${profile.business_name || "마음 AI"})`}
        description="PG(KG이니시스/PortOne) 결제 매출 동기화, 서버비·AI API 외화결제 매입 정리 및 부가세(1·7월) 공제/불공제 자동 판별"
        actions={
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <TextField
              select
              size="small"
              label="연도"
              value={taxYear}
              onChange={(e) => setTaxYear(Number(e.target.value))}
              sx={{ width: 105 }}
            >
              {[currentYear, currentYear - 1, currentYear - 2].map((y) => (
                <MenuItem key={y} value={y}>
                  {y}년
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              size="small"
              label="부가세 기간"
              value={periodCode}
              onChange={(e) => setPeriodCode(e.target.value)}
              sx={{ width: 165 }}
            >
              {PERIOD_OPTIONS.map((p) => (
                <MenuItem key={p.code} value={p.code}>
                  {p.label}
                </MenuItem>
              ))}
            </TextField>
            <Button
              variant="contained"
              startIcon={<SyncRoundedIcon />}
              onClick={handleSyncPg}
              disabled={busy}
              sx={{ bgcolor: "#03C75A", "&:hover": { bgcolor: "#008A60" } }}
            >
              PG 매출 동기화
            </Button>
            <Button
              variant="outlined"
              startIcon={<DownloadOutlinedIcon />}
              onClick={() => adminTaxApi.downloadVatXlsx(taxYear, periodCode)}
            >
              부가세 엑셀
            </Button>
          </Stack>
        }
      />

      <AdminStatGrid>
        <AdminStatCard
          label="과세 매출 (공급가액)"
          value={formatKrw(vat.sales_supply)}
          subtext={`매출세액(10%): ${formatKrw(vat.sales_vat)}`}
          icon={TrendingUpRoundedIcon}
          color="#03C75A"
          bg="#ECFDF5"
        />
        <AdminStatCard
          label="공제 매입세액"
          value={formatKrw(vat.deductible_vat)}
          subtext={`공제 매입 합계: ${formatKrw(vat.deductible_total)}`}
          icon={AccountBalanceOutlinedIcon}
          color="#2563EB"
          bg="#EAF3FF"
        />
        <AdminStatCard
          label="불공제·외화영세 매입"
          value={formatKrw((vat.non_deductible_total || 0) + (vat.foreign_zero_total || 0))}
          subtext={`외화(AI API 등): ${formatKrw(vat.foreign_zero_total)}`}
          icon={WarningAmberRoundedIcon}
          color="#B45309"
          bg="#FFFBEB"
        />
        <AdminStatCard
          label="예상 부가세 납부(환급)"
          value={formatKrw(vat.estimated_vat_payable)}
          subtext={vat.estimated_vat_payable < 0 ? "환급 예상 (미검토 포함 전)" : `미검토 ${vat.pending_count || 0}건`}
          icon={CalculateOutlinedIcon}
          color="#6B38FB"
          bg="#F3EEFF"
        />
      </AdminStatGrid>

      <Paper variant="outlined" sx={{ borderRadius: 3, mb: 2.5, bgcolor: "#fff" }}>
        <Tabs value={tab} onChange={(_e, v) => setTab(v)} variant="scrollable" scrollButtons="auto">
          <Tab label="1. 매출·매입 수집 (PG 동기화 · 엑셀)" />
          <Tab label="2. 장부 정리 & 부가세 공제 판별" />
          <Tab label="3. 부가세 예상액 & 비용 요약" />
          <Tab label="4. 부가세 문서 & 세무사 전달" />
        </Tabs>
      </Paper>

      {tab === 0 && (
        <Stack spacing={2.5}>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, bgcolor: "#fff" }}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              justifyContent="space-between"
              alignItems={{ sm: "center" }}
              spacing={2}
            >
              <Box>
                <Typography variant="subtitle1" fontWeight={800}>
                  {profile.business_name} ({profile.business_reg_no}) · 대표 {profile.representative_name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  조회 기간: {overview?.period_start} ~ {overview?.period_end} ({overview?.period_label}) ·
                  1단계로 PG 매출을 가져온 뒤 아래에서 매입 엑셀을 올려 주세요.
                </Typography>
              </Box>
              <Button variant="contained" startIcon={<SyncRoundedIcon />} onClick={handleSyncPg} disabled={busy}>
                내부 PG 결제(payment_orders) 즉시 가져오기
              </Button>
            </Stack>
          </Paper>

          <TaxHometaxPanel
            mode="COMPANY"
            apiClient={adminTaxApi}
            profiles={profilesList}
            jobs={jobs}
            connectors={connectors}
            taxYear={taxYear}
            onReload={loadAll}
            onNotify={notify}
          />
        </Stack>
      )}

      {tab === 1 && (
        <TaxLedgerReviewPanel
          mode="COMPANY"
          apiClient={adminTaxApi}
          profiles={profilesList}
          transactions={transactions}
          categories={overview?.categories}
          onReload={loadAll}
          onNotify={notify}
        />
      )}

      {tab === 2 && (
        <Stack spacing={2.5}>
          <AdminTableCard>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>부가세 구분</TableCell>
                  <TableCell align="right">공급가액</TableCell>
                  <TableCell align="right">부가세액</TableCell>
                  <TableCell align="right">합계</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>과세 매출 (PG 정산 · 세금계산서 등)</TableCell>
                  <TableCell align="right">{formatKrw(vat.sales_supply)}</TableCell>
                  <TableCell align="right">{formatKrw(vat.sales_vat)}</TableCell>
                  <TableCell align="right">{formatKrw(vat.sales_total)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>공제 가능 매입 (서버비·비품·세금계산서)</TableCell>
                  <TableCell align="right">{formatKrw(vat.deductible_supply)}</TableCell>
                  <TableCell align="right">{formatKrw(vat.deductible_vat)}</TableCell>
                  <TableCell align="right">{formatKrw(vat.deductible_total)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>불공제 매입 (접대비·개인용 등)</TableCell>
                  <TableCell align="right">{formatKrw(vat.non_deductible_supply)}</TableCell>
                  <TableCell align="right">{formatKrw(vat.non_deductible_vat)}</TableCell>
                  <TableCell align="right">{formatKrw(vat.non_deductible_total)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>해외 외화·영세율 매입 (OpenAI · Gemini API 등)</TableCell>
                  <TableCell align="right">{formatKrw(vat.foreign_zero_total)}</TableCell>
                  <TableCell align="right">0원</TableCell>
                  <TableCell align="right">{formatKrw(vat.foreign_zero_total)}</TableCell>
                </TableRow>
                <TableRow sx={{ bgcolor: "#F8FAFC" }}>
                  <TableCell sx={{ fontWeight: 800 }}>예상 부가세 납부(환급)세액 (매출세액 - 공제매입세액)</TableCell>
                  <TableCell align="right">-</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800, color: "#006E43" }}>
                    {formatKrw(vat.estimated_vat_payable)}
                  </TableCell>
                  <TableCell align="right">-</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </AdminTableCard>

          <AdminTableCard>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>비용 계정과목별 집계</TableCell>
                  <TableCell align="right">건수</TableCell>
                  <TableCell align="right">금액 합계</TableCell>
                  <TableCell align="right">부가세</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(overview?.expense_by_category || []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 3, color: "text.secondary" }}>
                      집계된 매입 비용이 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  (overview?.expense_by_category || []).map((row) => (
                    <TableRow key={row.account_category}>
                      <TableCell>{row.account_category}</TableCell>
                      <TableCell align="right">{row.count}건</TableCell>
                      <TableCell align="right">{formatKrw(row.total_amount)}</TableCell>
                      <TableCell align="right">{formatKrw(row.vat_amount)}</TableCell>
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
          <Grid container spacing={2.5}>
            <Grid item xs={12} md={6}>
              <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, bgcolor: "#fff", height: "100%" }}>
                <Stack spacing={2}>
                  <Typography variant="subtitle1" fontWeight={800}>
                    마음 AI 부가세·기장 문서 생성
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    더존 Smart A·세무사랑Pro 일괄등록용 전표 엑셀과 부가세 매입·매출장, 요약 PDF를 내보냅니다.
                  </Typography>
                  <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
                    <Button
                      variant="contained"
                      startIcon={<DescriptionOutlinedIcon />}
                      onClick={() => adminTaxApi.downloadAccountingVoucherXlsx(taxYear, periodCode)}
                      sx={{ bgcolor: "#03C75A", "&:hover": { bgcolor: "#008A60" } }}
                    >
                      더존·세무사랑 전표 업로드용 (.xlsx)
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<DescriptionOutlinedIcon />}
                      onClick={() => adminTaxApi.downloadVatXlsx(taxYear, periodCode)}
                    >
                      부가세 매입·매출장 (.xlsx)
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<PictureAsPdfOutlinedIcon />}
                      onClick={() => adminTaxApi.downloadSummaryPdf(taxYear, periodCode)}
                    >
                      운영사 세무 요약 (.pdf)
                    </Button>
                  </Stack>
                </Stack>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, bgcolor: "#fff" }}>
                <Stack spacing={1.5}>
                  <Typography variant="subtitle1" fontWeight={800}>
                    담당 세무사 전달 패키지 기록
                  </Typography>
                  <TextField
                    size="small"
                    label="세무법인명"
                    value={partnerForm.partner_name}
                    onChange={(e) => setPartnerForm((p) => ({ ...p, partner_name: e.target.value }))}
                  />
                  <TextField
                    size="small"
                    label="세무사 이메일"
                    placeholder="tax@example.com"
                    value={partnerForm.partner_email}
                    onChange={(e) => setPartnerForm((p) => ({ ...p, partner_email: e.target.value }))}
                  />
                  <TextField
                    size="small"
                    label="메모"
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

          <TaxAccountingFormatGuide isCompany />
        </Stack>
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
