import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Pagination,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import QuestionAnswerOutlinedIcon from "@mui/icons-material/QuestionAnswerOutlined";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import {
  answerHelpInquiry,
  createHelpInquiry,
  getHelpInquiry,
  helpInquiryError,
  listHelpInquiries,
  retryHelpInquiryEmail,
} from "@/services/help-inquiry-service";
import {
  AdminEmptyState,
  AdminPageContainer,
  AdminPageHeader,
} from "@/pages/admin/components/AdminPageShell";

const emailLabels = {
  NOT_REQUESTED: "이메일 수신 신청 없음",
  PENDING: "메일 발송 대기",
  SENDING: "메일 발송 중",
  SENT: "메일 발송 완료",
  FAILED: "메일 발송 실패 · 답변은 아래에서 확인할 수 있습니다",
};
const dateText = (value) => (value ? new Date(value).toLocaleString("ko-KR") : "");

// eslint-disable-next-line react/prop-types
export default function QnaPage({ admin = false }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
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
    setLoading(true);
    setError("");
    listHelpInquiries(admin, page, status)
      .then((result) => {
        if (active) setData(result);
      })
      .catch((err) => {
        if (active) setError(helpInquiryError(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [admin, page, status, reload]);

  const selectedId = selected?.id;
  const mailStatus = selected?.email_status;
  useEffect(() => {
    if (!selectedId || !["PENDING", "SENDING"].includes(mailStatus)) return undefined;
    let active = true;
    let attempts = 0;
    const timer = setInterval(async () => {
      if (++attempts >= 10) clearInterval(timer);
      try {
        const result = await getHelpInquiry(admin, selectedId);
        if (active) setSelected(result);
      } catch {
        clearInterval(timer);
      }
    }, 2000);
    return () => { active = false; clearInterval(timer); };
  }, [admin, selectedId, mailStatus]);

  const mutate = async (operation) => {
    if (submitting.current) return;
    submitting.current = true;
    setSaving(true);
    setDialogError("");
    try {
      await operation();
    } catch (err) {
      setDialogError(helpInquiryError(err));
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  };

  const submit = (event) => {
    event.preventDefault();
    mutate(async () => {
      await createHelpInquiry(draft);
      setCreating(false);
      setPage(1);
      setReload((value) => value + 1);
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

  const renderContent = () => (
    <>
      {notice && <Alert severity="success" onClose={() => setNotice("")} sx={{ mb: 2, borderRadius: 2.5 }}>{notice}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2.5 }}>{error}</Alert>}

      {admin ? (
        <Paper variant="outlined" sx={{ borderRadius: 3, mb: 2.5, px: 1.5, bgcolor: "#FFFFFF" }}>
          <Tabs
            value={status}
            onChange={(_e, next) => { setStatus(next); setPage(1); }}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ "& .MuiTab-root": { minHeight: 46, fontWeight: 750 } }}
          >
            <Tab value="" label="전체 문의" />
            <Tab value="PENDING" label="답변 대기" />
            <Tab value="ANSWERED" label="답변 완료" />
          </Tabs>
        </Paper>
      ) : (
        <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">내 문의 {data.total}건</Typography>
          <Button size="small" onClick={() => setReload((value) => value + 1)} disabled={loading}>새로고침</Button>
        </Stack>
      )}

      {loading ? (
        <Box sx={{ py: 8, textAlign: "center" }}><CircularProgress aria-label="문의 불러오는 중" /></Box>
      ) : !data.items.length && !error ? (
        <AdminEmptyState
          icon={QuestionAnswerOutlinedIcon}
          title={admin ? "해당하는 문의가 없습니다." : "아직 등록한 문의가 없습니다."}
        />
      ) : (
        <Stack spacing={1.25}>
          {data.items.map((item) => (
            <Paper variant="outlined" key={item.id} sx={{ borderRadius: 3, overflow: "hidden", bgcolor: "#FFFFFF" }}>
              <Button
                fullWidth
                onClick={() => { setSelected(item); setAnswer(""); setDialogError(""); }}
                sx={{ display: "block", p: { xs: 1.75, sm: 2.25 }, textAlign: "left", color: "text.primary", textTransform: "none" }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                  <Typography fontWeight={800} sx={{ minWidth: 0, overflowWrap: "anywhere" }}>
                    <LockOutlinedIcon sx={{ fontSize: 16, mr: 0.7, verticalAlign: "middle", color: "#64748B" }} />
                    {item.title}
                  </Typography>
                  <Chip
                    size="small"
                    sx={{ flexShrink: 0, fontWeight: 750 }}
                    label={item.status === "ANSWERED" ? "답변 완료" : "답변 대기"}
                    color={item.status === "ANSWERED" ? "success" : "warning"}
                  />
                </Stack>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                  #{item.id}{admin ? ` · 회원 #${item.user_id}` : ""} · {dateText(item.created_at)}
                </Typography>
              </Button>
            </Paper>
          ))}
        </Stack>
      )}

      {data.total_pages > 1 && (
        <Stack alignItems="center" sx={{ mt: 3 }}>
          <Pagination count={data.total_pages} page={page} color="primary" onChange={(_, value) => setPage(value)} />
        </Stack>
      )}

      <Dialog open={creating} onClose={() => !saving && setCreating(false)} fullWidth maxWidth="sm" fullScreen={isMobile}>
        <Box component="form" onSubmit={submit}>
          <DialogTitle fontWeight={850}>비공개 문의 작성</DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2}>
              {dialogError && <Alert severity="error">{dialogError}</Alert>}
              <Alert severity="info">작성자와 관리자만 조회할 수 있습니다. 비밀번호·카드번호 등 민감한 정보는 입력하지 마세요.</Alert>
              <TextField autoFocus required size="small" label="제목" value={draft.title} disabled={saving} onChange={(event) => setDraft({ ...draft, title: event.target.value })} inputProps={{ maxLength: 200 }} />
              <TextField required multiline minRows={6} label="문의 내용" value={draft.content} disabled={saving} onChange={(event) => setDraft({ ...draft, content: event.target.value })} inputProps={{ maxLength: 10000 }} helperText={`${draft.content.length}/10000`} />
              <TextField type="email" size="small" label="답변 받을 이메일 (선택)" value={draft.email} disabled={saving} onChange={(event) => setDraft({ ...draft, email: event.target.value })} inputProps={{ maxLength: 254 }} helperText="입력하면 문의 내용과 답변을 해당 주소로도 보내드립니다." />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button disabled={saving} onClick={() => setCreating(false)}>취소</Button>
            <Button type="submit" variant="contained" disabled={saving || !draft.title.trim() || !draft.content.trim()}>{saving ? "접수 중..." : "문의 등록"}</Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog open={Boolean(selected)} onClose={() => !saving && setSelected(null)} fullWidth maxWidth="sm" fullScreen={isMobile}>
        <Box component="form" onSubmit={submitAnswer}>
          <DialogTitle fontWeight={850} sx={{ overflowWrap: "anywhere" }}>{selected?.title}</DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2} sx={{ overflowWrap: "anywhere" }}>
              {dialogError && <Alert severity="error">{dialogError}</Alert>}
              <Typography variant="caption" color="text.secondary">
                문의 #{selected?.id} · {dateText(selected?.created_at)}{admin && selected ? ` · 회원 #${selected.user_id}` : ""}
              </Typography>
              <Paper variant="outlined" sx={{ p: 1.75, borderRadius: 2 }}>
                <Typography sx={{ whiteSpace: "pre-wrap", lineHeight: 1.65 }}>{selected?.content}</Typography>
              </Paper>
              {selected?.reply_email && (
                <Typography variant="body2" color="text.secondary">답변 이메일: {selected.reply_email}</Typography>
              )}
              {selected?.status === "ANSWERED" ? (
                <Paper variant="outlined" sx={{ p: 2, bgcolor: "#F8FAFC", borderRadius: 2.5 }}>
                  <Typography fontWeight={800}>관리자 답변</Typography>
                  <Typography variant="caption" color="text.secondary">{dateText(selected.answered_at)}</Typography>
                  <Typography sx={{ whiteSpace: "pre-wrap", mt: 1.25, lineHeight: 1.65 }}>{selected.answer}</Typography>
                  <Typography variant="body2" color={selected.email_status === "FAILED" ? "error" : "text.secondary"} sx={{ mt: 1.5 }}>
                    {emailLabels[selected.email_status]}
                  </Typography>
                  {admin && selected.reply_email && selected.email_status !== "SENT" && (
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                      <Button size="small" variant="outlined" disabled={saving} onClick={refreshDetail}>메일 상태 새로고침</Button>
                      <Button size="small" variant="outlined" disabled={saving} onClick={() => mutate(async () => { setSelected(await retryHelpInquiryEmail(selected.id)); })}>메일 재발송</Button>
                    </Stack>
                  )}
                </Paper>
              ) : admin ? (
                <TextField required multiline minRows={5} label="답변 내용" value={answer} disabled={saving} onChange={(event) => setAnswer(event.target.value)} inputProps={{ maxLength: 10000 }} helperText="등록한 답변은 작성자에게 공개되며, 신청한 이메일로도 발송됩니다." />
              ) : (
                <Alert severity="info">답변을 기다리고 있습니다.</Alert>
              )}
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button disabled={saving} onClick={() => setSelected(null)}>닫기</Button>
            {admin && selected?.status === "PENDING" && (
              <Button type="submit" variant="contained" disabled={saving || !answer.trim()}>{saving ? "저장 중..." : "답변 등록"}</Button>
            )}
          </DialogActions>
        </Box>
      </Dialog>
    </>
  );

  if (admin) {
    return (
      <AdminPageContainer maxWidth={1120}>
        <AdminPageHeader
          icon={QuestionAnswerOutlinedIcon}
          badge={`전체 ${data.total}건`}
          title="QnA 문의 관리"
          description="설계사가 접수한 1:1 비공개 문의를 조회하고 답변과 메일 발송 상태를 관리합니다."
          actions={(
            <Button size="small" variant="outlined" startIcon={<RefreshRoundedIcon />} onClick={() => setReload((value) => value + 1)} disabled={loading}>
              새로고침
            </Button>
          )}
        />
        {renderContent()}
      </AdminPageContainer>
    );
  }

  return (
    <Box sx={{ maxWidth: 1050, mx: "auto", p: { xs: 2, md: 4 } }}>
      <Typography variant="overline" color="text.secondary">도움말 센터</Typography>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={800}>QnA</Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>문의와 답변은 작성자와 관리자만 볼 수 있습니다.</Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center">
          <Button component={Link} to="/help/contact">1:1 문의</Button>
          <Button variant="contained" onClick={() => { setDraft({ title: "", content: "", email: "" }); setDialogError(""); setCreating(true); }}>문의 작성</Button>
        </Stack>
      </Stack>
      {renderContent()}
    </Box>
  );
}
