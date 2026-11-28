import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import FolderZipOutlinedIcon from "@mui/icons-material/FolderZipOutlined";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import { useEffect, useState } from "react";
import { listTalkDiagnostics, talkDiagnosticUrl } from "@/services/talk-error-reports";
import { formatTalkFileSize } from "@/services/talk-releases";
import { AdminEmptyState } from "./components/AdminPageShell";

export default function TalkDiagnosticsPanel() {
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setData(null);
    setError("");
    listTalkDiagnostics(page, controller.signal)
      .then(setData)
      .catch(() => {
        if (!controller.signal.aborted) setError("분석 자료를 불러오지 못했습니다. 서버 DB 설정과 연결을 확인해 주세요.");
      });
    return () => controller.abort();
  }, [page, reload]);

  return (
    <Stack spacing={2}>
      <Paper variant="outlined" sx={{ p: { xs: 1.75, sm: 2.25 }, borderRadius: 3, bgcolor: "#FFFFFF" }}>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} gap={1.5}>
          <Box>
            <Typography component="h2" variant="h6" fontWeight={850}>카카오톡 분석 자료</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
              설치 파일과 읽기 전용 코드가 담긴 자료입니다. 실행하지 말고 분석 도구로 열어 주세요.
            </Typography>
          </Box>
          <Button size="small" variant="outlined" startIcon={<RefreshRoundedIcon />} onClick={() => setReload((value) => value + 1)} sx={{ flexShrink: 0, alignSelf: { xs: "flex-start", sm: "center" } }}>
            새로고침
          </Button>
        </Stack>
      </Paper>

      {error && <Alert severity="error">{error}</Alert>}
      {!data && !error && (
        <Box sx={{ py: 8, display: "grid", placeItems: "center" }}><CircularProgress /></Box>
      )}
      {data?.items.length === 0 && (
        <AdminEmptyState icon={FolderZipOutlinedIcon} title="접수된 분석 자료가 없습니다." />
      )}
      {data?.items.length > 0 && (
        <Paper variant="outlined" sx={{ p: { xs: 1.75, sm: 2.5 }, borderRadius: 3, bgcolor: "#FFFFFF" }}>
          <Stack spacing={2} divider={<Divider />}>
            {data.items.map((item) => (
              <Stack key={item.id} direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} gap={1.5}>
                <Stack spacing={0.4} sx={{ minWidth: 0, overflowWrap: "anywhere" }}>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                    <Typography fontWeight={800}>카카오톡 {item.kakao_version} · {formatTalkFileSize(item.size)}</Typography>
                    <Chip size="small" label={item.capture_complete ? "수집 완료" : "일부 수집"} color={item.capture_complete ? "success" : "warning"} />
                  </Stack>
                  <Typography variant="body2">회원 ID {item.owner_id} · 발송기 {item.app_version}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(item.received_at).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })} · 접수번호 {item.id}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">SHA-256 {item.executable_sha256}</Typography>
                </Stack>
                <Button
                  href={talkDiagnosticUrl(item.id)}
                  variant="outlined"
                  size="small"
                  startIcon={<DownloadRoundedIcon />}
                  sx={{ alignSelf: { xs: "flex-start", sm: "center" }, flexShrink: 0 }}
                >
                  ZIP 다운로드
                </Button>
              </Stack>
            ))}
          </Stack>
        </Paper>
      )}

      {(page > 1 || data?.has_more) && (
        <Stack direction="row" alignItems="center" justifyContent="center" spacing={1.5}>
          <Button variant="outlined" size="small" disabled={page === 1 || !data} onClick={() => setPage(page - 1)}>이전</Button>
          <Typography variant="body2" fontWeight={700}>{page} 페이지</Typography>
          <Button variant="outlined" size="small" disabled={!data?.has_more} onClick={() => setPage(page + 1)}>다음</Button>
        </Stack>
      )}
    </Stack>
  );
}
