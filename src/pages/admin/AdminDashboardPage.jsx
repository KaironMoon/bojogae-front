import { useCallback, useEffect, useMemo, useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import AnalyticsOutlinedIcon from "@mui/icons-material/AnalyticsOutlined";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import AutorenewRoundedIcon from "@mui/icons-material/AutorenewRounded";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import EditNoteRoundedIcon from "@mui/icons-material/EditNoteRounded";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import HelpOutlineOutlinedIcon from "@mui/icons-material/HelpOutlineOutlined";
import LibraryBooksOutlinedIcon from "@mui/icons-material/LibraryBooksOutlined";
import MonetizationOnOutlinedIcon from "@mui/icons-material/MonetizationOnOutlined";
import PeopleOutlineRoundedIcon from "@mui/icons-material/PeopleOutlineRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import ReplayRoundedIcon from "@mui/icons-material/ReplayRounded";
import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import api from "../../services/api-caller";
import { getAnalyticsOverview } from "../../services/analytics-service";
import { isAdminMenuEligible } from "../../services/admin-menu-config";
import {
  getAdminMenu,
  getCachedAdminMenu,
  subscribeAdminMenuChanges,
} from "../../services/admin-menu-service";
import { listRequests } from "../../services/document-request-service";
import { listGroupInquiries } from "../../services/group-inquiry-service";
import { listHelpInquiries } from "../../services/help-inquiry-service";
import { getAdminProposals } from "../../services/proposal-service";
import { MenuIcon } from "../components/layout/userMenuIcons";
import {
  AdminEmptyState,
  AdminPageContainer,
  AdminPageHeader,
  AdminStatCard,
  AdminStatGrid,
} from "./components/AdminPageShell";

const STATUS_LABEL = {
  COMPLETED: "완료",
  PROCESSING: "생성 중",
  PENDING: "대기",
  FAILED: "실패",
  CANCELLED: "취소",
};

const STATUS_COLOR = {
  COMPLETED: "success",
  PROCESSING: "info",
  PENDING: "default",
  FAILED: "error",
  CANCELLED: "warning",
};

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getBillingAttentionCount(billingHealth) {
  if (!billingHealth) return 0;
  return (
    Number(billingHealth.review || 0)
    + Number(billingHealth.failed || 0)
    + Number(billingHealth.missing_renewals || 0)
  );
}

function extractTotalCount(data) {
  if (typeof data?.total === "number") return data.total;
  if (Array.isArray(data?.items)) return data.items.length;
  return 0;
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [overview, setOverview] = useState(null);
  const [groupInquiryCount, setGroupInquiryCount] = useState(0);
  const [qnaPendingCount, setQnaPendingCount] = useState(0);
  const [refundPendingCount, setRefundPendingCount] = useState(0);
  const [suggestionPendingCount, setSuggestionPendingCount] = useState(0);
  const [billingHealth, setBillingHealth] = useState(null);
  const [recentProposals, setRecentProposals] = useState([]);
  const [adminMenuItems, setAdminMenuItems] = useState(() => getCachedAdminMenu());

  useEffect(() => {
    let active = true;
    getAdminMenu()
      .then((res) => {
        if (active && Array.isArray(res?.items)) setAdminMenuItems(res.items);
      })
      .catch(() => {});
    const unsubscribe = subscribeAdminMenuChanges((items) => {
      if (active) setAdminMenuItems(items);
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");
    const [
      overviewRes,
      groupInqRes,
      qnaRes,
      refundRes,
      suggestionRes,
      reservationsRes,
      proposalsRes,
    ] = await Promise.allSettled([
      getAnalyticsOverview({ preset: "7d" }),
      listGroupInquiries(1, "PENDING"),
      listHelpInquiries(true, 1, "PENDING"),
      listRequests("refund", 1, true),
      listRequests("suggestion", 1, true),
      api.get("/api/v1/payments/admin/reservations"),
      getAdminProposals({ page: 1, page_size: 6 }),
    ]);

    let failedCount = 0;
    if (overviewRes.status === "fulfilled") setOverview(overviewRes.value);
    else failedCount += 1;

    if (groupInqRes.status === "fulfilled") setGroupInquiryCount(extractTotalCount(groupInqRes.value));
    else failedCount += 1;

    if (qnaRes.status === "fulfilled") setQnaPendingCount(extractTotalCount(qnaRes.value));
    else failedCount += 1;

    if (refundRes.status === "fulfilled") {
      const items = refundRes.value?.items || [];
      setRefundPendingCount(items.filter((item) => item.status === "PENDING").length);
    } else failedCount += 1;

    if (suggestionRes.status === "fulfilled") {
      const items = suggestionRes.value?.items || [];
      setSuggestionPendingCount(items.filter((item) => item.status === "PENDING").length);
    } else failedCount += 1;

    if (reservationsRes.status === "fulfilled") {
      setBillingHealth(reservationsRes.value?.data?.billing_health || null);
    } else failedCount += 1;

    if (proposalsRes.status === "fulfilled") {
      setRecentProposals(proposalsRes.value?.items || []);
    } else failedCount += 1;

    if (failedCount === 7) {
      setError("관리자 대시보드 데이터를 불러오지 못했습니다.");
    } else if (failedCount > 0) {
      setError("일부 운영 지표를 불러오지 못했습니다. 새로고침으로 다시 확인해 주세요.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const kpis = overview?.kpis;
  const signupSum = overview?.signup_summary;
  const billingAttention = getBillingAttentionCount(billingHealth);

  const quickMenuEntries = useMemo(() => {
    const flattened = [];
    for (const item of adminMenuItems) {
      if (!isAdminMenuEligible(item)) continue;
      if (item.path === "/admin/dashboard") continue;
      if (item.kind === "group" || (item.children || []).length > 0) {
        const visibleChildren = (item.children || []).filter((child) => child?.visible !== false && child?.path);
        for (const child of visibleChildren) {
          flattened.push({
            key: child.key || child.path,
            label: child.label,
            parentLabel: item.label,
            path: child.path,
            icon_key: item.icon_key,
            tone: item.tone,
            badge: child.badge || item.badge,
          });
        }
        continue;
      }
      if (item.path) {
        flattened.push({
          key: item.key || item.path,
          label: item.label,
          parentLabel: null,
          path: item.path,
          icon_key: item.icon_key,
          tone: item.tone,
          badge: item.badge,
        });
      }
    }
    return flattened;
  }, [adminMenuItems]);

  const pendingQueues = [
    {
      key: "group-inquiries",
      title: "단체 문의 대기",
      count: groupInquiryCount,
      desc: "도입·조직 문의 미처리 건",
      path: "/admin/group-inquiries",
      icon: GroupOutlinedIcon,
      color: "#0284C7",
      bg: "#F0F9FF",
    },
    {
      key: "help-inquiries",
      title: "QnA 문의 대기",
      count: qnaPendingCount,
      desc: "설계사 1:1 문의 답변 대기",
      path: "/admin/help-inquiries",
      icon: HelpOutlineOutlinedIcon,
      color: "#7C3AED",
      bg: "#F5F3FF",
    },
    {
      key: "refund-requests",
      title: "환불 요청 대기",
      count: refundPendingCount,
      desc: "검토가 필요한 환불 신청",
      path: "/admin/refund-requests",
      icon: ReplayRoundedIcon,
      color: "#E11D48",
      bg: "#FFF1F2",
    },
    {
      key: "suggestions",
      title: "개선 건의 대기",
      count: suggestionPendingCount,
      desc: "보고서 개선 건의 접수",
      path: "/admin/document-suggestions",
      icon: EditNoteRoundedIcon,
      color: "#9333EA",
      bg: "#FAF5FF",
    },
    {
      key: "billing-attention",
      title: "예약결제 확인 필요",
      count: billingAttention,
      desc: billingHealth
        ? `검토 ${billingHealth.review || 0} · 실패 ${billingHealth.failed || 0} · 누락 ${billingHealth.missing_renewals || 0}`
        : "자동결제 실패 · 누락 점검",
      path: "/admin/payment-reservations",
      icon: WarningAmberRoundedIcon,
      color: "#D97706",
      bg: "#FFFBEB",
    },
  ];

  return (
    <AdminPageContainer>
      <AdminPageHeader
        icon={DashboardOutlinedIcon}
        badge="ADMIN HOME"
        title="관리자 대시보드"
        description="최근 7일 핵심 지표와 미처리 운영 대기열, 전체 관리자 메뉴 바로가기를 한눈에 확인합니다."
        actions={(
          <>
            <Button
              size="small"
              variant="outlined"
              startIcon={<TuneOutlinedIcon />}
              component={RouterLink}
              to="/admin/proposal-settings"
            >
              관리자 메뉴 구성
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<AnalyticsOutlinedIcon />}
              component={RouterLink}
              to="/admin/usage"
            >
              상세 통계
            </Button>
            <Button
              size="small"
              variant="contained"
              startIcon={<RefreshRoundedIcon />}
              onClick={loadDashboard}
              disabled={loading}
              sx={{ bgcolor: "#03C75A", "&:hover": { bgcolor: "#00A84B" } }}
            >
              새로고침
            </Button>
          </>
        )}
      />

      {error && (
        <Alert severity="warning" onClose={() => setError("")} sx={{ mb: 2, borderRadius: 2.5 }}>
          {error}
        </Alert>
      )}

      <AdminStatGrid>
        <AdminStatCard
          label="최근 7일 신규 회원가입"
          value={`${(kpis?.new_person_signups || 0).toLocaleString()}명`}
          subtext={`오늘 +${signupSum?.today || 0}명 · 이번주 +${signupSum?.this_week || 0}명`}
          icon={PeopleOutlineRoundedIcon}
          color="#03C75A"
          bg="#ECFDF5"
          onClick={() => navigate("/admin/usage")}
        />
        <AdminStatCard
          label="주간 활성 설계사 (WAU)"
          value={`${(kpis?.wau || 0).toLocaleString()}명`}
          subtext={`일평균 DAU ${kpis?.dau_avg || 0}명 · MAU ${(kpis?.mau || 0).toLocaleString()}명`}
          icon={AutorenewRoundedIcon}
          color="#1D4ED8"
          bg="#EFF6FF"
          onClick={() => navigate("/admin/usage")}
        />
        <AdminStatCard
          label="최근 7일 꼬막 사용량"
          value={`${(kpis?.kkomak_used || 0).toLocaleString()}개`}
          subtext={`총 ${(kpis?.kkomak_count || 0).toLocaleString()}회 생성 · 인당 ${(kpis?.kkomak_per_spender || 0).toLocaleString()}개`}
          icon={LibraryBooksOutlinedIcon}
          color="#6B38FB"
          bg="#F5F3FF"
          onClick={() => navigate("/admin/proposals")}
        />
        <AdminStatCard
          label="최근 7일 순매출"
          value={`${(kpis?.revenue_krw || 0).toLocaleString()}원`}
          subtext={`유료 ${(kpis?.paid_persons || 0).toLocaleString()}명 · 전환율 ${kpis?.paid_conversion_pct || 0}%`}
          icon={MonetizationOnOutlinedIcon}
          color="#D97706"
          bg="#FFFBEB"
          onClick={() => navigate("/admin/payment-reservations")}
        />
      </AdminStatGrid>

      <Paper variant="outlined" sx={{ p: { xs: 1.75, sm: 2.25 }, borderRadius: 3, mb: 2.5, bgcolor: "#FFFFFF" }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 850, color: "#0F172A" }}>
              운영 대기열 · 즉시 확인 필요
            </Typography>
            <Typography variant="caption" color="text.secondary">
              카드를 누르면 해당 처리 화면으로 바로 이동합니다.
            </Typography>
          </Box>
        </Stack>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(5, 1fr)" },
            gap: 1.25,
          }}
        >
          {pendingQueues.map((queue) => {
            const Icon = queue.icon;
            const hasPending = queue.count > 0;
            return (
              <Paper
                key={queue.key}
                variant="outlined"
                onClick={() => navigate(queue.path)}
                sx={{
                  p: 1.5,
                  borderRadius: 2.5,
                  cursor: "pointer",
                  borderColor: hasPending ? queue.color : "#E2E8F0",
                  bgcolor: hasPending ? queue.bg : "#F8FAFC",
                  transition: "transform 120ms ease, box-shadow 120ms ease",
                  "&:hover": {
                    transform: "translateY(-1px)",
                    boxShadow: "0 4px 12px rgba(15, 23, 42, 0.06)",
                  },
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: "#334155" }}>
                    {queue.title}
                  </Typography>
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: 1.5,
                      bgcolor: "#FFFFFF",
                      color: queue.color,
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    <Icon fontSize="small" />
                  </Box>
                </Stack>
                <Typography
                  sx={{
                    mt: 0.75,
                    fontSize: "1.35rem",
                    fontWeight: 900,
                    color: hasPending ? queue.color : "#0F172A",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {queue.count.toLocaleString()}건
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>
                  {queue.desc}
                </Typography>
              </Paper>
            );
          })}
        </Box>
      </Paper>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "1.15fr 1fr" },
          gap: 2.5,
          alignItems: "start",
        }}
      >
        <Paper variant="outlined" sx={{ p: { xs: 1.75, sm: 2.25 }, borderRadius: 3, bgcolor: "#FFFFFF" }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 850, color: "#0F172A" }}>
                최근 보고서 생성 현황
              </Typography>
              <Typography variant="caption" color="text.secondary">
                최근 요청된 보고서 6건의 처리 상태를 확인합니다.
              </Typography>
            </Box>
            <Button
              size="small"
              endIcon={<ArrowForwardRoundedIcon />}
              component={RouterLink}
              to="/admin/proposals"
            >
              전체 보기
            </Button>
          </Stack>

          {loading && recentProposals.length === 0 ? (
            <Box sx={{ py: 6, display: "grid", placeItems: "center" }}>
              <CircularProgress size={26} />
            </Box>
          ) : recentProposals.length === 0 ? (
            <AdminEmptyState
              icon={LibraryBooksOutlinedIcon}
              title="최근 생성된 보고서가 없습니다."
              description="보고서 생성 이력이 쌓이면 이곳에 표시됩니다."
            />
          ) : (
            <Stack spacing={1}>
              {recentProposals.map((item) => (
                <Paper
                  key={item.id}
                  variant="outlined"
                  onClick={() => navigate("/admin/proposals")}
                  sx={{
                    p: 1.35,
                    borderRadius: 2,
                    cursor: "pointer",
                    borderColor: "#E2E8F0",
                    "&:hover": { bgcolor: "#F8FAFC", borderColor: "#CBD5E1" },
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1.25}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={800} noWrap>
                        {item.title || `보고서 #${item.id}`}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }} noWrap>
                        #{item.id} · {item.prompt_title || "-"} · {item.user_name || item.user_email || `회원 #${item.user_id}`}
                      </Typography>
                    </Box>
                    <Stack alignItems="flex-end" spacing={0.35} sx={{ flexShrink: 0 }}>
                      <Chip
                        size="small"
                        label={STATUS_LABEL[item.status] || item.status || "-"}
                        color={STATUS_COLOR[item.status] || "default"}
                        sx={{ height: 22, fontWeight: 750 }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {formatDateTime(item.started_at || item.created_at)}
                      </Typography>
                    </Stack>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          )}
        </Paper>

        <Paper variant="outlined" sx={{ p: { xs: 1.75, sm: 2.25 }, borderRadius: 3, bgcolor: "#FFFFFF" }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 850, color: "#0F172A" }}>
                관리자 메뉴 바로가기
              </Typography>
              <Typography variant="caption" color="text.secondary">
                관리자 메뉴 설정 순서와 그룹에 맞춰 표시됩니다.
              </Typography>
            </Box>
            <Button
              size="small"
              component={RouterLink}
              to="/admin/proposal-settings"
            >
              메뉴 편집
            </Button>
          </Stack>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
              gap: 1,
            }}
          >
            {quickMenuEntries.map((entry) => (
              <Button
                key={entry.key}
                component={RouterLink}
                to={entry.path}
                variant="outlined"
                color="inherit"
                sx={{
                  justifyContent: "flex-start",
                  textAlign: "left",
                  px: 1.25,
                  py: 1,
                  borderRadius: 2,
                  borderColor: "#E2E8F0",
                  bgcolor: "#FFFFFF",
                  "&:hover": { bgcolor: "#F8FAFC", borderColor: "#03C75A" },
                }}
              >
                <MenuIcon iconKey={entry.icon_key} tone={entry.tone} />
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  {entry.parentLabel && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", lineHeight: 1.15 }} noWrap>
                      {entry.parentLabel}
                    </Typography>
                  )}
                  <Typography variant="body2" fontWeight={750} color="#0F172A" noWrap>
                    {entry.label}
                  </Typography>
                </Box>
                {entry.badge && (
                  <Chip
                    size="small"
                    label={entry.badge}
                    sx={{ ml: 0.75, height: 20, fontSize: "0.7rem", fontWeight: 800, bgcolor: "#ECFDF5", color: "#008A49" }}
                  />
                )}
              </Button>
            ))}
          </Box>
        </Paper>
      </Box>
    </AdminPageContainer>
  );
}
