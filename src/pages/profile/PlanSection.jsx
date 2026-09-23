import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";

import { PLAN_INFO, PLAN_RANK, planName } from "@/constants/plans";
import { cancelPlanRequest, getMyPlan, requestPlanChange } from "@/services/profile-service";

const CHANGE_OPTIONS = ["BASIC", "STANDARD", "PRO"];

const errorMessages = {
  already_on_plan: "이미 사용 중인 요금제입니다.",
  plan_not_available: "선택할 수 없는 요금제입니다.",
  group_account_use_group_management: "그룹 계정은 그룹 관리에서 이용해 주세요.",
};

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString("ko-KR") : "-";
}

function changeKind(current, target) {
  if (target === "FREE") return "cancel";
  if (current === "FREE") return "start";
  return PLAN_RANK[target] > PLAN_RANK[current] ? "upgrade" : "downgrade";
}

function changeDescription(plan, target) {
  if (target === plan.plan_code) {
    return `예약된 변경을 철회하고 ${planName(target)} 요금제를 계속 유지합니다.`;
  }
  const kind = changeKind(plan.plan_code, target);
  const targetInfo = PLAN_INFO[target];
  if (kind === "cancel") {
    return `승인되면 다음 지급일(${formatDate(plan.current_period_end)})부터 무료로 전환되고 월 포인트 지급이 중단됩니다. 이미 받은 포인트는 만료일까지 사용할 수 있습니다.`;
  }
  if (kind === "start") {
    return `승인되는 날부터 ${targetInfo.name}(${targetInfo.price}/월)이 적용되고 매월 ${targetInfo.monthlyPoints}P가 지급됩니다.`;
  }
  if (kind === "upgrade") {
    const diff = targetInfo.monthlyPoints - (PLAN_INFO[plan.plan_code].monthlyPoints || 0);
    return `승인 즉시 ${targetInfo.name}이 적용되고, 이번 주기 차액 ${diff}P가 바로 지급됩니다. 다음 지급일부터 매월 ${targetInfo.monthlyPoints}P가 지급됩니다.`;
  }
  return `승인되면 다음 지급일(${formatDate(plan.current_period_end)})부터 ${targetInfo.name}(매월 ${targetInfo.monthlyPoints}P)이 적용됩니다.`;
}

function PlanSection() {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [target, setTarget] = useState(null);

  const load = useCallback(async () => {
    try {
      setPlan(await getMyPlan());
      setError("");
    } catch {
      setError("요금제 정보를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!loading && window.location.hash === "#plan") {
      document.getElementById("plan")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [loading]);

  const submit = async () => {
    setWorking(true);
    setError("");
    try {
      await requestPlanChange(target);
      setTarget(null);
      await load();
    } catch (requestError) {
      setError(errorMessages[requestError.response?.data?.detail] || "요금제 변경을 신청하지 못했습니다.");
    } finally {
      setWorking(false);
    }
  };

  const cancel = async () => {
    setWorking(true);
    setError("");
    try {
      await cancelPlanRequest(plan.pending_request.id);
      await load();
    } catch {
      setError("신청을 취소하지 못했습니다.");
    } finally {
      setWorking(false);
    }
  };

  if (loading) {
    return (
      <Paper id="plan" elevation={0} sx={{ p: 3, mb: 3, border: "1px solid", borderColor: "divider", borderRadius: 3, textAlign: "center" }}>
        <CircularProgress size={24} />
      </Paper>
    );
  }
  if (!plan || plan.is_group_account) return null;

  const current = plan.plan_code;
  const currentInfo = PLAN_INFO[current] || PLAN_INFO.FREE;
  const pending = plan.pending_request;

  return (
    <Paper id="plan" elevation={0} sx={{ p: { xs: 2.5, md: 3 }, mb: 3, border: "1px solid", borderColor: "divider", borderRadius: 3 }}>
      <Stack spacing={2}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box sx={{ width: 44, height: 44, display: "grid", placeItems: "center", borderRadius: 2.5, color: "primary.main", bgcolor: "#eff6ff" }}>
            <WorkspacePremiumRoundedIcon />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" color="text.secondary">내 요금제</Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="h5" fontWeight={850}>{currentInfo.name}</Typography>
              {current !== "FREE" && <Chip size="small" label={`${currentInfo.price} / 월`} />}
            </Stack>
          </Box>
        </Stack>

        {current !== "FREE" && (
          <Typography variant="body2" color="text.secondary">
            매월 {plan.monthly_points ?? "-"}P 지급 · 이번 주기 {formatDate(plan.current_period_start)} ~ {formatDate(plan.current_period_end)} · 남은 포인트는 다음 지급일에 만료됩니다.
          </Typography>
        )}

        {plan.next_plan_code && (
          <Alert severity="info">
            {formatDate(plan.next_plan_effective_at)}부터 {plan.next_plan_code === "FREE" ? "무료로 전환(해지)" : `${planName(plan.next_plan_code)} 요금제`}가 적용될 예정입니다.
          </Alert>
        )}

        {pending && (
          <Alert
            severity="warning"
            action={<Button color="inherit" size="small" disabled={working} onClick={cancel}>신청 취소</Button>}
          >
            {pending.requested_plan_code === "FREE" ? "해지" : `${planName(pending.requested_plan_code)} 변경`} 신청이 관리자 승인 대기 중입니다. ({formatDate(pending.requested_at)})
          </Alert>
        )}

        {error && <Alert severity="error">{error}</Alert>}

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          {CHANGE_OPTIONS.map((code) => {
            const info = PLAN_INFO[code];
            const isCurrent = code === current && !plan.next_plan_code;
            return (
              <Button
                key={code}
                variant={isCurrent ? "contained" : "outlined"}
                disabled={working || isCurrent || info.comingSoon || pending?.requested_plan_code === code}
                onClick={() => setTarget(code)}
                sx={{ flex: 1, flexDirection: "column", py: 1.25 }}
              >
                <Typography fontWeight={800} fontSize={14}>{info.name}</Typography>
                <Typography fontSize={11}>{info.comingSoon ? "준비 중" : isCurrent ? "사용 중" : `${info.price} · 월 ${info.monthlyPoints}P`}</Typography>
              </Button>
            );
          })}
        </Stack>
        {current !== "FREE" && plan.next_plan_code !== "FREE" && (
          <Button color="inherit" size="small" disabled={working || pending?.requested_plan_code === "FREE"} onClick={() => setTarget("FREE")} sx={{ alignSelf: "flex-end", color: "text.secondary" }}>
            요금제 해지 신청
          </Button>
        )}
      </Stack>

      <Dialog open={Boolean(target)} onClose={() => !working && setTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={800}>{target === "FREE" ? "요금제 해지 신청" : `${planName(target)} 요금제 신청`}</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5}>
            {target && <Typography variant="body2">{changeDescription(plan, target)}</Typography>}
            {pending && <Alert severity="info">대기 중인 기존 신청은 자동으로 취소됩니다.</Alert>}
            <Typography variant="caption" color="text.secondary">관리자 승인 후 적용됩니다.</Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button color="inherit" disabled={working} onClick={() => setTarget(null)}>닫기</Button>
          <Button variant="contained" disabled={working} onClick={submit}>{working ? <CircularProgress size={20} color="inherit" /> : "신청하기"}</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

export default PlanSection;
