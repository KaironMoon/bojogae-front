import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle,
  MenuItem, Pagination, Paper, Stack, TextField, Typography,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import {
  answerHelpInquiry, createHelpInquiry, getHelpInquiry, helpInquiryError, listHelpInquiries, retryHelpInquiryEmail,
} from "@/services/help-inquiry-service";

const emailLabels = {
  NOT_REQUESTED: "이메일 수신 신청 없음", PENDING: "메일 발송 대기", SENDING: "메일 발송 중",
  SENT: "메일 발송 완료", FAILED: "메일 발송 실패 · 답변은 아래에서 확인할 수 있습니다",
};
const dateText = (value) => value ? new Date(value).toLocaleString("ko-KR") : "";

// eslint-disable-next-line react/prop-types
export default function QnaPage({ admin = false }) {
  const [data, setData] = useState({ items: [], total: 0, total_pages: 0 });
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [reload, setReload] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialogError, setDialogError] = useState("");
  const [notice, setNotice] = useState("");
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({ title: "", content: "", email: "" });
  const [selected, setSelected] = useState(null);
  const [answer, setAnswer] = useState("");
  const [saving, setSaving] = useState(false);
  const submitting = useRef(false);

  useEffect(() => {
    let active = true;
    setLoading(true); setError("");
    listHelpInquiries(admin, page, status).then((result) => {
      if (active) setData(result);
    }).catch((err) => { if (active) setError(helpInquiryError(err)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [admin, page, status, reload]);

  const selectedId = selected?.id;
  const mailStatus = selected?.email_status;
  useEffect(() => {
    if (!selectedId || !["PENDING", "SENDING"].includes(mailStatus)) return;
    let active = true;
    let attempts = 0;
    const timer = setInterval(async () => {
      if (++attempts >= 10) clearInterval(timer);
      try {
        const result = await getHelpInquiry(admin, selectedId);
        if (active) setSelected(result);
      } catch { clearInterval(timer); }
    }, 2000);
    return () => { active = false; clearInterval(timer); };
  }, [admin, selectedId, mailStatus]);

  const mutate = async (operation) => {
    if (submitting.current) return;
    submitting.current = true;
    setSaving(true); setDialogError("");
    try { await operation(); }
    catch (err) { setDialogError(helpInquiryError(err)); }
    finally { submitting.current = false; setSaving(false); }
  };
  const submit = (event) => {
    event.preventDefault();
    mutate(async () => {
      await createHelpInquiry(draft);
      setCreating(false); setPage(1); setReload((value) => value + 1);
      setNotice("문의가 접수되었습니다. 답변은 내 문의에서 확인할 수 있습니다.");
    });
  };
  const submitAnswer = (event) => {
    event.preventDefault();
    mutate(async () => {
      setSelected(await answerHelpInquiry(selected.id, answer));
      setReload((value) => value + 1);
    });
  };
  const refreshDetail = () => mutate(async () => {
    setSelected(await getHelpInquiry(admin, selected.id));
    setReload((value) => value + 1);
  });

  return (
    <Box sx={{ maxWidth: 1050, mx: "auto", p: { xs: 2, md: 4 } }}>
      <Typography variant="overline" color="text.secondary">{admin ? "고객 지원 관리" : "도움말 센터"}</Typography>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
        <Box><Typography variant="h4" fontWeight={800}>{admin ? "QnA 문의 관리" : "QnA"}</Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>문의와 답변은 작성자와 관리자만 볼 수 있습니다.</Typography></Box>
        {!admin && <Stack direction="row" spacing={1} alignItems="center">
          <Button component={Link} to="/help/contact">1:1 문의</Button>
          <Button variant="contained" onClick={() => { setDraft({ title: "", content: "", email: "" }); setDialogError(""); setCreating(true); }}>문의 작성</Button>
        </Stack>}
      </Stack>
      {notice && <Alert severity="success" onClose={() => setNotice("")} sx={{ mb: 2 }}>{notice}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary">{admin ? "전체 문의" : "내 문의"} {data.total}건</Typography>
        <Stack direction="row" spacing={1}>
          {admin && <TextField select size="small" label="처리 상태" value={status} sx={{ minWidth: 130 }} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>
            <MenuItem value="">전체</MenuItem><MenuItem value="PENDING">답변 대기</MenuItem><MenuItem value="ANSWERED">답변 완료</MenuItem>
          </TextField>}
          <Button onClick={() => setReload((value) => value + 1)} disabled={loading}>새로고침</Button>
        </Stack>
      </Stack>
      {loading ? <Box sx={{ py: 8, textAlign: "center" }}><CircularProgress aria-label="문의 불러오는 중" /></Box> : (
        <Stack spacing={1.5}>
          {data.items.map((item) => <Paper variant="outlined" key={item.id} sx={{ borderRadius: 2.5, overflow: "hidden" }}>
            <Button fullWidth onClick={() => { setSelected(item); setAnswer(""); setDialogError(""); }} sx={{ display: "block", p: 2.5, textAlign: "left", color: "text.primary", textTransform: "none" }}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                <Typography fontWeight={750} sx={{ minWidth: 0, overflowWrap: "anywhere" }}><LockOutlinedIcon sx={{ fontSize: 16, mr: .7, verticalAlign: "middle" }} />{item.title}</Typography>
                <Chip size="small" sx={{ flexShrink: 0 }} label={item.status === "ANSWERED" ? "답변 완료" : "답변 대기"} color={item.status === "ANSWERED" ? "success" : "default"} />
              </Stack>
              <Typography variant="caption" color="text.secondary">#{item.id}{admin ? ` · 회원 #${item.user_id}` : ""} · {dateText(item.created_at)}</Typography>
            </Button>
          </Paper>)}
          {!data.items.length && !error && <Paper variant="outlined" sx={{ py: 7, textAlign: "center" }}><Typography color="text.secondary">{admin ? "해당하는 문의가 없습니다." : "아직 등록한 문의가 없습니다."}</Typography></Paper>}
        </Stack>
      )}
      {data.total_pages > 1 && <Stack alignItems="center" sx={{ mt: 3 }}><Pagination count={data.total_pages} page={page} onChange={(_, value) => setPage(value)} /></Stack>}

      <Dialog open={creating} onClose={() => !saving && setCreating(false)} fullWidth maxWidth="sm">
        <Box component="form" onSubmit={submit}>
          <DialogTitle>비공개 문의 작성</DialogTitle>
          <DialogContent><Stack spacing={2} sx={{ pt: 1 }}>
            {dialogError && <Alert severity="error">{dialogError}</Alert>}
            <Alert severity="info">작성자와 관리자만 조회할 수 있습니다. 비밀번호·카드번호 등 민감한 정보는 입력하지 마세요.</Alert>
            <TextField autoFocus required label="제목" value={draft.title} disabled={saving} onChange={(event) => setDraft({ ...draft, title: event.target.value })} inputProps={{ maxLength: 200 }} />
            <TextField required multiline minRows={6} label="문의 내용" value={draft.content} disabled={saving} onChange={(event) => setDraft({ ...draft, content: event.target.value })} inputProps={{ maxLength: 10000 }} helperText={`${draft.content.length}/10000`} />
            <TextField type="email" label="답변 받을 이메일 (선택)" value={draft.email} disabled={saving} onChange={(event) => setDraft({ ...draft, email: event.target.value })} inputProps={{ maxLength: 254 }} helperText="입력하면 문의 내용과 답변을 해당 주소로도 보내드립니다. 주소를 정확히 확인해 주세요. 입력하지 않아도 이 화면에서 답변을 확인할 수 있습니다." />
          </Stack></DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}><Button disabled={saving} onClick={() => setCreating(false)}>취소</Button><Button type="submit" variant="contained" disabled={saving || !draft.title.trim() || !draft.content.trim()}>{saving ? "접수 중..." : "문의 등록"}</Button></DialogActions>
        </Box>
      </Dialog>

      <Dialog open={Boolean(selected)} onClose={() => !saving && setSelected(null)} fullWidth maxWidth="sm">
        <Box component="form" onSubmit={submitAnswer}>
          <DialogTitle sx={{ overflowWrap: "anywhere" }}>{selected?.title}</DialogTitle>
          <DialogContent><Stack spacing={2} sx={{ pt: 1, overflowWrap: "anywhere" }}>
            {dialogError && <Alert severity="error">{dialogError}</Alert>}
            <Typography variant="caption" color="text.secondary">문의 #{selected?.id} · {dateText(selected?.created_at)}{admin && selected ? ` · 회원 #${selected.user_id}` : ""}</Typography>
            <Typography sx={{ whiteSpace: "pre-wrap" }}>{selected?.content}</Typography>
            {selected?.reply_email && <Typography variant="body2" color="text.secondary">답변 이메일: {selected.reply_email}</Typography>}
            {selected?.status === "ANSWERED" ? <Paper variant="outlined" sx={{ p: 2.5, bgcolor: "#f8fafc", borderRadius: 2 }}>
              <Typography fontWeight={800}>관리자 답변</Typography>
              <Typography variant="caption" color="text.secondary">{dateText(selected.answered_at)}</Typography>
              <Typography sx={{ whiteSpace: "pre-wrap", mt: 1.5 }}>{selected.answer}</Typography>
              <Typography variant="body2" color={selected.email_status === "FAILED" ? "error" : "text.secondary"} sx={{ mt: 2 }}>{emailLabels[selected.email_status]}</Typography>
              {admin && selected.reply_email && selected.email_status !== "SENT" && <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <Button disabled={saving} onClick={refreshDetail}>메일 상태 새로고침</Button>
                <Button disabled={saving} onClick={() => mutate(async () => { setSelected(await retryHelpInquiryEmail(selected.id)); })}>메일 재발송</Button>
              </Stack>}
            </Paper> : admin ? <TextField required multiline minRows={5} label="답변 내용" value={answer} disabled={saving} onChange={(event) => setAnswer(event.target.value)} inputProps={{ maxLength: 10000 }} helperText="등록한 답변은 작성자에게 공개되며, 신청한 이메일로도 발송됩니다." /> : <Alert severity="info">답변을 기다리고 있습니다.</Alert>}
          </Stack></DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}><Button disabled={saving} onClick={() => setSelected(null)}>닫기</Button>
            {admin && selected?.status === "PENDING" && <Button type="submit" variant="contained" disabled={saving || !answer.trim()}>{saving ? "저장 중..." : "답변 등록"}</Button>}
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}
