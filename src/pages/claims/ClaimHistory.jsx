import { useEffect, useRef, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle,
  Divider, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import { claimError, getClaimFile, getClaimRequest, getClaimRequests, getClaimInsurers, sendClaimFax, downloadClaimDocument } from '@/services/claim-service';
import ClaimPdfPreview from './ClaimPdfPreview';
import ClaimDeliveryStatus from './ClaimDeliveryStatus';
import ClaimFaxDestinations from './ClaimFaxDestinations';

const timestamp = value => value ? new Date(value).toLocaleString('ko-KR') : '—';

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
  const [faxOpen, setFaxOpen] = useState(false);
  const [faxNumbers, setFaxNumbers] = useState({});
  const [insurers, setInsurers] = useState([]);
  const faxKey = useRef(null);
  const sending = useRef(false);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(''); setHistory(null);
    getClaimRequests(page, controller.signal).then(setHistory).catch(async e => {
      if (!controller.signal.aborted) setError(await claimError(e));
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [page, refresh]);
  async function open(id, showFax = false) {
    setBusy(true); setError(''); setPreview(null); setFaxOpen(false);
    setFaxNumbers({}); faxKey.current = null;
    try {
      const [document, catalog] = await Promise.all([getClaimRequest(id), getClaimInsurers()]);
      setDetail(document); setInsurers(catalog); setFaxOpen(showFax);
    }
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
  async function downloadDocument(id) {
    setBusy(true); setError('');
    try { await downloadClaimDocument(id); }
    catch (e) { setError(await claimError(e)); }
    finally { setBusy(false); }
  }
  async function sendFax() {
    if (sending.current) return;
    sending.current = true; setBusy(true); setError('');
    faxKey.current ||= crypto.randomUUID();
    try {
      const result = await sendClaimFax(detail.id, faxKey.current, faxNumbers);
      setDetail(result); faxKey.current = null; setRefresh(v => v + 1);
    } catch (e) { setError(await claimError(e)); }
    finally { sending.current = false; setBusy(false); }
  }
  return <Stack spacing={2}>
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Typography variant="h4" fontWeight={800}>청구내역</Typography>
      <Button disabled={loading || busy} onClick={() => setRefresh(v => v + 1)}>새로고침</Button>
    </Stack>
    <Alert severity="info">파일 저장과 팩스 요청 내역입니다. 현재 팩스 서비스 미연결로 발송 요청은 실패 이력으로 기록되며 비용은 차감되지 않습니다.</Alert>
    {error && !detail && <Alert severity="error">{error}</Alert>}
    {(loading || (busy && !detail)) && <CircularProgress size={24} aria-label="청구 내역 불러오는 중" />}
    {!loading && history?.items.length === 0 && <Typography color="text.secondary">저장된 청구 요청이 없습니다.</Typography>}
    {history?.items.map(item => <Paper variant="outlined" sx={{ p: 2 }} key={item.id}>
      <Stack spacing={1}>
        <Typography fontWeight={700}>{item.insured_name} · {timestamp(item.created_at)}</Typography>
        <Typography variant="body2">사고일 {item.accident_date} · {item.save_mode === 'FILE' ? '파일 저장' : '팩스 요청'}</Typography>
        <Stack spacing={1} aria-label="보험사별 팩스 전송 상태">
          {item.deliveries.map(delivery => <Stack key={delivery.id} direction="row" gap={1} alignItems="center" flexWrap="wrap">
            <Typography variant="body2">{delivery.insurer_name}</Typography>
            <ClaimDeliveryStatus status={delivery.status} />
          </Stack>)}
        </Stack>
        <Stack direction="row" gap={1} flexWrap="wrap">
          <Button disabled={busy} onClick={() => open(item.id)}>상세 보기 · 같은 내용으로 작성</Button>
          <Button disabled={busy} onClick={() => downloadDocument(item.id)}>파일 다운로드</Button>
          <Button variant="outlined" disabled={busy} onClick={() => open(item.id, true)}>
            {item.deliveries.some(d => d.status !== 'STORED') ? '팩스 재발송' : '팩스 발송'}
          </Button>
        </Stack>
      </Stack>
    </Paper>)}
    {history && history.total_pages > 1 && <Stack direction="row" gap={2} alignItems="center">
      <Button disabled={page === 1 || loading || busy} onClick={() => setPage(p => p - 1)}>이전</Button>
      <Typography>{page} / {history.total_pages}</Typography>
      <Button disabled={page >= history.total_pages || loading || busy} onClick={() => setPage(p => p + 1)}>다음</Button>
    </Stack>}
    <Dialog open={Boolean(detail)} onClose={() => { if (!busy) { setDetail(null); setPreview(null); } }} fullWidth maxWidth="md">
      <DialogTitle>청구 상세</DialogTitle>
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
            <Typography>{d.insurer_name} · {d.pages}쪽</Typography>
            <ClaimDeliveryStatus status={d.status} />
            <Typography variant="body2" color="text.secondary">{d.fax_number
              ? `${d.fax_type === 'VIRTUAL' ? '개별 가상팩스' : '공용팩스'}: ${d.fax_number}`
              : '수신 팩스 번호 기록 없음'}</Typography>
            <Button disabled={busy} onClick={() => showPdf(d)}>저장된 PDF 확인</Button>
          </Stack>)}
          <Stack direction="row" gap={1}>
            <Button disabled={busy} onClick={() => downloadDocument(detail.id)}>파일 다운로드</Button>
            <Button disabled={busy} onClick={() => setFaxOpen(v => !v)}>
              {detail.fax_history?.length ? '팩스 재발송' : '팩스 발송'}
            </Button>
          </Stack>
          <ClaimFaxDestinations readOnly
            insurers={insurers.filter(i => detail.deliveries.some(d => d.insurer_id === i.id))}
            numbers={Object.fromEntries(detail.deliveries
              .filter(d => d.fax_type === 'VIRTUAL' && d.fax_number)
              .map(d => [d.insurer_id, d.fax_number]))} />
          {faxOpen && <Paper variant="outlined" sx={{ p: 2 }}>
            <Stack spacing={2}>
              <ClaimFaxDestinations insurers={insurers.filter(i => detail.deliveries.some(d => d.insurer_id === i.id))}
                numbers={faxNumbers} disabled={busy} onChange={(id, value) => {
                  faxKey.current = null; setFaxNumbers(v => ({ ...v, [id]: value }));
                }} />
              <Alert severity="info">저장된 모든 보험사의 PDF로 발송을 요청합니다. 가상팩스 번호는 매번 확인해 주세요. 현재 서비스 미연결로 발송되지 않으며 실패 이력이 남습니다.</Alert>
              <Button variant="contained" disabled={busy} onClick={sendFax}>확인 후 팩스 발송 요청</Button>
            </Stack>
          </Paper>}
          {preview && <ClaimPdfPreview blob={preview.blob} name={preview.name} />}
          <Typography fontWeight={700}>첨부서류 {detail.files.length}개</Typography>
          {detail.files.map(file => <Box key={file.id}><Button disabled={busy} onClick={() => download(file)}>{file.filename}</Button></Box>)}
          <Alert severity="info">같은 내용으로 작성하면 입력 내용·서명·첨부서류를 불러옵니다. 가상팩스 번호는 유효기간과 청구 대상이 다를 수 있어 다시 입력하며, 개인정보 동의도 다시 확인해 주세요.</Alert>
          <Divider />
          <Typography variant="h6" fontWeight={700}>팩스 발송 이력</Typography>
          {!detail.fax_history?.length ? <Typography color="text.secondary">팩스 발송 이력이 없습니다.</Typography> :
            <TableContainer><Table size="small" aria-label="팩스 발송 이력">
              <TableHead><TableRow>{['보험사', '수신 번호', '요청 시각', '상태', '완료 시각', '실패 사유'].map(label =>
                <TableCell key={label} sx={{ whiteSpace: 'nowrap' }}>{label}</TableCell>)}</TableRow></TableHead>
              <TableBody>{detail.fax_history.map(attempt => <TableRow key={attempt.id}>
                <TableCell>{attempt.insurer_name}</TableCell>
                <TableCell>{attempt.fax_number}</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>{timestamp(attempt.requested_at)}</TableCell>
                <TableCell><ClaimDeliveryStatus status={attempt.status} /></TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>{timestamp(attempt.completed_at)}</TableCell>
                <TableCell sx={{ minWidth: 180 }}>{attempt.failure_reason || '—'}</TableCell>
              </TableRow>)}</TableBody>
            </Table></TableContainer>}
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
