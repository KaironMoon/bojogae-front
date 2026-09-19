/* eslint-disable react/prop-types */
import { useRef, useState } from "react";
import { Alert, Box, Button, ButtonBase, Dialog, IconButton, Stack, Typography, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CloseIcon from "@mui/icons-material/Close";

const DESKTOP_VISIBLE_IMAGES = 3;
const IMAGE_GAP = 12;

export default function PreviewImageCarousel({ slides, title = "결과 미리보기", onRemove, disabled = false }) {
  const theme = useTheme();
  const visibleImages = useMediaQuery(theme.breakpoints.down("sm")) ? 1 : DESKTOP_VISIBLE_IMAGES;
  const [position, setPosition] = useState(0);
  const [expanded, setExpanded] = useState(null);
  const [failed, setFailed] = useState({});
  const pointerStart = useRef(null);
  const suppressClick = useRef(false);
  const lastPosition = Math.max(0, slides.length - visibleImages);
  const index = Math.min(position, lastPosition);
  const move = (next) => setPosition(Math.max(0, Math.min(next, lastPosition)));
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
                setExpanded(slide);
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
        <Typography variant="caption" color="text.secondary">
          {visibleImages === 1 ? `${index + 1} / ${slides.length}` : `${index + 1}–${Math.min(index + visibleImages, slides.length)} / ${slides.length}`}
        </Typography>
      </Stack>
    </Stack>
    <Dialog fullScreen open={Boolean(expanded)} onClose={() => setExpanded(null)}
      PaperProps={{ sx: { bgcolor: "#080e1b", color: "white", overflow: "hidden" } }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2, height: 56, flexShrink: 0 }}>
        <Typography noWrap sx={{ minWidth: 0 }}>{expanded?.filename || title}</Typography>
        <IconButton aria-label="이미지 확대 닫기" onClick={() => setExpanded(null)} sx={{ color: "white" }}><CloseIcon /></IconButton>
      </Stack>
      <Box sx={{ flex: 1, minHeight: 0, p: 2, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {expanded && (failed[expanded.url] ? <Alert severity="error">이미지를 불러오지 못했습니다.</Alert>
          : <Box component="img" src={expanded.url} alt={`${title} 확대`} onError={() => setFailed((current) => ({ ...current, [expanded.url]: true }))}
            sx={{ width: "100%", height: "100%", objectFit: "contain" }} />)}
      </Box>
    </Dialog>
  </>;
}
