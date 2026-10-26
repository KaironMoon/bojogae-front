/* eslint-disable react/prop-types */
import { useMemo, useState } from 'react';
import { Alert, Button, Stack, Typography, useMediaQuery } from '@mui/material';
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import ClaimPdfPreview from './ClaimPdfPreview';
import { downloadClaimBlob } from '@/services/claim-service';

export default function ClaimPdfResult({ result, disabled }) {
  const mobile = useMediaQuery('(max-width: 600px)');
  const [sharing, setSharing] = useState(false);
  const [shareFailed, setShareFailed] = useState(false);
  const filename = `${result.name}_청구서.pdf`;
  const file = useMemo(() => new File([result.blob], filename, { type: 'application/pdf' }), [result.blob, filename]);
  const canShare = mobile && !shareFailed && typeof navigator.share === 'function'
    && typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] });

  async function share() {
    setSharing(true);
    try {
      // Use the already generated file while the button click still has user activation.
      await navigator.share({ files: [file], title: `${result.name} 청구서` });
    } catch (error) {
      if (error.name !== 'AbortError') setShareFailed(true);
    } finally { setSharing(false); }
  }

  return <Stack spacing={1.5}>
    <Typography fontWeight={700}>{result.name} PDF · {result.pages}쪽</Typography>
    <ClaimPdfPreview blob={result.blob} name={result.name} />
    {shareFailed && <Alert severity="warning">공유창을 열지 못했습니다. PDF를 다운로드한 뒤 모바일 팩스 앱에 첨부해 주세요.</Alert>}
    <Button variant="outlined" sx={{ alignSelf: 'flex-start' }} disabled={disabled || sharing}
      aria-label={`${result.name} ${canShare ? '공유하기' : 'PDF 다운로드'}`}
      startIcon={canShare ? <ShareOutlinedIcon /> : <DownloadOutlinedIcon />}
      onClick={canShare ? share : () => downloadClaimBlob(result.blob, filename)}>
      {canShare ? '공유하기' : 'PDF 다운로드'}
    </Button>
    {canShare && <Typography variant="caption" color="text.secondary">공유 대상에서 모바일 팩스 앱을 선택해 주세요. 앱이 PDF 공유를 지원해야 표시되며, 실제 발송은 해당 앱에서 진행해 주세요.</Typography>}
  </Stack>;
}
