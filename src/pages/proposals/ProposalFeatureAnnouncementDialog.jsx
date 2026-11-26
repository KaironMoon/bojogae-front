/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { PROPOSAL_FEATURE_ANNOUNCEMENTS } from "@/services/proposal-feature-announcements";
import ProposalFeatureDemoVisual from "./ProposalFeatureDemoVisual";

function normalizeSteps(announcement) {
  if (Array.isArray(announcement?.steps) && announcement.steps.length > 0) {
    return announcement.steps;
  }
  if (Array.isArray(announcement?.items) && announcement.items.length > 0) {
    return announcement.items;
  }
  return [
    {
      key: announcement?.id || "summary",
      title: announcement?.title || "새 기능 안내",
      description: announcement?.subtitle || "",
    },
  ];
}

export default function ProposalFeatureAnnouncementDialog({
  open,
  announcements = PROPOSAL_FEATURE_ANNOUNCEMENTS,
  unseenIds = [],
  onClose,
  onOpenTour,
}) {
  const unseenSet = useMemo(() => new Set(unseenIds), [unseenIds]);
  const [selectedId, setSelectedId] = useState(announcements[0]?.id || "");
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (!open || !announcements.length) return;
    const firstUnseen = announcements.find((item) => unseenSet.has(item.id));
    setSelectedId(firstUnseen?.id || announcements[0].id);
    setStepIndex(0);
  }, [open, announcements, unseenSet]);

  if (!open || !announcements.length) return null;

  const active = announcements.find((item) => item.id === selectedId) || announcements[0];
  const steps = normalizeSteps(active);
  const safeIndex = Math.min(Math.max(stepIndex, 0), steps.length - 1);
  const currentStep = steps[safeIndex];
  const isFirst = safeIndex === 0;
  const isLast = safeIndex === steps.length - 1;

  return (
    <Dialog
      open
      onClose={onClose}
      fullWidth
      maxWidth="md"
      aria-labelledby="proposal-feature-announcement-title"
      PaperProps={{
        sx: {
          borderRadius: "20px",
          overflow: "hidden",
          border: "1px solid rgba(15, 23, 42, 0.08)",
        },
      }}
    >
      <DialogTitle
        sx={{
          bgcolor: "#121314",
          color: "#fff",
          px: { xs: 2.25, sm: 3 },
          py: 2,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 1.5,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap" sx={{ mb: 0.6 }}>
            <Chip
              size="small"
              label={`NEW · ${active.publishedAt || active.badge || "업데이트"}`}
              sx={{
                height: 22,
                bgcolor: "#03C75A",
                color: "#fff",
                fontWeight: 800,
                fontSize: 11,
                "& .MuiChip-label": { px: 1 },
              }}
            />
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.72)", fontWeight: 700 }}>
              새 기능 안내 · {safeIndex + 1} / {steps.length} 단계
            </Typography>
          </Stack>
          <Typography
            id="proposal-feature-announcement-title"
            variant="h6"
            sx={{ fontWeight: 900, fontSize: { xs: 17, sm: 19 }, lineHeight: 1.35 }}
          >
            {active.title}
          </Typography>
          {active.subtitle && (
            <Typography
              variant="body2"
              sx={{ color: "rgba(255,255,255,0.78)", mt: 0.4, fontSize: 13, lineHeight: 1.5 }}
            >
              {active.subtitle}
            </Typography>
          )}
        </Box>
        <IconButton
          aria-label="새 기능 안내 닫기"
          onClick={onClose}
          size="small"
          sx={{ color: "rgba(255,255,255,0.8)", mt: -0.25, flexShrink: 0 }}
        >
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ bgcolor: "#F8FAFC", px: { xs: 2.25, sm: 3 }, py: 2.25 }}>
        {announcements.length > 1 && (
          <Stack direction="row" gap={0.75} flexWrap="wrap" sx={{ mb: 1.5 }}>
            {announcements.map((entry) => {
              const selected = entry.id === active.id;
              const isNew = unseenSet.has(entry.id);
              return (
                <Chip
                  key={entry.id}
                  clickable
                  size="small"
                  label={`${entry.publishedAt ? `${entry.publishedAt} · ` : ""}${entry.badge || entry.title}${isNew ? " •" : ""}`}
                  onClick={() => {
                    setSelectedId(entry.id);
                    setStepIndex(0);
                  }}
                  sx={{
                    fontWeight: 800,
                    bgcolor: selected ? "#121314" : "#fff",
                    color: selected ? "#fff" : "text.primary",
                    border: "1px solid",
                    borderColor: selected ? "#121314" : "divider",
                    "&:hover": { bgcolor: selected ? "#27272A" : "#F1F5F9" },
                  }}
                />
              );
            })}
          </Stack>
        )}

        {steps.length > 1 && (
          <Stack direction="row" gap={0.75} flexWrap="wrap" sx={{ mb: 2 }}>
            {steps.map((step, index) => {
              const isCurrent = index === safeIndex;
              return (
                <Chip
                  key={step.key || index}
                  clickable
                  size="small"
                  label={step.tabLabel || `${index + 1}단계`}
                  onClick={() => setStepIndex(index)}
                  sx={{
                    fontWeight: 800,
                    bgcolor: isCurrent ? "#ECFDF5" : "#fff",
                    color: isCurrent ? "#006E43" : "text.secondary",
                    border: "1.5px solid",
                    borderColor: isCurrent ? "#03C75A" : "divider",
                    "&:hover": { bgcolor: isCurrent ? "#DCFCE7" : "#F1F5F9" },
                  }}
                />
              );
            })}
          </Stack>
        )}

        <Paper
          variant="outlined"
          sx={{
            p: { xs: 2, sm: 2.25 },
            borderRadius: "16px",
            bgcolor: "#fff",
            borderColor: "rgba(3, 199, 90, 0.24)",
            mb: 1.75,
          }}
        >
          <Typography
            variant="h6"
            sx={{ fontWeight: 900, fontSize: { xs: 16, sm: 18 }, color: "text.primary", mb: 0.75 }}
          >
            {currentStep.title}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontSize: 14, lineHeight: 1.7, wordBreak: "keep-all" }}
          >
            {currentStep.description}
          </Typography>
        </Paper>

        {currentStep.demoKey && (
          <ProposalFeatureDemoVisual
            demoKey={currentStep.demoKey}
            highlight={currentStep.highlight}
          />
        )}

        <Paper
          variant="outlined"
          sx={{
            mt: 1.75,
            px: 1.5,
            py: 1,
            borderRadius: "12px",
            bgcolor: "#ECFDF5",
            borderColor: "rgba(3, 199, 90, 0.25)",
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <InfoOutlinedIcon sx={{ fontSize: 18, color: "#006E43", flexShrink: 0 }} />
          <Typography variant="caption" sx={{ color: "#006E43", fontWeight: 700, lineHeight: 1.5 }}>
            닫기를 누른 뒤에도 상단의 [도움말 보기] 버튼에서 언제든 다시 확인할 수 있어요.
          </Typography>
        </Paper>
      </DialogContent>

      <DialogActions
        sx={{
          px: { xs: 2.25, sm: 3 },
          py: 1.75,
          bgcolor: "#fff",
          borderTop: "1px solid #E6EAEE",
          justifyContent: "space-between",
          gap: 1,
          flexWrap: "wrap",
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <Button
            size="small"
            variant="outlined"
            startIcon={<HelpOutlineRoundedIcon />}
            onClick={() => {
              onClose?.();
              onOpenTour?.();
            }}
            sx={{ borderRadius: "10px", fontWeight: 750 }}
          >
            화면 사용법 투어
          </Button>
          {!isFirst && (
            <Button
              size="small"
              variant="text"
              startIcon={<ArrowBackRoundedIcon />}
              onClick={() => setStepIndex((current) => Math.max(0, current - 1))}
              sx={{ fontWeight: 800, color: "text.secondary" }}
            >
              이전
            </Button>
          )}
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center">
          <Button
            size="small"
            variant="text"
            onClick={onClose}
            sx={{ fontWeight: 750, color: "text.secondary" }}
          >
            닫기
          </Button>
          {isLast ? (
            <Button
              variant="contained"
              onClick={onClose}
              autoFocus
              sx={{
                borderRadius: "10px",
                fontWeight: 800,
                px: 2.5,
                bgcolor: "#03C75A",
                "&:hover": { bgcolor: "#00A84B" },
              }}
            >
              확인 · 닫기
            </Button>
          ) : (
            <Button
              variant="contained"
              endIcon={<ArrowForwardRoundedIcon />}
              onClick={() => setStepIndex((current) => Math.min(steps.length - 1, current + 1))}
              autoFocus
              sx={{
                borderRadius: "10px",
                fontWeight: 800,
                px: 2.5,
                bgcolor: "#03C75A",
                "&:hover": { bgcolor: "#00A84B" },
              }}
            >
              다음
            </Button>
          )}
        </Stack>
      </DialogActions>
    </Dialog>
  );
}
