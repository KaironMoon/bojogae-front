/* eslint-disable react/prop-types */
import { useEffect, useRef, useState } from 'react';
import { Alert, Button, Stack } from '@mui/material';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import { claimError, downloadClaimBlob, prepareClaimShare } from '@/services/claim-service';
import ClaimOriginalShare from './ClaimOriginalShare';

export default function ClaimPdfResult({ result, disabled, saved, prepare, faxAction, feedbackId }) {
  const pending = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    setDownloading(false); setError('');
    return () => { pending.current?.abort(); pending.current = null; };
  }, [result]);
  async function download() {
    if (pending.current) return;
    const controller = new AbortController();
    pending.current = controller;
    setDownloading(true); setError('');
    try {
      const files = await prepareClaimShare(result.blob, `${result.name}_청구서.pdf`, controller.signal);
      if (!controller.signal.aborted) files.forEach(file => downloadClaimBlob(file, file.name));
    } catch (e) {
      if (!controller.signal.aborted) setError(await claimError(e));
    } finally {
      if (pending.current === controller) pending.current = null;
      if (!controller.signal.aborted) setDownloading(false);
    }
  }
  return <Stack spacing={1.5}>
    <ClaimOriginalShare result={result} disabled={disabled} prepare={prepare}
      additionalActions={faxAction} feedbackId={feedbackId}
      expiresAt={saved?.original_expires_at} serverTime={saved?.server_time} />
    <Button variant="outlined" startIcon={<DownloadOutlinedIcon />} disabled={disabled || downloading}
      aria-label={`${result.name} PDF 다운로드`}
      sx={{ alignSelf: 'flex-start' }} onClick={download}>
      {downloading ? '흑백 PDF 준비 중…' : 'PDF 다운로드'}
    </Button>
    {error && <Alert severity="error">{error}</Alert>}
  </Stack>;
}
