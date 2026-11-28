import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  InputAdornment,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import BugReportOutlinedIcon from "@mui/icons-material/BugReportOutlined";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { listTalkErrorReports, talkErrorLogUrl } from "@/services/talk-error-reports";
import { formatTalkFileSize } from "@/services/talk-releases";
import TalkDiagnosticsPanel from "./TalkDiagnosticsPanel";
import {
  AdminEmptyState,
  AdminFilterBar,
  AdminPageContainer,
  AdminPageHeader,
} from "./components/AdminPageShell";

const receiptPattern = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const dateFormat = new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Seoul" });

export default function TalkErrorReportsPage() {
  const [activeTab, setActiveTab] = useState("logs");
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
    <AdminPageContainer maxWidth={1120}>
      <AdminPageHeader
        icon={BugReportOutlinedIcon}
        title="보조개톡 오류 보고 · 분석"
        description="보조개톡 앱에서 전송된 오류 로그와 카카오톡 진단 번들을 조회·다운로드합니다."
      />

      <Paper variant="outlined" sx={{ borderRadius: 3, mb: 2.5, px: 1.5, bgcolor: "#FFFFFF" }}>
        <Tabs value={activeTab} onChange={(_e, next) => setActiveTab(next)} variant="scrollable" scrollButtons="auto">
          <Tab value="logs" label="오류 보고 로그" sx={{ fontWeight: 750 }} />
          <Tab value="diagnostics" label="카카오톡 분석 자료" sx={{ fontWeight: 750 }} />
        </Tabs>
      </Paper>

      {activeTab === "logs" ? (
        <Stack spacing={2}>
          <AdminFilterBar sx={{ mb: 0 }}>
            <Stack component="form" direction={{ xs: "column", sm: "row" }} gap={1.25} alignItems={{ sm: "flex-start" }} onSubmit={search}>
              <TextField
                label="회원 이름"
                value={memberDraft}
                onChange={(event) => setMemberDraft(event.target.value)}
                slotProps={{ htmlInput: { maxLength: 100 } }}
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment> }}
                size="small"
                fullWidth
              />
              <TextField
                label="접수번호"
                value={draft}
                error={invalid}
                helperText={invalid ? "접수번호 형식을 확인해 주세요." : undefined}
                onChange={(event) => { setDraft(event.target.value); setInvalid(false); }}
                size="small"
                fullWidth
              />
              <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
                <Button type="submit" variant="contained" size="small" sx={{ minHeight: 40, px: 2.5 }}>조회</Button>
                {(query.receiptId || query.memberName) && (
                  <Button
                    size="small"
                    variant="outlined"
                    sx={{ minHeight: 40 }}
                    onClick={() => {
                      setDraft("");
                      setMemberDraft("");
                      setInvalid(false);
                      applyQuery({ page: 1, receiptId: "", memberName: "" });
                    }}
                  >
                    전체
                  </Button>
                )}
              </Stack>
            </Stack>
          </AdminFilterBar>

          {error && (
            <Alert severity="error" action={<Button color="inherit" onClick={() => applyQuery({ ...query })}>다시 시도</Button>}>
              {error}
            </Alert>
          )}
          {!data && !error && (
            <Box sx={{ py: 8, display: "grid", placeItems: "center" }}><CircularProgress /></Box>
          )}
          {data?.items.length === 0 && (
            <AdminEmptyState icon={BugReportOutlinedIcon} title="조회된 오류 보고가 없습니다." />
          )}
          {data?.items.length > 0 && (
            <Paper variant="outlined" sx={{ p: { xs: 1.75, sm: 2.5 }, borderRadius: 3, bgcolor: "#FFFFFF" }}>
              <Stack spacing={1.5} divider={<Divider />}>
                {data.items.map((report) => (
                  <Stack key={report.id} direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "center" }} justifyContent="space-between" gap={1.5}>
                    <Stack spacing={0.4} sx={{ minWidth: 0, overflowWrap: "anywhere" }}>
                      <Typography fontWeight={800}>{report.filename} · {formatTalkFileSize(report.size)}</Typography>
                      <Typography variant="body2">
                        {report.user_id
                          ? `${report.user_name || "이름 없음"} · 회원 ID ${report.user_id}${report.user_email ? ` · ${report.user_email}` : ""}`
                          : "회원 정보 없음"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {dateFormat.format(new Date(report.received_at))} · 앱 버전 {report.app_version || "미입력"} · 접수번호 {report.id}
                      </Typography>
                    </Stack>
                    <Button
                      href={talkErrorLogUrl(report.id)}
                      variant="outlined"
                      size="small"
                      startIcon={<DownloadRoundedIcon />}
                      sx={{ alignSelf: { xs: "flex-start", sm: "center" }, flexShrink: 0 }}
                    >
                      로그 다운로드
                    </Button>
                  </Stack>
                ))}
              </Stack>
            </Paper>
          )}

          {(query.page > 1 || data?.has_more) && (
            <Stack direction="row" alignItems="center" justifyContent="center" gap={1.5}>
              <Button variant="outlined" size="small" disabled={query.page === 1 || !data} onClick={() => applyQuery({ ...query, page: query.page - 1 })}>이전</Button>
              <Typography variant="body2" fontWeight={700}>{query.page} 페이지</Typography>
              <Button variant="outlined" size="small" disabled={!data?.has_more} onClick={() => applyQuery({ ...query, page: query.page + 1 })}>다음</Button>
            </Stack>
          )}
        </Stack>
      ) : (
        <TalkDiagnosticsPanel />
      )}
    </AdminPageContainer>
  );
}
