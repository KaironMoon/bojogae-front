/* eslint-disable react/prop-types */
import { useEffect, useRef, useState } from "react";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import RemoveRoundedIcon from "@mui/icons-material/RemoveRounded";
import {
  Box,
  Button,
  Dialog,
  IconButton,
  Typography,
} from "@mui/material";

const MIN_ZOOM = 1;
const MAX_ZOOM = 3.5;

function clampZoom(value) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(value * 100) / 100));
}

function touchDistance(touches) {
  if (!touches || touches.length < 2) return 0;
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.hypot(dx, dy);
}

export default function ImageZoomDialog({
  open,
  images = [],
  initialIndex = 0,
  onClose,
}) {
  const [index, setIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const pinchStartRef = useRef(null);

  useEffect(() => {
    if (open) {
      setIndex(Math.min(Math.max(0, initialIndex), Math.max(0, images.length - 1)));
      setZoom(1);
    }
  }, [open, initialIndex, images.length]);

  useEffect(() => {
    setZoom(1);
  }, [index]);

  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "ArrowLeft" && images.length > 1) {
        setIndex((prev) => (prev - 1 + images.length) % images.length);
      } else if (event.key === "ArrowRight" && images.length > 1) {
        setIndex((prev) => (prev + 1) % images.length);
      } else if (event.key === "+" || event.key === "=") {
        setZoom((prev) => clampZoom(prev + 0.5));
      } else if (event.key === "-") {
        setZoom((prev) => clampZoom(prev - 0.5));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, images.length]);

  const current = images[index] || images[0] || null;
  const hasMultiple = images.length > 1;

  const handleTouchStart = (event) => {
    if (event.touches.length === 2) {
      pinchStartRef.current = {
        distance: touchDistance(event.touches),
        zoom,
      };
    }
  };

  const handleTouchMove = (event) => {
    if (event.touches.length === 2 && pinchStartRef.current?.distance > 0) {
      const ratio = touchDistance(event.touches) / pinchStartRef.current.distance;
      setZoom(clampZoom(pinchStartRef.current.zoom * ratio));
    }
  };

  const handleTouchEnd = () => {
    pinchStartRef.current = null;
  };

  const handleToggleDouble = () => {
    setZoom((prev) => (prev > 1.05 ? 1 : 2));
  };

  return (
    <Dialog
      fullScreen
      open={Boolean(open && current)}
      onClose={onClose}
      sx={{ zIndex: (theme) => theme.zIndex.modal + 25 }}
      PaperProps={{
        sx: {
          bgcolor: "rgba(15, 23, 42, 0.96)",
          color: "#FFFFFF",
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      <Box
        sx={{
          px: { xs: 1.25, sm: 2.5 },
          py: 1,
          borderBottom: "1px solid rgba(255, 255, 255, 0.12)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          flexShrink: 0,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0, flex: 1 }}>
          {hasMultiple && (
            <Box
              component="span"
              sx={{
                px: 1,
                py: 0.3,
                borderRadius: 99,
                bgcolor: "rgba(255, 255, 255, 0.14)",
                fontSize: 12,
                fontWeight: 800,
                flexShrink: 0,
              }}
            >
              {index + 1} / {images.length}
            </Box>
          )}
          <Typography
            variant="body2"
            sx={{ color: "#E2E8F0", fontWeight: 700, fontSize: 13 }}
            noWrap
          >
            {current?.alt || "이미지 확대 보기"}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexShrink: 0 }}>
          <IconButton
            size="small"
            aria-label="축소"
            disabled={zoom <= MIN_ZOOM}
            onClick={() => setZoom((prev) => clampZoom(prev - 0.5))}
            sx={{ color: "#FFFFFF", "&.Mui-disabled": { color: "rgba(255,255,255,0.3)" } }}
          >
            <RemoveRoundedIcon fontSize="small" />
          </IconButton>
          <Button
            size="small"
            onClick={() => setZoom(1)}
            sx={{
              minWidth: 52,
              px: 1,
              py: 0.35,
              borderRadius: 99,
              color: "#FFFFFF",
              bgcolor: "rgba(255, 255, 255, 0.12)",
              fontSize: 12,
              fontWeight: 800,
            }}
          >
            {Math.round(zoom * 100)}%
          </Button>
          <IconButton
            size="small"
            aria-label="확대"
            disabled={zoom >= MAX_ZOOM}
            onClick={() => setZoom((prev) => clampZoom(prev + 0.5))}
            sx={{ color: "#FFFFFF", "&.Mui-disabled": { color: "rgba(255,255,255,0.3)" } }}
          >
            <AddRoundedIcon fontSize="small" />
          </IconButton>
          {current?.src && (
            <IconButton
              size="small"
              component="a"
              href={current.src}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="새 창에서 원본 보기"
              sx={{ color: "#CBD5E1" }}
            >
              <OpenInNewRoundedIcon fontSize="small" />
            </IconButton>
          )}
          <IconButton
            size="small"
            aria-label="닫기"
            onClick={onClose}
            sx={{ color: "#FFFFFF", ml: 0.5, bgcolor: "rgba(255, 255, 255, 0.12)" }}
          >
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      <Box
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onDoubleClick={handleToggleDouble}
        onClick={(event) => {
          if (event.target === event.currentTarget) onClose?.();
        }}
        sx={{
          flex: 1,
          minHeight: 0,
          overflow: "auto",
          WebkitOverflowScrolling: "touch",
          display: "flex",
          alignItems: zoom > 1 ? "flex-start" : "center",
          justifyContent: zoom > 1 ? "flex-start" : "center",
          p: { xs: 1.5, sm: 3 },
          position: "relative",
        }}
      >
        {current && (
          <img
            src={current.src}
            alt={current.alt || "안내 이미지"}
            style={{
              display: "block",
              margin: zoom > 1 ? "0 auto" : "auto",
              width: zoom > 1 ? `${zoom * 100}%` : "auto",
              maxWidth: zoom > 1 ? "none" : "100%",
              maxHeight: zoom > 1 ? "none" : "calc(100dvh - 135px)",
              height: "auto",
              objectFit: "contain",
              borderRadius: zoom > 1 ? 0 : 12,
              userSelect: "none",
            }}
          />
        )}
      </Box>

      <Box
        sx={{
          px: { xs: 1.5, sm: 2.5 },
          py: 1,
          borderTop: "1px solid rgba(255, 255, 255, 0.12)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          flexShrink: 0,
        }}
      >
        {hasMultiple ? (
          <Button
            size="small"
            startIcon={<ChevronLeftRoundedIcon />}
            onClick={() => setIndex((prev) => (prev - 1 + images.length) % images.length)}
            sx={{ color: "#FFFFFF", fontWeight: 700 }}
          >
            이전
          </Button>
        ) : (
          <Box />
        )}
        <Typography variant="caption" sx={{ color: "#94A3B8", textAlign: "center" }}>
          두 번 탭하거나 + / - 로 확대 · 드래그하여 이동
        </Typography>
        {hasMultiple ? (
          <Button
            size="small"
            endIcon={<ChevronRightRoundedIcon />}
            onClick={() => setIndex((prev) => (prev + 1) % images.length)}
            sx={{ color: "#FFFFFF", fontWeight: 700 }}
          >
            다음
          </Button>
        ) : (
          <Box />
        )}
      </Box>
    </Dialog>
  );
}
