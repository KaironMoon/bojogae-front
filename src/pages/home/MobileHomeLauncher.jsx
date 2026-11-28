/* eslint-disable react/prop-types */
import { Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import AccountBalanceOutlinedIcon from "@mui/icons-material/AccountBalanceOutlined";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import EditNoteRoundedIcon from "@mui/icons-material/EditNoteRounded";
import EventNoteOutlinedIcon from "@mui/icons-material/EventNoteOutlined";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import HelpOutlineOutlinedIcon from "@mui/icons-material/HelpOutlineOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ManageAccountsOutlinedIcon from "@mui/icons-material/ManageAccountsOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";

const CORE_FEATURES = [
  {
    title: "내 고객 관리",
    desc: "고객 목록 · 주변 지도",
    to: "/crm/customers",
    icon: PeopleAltOutlinedIcon,
    color: "#4F46E5",
    bg: "#EEF2FF",
  },
  {
    title: "내 계약 관리",
    desc: "계약 현황 · 갱신 관리",
    to: "/crm/contracts",
    icon: DescriptionOutlinedIcon,
    color: "#2563EB",
    bg: "#EFF6FF",
  },
  {
    title: "보험금 청구",
    desc: "모바일 팩스 · 청구내역",
    to: "/claims/new",
    icon: ReceiptLongOutlinedIcon,
    color: "#059669",
    bg: "#ECFDF5",
  },
  {
    title: "할 일 · 방문 일정",
    desc: "오늘 일정 · 고객 이벤트",
    to: "/crm/tasks",
    icon: EventNoteOutlinedIcon,
    color: "#E11D48",
    bg: "#FFF1F2",
  },
  {
    title: "보험사 정보·링크",
    desc: "고객센터 · 전산 · 카드납",
    to: "/insurers",
    icon: AccountBalanceOutlinedIcon,
    color: "#7C3AED",
    bg: "#F5F3FF",
  },
  {
    title: "카톡 상용구·서명",
    desc: "메시지 템플릿 관리",
    to: "/kakao-message-templates/snippets",
    icon: ChatBubbleOutlineRoundedIcon,
    color: "#D97706",
    bg: "#FFFBEB",
  },
];

const SUPPORT_FEATURES = [
  { title: "내 꼬막", desc: "보유 잔액 · 내역", to: "/my-coins", icon: AccountBalanceWalletOutlinedIcon },
  { title: "요금 안내", desc: "플랜 · 혜택 보기", to: "/plans", icon: InfoOutlinedIcon },
  { title: "게시판 · 소식", desc: "공지 · 업계소식 · 지식", to: "/boards/notices", icon: ArticleOutlinedIcon },
  { title: "환불 · 개선 건의", desc: "건의 · 환불 요청", to: "/document-suggestions", icon: EditNoteRoundedIcon },
  { title: "도움말 · FAQ", desc: "자주 묻는 질문 · 문의", to: "/help/faq", icon: HelpOutlineOutlinedIcon },
  { title: "내 정보 수정", desc: "계정 · 구독 설정", to: "/profile", icon: ManageAccountsOutlinedIcon },
];

export default function MobileHomeLauncher({
  user,
  promptCount,
  favoriteCount,
  onOpenDashboard,
}) {
  const displayName = user?.display_name || user?.name || "설계사";
  const supportItems = [...SUPPORT_FEATURES];
  if (user?.group_role === "LEADER") {
    supportItems.push({ title: "조직 관리", desc: "구성원 · 꼬막 배분", to: "/group", icon: GroupOutlinedIcon });
  }
  if (user?.role === "ADMIN") {
    supportItems.push({ title: "관리자 메뉴", desc: "통계 · 운영 관리", to: "/admin/usage", icon: AdminPanelSettingsOutlinedIcon });
  }

  return (
    <Box sx={{ p: 1.75, pb: 3, maxWidth: 640, mx: "auto", minWidth: 0 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1.5} sx={{ mb: 2 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h6" sx={{ fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1.25 }}>
            {displayName}님, 무엇을 할까요?
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.4 }}>
            자주 쓰는 기능을 바로 선택해 시작하세요.
          </Typography>
        </Box>
        <Button
          type="button"
          size="small"
          variant="outlined"
          startIcon={<DashboardOutlinedIcon fontSize="small" />}
          onClick={onOpenDashboard}
          sx={{
            flexShrink: 0,
            borderRadius: 99,
            fontWeight: 800,
            whiteSpace: "nowrap",
            px: 1.5,
            minHeight: 36,
            bgcolor: "#FFFFFF",
          }}
        >
          홈 대시보드
        </Button>
      </Stack>

      <Paper
        component={Link}
        to="/proposals"
        elevation={0}
        sx={{
          display: "block",
          textDecoration: "none",
          p: 2.25,
          mb: 2.5,
          borderRadius: "18px",
          background: "linear-gradient(135deg, #121314 0%, #132A21 55%, #006E43 100%)",
          color: "#FFFFFF",
          boxShadow: "0 10px 24px rgba(3, 199, 90, 0.18)",
        }}
      >
        <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mb: 1.25 }}>
          <Chip
            icon={<AutoAwesomeRoundedIcon sx={{ fontSize: "14px !important", color: "#34D399 !important" }} />}
            label="BOJOGAE AI"
            size="small"
            sx={{
              height: 24,
              bgcolor: "rgba(3, 199, 90, 0.2)",
              color: "#6EE7B7",
              border: "1px solid rgba(3, 199, 90, 0.45)",
              fontWeight: 900,
              fontSize: 11,
            }}
          />
          {typeof promptCount === "number" && (
            <Chip
              label={`총 ${promptCount}종`}
              size="small"
              sx={{ height: 24, bgcolor: "rgba(255,255,255,0.12)", color: "#F8FAFC", fontWeight: 750, fontSize: 11 }}
            />
          )}
          {favoriteCount > 0 && (
            <Chip
              label={`즐겨찾기 ${favoriteCount}`}
              size="small"
              sx={{ height: 24, bgcolor: "rgba(245,158,11,0.22)", color: "#FDE68A", fontWeight: 800, fontSize: 11 }}
            />
          )}
        </Stack>

        <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1.5}>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: 19, fontWeight: 900, letterSpacing: "-0.02em", color: "#FFFFFF" }}>
              보고서 만들기
            </Typography>
            <Typography variant="caption" sx={{ color: "#CBD5E1", display: "block", mt: 0.35, lineHeight: 1.4 }}>
              카테고리별로 AI 보장분석·리모델링·청구 보고서 생성
            </Typography>
          </Box>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              bgcolor: "#03C75A",
              color: "#FFFFFF",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            <ArrowForwardRoundedIcon fontSize="small" />
          </Box>
        </Stack>
      </Paper>

      <Typography variant="subtitle2" sx={{ fontWeight: 850, color: "#0F172A", mb: 1.25 }}>
        핵심 업무
      </Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 1.25, mb: 2.5 }}>
        {CORE_FEATURES.map((item) => {
          const IconComponent = item.icon;
          return (
            <Paper
              key={item.to}
              component={Link}
              to={item.to}
              variant="outlined"
              sx={{
                display: "block",
                textDecoration: "none",
                p: 1.6,
                borderRadius: 3,
                bgcolor: "#FFFFFF",
                transition: "border-color 140ms ease, transform 140ms ease",
                "&:hover": { borderColor: "#03C75A" },
              }}
            >
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 2.25,
                  bgcolor: item.bg,
                  color: item.color,
                  display: "grid",
                  placeItems: "center",
                  mb: 1,
                }}
              >
                <IconComponent fontSize="small" />
              </Box>
              <Typography variant="body2" fontWeight={850} color="#0F172A">
                {item.title}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25, lineHeight: 1.35 }}>
                {item.desc}
              </Typography>
            </Paper>
          );
        })}
      </Box>

      <Typography variant="subtitle2" sx={{ fontWeight: 850, color: "#0F172A", mb: 1.25 }}>
        계정 · 소식 · 지원
      </Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 1, mb: 2.5 }}>
        {supportItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <Paper
              key={item.to}
              component={Link}
              to={item.to}
              variant="outlined"
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.1,
                textDecoration: "none",
                p: 1.35,
                borderRadius: 2.5,
                bgcolor: "#FFFFFF",
                minWidth: 0,
                "&:hover": { borderColor: "#03C75A" },
              }}
            >
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 2,
                  bgcolor: "#F1F5F9",
                  color: "#475569",
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                }}
              >
                <IconComponent sx={{ fontSize: 18 }} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" fontWeight={800} color="#0F172A" noWrap>
                  {item.title}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontSize: 11 }} noWrap>
                  {item.desc}
                </Typography>
              </Box>
            </Paper>
          );
        })}
      </Box>

      <Paper
        component="button"
        type="button"
        variant="outlined"
        onClick={onOpenDashboard}
        sx={{
          width: "100%",
          p: 1.75,
          borderRadius: 3,
          bgcolor: "#F8FAFC",
          borderColor: "divider",
          textAlign: "left",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1.5,
          "&:hover": { borderColor: "#03C75A", bgcolor: "#ECFDF5" },
        }}
      >
        <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: 2.5,
              bgcolor: "#FFFFFF",
              border: "1px solid #E2E8F0",
              color: "#03C75A",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            <DashboardOutlinedIcon fontSize="small" />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" fontWeight={850} color="#0F172A">
              홈 대시보드 보기
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
              배너 · 인기 보고서 · 최근 작업 · 고객 이벤트
            </Typography>
          </Box>
        </Stack>
        <ChevronRightRoundedIcon sx={{ color: "#64748B", flexShrink: 0 }} />
      </Paper>
    </Box>
  );
}
