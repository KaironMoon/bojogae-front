/* eslint-disable react/prop-types */
import { Fragment, useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import ProposalFeatureDemoVisual from "./ProposalFeatureDemoVisual";

const DEMO_HIGHLIGHTS = {
  "customer-ai-fill": "내고객 > 고객 추가 > AI 자동 채우기",
  "customer-docs-box": "보고서 만들기 > 연결할 고객 선택 > 고객 문서함",
  "auto-contract-apply": "보고서 리스트 > 청약 버튼 > 내 계약 자동 입력",
  "report-subtitle": "보고서 만들기 · 내 고객 > 문서(생성 문서)",
};

const CATEGORY_META = {
  UPDATE: { label: "업데이트 노트", bgcolor: "#ECFDF5", color: "#006E43", border: "rgba(3, 199, 90, 0.28)" },
  FEATURE: { label: "새 기능", bgcolor: "#EFF6FF", color: "#1D4ED8", border: "rgba(37, 99, 235, 0.25)" },
  BUGFIX: { label: "버그 수정", bgcolor: "#FEF2F2", color: "#B91C1C", border: "rgba(220, 38, 38, 0.24)" },
  NOTICE: { label: "주요 공지", bgcolor: "#FEF3C7", color: "#92400E", border: "rgba(217, 119, 6, 0.28)" },
};

function formatDateLabel(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

function renderInlineMarkdown(text, onNavigate) {
  const parts = String(text || "").split(/(\[[^[\]]+\]\([^()\s]+\)|\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, idx) => {
    const linkMatch = part.match(/^\[([^[\]]+)\]\(([^()\s]+)\)$/);
    if (linkMatch) {
      const [, label, href] = linkMatch;
      const linkSx = {
        display: "inline-flex",
        alignItems: "center",
        gap: 0.4,
        px: 0.85,
        py: 0.2,
        borderRadius: "8px",
        bgcolor: "#ECFDF5",
        color: "#006E43",
        border: "1px solid rgba(3, 199, 90, 0.32)",
        fontWeight: 850,
        textDecoration: "none",
        "&:hover": { bgcolor: "#D1FAE5" },
      };
      if (href.startsWith("/")) {
        return (
          <Box
            component={RouterLink}
            key={idx}
            to={href}
            onClick={() => onNavigate?.()}
            sx={linkSx}
          >
            {label}
          </Box>
        );
      }
      if (/^https?:\/\//i.test(href)) {
        return (
          <Box
            component="a"
            key={idx}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            sx={linkSx}
          >
            {label}
          </Box>
        );
      }
    }
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <Box component="strong" key={idx} sx={{ fontWeight: 850, color: "#0F172A" }}>
          {part.slice(2, -2)}
        </Box>
      );
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return (
        <Box
          component="code"
          key={idx}
          sx={{
            px: 0.65,
            py: 0.15,
            mx: 0.15,
            borderRadius: "6px",
            bgcolor: "#F1F5F9",
            color: "#006E43",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            fontSize: "0.88em",
            fontWeight: 700,
          }}
        >
          {part.slice(1, -1)}
        </Box>
      );
    }
    return <Fragment key={idx}>{part}</Fragment>;
  });
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
const SAFE_BOARD_IMAGE_PATH = /^\/api\/v1\/board-images\/[a-f0-9]{32}$/;

function BlogArticleBody({ content, onNavigate }) {
  const lines = String(content || "").replace(/\r\n/g, "\n").split("\n");
  return (
    <Stack spacing={1.25}>
      {lines.map((rawLine, index) => {
        const line = rawLine.trim();
        if (!line) return <Box key={index} sx={{ height: 4 }} />;
        const imageMatch = line.match(/^!\[([^\]]*)\]\(([^()\s]+)\)$/);
        if (imageMatch && SAFE_BOARD_IMAGE_PATH.test(imageMatch[2])) {
          return (
            <Box
              key={index}
              sx={{
                my: 1,
                display: "flex",
                justifyContent: "center",
              }}
            >
              <Box
                component="img"
                src={`${API_BASE_URL}${imageMatch[2]}`}
                alt={imageMatch[1] || "안내 이미지"}
                loading="lazy"
                sx={{
                  maxWidth: 420,
                  width: "100%",
                  height: "auto",
                  borderRadius: "14px",
                  border: "1px solid #E2E8F0",
                  boxShadow: "0 4px 16px rgba(15, 23, 42, 0.06)",
                  display: "block",
                }}
              />
            </Box>
          );
        }
        const demoMatch = line.match(/^\[demo:([a-z0-9-]+)(?:\|([^\]]+))?\]$/i);
        if (demoMatch) {
          const demoKey = demoMatch[1];
          const highlight = demoMatch[2] || DEMO_HIGHLIGHTS[demoKey];
          return (
            <Box key={index} sx={{ my: 0.75 }}>
              <ProposalFeatureDemoVisual demoKey={demoKey} highlight={highlight} />
            </Box>
          );
        }
        if (line.startsWith("### ")) {
          return (
            <Typography
              key={index}
              variant="subtitle1"
              sx={{ fontWeight: 850, color: "#0F172A", pt: 0.75 }}
            >
              {renderInlineMarkdown(line.slice(4), onNavigate)}
            </Typography>
          );
        }
        if (line.startsWith("## ") || line.startsWith("# ")) {
          const text = line.replace(/^#{1,2}\s+/, "");
          return (
            <Typography
              key={index}
              variant="h6"
              sx={{
                fontWeight: 900,
                fontSize: { xs: 16, sm: 17.5 },
                color: "#0F172A",
                pt: index === 0 ? 0 : 1,
                borderLeft: "4px solid #03C75A",
                pl: 1.25,
                lineHeight: 1.4,
              }}
            >
              {renderInlineMarkdown(text, onNavigate)}
            </Typography>
          );
        }
        if (line.startsWith("- ") || line.startsWith("• ")) {
          return (
            <Stack key={index} direction="row" spacing={1} alignItems="flex-start" sx={{ pl: 0.75 }}>
              <Box
                component="span"
                sx={{
                  mt: "8px",
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  bgcolor: "#03C75A",
                  flexShrink: 0,
                }}
              />
              <Typography variant="body2" sx={{ color: "#334155", lineHeight: 1.75, wordBreak: "keep-all" }}>
                {renderInlineMarkdown(line.slice(2), onNavigate)}
              </Typography>
            </Stack>
          );
        }
        return (
          <Typography key={index} variant="body2" sx={{ color: "#334155", lineHeight: 1.8, wordBreak: "keep-all" }}>
            {renderInlineMarkdown(line, onNavigate)}
          </Typography>
        );
      })}
    </Stack>
  );
}

export default function ProposalPopupNoticeDialog({
  open,
  notices = [],
  previewMode = false,
  onClose,
  onHideToday,
}) {
  const [selectedId, setSelectedId] = useState(notices[0]?.id ?? null);

  useEffect(() => {
    if (!open || !notices.length) return;
    setSelectedId((prev) => (notices.some((n) => n.id === prev) ? prev : notices[0].id));
  }, [open, notices]);

  if (!open || !notices.length) return null;

  const active = notices.find((item) => item.id === selectedId) || notices[0];
  const meta = CATEGORY_META[active.category] || CATEGORY_META.UPDATE;
  const dateLabel = formatDateLabel(active.starts_at || active.created_at);

  return (
    <Dialog
      open
      onClose={onClose}
      fullWidth
      maxWidth="md"
      aria-labelledby="proposal-popup-notice-title"
      PaperProps={{
        sx: {
          borderRadius: "22px",
          overflow: "hidden",
          border: "1px solid rgba(15, 23, 42, 0.08)",
        },
      }}
    >
      <DialogTitle
        sx={{
          bgcolor: "#FFFFFF",
          px: { xs: 2.5, sm: 3.5 },
          pt: 2.75,
          pb: 2,
          borderBottom: "1px solid #EEF2F6",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 1.5,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Stack direction="row" alignItems="center" flexWrap="wrap" gap={1} sx={{ mb: 1 }}>
            <Chip
              size="small"
              icon={<ArticleOutlinedIcon sx={{ fontSize: "14px !important", color: `${meta.color} !important` }} />}
              label={meta.label}
              sx={{
                height: 24,
                bgcolor: meta.bgcolor,
                color: meta.color,
                border: `1px solid ${meta.border}`,
                fontWeight: 850,
                fontSize: 11.5,
              }}
            />
            {dateLabel && (
              <Typography variant="caption" color="text.secondary" fontWeight={700}>
                {dateLabel}
              </Typography>
            )}
            {previewMode && (
              <Chip size="small" label="관리자 미리보기" color="warning" variant="outlined" sx={{ height: 22, fontSize: 11, fontWeight: 800 }} />
            )}
          </Stack>
          <Typography
            id="proposal-popup-notice-title"
            variant="h5"
            sx={{
              fontWeight: 900,
              fontSize: { xs: 19, sm: 23 },
              color: "#0F172A",
              lineHeight: 1.35,
              letterSpacing: "-0.02em",
            }}
          >
            {active.title}
          </Typography>
        </Box>
        <IconButton aria-label="공지 닫기" onClick={onClose} size="small" sx={{ flexShrink: 0, mt: -0.5 }}>
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ bgcolor: "#F8FAFC", px: { xs: 2.5, sm: 3.5 }, py: 2.75 }}>
        {notices.length > 1 && (
          <Stack direction="row" gap={0.75} flexWrap="wrap" sx={{ mb: 2 }}>
            {notices.map((entry, idx) => {
              const selected = entry.id === active.id;
              return (
                <Chip
                  key={entry.id}
                  clickable
                  size="small"
                  label={`${idx + 1}. ${entry.title}`}
                  onClick={() => setSelectedId(entry.id)}
                  sx={{
                    maxWidth: 260,
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

        <Paper
          variant="outlined"
          sx={{
            p: { xs: 2.25, sm: 3 },
            borderRadius: "18px",
            bgcolor: "#FFFFFF",
            borderColor: "rgba(15, 23, 42, 0.08)",
            boxShadow: "0 2px 10px rgba(15, 23, 42, 0.03)",
          }}
        >
          {active.summary && (
            <>
              <Paper
                variant="outlined"
                sx={{
                  px: 2,
                  py: 1.5,
                  mb: 2.25,
                  borderRadius: "12px",
                  bgcolor: "#F0FDF4",
                  borderColor: "rgba(3, 199, 90, 0.28)",
                }}
              >
                <Typography variant="body2" sx={{ color: "#065F46", fontWeight: 750, lineHeight: 1.65 }}>
                  {active.summary}
                </Typography>
              </Paper>
              <Divider sx={{ mb: 2.25 }} />
            </>
          )}

          <BlogArticleBody content={active.content} onNavigate={onClose} />
        </Paper>
      </DialogContent>

      <DialogActions
        sx={{
          px: { xs: 2.5, sm: 3.5 },
          py: 1.75,
          bgcolor: "#FFFFFF",
          borderTop: "1px solid #EEF2F6",
          justifyContent: "space-between",
          gap: 1,
          flexWrap: "wrap",
        }}
      >
        {!previewMode ? (
          <Button
            size="small"
            color="inherit"
            startIcon={<VisibilityOffOutlinedIcon fontSize="small" />}
            onClick={() => onHideToday?.(notices.map((n) => n.id))}
            sx={{ color: "text.secondary", fontWeight: 750, borderRadius: "10px" }}
          >
            오늘 더 이상 보지 않기
          </Button>
        ) : (
          <Typography variant="caption" color="text.secondary" fontWeight={700}>
            실제 사용자 화면에서는 좌측 하단에 &lsquo;오늘 더 이상 보지 않기&rsquo; 버튼이 표시됩니다.
          </Typography>
        )}
        <Button
          variant="contained"
          onClick={onClose}
          autoFocus
          sx={{
            borderRadius: "10px",
            fontWeight: 850,
            px: 3,
            bgcolor: "#03C75A",
            "&:hover": { bgcolor: "#00A84B" },
          }}
        >
          닫기
        </Button>
      </DialogActions>
    </Dialog>
  );
}
