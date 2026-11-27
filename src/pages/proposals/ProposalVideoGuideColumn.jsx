/* eslint-disable react/prop-types */
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import PlayCircleFilledRoundedIcon from "@mui/icons-material/PlayCircleFilledRounded";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import { Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";
import { useState } from "react";

import videos from "@/pages/help/design/videos.json";

function VideoThumbCard({ video }) {
  const [src, setSrc] = useState(video.thumbUrl || `https://i.ytimg.com/vi/${video.videoId}/hq720.jpg`);

  return (
    <Paper
      component="a"
      href={video.watchUrl || `https://youtu.be/${video.videoId}`}
      target="_blank"
      rel="noopener noreferrer"
      variant="outlined"
      sx={{
        display: "block",
        flexShrink: 0,
        textDecoration: "none",
        color: "inherit",
        borderRadius: "12px",
        overflow: "hidden",
        bgcolor: "#FFFFFF",
        transition: "transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease",
        "&:hover": {
          transform: "translateY(-1px)",
          borderColor: "#EF4444",
          boxShadow: "0 6px 16px rgba(220, 38, 38, 0.12)",
          "& .video-play-overlay": {
            opacity: 1,
            transform: "scale(1.06)",
          },
        },
      }}
    >
      <Box
        sx={{
          position: "relative",
          width: "100%",
          aspectRatio: "16 / 9",
          flexShrink: 0,
          bgcolor: "#0F172A",
          overflow: "hidden",
        }}
      >
        <Box
          component="img"
          src={src}
          alt={video.title}
          loading="lazy"
          onError={() => {
            const fallback = `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`;
            if (src !== fallback) setSrc(fallback);
          }}
          sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(180deg, rgba(15, 23, 42, 0.12) 0%, rgba(15, 23, 42, 0.45) 100%)",
            pointerEvents: "none",
          }}
        />
        <Chip
          size="small"
          label={video.num}
          sx={{
            position: "absolute",
            top: 8,
            left: 8,
            height: 22,
            fontSize: "0.7rem",
            fontWeight: 900,
            bgcolor: "rgba(15, 23, 42, 0.84)",
            color: "#FFFFFF",
            "& .MuiChip-label": { px: 0.85 },
          }}
        />
        {video.duration && (
          <Box
            component="span"
            sx={{
              position: "absolute",
              bottom: 8,
              right: 8,
              px: 0.85,
              py: 0.25,
              borderRadius: "6px",
              bgcolor: "rgba(15, 23, 42, 0.86)",
              color: "#FFFFFF",
              fontSize: "0.72rem",
              fontWeight: 800,
              lineHeight: 1.3,
            }}
          >
            {video.duration}
          </Box>
        )}
        <Box
          className="video-play-overlay"
          sx={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            opacity: 0.9,
            transition: "opacity 160ms ease, transform 160ms ease",
          }}
        >
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: "50%",
              bgcolor: "rgba(220, 38, 38, 0.92)",
              color: "#FFFFFF",
              display: "grid",
              placeItems: "center",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.35)",
            }}
          >
            <PlayArrowRoundedIcon sx={{ fontSize: 26 }} />
          </Box>
        </Box>
      </Box>

      <Box sx={{ p: 1.35 }}>
        {video.badge && (
          <Chip
            size="small"
            label={video.badge}
            sx={{
              height: 19,
              mb: 0.65,
              fontSize: "0.68rem",
              fontWeight: 800,
              bgcolor: "rgba(220, 38, 38, 0.08)",
              color: "#B91C1C",
              "& .MuiChip-label": { px: 0.8 },
            }}
          />
        )}
        <Typography
          variant="body2"
          fontWeight={800}
          sx={{
            fontSize: "0.84rem",
            lineHeight: 1.4,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {video.title}
        </Typography>
      </Box>
    </Paper>
  );
}

export default function ProposalVideoGuideColumn({ onHide, inDrawer = false }) {
  return (
    <Paper
      variant={inDrawer ? "elevation" : "outlined"}
      elevation={0}
      aria-label="기능 설명 영상"
      sx={{
        borderRadius: inDrawer ? 0 : "16px",
        border: inDrawer ? 0 : undefined,
        height: inDrawer ? "100%" : "auto",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        boxShadow: inDrawer ? "none" : "0 1px 3px rgba(15, 23, 42, 0.05)",
      }}
    >
      <Box
        sx={{
          px: 1.5,
          py: 1.2,
          flexShrink: 0,
          borderBottom: 1,
          borderColor: "divider",
          bgcolor: "#FFF5F5",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          columnGap: 1,
          rowGap: 0.5,
        }}
      >
        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ minWidth: 0 }}>
          <PlayCircleFilledRoundedIcon sx={{ color: "#DC2626", fontSize: 19, flexShrink: 0 }} />
          <Typography variant="subtitle2" fontWeight={800} noWrap>
            기능 설명 영상
          </Typography>
          <Chip
            size="small"
            label={videos.length}
            sx={{
              height: 18,
              fontSize: "0.68rem",
              fontWeight: 900,
              bgcolor: "#DC2626",
              color: "#FFFFFF",
              "& .MuiChip-label": { px: 0.7 },
            }}
          />
        </Stack>
        <Button
          size="small"
          color="inherit"
          onClick={onHide}
          startIcon={inDrawer
            ? <CloseRoundedIcon sx={{ fontSize: "15px !important" }} />
            : <VisibilityOffOutlinedIcon sx={{ fontSize: "14px !important" }} />}
          sx={{
            minWidth: "auto",
            px: 0.75,
            py: 0.35,
            fontSize: "0.72rem",
            fontWeight: 700,
            color: "text.secondary",
            whiteSpace: "nowrap",
            flexShrink: 0,
            borderRadius: "8px",
            "&:hover": { bgcolor: "rgba(15, 23, 42, 0.06)", color: "text.primary" },
          }}
        >
          {inDrawer ? "닫기" : "컬럼 더이상 안보기"}
        </Button>
      </Box>

      <Stack
        spacing={1.5}
        sx={{
          p: 1.35,
          flex: inDrawer ? 1 : "none",
          minHeight: 0,
          overflowY: inDrawer ? "auto" : "visible",
        }}
      >
        {videos.map((video) => (
          <VideoThumbCard key={video.id} video={video} />
        ))}
      </Stack>
    </Paper>
  );
}
