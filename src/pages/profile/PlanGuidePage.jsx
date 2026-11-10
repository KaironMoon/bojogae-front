import { Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";
import { Link } from "react-router-dom";

import { useAuth } from "@/auth/AuthContext";
import { PLAN_COCKLE_NOTE, PLAN_INFO, SIGNUP_PLAN_CODES, planCockleAllowance } from "@/constants/plans";

export default function PlanGuidePage() {
  const { user } = useAuth();
  const isPersonalMember = user?.role === "USER" && !user.group_id;

  return (
    <Box component="main" sx={{ maxWidth: 1000, mx: "auto", p: { xs: 2, md: 4 } }}>
      <Stack spacing={3}>
        <Stack spacing={0.75}>
          <Typography variant="h4" component="h1" fontWeight={850}>요금 안내</Typography>
          <Typography color="text.secondary">보조개 개인회원 요금제의 가격과 제공 꼬막을 비교할 수 있습니다.</Typography>
        </Stack>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" }, gap: 2 }}>
          {SIGNUP_PLAN_CODES.map(code => {
            const plan = PLAN_INFO[code];
            const current = isPersonalMember && user.plan_code === code;
            return (
              <Paper component="article" key={code} variant="outlined" sx={{ p: 2.5, borderRadius: 3, borderColor: current ? "primary.main" : "divider" }}>
                <Stack spacing={1}>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                    <Typography variant="h6" component="h2" fontWeight={800}>{plan.name}</Typography>
                    {current && <Chip label="현재 요금제" color="primary" size="small" />}
                  </Stack>
                  <Typography variant="h5" component="p" fontWeight={800}>{plan.price} <Typography component="span" color="text.secondary">/ {plan.priceUnit}</Typography></Typography>
                  <Typography fontWeight={700}>{planCockleAllowance(code)}</Typography>
                  <Typography variant="body2" color="text.secondary">{plan.summary}</Typography>
                </Stack>
              </Paper>
            );
          })}
        </Box>

        <Stack spacing={1.5} alignItems="flex-start">
          <Typography variant="body2" color="text.secondary">{PLAN_COCKLE_NOTE}</Typography>
          {isPersonalMember && <Button component={Link} to="/profile#plan" variant="outlined">내 구독 관리</Button>}
          {user?.group_id && <Typography variant="body2" color="text.secondary">단체회원의 이용 조건은 소속 단체에 문의해 주세요.</Typography>}
        </Stack>
      </Stack>
    </Box>
  );
}
