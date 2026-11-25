import { Alert, Button, Divider, Paper, Stack, TextField, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { listTalkErrorReports, talkErrorLogUrl } from "@/services/talk-error-reports";
import { formatTalkFileSize } from "@/services/talk-releases";
import TalkDiagnosticsPanel from "./TalkDiagnosticsPanel";

const receiptPattern = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const dateFormat = new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Seoul" });

export default function TalkErrorReportsPage() {
  const [draft, setDraft] = useState("");
  const [memberDraft, setMemberDraft] = useState("");
  const [query, setQuery] = useState({ page: 1, receiptId: "", memberName: "" });
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    listTalkErrorReports({ ...query, signal: controller.signal })
      .then(setData)
      .catch(() => { if (!controller.signal.aborted) setError("오류 보고 목록을 불러오지 못했습니다."); });
    return () => controller.abort();
  }, [query]);

  function applyQuery(next) {
    setData(null);
    setError("");
    setQuery(next);
  }

  function search(event) {
    event.preventDefault();
    const receiptId = draft.trim();
    if (receiptId && !receiptPattern.test(receiptId)) {
      setInvalid(true);
      return;
    }
    applyQuery({ page: 1, receiptId, memberName: memberDraft.trim() });
  }

  return (
    <Stack spacing={2.5} sx={{ p: { xs: 2, md: 4 }, maxWidth: 1000, mx: "auto" }}>
      <Typography component="h1" variant="h4" fontWeight={800}>보조개톡 오류 보고</Typography>
      <Stack component="form" direction={{ xs: "column", sm: "row" }} gap={1} onSubmit={search}>
        <TextField label="회원 이름" value={memberDraft} onChange={event => setMemberDraft(event.target.value)}
          slotProps={{ htmlInput: { maxLength: 100 } }} size="small" fullWidth />
        <TextField label="접수번호" value={draft} error={invalid} helperText={invalid ? "접수번호 형식을 확인해 주세요." : undefined}
          onChange={event => { setDraft(event.target.value); setInvalid(false); }} size="small" fullWidth />
        <Button type="submit" variant="contained">조회</Button>
        {(query.receiptId || query.memberName) && <Button onClick={() => { setDraft(""); setMemberDraft(""); setInvalid(false); applyQuery({ page: 1, receiptId: "", memberName: "" }); }}>전체</Button>}
      </Stack>
      {error && <Alert severity="error" action={<Button color="inherit" onClick={() => applyQuery({ ...query })}>다시 시도</Button>}>{error}</Alert>}
      {!data && !error && <Typography role="status">불러오는 중…</Typography>}
      {data?.items.length === 0 && <Typography color="text.secondary">조회된 오류 보고가 없습니다.</Typography>}
      {data?.items.length > 0 && <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3 }}>
        <Stack spacing={1.5} divider={<Divider />}>
          {data.items.map(report => (
            <Stack key={report.id} direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "center" }} justifyContent="space-between" gap={1}>
              <Stack spacing={0.5} sx={{ minWidth: 0, overflowWrap: "anywhere" }}>
                <Typography fontWeight={750}>{report.filename} · {formatTalkFileSize(report.size)}</Typography>
                <Typography variant="body2">{report.user_id
                  ? `${report.user_name || "이름 없음"} · 회원 ID ${report.user_id}${report.user_email ? ` · ${report.user_email}` : ""}`
                  : "회원 정보 없음"}</Typography>
                <Typography variant="body2" color="text.secondary">{dateFormat.format(new Date(report.received_at))} · 앱 버전 {report.app_version || "미입력"}</Typography>
                <Typography variant="caption" color="text.secondary">접수번호 {report.id}</Typography>
              </Stack>
              <Button href={talkErrorLogUrl(report.id)} variant="outlined" size="small" sx={{ alignSelf: { xs: "flex-start", sm: "center" } }}>로그 다운로드</Button>
            </Stack>
          ))}
        </Stack>
      </Paper>}
      {(query.page > 1 || data?.has_more) && <Stack direction="row" alignItems="center" justifyContent="center" gap={1}>
        <Button disabled={query.page === 1 || !data} onClick={() => applyQuery({ ...query, page: query.page - 1 })}>이전</Button>
        <Typography variant="body2">{query.page} 페이지</Typography>
        <Button disabled={!data?.has_more} onClick={() => applyQuery({ ...query, page: query.page + 1 })}>다음</Button>
      </Stack>}
      <Divider />
      <TalkDiagnosticsPanel />
    </Stack>
  );
}
