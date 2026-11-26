/* eslint-disable react/prop-types */
import { Box, Chip, Paper, Stack, Typography } from "@mui/material";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ContentPasteRoundedIcon from "@mui/icons-material/ContentPasteRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import FolderOpenRoundedIcon from "@mui/icons-material/FolderOpenRounded";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";

const REDUCED_MOTION_SX = {
  "@media (prefers-reduced-motion: reduce)": {
    animation: "none !important",
    opacity: 1,
    transform: "none",
  },
};

function DemoBadge() {
  return (
    <Chip
      size="small"
      icon={<PlayArrowRoundedIcon sx={{ fontSize: "14px !important", color: "#006E43 !important" }} />}
      label="예시 화면 · 자동 재생"
      sx={{
        height: 22,
        bgcolor: "#ECFDF5",
        color: "#006E43",
        border: "1px solid rgba(3, 199, 90, 0.28)",
        fontWeight: 800,
        fontSize: 11,
        "& .MuiChip-label": { px: 0.85 },
      }}
    />
  );
}

function CustomerAiFillDemo() {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", sm: "1fr auto 1.15fr" },
        gap: 1.25,
        alignItems: "center",
        "@keyframes pastePulse": {
          "0%, 100%": { borderColor: "#CBD5E1", boxShadow: "none" },
          "15%, 40%": { borderColor: "#03C75A", boxShadow: "0 0 0 3px rgba(3, 199, 90, 0.14)" },
        },
        "@keyframes aiSweep": {
          "0%, 15%": { opacity: 0.45, transform: "scale(0.95)" },
          "30%, 55%": { opacity: 1, transform: "scale(1.06)" },
          "70%, 100%": { opacity: 0.65, transform: "scale(1)" },
        },
        "@keyframes popRow1": {
          "0%, 28%": { opacity: 0.28, transform: "translateY(4px)" },
          "40%, 92%": { opacity: 1, transform: "translateY(0)" },
          "100%": { opacity: 0.28, transform: "translateY(4px)" },
        },
        "@keyframes popRow2": {
          "0%, 40%": { opacity: 0.28, transform: "translateY(4px)" },
          "52%, 92%": { opacity: 1, transform: "translateY(0)" },
          "100%": { opacity: 0.28, transform: "translateY(4px)" },
        },
        "@keyframes popRow3": {
          "0%, 52%": { opacity: 0.28, transform: "translateY(4px)" },
          "64%, 92%": { opacity: 1, transform: "translateY(0)" },
          "100%": { opacity: 0.28, transform: "translateY(4px)" },
        },
      }}
    >
      <Paper
        variant="outlined"
        sx={{
          p: 1.35,
          borderRadius: "12px",
          bgcolor: "#fff",
          animation: "pastePulse 4.8s ease-in-out infinite",
          ...REDUCED_MOTION_SX,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={0.6} sx={{ mb: 0.75 }}>
          <ContentPasteRoundedIcon sx={{ fontSize: 15, color: "#475569", flexShrink: 0 }} />
          <Typography variant="caption" fontWeight={800} color="text.secondary">
            고객 DB 텍스트 붙여넣기 · 이미지 첨부
          </Typography>
        </Stack>
        <Box
          sx={{
            p: 1,
            borderRadius: "8px",
            bgcolor: "#F8FAFC",
            border: "1px dashed #CBD5E1",
            fontSize: 11.5,
            lineHeight: 1.55,
            color: "#334155",
            fontFamily: "monospace",
          }}
        >
          서혜미 / 760227-2
          <br />
          010-7589-0185
          <br />
          롯데손보 76 서울
        </Box>
        <Typography variant="caption" sx={{ display: "block", mt: 0.6, color: "#64748B", fontSize: 10.5, fontWeight: 700 }}>
          또는 고객 DB 캡처 이미지 첨부
        </Typography>
      </Paper>

      <Stack
        alignItems="center"
        justifyContent="center"
        spacing={0.5}
        sx={{
          animation: "aiSweep 4.8s ease-in-out infinite",
          ...REDUCED_MOTION_SX,
        }}
      >
        <Box
          sx={{
            px: 1.1,
            py: 0.55,
            borderRadius: 99,
            bgcolor: "#F5F3FF",
            color: "#6B38FB",
            border: "1px solid rgba(107, 56, 251, 0.28)",
            display: "inline-flex",
            alignItems: "center",
            gap: 0.4,
            fontSize: 11,
            fontWeight: 850,
            whiteSpace: "nowrap",
          }}
        >
          <AutoAwesomeRoundedIcon sx={{ fontSize: 13 }} />
          AI 자동 정리
        </Box>
        <ArrowForwardRoundedIcon
          sx={{
            fontSize: 16,
            color: "#03C75A",
            transform: { xs: "rotate(90deg)", sm: "none" },
          }}
        />
      </Stack>

      <Paper
        variant="outlined"
        sx={{
          p: 1.35,
          borderRadius: "12px",
          bgcolor: "#fff",
          borderColor: "rgba(3, 199, 90, 0.35)",
        }}
      >
        <Typography variant="caption" fontWeight={850} sx={{ color: "#006E43", display: "block", mb: 0.75 }}>
          내고객 등록 완료
        </Typography>
        <Stack spacing={0.6}>
          {[
            { label: "이름", value: "서혜미", anim: "popRow1" },
            { label: "연락처", value: "010-7589-0185", anim: "popRow2" },
            { label: "생년월일", value: "1976-02-27 (여)", anim: "popRow3" },
          ].map((row) => (
            <Box
              key={row.label}
              sx={{
                px: 1,
                py: 0.55,
                borderRadius: "8px",
                bgcolor: "#ECFDF5",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1,
                animation: `${row.anim} 4.8s ease-in-out infinite`,
                ...REDUCED_MOTION_SX,
              }}
            >
              <Typography variant="caption" color="text.secondary" fontWeight={700}>
                {row.label}
              </Typography>
              <Stack direction="row" alignItems="center" spacing={0.4}>
                <Typography variant="caption" fontWeight={850} color="text.primary">
                  {row.value}
                </Typography>
                <CheckCircleRoundedIcon sx={{ fontSize: 13, color: "#03C75A" }} />
              </Stack>
            </Box>
          ))}
        </Stack>
      </Paper>
    </Box>
  );
}

function CustomerDocsBoxDemo() {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", sm: "1fr auto 1.15fr" },
        gap: 1.25,
        alignItems: "center",
        "@keyframes selectGlow": {
          "0%, 100%": { borderColor: "#CBD5E1", boxShadow: "none" },
          "15%, 45%": { borderColor: "#03C75A", boxShadow: "0 0 0 3px rgba(3, 199, 90, 0.14)" },
        },
        "@keyframes btnPulse": {
          "0%, 30%": { transform: "scale(1)", bgcolor: "#fff" },
          "45%, 65%": { transform: "scale(1.04)", bgcolor: "#ECFDF5" },
          "80%, 100%": { transform: "scale(1)", bgcolor: "#fff" },
        },
        "@keyframes listSlide1": {
          "0%, 35%": { opacity: 0.3, transform: "translateX(6px)" },
          "48%, 92%": { opacity: 1, transform: "translateX(0)" },
          "100%": { opacity: 0.3, transform: "translateX(6px)" },
        },
        "@keyframes listSlide2": {
          "0%, 48%": { opacity: 0.3, transform: "translateX(6px)" },
          "60%, 92%": { opacity: 1, transform: "translateX(0)" },
          "100%": { opacity: 0.3, transform: "translateX(6px)" },
        },
      }}
    >
      <Paper
        variant="outlined"
        sx={{
          p: 1.35,
          borderRadius: "12px",
          bgcolor: "#F4F7FA",
          animation: "selectGlow 4.8s ease-in-out infinite",
          ...REDUCED_MOTION_SX,
        }}
      >
        <Typography variant="caption" fontWeight={850} color="text.primary" sx={{ display: "block", mb: 0.75 }}>
          연결할 고객
        </Typography>
        <Box
          sx={{
            px: 1,
            py: 0.7,
            borderRadius: "8px",
            bgcolor: "#fff",
            border: "1.5px solid #03C75A",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 0.75,
            mb: 0.85,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={0.5} sx={{ minWidth: 0 }}>
            <PersonOutlineRoundedIcon sx={{ fontSize: 15, color: "#006E43" }} />
            <Typography variant="caption" fontWeight={850} noWrap>
              서혜미 · 010-7589-0185
            </Typography>
          </Stack>
        </Box>
        <Box
          sx={{
            px: 1,
            py: 0.5,
            borderRadius: "8px",
            border: "1px solid rgba(3, 199, 90, 0.45)",
            color: "#006E43",
            display: "inline-flex",
            alignItems: "center",
            gap: 0.5,
            fontSize: 11.5,
            fontWeight: 800,
            animation: "btnPulse 4.8s ease-in-out infinite",
            ...REDUCED_MOTION_SX,
          }}
        >
          <FolderOpenRoundedIcon sx={{ fontSize: 14 }} />
          고객 문서함 보기
        </Box>
      </Paper>

      <ArrowForwardRoundedIcon
        sx={{
          fontSize: 18,
          color: "#03C75A",
          justifySelf: "center",
          transform: { xs: "rotate(90deg)", sm: "none" },
        }}
      />

      <Paper
        variant="outlined"
        sx={{
          p: 1.35,
          borderRadius: "12px",
          bgcolor: "#fff",
          borderColor: "rgba(37, 99, 235, 0.25)",
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.75 }}>
          <Typography variant="caption" fontWeight={850} sx={{ color: "#1D4ED8" }}>
            서혜미 님 · 문서 탭
          </Typography>
          <Chip size="small" label="생성 문서 2건" sx={{ height: 19, fontSize: 10, fontWeight: 800, bgcolor: "#EFF6FF", color: "#1D4ED8" }} />
        </Stack>
        <Stack spacing={0.6}>
          {[
            { name: "서혜미님 삼성화재 암치료비", anim: "listSlide1" },
            { name: "서혜미님 리모델링 종합 리포트", anim: "listSlide2" },
          ].map((doc) => (
            <Box
              key={doc.name}
              sx={{
                px: 1,
                py: 0.65,
                borderRadius: "8px",
                bgcolor: "#F8FAFC",
                border: "1px solid #E2E8F0",
                display: "flex",
                alignItems: "center",
                gap: 0.65,
                animation: `${doc.anim} 4.8s ease-in-out infinite`,
                ...REDUCED_MOTION_SX,
              }}
            >
              <DescriptionRoundedIcon sx={{ fontSize: 14, color: "#2563EB", flexShrink: 0 }} />
              <Typography variant="caption" fontWeight={750} noWrap>
                {doc.name}
              </Typography>
            </Box>
          ))}
        </Stack>
      </Paper>
    </Box>
  );
}

function AutoContractApplyDemo() {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", sm: "1fr auto 1.15fr" },
        gap: 1.25,
        alignItems: "center",
        "@keyframes applyClick": {
          "0%, 20%": { transform: "scale(1)", boxShadow: "0 3px 10px rgba(107, 56, 251, 0.22)" },
          "35%": { transform: "scale(0.95)", boxShadow: "0 0 0 4px rgba(107, 56, 251, 0.28)" },
          "50%, 100%": { transform: "scale(1)", boxShadow: "0 3px 10px rgba(107, 56, 251, 0.22)" },
        },
        "@keyframes fill1": {
          "0%, 34%": { opacity: 0.25, transform: "translateY(4px)" },
          "46%, 92%": { opacity: 1, transform: "translateY(0)" },
          "100%": { opacity: 0.25, transform: "translateY(4px)" },
        },
        "@keyframes fill2": {
          "0%, 46%": { opacity: 0.25, transform: "translateY(4px)" },
          "58%, 92%": { opacity: 1, transform: "translateY(0)" },
          "100%": { opacity: 0.25, transform: "translateY(4px)" },
        },
        "@keyframes fill3": {
          "0%, 58%": { opacity: 0.25, transform: "translateY(4px)" },
          "70%, 92%": { opacity: 1, transform: "translateY(0)" },
          "100%": { opacity: 0.25, transform: "translateY(4px)" },
        },
      }}
    >
      <Paper variant="outlined" sx={{ p: 1.25, borderRadius: "12px", bgcolor: "#fff" }}>
        <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ display: "block", mb: 0.75 }}>
          보고서 리스트
        </Typography>
        <Stack spacing={0.75}>
          <Box
            sx={{
              p: 0.9,
              borderRadius: "10px",
              bgcolor: "#F8FAFC",
              border: "1px solid rgba(3, 199, 90, 0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 0.75,
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="caption" fontWeight={800} noWrap sx={{ display: "block" }}>
                메리츠 간병인지원 제안서
              </Typography>
              <Chip
                size="small"
                label="서혜미"
                sx={{ mt: 0.25, height: 18, fontSize: 10, fontWeight: 800, bgcolor: "#ECFDF5", color: "#006E43" }}
              />
            </Box>
            <Box
              sx={{
                px: 1,
                py: 0.45,
                borderRadius: "8px",
                background: "linear-gradient(120deg, #6B38FB, #8B5CF6 55%, #03C75A)",
                color: "#fff",
                fontSize: 11,
                fontWeight: 850,
                whiteSpace: "nowrap",
                display: "inline-flex",
                alignItems: "center",
                gap: 0.35,
                animation: "applyClick 4.8s ease-in-out infinite",
                ...REDUCED_MOTION_SX,
              }}
            >
              <AutoAwesomeRoundedIcon sx={{ fontSize: 12 }} />
              청약
            </Box>
          </Box>

          <Box
            sx={{
              p: 0.85,
              borderRadius: "10px",
              bgcolor: "#F8FAFC",
              border: "1px solid #E2E8F0",
              opacity: 0.7,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 0.75,
            }}
          >
            <Typography variant="caption" color="text.secondary" noWrap>
              고객 미지정 보고서
            </Typography>
            <Box
              sx={{
                px: 0.9,
                py: 0.35,
                borderRadius: "8px",
                bgcolor: "#E2E8F0",
                color: "#94A3B8",
                fontSize: 10.5,
                fontWeight: 800,
                whiteSpace: "nowrap",
              }}
            >
              청약 비활성
            </Box>
          </Box>
        </Stack>
      </Paper>

      <ArrowForwardRoundedIcon
        sx={{
          fontSize: 18,
          color: "#6B38FB",
          justifySelf: "center",
          transform: { xs: "rotate(90deg)", sm: "none" },
        }}
      />

      <Paper
        variant="outlined"
        sx={{
          p: 1.35,
          borderRadius: "12px",
          bgcolor: "#fff",
          borderColor: "rgba(107, 56, 251, 0.3)",
        }}
      >
        <Typography variant="caption" fontWeight={850} sx={{ color: "#6B38FB", display: "block", mb: 0.75 }}>
          ✨ 내 계약 자동 입력
        </Typography>
        <Stack spacing={0.55}>
          {[
            { k: "상품·보험료", v: "메리츠화재 · 73,998원", anim: "fill1" },
            { k: "만기·납입종료", v: "20년납 · 100세 자동계산", anim: "fill2" },
            { k: "계약자·피보험자", v: "서혜미 자동 연결", anim: "fill3" },
          ].map((item) => (
            <Box
              key={item.k}
              sx={{
                px: 0.9,
                py: 0.5,
                borderRadius: "8px",
                bgcolor: "#F5F3FF",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 0.75,
                animation: `${item.anim} 4.8s ease-in-out infinite`,
                ...REDUCED_MOTION_SX,
              }}
            >
              <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ fontSize: 11 }}>
                {item.k}
              </Typography>
              <Stack direction="row" alignItems="center" spacing={0.35}>
                <Typography variant="caption" fontWeight={850} sx={{ fontSize: 11 }}>
                  {item.v}
                </Typography>
                <CheckCircleRoundedIcon sx={{ fontSize: 13, color: "#03C75A" }} />
              </Stack>
            </Box>
          ))}
        </Stack>
      </Paper>
    </Box>
  );
}

function ReportSubtitleDemo() {
  return (
    <Stack
      spacing={1}
      sx={{
        "@keyframes searchGlow": {
          "0%, 100%": { borderColor: "#CBD5E1", boxShadow: "none" },
          "30%, 65%": { borderColor: "#03C75A", boxShadow: "0 0 0 3px rgba(3, 199, 90, 0.14)" },
        },
        "@keyframes subtitlePulse": {
          "0%, 20%": { bgcolor: "#F8FAFC" },
          "40%, 75%": { bgcolor: "#ECFDF5" },
          "100%": { bgcolor: "#F8FAFC" },
        },
      }}
    >
      <Paper
        variant="outlined"
        sx={{
          px: 1.25,
          py: 0.75,
          borderRadius: "10px",
          bgcolor: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          animation: "searchGlow 4.8s ease-in-out infinite",
          ...REDUCED_MOTION_SX,
        }}
      >
        <Typography variant="caption" sx={{ color: "#0F172A", fontWeight: 750, fontSize: 11.5 }}>
          🔍 검색: &ldquo;서혜미&rdquo; 또는 &ldquo;삼성화재 · 65,973원&rdquo;
        </Typography>
        <Chip size="small" label="부제목 검색 지원" sx={{ height: 20, fontSize: 10.5, fontWeight: 800, bgcolor: "#ECFDF5", color: "#006E43" }} />
      </Paper>

      <Paper
        variant="outlined"
        sx={{
          p: 1.15,
          borderRadius: "12px",
          bgcolor: "#fff",
          borderColor: "rgba(3, 199, 90, 0.35)",
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" alignItems="center" spacing={0.6} flexWrap="wrap">
              <DescriptionRoundedIcon sx={{ fontSize: 14, color: "#475569" }} />
              <Typography variant="caption" fontWeight={800} color="text.secondary" noWrap>
                삼성화재_가설계_가입제안서.pdf
              </Typography>
              <Chip size="small" label="서혜미" sx={{ height: 18, fontSize: 10, fontWeight: 800, bgcolor: "#ECFDF5", color: "#006E43" }} />
            </Stack>
            <Box
              sx={{
                mt: 0.5,
                px: 0.9,
                py: 0.45,
                borderRadius: "7px",
                animation: "subtitlePulse 4.8s ease-in-out infinite",
                ...REDUCED_MOTION_SX,
              }}
            >
              <Typography variant="caption" sx={{ color: "#0F172A", fontWeight: 850, fontSize: 11.5 }}>
                서혜미님 · 삼성화재 · 종합건강 · 월 65,973원
              </Typography>
            </Box>
          </Box>
          <Box
            sx={{
              px: 0.9,
              py: 0.45,
              borderRadius: "8px",
              bgcolor: "#F5F3FF",
              color: "#6B38FB",
              fontSize: 11,
              fontWeight: 850,
              whiteSpace: "nowrap",
              display: "inline-flex",
              alignItems: "center",
              gap: 0.35,
            }}
          >
            <AutoAwesomeRoundedIcon sx={{ fontSize: 12 }} />
            청약
          </Box>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: 1.15, borderRadius: "12px", bgcolor: "#fff" }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="caption" fontWeight={800} color="text.secondary" noWrap>
              태아보험_비교요청.pdf
            </Typography>
            <Typography variant="caption" sx={{ display: "block", mt: 0.35, color: "#0F172A", fontWeight: 850, fontSize: 11.5 }}>
              박윤정님 · 태아보험 2사 비교 (KB손해보험·현대해상)
            </Typography>
          </Box>
          <Chip size="small" label="비교·분석용 (청약 미노출)" sx={{ height: 20, fontSize: 10, fontWeight: 750, bgcolor: "#F1F5F9", color: "#475569" }} />
        </Stack>
      </Paper>
    </Stack>
  );
}

export default function ProposalFeatureDemoVisual({ demoKey, highlight }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: { xs: 1.5, sm: 2 },
        borderRadius: "16px",
        bgcolor: "#F1F5F9",
        borderColor: "rgba(15, 23, 42, 0.1)",
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={0.75} sx={{ mb: 1.25 }}>
        <DemoBadge />
        {highlight && (
          <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 750 }}>
            위치: {highlight}
          </Typography>
        )}
      </Stack>

      {demoKey === "customer-ai-fill" && <CustomerAiFillDemo />}
      {demoKey === "customer-docs-box" && <CustomerDocsBoxDemo />}
      {demoKey === "auto-contract-apply" && <AutoContractApplyDemo />}
      {demoKey === "report-subtitle" && <ReportSubtitleDemo />}
    </Paper>
  );
}
