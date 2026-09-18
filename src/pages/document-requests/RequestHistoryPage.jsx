import AddRoundedIcon from "@mui/icons-material/AddRounded";
import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Pagination, Paper, Stack, TextField, Typography } from '@mui/material';
import { decideRequest, deleteRequest, getRequest, listRequests, requestError, suggestionFileUrl, updateRefund } from '@/services/document-request-service';
import { getProposal, proposalFileUrl, proposalRawResponseUrl } from '@/services/proposal-service';

const states = { PENDING: '접수', REFUNDED: '환불 완료', REJECTED: '거절', ACCEPTED: '반영 예정', COMPLETED: '완료됨' };
const kinds = { NEW_DOCUMENT: '새 양식 추가 요청', ADD_CONTENT: '기존 양식 수정 및 추가 요청' };

// 접수 화면은 각각 분리하고, 내역 표시만 공통 컴포넌트를 사용합니다.
export default function RequestHistoryPage({ kind, admin = false }) { // eslint-disable-line react/prop-types
  const refund = kind === 'refund';
  const location = useLocation();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(null);
  const [detail, setDetail] = useState(null);
  const [document, setDocument] = useState(null);
  const [error, setError] = useState('');
  const [detailError, setDetailError] = useState('');
  const [response, setResponse] = useState('');
  const [state, setState] = useState(refund ? 'REFUND' : 'ACCEPTED');
  const [working, setWorking] = useState(false);
  const [opening, setOpening] = useState(false);
  const [editingRefund, setEditingRefund] = useState(false);
  const [content, setContent] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const load = useCallback(async () => {
    try { setResult(await listRequests(kind, page, admin)); }
    catch (err) { setError(requestError(err)); }
  }, [kind, page, admin]);
  useEffect(() => { setResult(null); setError(''); load(); }, [load]);
  async function open(item) {
    setEditingRefund(false); setConfirmDelete(false);
    setOpening(true); setError(''); setDetailError(''); setDocument(null);
    try {
      const data = await getRequest(kind, item.id, admin);
      setDetail(data); setContent(data.content); setResponse(data.response || ''); setState(refund ? 'REFUND' : data.status);
      if (admin && refund) {
        try { setDocument(await getProposal(data.generation_id, true)); }
        catch (err) { setDetailError(requestError(err)); }
      }
    } catch (err) { setError(requestError(err)); }
    finally { setOpening(false); }
  }
  async function decide() {
    setWorking(true); setDetailError('');
    try {
      await decideRequest(kind, detail.id, state, response.trim());
      setDetail(null); await load();
    } catch (err) { setDetailError(requestError(err)); }
    finally { setWorking(false); }
  }
  async function saveRefund(event) {
    event.preventDefault(); setWorking(true); setDetailError('');
    try {
      await updateRefund(detail.id, content.trim());
      setDetail(null); setEditingRefund(false); await load();
    } catch (err) { setDetailError(requestError(err)); }
    finally { setWorking(false); }
  }
  async function remove() {
    setWorking(true); setDetailError('');
    try { await deleteRequest(kind, detail.id); setConfirmDelete(false); setDetail(null); await load(); }
    catch (err) { setConfirmDelete(false); setDetailError(requestError(err)); }
    finally { setWorking(false); }
  }
  const canProcess = detail && (!refund || detail.status === 'PENDING');
  return <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
    <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} gap={2} sx={{ mb: 2 }}>
      <Typography variant="h5" fontWeight={800}>{refund ? (admin ? '환불 요청 관리' : '내 환불 요청') : (admin ? '문서 건의 관리' : '내 문서 건의')}</Typography>
      <Stack direction="row" alignItems="center" justifyContent="flex-end" spacing={1} sx={{ flexShrink: 0 }}>
        <Button onClick={() => { setError(''); load(); }}>새로고침</Button>
        {!admin && !refund && <Button component={Link} to="/document-suggestions/new" variant="contained" startIcon={<AddRoundedIcon />} sx={{ whiteSpace: 'nowrap' }}>건의사항 작성</Button>}
      </Stack>
    </Stack>
    {!admin && refund && <Alert severity="info" sx={{ mb: 2 }}>환불 요청은 <Link to="/proposals">문서 생성 내역</Link>에서 해당 문서를 선택해 접수할 수 있습니다.</Alert>}
    {location.state?.notice && <Alert severity="success" sx={{ mb: 2 }}>{location.state.notice}</Alert>}
    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
    {!result && !error && <Typography>내역을 불러오는 중입니다.</Typography>}
    <Stack spacing={1.5}>
      {result?.items.map(item => <Paper key={item.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={1}>
          <Box sx={{ minWidth: 0 }}>
            <Typography fontWeight={700} sx={{ overflowWrap: 'anywhere' }}>{refund ? item.generation_title : item.title}</Typography>
            <Typography variant="caption" color="text.secondary">#{item.id} · {new Date(item.created_at).toLocaleString('ko-KR')}{admin ? ` · 사용자 #${item.user_id}` : ''} · {refund ? `${item.point_cost}P` : kinds[item.kind]}</Typography>
          </Box>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Chip size="small" label={states[item.status] || item.status} />
            <Button disabled={opening} onClick={() => open(item)}>상세 보기</Button>
          </Stack>
        </Stack>
      </Paper>)}
      {result && !result.items.length && <Typography color="text.secondary">접수 내역이 없습니다.</Typography>}
    </Stack>
    {result?.total_pages > 1 && <Pagination sx={{ mt: 3 }} page={page} count={result.total_pages} onChange={(_, value) => setPage(value)} />}
    <Dialog open={Boolean(detail)} onClose={() => { if (!working && !opening) setDetail(null); }} fullWidth maxWidth="md">
      <DialogTitle>{refund ? '환불 요청 상세' : '문서 건의 상세'}</DialogTitle>
      <DialogContent><Stack spacing={2} sx={{ pt: 1 }}>
        {detailError && <Alert severity="error">{detailError}</Alert>}
        <Typography variant="h6">{refund ? detail?.generation_title : detail?.title}</Typography>
        <Chip sx={{ alignSelf: 'flex-start' }} label={states[detail?.status] || ''} />
        {!refund && <Typography>{kinds[detail?.kind]}</Typography>}
        {editingRefund ? <Box component="form" id="refund-edit-form" onSubmit={saveRefund}>
          <TextField fullWidth label="문제 내용 및 환불 요청 사유" required multiline minRows={6} value={content}
            disabled={working} inputProps={{ maxLength: 10000 }} onChange={e => setContent(e.target.value)} />
        </Box> : <Typography sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{detail?.content}</Typography>}
        {refund && <Typography>생성 건 #{detail?.generation_id} · 사용 포인트 {detail?.point_cost}P</Typography>}
        {document && <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack spacing={1}>
            <Typography fontWeight={700}>생성 문서 검토</Typography>
            <Typography>{document.prompt_title} v{document.prompt_version_no} · 생성 상태 {document.status} · 과금 상태 {document.point_status}</Typography>
            {document.status === 'COMPLETED' && <Button href={proposalFileUrl(document.id, 'output', { admin: true })} target="_blank" rel="noopener noreferrer">생성 문서 열기</Button>}
            {document.response_available && <Button href={proposalRawResponseUrl(document.id, true, true)}>LLM 응답 다운로드</Button>}
            {document.files?.map(file => <Button key={file.id} href={proposalFileUrl(document.id, 'input', { admin: true, fileId: file.id, download: true })}>{file.original_filename} 다운로드</Button>)}
            {document.input_values && Object.keys(document.input_values).length > 0 && <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>입력 내용: {JSON.stringify(document.input_values, null, 2)}</Typography>}
          </Stack>
        </Paper>}
        {!refund && detail?.generation_id && <Button href={suggestionFileUrl(detail.id, null, admin)}>첨부한 생성 문서: {detail.generation_title} 다운로드</Button>}
        {!refund && detail?.files?.map(file => <Button key={file.id} href={suggestionFileUrl(detail.id, file.id, admin)}>{file.original_filename} 다운로드</Button>)}
        {detail?.response && <Alert severity="info" sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>관리자 답변: {detail.response}{detail.decided_at && `\n처리 일시: ${new Date(detail.decided_at).toLocaleString('ko-KR')}`}</Alert>}
        {admin && canProcess && <>
          <TextField select label="처리" value={state} disabled={working || opening} onChange={e => setState(e.target.value)}>
            {refund ? [<MenuItem key="refund" value="REFUND">사용 포인트 반환</MenuItem>, <MenuItem key="reject" value="REJECT">환불 거절</MenuItem>]
              : [<MenuItem key="pending" value="PENDING">접수</MenuItem>, <MenuItem key="accept" value="ACCEPTED">반영 예정</MenuItem>, <MenuItem key="complete" value="COMPLETED">완료됨</MenuItem>, <MenuItem key="reject" value="REJECTED">거절</MenuItem>]}
          </TextField>
          <TextField label={refund ? '처리 사유' : '답변'} required multiline minRows={3} value={response} disabled={working || opening} inputProps={{ maxLength: refund ? 500 : 2000 }} onChange={e => setResponse(e.target.value)} />
        </>}
      </Stack></DialogContent>
      <DialogActions sx={{ flexWrap: 'wrap', gap: 1 }}>
        {!admin && detail?.status === 'PENDING' && <>
          {editingRefund ? <>
            <Button type="submit" form="refund-edit-form" variant="contained" disabled={working || !content.trim()}>수정 저장</Button>
            <Button disabled={working} onClick={() => { setEditingRefund(false); setContent(detail.content); }}>수정 취소</Button>
          </> : <>
            <Button disabled={working || opening} onClick={() => refund ? setEditingRefund(true) : navigate(`/document-suggestions/${detail.id}/edit`)}>수정</Button>
            <Button color="error" disabled={working || opening} onClick={() => setConfirmDelete(true)}>삭제</Button>
          </>}
        </>}
        {admin && canProcess && <Button variant="contained" disabled={working || opening || !response.trim()} onClick={decide}>{working ? '처리 중…' : '처리 저장'}</Button>}
        <Button disabled={working || opening} onClick={() => setDetail(null)}>닫기</Button>
      </DialogActions>
    </Dialog>
    <Dialog open={confirmDelete} onClose={() => { if (!working) setConfirmDelete(false); }} fullWidth maxWidth="xs">
      <DialogTitle>{refund ? '환불 요청 삭제' : '건의사항 삭제'}</DialogTitle>
      <DialogContent><Typography>이 접수를 삭제할까요?</Typography></DialogContent>
      <DialogActions>
        <Button disabled={working} onClick={() => setConfirmDelete(false)}>취소</Button>
        <Button color="error" variant="contained" disabled={working} onClick={remove}>{working ? '삭제 중…' : '삭제'}</Button>
      </DialogActions>
    </Dialog>
  </Box>;
}
