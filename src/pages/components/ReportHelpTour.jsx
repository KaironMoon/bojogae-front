/* eslint-disable react/prop-types */
import { Box, Button, IconButton, Modal, Paper, Stack, Typography } from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { useLayoutEffect, useRef, useState } from 'react';

const STEPS = [
  {
    target: 'favorites', title: '즐겨찾기',
    message: '자주 사용하는 보고서는 즐겨찾기에 저장할 수 있습니다. 많이 쓰는 보고서를 미리 넣어드렸어요.',
  },
  {
    target: 'categories', title: '카테고리',
    message: '여기를 눌러보시면 다양한 보고서를 보실 수 있습니다.',
  },
  {
    target: 'upload', title: '서류 업로드',
    message: '보험사에서 받으신 서류나 기존 서류를 여기에 넣어서 업로드할 수 있습니다.',
  },
  {
    target: 'generate', title: '보고서 생성',
    message: '보고서 생성을 누르시면 보고서가 생성됩니다. 생성되는 데 30초~1분가량 걸려요. 완료되면 리스트에서 선택해서 보실 수 있습니다.',
  },
];

const GAP = 16;
const EDGE = 12;

export default function ReportHelpTour({ step, rootRef, onNext, onClose }) {
  const cardRef = useRef(null);
  const nextRef = useRef(null);
  const [position, setPosition] = useState(null);
  const current = STEPS[step];

  useLayoutEffect(() => {
    if (!current) return undefined;
    const visible = (element) => element.getBoundingClientRect().width > 0
      && element.getBoundingClientRect().height > 0;
    const target = [...(rootRef.current?.querySelectorAll(`[data-report-help="${current.target}"]`) || [])].find(visible)
      || (current.target === 'upload' ? rootRef.current?.querySelector('[data-report-help="inputs"]') : null);
    let frame;

    const measure = () => {
      if (!cardRef.current) return;
      const width = window.innerWidth;
      const height = window.innerHeight;
      const card = cardRef.current.getBoundingClientRect();
      const rect = target?.getBoundingClientRect();
      let highlight = null;
      let left = (width - card.width) / 2;
      let top = (height - card.height) / 2;
      if (rect && rect.width > 0 && rect.height > 0) {
        const x = Math.max(6, rect.left - 5);
        const y = Math.max(6, rect.top - 5);
        const right = Math.min(width - 6, rect.right + 5);
        const bottom = Math.min(height - 6, rect.bottom + 5);
        highlight = { left: x, top: y, width: Math.max(0, right - x), height: Math.max(0, bottom - y) };
        if (bottom + GAP + card.height <= height - EDGE) {
          top = bottom + GAP;
          left = x;
        } else if (y - GAP - card.height >= EDGE) {
          top = y - GAP - card.height;
          left = x;
        } else if (right + GAP + card.width <= width - EDGE) {
          left = right + GAP;
          top = y;
        } else if (x - GAP - card.width >= EDGE) {
          left = x - GAP - card.width;
          top = y;
        } else {
          // On short screens, keep the controls visible with the target above them.
          top = height - EDGE - card.height;
          highlight.height = Math.max(0, Math.min(highlight.height, top - GAP - y));
        }
      }
      setPosition({ highlight,
        left: Math.max(EDGE, Math.min(left, width - EDGE - card.width)),
        top: Math.max(EDGE, Math.min(top, height - EDGE - card.height)),
        inputOnly: current.target === 'upload' && target?.dataset.reportHelp === 'inputs',
      });
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };

    target?.scrollIntoView({ behavior: 'instant', block: 'center', inline: 'nearest' });
    nextRef.current?.focus({ preventScroll: true });
    measure();
    const observer = new ResizeObserver(schedule);
    if (target) observer.observe(target);
    if (cardRef.current) observer.observe(cardRef.current);
    window.addEventListener('resize', schedule);
    window.addEventListener('scroll', schedule, true);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('resize', schedule);
      window.removeEventListener('scroll', schedule, true);
    };
  }, [current, rootRef]);

  return <Modal open onClose={onClose} hideBackdrop>
    <Box role="dialog" aria-modal="true" aria-labelledby="report-help-title" aria-describedby="report-help-message"
      tabIndex={-1} sx={{ position: 'fixed', inset: 0, outline: 0 }}>
      {position?.highlight ? <Box aria-hidden="true" data-report-help-highlight={current.target}
        sx={{ position: 'fixed', ...position.highlight, boxSizing: 'border-box', border: '3px solid',
          borderColor: 'primary.main', borderRadius: 2, pointerEvents: 'none',
          boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.62)' }} />
        : <Box aria-hidden="true" sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(15, 23, 42, 0.62)' }} />}
      <Paper ref={cardRef} elevation={12} sx={{ position: 'fixed', width: 'min(380px, calc(100vw - 24px))',
        boxSizing: 'border-box', p: 2.5, borderRadius: 3,
        maxHeight: 'calc(100dvh - 24px)', overflowY: 'auto',
        left: position?.left ?? EDGE, top: position?.top ?? EDGE,
        visibility: position ? 'visible' : 'hidden' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Typography variant="caption" color="primary.main" fontWeight={800}>보고서 만들기 도움말 · {step + 1} / {STEPS.length}</Typography>
          <IconButton size="small" aria-label="도움말 닫기" onClick={onClose}><CloseRoundedIcon fontSize="small" /></IconButton>
        </Stack>
        <Typography id="report-help-title" variant="h6" fontWeight={800} sx={{ mb: 1 }}>{current.title}</Typography>
        <Box aria-live="polite">
          <Typography id="report-help-message" sx={{ lineHeight: 1.8, wordBreak: 'keep-all', overflowWrap: 'anywhere' }}>{current.message}</Typography>
          {position?.inputOnly && <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            현재 선택한 보고서는 파일 첨부 없이 입력 항목을 작성합니다. 파일 첨부가 필요한 보고서를 선택하면 업로드 영역이 표시됩니다.
          </Typography>}
        </Box>
        <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}>
          <Button ref={nextRef} variant="contained" onClick={step === STEPS.length - 1 ? onClose : onNext}>
            {step === STEPS.length - 1 ? '도움말 종료' : '다음'}
          </Button>
        </Stack>
      </Paper>
    </Box>
  </Modal>;
}
