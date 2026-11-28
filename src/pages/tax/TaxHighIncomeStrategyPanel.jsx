/* eslint-disable react/prop-types */
import { useState } from "react";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import AutoGraphOutlinedIcon from "@mui/icons-material/AutoGraphOutlined";
import CalculateOutlinedIcon from "@mui/icons-material/CalculateOutlined";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import TrendingDownOutlinedIcon from "@mui/icons-material/TrendingDownOutlined";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Collapse,
  FormControlLabel,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { formatKrw } from "@/services/tax-service";

const TAX_BRACKETS = [
  {
    id: "b1",
    rangeLabel: "~1,400만",
    baseRate: "6%",
    effectiveRate: 6.6,
    progressiveDeduction: 0,
    min: 0,
    max: 14_000_000,
    tag: "기본 구간",
    barBg: "#DCFCE7",
    barColor: "#166534",
  },
  {
    id: "b2",
    rangeLabel: "~5,000만",
    baseRate: "15%",
    effectiveRate: 16.5,
    progressiveDeduction: 1_260_000,
    min: 14_000_000,
    max: 50_000_000,
    tag: "중위 구간",
    barBg: "#BBF7D0",
    barColor: "#166534",
  },
  {
    id: "b3",
    rangeLabel: "~8,800만",
    baseRate: "24%",
    effectiveRate: 26.4,
    progressiveDeduction: 5_760_000,
    min: 50_000_000,
    max: 88_000_000,
    tag: "7.5천~1.2억 구간",
    barBg: "#FEF3C7",
    barColor: "#92400E",
  },
  {
    id: "b4",
    rangeLabel: "~1.5억",
    baseRate: "35%",
    effectiveRate: 38.5,
    progressiveDeduction: 15_440_000,
    min: 88_000_000,
    max: 150_000_000,
    tag: "세금 급증 구간",
    barBg: "#FDE68A",
    barColor: "#92400E",
  },
  {
    id: "b5",
    rangeLabel: "~3억",
    baseRate: "38%",
    effectiveRate: 41.8,
    progressiveDeduction: 19_940_000,
    min: 150_000_000,
    max: 300_000_000,
    tag: "외부조정 구간",
    barBg: "#FED7AA",
    barColor: "#9A3412",
  },
  {
    id: "b6",
    rangeLabel: "3억 초과",
    baseRate: "40~45%",
    effectiveRate: 44.0,
    progressiveDeduction: 25_940_000,
    min: 300_000_000,
    max: Number.POSITIVE_INFINITY,
    tag: "최고세율 구간",
    barBg: "#FECACA",
    barColor: "#991B1B",
  },
];

const KOREAN_BRACKET_FORMULA = [
  { upper: 14_000_000, rate: 0.06, deduction: 0, label: "1,400만 이하" },
  { upper: 50_000_000, rate: 0.15, deduction: 1_260_000, label: "1,400만~5,000만" },
  { upper: 88_000_000, rate: 0.24, deduction: 5_760_000, label: "5,000만~8,800만" },
  { upper: 150_000_000, rate: 0.35, deduction: 15_440_000, label: "8,800만~1.5억" },
  { upper: 300_000_000, rate: 0.38, deduction: 19_940_000, label: "1.5억~3억" },
  { upper: 500_000_000, rate: 0.40, deduction: 25_940_000, label: "3억~5억" },
  { upper: 1_000_000_000, rate: 0.42, deduction: 35_940_000, label: "5억~10억" },
  { upper: Number.POSITIVE_INFINITY, rate: 0.45, deduction: 65_940_000, label: "10억 초과" },
];

function computeInteractiveTax({
  netIncome,
  withheldTotal,
  yellowUmbrella,
  pensionIrp,
  nationalPension,
  healthInsuranceExpense,
  dependentsCount = 1,
  voluntaryBookkeepingCredit,
}) {
  const adjustedNet = Math.max(0, netIncome - healthInsuranceExpense);
  const basicDeduction = netIncome > 0 ? Math.max(1, Number(dependentsCount || 1)) * 1_500_000 : 0;
  const taxableBase = Math.max(0, adjustedNet - basicDeduction - yellowUmbrella - nationalPension);

  const slices = [];
  let prevUpper = 0;
  for (const b of KOREAN_BRACKET_FORMULA) {
    if (taxableBase <= prevUpper) break;
    const sliceAmount = Math.min(taxableBase, b.upper) - prevUpper;
    if (sliceAmount > 0) {
      slices.push({
        label: b.label,
        amount: sliceAmount,
        ratePct: Math.round(b.rate * 100),
        tax: Math.floor(sliceAmount * b.rate),
      });
    }
    prevUpper = b.upper;
  }

  const row =
    KOREAN_BRACKET_FORMULA.find((b) => taxableBase <= b.upper) ||
    KOREAN_BRACKET_FORMULA[KOREAN_BRACKET_FORMULA.length - 1];
  const grossNational = Math.max(0, Math.floor(taxableBase * row.rate - row.deduction));
  const pensionRate = netIncome <= 45_000_000 ? 0.15 : 0.12;
  const pensionCredit = Math.floor(Math.min(9_000_000, pensionIrp) * pensionRate);
  const stdCredit = taxableBase > 0 ? 70_000 : 0;

  let nationalTax = Math.max(0, grossNational - stdCredit - pensionCredit);
  let bookkeepingCredit = 0;
  if (voluntaryBookkeepingCredit) {
    bookkeepingCredit = Math.min(1_000_000, Math.floor(nationalTax * 0.2));
    nationalTax = Math.max(0, nationalTax - bookkeepingCredit);
  }
  const localTax = Math.floor(nationalTax * 0.1);
  const totalTax = nationalTax + localTax;
  return {
    taxableBase,
    slices,
    appliedRatePct: Math.round(row.rate * 100),
    progressiveDeduction: row.deduction,
    grossNational,
    stdCredit,
    pensionRatePct: Math.round(pensionRate * 100),
    pensionCredit,
    bookkeepingCredit,
    nationalTax,
    localTax,
    totalTax,
    refundOrPayable: withheldTotal - totalTax,
  };
}

const HIGH_INCOME_STRATEGIES = [
  {
    no: "01",
    title: "노란우산공제 · 국민연금 (소득공제)",
    badge: "소득공제 · 압류금지",
    badgeColor: "success",
    effect: "노란우산 연 200~600만 원 + 지역 국민연금 전액 소득공제",
    detail:
      "노란우산공제(4천만 이하 600만 / ~6천만 500만 / ~1억 400만 / 1억 초과 200만)와 본인 납부 국민연금은 과세표준을 직접 낮추며, 지역가입자 건강보험료는 필요경비로 처리됩니다.",
    caution: "노란우산공제는 중도 해지 시 기타소득세(16.5%)가 추징되므로 유지 가능한 금액으로 납입하세요.",
  },
  {
    no: "02",
    title: "연금저축 + IRP 세액공제 (연 최대 900만)",
    badge: "세액공제 · 12/31 마감",
    badgeColor: "success",
    effect: "13.2%~16.5% 세액공제 (연 최대 118.8만~148.5만 원 직접 차감)",
    detail:
      "연금저축펀드(최대 600만)와 개인형 퇴직연금(IRP)을 합산해 연 900만 원까지 납입하면 산출세액에서 세금을 직접 차감합니다.",
    caution: "반드시 12월 31일 전 입금 완료분만 당해 연도 세액공제 대상에 포함됩니다.",
  },
  {
    no: "03",
    title: "접대비·경조사비·업무 피복비 100% 챙기기",
    badge: "기본한도 연 3,600만",
    badgeColor: "primary",
    effect: "청첩장·부고장 건당 20만 원 + 정장·구두·보조개 AI 구독료 경비 인정",
    detail:
      "1번 탭 '경조사 증빙 보관함'에 청첩장·부고장 캡처를 올리면 건당 20만 원까지 자동 합산됩니다. 정장·구두 등 업무용 피복비(사회통념 범위)와 보조개 AI 구독료도 영업 경비로 처리 가능합니다.",
    caution: "3만 원 초과 접대비는 사업용 카드·현금영수증이 필수이며, 보조개 적요란에 고객명을 남겨두세요.",
  },
  {
    no: "04",
    title: "업무용 승용차 · 자동차보험·자동차세 전략",
    badge: "미작성 연 1,500만",
    badgeColor: "primary",
    effect: "주유·하이패스·자동차보험·자동차세 합산 연 1,500만 원까지 전액 인정",
    detail:
      "방문 상담이 많은 설계사는 유류·하이패스·정비·자동차보험·자동차세·감가상각(연 800만 한도)을 빠짐없이 반영하고, 1,500만 원 초과 시 운행기록부를 작성하세요.",
    caution: "복식부기 의무자는 업무전용 보험 및 차량 감가상각 연 800만 원 한도 규정을 사전 점검하세요.",
  },
  {
    no: "05",
    title: "인건비 원천징수 & 다중 소득 합산 누락 방지",
    badge: "한계세율 분산",
    badgeColor: "warning",
    effect: "비서·DB 보조 인력 3.3% 원천세 신고 + N잡 5월 합산으로 가산세 예방",
    detail:
      "보조 인력에게 수당을 나눌 때 단순 계좌이체만 하면 경비 인정을 못 받으므로 매월 10일 원천세 신고가 필수입니다. 2곳 이상 보험사 수당·부업 소득도 5월 합산 신고하세요.",
    caution: "실제 근로 없이 가족에게 형식상 급여를 지급하면 부당행위로 추징되므로 업무 기록을 남기세요.",
  },
  {
    no: "06",
    title: "영업 카드 100% 분리 & 무기장가산세 20% 방어",
    badge: "필수 의무 · 공제/방어",
    badgeColor: "error",
    effect: "간편장부 대상자 자발적 복식부기 시 기장세액공제 20% (최대 100만)",
    detail:
      "생활비와 영업 카드를 100% 분리하고, 7,500만 이상은 사업용 계좌 등록 및 복식부기 기장으로 20% 가산세를 차단하세요. 7,500만 미만도 자발적 복식부기 기장 시 산출세액 20% 공제가 가능합니다.",
    caution: "직전연도 2,400만 미만 신입 설계사는 단순경비율(73.7%) 추계와 실제 장부 중 유리한 쪽을 선택하세요.",
  },
];

const YEARLY_TIMELINE = [
  {
    quarter: "Q1 (1~3월)",
    title: "기초 세팅",
    highlight: false,
    items: [
      "영업 전용 카드·계좌 100% 분리 및 홈택스 사업용 계좌 등록",
      "직전연도 수입금액 기준 장부의무(단순경비율/자기·외부조정) 판별",
      "노란우산공제·연금저축 월 자동이체 금액 설정",
    ],
  },
  {
    quarter: "Q2~Q3 (4~9월)",
    title: "월말 경비 관리",
    highlight: false,
    items: [
      "월 1회 카드·통장 엑셀 업로드 및 청첩장·부고장 경조사 보관함 등록",
      "자동차보험·건강보험료·정장 피복비 등 숨은 경비 누락 점검",
      "업무용 차량 경비 1,500만 원 초과 예상 시 운행기록부 작성",
    ],
  },
  {
    quarter: "Q4 (10~12월)",
    title: "연말 절세 골든타임",
    highlight: true,
    items: [
      "12월 31일 전 연금저축·IRP 900만 원 & 노란우산 추가 납입 완료",
      "상단 5월 예상 환급액 시뮬레이터로 추가 절세 여력 최종 점검",
      "노트북·태블릿·사무 집기 등 연내 필수 비품 집행 검토",
    ],
  },
  {
    quarter: "익년 5월",
    title: "종소세 확정신고",
    highlight: false,
    items: [
      "전 보험사 3.3% 원천징수영수증 PDF 일괄 대조·다중 소득 합산",
      "7.5천~1.5억: 보조개 표준재무제표로 자기조정 셀프신고(0원)",
      "1.5억 이상: 더존·세무사랑 전표 엑셀로 1회 외부조정 의뢰",
    ],
  },
];

const SIMPLE_TIER_STRATEGIES = [
  {
    no: "01",
    title: "2월 연말정산 vs 5월 장부 신고 유리 선택",
    badge: "신입·2,400만 미만 핵심",
    badgeColor: "info",
    effect: "단순경비율(73.7%) vs 실제 경비 비교 후 더 큰 환급액 선택",
    detail:
      "직전연도 2,400만 원 미만이거나 신규 위촉 설계사는 영수증 없이도 73.7% 단순경비율이 적용됩니다. 지출 경비가 더 많다면 보조개 간편장부로 5월 종소세 신고 시 추가 환급됩니다.",
    caution: "2,400만~7,500만 원 구간은 단순경비율이 안 되므로 실제 카드·경비 기장이 환급액을 크게 좌우합니다.",
  },
  {
    no: "02",
    title: "자발적 복식부기 '기장세액공제 20%' 꿀팁",
    badge: "세액공제 · 최대 100만",
    badgeColor: "success",
    effect: "간편장부 대상자도 복식부기 기장 시 산출세액 20%(지방세 포함 최대 110만) 공제",
    detail:
      "7,500만 원 미만이라도 보조개 5번 탭이 자동 생성한 표준손익계산서·표준재무상태표로 복식부기 신고를 선택하면 산출세액의 20%를 세액공제로 돌려받을 수 있습니다.",
    caution: "위 시뮬레이터의 '자발적 복식부기 기장세액공제' 체크박스로 내 절감 금액을 미리 계산해 보세요.",
  },
  {
    no: "03",
    title: "3.3% 환급 극대화: 숨은 영업 경비 100% 챙기기",
    badge: "환급액 직결",
    badgeColor: "primary",
    effect: "청첩장·부고장 20만 원 + 건보료·자동차보험·정장·보조개 AI",
    detail:
      "1번 탭 '경조사 증빙 보관함'에 청첩장·부고장 캡처를 올리면 건당 20만 원까지 접대비에 합산됩니다. 지역 건강보험료, 자동차보험·자동차세, 고객 미팅 정장·구두, 보조개 AI 구독료도 빠뜨리지 마세요.",
    caution: "생활비와 섞이지 않도록 영업 전용 카드·계좌 1개만 정해서 결제하면 전액 소명 방어가 쉽습니다.",
  },
  {
    no: "04",
    title: "연금저축 + IRP 16.5% 우대 세액공제",
    badge: "16.5% 우대 · 최대 148.5만",
    badgeColor: "success",
    effect: "종합소득 4,500만 이하 16.5% 공제 (900만 납입 시 최대 148.5만 원 차감)",
    detail:
      "연금저축펀드(최대 600만)와 IRP 합산 연 900만 원까지 세액공제됩니다. 소득이 4,500만 원 이하라면 공제율이 13.2%가 아닌 16.5%로 적용되어 환급 효과가 매우 큽니다.",
    caution: "3.3% 기납부세액 범위 내에서 세액공제 환급이 이뤄지므로 원천징수영수증 기납부액을 먼저 확인하세요.",
  },
  {
    no: "05",
    title: "노란우산공제(최대 600만) · 국민연금 소득공제",
    badge: "소득공제 · 압류금지",
    badgeColor: "success",
    effect: "사업소득 4천만 이하 연 최대 600만 원 과세표준 직접 차감",
    detail:
      "노란우산공제(4천만 이하 600만 / 4천~6천만 500만 / 6천만~1억 400만)와 본인 납부 국민연금 보험료 전액이 소득공제되어 이미 낸 3.3% 세금을 거의 전액 돌려받는 데 효과적입니다.",
    caution: "노란우산공제는 중도 해지 시 기타소득세(16.5%)가 부과되므로 월 5~20만 원 등 무리 없는 금액으로 시작하세요.",
  },
  {
    no: "06",
    title: "N잡·다중 보험사 합산 & 7,500만 돌파 대비",
    badge: "가산세 예방 · 세무비 0원",
    badgeColor: "warning",
    effect: "5월 홈택스 셀프신고 0원 완료 + 7,500만 원 이상 복식부기 미리 대비",
    detail:
      "GA·타 보험사 수당이나 부업 소득이 있다면 2월 연말정산으로 끝나지 않고 5월에 전 소득을 합산 신고해야 합니다. 3번 탭 PDF 일괄 대조와 5번 탭 4단계 가이드를 활용하세요.",
    caution: "올해 수당 합계가 7,500만 원을 넘으면 내년부터 복식부기 의무자(미작성 시 가산세 20%)가 됩니다.",
  },
];

const SIMPLE_YEARLY_TIMELINE = [
  {
    quarter: "Q1 (1~2월)",
    title: "2월 연말정산 vs 5월 판단",
    highlight: false,
    items: [
      "소속 보험사 2월 사업소득 연말정산(단순경비율) 예상 결과 확인",
      "영업 전용 카드 1개 분리 및 직전연도 2,400만/7,500만 기준 체크",
      "지출 경비가 많다면 5월 종합소득세 직접 장부 신고 선택",
    ],
  },
  {
    quarter: "Q2~Q3 (3~9월)",
    title: "숨은 경비·경조사 적립",
    highlight: false,
    items: [
      "월 1회 카드·은행 엑셀 업로드 및 청첩장·부고장 20만 원 보관함 등록",
      "자동차보험·주유비·건강보험료·정장·보조개 구독료 누락 점검",
      "부업·타 보험사 N잡 수당 내역 다중 사업체 탭에 함께 기록",
    ],
  },
  {
    quarter: "Q4 (10~12월)",
    title: "연말 환급 골든타임",
    highlight: true,
    items: [
      "12월 31일 전 연금저축·IRP(최대 16.5% 공제) & 노란우산 추가 납입",
      "시뮬레이터로 3.3% 기납부세액 전액 환급까지 필요한 경비·공제 확인",
      "장부 기장 시 자발적 복식부기 세액공제(20%) 적용 여부 사전 검토",
    ],
  },
  {
    quarter: "익년 5월",
    title: "홈택스 0원 셀프신고·환급",
    highlight: false,
    items: [
      "전 보험사 3.3% 원천징수영수증 PDF 일괄 업로드 및 합산 검증",
      "5번 탭 간편장부 요약 + 4단계 복사 버튼으로 홈택스 0원 신고 완료",
      "필요 시 '장부 5년 보관용' 간편장부 엑셀 다운로드 후 PC 백업",
    ],
  },
];

export default function TaxHighIncomeStrategyPanel({ overview, doubleEntry, defaultExpanded = true }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [yellowUmbrella, setYellowUmbrella] = useState(0);
  const [pensionIrp, setPensionIrp] = useState(0);
  const [nationalPension, setNationalPension] = useState(0);
  const [healthInsuranceExpense, setHealthInsuranceExpense] = useState(0);
  const [dependentsCount, setDependentsCount] = useState(1);
  const [useVoluntaryBookkeeping, setUseVoluntaryBookkeeping] = useState(false);

  const sim = overview?.tax_simulation || {};
  const filingTier = overview?.filing_tier || doubleEntry?.filing_tier || {};
  const isSimpleTier = filingTier.tier === "SIMPLE";
  const ytdNet = Number(doubleEntry?.income_statement?.net_income || overview?.totals?.net_income || 0);
  const withheldTotal = Number(sim.withheld_total ?? overview?.totals?.withheld_total ?? 0);
  const prevRev = Number(overview?.max_prev_year_revenue || 0);
  const canToggleBasis = prevRev > 0 && ytdNet < prevRev * 0.4;
  const [simBasisMode, setSimBasisMode] = useState(() =>
    prevRev >= 75_000_000 && ytdNet < 20_000_000 ? "ANNUAL_EST" : "YTD",
  );
  const usingEstimatedAnnual = canToggleBasis && simBasisMode === "ANNUAL_EST";
  const basisIncome = usingEstimatedAnnual ? Math.round(prevRev * 0.65) : ytdNet;

  const simIncomeBase = usingEstimatedAnnual ? basisIncome : ytdNet;
  const simWithheldBase = usingEstimatedAnnual ? Math.round(prevRev * 0.033) : withheldTotal;

  const baselineTax = computeInteractiveTax({
    netIncome: simIncomeBase,
    withheldTotal: simWithheldBase,
    yellowUmbrella: 0,
    pensionIrp: 0,
    nationalPension: 0,
    healthInsuranceExpense: 0,
    dependentsCount: 1,
    voluntaryBookkeepingCredit: false,
  });
  const afterTax = computeInteractiveTax({
    netIncome: simIncomeBase,
    withheldTotal: simWithheldBase,
    yellowUmbrella: Number(yellowUmbrella || 0),
    pensionIrp: Number(pensionIrp || 0),
    nationalPension: Number(nationalPension || 0),
    healthInsuranceExpense: Number(healthInsuranceExpense || 0),
    dependentsCount,
    voluntaryBookkeepingCredit: isSimpleTier && useVoluntaryBookkeeping,
  });
  const taxSaved = Math.max(0, baselineTax.totalTax - afterTax.totalTax);

  const beforeBracket =
    TAX_BRACKETS.find((b) => baselineTax.taxableBase <= b.max) || TAX_BRACKETS[TAX_BRACKETS.length - 1];
  const activeBracket =
    TAX_BRACKETS.find((b) => afterTax.taxableBase <= b.max) || TAX_BRACKETS[TAX_BRACKETS.length - 1];
  const bracketIdx = TAX_BRACKETS.findIndex((b) => b.id === activeBracket.id);
  const lowerBracket = bracketIdx > 0 ? TAX_BRACKETS[bracketIdx - 1] : null;
  const excessOverFloor = Math.max(0, afterTax.taxableBase - activeBracket.min);
  const droppedBracket = beforeBracket.id !== activeBracket.id && afterTax.taxableBase < baselineTax.taxableBase;
  const savedPerMillion = (Math.round(activeBracket.effectiveRate * 10) / 10).toLocaleString("ko-KR");
  const totalDeductionApplied = Math.max(0, simIncomeBase - afterTax.taxableBase);
  const activeStrategies = isSimpleTier ? SIMPLE_TIER_STRATEGIES : HIGH_INCOME_STRATEGIES;
  const activeTimeline = isSimpleTier ? SIMPLE_YEARLY_TIMELINE : YEARLY_TIMELINE;

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, bgcolor: "#fff" }}>
      <Stack spacing={2}>
        {/* Header & Collapse Toggle */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
        >
          <Stack direction="row" spacing={1.25} alignItems="center">
            <AutoGraphOutlinedIcon color="success" />
            <Box>
              <Typography variant="subtitle1" fontWeight={800}>
                {isSimpleTier
                  ? "간편장부 설계사 (연 7,500만 원 미만) 3.3% 환급 극대화 · 절세 도식 가이드"
                  : "고소득 보험설계사 (연 7,500만 원 이상) 실전 절세 전략 도식 가이드"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {isSimpleTier
                  ? "미리 낸 3.3% 세금을 최대한 돌려받도록 단순경비율 비교·숨은 경비·자발적 기장세액공제(20%)와 계산식을 한눈에 정리했습니다."
                  : "5월 예상 환급액 시뮬레이터로 공제 효과를 미리 계산하고, 12월 31일 전까지 세금을 합법적으로 줄이세요."}
              </Typography>
            </Box>
          </Stack>
          <Button
            size="small"
            variant="outlined"
            endIcon={expanded ? <ExpandLessRoundedIcon /> : <ExpandMoreRoundedIcon />}
            onClick={() => setExpanded((prev) => !prev)}
            sx={{ flexShrink: 0 }}
          >
            {expanded ? "절세 전략 도식 접기" : "절세 시뮬레이터 · 전략 도식 보기"}
          </Button>
        </Stack>

        <Collapse in={expanded}>
          <Stack spacing={2.5} sx={{ pt: 0.5 }}>
            {/* 도식 0: 인터랙티브 5월 예상 환급액 · 절세 시뮬레이터 */}
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5, bgcolor: "#F0FDF4", borderColor: "#86EFAC" }}>
              <Stack spacing={1.5}>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  justifyContent="space-between"
                  alignItems={{ xs: "flex-start", sm: "center" }}
                  spacing={1}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CalculateOutlinedIcon color="success" />
                    <Typography variant="subtitle2" fontWeight={900} color="#065F46">
                      실전 5월 예상 환급액 · 공제 절세 시뮬레이터
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
                    {canToggleBasis && (
                      <>
                        {[
                          { mode: "YTD", label: `당해 누적 (${formatKrw(ytdNet)})` },
                          { mode: "ANNUAL_EST", label: `직전연도(${formatKrw(prevRev)}) 연간 추정` },
                        ].map((opt) => {
                          const selected = simBasisMode === opt.mode;
                          return (
                            <Chip
                              key={opt.mode}
                              size="small"
                              label={opt.label}
                              onClick={() => setSimBasisMode(opt.mode)}
                              sx={{
                                bgcolor: selected ? "#03C75A" : "#fff",
                                color: selected ? "#fff" : "#334155",
                                fontWeight: 700,
                                border: "1px solid",
                                borderColor: selected ? "#03C75A" : "#CBD5E1",
                                "&:hover": { bgcolor: selected ? "#008A60" : "#F1F5F9" },
                              }}
                            />
                          );
                        })}
                      </>
                    )}
                    <Typography variant="caption" fontWeight={700} color="#065F46">
                      {`소득금액 ${formatKrw(simIncomeBase)} / 기납부 원천세 ${formatKrw(simWithheldBase)}`}
                    </Typography>
                  </Stack>
                </Stack>

                {sim.simple_rate_eligible ? (
                  <Alert severity="info" sx={{ py: 0.5, borderRadius: 2 }}>
                    <strong>신입 · 2,400만 원 미만 단순경비율({sim.simple_rate_pct}%) 비교:</strong>{" "}
                    단순경비율 적용 경비(<strong>{formatKrw(sim.simple_rate_expense)}</strong>) vs 실제 장부 경비(
                    <strong>{formatKrw(sim.confirmed_expense)}</strong>) →{" "}
                    {sim.simple_rate_recommended
                      ? "영수증이 적다면 2월 연말정산/단순경비율 추계신고가 더 유리할 수 있습니다."
                      : "실제 장부 경비가 더 크므로 5월 장부 기장 신고가 유리합니다."}
                  </Alert>
                ) : (
                  isSimpleTier && (
                    <Alert severity="info" sx={{ py: 0.5, borderRadius: 2 }}>
                      <strong>2,400만~7,500만 원 간편장부 구간 안내:</strong>{" "}
                      이 구간은 단순경비율이 적용되지 않아 실제 영업 경비를 모을수록 3.3% 환급액이 커집니다. 아래{" "}
                      <strong>자발적 복식부기 기장세액공제(20%)</strong> 체크 시 추가 절감액도 바로 확인할 수 있습니다.
                    </Alert>
                  )
                )}

                <Grid container spacing={1.5}>
                  {[
                    {
                      label: "노란우산공제 납입 (원)",
                      value: yellowUmbrella,
                      setter: setYellowUmbrella,
                      presets: [0, 2_000_000, 4_000_000, 6_000_000],
                    },
                    {
                      label: "연금저축 + IRP 납입 (원)",
                      value: pensionIrp,
                      setter: setPensionIrp,
                      presets: [0, 6_000_000, 9_000_000],
                    },
                    {
                      label: "국민연금 본인 납입 (소득공제)",
                      value: nationalPension,
                      setter: setNationalPension,
                      presets: [0, 2_400_000, 4_800_000],
                    },
                    {
                      label: "지역 건강보험료 (추가 경비)",
                      value: healthInsuranceExpense,
                      setter: setHealthInsuranceExpense,
                      presets: [0, 2_000_000, 3_600_000],
                    },
                  ].map((field) => (
                    <Grid item xs={12} sm={6} md={3} key={field.label}>
                      <Typography variant="caption" fontWeight={700} color="#334155" sx={{ display: "block", mb: 0.5 }}>
                        {field.label}
                      </Typography>
                      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap mb={0.75}>
                        {field.presets.map((v) => {
                          const selected = Number(field.value) === v;
                          return (
                            <Chip
                              key={v}
                              size="small"
                              label={v === 0 ? "0원" : `${v / 10_000}만`}
                              onClick={() => field.setter(v)}
                              sx={{
                                bgcolor: selected ? "#03C75A" : "#fff",
                                color: selected ? "#fff" : "#334155",
                                fontWeight: 700,
                                border: "1px solid",
                                borderColor: selected ? "#03C75A" : "#CBD5E1",
                                "&:hover": { bgcolor: selected ? "#008A60" : "#F1F5F9" },
                              }}
                            />
                          );
                        })}
                      </Stack>
                      <TextField
                        fullWidth
                        size="small"
                        type="number"
                        value={field.value}
                        onChange={(e) => field.setter(Math.max(0, Number(e.target.value || 0)))}
                        sx={{ bgcolor: "#fff" }}
                      />
                    </Grid>
                  ))}
                </Grid>

                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1.5}
                  alignItems={{ xs: "flex-start", sm: "center" }}
                  justifyContent="space-between"
                >
                  <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
                    <Typography variant="caption" fontWeight={700} color="#334155">
                      인적공제 (본인·부양가족):
                    </Typography>
                    {[
                      { count: 1, label: "본인 1인 (150만)" },
                      { count: 2, label: "2인 (300만)" },
                      { count: 3, label: "3인 (450만)" },
                      { count: 4, label: "4인 (600만)" },
                    ].map((opt) => {
                      const selected = dependentsCount === opt.count;
                      return (
                        <Chip
                          key={opt.count}
                          size="small"
                          label={opt.label}
                          onClick={() => setDependentsCount(opt.count)}
                          sx={{
                            bgcolor: selected ? "#03C75A" : "#fff",
                            color: selected ? "#fff" : "#334155",
                            fontWeight: 700,
                            border: "1px solid",
                            borderColor: selected ? "#03C75A" : "#CBD5E1",
                            "&:hover": { bgcolor: selected ? "#008A60" : "#F1F5F9" },
                          }}
                        />
                      );
                    })}
                  </Stack>

                  {isSimpleTier && (
                    <FormControlLabel
                      control={
                        <Checkbox
                          size="small"
                          color="success"
                          checked={useVoluntaryBookkeeping}
                          onChange={(e) => setUseVoluntaryBookkeeping(e.target.checked)}
                        />
                      }
                      label={
                        <Typography variant="caption" fontWeight={700} color="#065F46">
                          간편장부 대상자 자발적 복식부기 기장세액공제 적용 (산출세액 20%, 최대 100만 원 추가 절감)
                        </Typography>
                      }
                    />
                  )}
                </Stack>

                <Grid container spacing={1.5}>
                  <Grid item xs={12} md={4}>
                    <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, bgcolor: "#fff" }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={700}>
                        공제 적용 전 예상 세금 · 정산
                      </Typography>
                      <Typography variant="subtitle1" fontWeight={800}>
                        {baselineTax.refundOrPayable >= 0
                          ? `환급 +${formatKrw(baselineTax.refundOrPayable)}`
                          : `추가납부 ${formatKrw(Math.abs(baselineTax.refundOrPayable))}`}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {`과세표준 ${formatKrw(baselineTax.taxableBase)} · 총 결정세액 ${formatKrw(baselineTax.totalTax)}`}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, bgcolor: "#fff", borderColor: "#03C75A", borderWidth: 1.5 }}>
                      <Typography variant="caption" color="#006E43" fontWeight={700}>
                        절세 적용 후 예상 5월 정산
                      </Typography>
                      <Typography variant="subtitle1" fontWeight={900} color={afterTax.refundOrPayable >= 0 ? "#006E43" : "#B45309"}>
                        {afterTax.refundOrPayable >= 0
                          ? `환급 +${formatKrw(afterTax.refundOrPayable)}`
                          : `추가납부 ${formatKrw(Math.abs(afterTax.refundOrPayable))}`}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {`예상 과세표준 ${formatKrw(afterTax.taxableBase)} · 총 결정세액 ${formatKrw(afterTax.totalTax)}`}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, bgcolor: "#ECFDF5", borderColor: "#10B981" }}>
                      <Typography variant="caption" color="#065F46" fontWeight={700}>
                        시뮬레이션 추가 절세 효과
                      </Typography>
                      <Typography variant="subtitle1" fontWeight={900} color="#065F46">
                        {`+${formatKrw(taxSaved)} 절감`}
                      </Typography>
                      <Typography variant="caption" color="#047857">
                        지방소득세 10% 절감분까지 자동 합산
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Stack>
            </Paper>

            {/* 도식 1: 예상 과세표준 기준 종합소득세 누진세율 구간 */}
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5, bgcolor: "#F8FAFC" }}>
              <Stack spacing={1.5}>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  justifyContent="space-between"
                  alignItems={{ xs: "flex-start", sm: "center" }}
                  spacing={0.5}
                >
                  <Typography variant="subtitle2" fontWeight={800} color="#0F172A">
                    도식 ① 종합소득세 누진세율 구간 (예상 과세표준 기준 · 지방소득세 10% 포함)
                  </Typography>
                  <Typography variant="caption" fontWeight={700} color="#006E43">
                    {`예상 과세표준 ${formatKrw(afterTax.taxableBase)} (소득금액 ${formatKrw(simIncomeBase)} − 경비·소득공제 ${formatKrw(totalDeductionApplied)})`}
                  </Typography>
                </Stack>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(3, 1fr)", md: "repeat(6, 1fr)" },
                    gap: 1,
                  }}
                >
                  {TAX_BRACKETS.map((b) => {
                    const isActive = b.id === activeBracket.id;
                    return (
                      <Paper
                        key={b.id}
                        variant="outlined"
                        sx={{
                          p: 1.25,
                          borderRadius: 2,
                          bgcolor: isActive ? b.barBg : "#fff",
                          borderWidth: isActive ? 2 : 1,
                          borderColor: isActive ? b.barColor : "#E2E8F0",
                        }}
                      >
                        <Stack spacing={0.4}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography variant="caption" fontWeight={700} color="text.secondary">
                              {b.rangeLabel}
                            </Typography>
                            {isActive && (
                              <Chip
                                size="small"
                                label="예상 과세표준"
                                color="success"
                                sx={{ height: 18, fontSize: 10, fontWeight: 800 }}
                              />
                            )}
                          </Stack>
                          <Typography variant="subtitle1" fontWeight={900} color={isActive ? b.barColor : "#0F172A"}>
                            {`${b.effectiveRate}%`}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>
                            {`기본 ${b.baseRate} · ${b.tag}`}
                          </Typography>
                        </Stack>
                      </Paper>
                    );
                  })}
                </Box>

                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: "#ECFDF5",
                    border: "1px solid #A7F3D0",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 1,
                  }}
                >
                  <TrendingDownOutlinedIcon color="success" sx={{ fontSize: 20, flexShrink: 0, mt: 0.25 }} />
                  <Stack spacing={0.4}>
                    <Typography variant="body2" fontWeight={800} color="#065F46">
                      {`한계세율 ${activeBracket.effectiveRate}% 구간: 업무 경비·소득공제 100만 원을 추가로 챙길 때마다 세금이 약 ${savedPerMillion}만 원 줄어듭니다.`}
                    </Typography>
                    {droppedBracket ? (
                      <Typography variant="caption" fontWeight={800} color="#047857">
                        {`공제 반영 효과: 예상 과세표준이 ${formatKrw(baselineTax.taxableBase)} → ${formatKrw(afterTax.taxableBase)}로 내려가 한계세율 구간 자체가 ${beforeBracket.effectiveRate}% → ${activeBracket.effectiveRate}%로 한 단계 낮아졌습니다!`}
                      </Typography>
                    ) : (
                      lowerBracket &&
                      excessOverFloor > 0 && (
                        <Typography variant="caption" fontWeight={700} color="#047857">
                          {`구간 한 단계 낮추기 팁: 예상 과세표준에서 약 ${formatKrw(excessOverFloor)}만 경비·노란우산·국민연금·부양가족 공제로 더 낮추면 한계세율 자체가 ${activeBracket.effectiveRate}% → ${lowerBracket.effectiveRate}%로 내려갑니다.`}
                        </Typography>
                      )
                    )}
                  </Stack>
                </Box>

                <Alert severity="info" sx={{ py: 1, borderRadius: 2, "& .MuiAlert-message": { width: "100%" } }}>
                  <Stack spacing={0.75}>
                    <Typography variant="body2" fontWeight={800} color="#0F172A">
                      {afterTax.taxableBase > 0
                        ? `전체 금액에 ${activeBracket.effectiveRate}%가 붙는 것이 아닙니다 — 실제 세금 계산식 상세`
                        : "실제 세금 계산식 상세 (과세표준 0원)"}
                    </Typography>

                    {afterTax.taxableBase > 0 ? (
                      <Stack spacing={0.5} sx={{ fontSize: 12.5, color: "#1E293B" }}>
                        <Box>
                          <strong>① 구간별 국세 산출세액: </strong>
                          {afterTax.slices
                            .map((s) => `${s.label} ${formatKrw(s.amount)}×${s.ratePct}%(${formatKrw(s.tax)})`)
                            .join(" + ")}{" "}
                          = <strong>{formatKrw(afterTax.grossNational)}</strong>
                          {afterTax.progressiveDeduction > 0 && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                              {`↳ 간편 계산식: 과세표준 ${formatKrw(afterTax.taxableBase)} × ${afterTax.appliedRatePct}% − 누진공제 ${formatKrw(afterTax.progressiveDeduction)} = ${formatKrw(afterTax.grossNational)}`}
                            </Typography>
                          )}
                        </Box>
                        <Box>
                          <strong>② 세액공제 차감 → 국세 결정세액: </strong>
                          {`${formatKrw(afterTax.grossNational)} − 표준세액공제 ${formatKrw(afterTax.stdCredit)}`}
                          {afterTax.pensionCredit > 0 && ` − 연금·IRP 세액공제 ${formatKrw(afterTax.pensionCredit)}(${afterTax.pensionRatePct}%)`}
                          {afterTax.bookkeepingCredit > 0 && ` − 기장세액공제 ${formatKrw(afterTax.bookkeepingCredit)}(20%)`}
                          {" = "}
                          <strong>{formatKrw(afterTax.nationalTax)}</strong>
                        </Box>
                        <Box>
                          <strong>③ 지방소득세(국세의 10%) 합산 → 총 결정세액: </strong>
                          {`국세 ${formatKrw(afterTax.nationalTax)} + 지방소득세 ${formatKrw(afterTax.localTax)}(10%) = `}
                          <strong>{formatKrw(afterTax.totalTax)}</strong>
                        </Box>
                        <Box>
                          <strong>④ 기납부 3.3% 원천세 정산 → 5월 최종 예상액: </strong>
                          {`총 결정세액 ${formatKrw(afterTax.totalTax)} − 기납부 원천세 ${formatKrw(simWithheldBase)} = `}
                          <strong style={{ color: afterTax.refundOrPayable >= 0 ? "#006E43" : "#B45309" }}>
                            {afterTax.refundOrPayable >= 0
                              ? `환급 예상 +${formatKrw(afterTax.refundOrPayable)}`
                              : `추가 납부 예상 ${formatKrw(Math.abs(afterTax.refundOrPayable))}`}
                          </strong>
                        </Box>
                      </Stack>
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        과세표준이 0원이므로 산출세액과 결정세액은 0원이며, 기납부 원천세 전액이 환급 대상입니다.
                      </Typography>
                    )}
                  </Stack>
                </Alert>

                <Alert severity="warning" sx={{ py: 0.75, borderRadius: 2 }}>
                  <strong>주의 (장부의무 판별 기준):</strong>{" "}
                  {`세율 구간은 비용·소득공제를 뺀 '과세표준' 기준이지만, 복식부기 의무자(7,500만 원)와 외부조정 대상자(1억 5,000만 원) 여부는 비용을 빼기 전 직전연도 '총수입금액(수수료 전액${prevRev > 0 ? `: ${formatKrw(prevRev)}` : ""})'을 기준으로 판별합니다.`}
                </Alert>
              </Stack>
            </Paper>

            {/* 도식 2: 수입 구간별 6대 핵심 절세·환급 카드 (2x3 Grid) */}
            <Box>
              <Typography variant="subtitle2" fontWeight={800} color="#0F172A" mb={1.25}>
                {isSimpleTier
                  ? "도식 ② 간편장부 설계사(7,500만 원 미만) 6대 핵심 환급·절세 카드"
                  : "도식 ② 보험설계사(940906) 6대 핵심 절세 카드 (숨은 경비·공제·가산세 방어)"}
              </Typography>
              <Grid container spacing={1.5}>
                {activeStrategies.map((item) => (
                  <Grid item xs={12} md={4} key={item.no}>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 2,
                        borderRadius: 2.5,
                        height: "100%",
                        bgcolor: "#F8FAFC",
                        borderColor: "#E2E8F0",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                      }}
                    >
                      <Stack spacing={1}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                          <Typography variant="caption" fontWeight={900} color="#006E43">
                            {`STRATEGY ${item.no}`}
                          </Typography>
                          <Chip size="small" label={item.badge} color={item.badgeColor} variant="outlined" />
                        </Stack>
                        <Typography variant="subtitle2" fontWeight={800} color="#0F172A">
                          {item.title}
                        </Typography>
                        <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: "#ECFDF5", border: "1px solid #D1FAE5" }}>
                          <Typography variant="caption" fontWeight={800} color="#065F46">
                            {item.effect}
                          </Typography>
                        </Box>
                        <Typography variant="caption" color="#334155" sx={{ lineHeight: 1.5 }}>
                          {item.detail}
                        </Typography>
                      </Stack>
                      <Typography variant="caption" color="#B45309" fontWeight={700} sx={{ mt: 1.25, display: "block" }}>
                        {`※ 주의: ${item.caution}`}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>

            {/* 도식 3: 연간 절세·환급 실행 타임라인 (4단계 플로우) */}
            <Box>
              <Stack direction="row" spacing={0.75} alignItems="center" mb={1.25}>
                <ShieldOutlinedIcon color="success" sx={{ fontSize: 18 }} />
                <Typography variant="subtitle2" fontWeight={800} color="#0F172A">
                  {isSimpleTier
                    ? "도식 ③ 연간 3.3% 환급·절세 실행 타임라인 (Q1 판단 → Q4 마감 → 5월 0원 셀프신고)"
                    : "도식 ③ 연간 절세 실행 타임라인 (Q1 기초 → Q4 연말 골든타임 → 5월 신고)"}
                </Typography>
              </Stack>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", md: "row" },
                  alignItems: "stretch",
                  gap: 1,
                }}
              >
                {activeTimeline.map((stage, idx) => (
                  <Box
                    key={stage.quarter}
                    sx={{
                      display: "flex",
                      flexDirection: { xs: "column", md: "row" },
                      alignItems: "center",
                      flex: 1,
                      gap: 1,
                    }}
                  >
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 1.75,
                        borderRadius: 2.5,
                        width: "100%",
                        height: "100%",
                        borderWidth: stage.highlight ? 2 : 1,
                        borderColor: stage.highlight ? "#03C75A" : "#CBD5E1",
                        bgcolor: stage.highlight ? "#F0FDF4" : "#fff",
                      }}
                    >
                      <Stack spacing={0.75}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography variant="caption" fontWeight={900} color={stage.highlight ? "#006E43" : "#475569"}>
                            {stage.quarter}
                          </Typography>
                          {stage.highlight && (
                            <Chip size="small" label="12/31 마감" color="warning" sx={{ height: 18, fontSize: 10, fontWeight: 800 }} />
                          )}
                        </Stack>
                        <Typography variant="subtitle2" fontWeight={800} color="#0F172A">
                          {stage.title}
                        </Typography>
                        <Stack component="ul" spacing={0.4} sx={{ pl: 2, m: 0 }}>
                          {stage.items.map((bullet) => (
                            <Typography key={bullet} component="li" variant="caption" color="#334155" sx={{ lineHeight: 1.45 }}>
                              {bullet}
                            </Typography>
                          ))}
                        </Stack>
                      </Stack>
                    </Paper>
                    {idx < activeTimeline.length - 1 && (
                      <ArrowForwardRoundedIcon
                        sx={{
                          display: { xs: "none", md: "block" },
                          color: "#03C75A",
                          fontSize: 22,
                          flexShrink: 0,
                        }}
                      />
                    )}
                  </Box>
                ))}
              </Box>
            </Box>

            <Typography variant="caption" color="text.secondary">
              ※ 본 시뮬레이터 및 절세 전략은 일반적인 세법 기준 모의 계산 참고용이며, 개인별 인적·세액공제 요건과 최종 신고 책임은 본인에게 있습니다.
            </Typography>
          </Stack>
        </Collapse>
      </Stack>
    </Paper>
  );
}
