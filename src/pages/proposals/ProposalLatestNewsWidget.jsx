import CampaignRoundedIcon from "@mui/icons-material/CampaignRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import PushPinOutlinedIcon from "@mui/icons-material/PushPinOutlined";
import { Box, Button, Chip, Divider, Paper, Stack, Tooltip, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { categoryLabel } from "@/services/board-config";
import { listBoardPosts } from "@/services/board-service";
import { seoulTodayString } from "@/services/proposal-popup-notice-service";

const STORAGE_KEY_PREFIX = "bojogae_proposals_latest_news_dismissed_date:";
const BOARD_BADGES = {
  notices: { label: "공지", bgcolor: "rgba(37, 99, 235, 0.12)", color: "#1D4ED8" },
  "industry-news": { label: "소식", bgcolor: "rgba(217, 119, 6, 0.14)", color: "#B45309" },
};

function dismissedStorageKey(userId) {
  return `${STORAGE_KEY_PREFIX}${userId ?? "anon"}`;
}

function formatShortDate(value) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  const yyyy = parsed.getFullYear();
  const mm = String(parsed.getMonth() + 1).padStart(2, "0");
  const dd = String(parsed.getDate()).padStart(2, "0");
  return `${yyyy}.${mm}.${dd}`;
}

export default function ProposalLatestNewsWidget({ userId, hidden = false }) { // eslint-disable-line react/prop-types
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.allSettled([
      listBoardPosts("notices", { page: 1 }),
      listBoardPosts("industry-news", { page: 1 }),
    ]).then(([noticesRes, newsRes]) => {
      if (!active) return;
      const merged = [];
      if (noticesRes.status === "fulfilled") {
        for (const post of noticesRes.value?.items || []) {
          merged.push({ ...post, board_type: "notices" });
        }
      }
      if (newsRes.status === "fulfilled") {
        for (const post of newsRes.value?.items || []) {
          merged.push({ ...post, board_type: "industry-news" });
        }
      }
      merged.sort((a, b) => {
        if (Boolean(a.is_pinned) !== Boolean(b.is_pinned)) {
          return a.is_pinned ? -1 : 1;
        }
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      });
      setItems(merged.slice(0, 6));
      setLoaded(true);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!loaded || items.length === 0) return undefined;
    try {
      if (localStorage.getItem(dismissedStorageKey(userId)) === seoulTodayString()) {
        return undefined;
      }
    } catch {
      // Ignore storage access errors and still allow the daily slide preview.
    }
    const timerId = setTimeout(() => {
      setOpen(true);
    }, 350);
    return () => clearTimeout(timerId);
  }, [items.length, loaded, userId]);

  const handleHide = () => {
    try {
      localStorage.setItem(dismissedStorageKey(userId), seoulTodayString());
    } catch {
      // Ignore storage access errors.
    }
    setOpen(false);
  };

  if (hidden || (loaded && items.length === 0)) {
    return null;
  }

  return (
    <>
      {!open && (
        <Button
          variant="contained"
          aria-label="최신 소식 열기"
          aria-expanded={open}
          onClick={() => setOpen(true)}
          sx={{
            position: "fixed",
            right: 0,
            top: { xs: 84, md: 102 },
            zIndex: (theme) => theme.zIndex.drawer - 1,
            writingMode: "vertical-rl",
            minWidth: 40,
            px: 1,
            py: 1.75,
            borderRadius: "12px 0 0 12px",
            letterSpacing: 2,
            background: "linear-gradient(180deg, #1e293b 0%, #334155 100%)",
            color: "#f8fafc",
            boxShadow: "0 8px 24px rgba(15, 23, 42, 0.22)",
            opacity: 0.85,
            transition: "opacity 180ms ease, transform 180ms ease",
            "&:hover": {
              opacity: 1,
              background: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)",
            },
          }}
        >
          최신소식
        </Button>
      )}

      <Box
        role="region"
        aria-label="최신 소식"
        aria-hidden={!open}
        sx={{
          position: "fixed",
          right: 0,
          top: { xs: 78, md: 96 },
          zIndex: (theme) => theme.zIndex.drawer - 1,
          width: { xs: "min(320px, 88vw)", sm: 340 },
          pointerEvents: open ? "auto" : "none",
          transform: open ? "translateX(0)" : "translateX(calc(100% + 16px))",
          opacity: open ? 0.5 : 0,
          transition: "transform 360ms cubic-bezier(0.22, 1, 0.36, 1), opacity 240ms ease",
          "&:hover, &:focus-within": open ? { opacity: 0.96 } : undefined,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            bgcolor: "rgba(255, 255, 255, 0.94)",
            backdropFilter: "blur(10px)",
            borderRadius: "14px 0 0 14px",
            border: "1px solid rgba(15, 23, 42, 0.14)",
            borderRight: "none",
            boxShadow: "0 12px 32px rgba(15, 23, 42, 0.14)",
            overflow: "hidden",
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ px: 1.75, py: 1.1, bgcolor: "rgba(248, 250, 252, 0.9)" }}
          >
            <Stack direction="row" alignItems="center" spacing={0.75}>
              <CampaignRoundedIcon sx={{ fontSize: 18, color: "primary.main" }} />
              <Typography variant="subtitle2" fontWeight={800}>
                최신 소식
              </Typography>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <Button
                component={Link}
                to="/boards/notices"
                size="small"
                sx={{ minWidth: "auto", px: 0.75, fontSize: "0.75rem", fontWeight: 700 }}
              >
                전체보기
              </Button>
              <Tooltip title="오늘 하루 숨기기">
                <Button
                  size="small"
                  color="inherit"
                  onClick={handleHide}
                  endIcon={<ChevronRightRoundedIcon sx={{ fontSize: 16 }} />}
                  sx={{ minWidth: "auto", px: 0.75, fontSize: "0.75rem", fontWeight: 700, color: "text.secondary" }}
                >
                  숨기기
                </Button>
              </Tooltip>
            </Stack>
          </Stack>

          <Divider />

          <Stack divider={<Divider flexItem />} sx={{ maxHeight: 310, overflowY: "auto" }}>
            {items.map((item) => {
              const badge = BOARD_BADGES[item.board_type] || BOARD_BADGES.notices;
              return (
                <Box
                  key={`${item.board_type}-${item.id}`}
                  component={Link}
                  to={`/boards/${item.board_type}/${item.id}`}
                  sx={{
                    display: "block",
                    px: 1.75,
                    py: 1,
                    textDecoration: "none",
                    color: "inherit",
                    "&:hover": { bgcolor: "rgba(37, 99, 235, 0.06)" },
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={0.6} sx={{ mb: 0.35 }}>
                    <Chip
                      size="small"
                      label={badge.label}
                      sx={{
                        height: 18,
                        fontSize: "0.66rem",
                        fontWeight: 800,
                        bgcolor: badge.bgcolor,
                        color: badge.color,
                        "& .MuiChip-label": { px: 0.75 },
                      }}
                    />
                    {item.is_pinned && (
                      <PushPinOutlinedIcon sx={{ fontSize: 13, color: "primary.main" }} />
                    )}
                    <Typography variant="caption" color="text.secondary" noWrap sx={{ flex: 1, minWidth: 0 }}>
                      {categoryLabel(item.board_type, item.category)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0, fontSize: "0.68rem" }}>
                      {formatShortDate(item.created_at)}
                    </Typography>
                  </Stack>
                  <Typography variant="body2" fontWeight={700} noWrap sx={{ fontSize: "0.81rem" }}>
                    {item.title}
                  </Typography>
                </Box>
              );
            })}
          </Stack>
        </Paper>
      </Box>
    </>
  );
}
