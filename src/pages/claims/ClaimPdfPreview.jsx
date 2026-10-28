import { useEffect, useRef, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Stack, Typography } from '@mui/material';

let library;
function loadLibrary() {
  library ||= Promise.all([
    import('pdfjs-dist'), import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
  ]).then(([pdf, worker]) => {
    pdf.GlobalWorkerOptions.workerSrc = worker.default;
    return pdf;
  });
  return library;
}

// eslint-disable-next-line react/prop-types
export default function ClaimPdfPreview({ blob, name, rotations = [], onRotate, disabled = false }) {
  const container = useRef(null);
  const canvas = useRef(null);
  const [width, setWidth] = useState(600);
  const [document, setDocument] = useState(null);
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(100, entry.contentRect.width)));
    observer.observe(container.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    let task;
    setDocument(null); setPage(1); setBusy(true); setError('');
    (async () => {
      try {
        // eslint-disable-next-line react/prop-types
        const [pdf, data] = await Promise.all([loadLibrary(), blob.arrayBuffer()]);
        if (cancelled) return;
        task = pdf.getDocument({
          data: new Uint8Array(data),
          isEvalSupported: false,
          cMapUrl: `${import.meta.env.BASE_URL}assets/pdfjs/cmaps/`,
          cMapPacked: true,
        });
        const result = await task.promise;
        if (!cancelled) setDocument(result);
      } catch {
        if (!cancelled) { setError('미리보기를 열 수 없습니다. PDF를 다운로드해 확인해 주세요.'); setBusy(false); }
      }
    })();
    return () => { cancelled = true; task?.destroy(); };
  }, [blob]);

  const pageRotation = rotations[page - 1] || 0;
  useEffect(() => {
    if (!document) return;
    let cancelled = false;
    let render;
    setBusy(true);
    (async () => {
      try {
        const pdfPage = await document.getPage(page);
        if (cancelled) return;
        const rotation = (pdfPage.rotate + pageRotation) % 360;
        const base = pdfPage.getViewport({ scale: 1, rotation });
        const cssScale = width / base.width;
        const ratio = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(4000000 / (width * base.height * cssScale)));
        const viewport = pdfPage.getViewport({ scale: cssScale * ratio, rotation });
        const target = canvas.current;
        target.width = Math.floor(viewport.width); target.height = Math.floor(viewport.height);
        target.style.width = `${width}px`; target.style.height = `${base.height * cssScale}px`;
        render = pdfPage.render({ canvasContext: target.getContext('2d'), viewport });
        await render.promise;
        if (!cancelled) setBusy(false);
      } catch {
        if (!cancelled) { setError('이 페이지를 표시할 수 없습니다. PDF를 다운로드해 확인해 주세요.'); setBusy(false); }
      }
    })();
    return () => { cancelled = true; render?.cancel(); };
  }, [document, page, width, pageRotation]);

  return <Stack spacing={1}>
    <Stack direction="row" spacing={2} alignItems="center" justifyContent="center">
      <Button disabled={!document || page <= 1} onClick={() => setPage(p => p - 1)}>이전 쪽</Button>
      <Typography aria-live="polite">{page} / {document?.numPages || '…'}쪽</Typography>
      <Button disabled={!document || page >= document.numPages} onClick={() => setPage(p => p + 1)}>다음 쪽</Button>
    </Stack>
    {onRotate && <Button variant="outlined" size="small" disabled={disabled || !document || busy || Boolean(error)}
      onClick={() => onRotate(page - 1)} aria-label={`${name} ${page}쪽 90도 회전`}>현재 {page}쪽 90° 회전</Button>}
    {error && <Alert severity="warning">{error}</Alert>}
    <Box ref={container} sx={{ position: 'relative', width: '100%', minHeight: 160, border: '1px solid #dce2ea', bgcolor: 'white', overflow: 'hidden' }}>
      {busy && <CircularProgress size={28} sx={{ position: 'absolute', top: 24, left: 'calc(50% - 14px)' }} />}
      <canvas ref={canvas} role="img" aria-label={`${name} 청구서 ${page}쪽 미리보기`} style={{ display: 'block', visibility: busy || error ? 'hidden' : 'visible' }} />
    </Box>
  </Stack>;
}
