/* eslint-disable react/prop-types */
import { useEffect, useRef, useState } from 'react';
import { Alert, Button, Stack } from '@mui/material';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import { claimError, downloadClaimBlob, prepareClaimShare, prepareClaimDownload, getClaimOriginalDownload } from '@/services/claim-service';
import ClaimOriginalShare from './ClaimOriginalShare';

export default function ClaimPdfResult({ result, disabled, saved, prepare, faxAction, feedbackId }) {
  const pending = useRef(null);
  const storedDownload = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    storedDownload.current = null;
    setDownloading(false); setError('');
    // Prepare once, like mobile sharing. Both actions reuse the same promise
    // while it is running and the same File objects after it completes.
    prepareClaimShare(result.blob, `${result.name}_청구서.pdf`, controller.signal).catch(() => {});
    return () => {
      controller.abort(); pending.current?.abort(); pending.current = null;
    };
  }, [result]);
  async function download() {
    if (pending.current) return;
    const controller = new AbortController();
    pending.current = controller;
    setDownloading(true); setError('');
    try {
      let file = await prepareClaimDownload(result.blob, `${result.name}_청구서.pdf`, controller.signal);
      if (controller.signal.aborted) return;
      // Both actions persist the PC/mobile copies for later use in history.
      if (prepare) {
        const request = await prepare();
        const delivery = request?.deliveries?.find(item => String(item.insurer_id) === String(result.id));
        if (!delivery) throw new Error('저장된 전송용 파일을 찾지 못했습니다. 다시 시도해 주세요.');
        if (!storedDownload.current) {
          const copy = getClaimOriginalDownload(request.id, delivery.id, controller.signal);
          storedDownload.current = copy;
          copy.catch(() => { if (storedDownload.current === copy) storedDownload.current = null; });
        }
        file = await storedDownload.current;
      }
      if (!controller.signal.aborted) downloadClaimBlob(file, file.name);
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
