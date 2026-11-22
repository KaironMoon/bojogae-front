/* eslint-disable react/prop-types */
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Box, Button, ButtonBase, Chip, Dialog, IconButton, Stack, Tooltip, Typography, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CloseIcon from "@mui/icons-material/Close";
import OpenInFullRoundedIcon from "@mui/icons-material/OpenInFullRounded";
import ZoomInRoundedIcon from "@mui/icons-material/ZoomInRounded";
import ZoomOutRoundedIcon from "@mui/icons-material/ZoomOutRounded";
import {
  BASE_PREVIEW_PAGE_WIDTH,
  MAX_PREVIEW_ZOOM,
  MIN_PREVIEW_ZOOM,
  PREVIEW_ZOOM_STEP,
  clampPreviewZoom,
  resolveActivePreviewPage,
} from "@/services/preview-carousel-utils";

const DESKTOP_VISIBLE_IMAGES = 3;
const IMAGE_GAP = 12;

export default function PreviewImageCarousel({ slides, title = "결과 미리보기", onRemove, disabled = false }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const visibleImages = isMobile ? 1 : DESKTOP_VISIBLE_IMAGES;
  const [position, setPosition] = useState(0);
  const [expandedOpen, setExpandedOpen] = useState(false);
  const [activePage, setActivePage] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [failed, setFailed] = useState({});
  const pointerStart = useRef(null);
  const suppressClick = useRef(false);
  const scrollContainerRef = useRef(null);
  const pageRefs = useRef([]);
  const pageButtonRefs = useRef([]);
  const pendingInitialPageRef = useRef(null);
  const initialAlignDeadlineRef = useRef(0);
  const programmaticScrollUntilRef = useRef(0);
  const lastPosition = Math.max(0, slides.length - visibleImages);
  const index = Math.min(position, lastPosition);
  const currentExpandedPage = Math.min(activePage, Math.max(0, slides.length - 1));
  const move = (next) => setPosition(Math.max(0, Math.min(next, lastPosition)));

  const scrollToPage = useCallback((targetIndex, behavior = "smooth") => {
    if (!slides.length) return;
    const clamped = Math.max(0, Math.min(targetIndex, slides.length - 1));
    setActivePage(clamped);
    const button = pageButtonRefs.current[clamped];
    button?.scrollIntoView?.({ block: "nearest", inline: "center", behavior: behavior === "smooth" ? "smooth" : "auto" });
    const container = scrollContainerRef.current;
    const targetEl = pageRefs.current[clamped];
    if (!container || !targetEl) return;
    const containerRect = container.getBoundingClientRect();
    const targetRect = targetEl.getBoundingClientRect();
    const top = Math.max(0, container.scrollTop + (targetRect.top - containerRect.top) - 16);
    if (behavior === "smooth") {
      programmaticScrollUntilRef.current = performance.now() + 650;
    } else {
      programmaticScrollUntilRef.current = 0;
    }
    container.scrollTo({ top, behavior });
  }, [slides.length]);

  const openExpandedAt = (slideIndex) => {
    const clamped = Math.max(0, Math.min(slideIndex, Math.max(0, slides.length - 1)));
    pendingInitialPageRef.current = clamped;
    initialAlignDeadlineRef.current = performance.now() + 1200;
    programmaticScrollUntilRef.current = 0;
    setZoom(1);
    setActivePage(clamped);
    setExpandedOpen(true);
  };

  const closeExpanded = () => {
    pendingInitialPageRef.current = null;
    programmaticScrollUntilRef.current = 0;
    setExpandedOpen(false);
    setZoom(1);
  };

  useEffect(() => {
    if (!expandedOpen) return undefined;
    let secondFrame = 0;
    const firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        if (pendingInitialPageRef.current !== null) {
          scrollToPage(pendingInitialPageRef.current, "auto");
        }
      });
    });
    return () => {
      window.cancelAnimationFrame(firstFrame);
      if (secondFrame) window.cancelAnimationFrame(secondFrame);
    };
  }, [expandedOpen, scrollToPage]);

  const handleUserScrollIntent = () => {
    pendingInitialPageRef.current = null;
    programmaticScrollUntilRef.current = 0;
  };

  const handleScroll = () => {
    if (performance.now() < programmaticScrollUntilRef.current) return;
    const container = scrollContainerRef.current;
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    const metrics = slides.map((_, idx) => {
      const el = pageRefs.current[idx];
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      return {
        top: container.scrollTop + (rect.top - containerRect.top),
        height: rect.height,
      };
    });
    const nextPage = resolveActivePreviewPage(
      metrics,
      container.scrollTop,
      container.clientHeight,
      container.scrollHeight,
    );
    setActivePage((current) => (current === nextPage ? current : nextPage));
  };

  const handleExpandedImageLoad = () => {
    const initialPage = pendingInitialPageRef.current;
    if (initialPage === null) return;
    if (performance.now() > initialAlignDeadlineRef.current) {
      pendingInitialPageRef.current = null;
      return;
    }
    if (initialPage > 0) {
      window.requestAnimationFrame(() => scrollToPage(initialPage, "auto"));
    } else {
      pendingInitialPageRef.current = null;
    }
  };

  const updateZoom = (nextZoom) => {
    const clamped = clampPreviewZoom(nextZoom);
    if (clamped === zoom) return;
    const pageToKeep = currentExpandedPage;
    pendingInitialPageRef.current = null;
    setZoom(clamped);
    window.requestAnimationFrame(() => scrollToPage(pageToKeep, "auto"));
  };

  const navigation = (direction) => {
    const previous = direction === "previous";
    return <ButtonBase aria-label={previous ? "이전 이미지" : "다음 이미지"}
      disabled={previous ? index === 0 : index === lastPosition}
      onClick={() => move(index + (previous ? -1 : 1))}
      sx={{ position: "absolute", zIndex: 2, top: 0, bottom: onRemove ? 64 : 0,
        [previous ? "left" : "right"]: 0, width: { xs: 40, sm: 64 }, borderRadius: 2 }}>
      <Box className="carousel-arrow" sx={{ opacity: { xs: 0.75, sm: 0.5 }, display: "flex", alignItems: "center", justifyContent: "center",
        width: { xs: 34, sm: 44 }, height: { xs: 34, sm: 44 }, borderRadius: "50%",
        bgcolor: "rgba(15,23,42,0.78)", color: "white", boxShadow: "0 2px 12px rgba(0,0,0,0.25)" }}>
        {previous ? <ChevronLeftIcon /> : <ChevronRightIcon />}
      </Box>
    </ButtonBase>;
  };
  if (!slides.length) return null;
  const pageWidthPx = Math.round(BASE_PREVIEW_PAGE_WIDTH * zoom);
  return <>
    <Stack role="region" aria-label={`${title} 이미지 슬라이드`} tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault(); move(index + (event.key === "ArrowLeft" ? -1 : 1));
        }
      }} sx={{ width: "100%", height: "100%", minHeight: 0, gap: 1.5 }}>
      <Box sx={{ position: "relative", flex: 1, minHeight: 0, overflow: "hidden", borderRadius: 2 }}
        onPointerDown={(event) => {
          suppressClick.current = false;
          pointerStart.current = { x: event.clientX, y: event.clientY };
        }}
        onPointerUp={(event) => {
          const start = pointerStart.current;
          pointerStart.current = null;
          if (!start) return;
          const delta = event.clientX - start.x;
          if (Math.abs(delta) > 45 && Math.abs(delta) > Math.abs(event.clientY - start.y)) {
            suppressClick.current = true; move(index + (delta < 0 ? 1 : -1));
          }
        }} onPointerCancel={() => { pointerStart.current = null; }}>
        <Box sx={{ display: "flex", gap: "12px", height: "100%", touchAction: "pan-y",
          transform: `translateX(calc(-${index * 100 / visibleImages}% - ${index * IMAGE_GAP / visibleImages}px))`,
          transition: "transform 240ms ease", "@media (prefers-reduced-motion: reduce)": { transition: "none" } }}>
          {slides.map((slide, slideIndex) => <Stack key={slide.id || slide.url || slideIndex}
            aria-hidden={slideIndex < index || slideIndex >= index + visibleImages}
            sx={{ flex: `0 0 calc((100% - ${IMAGE_GAP * (visibleImages - 1)}px) / ${visibleImages})`, minWidth: 0, height: "100%", gap: 0.75 }}>
            <ButtonBase tabIndex={slideIndex >= index && slideIndex < index + visibleImages ? 0 : -1}
              aria-label={`${title} ${slideIndex + 1}번 이미지 확대`} onClick={() => {
                if (suppressClick.current) { suppressClick.current = false; return; }
                openExpandedAt(slideIndex);
              }} sx={{ flex: 1, minHeight: 0, width: "100%", borderRadius: 2, overflow: "hidden", bgcolor: "grey.50", border: "1px solid", borderColor: "divider" }}>
              {failed[slide.url] ? <Typography color="error" sx={{ p: 1 }}>이미지를 불러오지 못했습니다.</Typography>
                : <Box component="img" src={slide.url} alt={`${title} ${slideIndex + 1}`} draggable={false}
                  onError={() => setFailed((current) => ({ ...current, [slide.url]: true }))}
                  sx={{ display: "block", width: "100%", height: "100%", objectFit: "contain", userSelect: "none" }} />}
            </ButtonBase>
            {onRemove && <Stack alignItems="center" sx={{ flexShrink: 0, height: 58 }}>
              <Typography noWrap variant="caption" sx={{ maxWidth: "100%" }}>{slide.filename || `이미지 ${slideIndex + 1}`}</Typography>
              <Button size="small" color="error" disabled={disabled} tabIndex={slideIndex >= index && slideIndex < index + visibleImages ? 0 : -1}
                aria-label={`${slideIndex + 1}번 이미지 삭제`} onClick={() => onRemove(slide)}>삭제</Button>
            </Stack>}
          </Stack>)}
        </Box>
        {navigation("previous")}{navigation("next")}
      </Box>
      <Stack alignItems="center" spacing={0.5} sx={{ flexShrink: 0, minWidth: 0 }}>
        <Box role="navigation" aria-label="미리보기 페이지 이동" sx={{ display: "flex", alignItems: "center", gap: 1,
          px: 2, py: 0.75, maxWidth: "100%", boxSizing: "border-box", overflowX: "auto", borderRadius: 99,
          bgcolor: "#0f172a", border: "1px solid #263247", scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" } }}>
          {Array.from({ length: lastPosition + 1 }, (_, page) => <ButtonBase key={page}
            aria-label={`${page + 1}번 위치로 이동`} aria-current={page === index ? "page" : undefined}
            onClick={() => move(page)} sx={{ flexShrink: 0, width: page === index ? 34 : 26, height: page === index ? 34 : 26,
              borderRadius: "50%", fontSize: 11, fontWeight: 700, bgcolor: page === index ? "#2563eb" : "#1e293b",
              color: page === index ? "white" : "#a5b4c8", border: page === index ? "2px solid #64748b" : "1px solid transparent",
              "&:hover, &:focus-visible": { bgcolor: page === index ? "#2563eb" : "#334155", borderColor: "#93c5fd" } }}>
            {page + 1}
          </ButtonBase>)}
        </Box>
        <Stack direction="row" spacing={1.25} alignItems="center" flexWrap="wrap" justifyContent="center">
          <Typography variant="caption" color="text.secondary">
            {visibleImages === 1 ? `${index + 1} / ${slides.length}` : `${index + 1}–${Math.min(index + visibleImages, slides.length)} / ${slides.length}`}
          </Typography>
          <Button
            size="small"
            variant="outlined"
            startIcon={<OpenInFullRoundedIcon fontSize="small" />}
            onClick={() => openExpandedAt(index)}
            sx={{ py: 0.25, px: 1.25, minHeight: 28, fontSize: 12 }}
          >
            100% 전체 페이지 보기
          </Button>
        </Stack>
      </Stack>
    </Stack>
    <Dialog
      fullScreen
      open={expandedOpen}
      onClose={closeExpanded}
      PaperProps={{
        sx: {
          bgcolor: "#080e1b",
          color: "white",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        },
        onKeyDown: (event) => {
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            scrollToPage(currentExpandedPage - 1, "smooth");
          } else if (event.key === "ArrowRight") {
            event.preventDefault();
            scrollToPage(currentExpandedPage + 1, "smooth");
          }
        },
      }}
    >
      <Stack
        sx={{
          flexShrink: 0,
          bgcolor: "#0f172a",
          borderBottom: "1px solid #1e293b",
          px: { xs: 1.5, sm: 2.5 },
          py: 1,
          gap: 1,
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1.5}>
          <Stack direction="row" alignItems="center" gap={1} sx={{ minWidth: 0 }}>
            <Typography noWrap sx={{ fontWeight: 750, minWidth: 0 }}>{title}</Typography>
            <Chip
              size="small"
              label={`${currentExpandedPage + 1} / ${slides.length}페이지`}
              sx={{ bgcolor: "#1e293b", color: "#e2e8f0", fontWeight: 700, flexShrink: 0 }}
            />
          </Stack>
          <Stack direction="row" alignItems="center" spacing={0.5} sx={{ flexShrink: 0 }}>
            <Tooltip title="축소">
              <span>
                <IconButton
                  size="small"
                  aria-label="확대 뷰어 축소"
                  disabled={zoom <= MIN_PREVIEW_ZOOM}
                  onClick={() => updateZoom(zoom - PREVIEW_ZOOM_STEP)}
                  sx={{ color: "white", "&.Mui-disabled": { color: "rgba(255,255,255,0.3)" } }}
                >
                  <ZoomOutRoundedIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Button
              size="small"
              aria-label="100% 배율로 초기화"
              onClick={() => updateZoom(1)}
              sx={{
                minWidth: 54,
                color: zoom === 1 ? "#93c5fd" : "white",
                fontFamily: "monospace",
                fontWeight: 700,
              }}
            >
              {Math.round(zoom * 100)}%
            </Button>
            <Tooltip title="확대">
              <span>
                <IconButton
                  size="small"
                  aria-label="확대 뷰어 확대"
                  disabled={zoom >= MAX_PREVIEW_ZOOM}
                  onClick={() => updateZoom(zoom + PREVIEW_ZOOM_STEP)}
                  sx={{ color: "white", "&.Mui-disabled": { color: "rgba(255,255,255,0.3)" } }}
                >
                  <ZoomInRoundedIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <IconButton aria-label="이미지 확대 닫기" onClick={closeExpanded} sx={{ color: "white" }}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </Stack>
        <Stack
          role="navigation"
          aria-label="확대 미리보기 페이지 선택"
          direction="row"
          alignItems="center"
          spacing={1}
          sx={{ minWidth: 0 }}
        >
          <IconButton
            size="small"
            aria-label="이전 페이지로 이동"
            disabled={currentExpandedPage === 0}
            onClick={() => scrollToPage(currentExpandedPage - 1, "smooth")}
            sx={{ color: "white", bgcolor: "#1e293b", "&.Mui-disabled": { color: "rgba(255,255,255,0.28)" } }}
          >
            <ChevronLeftIcon fontSize="small" />
          </IconButton>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.75,
              flex: 1,
              minWidth: 0,
              overflowX: "auto",
              py: 0.25,
              scrollbarWidth: "none",
              "&::-webkit-scrollbar": { display: "none" },
            }}
          >
            {slides.map((slide, idx) => {
              const selected = idx === currentExpandedPage;
              return (
                <ButtonBase
                  key={slide.id || slide.url || idx}
                  ref={(el) => { pageButtonRefs.current[idx] = el; }}
                  aria-label={`${idx + 1}페이지로 이동`}
                  aria-current={selected ? "page" : undefined}
                  onClick={() => scrollToPage(idx, "smooth")}
                  sx={{
                    flexShrink: 0,
                    px: { xs: 1.25, sm: 1.75 },
                    height: 32,
                    borderRadius: 99,
                    fontSize: 13,
                    fontWeight: 700,
                    bgcolor: selected ? "#2563eb" : "#1e293b",
                    color: selected ? "white" : "#cbd5e1",
                    border: selected ? "1px solid #93c5fd" : "1px solid #334155",
                    "&:hover, &:focus-visible": {
                      bgcolor: selected ? "#1d4ed8" : "#334155",
                      borderColor: "#93c5fd",
                    },
                  }}
                >
                  {isMobile ? `${idx + 1}P` : `${idx + 1}페이지`}
                </ButtonBase>
              );
            })}
          </Box>
          <IconButton
            size="small"
            aria-label="다음 페이지로 이동"
            disabled={currentExpandedPage >= slides.length - 1}
            onClick={() => scrollToPage(currentExpandedPage + 1, "smooth")}
            sx={{ color: "white", bgcolor: "#1e293b", "&.Mui-disabled": { color: "rgba(255,255,255,0.28)" } }}
          >
            <ChevronRightIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Stack>
      <Box
        ref={scrollContainerRef}
        onScroll={handleScroll}
        onWheel={handleUserScrollIntent}
        onTouchStart={handleUserScrollIntent}
        onPointerDown={handleUserScrollIntent}
        sx={{
          flex: 1,
          minHeight: 0,
          overflow: "auto",
          bgcolor: "#0b1220",
          p: { xs: 1.5, sm: 3 },
        }}
      >
        <Stack spacing={3} alignItems="center" sx={{ minWidth: "min-content", pb: 4 }}>
          {slides.map((slide, slideIndex) => (
            <Box
              key={slide.id || slide.url || slideIndex}
              ref={(el) => { pageRefs.current[slideIndex] = el; }}
              data-preview-page={slideIndex + 1}
              sx={{
                width: zoom <= 1 ? `min(100%, ${pageWidthPx}px)` : `${pageWidthPx}px`,
                flexShrink: 0,
              }}
            >
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                spacing={1}
                sx={{ mb: 0.75, px: 0.5 }}
              >
                <Typography variant="caption" sx={{ color: "#cbd5e1", fontWeight: 700 }}>
                  {slideIndex + 1} / {slides.length}페이지
                </Typography>
                {slide.filename && (
                  <Typography noWrap variant="caption" sx={{ color: "#94a3b8", minWidth: 0 }}>
                    {slide.filename}
                  </Typography>
                )}
              </Stack>
              <Box
                sx={{
                  bgcolor: "white",
                  borderRadius: 1.5,
                  overflow: "hidden",
                  boxShadow: "0 16px 40px rgba(0, 0, 0, 0.45)",
                }}
              >
                {failed[slide.url] ? (
                  <Alert severity="error" sx={{ m: 2 }}>이미지를 불러오지 못했습니다.</Alert>
                ) : (
                  <Box
                    component="img"
                    src={slide.url}
                    alt={`${title} ${slideIndex + 1}페이지`}
                    loading="eager"
                    draggable={false}
                    onLoad={handleExpandedImageLoad}
                    onError={() => setFailed((current) => ({ ...current, [slide.url]: true }))}
                    sx={{
                      display: "block",
                      width: "100%",
                      height: "auto",
                      userSelect: "none",
                    }}
                  />
                )}
              </Box>
            </Box>
          ))}
        </Stack>
      </Box>
    </Dialog>
  </>;
}
