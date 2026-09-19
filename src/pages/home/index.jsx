/* eslint-disable react/prop-types */
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import CampaignRoundedIcon from "@mui/icons-material/CampaignRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CoinsRoundedIcon from "@mui/icons-material/PaidRounded";
import LocalFireDepartmentRoundedIcon from "@mui/icons-material/LocalFireDepartmentRounded";
import {
  Alert, Box, Button, Chip, CircularProgress, Paper, Skeleton, Stack, Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "@/auth/AuthContext";
import { dashboardBannerImageUrl, getDashboard } from "@/services/dashboard-service";
import { promptPreviewImageUrl } from "@/services/prompt-service";

const STATUS = {
  QUEUED: ["대기 중", "default"], RUNNING: ["생성 중", "primary"],
  CANCEL_REQUESTED: ["취소 중", "warning"], COMPLETED: ["완료", "success"],
  FAILED: ["실패", "error"], CANCELLED: ["취소됨", "default"],
};
const BOARD_NAMES = { notices: "공지사항", "industry-news": "업계소식", "insurance-knowledge": "보험 지식" };

function StatCard({ icon, label, value, accent }) {
  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, minWidth: 0, borderColor: "#e7ebf2" }}>
      <Stack direction="row" spacing={1.3} alignItems="center">
        <Box sx={{ width: 38, height: 38, borderRadius: 2.2, display: "grid", placeItems: "center", bgcolor: `${accent}14`, color: accent }}>{icon}</Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="caption" color="text.secondary">{label}</Typography>
          <Typography variant="h6" fontWeight={850} lineHeight={1.2}>{Number(value || 0).toLocaleString("ko-KR")}</Typography>
        </Box>
      </Stack>
    </Paper>
  );
}

function PromptCard({ prompt, rank }) {
  const preview = prompt.preview_images?.[0];
  const [previewFailed, setPreviewFailed] = useState(false);
  const showPreview = preview && !previewFailed;
  return (
    <Paper variant="outlined" sx={{ flex: "0 0 auto", width: { xs: "min(78vw, 240px)", sm: 215 }, borderRadius: 3, overflow: "hidden", borderColor: "#e7ebf2", transition: "transform .18s, box-shadow .18s", scrollSnapAlign: "start", "&:hover": { transform: "translateY(-3px)", boxShadow: "0 12px 30px rgba(29,47,78,.10)" } }}>
      <Box sx={{ height: 146, position: "relative", overflow: "hidden", bgcolor: "#eef3ff" }}>
        {showPreview ? (
          <Box
            component="img"
            src={promptPreviewImageUrl(prompt.id, prompt.preview_image_revision, preview.id)}
            alt={`${prompt.title} 미리보기`}
            onError={() => setPreviewFailed(true)}
            sx={{ width: "100%", height: "100%", display: "block", objectFit: "cover", objectPosition: "top center" }}
          />
        ) : (
          <Box
            sx={{
              width: "100%",
              height: "100%",
              position: "relative",
              overflow: "hidden",
              display: "grid",
              placeItems: "center",
              background: "linear-gradient(145deg, #2d2a36 0%, #403947 58%, #554550 100%)",
            }}
          >
            <Box sx={{ position: "absolute", width: 104, height: 104, top: -45, right: -28, borderRadius: "50%", bgcolor: "rgba(255,151,135,.22)" }} />
            <Box sx={{ position: "absolute", width: 78, height: 78, left: -28, bottom: -34, borderRadius: "50%", bgcolor: "rgba(190,167,232,.18)" }} />
            <Box sx={{ position: "absolute", width: 58, height: 3, top: 17, left: 14, borderRadius: 99, bgcolor: "rgba(255,244,225,.48)" }} />
            <Box component="img" src="/bojogae-icon.png" alt="" sx={{ width: 76, height: 76, display: "block", position: "relative", zIndex: 1, border: "1px solid rgba(255,244,225,.18)", borderRadius: 2.5 }} />
            <Typography sx={{ position: "absolute", left: 12, bottom: 8, zIndex: 1, color: "rgba(255,244,225,.82)", fontSize: 9, fontWeight: 900, letterSpacing: ".12em" }}>BOJOGAE REPORT</Typography>
          </Box>
        )}
        {rank && <Box sx={{ position: "absolute", top: 10, left: 10, width: 30, height: 30, borderRadius: 2, bgcolor: rank <= 3 ? "#111827" : "rgba(17,24,39,.78)", color: "white", display: "grid", placeItems: "center", fontWeight: 900 }}>{rank}</Box>}
      </Box>
      <Stack spacing={1.2} sx={{ p: 2 }}>
        <Typography fontWeight={800} noWrap title={prompt.title}>{prompt.title}</Typography>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="caption" color="text.secondary">{prompt.usage_count ? `${prompt.usage_count.toLocaleString("ko-KR")}회 사용` : `필요 코인 ${prompt.point_cost}`}</Typography>
          <Button component={Link} to={`/proposals?promptId=${prompt.id}`} size="small" endIcon={<ArrowForwardRoundedIcon />}>만들기</Button>
        </Stack>
      </Stack>
    </Paper>
  );
}

function PromptSection({ title, subtitle, prompts, ranked = false }) {
  if (!prompts?.length) return null;
  return (
    <Box component="section" sx={{ minWidth: 0 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="end" sx={{ mb: 1.7 }}>
        <Box><Typography variant="h6" fontWeight={850}>{title}</Typography><Typography variant="body2" color="text.secondary">{subtitle}</Typography></Box>
        <Button component={Link} to="/proposals" size="small">전체 보기</Button>
      </Stack>
      <Box sx={{ display: "flex", gap: 1.7, overflowX: "auto", pb: 1.2, scrollSnapType: "x proximity", scrollbarWidth: "thin" }}>
        {prompts.map((prompt, index) => <PromptCard key={prompt.id} prompt={prompt} rank={ranked ? index + 1 : null} />)}
      </Box>
    </Box>
  );
}

export default function Home() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getDashboard().then(setData).catch(() => setError("대시보드를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."));
  }, []);

  if (!data && !error) return <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1440, mx: "auto" }}><Skeleton height={190} sx={{ borderRadius: 4 }} /><Stack alignItems="center" sx={{ mt: 5 }}><CircularProgress size={28} /></Stack></Box>;

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1440, mx: "auto" }}>
      {error && <Alert severity="error">{error}</Alert>}
      {data && <Stack spacing={{ xs: 3.5, md: 4.5 }}>
        <Paper sx={{ p: { xs: 2.5, md: 4 }, borderRadius: 4, color: "white", overflow: "hidden", position: "relative", background: "linear-gradient(120deg,#172554 0%,#1d4ed8 57%,#6366f1 100%)", boxShadow: "0 18px 50px rgba(30,64,175,.22)" }}>
          <Box sx={{ position: "absolute", width: 260, height: 260, borderRadius: "50%", bgcolor: "rgba(255,255,255,.09)", right: -70, top: -120 }} />
          <Box sx={{ position: "relative", maxWidth: 720 }}>
            <Chip icon={<AutoAwesomeRoundedIcon />} label="BOJOGAE AI" sx={{ mb: 2, color: "white", bgcolor: "rgba(255,255,255,.14)", "& .MuiChip-icon": { color: "#fef08a" } }} />
            <Typography variant="h3" sx={{ fontSize: { xs: 28, md: 40 }, fontWeight: 900, letterSpacing: "-.04em" }}>{user?.display_name || "고객"}님, 오늘은 어떤 보고서를 만들까요?</Typography>
            <Typography sx={{ mt: 1.2, color: "rgba(255,255,255,.78)" }}>필요한 보고서를 선택하면 보조개가 빠르게 작업을 시작합니다.</Typography>
            <Button component={Link} to="/proposals" variant="contained" size="large" endIcon={<ArrowForwardRoundedIcon />} sx={{ mt: 3, bgcolor: "white", color: "#1d4ed8", fontWeight: 850, px: 2.6, "&:hover": { bgcolor: "#eff6ff" } }}>보고서 만들기</Button>
          </Box>
        </Paper>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2,minmax(0,1fr))", lg: "repeat(4,minmax(0,1fr))" }, gap: 1.5 }}>
          <StatCard icon={<CoinsRoundedIcon />} label="보유 코인" value={data.summary.total_points} accent="#2563eb" />
          <StatCard icon={<BoltRoundedIcon />} label="진행 중" value={data.summary.active_reports} accent="#7c3aed" />
          <StatCard icon={<CheckCircleRoundedIcon />} label="완료한 보고서" value={data.summary.completed_reports} accent="#059669" />
          <StatCard icon={<CampaignRoundedIcon />} label="새로운 소식" value={data.latest_posts.length} accent="#ea580c" />
        </Box>

        <PromptSection title="새로 나온 보고서" subtitle="최근 등록되거나 업데이트된 보고서입니다." prompts={data.latest_prompts} />
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "minmax(0,1fr)",
              lg: data.popular_prompts.length && data.personal_prompts.length
                ? "repeat(2,minmax(0,1fr))"
                : "minmax(0,1fr)",
            },
            gap: { xs: 3.5, md: 4.5 },
          }}
        >
          <PromptSection title="요즘 많이 사용하는 보고서" subtitle="최근 30일 동안 완성된 보고서를 기준으로 집계했습니다." prompts={data.popular_prompts} ranked />
          <PromptSection title="내가 자주 만드는 보고서" subtitle="내 완료 기록을 기준으로 빠르게 다시 시작할 수 있습니다." prompts={data.personal_prompts} ranked />
        </Box>

        {!!data.banners.length && <Box sx={{ display: "grid", gridAutoFlow: "column", gridAutoColumns: { xs: "88%", md: data.banners.length === 1 ? "100%" : "minmax(460px,1fr)" }, overflowX: "auto", gap: 2, pb: 0.5, scrollSnapType: "x mandatory" }}>
          {data.banners.map(banner => <Paper key={banner.id} component={banner.link_url ? "a" : "div"} href={banner.link_url || undefined} target={banner.link_url ? "_blank" : undefined} rel="noreferrer" sx={{ minHeight: { xs: 170, md: 210 }, p: { xs: 2.5, md: 4 }, borderRadius: 4, color: "white", textDecoration: "none", display: "flex", alignItems: "end", position: "relative", overflow: "hidden", scrollSnapAlign: "start", backgroundImage: `linear-gradient(90deg,rgba(15,23,42,.84),rgba(15,23,42,.12)),url(${dashboardBannerImageUrl(banner.id, banner.image_revision)})`, backgroundSize: "cover", backgroundPosition: "center" }}>
            <Box sx={{ position: "relative", maxWidth: 620 }}><Typography variant="h5" fontWeight={900}>{banner.title}</Typography><Typography sx={{ mt: 0.7, color: "rgba(255,255,255,.84)" }}>{banner.description}</Typography></Box>
          </Paper>)}
        </Box>}

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1.15fr .85fr" }, gap: 2 }}>
          <Paper variant="outlined" sx={{ p: { xs: 2, md: 2.7 }, borderRadius: 3.5, borderColor: "#e7ebf2" }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}><Typography variant="h6" fontWeight={850}>최근 작업</Typography><Button component={Link} to="/proposals" size="small">전체 보기</Button></Stack>
            <Stack divider={<Box sx={{ borderTop: "1px solid #eef1f5" }} />}>
              {data.recent_reports.map(report => <Stack key={report.id} direction="row" justifyContent="space-between" alignItems="center" spacing={2} sx={{ py: 1.4 }}><Box sx={{ minWidth: 0 }}><Typography fontWeight={750} noWrap>{report.title}</Typography><Typography variant="caption" color="text.secondary">{report.prompt_title} · {new Date(report.created_at).toLocaleDateString("ko-KR")}</Typography></Box><Chip size="small" label={(STATUS[report.status] || [report.status])[0]} color={(STATUS[report.status] || [null, "default"])[1]} /></Stack>)}
              {!data.recent_reports.length && <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>아직 만든 보고서가 없습니다.</Typography>}
            </Stack>
          </Paper>
          <Paper variant="outlined" sx={{ p: { xs: 2, md: 2.7 }, borderRadius: 3.5, borderColor: "#e7ebf2" }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}><Typography variant="h6" fontWeight={850}>최신 소식</Typography><LocalFireDepartmentRoundedIcon sx={{ color: "#f97316" }} /></Stack>
            <Stack spacing={0.4}>
              {data.latest_posts.map(post => <Box key={post.id} component={Link} to={`/board/posts/${post.id}`} sx={{ px: 1, py: 1.1, borderRadius: 2, textDecoration: "none", color: "inherit", "&:hover": { bgcolor: "#f8fafc" } }}><Stack direction="row" spacing={1} alignItems="center"><Chip size="small" label={BOARD_NAMES[post.board_type]} sx={{ flexShrink: 0 }} /><Typography fontWeight={700} noWrap>{post.title}</Typography></Stack></Box>)}
              {!data.latest_posts.length && <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>등록된 소식이 없습니다.</Typography>}
            </Stack>
          </Paper>
        </Box>
      </Stack>}
    </Box>
  );
}
