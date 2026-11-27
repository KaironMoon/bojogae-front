/* eslint-disable react/prop-types */
import { Box, Button, IconButton, Modal, Paper, Stack, Typography } from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import PlayCircleFilledRoundedIcon from '@mui/icons-material/PlayCircleFilledRounded';
import { useLayoutEffect, useRef, useState } from 'react';

const GAP = 14;
const EDGE = 12;

function getTargetRect(current, root, iframeEl, targetAttr) {
  if (current.iframeTextMatch && iframeEl) {
    try {
      const candidates = iframeEl.contentDocument?.querySelectorAll('button, a, [role="button"]') || [];
      for (const el of candidates) {
        const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
        if (!current.iframeTextMatch.test(text)) continue;
        const r = el.getBoundingClientRect();
        if (r.width <= 0 || r.height <= 0) continue;
        const frameRect = iframeEl.getBoundingClientRect();
        const scale = iframeEl.offsetWidth > 0 ? frameRect.width / iframeEl.offsetWidth : 1;
        return {
          element: null,
          rect: {
            left: frameRect.left + r.left * scale,
            top: frameRect.top + r.top * scale,
            right: frameRect.left + r.right * scale,
            bottom: frameRect.top + r.bottom * scale,
            width: r.width * scale,
            height: r.height * scale,
          },
        };
      }
    } catch {
      // Fall back to DOM target marker when iframe document is cross-origin or unavailable.
    }
  }

  const isVisible = (element) => {
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  };
  let element = [...root.querySelectorAll(`[${targetAttr}="${current.target}"]`)].find(isVisible) || null;
  if (!element && current.fallbackTarget) {
    element = [...root.querySelectorAll(`[${targetAttr}="${current.fallbackTarget}"]`)].find(isVisible) || null;
  }
  if (!element && current.fallbackSelector) {
    element = [...root.querySelectorAll(current.fallbackSelector)].find(isVisible) || null;
  }
  if (!element) return { element: null, rect: null };
  return { element, rect: element.getBoundingClientRect() };
}

export default function CanvasHelpTour({
  open,
  step,
  steps,
  panelRef,
  iframeRef = null,
  guideLabel = '문서 캔버스 가이드',
  targetAttr = 'data-canvas-help',
  scrollTarget = false,
  onNext,
  onClose,
}) {
  const cardRef = useRef(null);
  const nextRef = useRef(null);
  const [position, setPosition] = useState(null);
  const current = open && steps?.length ? steps[step] : null;
  const isLast = Boolean(steps?.length && step >= steps.length - 1);

  useLayoutEffect(() => {
    if (!current) {
      setPosition(null);
      return undefined;
    }

    const root = panelRef?.current || document;
    const iframeEl = iframeRef?.current || null;
    let frame;

    const measure = () => {
      if (!cardRef.current) return;
      const { rect } = getTargetRect(current, root, iframeEl, targetAttr);
      const width = window.innerWidth;
      const height = window.innerHeight;
      const card = cardRef.current.getBoundingClientRect();
      let highlight = null;
      let left = (width - card.width) / 2;
      let top = (height - card.height) / 2;

      if (rect && rect.width > 0 && rect.height > 0) {
        const x = Math.max(6, rect.left - 6);
        const y = Math.max(6, rect.top - 6);
        const right = Math.min(width - 6, rect.right + 6);
        const bottom = Math.min(height - 6, rect.bottom + 6);
        highlight = {
          left: x,
          top: y,
          width: Math.max(0, right - x),
          height: Math.max(0, bottom - y),
        };
        const targetCenterX = rect.left + rect.width / 2;
        const alignedLeft = targetCenterX < width / 2 ? x : right - card.width;
        if (bottom + GAP + card.height <= height - EDGE) {
          top = bottom + GAP;
          left = alignedLeft;
        } else if (y - GAP - card.height >= EDGE) {
          top = y - GAP - card.height;
          left = alignedLeft;
        } else if (x - GAP - card.width >= EDGE) {
          left = x - GAP - card.width;
          top = y;
        } else {
          top = height - EDGE - card.height;
          left = width - EDGE - card.width;
        }
      }

      setPosition({
        highlight,
        left: Math.max(EDGE, Math.min(left, width - EDGE - card.width)),
        top: Math.max(EDGE, Math.min(top, height - EDGE - card.height)),
      });
    };

    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };

    const initial = getTargetRect(current, root, iframeEl, targetAttr);
    if (scrollTarget && initial.element) {
      initial.element.scrollIntoView({ behavior: 'instant', block: 'center', inline: 'nearest' });
    }
    nextRef.current?.focus({ preventScroll: true });
    measure();
    const settledTimer1 = window.setTimeout(schedule, 120);
    const settledTimer2 = window.setTimeout(schedule, 350);

    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(schedule) : null;
    if (initial.element && observer) observer.observe(initial.element);
    if (panelRef?.current && observer) observer.observe(panelRef.current);
    if (iframeEl && observer) observer.observe(iframeEl);
    if (cardRef.current && observer) observer.observe(cardRef.current);

    const panelEl = panelRef?.current;
    panelEl?.addEventListener('transitionend', schedule);
    iframeEl?.addEventListener('load', schedule);
    window.addEventListener('resize', schedule);
    window.addEventListener('scroll', schedule, true);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(settledTimer1);
      window.clearTimeout(settledTimer2);
      observer?.disconnect();
      panelEl?.removeEventListener('transitionend', schedule);
      iframeEl?.removeEventListener('load', schedule);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('scroll', schedule, true);
    };
  }, [current, panelRef, iframeRef, targetAttr, scrollTarget]);

  if (!current) return null;

  return (
    <Modal open onClose={onClose} hideBackdrop sx={{ zIndex: (theme) => theme.zIndex.drawer + 5 }}>
      <Box
        role="dialog"
        aria-modal="true"
        aria-labelledby="canvas-help-title"
        aria-describedby="canvas-help-message"
        tabIndex={-1}
        sx={{ position: 'fixed', inset: 0, outline: 0 }}
      >
        {position?.highlight ? (
          <Box
            aria-hidden="true"
            data-canvas-help-highlight={current.target}
            sx={{
              position: 'fixed',
              ...position.highlight,
              boxSizing: 'border-box',
              border: '3px solid',
              borderColor: 'primary.main',
              borderRadius: 2,
              pointerEvents: 'none',
              boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.62)',
            }}
          />
        ) : (
          <Box aria-hidden="true" sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(15, 23, 42, 0.62)' }} />
        )}

        <Paper
          ref={cardRef}
          elevation={12}
          sx={{
            position: 'fixed',
            width: 'min(390px, calc(100vw - 24px))',
            boxSizing: 'border-box',
            p: 2.5,
            borderRadius: 3,
            maxHeight: 'calc(100dvh - 24px)',
            overflowY: 'auto',
            left: position?.left ?? EDGE,
            top: position?.top ?? EDGE,
            visibility: position ? 'visible' : 'hidden',
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="caption" color="primary.main" fontWeight={800}>
              {guideLabel} · {step + 1} / {steps.length}
            </Typography>
            <IconButton size="small" aria-label="가이드 닫기" onClick={onClose}>
              <CloseRoundedIcon fontSize="small" />
            </IconButton>
          </Stack>
          <Typography id="canvas-help-title" variant="h6" fontWeight={800} sx={{ mb: 1 }}>
            {current.title}
          </Typography>
          <Typography
            id="canvas-help-message"
            sx={{
              lineHeight: 1.75,
              wordBreak: 'keep-all',
              overflowWrap: 'anywhere',
              color: 'text.secondary',
              fontSize: 14,
            }}
          >
            {current.message}
          </Typography>
          {current.note && (
            <Box
              sx={{
                mt: 1.25,
                p: 1.25,
                borderRadius: 2,
                bgcolor: '#ECFDF5',
                border: '1px solid #A7F3D0',
                color: '#065F46',
                fontSize: 12.5,
                fontWeight: 700,
                lineHeight: 1.6,
                wordBreak: 'keep-all',
              }}
            >
              {current.note}
            </Box>
          )}
          {current.actionHref && current.actionLabel && (
            <Button
              component="a"
              href={current.actionHref}
              target="_blank"
              rel="noopener noreferrer"
              variant="outlined"
              size="small"
              startIcon={<PlayCircleFilledRoundedIcon />}
              sx={{
                mt: 1.5,
                color: '#DC2626',
                borderColor: '#FCA5A5',
                fontWeight: 800,
                '&:hover': { borderColor: '#DC2626', bgcolor: '#FEF2F2' },
              }}
            >
              {current.actionLabel}
            </Button>
          )}
          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1} sx={{ mt: 2 }}>
            <Button size="small" color="inherit" onClick={onClose} sx={{ color: 'text.secondary', fontWeight: 700 }}>
              다시 보지 않기
            </Button>
            <Button ref={nextRef} variant="contained" onClick={isLast ? onClose : onNext}>
              {isLast ? '가이드 종료' : '다음'}
            </Button>
          </Stack>
        </Paper>
      </Box>
    </Modal>
  );
}
