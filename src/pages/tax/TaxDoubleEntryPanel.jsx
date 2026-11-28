/* eslint-disable react/prop-types */
import AccountBalanceOutlinedIcon from "@mui/icons-material/AccountBalanceOutlined";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import SavingsOutlinedIcon from "@mui/icons-material/SavingsOutlined";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import TableChartOutlinedIcon from "@mui/icons-material/TableChartOutlined";
import {
  Alert,
  Box,
  Button,
  Chip,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

import { AdminTableCard } from "@/pages/admin/components/AdminPageShell";
import { formatKrw } from "@/services/tax-service";

const TIER_CARDS = [
  {
    tier: "SIMPLE",
    range: "직전연도 7,500만 원 미만",
    title: "간편장부 대상자",
    strategy: "간편장부 엑셀로 홈택스 셀프신고",
    cost: "세무비용 0원",
  },
  {
    tier: "DOUBLE_SELF",
    range: "7,500만 ~ 1억 5,000만 원 미만",
    title: "복식부기 · 자기조정",
    strategy: "보조개 표준재무제표로 홈택스 셀프신고",
    cost: "세무비용 0원 (월 기장 불필요)",
  },
  {
    tier: "DOUBLE_EXTERNAL",
    range: "1억 5,000만 원 이상",
    title: "복식부기 · 외부조정",
    strategy: "연중 보조개 정리 → 5월 1회만 외부조정 의뢰",
    cost: "월 기장료(연 120~180만 원) 절감",
  },
];

export default function TaxDoubleEntryPanel({
  taxYear,
  overview,
  doubleEntry,
  apiClient,
  partnerForm,
  setPartnerForm,
  partnerExports = [],
  onSendPartner,
  onNotify,
  busy = false,
}) {
  const filingTier = overview?.filing_tier || doubleEntry?.filing_tier || {};
  const inc = doubleEntry?.income_statement || { total_revenue: 0, expense_items: [], total_expenses: 0, net_income: 0 };
  const bs = doubleEntry?.balance_sheet || { assets: [], liabilities: [], equities: [], total_assets: 0, total_liabilities: 0, total_equity: 0 };
  const limits = doubleEntry?.limit_checks || [];
  const steps = doubleEntry?.hometax_self_filing_steps || [];

  const copyValue = (label, value) => {
    navigator.clipboard?.writeText(String(value));
    onNotify("success", `${label}(${Number(value).toLocaleString("ko-KR")})을(를) 복사했습니다.`);
  };

  return (
    <Stack spacing={2.5}>
      {/* 1. 세무비용 0원~최소화 3단계 전략 카드 */}
      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, bgcolor: "#fff" }}>
        <Stack direction="row" spacing={1} alignItems="center" mb={1.5}>
          <SavingsOutlinedIcon color="success" />
          <Typography variant="subtitle1" fontWeight={800}>
            수입금액별 세무비용 절감 전략 (월 기장료 없이 5월 신고 준비)
          </Typography>
        </Stack>
        <Grid container spacing={1.5}>
          {TIER_CARDS.map((card) => {
            const active = filingTier.tier === card.tier;
            return (
              <Grid item xs={12} md={4} key={card.tier}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderRadius: 2.5,
                    height: "100%",
                    borderWidth: active ? 2 : 1,
                    borderColor: active ? "#03C75A" : "#E2E8F0",
                    bgcolor: active ? "#F0FDF4" : "#F8FAFC",
                  }}
                >
                  <Stack spacing={0.75}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="caption" fontWeight={700} color="text.secondary">
                        {card.range}
                      </Typography>
                      {active && <Chip size="small" label="내 현재 구간" color="success" />}
                    </Stack>
                    <Typography variant="subtitle2" fontWeight={800} color="#0F172A">
                      {card.title}
                    </Typography>
                    <Typography variant="body2" color="#334155">
                      {card.strategy}
                    </Typography>
                    <Typography variant="caption" fontWeight={800} color="#006E43">
                      {card.cost}
                    </Typography>
                  </Stack>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      </Paper>

      {/* 2. 복식부기 표준재무제표 (손익계산서 + 재무상태표) */}
      <Grid container spacing={2.5}>
        <Grid item xs={12} md={6}>
          <AdminTableCard>
            <Box sx={{ px: 2, py: 1.5, borderBottom: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="subtitle2" fontWeight={800}>
                표준손익계산서 ({taxYear}년 귀속)
              </Typography>
              <Chip size="small" label="복식부기 자동 산출" color="success" variant="outlined" />
            </Box>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>코드</TableCell>
                  <TableCell>계정과목</TableCell>
                  <TableCell align="right">금액</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>401</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>사업수입금액 (총수입)</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800, color: "#006E43" }}>
                    {formatKrw(inc.total_revenue)}
                  </TableCell>
                </TableRow>
                {inc.expense_items.map((item) => (
                  <TableRow key={item.code}>
                    <TableCell>{item.code}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell align="right">{formatKrw(item.amount)}</TableCell>
                  </TableRow>
                ))}
                <TableRow sx={{ bgcolor: "#F8FAFC" }}>
                  <TableCell>-</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>필요경비 합계</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>{formatKrw(inc.total_expenses)}</TableCell>
                </TableRow>
                <TableRow sx={{ bgcolor: "#ECFDF5" }}>
                  <TableCell>375</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>당기순이익 (소득금액)</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800, color: "#006E43" }}>
                    {formatKrw(inc.net_income)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </AdminTableCard>
        </Grid>

        <Grid item xs={12} md={6}>
          <AdminTableCard>
            <Box sx={{ px: 2, py: 1.5, borderBottom: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="subtitle2" fontWeight={800}>
                표준재무상태표 ({taxYear}.12.31)
              </Typography>
              <Chip
                size="small"
                icon={<CheckCircleOutlineRoundedIcon />}
                label={doubleEntry?.is_balanced ? "대차평균 일치" : "확인 필요"}
                color={doubleEntry?.is_balanced ? "success" : "warning"}
              />
            </Box>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>구분</TableCell>
                  <TableCell>계정과목</TableCell>
                  <TableCell align="right">금액</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {bs.assets.map((row) => (
                  <TableRow key={`a-${row.code}`}>
                    <TableCell>자산</TableCell>
                    <TableCell>{`${row.code} ${row.name}`}</TableCell>
                    <TableCell align="right">{formatKrw(row.amount)}</TableCell>
                  </TableRow>
                ))}
                <TableRow sx={{ bgcolor: "#F8FAFC" }}>
                  <TableCell sx={{ fontWeight: 800 }}>자산총계</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800 }}>{formatKrw(bs.total_assets)}</TableCell>
                </TableRow>
                {bs.liabilities.map((row) => (
                  <TableRow key={`l-${row.code}`}>
                    <TableCell>부채</TableCell>
                    <TableCell>{`${row.code} ${row.name}`}</TableCell>
                    <TableCell align="right">{formatKrw(row.amount)}</TableCell>
                  </TableRow>
                ))}
                {bs.equities.map((row) => (
                  <TableRow key={`e-${row.code}`}>
                    <TableCell>자본</TableCell>
                    <TableCell>{`${row.code} ${row.name}`}</TableCell>
                    <TableCell align="right">{formatKrw(row.amount)}</TableCell>
                  </TableRow>
                ))}
                <TableRow sx={{ bgcolor: "#ECFDF5" }}>
                  <TableCell sx={{ fontWeight: 800 }}>부채+자본</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800, color: "#006E43" }}>
                    {formatKrw(bs.total_liabilities + bs.total_equity)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </AdminTableCard>
        </Grid>
      </Grid>

      {/* 3. 세무조정 한도 점검 + 홈택스 셀프신고 4단계 가이드 */}
      <Grid container spacing={2.5}>
        <Grid item xs={12} md={5}>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, bgcolor: "#fff", height: "100%" }}>
            <Typography variant="subtitle1" fontWeight={800} mb={1.5}>
              세무조정 한도 자동 점검 (자기조정용)
            </Typography>
            <Stack spacing={2}>
              {limits.map((chk) => {
                const ratio = Math.min(100, Math.round((chk.used_amount / chk.limit_amount) * 100));
                return (
                  <Box key={chk.key}>
                    <Stack direction="row" justifyContent="space-between" mb={0.5}>
                      <Typography variant="body2" fontWeight={700}>{chk.label}</Typography>
                      <Chip
                        size="small"
                        label={chk.exceeded ? "한도 초과" : "한도 내"}
                        color={chk.exceeded ? "warning" : "success"}
                      />
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={ratio}
                      color={chk.exceeded ? "warning" : "success"}
                      sx={{ height: 8, borderRadius: 99, mb: 0.75 }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                      {`사용 ${formatKrw(chk.used_amount)} / 한도 ${formatKrw(chk.limit_amount)} · ${chk.note}`}
                    </Typography>
                  </Box>
                );
              })}
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} md={7}>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, bgcolor: "#fff", height: "100%" }}>
            <Stack direction="row" spacing={1} alignItems="center" mb={1.5}>
              <AccountBalanceOutlinedIcon color="success" />
              <Typography variant="subtitle1" fontWeight={800}>
                홈택스 셀프신고 4단계 입력 가이드
              </Typography>
            </Stack>
            {filingTier.tier === "DOUBLE_EXTERNAL" && (
              <Alert severity="warning" sx={{ mb: 1.5, borderRadius: 2 }}>
                현재 구간(1억 5,000만 원 이상)은 외부조정 대상입니다. 아래 복식부기 엑셀을 받아
                5월에 1회만 세무사에게 신고대리를 의뢰하세요.
              </Alert>
            )}
            <Stack spacing={1.25}>
              {steps.map((st) => (
                <Paper key={st.step} variant="outlined" sx={{ p: 1.5, borderRadius: 2, bgcolor: "#F8FAFC" }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                    <Box>
                      <Typography variant="body2" fontWeight={800}>
                        {`Step ${st.step}. ${st.title}`}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>
                        {st.detail}
                      </Typography>
                    </Box>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<ContentCopyOutlinedIcon sx={{ fontSize: 14 }} />}
                      onClick={() => copyValue(st.copy_label, st.copy_value)}
                      sx={{ flexShrink: 0, whiteSpace: "nowrap" }}
                    >
                      {`${st.copy_label} 복사`}
                    </Button>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* 4. 파일 다운로드 (간편장부 + 복식부기 재무제표) & 5월 1회 세무사 전달 */}
      <Grid container spacing={2.5}>
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, bgcolor: "#fff", height: "100%" }}>
            <Stack spacing={2}>
              <Typography variant="subtitle1" fontWeight={800}>
                홈택스 셀프신고 · 세무사 제출용 파일 생성
              </Typography>
              <Typography variant="body2" color="text.secondary">
                간편장부(7,500만 미만)와 복식부기 표준재무제표·합계잔액시산표·분개장(7,500만 이상)을 모두 생성합니다.
              </Typography>
              <Stack direction="row" spacing={1.25} flexWrap="wrap" useFlexGap>
                <Button
                  variant="contained"
                  startIcon={<TableChartOutlinedIcon />}
                  onClick={() => apiClient.downloadDoubleEntryXlsx(taxYear)}
                  sx={{ bgcolor: "#03C75A", "&:hover": { bgcolor: "#008A60" } }}
                >
                  복식부기 재무제표·분개장 (.xlsx)
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<DescriptionOutlinedIcon />}
                  onClick={() => apiClient.downloadLedgerXlsx(taxYear)}
                >
                  간편장부·경비명세서 (.xlsx)
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<PictureAsPdfOutlinedIcon />}
                  onClick={() => apiClient.downloadSummaryPdf(taxYear)}
                >
                  종합소득세 요약 (.pdf)
                </Button>
              </Stack>
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, bgcolor: "#fff" }}>
            <Stack spacing={1.5}>
              <Typography variant="subtitle1" fontWeight={800}>
                5월 1회 외부조정 · 신고대리 패키지 전달 (월 기장료 절감)
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
                label="전달 메모 (예: 보조개 정리본 기반 5월 외부조정만 의뢰)"
                value={partnerForm.memo}
                onChange={(e) => setPartnerForm((p) => ({ ...p, memo: e.target.value }))}
              />
              <Button
                variant="contained"
                startIcon={<SendOutlinedIcon />}
                onClick={onSendPartner}
                disabled={busy || !partnerForm.partner_email.trim()}
              >
                1회 신고대리 패키지 기록 ({partnerExports.length}건)
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
    </Stack>
  );
}
