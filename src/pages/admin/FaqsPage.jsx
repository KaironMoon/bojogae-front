import { useEffect, useRef, useState } from "react";
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControlLabel, IconButton, Paper, Stack, Switch, TextField, Tooltip, Typography,
} from "@mui/material";
import ArrowUpwardRoundedIcon from "@mui/icons-material/ArrowUpwardRounded";
import ArrowDownwardRoundedIcon from "@mui/icons-material/ArrowDownwardRounded";
import { deleteFaq, faqError, listAdminFaqs, reorderFaqs, saveFaq } from "@/services/faq-service";

export default function FaqsPage() {
  const [data, setData] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editor, setEditor] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    listAdminFaqs().then((result) => { if (active) setData(result); })
      .catch((err) => { if (active) setError(faqError(err, true)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reload]);

  const refresh = () => { setError(""); setReload((value) => value + 1); };
  const run = async (operation, message) => {
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true); setError(""); setNotice("");
    try {
      await operation();
      setNotice(message); setReload((value) => value + 1);
    } catch (err) {
      setError(faqError(err, true));
      if ([404, 409].includes(err.response?.status)) setReload((value) => value + 1);
    } finally { submitting.current = false; setBusy(false); }
  };
  const submit = (event) => {
    event.preventDefault();
    run(async () => { await saveFaq(editor); setEditor(null); }, "FAQ를 저장했습니다.");
  };
  const move = (index, offset) => {
    const ids = data.items.map((item) => item.id);
    [ids[index], ids[index + offset]] = [ids[index + offset], ids[index]];
    run(async () => { setData(await reorderFaqs(ids, data.items)); }, "표시 순서를 변경했습니다.");
  };
  const openEditor = (item = { question: "", answer: "", is_visible: true }) => { setError(""); setEditor({ ...item }); };

  return (
    <Box component="main" sx={{ maxWidth: 1100, mx: "auto", p: { xs: 2, md: 4 } }}>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
        <Box><Typography variant="h4" component="h1" fontWeight={800}>FAQ 관리</Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>질문과 답변을 관리합니다. 노출 중인 항목만 사용자 화면에 표시됩니다.</Typography></Box>
        <Button variant="contained" sx={{ alignSelf: "flex-start", flexShrink: 0 }} disabled={busy || loading} onClick={() => openEditor()}>FAQ 등록</Button>
      </Stack>
      {notice && <Alert severity="success" onClose={() => setNotice("")} sx={{ mb: 2 }}>{notice}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary">전체 {data.total}개 · 화살표로 표시 순서를 변경할 수 있습니다.</Typography>
        <Button onClick={refresh} disabled={busy || loading}>새로고침</Button>
      </Stack>
      {loading ? <Box sx={{ textAlign: "center", py: 6 }}><CircularProgress aria-label="FAQ 관리 목록 불러오는 중" /></Box> : <Stack spacing={1.5}>
        {data.items.map((item, index) => <Paper component="article" aria-label={`FAQ: ${item.question}`} key={item.id} variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
          <Stack direction="row" spacing={1.5} alignItems="flex-start">
            <Stack sx={{ flexShrink: 0 }}>
              <Tooltip title="위로 이동"><span><IconButton aria-label={`${item.question} 위로 이동`} disabled={busy || index === 0} onClick={() => move(index, -1)} size="small"><ArrowUpwardRoundedIcon fontSize="small" /></IconButton></span></Tooltip>
              <Tooltip title="아래로 이동"><span><IconButton aria-label={`${item.question} 아래로 이동`} disabled={busy || index === data.items.length - 1} onClick={() => move(index, 1)} size="small"><ArrowDownwardRoundedIcon fontSize="small" /></IconButton></span></Tooltip>
            </Stack>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Stack direction="row" spacing={1} alignItems="flex-start"><Typography fontWeight={800} sx={{ overflowWrap: "anywhere", flex: 1 }}>{item.question}</Typography>
                <Chip size="small" label={item.is_visible ? "노출" : "숨김"} color={item.is_visible ? "success" : "default"} /></Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, whiteSpace: "pre-wrap", overflowWrap: "anywhere", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{item.answer}</Typography>
              <Stack direction="row" flexWrap="wrap" spacing={1} sx={{ mt: 1.5 }}>
                <Button size="small" disabled={busy} onClick={() => openEditor(item)}>수정</Button>
                <Button size="small" disabled={busy} onClick={() => run(() => saveFaq({ ...item, is_visible: !item.is_visible }), item.is_visible ? "FAQ를 숨겼습니다." : "FAQ를 노출했습니다.")}>{item.is_visible ? "숨기기" : "노출하기"}</Button>
                <Button size="small" color="error" disabled={busy} onClick={() => { setError(""); setRemoving(item); }}>삭제</Button>
              </Stack>
            </Box>
          </Stack>
        </Paper>)}
        {!data.items.length && !error && <Typography color="text.secondary" sx={{ textAlign: "center", py: 6 }}>등록된 FAQ가 없습니다. 첫 질문을 등록해 주세요.</Typography>}
      </Stack>}

      <Dialog open={Boolean(editor)} onClose={() => !busy && setEditor(null)} fullWidth maxWidth="md">
        <Box component="form" onSubmit={submit}>
          <DialogTitle>{editor?.id ? "FAQ 수정" : "FAQ 등록"}</DialogTitle>
          <DialogContent><Stack spacing={2} sx={{ pt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField autoFocus required label="질문" value={editor?.question || ""} disabled={busy} inputProps={{ maxLength: 300 }} onChange={(event) => setEditor({ ...editor, question: event.target.value })} helperText={`${editor?.question.length || 0}/300`} />
            <TextField required label="답변" value={editor?.answer || ""} disabled={busy} multiline minRows={10} inputProps={{ maxLength: 10000 }} onChange={(event) => setEditor({ ...editor, answer: event.target.value })} helperText="메뉴 경로와 이용 순서를 구체적으로 안내해 주세요. 줄바꿈은 사용자 화면에 그대로 표시됩니다." />
            <FormControlLabel control={<Switch checked={editor?.is_visible || false} disabled={busy} onChange={(_, checked) => setEditor({ ...editor, is_visible: checked })} />} label="사용자 화면에 노출" />
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}><Typography variant="subtitle2" sx={{ mb: 1 }}>답변 미리보기</Typography>
              <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", lineHeight: 1.8 }}>{editor?.answer || "답변을 입력하면 여기에 표시됩니다."}</Typography></Paper>
          </Stack></DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}><Button disabled={busy} onClick={() => setEditor(null)}>취소</Button>
            <Button type="submit" variant="contained" disabled={busy || !editor?.question.trim() || !editor?.answer.trim()}>{busy ? "저장 중…" : "저장"}</Button></DialogActions>
        </Box>
      </Dialog>

      <Dialog open={Boolean(removing)} onClose={() => !busy && setRemoving(null)} fullWidth maxWidth="xs">
        <DialogTitle>FAQ를 삭제할까요?</DialogTitle>
        <DialogContent>{error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Typography sx={{ overflowWrap: "anywhere" }}>{removing?.question}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>사용자 화면과 관리 목록에서 제외됩니다. 잠시 노출만 중단하려면 숨기기를 이용해 주세요.</Typography></DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}><Button disabled={busy} onClick={() => setRemoving(null)}>취소</Button>
          <Button color="error" disabled={busy} onClick={() => run(async () => { await deleteFaq(removing); setRemoving(null); }, "FAQ를 삭제했습니다.")}>삭제</Button></DialogActions>
      </Dialog>
    </Box>
  );
}
