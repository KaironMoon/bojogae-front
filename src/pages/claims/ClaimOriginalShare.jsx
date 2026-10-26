/* eslint-disable react/prop-types */
import { useEffect, useRef, useState } from 'react';
import { Alert, Button, Stack, Typography, useMediaQuery } from '@mui/material';
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined';
import { claimError, downloadClaimBlob, getClaimOriginal } from '@/services/claim-service';

export const PC_SHARE_NOTICE = '공유되었습니다. 모바일에서 청구내역에 있는 공유버튼을 눌러주세요';

export default function ClaimOriginalShare({ result, requestId, deliveryId, expiresAt, serverTime, prepare, disabled, showRemaining = false }) {
  const mobile = useMediaQuery('(max-width: 600px), (pointer: coarse)');
  const [expired, setExpired] = useState(false);
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [sharing, setSharing] = useState(false);
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
      if (left === 0) { setExpired(true); setFile(null); }
    };
    expire();
    const interval = setInterval(expire, 1000);
    const timer = setTimeout(expire, Math.max(0, remaining));
    document.addEventListener('visibilitychange', expire);
    return () => { clearTimeout(timer); clearInterval(interval); document.removeEventListener('visibilitychange', expire); };
  }, [expiresAt, serverTime]);
  useEffect(() => {
    if (!mobile || result) return;
    const observer = new IntersectionObserver(entries => setVisible(entries[0].isIntersecting));
    if (anchor.current) observer.observe(anchor.current);
    return () => observer.disconnect();
  }, [mobile, result]);
  useEffect(() => {
    if (expired) { setFile(null); return; }
    if (result) {
      setFile(new File([result.blob], `${result.name}_청구서.pdf`, { type: 'application/pdf' }));
      return;
    }
    if (!mobile || !visible || expired) { setFile(null); return; }
    const controller = new AbortController();
    setError('');
    getClaimOriginal(requestId, deliveryId, controller.signal).then(value => {
      if (!controller.signal.aborted) setFile(value);
    }).catch(async e => {
      if (controller.signal.aborted) return;
      if (e.response?.status === 410) setExpired(true);
      else setError(await claimError(e));
    });
    return () => { controller.abort(); setFile(null); };
  }, [mobile, visible, expired, requestId, deliveryId, result]);
  async function share() {
    if (performance.now() >= deadlineRef.current) { setExpired(true); setFile(null); return; }
    setError(''); setNotice(''); setSharing(true);
    try {
      if (!mobile) {
        if (prepare) await prepare();
        setNotice(PC_SHARE_NOTICE);
      } else if (file && navigator.canShare?.({ files: [file] }) && navigator.share) {
        // The file is ready before the click, preserving Safari's user activation.
        await navigator.share({ files: [file], title: file.name });
      } else if (file) {
        downloadClaimBlob(file, file.name);
        setNotice('이 브라우저는 파일 공유를 지원하지 않습니다. 다운로드한 PDF를 모바일 팩스 앱에 첨부해 주세요.');
      }
    } catch (e) {
      if (e.name !== 'AbortError') setError(await claimError(e));
    } finally { setSharing(false); }
  }
  return <Stack ref={anchor} spacing={1}>
    {!expired && <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap">
    <Button variant="outlined" startIcon={<ShareOutlinedIcon />} onClick={share}
      disabled={disabled || sharing || (mobile && !file)} sx={{ alignSelf: 'flex-start' }}
      aria-label={`${result?.name || ''} 공유하기`.trim()}>
      {mobile && !file && !error ? '공유 파일 준비 중…' : '공유하기'}
    </Button>
    {showRemaining && remainingMs !== null && <Typography variant="caption" color="text.secondary">
      {remainingMs < 60000 ? '1분 미만 남음' : `약 ${Math.ceil(remainingMs / 60000)}분 남음`}
    </Typography>}
    </Stack>}
    {notice && !expired && <Alert severity="success" role="status">{notice}</Alert>}
    {error && !expired && <Alert severity="error">{error}</Alert>}
  </Stack>;
}
