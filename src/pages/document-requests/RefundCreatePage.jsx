import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, Box, Button, CircularProgress, Paper, Stack, TextField, Typography } from '@mui/material';
import { getProposal, proposalFileUrl } from '@/services/proposal-service';
import { createRefund, requestError } from '@/services/document-request-service';

export default function RefundCreatePage() {
  const { generationId } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  useEffect(() => {
    let active = true;
    setLoading(true); setDocument(null); setError('');
    getProposal(generationId).then(item => { if (active) setDocument(item); })
      .catch(err => { if (active) setError(requestError(err)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [generationId]);
  const eligible = document && ['COMPLETED', 'FAILED'].includes(document.status)
    && ['CONSUMED', 'REVIEW_REQUIRED'].includes(document.point_status);
  async function submit(event) {
    event.preventDefault();
    setWorking(true); setError('');
    try {
      await createRefund(Number(generationId), content.trim());
      navigate('/refund-requests', { state: { notice: '환불 요청이 접수되었습니다. 관리자 검토 후 처리됩니다.' } });
    } catch (err) { setError(requestError(err)); }
    finally { setWorking(false); }
  }
  return <Box component="main" sx={{ maxWidth: 800, mx: 'auto', p: { xs: 2, md: 4 } }}>
    <Typography variant="h5" fontWeight={800} sx={{ mb: 2 }}>문서 환불 요청</Typography>
    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
    {loading ? <CircularProgress /> : document && <Paper component="form" onSubmit={submit} variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3 }}>
      <Stack spacing={2}>
        <Typography variant="h6">{document.title}</Typography>
        <Typography variant="body2">생성 건 #{document.id} · 사용 포인트 {document.point_cost}P</Typography>
        <Alert severity={eligible ? 'info' : 'warning'}>{eligible
          ? '문서의 품질 문제를 작성해주세요. 관리자가 생성 문서를 확인한 후 사용 포인트 반환 또는 거절을 결정합니다.'
          : '현재 과금 상태에서는 환불을 요청할 수 없습니다.'}</Alert>
        {document.status === 'COMPLETED' && <Button href={proposalFileUrl(document.id, 'output')} target="_blank" rel="noopener noreferrer">생성 문서 확인</Button>}
        <TextField label="문제 내용 및 환불 요청 사유" multiline minRows={6} required value={content} disabled={working || !eligible}
          inputProps={{ maxLength: 10000 }} onChange={e => setContent(e.target.value)} helperText={`${content.length}/10000`} />
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <Button type="submit" variant="contained" disabled={working || !eligible || !content.trim()}>{working ? '접수 중…' : '환불 요청 접수'}</Button>
          <Button disabled={working} onClick={() => navigate('/proposals')}>생성 내역으로</Button>
        </Stack>
      </Stack>
    </Paper>}
  </Box>;
}
