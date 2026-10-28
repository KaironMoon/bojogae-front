/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react';
import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import RotateRightIcon from '@mui/icons-material/RotateRight';
import ClaimPdfPreview from './ClaimPdfPreview';

function ImagePreview({ file, rotation }) {
  const [url, setUrl] = useState('');
  const [automatic, setAutomatic] = useState(0);
  useEffect(() => {
    const source = URL.createObjectURL(file);
    setUrl(source); setAutomatic(0);
    return () => URL.revokeObjectURL(source);
  }, [file]);
  return <Box sx={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f5f6f8', overflow: 'hidden' }}>
    {url && <Box component="img" src={url} alt={`${file.name} 첨부 미리보기`}
      onLoad={event => setAutomatic(event.target.naturalWidth > event.target.naturalHeight ? 90 : 0)}
      sx={{ maxWidth: 180, maxHeight: 180, objectFit: 'contain', transform: `rotate(${automatic + rotation}deg)` }} />}
  </Box>;
}

export default function ClaimAttachments({ files, rotations, disabled, onRotate, onDelete }) {
  return <Stack spacing={2} sx={{ mt: 2 }}>
    {files.map((file, index) => <Paper key={index} variant="outlined" sx={{ p: 1.5, minWidth: 0 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1} sx={{ mb: 1 }}>
        <Typography variant="body2" sx={{ overflowWrap: 'anywhere' }}>{file.name}</Typography>
        <Button color="error" disabled={disabled} onClick={() => onDelete(index)} aria-label={`${file.name} 삭제`}>삭제</Button>
      </Stack>
      {file.type === 'application/pdf' || /\.pdf$/i.test(file.name)
        ? <ClaimPdfPreview blob={file} name={file.name} rotations={rotations[index] || []}
            disabled={disabled} onRotate={page => onRotate(index, page)} />
        : <>
          <ImagePreview file={file} rotation={rotations[index]?.[0] || 0} />
          <Button size="small" variant="outlined" startIcon={<RotateRightIcon />} disabled={disabled}
            onClick={() => onRotate(index, 0)} sx={{ mt: 1 }} aria-label={`${file.name} 90도 회전`}>90° 회전</Button>
        </>}
    </Paper>)}
  </Stack>;
}
