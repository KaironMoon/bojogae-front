/* eslint-disable react/prop-types */
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import LaptopWindowsRoundedIcon from "@mui/icons-material/LaptopWindowsRounded";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import {
  Accordion, AccordionDetails, AccordionSummary, Alert, Box, Button, Chip,
  CircularProgress, Container, Link as MuiLink, Paper, Stack, Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import {
  formatTalkFileSize, formatTalkReleaseDate, listTalkReleases, talkDownloadUrl, talkReleaseFiles,
} from "@/services/talk-releases";
import WindowsSecurityDialog from "./WindowsSecurityDialog";

const sectionTitle = { fontSize: { xs: 23, sm: 27 }, fontWeight: 800, letterSpacing: "-0.04em" };
const securityCases = [
  { id: "browser", label: "브라우저 다운로드 경고", summary: "공식 페이지에서 받기 시작한 파일인지 확인하세요. 브라우저가 보관 옵션을 제공하면 저장한 뒤 파일 이름과 SHA-256을 확인하세요." },
  { id: "installer", label: "설치형 EXE 차단 해제", summary: "다운로드한 EXE를 우클릭하고 속성 → 일반을 여세요. 하단에 ‘차단 해제’가 표시되면 체크하고 적용 → 확인을 누른 뒤 EXE를 실행하세요." },
  { id: "portable", label: "무설치형 ZIP 차단 해제", summary: "ZIP을 ‘모두 추출’한 뒤, 나온 bojogaetalk.exe를 우클릭하세요. 속성 → 일반에서 ‘차단 해제’가 보이면 체크하고 적용 → 확인을 누른 뒤 실행하세요." },
  { id: "smartscreen", label: "SmartScreen 실행 경고", summary: "‘Windows에서 PC를 보호했습니다’ 화면에서 ‘추가 정보’를 누르세요. 앱 이름이 내려받은 파일과 일치하고 ‘실행’이 표시되면 선택하세요." },
  { id: "blocked", label: "실행 버튼이 없거나 백신이 차단한 경우", summary: "회사 PC의 보안 정책, Smart App Control 또는 백신이 차단할 수 있습니다. 경고 화면을 기록하고 PC 관리자나 보조개에 문의하세요." },
];
const faq = [
  ["다운로드가 중단되거나 파일이 보이지 않아요", "브라우저의 다운로드 목록에서 중단 사유를 확인하고, 공식 다운로드 페이지에서 다시 받아 보세요. 악성 소프트웨어나 원치 않는 앱으로 탐지됐다면 Windows 보안 → 보호 기록에서 탐지 이름을 확인하고 문의해 주세요."],
  ["압축을 풀었는데 앱이 열리지 않아요", "Windows 10/11 64비트와 .NET Framework 4.8이 필요합니다. 무설치형은 ZIP을 쓰기 가능한 폴더에 모두 풀고, support 폴더가 bojogaetalk.exe 옆에 있는 상태로 실행하세요. 압축 오류가 나면 동일 버전 ZIP의 SHA-256을 확인하세요."],
  ["보조개 계정으로 로그인할 수 없어요", "개인·단체 계정 유형을 확인하고 보조개톡 앱에서 로그인을 다시 시작하세요. 브라우저에서 로그인한 뒤 앱으로 돌아오세요. 요청이 만료됐거나 브라우저 창을 닫았다면 앱에서 새 로그인 요청을 만들면 됩니다."],
  ["PC 카카오톡이 연결되지 않거나 친구가 안 보여요", "같은 Windows 사용자로 PC 카카오톡을 실행하고 로그인한 뒤, 보조개톡의 ‘친구 전체 갱신’을 누르세요. 첫 갱신에는 최대 3분이 걸릴 수 있습니다. 열린 채팅방을 대상으로 사용할 때는 해당 방을 별도 창으로 열어 두세요."],
  ["발송이 실패했거나 예약 발송이 보류됐어요", "PC가 절전 상태였는지, 보조개톡과 PC 카카오톡이 실행 중이고 로그인돼 있는지 확인하세요. 재시도 전에 보조개톡 발송 이력과 실제 카카오톡 채팅방에서 전송 여부를 확인해 주세요."],
];

function ReleaseFiles({ release }) {
  return (
    <Stack spacing={2}>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2,minmax(0,1fr))" }, gap: 2 }}>
        {talkReleaseFiles.map(({ kind, label, extension, description }) => {
          const file = release.files[kind];
          const Icon = kind === "installer" ? LaptopWindowsRoundedIcon : Inventory2OutlinedIcon;
          return (
            <Paper key={kind} variant="outlined" sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 3, minWidth: 0 }}>
              <Stack spacing={1.5}>
                <Stack direction="row" alignItems="center" gap={1}>
                  <Icon color="primary" aria-hidden="true" />
                  <Typography component="h3" fontSize={18} fontWeight={800}>{label}</Typography>
                  <Typography color="text.secondary" variant="caption">{extension} · {formatTalkFileSize(file.size)}</Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">{description}</Typography>
                <Button variant={kind === "installer" ? "contained" : "outlined"}
                  href={talkDownloadUrl(release.id, kind)} startIcon={<DownloadRoundedIcon />}
                  aria-label={`${release.version} ${label} 다운로드`} sx={{ alignSelf: "flex-start" }}>
                  {label} 다운로드
                </Button>
                <Typography variant="caption" color="text.secondary" sx={{ overflowWrap: "anywhere" }}>{file.filename}</Typography>
                <Box component="details">
                  <Typography component="summary" variant="caption" sx={{ cursor: "pointer", color: "primary.main", fontWeight: 700 }}>SHA-256 확인</Typography>
                  <Box component="code" sx={{ display: "block", mt: 0.75, overflowWrap: "anywhere", fontSize: 12, userSelect: "all" }}>{file.sha256}</Box>
                </Box>
              </Stack>
            </Paper>
          );
        })}
      </Box>
      {release.notes && <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{release.notes}</Typography>}
    </Stack>
  );
}

function SecurityGuide({ onOpen }) {
  return (
    <Alert id="windows-security" severity="warning" icon={<ShieldOutlinedIcon />} variant="outlined"
      sx={{ borderRadius: 3, p: { xs: 1.5, sm: 2.5 }, scrollMarginTop: 16, "& .MuiAlert-message": { minWidth: 0 } }}>
      <Typography component="h2" variant="h6" fontWeight={800}>Windows 파일 차단 해제 및 실행 경고</Typography>
      <Typography variant="body2" sx={{ mt: 0.75 }}>현재 배포 파일에는 코드 서명이 없습니다. 공식 페이지에서 받은 파일의 SHA-256을 확인한 뒤 진행하세요.</Typography>
      <Stack component="ul" spacing={1.25} sx={{ pl: 0, my: 1.5, listStyle: "none" }}>
        {securityCases.map(item => (
          <Box component="li" key={item.id} sx={{ borderTop: "1px solid", borderColor: "divider", pt: 1.25 }}>
            <Typography component="h3" variant="body2" fontWeight={800}>{item.label}</Typography>
            <Typography variant="body2" sx={{ mt: 0.25 }}>{item.summary}</Typography>
            <Button onClick={() => onOpen(item)} variant="outlined" color="warning" size="small"
              aria-label={`${item.label} 상세 설명`} aria-haspopup="dialog" sx={{ mt: 0.75 }}>
              상세 설명
            </Button>
          </Box>
        ))}
      </Stack>
      <Typography variant="body2"><strong>SHA-256 확인.</strong> 다운로드 폴더의 PowerShell에서 아래 예시의 파일명을 실제 받은 파일로 바꿔 실행하세요. 값이 다르면 파일을 실행하지 말고 공식 페이지에서 다시 받아 주세요.</Typography>
      <Box component="code" sx={{ display: "block", mt: 0.75, overflowWrap: "anywhere", fontSize: 13 }}>
        Get-FileHash -Algorithm SHA256 -LiteralPath &quot;.\파일이름.exe&quot;
      </Box>
    </Alert>
  );
}

export default function TalkDownloadPage() {
  const { user } = useAuth();
  const [releases, setReleases] = useState(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [securityCase, setSecurityCase] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    listTalkReleases({ signal: controller.signal })
      .then(setReleases)
      .catch(() => { if (!controller.signal.aborted) setFailed(true); });
    return () => controller.abort();
  }, [attempt]);

  const [latest, ...older] = releases || [];
  const canContact = user?.status === "ACTIVE" && !user.must_change_password;
  return (
    <Box sx={canContact ? undefined : { minHeight: "100vh", bgcolor: "#f7f9fb", color: "#162235" }}>
      {!canContact && <Box component="header" sx={{ bgcolor: "background.paper", borderBottom: "1px solid", borderColor: "divider" }}>
        <Container maxWidth="md" sx={{ py: 1.5 }}>
          <Button component={Link} to="/" color="inherit" startIcon={<ArrowBackRoundedIcon />}>보조개 홈</Button>
        </Container>
      </Box>}
      <Container component="main" maxWidth="md" sx={{ py: { xs: 3.5, sm: 6 } }}>
        <Stack spacing={{ xs: 3, sm: 4 }}>
          <Box sx={{ bgcolor: "#e8f6ef", border: "1px solid #d0eadd", p: { xs: 2.5, sm: 4 }, borderRadius: 4 }}>
            <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "center" }} gap={2}>
              <Box sx={{ display: "grid", placeItems: "center", width: 58, height: 58, borderRadius: 3, bgcolor: "#086746", color: "white", flexShrink: 0 }}>
                <ChatBubbleOutlineRoundedIcon fontSize="large" aria-hidden="true" />
              </Box>
              <Box>
                <Typography component="h1" sx={{ fontSize: { xs: 31, sm: 42 }, fontWeight: 850, letterSpacing: "-0.055em", lineHeight: 1.2 }}>보조개톡 다운로드</Typography>
                <Typography sx={{ mt: 0.75 }} color="text.secondary">Windows 10/11 64비트 · PC 카카오톡 별도 설치 및 로그인 필요</Typography>
                <Stack direction="row" flexWrap="wrap" alignItems="center" gap={1.5} sx={{ mt: 1 }}>
                  <MuiLink href="#windows-security" sx={{ fontSize: 14, fontWeight: 700 }}>차단 해제·실행 경고 안내</MuiLink>
                  <MuiLink href="/guides/bojogae-kakao-sender-illustrated-guide-ko.pdf" target="_blank" rel="noopener noreferrer"
                    aria-label="사용설명서 PDF, 새 탭에서 열기" sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, fontSize: 14, fontWeight: 700 }}>
                    <DescriptionOutlinedIcon sx={{ fontSize: 16 }} aria-hidden="true" />
                    사용설명서 (PDF)
                  </MuiLink>
                </Stack>
              </Box>
            </Stack>
          </Box>
          <Box component="section" aria-labelledby="latest-talk-release">
            <Stack direction="row" alignItems="center" flexWrap="wrap" gap={1} sx={{ mb: 1.5 }}>
              <Typography id="latest-talk-release" component="h2" sx={sectionTitle}>최신 버전</Typography>
              {latest && <><Chip size="small" label={latest.version} color="success" /><Typography variant="body2" color="text.secondary">{formatTalkReleaseDate(latest.published_at)} 공개</Typography></>}
            </Stack>
            {latest && <ReleaseFiles release={latest} />}
            {!releases && !failed && <CircularProgress size={24} aria-label="배포 목록 불러오는 중" />}
            {releases?.length === 0 && <Alert severity="info">현재 공개된 보조개톡 버전이 없습니다.</Alert>}
            {failed && <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => { setFailed(false); setAttempt(value => value + 1); }}>다시 시도</Button>}>
              다운로드 목록을 불러오지 못했습니다.
            </Alert>}
          </Box>
          <SecurityGuide onOpen={setSecurityCase} />
          {older.length > 0 && <Box component="section" aria-labelledby="older-talk-releases">
            <Typography id="older-talk-releases" component="h2" sx={{ ...sectionTitle, mb: 1.5 }}>이전 버전</Typography>
            {older.map(release => <Accordion key={release.id} disableGutters variant="outlined">
              <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />} id={`release-${release.id}`} aria-controls={`files-${release.id}`}>
                <Stack direction="row" flexWrap="wrap" alignItems="center" gap={1.5}>
                  <Typography fontWeight={750} sx={{ overflowWrap: "anywhere", minWidth: 0 }}>{release.version}</Typography>
                  <Typography variant="body2" color="text.secondary">{formatTalkReleaseDate(release.published_at)}</Typography>
                </Stack>
              </AccordionSummary>
              <AccordionDetails><ReleaseFiles release={release} /></AccordionDetails>
            </Accordion>)}
          </Box>}
          <Box component="section" aria-labelledby="talk-troubleshooting">
            <Typography id="talk-troubleshooting" component="h2" sx={{ ...sectionTitle, mb: 1.5 }}>문제 해결</Typography>
            {faq.map(([title, answer], index) => <Accordion key={title} disableGutters variant="outlined">
              <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />} id={`talk-question-${index}`} aria-controls={`talk-answer-${index}`}>
                <Typography fontWeight={700}>{title}</Typography>
              </AccordionSummary>
              <AccordionDetails><Typography variant="body2" color="text.secondary">{answer}</Typography></AccordionDetails>
            </Accordion>)}
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>문의할 때는 보조개톡 버전, Windows 버전, 오류 문구를 함께 알려 주세요. 화면을 첨부한다면 계정과 고객정보를 가려 주세요.</Typography>
            <Button component={Link} to={canContact ? "/help/contact" : "/login"} sx={{ mt: 0.5 }}>
              {canContact ? "보조개 1:1 문의" : "1:1 문의를 위해 로그인"}
            </Button>
          </Box>
        </Stack>
      </Container>
      {securityCase && <WindowsSecurityDialog securityCase={securityCase} onClose={() => setSecurityCase(null)} />}
    </Box>
  );
}
