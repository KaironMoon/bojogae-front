import { useEffect, useRef, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle,
  Divider, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import { claimError, getClaimFile, getClaimRequest, getClaimRequests, downloadClaimDocument, deleteClaimRequest } from '@/services/claim-service';
import ClaimPdfPreview from './ClaimPdfPreview';
import ClaimOriginalShare from './ClaimOriginalShare';
import FaxNumberCopy from './FaxNumberCopy';
import ClaimDeliveryStatus from './ClaimDeliveryStatus';

const timestamp = value => value ? new Date(value).toLocaleString('ko-KR') : '—';

// eslint-disable-next-line react/prop-types
export default function ClaimHistory({ onReuse }) {
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [pendingDownload, setPendingDownload] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [success, setSuccess] = useState('');
  const deleting = useRef(false);
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
    try {
      setDetail(await getClaimRequest(id));
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
  async function confirmDownload() {
    const pending = pendingDownload;
    setPendingDownload(null);
    if (pending.file) await download(pending.file);
    else await downloadDocument(pending.id);
  }
  function askDelete(id, name) {
    setDeleteError(''); setPendingDelete({ id, name });
  }
  async function confirmDelete() {
    if (deleting.current || !pendingDelete) return;
    deleting.current = true; setBusy(true); setDeleteError('');
    try {
      await deleteClaimRequest(pendingDelete.id);
      if (detail?.id === pendingDelete.id) { setDetail(null); setPreview(null); }
      setPendingDownload(null); setPendingDelete(null); setError('');
      setSuccess('청구내역을 삭제했습니다.');
      setHistory(previous => previous ? { ...previous, items: previous.items.filter(item => item.id !== pendingDelete.id) } : previous);
      if (page > 1 && history?.items.length === 1) setPage(previous => previous - 1);
      else setRefresh(previous => previous + 1);
    } catch (e) { setDeleteError(await claimError(e)); }
    finally { deleting.current = false; setBusy(false); }
  }
  return <Stack spacing={2}>
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Typography variant="h4" fontWeight={800}>청구내역</Typography>
      <Button disabled={loading || busy} onClick={() => setRefresh(v => v + 1)}>새로고침</Button>
    </Stack>
    <Alert severity="info">전송용 흑백 PDF는 저장 후 1시간 동안 PC에서는 통합본 다운로드, 모바일에서는 8MB 미만 분할본 공유를 이용할 수 있습니다. 만료 후 전송용 파일과 버튼은 삭제됩니다. 보관본 다운로드는 주민등록번호가 마스킹된 보관용입니다.</Alert>
    {success && <Alert severity="success" role="status" onClose={() => setSuccess('')}>{success}</Alert>}
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
            {delivery.fax_number ? <Stack direction="row" gap={0.5} alignItems="center">
              <Typography variant="body2" color="text.secondary">수신 팩스:</Typography>
              <FaxNumberCopy number={delivery.fax_number} label={`${delivery.insurer_name} 수신 팩스번호`} />
            </Stack> : <Typography variant="body2" color="text.secondary">수신 팩스 번호 기록 없음</Typography>}
            {item.original_available && <ClaimOriginalShare requestId={item.id} deliveryId={delivery.id}
              expiresAt={item.original_expires_at} serverTime={item.server_time} disabled={busy} showRemaining />}
          </Stack>)}
        </Stack>
        <Stack direction="row" gap={1} flexWrap="wrap">
          <Button disabled={busy} onClick={() => open(item.id)}>상세 보기 · 같은 내용으로 작성</Button>
          <Button disabled={busy} onClick={() => setPendingDownload({ id: item.id })}>보관본 다운로드</Button>
          <Button color="error" disabled={busy} onClick={() => askDelete(item.id, item.insured_name)}>삭제</Button>
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
          <Typography variant="body2" color="text.secondary">주민번호는 앞 6자리와 뒤 첫 자리만 보관합니다. 당시 서명과 동의 표시는 보관 PDF에 유지하며, 새 청구서에 재사용하지 않습니다. 첨부서류는 원본 공유 만료 후에도 청구내역에 보관합니다. 첨부에 포함된 주민등록번호 등 개인정보는 자동 마스킹되지 않습니다.</Typography>
          <Divider />
          {detail.deliveries.map(d => <Stack key={d.id} direction="row" gap={1} alignItems="center" flexWrap="wrap">
            <Typography>{d.insurer_name} · {d.pages}쪽</Typography>
            <ClaimDeliveryStatus status={d.status} />
            {d.fax_number ? <Stack direction="row" gap={0.5} alignItems="center">
              <Typography variant="body2" color="text.secondary">{d.fax_type === 'VIRTUAL' ? '개별 가상팩스' : '공용팩스'}:</Typography>
              <FaxNumberCopy number={d.fax_number} label={`${d.insurer_name} 팩스번호`} />
            </Stack> : <Typography variant="body2" color="text.secondary">수신 팩스 번호 기록 없음</Typography>}
            <Button disabled={busy} onClick={() => showPdf(d)}>저장된 PDF 확인</Button>
            {detail.original_available && <ClaimOriginalShare requestId={detail.id} deliveryId={d.id}
              expiresAt={detail.original_expires_at} serverTime={detail.server_time} disabled={busy} showRemaining />}
          </Stack>)}
          <Stack direction="row" gap={1}>
            <Button disabled={busy} onClick={() => setPendingDownload({ id: detail.id })}>보관본 다운로드</Button>
          </Stack>
          {preview && <ClaimPdfPreview blob={preview.blob} name={preview.name} />}
          <Typography fontWeight={700}>첨부서류 {detail.files.length}개</Typography>
          {detail.files.map(file => <Box key={file.id}><Button disabled={busy} onClick={() => setPendingDownload({ file })}>{file.filename}</Button></Box>)}
          <Alert severity="info">같은 내용으로 작성하면 주민번호 일부와 입력 내용·첨부 원본을 불러옵니다. 주민번호 나머지 자리·모든 서명·가상팩스 번호는 다시 입력하고 개인정보 동의도 다시 확인해 주세요.</Alert>
          <Divider />
          <Typography variant="h6" fontWeight={700}>팩스 발송 이력</Typography>
          {!detail.fax_history?.length ? <Typography color="text.secondary">팩스 발송 이력이 없습니다.</Typography> :
            <TableContainer><Table size="small" aria-label="팩스 발송 이력">
              <TableHead><TableRow>{['보험사', '수신 번호', '요청 시각', '상태', '완료 시각', '실패 사유'].map(label =>
                <TableCell key={label} sx={{ whiteSpace: 'nowrap' }}>{label}</TableCell>)}</TableRow></TableHead>
              <TableBody>{detail.fax_history.map(attempt => <TableRow key={attempt.id}>
                <TableCell>{attempt.insurer_name}</TableCell>
                <TableCell><FaxNumberCopy number={attempt.fax_number} label={`${attempt.insurer_name} 발송 팩스번호`} /></TableCell>
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
        <Button color="error" sx={{ mr: 'auto' }} disabled={busy}
          onClick={() => askDelete(detail.id, detail.claim.insured_name)}>삭제</Button>
        <Button disabled={busy} onClick={() => { setDetail(null); setPreview(null); }}>닫기</Button>
        <Button variant="contained" disabled={busy} onClick={reuse}>같은 내용으로 작성</Button>
      </DialogActions>
    </Dialog>
    <Dialog open={Boolean(pendingDownload)} onClose={() => setPendingDownload(null)} fullWidth maxWidth="sm"
      aria-labelledby="archive-download-title">
      <DialogTitle id="archive-download-title">파일 다운로드 안내</DialogTitle>
      <DialogContent>
        <Alert severity="warning">{pendingDownload?.file
          ? '첨부파일은 원본입니다. 주민등록번호·서명·진료정보 등 개인정보가 포함될 수 있습니다.'
          : '청구서 양식의 주민등록번호는 마스킹되어 있습니다. 이 파일을 그대로 발송하시면 안 됩니다.'}</Alert>
        {!pendingDownload?.file && <Typography sx={{ mt: 2 }}>발송하려면 ‘같은 내용으로 작성’에서 주민번호와 서명을 다시 입력한 뒤 발송용 원본을 생성해 주세요.</Typography>}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setPendingDownload(null)}>취소</Button>
        <Button variant="contained" onClick={confirmDownload}>확인 후 다운로드</Button>
      </DialogActions>
    </Dialog>
    <Dialog open={Boolean(pendingDelete)} onClose={() => { if (!busy) setPendingDelete(null); }} fullWidth maxWidth="sm"
      aria-labelledby="claim-delete-title" aria-describedby="claim-delete-description">
      <DialogTitle id="claim-delete-title">청구내역 삭제</DialogTitle>
      <DialogContent>
        <Typography id="claim-delete-description">{pendingDelete?.name}님의 청구내역을 삭제하시겠습니까?</Typography>
        <Alert severity="warning" sx={{ mt: 2 }}>청구 정보·보관 PDF·첨부 원본·팩스 발송 이력이 함께 삭제되며 복구할 수 없습니다. 이미 다운로드한 파일이나 보험사에 전송된 자료는 삭제되지 않습니다.</Alert>
        {deleteError && <Alert severity="error" sx={{ mt: 2 }}>{deleteError}</Alert>}
      </DialogContent>
      <DialogActions>
        <Button disabled={busy} onClick={() => setPendingDelete(null)}>취소</Button>
        <Button color="error" variant="contained" disabled={busy} onClick={confirmDelete}>{busy ? '삭제 중…' : '삭제'}</Button>
      </DialogActions>
    </Dialog>
  </Stack>;
}
