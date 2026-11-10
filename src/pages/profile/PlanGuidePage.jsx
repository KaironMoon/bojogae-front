import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { Box, Button, Chip, Divider, Paper, Stack, Typography } from "@mui/material";
import { Link } from "react-router-dom";

import { useAuth } from "@/auth/AuthContext";
import { PLAN_INFO, SIGNUP_PLAN_CODES } from "@/constants/plans";

// 요금제 기본 제공분과 문서 생성 기본 차감 기준으로 안내하는 예상 횟수.
const DOCUMENT_ESTIMATES = {
  FREE: "30일간 문서 생성 약 20회",
  BASIC: "월 문서 생성 약 30회",
  STANDARD: "월 문서 생성 약 50회",
  PRO: "월 문서 생성 약 100회",
};

export default function PlanGuidePage() {
  const { user } = useAuth();
  const isPersonalMember = user?.role === "USER" && !user.group_id;

  return (
    <Box component="main" sx={{ maxWidth: 1280, mx: "auto", p: { xs: 2, md: 4 } }}>
      <Stack spacing={{ xs: 2.5, md: 3 }}>
        <Paper component="header" variant="outlined" sx={{
          position: "relative", overflow: "hidden", borderRadius: 4, p: { xs: 2.5, md: 4 },
          background: "linear-gradient(115deg, var(--bojogae-tint) 0%, #fff 95%)",
          "&::after": {
            content: '""', position: "absolute", pointerEvents: "none",
            width: 280, height: 280, right: -60, top: -150, borderRadius: "50%",
            border: "32px solid var(--bojogae-tint)", display: { xs: "none", sm: "block" },
          },
        }}>
          <Stack spacing={0.75} alignItems="flex-start" sx={{ position: "relative", zIndex: 1 }}>
            <Typography variant="overline" fontWeight={800} color="var(--bojogae-accent-ink)" sx={{ letterSpacing: ".06em" }}>
              개인회원 요금제
            </Typography>
            <Typography component="h1" sx={{ fontSize: { xs: 30, md: 40 }, lineHeight: 1.2, fontWeight: 900, letterSpacing: "-.04em" }}>
              요금 안내
            </Typography>
            <Typography color="text.secondary" sx={{ wordBreak: "keep-all" }}>
              보험 제안서 분석과 보고서 생성에 사용할 개인회원 요금제를 확인해 보세요.
            </Typography>
          </Stack>
        </Paper>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(4, minmax(0, 1fr))" }, gap: { xs: 1.5, md: 2 } }}>
          {SIGNUP_PLAN_CODES.map(code => {
            const plan = PLAN_INFO[code];
            const current = isPersonalMember && user.plan_code === code;
            return (
              <Paper component="article" key={code} aria-labelledby={`plan-${code}`} variant="outlined" sx={{
                p: { xs: 2.5, lg: 2.25 }, borderRadius: 3.5,
                borderColor: current ? "var(--bojogae-accent-ink)" : "var(--bojogae-line)",
                bgcolor: current ? "var(--bojogae-tint)" : "background.paper",
                boxShadow: current ? "0 8px 24px rgba(3,199,90,.10)" : undefined,
              }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1} sx={{ minHeight: 28 }}>
                  <Typography variant="h6" component="h2" id={`plan-${code}`} fontWeight={850} sx={{ fontSize: 18 }}>{plan.name}</Typography>
                  {current && <Chip label="현재 요금제" size="small" sx={{
                    flexShrink: 0, bgcolor: "var(--bojogae-tint)", color: "var(--bojogae-accent-ink)", fontWeight: 800,
                  }} />}
                </Stack>
                <Typography component="p" sx={{ mt: 1.75, lineHeight: 1.2, whiteSpace: "nowrap" }}>
                  <Typography component="span" sx={{ fontSize: { xs: 32, lg: 27, xl: 32 }, fontWeight: 900, letterSpacing: "-.04em", fontVariantNumeric: "tabular-nums" }}>
                    {plan.price}
                  </Typography>
                  <Typography component="span" variant="body2" color="text.secondary"> / {plan.priceUnit}</Typography>
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Typography variant="body2" fontWeight={650}>{DOCUMENT_ESTIMATES[code]}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, wordBreak: "keep-all" }}>{plan.summary}</Typography>
              </Paper>
            );
          })}
        </Box>

        <Paper component="section" aria-labelledby="plan-usage-note" variant="outlined" sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 3.5 }}>
          <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "stretch", sm: "center" }} justifyContent="space-between" spacing={2}>
            <Stack direction="row" spacing={1.5}>
              <Box sx={{ width: 42, height: 42, flexShrink: 0, display: "grid", placeItems: "center", borderRadius: 2,
                bgcolor: "var(--bojogae-tint)", color: "var(--bojogae-accent-ink)" }}>
                <InfoOutlinedIcon />
              </Box>
              <Box>
                <Typography id="plan-usage-note" component="h2" fontWeight={850}>이용 안내</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, wordBreak: "keep-all" }}>
                  월 이용량은 이용기간이 끝나면 만료됩니다.
                </Typography>
                {user?.group_id && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>단체회원의 이용 조건은 소속 단체에 문의해 주세요.</Typography>}
              </Box>
            </Stack>
            {isPersonalMember && (
              <Button component={Link} to="/profile#plan" variant="outlined" endIcon={<ArrowForwardRoundedIcon />}
                sx={{ minHeight: 44, flexShrink: 0, whiteSpace: "nowrap", fontWeight: 800 }}>
                내 구독 관리
              </Button>
            )}
          </Stack>
        </Paper>
      </Stack>
    </Box>
  );
}
