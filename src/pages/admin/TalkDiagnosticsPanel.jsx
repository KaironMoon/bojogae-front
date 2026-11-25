import { Alert, Button, Divider, Paper, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { listTalkDiagnostics, talkDiagnosticUrl } from "@/services/talk-error-reports";
import { formatTalkFileSize } from "@/services/talk-releases";

export default function TalkDiagnosticsPanel() {
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    setData(null); setError("");
    listTalkDiagnostics(page, controller.signal).then(setData).catch(() => {
      if (!controller.signal.aborted) setError("분석 자료를 불러오지 못했습니다. 서버 DB 설정과 연결을 확인해 주세요.");
    });
    return () => controller.abort();
  }, [page, reload]);
  return <Stack spacing={2}>
    <Typography component="h2" variant="h5">카카오톡 분석 자료</Typography>
    <Typography variant="body2" color="text.secondary">설치 파일과 읽기 전용 코드가 담긴 자료입니다. 실행하지 말고 분석 도구로 열어 주세요. 일부 수집된 자료에는 누락 범위와 오류가 manifest.json에 기록됩니다.</Typography>
    <Button onClick={() => setReload(value => value + 1)} sx={{ alignSelf: "flex-start" }}>새로고침</Button>
    {error && <Alert severity="error">{error}</Alert>}
    {!data && !error && <Typography role="status">불러오는 중…</Typography>}
    {data?.items.length === 0 && <Typography>접수된 분석 자료가 없습니다.</Typography>}
    {data?.items.length > 0 && <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack spacing={2} divider={<Divider />}>
        {data.items.map(item => <Stack key={item.id} spacing={0.5} sx={{ overflowWrap: "anywhere" }}>
          <Typography fontWeight={700}>카카오톡 {item.kakao_version} · {formatTalkFileSize(item.size)}</Typography>
          <Typography variant="body2">회원 ID {item.owner_id} · 발송기 {item.app_version} · {item.capture_complete ? "수집 완료" : "일부 수집"}</Typography>
          <Typography variant="body2">{new Date(item.received_at).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}</Typography>
          <Typography variant="caption">SHA-256 {item.executable_sha256}</Typography>
          <Typography variant="caption">접수번호 {item.id}</Typography>
          <Button href={talkDiagnosticUrl(item.id)} variant="outlined" size="small" sx={{ alignSelf: "flex-start" }}>분석 자료 ZIP 다운로드</Button>
        </Stack>)}
      </Stack>
    </Paper>}
    <Stack direction="row" alignItems="center" justifyContent="center">
      <Button disabled={page === 1 || !data} onClick={() => setPage(page - 1)}>이전</Button>
      <Typography>{page} 페이지</Typography>
      <Button disabled={!data?.has_more} onClick={() => setPage(page + 1)}>다음</Button>
    </Stack>
  </Stack>;
}
