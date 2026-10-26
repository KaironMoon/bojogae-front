/* eslint-disable react/prop-types */
import { Button, Stack } from '@mui/material';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import { downloadClaimBlob } from '@/services/claim-service';
import ClaimOriginalShare from './ClaimOriginalShare';

export default function ClaimPdfResult({ result, disabled, saved, prepare }) {
  return <Stack spacing={1.5}>
    <ClaimOriginalShare result={result} disabled={disabled} prepare={prepare}
      expiresAt={saved?.original_expires_at} serverTime={saved?.server_time} />
    <Button variant="outlined" startIcon={<DownloadOutlinedIcon />} disabled={disabled}
      aria-label={`${result.name} PDF 다운로드`}
      sx={{ alignSelf: 'flex-start' }} onClick={() => downloadClaimBlob(result.blob, `${result.name}_청구서.pdf`)}>
      PDF 다운로드
    </Button>
  </Stack>;
}
