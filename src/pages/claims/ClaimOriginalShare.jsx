/* eslint-disable react/prop-types */
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Alert, Button, Stack, Typography, useMediaQuery } from '@mui/material';
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import { claimError, downloadClaimBlob, getClaimOriginalShare, getClaimOriginalDownload, prepareClaimShare } from '@/services/claim-service';

export const PC_SHARE_NOTICE = '공유되었습니다. 모바일에서 청구내역에 있는 공유버튼을 눌러주세요';

export default function ClaimOriginalShare({ result, requestId, deliveryId, expiresAt, serverTime, prepare, disabled, showRemaining = false, additionalActions, feedbackId }) {
  const mobile = useMediaQuery('(max-width: 600px), (pointer: coarse)');
  const [expired, setExpired] = useState(false);
  const [files, setFiles] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [sharing, setSharing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [remainingMs, setRemainingMs] = useState(null);
  const anchor = useRef(null);
  const deadlineRef = useRef(Infinity);
  useEffect(() => {
    if (!expiresAt) return;
    const remaining = Date.parse(expiresAt) - Date.parse(serverTime);
    const deadline = performance.now() + Math.max(0, remaining);
    deadlineRef.current = deadline;
    const expire = () => {
      const left = Math.max(0, deadline - performance.now());
      setRemainingMs(left);
      if (left === 0) { setExpired(true); setFiles(null); }
    };
    expire();
    const interval = setInterval(expire, 1000);
    const timer = setTimeout(expire, Math.max(0, remaining));
    document.addEventListener('visibilitychange', expire);
    return () => { clearTimeout(timer); clearInterval(interval); document.removeEventListener('visibilitychange', expire); };
  }, [expiresAt, serverTime]);
  useEffect(() => {
    if (result) return;
    const observer = new IntersectionObserver(entries => setVisible(entries[0].isIntersecting));
    if (anchor.current) observer.observe(anchor.current);
    return () => observer.disconnect();
  }, [mobile, result]);
  useEffect(() => {
    if (expired) { setFiles(null); return; }
    if ((result && !mobile) || (!result && !visible) || expired) { setFiles(null); return; }
    const controller = new AbortController();
    setError('');
    const pending = result
      ? prepareClaimShare(result.blob, `${result.name}_청구서.pdf`, controller.signal)
      : mobile ? getClaimOriginalShare(requestId, deliveryId, controller.signal)
        : getClaimOriginalDownload(requestId, deliveryId, controller.signal).then(file => [file]);
    pending.then(value => {
      if (!controller.signal.aborted && performance.now() < deadlineRef.current) setFiles(value);
    }).catch(async e => {
      if (controller.signal.aborted) return;
      if (e.response?.status === 410) setExpired(true);
      else setError(await claimError(e));
    });
    return () => { controller.abort(); setFiles(null); };
  }, [mobile, visible, expired, requestId, deliveryId, result, attempt]);
  async function share() {
    if (performance.now() >= deadlineRef.current) { setExpired(true); setFiles(null); return; }
    setError(''); setNotice(''); setSharing(true);
    try {
      if (!mobile) {
        if (prepare) await prepare();
        setNotice(PC_SHARE_NOTICE);
      } else if (files?.length && navigator.canShare?.({ files }) && navigator.share) {
        // Open the share sheet before saving so Safari retains the click's user activation.
        // Save even if the user cancels sharing, and report save failures independently.
        const sharePromise = navigator.share({ files, title: result?.name || '청구서' });
        const [shared, stored] = await Promise.allSettled([sharePromise, prepare?.()]);
        if (stored.status === 'rejected') throw stored.reason;
        if (shared.status === 'rejected') throw shared.reason;
      } else if (files?.length) {
        files.forEach(file => downloadClaimBlob(file, file.name));
        if (prepare) await prepare();
        setNotice('이 브라우저는 파일 공유를 지원하지 않습니다. 다운로드한 PDF를 모바일 팩스 앱에 첨부해 주세요.');
      }
    } catch (e) {
      if (e.name !== 'AbortError') setError(await claimError(e));
    } finally { setSharing(false); }
  }
  const feedback = <>
    {notice && !expired && <Alert severity="success" role="status" sx={{ overflowWrap: 'anywhere' }}>{notice}</Alert>}
    {error && !expired && <Alert severity="error" sx={{ overflowWrap: 'anywhere' }}>{error}</Alert>}
  </>;
  const feedbackTarget = feedbackId && typeof document !== 'undefined' ? document.getElementById(feedbackId) : null;
  return <Stack ref={anchor} spacing={1}>
    {!expired && <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap">
    <Button variant="outlined" startIcon={<ShareOutlinedIcon />} onClick={() => {
      if (mobile && !files?.length && error) { setError(''); setAttempt(value => value + 1); }
      else share();
    }}
      disabled={disabled || sharing || (mobile && !files?.length && !error)} sx={{ alignSelf: 'flex-start' }}
      aria-label={`${result?.name || ''} 공유하기`.trim()}>
      {mobile && !files?.length ? (error ? '공유 파일 다시 준비' : '공유 파일 준비 중…') : sharing ? '저장 중…' : '공유하기'}
    </Button>
    {!result && <Button variant="outlined" startIcon={<DownloadOutlinedIcon />}
      disabled={disabled || downloading || (!mobile && !files?.length && !error)}
      onClick={async () => {
        if (performance.now() >= deadlineRef.current) { setExpired(true); setFiles(null); return; }
        if (!mobile && !files?.length && error) { setError(''); setAttempt(value => value + 1); return; }
        setDownloading(true); setError('');
        try {
          const file = mobile ? await getClaimOriginalDownload(requestId, deliveryId) : files?.[0];
          if (file && performance.now() < deadlineRef.current) downloadClaimBlob(file, file.name);
        } catch (e) {
          if (e.response?.status === 410) setExpired(true);
          else setError(await claimError(e));
        } finally { setDownloading(false); }
      }}>
      {downloading ? '흑백 PDF 준비 중…' : !mobile && !files?.length ? (error ? '파일 다시 준비' : '파일 준비 중…') : '다운로드'}
    </Button>}
    {additionalActions}
    {showRemaining && remainingMs !== null && <Typography variant="caption" color="text.secondary">
      {remainingMs < 60000 ? '1분 미만 남음' : `약 ${Math.ceil(remainingMs / 60000)}분 남음`}
    </Typography>}
    </Stack>}
    {mobile && files?.length > 1 && !expired && <Typography variant="caption" color="text.secondary">
      8MB 미만의 PDF {files.length}개로 나눴습니다. 공유하기를 누르면 모든 파일을 함께 전달합니다.
    </Typography>}
    {(notice || error) && !expired && (feedbackTarget ? createPortal(feedback, feedbackTarget) : feedback)}
  </Stack>;
}
