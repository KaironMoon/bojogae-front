import { useEffect, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle,
  Divider, Paper, Stack, Typography } from '@mui/material';
import { claimError, getClaimFile, getClaimRequest, getClaimRequests } from '@/services/claim-service';
import ClaimPdfPreview from './ClaimPdfPreview';

const timestamp = value => new Date(value).toLocaleString('ko-KR');

// eslint-disable-next-line react/prop-types
export default function ClaimHistory({ onReuse }) {
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [history, setHistory] = useState(null);
  const [detail, setDetail] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(''); setHistory(null);
    getClaimRequests(page, controller.signal).then(setHistory).catch(async e => {
      if (!controller.signal.aborted) setError(await claimError(e));
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [page, refresh]);
  async function open(id) {
    setBusy(true); setError(''); setPreview(null);
    try { setDetail(await getClaimRequest(id)); }
    catch (e) { setError(await claimError(e)); }
    finally { setBusy(false); }
  }
  async function reuse() {
    setBusy(true); setError('');
    try {
      const files = await Promise.all(detail.files.map(async item => new File(
        [await getClaimFile(detail.id, item.id)], item.filename, { type: item.content_type })));
      onReuse(detail, files);
    } catch (e) { setError(await claimError(e)); }
    finally { setBusy(false); }
  }
  async function showPdf(delivery) {
    setBusy(true); setError('');
    try { setPreview({ name: delivery.insurer_name, blob: await getClaimFile(detail.id, delivery.id, true) }); }
    catch (e) { setError(await claimError(e)); }
    finally { setBusy(false); }
  }
  async function download(file) {
    setBusy(true); setError('');
    try {
      const blob = await getClaimFile(detail.id, file.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a'); link.href = url; link.download = file.filename;
      link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) { setError(await claimError(e)); }
    finally { setBusy(false); }
  }
  return <Stack spacing={2}>
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Typography variant="h6" fontWeight={700}>청구 요청 내역</Typography>
      <Button disabled={loading || busy} onClick={() => setRefresh(v => v + 1)}>새로고침</Button>
    </Stack>
    <Alert severity="info">팩스 보내기를 눌러 저장한 내역입니다. 실제 팩스 발송과 비용 차감은 진행되지 않았습니다.</Alert>
    {error && !detail && <Alert severity="error">{error}</Alert>}
    {(loading || (busy && !detail)) && <CircularProgress size={24} aria-label="청구 내역 불러오는 중" />}
    {!loading && history?.items.length === 0 && <Typography color="text.secondary">저장된 청구 요청이 없습니다.</Typography>}
    {history?.items.map(item => <Paper variant="outlined" sx={{ p: 2 }} key={item.id}>
      <Stack spacing={1}>
        <Typography fontWeight={700}>{item.insured_name} · {timestamp(item.created_at)}</Typography>
        <Typography variant="body2">사고일 {item.accident_date}</Typography>
        <Typography variant="body2">{item.deliveries.map(d => d.insurer_name).join(', ')}</Typography>
        <Typography variant="body2" color="text.secondary">발송 요청 저장됨 · 실제 발송 전</Typography>
        <Box><Button disabled={busy} onClick={() => open(item.id)}>상세 보기 · 같은 내용으로 작성</Button></Box>
      </Stack>
    </Paper>)}
    {history && history.total_pages > 1 && <Stack direction="row" gap={2} alignItems="center">
      <Button disabled={page === 1 || loading || busy} onClick={() => setPage(p => p - 1)}>이전</Button>
      <Typography>{page} / {history.total_pages}</Typography>
      <Button disabled={page >= history.total_pages || loading || busy} onClick={() => setPage(p => p + 1)}>다음</Button>
    </Stack>}
    <Dialog open={Boolean(detail)} onClose={() => { if (!busy) { setDetail(null); setPreview(null); } }} fullWidth maxWidth="md">
      <DialogTitle>청구 요청 상세</DialogTitle>
      <DialogContent dividers>
        {detail && <Stack spacing={2}>
          {error && <Alert severity="error">{error}</Alert>}
          <Typography>{detail.claim.insured_name} · {timestamp(detail.created_at)}</Typography>
          <Typography>사고 유형: {detail.claim.accident_type} · 사고일: {detail.claim.accident_date}</Typography>
          <Typography sx={{ whiteSpace: 'pre-wrap' }}>사고 경위: {detail.claim.accident_description}</Typography>
          <Typography>지급 계좌: {detail.claim.bank_name} · 예금주 {detail.claim.account_holder}</Typography>
          <Typography variant="body2" color="text.secondary">인적사항·계좌번호·서명 등 전체 내용은 보험사별 PDF 또는 ‘같은 내용으로 작성’에서 확인할 수 있습니다.</Typography>
          <Divider />
          {detail.deliveries.map(d => <Stack key={d.id} direction="row" gap={1} alignItems="center" flexWrap="wrap">
            <Typography>{d.insurer_name} · {d.pages}쪽 · 발송 요청 저장됨</Typography>
            <Typography variant="body2" color="text.secondary">{d.fax_number
              ? `${d.fax_type === 'VIRTUAL' ? '개별 가상팩스' : '공용팩스'}: ${d.fax_number}`
              : '수신 팩스 번호 기록 없음'}</Typography>
            <Button disabled={busy} onClick={() => showPdf(d)}>저장된 PDF 확인</Button>
          </Stack>)}
          {preview && <ClaimPdfPreview blob={preview.blob} name={preview.name} />}
          <Typography fontWeight={700}>첨부서류 {detail.files.length}개</Typography>
          {detail.files.map(file => <Box key={file.id}><Button disabled={busy} onClick={() => download(file)}>{file.filename}</Button></Box>)}
          <Alert severity="info">같은 내용으로 작성하면 입력 내용·서명·첨부서류를 불러옵니다. 가상팩스 번호는 유효기간과 청구 대상이 다를 수 있어 다시 입력하며, 개인정보 동의도 다시 확인해 주세요.</Alert>
          {busy && <CircularProgress size={24} aria-label="청구서 처리 중" />}
        </Stack>}
      </DialogContent>
      <DialogActions>
        <Button disabled={busy} onClick={() => { setDetail(null); setPreview(null); }}>닫기</Button>
        <Button variant="contained" disabled={busy} onClick={reuse}>같은 내용으로 작성</Button>
      </DialogActions>
    </Dialog>
  </Stack>;
}
