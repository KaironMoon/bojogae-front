import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Box, Button, Chip, Dialog, DialogContent, DialogTitle, DialogActions, MenuItem, Pagination, Paper, Stack, TextField, Typography } from '@mui/material';
import { getProposals, proposalFileUrl } from '@/services/proposal-service';
import { createSuggestion, requestError } from '@/services/document-request-service';

function documentMetadata(item) {
  const date = item.created_at ? new Date(item.created_at).toLocaleString('ko-KR') : '일시 정보 없음';
  const bytes = Number(item.total_input_bytes || 0);
  const size = bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)}MB` : `${Math.ceil(bytes / 1024)}KB`;
  return `문서 #${item.id} · 생성 ${date} · 입력 파일 ${item.input_file_count ?? 0}개 (${size})`;
}

export default function SuggestionCreatePage() {
  const navigate = useNavigate();
  const [kind, setKind] = useState('NEW_DOCUMENT');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [generation, setGeneration] = useState(null);
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');
  const [working, setWorking] = useState(false);
  const [picker, setPicker] = useState(false);
  const [page, setPage] = useState(1);
  const [documents, setDocuments] = useState(null);
  const [pickerError, setPickerError] = useState('');
  useEffect(() => {
    if (!picker) return;
    let active = true;
    setDocuments(null); setPickerError('');
    getProposals(page, 20).then(result => { if (active) setDocuments(result); })
      .catch(err => { if (active) setPickerError(requestError(err)); });
    return () => { active = false; };
  }, [picker, page]);
  function chooseFiles(event) {
    const selected = Array.from(event.target.files || []);
    event.target.value = '';
    if (selected.length + files.length > 5) { setError('첨부파일은 최대 5개까지 가능합니다.'); return; }
    if (selected.some(file => file.size === 0 || file.size > 10 * 1024 * 1024)) {
      setError('파일은 0바이트보다 크고, 파일당 최대 10MB까지 가능합니다.'); return;
    }
    setFiles(current => [...current, ...selected]); setError('');
  }
  async function submit(event) {
    event.preventDefault(); setWorking(true); setError('');
    try {
      await createSuggestion({ kind, title: title.trim(), content: content.trim(), generation, files });
      navigate('/document-suggestions', { state: { notice: '건의사항이 접수되었습니다.' } });
    } catch (err) { setError(requestError(err)); }
    finally { setWorking(false); }
  }
  return <Box sx={{ maxWidth: 800, mx: 'auto' }}>
    <Typography variant="h5" fontWeight={800} sx={{ mb: 2 }}>문서 개선 건의</Typography>
    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
    <Paper component="form" onSubmit={submit} variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
      <Stack spacing={2}>
        <Typography color="text.secondary">새로운 문서나 기존 문서에 추가할 내용을 제안해주세요.</Typography>
        <TextField select label="건의 유형" value={kind} disabled={working} onChange={e => setKind(e.target.value)}>
          <MenuItem value="NEW_DOCUMENT">새 문서 요청</MenuItem><MenuItem value="ADD_CONTENT">기존 문서 내용 추가</MenuItem>
        </TextField>
        <TextField label="제목" required value={title} disabled={working} inputProps={{ maxLength: 200 }} onChange={e => setTitle(e.target.value)} />
        <TextField label="건의 내용" required multiline minRows={6} value={content} disabled={working} inputProps={{ maxLength: 10000 }} onChange={e => setContent(e.target.value)} helperText={`${content.length}/10000`} />
        <Typography variant="subtitle2">내 생성 문서 첨부 (선택)</Typography>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          <Button variant="outlined" disabled={working} onClick={() => setPicker(true)}>생성 문서 선택</Button>
        </Stack>
        {generation && <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: 'action.hover' }}>
          <Stack spacing={1}>
            <Typography fontWeight={700} sx={{ overflowWrap: 'anywhere' }}>{generation.title}</Typography>
            <Typography variant="body2" sx={{ overflowWrap: 'anywhere' }}>서식: {generation.prompt_title}</Typography>
            <Typography variant="caption" color="text.secondary">{documentMetadata(generation)}</Typography>
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button href={proposalFileUrl(generation.id, 'output')} target="_blank" rel="noopener noreferrer">생성 결과 보기</Button>
              <Button disabled={working} onClick={() => setGeneration(null)}>연결 해제</Button>
            </Stack>
          </Stack>
        </Paper>}
        <Typography variant="subtitle2">별도 파일 첨부 (선택 · 최대 5개 · 파일당 10MB)</Typography>
        <Button component="label" variant="outlined" disabled={working}>파일 추가<input hidden type="file" multiple disabled={working} onChange={chooseFiles} /></Button>
        {files.map((file, index) => <Stack key={index} direction="row" justifyContent="space-between" alignItems="center">
          <Typography sx={{ overflowWrap: 'anywhere' }}>{file.name}</Typography>
          <Button disabled={working} onClick={() => setFiles(current => current.filter((_, i) => i !== index))}>제거</Button>
        </Stack>)}
        <Stack direction="row" spacing={1}>
          <Button type="submit" variant="contained" disabled={working || !title.trim() || !content.trim()}>{working ? '접수 중…' : '건의사항 접수'}</Button>
          <Button disabled={working} onClick={() => navigate('/document-suggestions')}>건의 내역으로</Button>
        </Stack>
      </Stack>
    </Paper>
    <Dialog open={picker} onClose={() => setPicker(false)} fullWidth maxWidth="md">
      <DialogTitle>내 생성 문서 선택</DialogTitle>
      <DialogContent><Stack spacing={1}>
        <Typography variant="body2" color="text.secondary">완료된 생성 문서를 첨부할 수 있습니다.</Typography>
        {pickerError && <Alert severity="error">{pickerError}</Alert>}
        {!documents && !pickerError && <Typography>문서를 불러오는 중입니다.</Typography>}
        {documents?.items.filter(item => item.status === 'COMPLETED').map(item => <Paper key={item.id} variant="outlined"
          sx={{ p: 2, borderRadius: 2, borderColor: generation?.id === item.id ? 'primary.main' : 'divider' }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={2}>
            <Stack spacing={0.75} sx={{ minWidth: 0 }}>
              <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
                <Typography fontWeight={700} sx={{ overflowWrap: 'anywhere' }}>{item.title}</Typography>
                {generation?.id === item.id && <Chip size="small" color="primary" label="선택됨" />}
              </Stack>
              <Typography variant="body2" sx={{ overflowWrap: 'anywhere' }}>서식: {item.prompt_title}</Typography>
              <Typography variant="caption" color="text.secondary">{documentMetadata(item)}</Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-end" sx={{ flexShrink: 0 }}>
              <Button href={proposalFileUrl(item.id, 'output')} target="_blank" rel="noopener noreferrer">생성 결과 보기</Button>
              <Button variant="contained" onClick={() => { setGeneration(item); setPicker(false); }}>선택</Button>
            </Stack>
          </Stack>
        </Paper>)}
        {documents && !documents.items.some(item => item.status === 'COMPLETED') && <Typography>이 페이지에 완료된 문서가 없습니다.</Typography>}
        {documents?.total_pages > 1 && <Pagination page={page} count={documents.total_pages} onChange={(_, value) => setPage(value)} />}
      </Stack></DialogContent>
      <DialogActions><Button onClick={() => setPicker(false)}>닫기</Button></DialogActions>
    </Dialog>
  </Box>;
}
