/* eslint-disable react/prop-types */
import { useState } from "react";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import AutoGraphOutlinedIcon from "@mui/icons-material/AutoGraphOutlined";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import TrendingDownOutlinedIcon from "@mui/icons-material/TrendingDownOutlined";
import {
  Box,
  Button,
  Chip,
  Collapse,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import { formatKrw } from "@/services/tax-service";

const TAX_BRACKETS = [
  {
    id: "b1",
    rangeLabel: "~1,400만",
    baseRate: "6%",
    effectiveRate: 6.6,
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
    min: 300_000_000,
    max: Number.POSITIVE_INFINITY,
    tag: "최고세율 구간",
    barBg: "#FECACA",
    barColor: "#991B1B",
  },
];

const HIGH_INCOME_STRATEGIES = [
  {
    no: "01",
    title: "노란우산공제 (소득공제 최대 200~600만)",
    badge: "소득공제 · 압류금지",
    badgeColor: "success",
    effect: "38.5% 구간에서 연 400만 원 공제 시 약 154만 원 절세",
    detail:
      "사업소득금액 4천만 이하 600만 / 4천~6천만 500만 / 6천만~1억 400만 / 1억 초과 200만 원까지 과세표준에서 직접 차감됩니다.",
    caution: "중도 해지 시 기타소득세(16.5%)가 추징되므로 장기 유지 가능한 금액으로 납입하세요.",
  },
  {
    no: "02",
    title: "연금저축 + IRP 세액공제 (연 최대 900만)",
    badge: "세액공제 · 12/31 마감",
    badgeColor: "success",
    effect: "종소세 4,500만 초과 기준 13.2% (연 최대 118.8만 원) 확정 세액공제",
    detail:
      "연금저축(연 최대 600만)과 개인형 퇴직연금(IRP)을 합산해 연 900만 원까지 납입하면 산출세액에서 바로 차감됩니다.",
    caution: "반드시 12월 31일 전 입금 완료분만 당해 연도 세액공제 대상에 포함됩니다.",
  },
  {
    no: "03",
    title: "접대비 · 경조사비 100% 증빙 전략",
    badge: "기본한도 연 3,600만",
    badgeColor: "primary",
    effect: "3만 원 초과 카드·현금영수증 + 경조사 건당 20만 원 청첩장 증빙",
    detail:
      "고객·소개자 식사와 선물은 사업용 카드로 결제하고, 결혼·장례 경조사비는 청첩장·부고 문자 캡처와 계좌이체 내역만으로 경비 인정됩니다.",
    caution: "보조개 적요란에 고객명·상담 목적을 남겨두면 세무 소명 요청 시 완벽히 방어됩니다.",
  },
  {
    no: "04",
    title: "업무용 승용차 비용 & 운행기록부 전략",
    badge: "미작성 연 1,500만",
    badgeColor: "primary",
    effect: "운행기록부 없이도 유류·보험·정비·감가상각 연 1,500만 원까지 인정",
    detail:
      "방문 상담이 많은 설계사는 유류비·통행료·정비·리스료·감가상각(연 800만 한도)을 빠짐없이 카드·현금영수증으로 모으고 초과 시 운행기록부를 작성하세요.",
    caution: "복식부기 의무자는 업무전용 보험 및 차량 감가상각 연 800만 원 한도 규정을 사전 점검하세요.",
  },
  {
    no: "05",
    title: "가족·보조원 인건비 합법적 소득 분산",
    badge: "한계세율 분산",
    badgeColor: "warning",
    effect: "고세율(38.5%) 소득을 저세율(6.6~16.5%) 구간으로 합법 분산",
    detail:
      "배우자·가족이 실제로 고객 DB 관리, 제안서 출력, 일정 보조 업무를 수행한다면 계좌이체와 매월 10일 원천세 신고를 통해 인건비로 비용 처리할 수 있습니다.",
    caution: "실제 근무 없이 형식상 급여를 지급하면 부당행위로 추징되므로 출근·업무 기록을 반드시 남기세요.",
  },
  {
    no: "06",
    title: "사업용 계좌 신고 & 무기장가산세 20% 방어",
    badge: "필수 의무 · 가산세 방어",
    badgeColor: "error",
    effect: "자기조정(0원) / 1회 외부조정으로 산출세액 20% 가산세 원천 차단",
    detail:
      "직전연도 7,500만 원 이상 복식부기 의무자는 홈택스 사업용 계좌 등록이 필수입니다. 1.5억 미만은 자기조정 셀프신고, 1.5억 이상은 더존·세무사랑 엑셀로 5월 1회 외부조정하세요.",
    caution: "복식부기 의무자가 간편장부로 신고하면 무신고로 간주돼 산출세액의 20% 가산세가 부과됩니다.",
  },
];

const YEARLY_TIMELINE = [
  {
    quarter: "Q1 (1~3월)",
    title: "기초 세팅",
    highlight: false,
    items: [
      "홈택스 사업용 계좌·사업용 신용카드 등록 확인",
      "직전연도 수입금액 기준 장부의무(자기·외부조정) 판별",
      "노란우산공제·연금저축 월 자동이체 금액 설정",
    ],
  },
  {
    quarter: "Q2~Q3 (4~9월)",
    title: "월말 경비 관리",
    highlight: false,
    items: [
      "월 1회 카드·통장 엑셀 업로드 및 가사·업무 경비 분리",
      "고객 접대 적요 메모 및 청첩장·부고장 증빙 보관",
      "업무용 차량 경비 1,500만 원 초과 예상 시 운행기록부 작성",
    ],
  },
  {
    quarter: "Q4 (10~12월)",
    title: "연말 절세 골든타임",
    highlight: true,
    items: [
      "12월 31일 전 연금저축·IRP 900만 원 & 노란우산 추가 납입 완료",
      "누적 소득금액 기반 예상 한계세율·추가 필요 경비 사전 점검",
      "노트북·태블릿·사무 집기 등 연내 필수 비품 집행 검토",
    ],
  },
  {
    quarter: "익년 5월",
    title: "종소세 확정신고",
    highlight: false,
    items: [
      "전 보험사 3.3% 원천징수영수증 PDF 일괄 대조·합산",
      "7.5천~1.5억: 보조개 표준재무제표로 자기조정 셀프신고(0원)",
      "1.5억 이상: 더존·세무사랑 전표 엑셀로 1회 외부조정 의뢰",
    ],
  },
];

export default function TaxHighIncomeStrategyPanel({ overview, doubleEntry, defaultExpanded = true }) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const ytdNet = Number(doubleEntry?.income_statement?.net_income || overview?.totals?.net_income || 0);
  const prevRev = Number(overview?.max_prev_year_revenue || 0);
  const usingEstimatedAnnual = prevRev >= 75_000_000 && ytdNet < 20_000_000;
  const basisIncome = usingEstimatedAnnual ? Math.round(prevRev * 0.65) : ytdNet;

  const activeBracket =
    TAX_BRACKETS.find((b) => basisIncome >= b.min && basisIncome < b.max) || TAX_BRACKETS[TAX_BRACKETS.length - 1];
  const savedPerMillion = (Math.round(activeBracket.effectiveRate * 10) / 10).toLocaleString("ko-KR");

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
                고소득 보험설계사 (연 7,500만 원 이상) 실전 절세 전략 도식 가이드
              </Typography>
              <Typography variant="caption" color="text.secondary">
                누진세율 구간을 미리 파악하고 12월 31일 전까지 공제·경비를 챙겨 세금을 합법적으로 줄이세요.
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
            {expanded ? "절세 전략 도식 접기" : "고소득 절세 전략 도식 보기"}
          </Button>
        </Stack>

        <Collapse in={expanded}>
          <Stack spacing={2.5} sx={{ pt: 0.5 }}>
            {/* 도식 1: 종합소득세 누진세율 구간 & 한계세율 절세 체감 바 */}
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5, bgcolor: "#F8FAFC" }}>
              <Stack spacing={1.5}>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  justifyContent="space-between"
                  alignItems={{ xs: "flex-start", sm: "center" }}
                  spacing={0.5}
                >
                  <Typography variant="subtitle2" fontWeight={800} color="#0F172A">
                    도식 ① 종합소득세 누진세율 구간 (지방소득세 10% 포함 실효 한계세율)
                  </Typography>
                  <Typography variant="caption" fontWeight={700} color="#475569">
                    {usingEstimatedAnnual
                      ? `직전연도 수입(${formatKrw(prevRev)}) 기준 추정 소득금액 약 ${formatKrw(basisIncome)} (당해 누적: ${formatKrw(ytdNet)})`
                      : `현재 당해 누적 소득금액 기준: ${formatKrw(basisIncome)}`}
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
                                label="예상 구간"
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
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <TrendingDownOutlinedIcon color="success" sx={{ fontSize: 20, flexShrink: 0 }} />
                  <Typography variant="body2" fontWeight={800} color="#065F46">
                    {`한계세율 ${activeBracket.effectiveRate}% 구간: 업무 경비·소득공제 100만 원을 추가로 챙길 때마다 세금이 약 ${savedPerMillion}만 원 줄어듭니다.`}
                  </Typography>
                </Box>
              </Stack>
            </Paper>

            {/* 도식 2: 고소득 설계사 6대 핵심 절세 전략 카드 (2x3 Grid) */}
            <Box>
              <Typography variant="subtitle2" fontWeight={800} color="#0F172A" mb={1.25}>
                도식 ② 고소득 설계사 6대 핵심 절세 카드 (공제·경비·가산세 방어)
              </Typography>
              <Grid container spacing={1.5}>
                {HIGH_INCOME_STRATEGIES.map((item) => (
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

            {/* 도식 3: 고소득 설계사 1년 절세 실행 타임라인 (4단계 플로우) */}
            <Box>
              <Stack direction="row" spacing={0.75} alignItems="center" mb={1.25}>
                <ShieldOutlinedIcon color="success" sx={{ fontSize: 18 }} />
                <Typography variant="subtitle2" fontWeight={800} color="#0F172A">
                  도식 ③ 연간 절세 실행 타임라인 (Q1 기초 → Q4 연말 골든타임 → 5월 신고)
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
                {YEARLY_TIMELINE.map((stage, idx) => (
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
                    {idx < YEARLY_TIMELINE.length - 1 && (
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
              ※ 본 절세 전략은 일반적인 세법 기준 참고 가이드이며, 개인별 공제 요건과 최종 신고 책임은 본인에게 있습니다.
            </Typography>
          </Stack>
        </Collapse>
      </Stack>
    </Paper>
  );
}
