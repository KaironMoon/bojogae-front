import { Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import { useNavigate } from "react-router-dom";
import { AdminPageContainer, AdminPageHeader } from "@/pages/admin/components/AdminPageShell";

const QUICK_ADMIN_LINKS = [
  { label: "통계 · 분석 대시보드", path: "/admin/usage" },
  { label: "설계사 관리", path: "/admin/users" },
  { label: "꼬막 지급·회수", path: "/admin/points" },
  { label: "결제·환불 처리", path: "/admin/payment-support" },
  { label: "보고서 관리", path: "/admin/proposals" },
  { label: "설정 및 서식", path: "/admin/proposal-settings" },
];

function Info() {
  const navigate = useNavigate();

  const envRows = [
    { label: "API 기본 주소 (VITE_API_BASE_URL)", value: import.meta.env.VITE_API_BASE_URL || "(동일 출처 / 프록시)" },
    { label: "실행 모드 (MODE)", value: import.meta.env.MODE },
    { label: "현재 Origin", value: typeof window !== "undefined" ? window.location.origin : "-" },
    { label: "뷰포트 크기", value: typeof window !== "undefined" ? `${window.innerWidth} × ${window.innerHeight}px` : "-" },
  ];

  return (
    <AdminPageContainer maxWidth={960}>
      <AdminPageHeader
        icon={InfoOutlinedIcon}
        badge={import.meta.env.MODE}
        title="시스템 · 환경 정보"
        description="현재 프론트엔드 빌드 환경과 API 연동 상태를 확인하고 주요 관리 화면으로 빠르게 이동할 수 있습니다."
      />

      <Stack spacing={2.5}>
        <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, bgcolor: "#FFFFFF" }}>
          <Typography variant="subtitle1" fontWeight={850} sx={{ mb: 1.5 }}>
            런타임 구성
          </Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5 }}>
            {envRows.map((row) => (
              <Paper key={row.label} variant="outlined" sx={{ p: 1.5, borderRadius: 2, bgcolor: "#F8FAFC" }}>
                <Typography variant="caption" color="text.secondary" fontWeight={750} sx={{ display: "block" }}>
                  {row.label}
                </Typography>
                <Typography variant="body2" fontWeight={800} sx={{ mt: 0.4, overflowWrap: "anywhere" }}>
                  {row.value}
                </Typography>
              </Paper>
            ))}
          </Box>
        </Paper>

        <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, bgcolor: "#FFFFFF" }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
            <Typography variant="subtitle1" fontWeight={850}>관리자 빠른 이동</Typography>
            <Chip size="small" label="BOJOGAE Admin" color="success" variant="outlined" />
          </Stack>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" }, gap: 1 }}>
            {QUICK_ADMIN_LINKS.map((item) => (
              <Button
                key={item.path}
                variant="outlined"
                endIcon={<OpenInNewRoundedIcon fontSize="small" />}
                onClick={() => navigate(item.path)}
                sx={{ justifyContent: "space-between", py: 1.1, px: 1.5, borderRadius: 2, fontWeight: 750 }}
              >
                {item.label}
              </Button>
            ))}
          </Box>
        </Paper>
      </Stack>
    </AdminPageContainer>
  );
}

export default Info;
