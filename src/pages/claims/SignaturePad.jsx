import { useEffect, useRef, useState } from 'react';
import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import { normalizeSignatureImage } from '../../services/signature-image';

// eslint-disable-next-line react/prop-types
export default function SignaturePad({ label, value, onChange, disabled }) {
  const ref = useRef(null);
  const drawing = useRef(false);
  const moved = useRef(false);
  const uploadVersion = useRef(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => () => { uploadVersion.current += 1; }, []);
  async function upload(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const version = ++uploadVersion.current;
    setUploading(true); setError('');
    try {
      const data = await normalizeSignatureImage(file);
      if (version === uploadVersion.current) onChange(data);
    } catch (e) {
      if (version === uploadVersion.current) setError(e.message);
    } finally {
      if (version === uploadVersion.current) setUploading(false);
    }
  }
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return undefined;
    if (!value) {
      canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
      return undefined;
    }
    const image = new Image();
    let cancelled = false;
    image.onload = () => {
      if (!cancelled && !drawing.current) {
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
        canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
      }
    };
    image.src = value;
    return () => { cancelled = true; };
  }, [value]);
  function point(event) {
    const rect = ref.current.getBoundingClientRect();
    return [(event.clientX - rect.left) * ref.current.width / rect.width,
      (event.clientY - rect.top) * ref.current.height / rect.height];
  }
  function finish(event) {
    if (!drawing.current) return;
    drawing.current = false;
    if (ref.current.hasPointerCapture(event.pointerId)) ref.current.releasePointerCapture(event.pointerId);
    if (moved.current) onChange(ref.current.toDataURL('image/png'));
  }
  return <Box>
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Typography variant="body2" fontWeight={700}>{label}</Typography>
      <Stack direction="row" spacing={1}>
      <Button component="label" size="small" disabled={disabled || uploading}>
        {uploading ? '이미지 처리 중…' : '서명 이미지 업로드'}
        <input type="file" hidden accept="image/png,image/jpeg,image/webp" aria-label={`${label} 이미지 업로드`}
          disabled={disabled || uploading} onChange={upload} />
      </Button>
      <Button size="small" disabled={disabled || uploading} onClick={() => {
        setError('');
        ref.current.getContext('2d').clearRect(0, 0, ref.current.width, ref.current.height); onChange('');
      }}>서명 지우기</Button>
      </Stack>
    </Stack>
    {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
    <Box sx={{ border: '1px solid', borderColor: value ? 'primary.main' : 'divider',
      borderRadius: 1.5, bgcolor: 'white', overflow: 'hidden' }}>
    {/* Native attributes set the drawing buffer; Box consumes width/height as CSS only. */}
    <canvas ref={ref} width={600} height={170} role="img" aria-label={`${label} 입력 영역`}
      style={{ display: 'block', width: '100%', height: 'auto', touchAction: 'none', cursor: disabled || uploading ? 'default' : 'crosshair' }}
      onPointerDown={event => {
        if (disabled || uploading) return;
        setError('');
        drawing.current = true; moved.current = false;
        ref.current.setPointerCapture(event.pointerId);
        const context = ref.current.getContext('2d');
        context.lineWidth = 2.8; context.strokeStyle = '#172536'; context.lineCap = 'round';
        context.beginPath(); context.moveTo(...point(event));
      }}
      onPointerMove={event => {
        if (!drawing.current) return;
        moved.current = true;
        const context = ref.current.getContext('2d'); context.lineTo(...point(event)); context.stroke();
      }} onPointerUp={finish} onPointerCancel={finish} />
    </Box>
    <Typography variant="caption" color="text.secondary">직접 서명하거나 서명 이미지를 선택해 주세요. PNG·JPG·WEBP, 최대 5MB.</Typography>
  </Box>;
}
