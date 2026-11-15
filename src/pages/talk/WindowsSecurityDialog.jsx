/* eslint-disable react/prop-types */
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import {
  Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  IconButton, Link, Stack, Typography, useMediaQuery,
} from "@mui/material";

const control = {
  display: "inline-block", px: 1.25, py: 0.4, border: "1px solid #73839a",
  bgcolor: "#fff", color: "#172333", borderRadius: 0.5, fontSize: 12,
};
const highlight = { outline: "3px solid #ffca53", outlineOffset: 2 };
const windowStyle = {
  maxWidth: 460, width: "100%", mx: "auto", borderRadius: 2, overflow: "hidden",
  boxShadow: "0 3px 12px #20364b24", border: "1px solid #8c9cb1", fontSize: 13,
};

function Figure({ caption, children }) {
  return (
    <Box component="figure" sx={{ m: 0, mt: 1.25, p: { xs: 1, sm: 2 }, bgcolor: "#eef3f9", borderRadius: 2 }}>
      <Box aria-hidden="true">{children}</Box>
      <Typography component="figcaption" variant="caption" color="text.secondary" sx={{ display: "block", textAlign: "center", mt: 1.25 }}>
        {caption}
      </Typography>
    </Box>
  );
}

function PropertiesExample({ portable }) {
  const filename = portable ? "bojogaetalk.exe" : "bojogaetalk-setup.exe";
  return (
    <Figure caption="화면 예시 · 속성의 일반 탭에서 ‘차단 해제’ 체크">
      <Box sx={{ ...windowStyle, color: "#172333", bgcolor: "#f7f8fa" }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 1.5, py: 0.8, bgcolor: "#e4ecf6" }}>
          <Box sx={{ overflowWrap: "anywhere" }}>{filename} 속성</Box>
          <CloseRoundedIcon fontSize="small" />
        </Stack>
        <Box sx={{ p: 1.5 }}>
          <Box component="span" sx={{ ...control, px: 1.5 }}>일반</Box>
          <Stack spacing={1.25} sx={{ border: "1px solid #a8b4c4", bgcolor: "#fff", p: 1.5 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <DescriptionOutlinedIcon fontSize="small" />
              <Box sx={{ overflowWrap: "anywhere" }}>{filename}</Box>
            </Stack>
            <Box sx={{ borderTop: "1px solid #d7e0eb", pt: 1 }}>
              <Box sx={{ mb: 1 }}><strong>보안</strong> 이 파일은 다른 컴퓨터에서 가져왔습니다.</Box>
              <Box component="span" sx={{ ...control, ...highlight }}>☑ 차단 해제</Box>
            </Box>
          </Stack>
          <Stack direction="row" justifyContent="flex-end" gap={1} sx={{ mt: 1.5 }}>
            <Box component="span" sx={control}>확인</Box>
            <Box component="span" sx={control}>취소</Box>
            <Box component="span" sx={control}>적용</Box>
          </Stack>
        </Box>
      </Box>
    </Figure>
  );
}

function SmartScreenExample({ expanded }) {
  return (
    <Figure caption={expanded ? "화면 예시 · 앱 이름을 확인하고 ‘실행’ 선택" : "화면 예시 · 파란 경고 창에서 ‘추가 정보’ 선택"}>
      <Stack spacing={1.25} sx={{ ...windowStyle, bgcolor: "#0067b8", color: "#fff", p: { xs: 1.5, sm: 2 } }}>
        <Typography component="div" fontWeight={700} sx={{ fontSize: { xs: 18, sm: 22 } }}>Windows에서 PC를 보호했습니다</Typography>
        <Box>Microsoft Defender SmartScreen에서 인식할 수 없는 앱의 시작을 차단했습니다.</Box>
        {expanded ? (
          <Box sx={{ overflowWrap: "anywhere" }}>
            <strong>앱</strong> bojogaetalk-setup.exe<br />
            <strong>게시자</strong> 알 수 없는 게시자
          </Box>
        ) : (
          <Box component="span" sx={{ ...highlight, alignSelf: "flex-start", px: 0.75, textDecoration: "underline" }}>추가 정보</Box>
        )}
        <Stack direction="row" justifyContent="flex-end" flexWrap="wrap" gap={1.25} sx={{ pt: 0.75 }}>
          {expanded && <Box component="span" sx={{ ...control, ...highlight }}>실행</Box>}
          <Box component="span" sx={control}>실행 안 함</Box>
        </Stack>
      </Stack>
    </Figure>
  );
}

function FileUnblockGuide({ portable }) {
  return (
    <>
      <Alert severity="info">보조개 공식 페이지에서 받은 파일의 SHA-256이 일치하는지 먼저 확인하세요.</Alert>
      <Box component="ol" sx={{ pl: 2.5, my: 0, "& li + li": { mt: 0.75 } }}>
        {portable && <li><Typography variant="body2">다운로드한 ZIP을 우클릭하고 <strong>모두 추출</strong>을 선택합니다. 압축을 푼 폴더를 엽니다.</Typography></li>}
        <li>
          <Typography variant="body2">
            {portable ? <>압축을 푼 폴더의 <strong>bojogaetalk.exe</strong>를</> : "다운로드한 설치형 EXE를"} 우클릭하고 <strong>속성</strong>을 엽니다.
          </Typography>
        </li>
        <li>
          <Typography variant="body2"><strong>일반</strong> 탭 아래의 보안 영역에서 <strong>차단 해제</strong>를 체크하고 <strong>적용 → 확인</strong>을 누릅니다. 항목이 없으면 다음 단계로 넘어갑니다.</Typography>
          <PropertiesExample portable={portable} />
        </li>
        <li>{portable
          ? <Typography variant="body2">함께 풀린 support 폴더를 실행 파일 옆에 둔 상태에서 <strong>bojogaetalk.exe</strong>를 실행합니다.</Typography>
          : <Typography variant="body2">설치형 EXE를 실행하고 설치 마법사의 안내를 따릅니다.</Typography>}
        </li>
      </Box>
      <Link href="https://learn.microsoft.com/ko-kr/powershell/module/microsoft.powershell.utility/unblock-file#notes" target="_blank" rel="noopener noreferrer">Microsoft 파일 차단 해제 안내</Link>
    </>
  );
}

function SmartScreenGuide() {
  return (
    <>
      <Alert severity="info">보조개 공식 페이지에서 받은 파일의 SHA-256이 일치하는지 먼저 확인하세요.</Alert>
      <Box component="ol" sx={{ pl: 2.5, my: 0, "& li + li": { mt: 2 } }}>
        <li>
          <Typography variant="body2"><strong>‘Windows에서 PC를 보호했습니다’</strong> 화면이 뜨면 <strong>추가 정보</strong>를 누릅니다.</Typography>
          <SmartScreenExample />
        </li>
        <li>
          <Typography variant="body2">표시된 앱 이름이 방금 연 파일과 일치하는지 확인합니다. <strong>실행</strong> 또는 <strong>어쨌든 실행</strong> 버튼이 표시되면 선택합니다.</Typography>
          <SmartScreenExample expanded />
        </li>
      </Box>
      <Typography variant="body2">실행 버튼이 표시되지 않으면 PC 관리자나 보조개에 문의하세요.</Typography>
      <Link href="https://learn.microsoft.com/ko-kr/windows/apps/package-and-deploy/publish-first-app" target="_blank" rel="noopener noreferrer">Microsoft SmartScreen 안내</Link>
    </>
  );
}

function BrowserDownloadGuide() {
  return (
    <>
      <Typography variant="body2">브라우저의 다운로드 목록을 열어 방금 내려받은 파일과 경고 이유를 확인하세요. 공식 보조개 페이지에서 받았고 브라우저에 <strong>유지</strong> 또는 <strong>보관</strong> 옵션이 표시될 때 저장할 수 있습니다.</Typography>
      <Figure caption="화면 예시 · 다운로드 목록에서 파일과 경고를 확인">
        <Stack spacing={1.25} sx={{ ...windowStyle, bgcolor: "#fff", color: "#172333", p: 1.5 }}>
          <Typography component="div" fontWeight={800}>다운로드</Typography>
          <Box sx={{ border: "1px solid #d7e0eb", p: 1.5, overflowWrap: "anywhere" }}>
            <strong>bojogaetalk-setup.exe</strong>
            <Box sx={{ my: 1 }}>이 파일은 일반적으로 다운로드되지 않습니다.</Box>
            <Box component="span" sx={{ ...control, ...highlight }}>유지</Box>
          </Box>
        </Stack>
      </Figure>
      <Typography variant="body2">저장한 파일의 이름과 SHA-256을 다운로드 페이지의 값과 비교하세요. 브라우저가 위협을 탐지했다면 경고 문구를 확인하고 보조개에 문의하세요.</Typography>
      <Link href="https://learn.microsoft.com/en-us/deployedge/microsoft-edge-security-smartscreen" target="_blank" rel="noopener noreferrer">Microsoft Edge 다운로드 경고 안내</Link>
    </>
  );
}

function BlockedFileGuide() {
  return (
    <>
      <Typography variant="body2">SmartScreen에서 실행 버튼이 없으면 회사 보안 정책이 적용됐는지 PC 관리자에게 확인하세요. Windows 11 Smart App Control은 개별 앱 예외를 지원하지 않습니다.</Typography>
      <Figure caption="화면 예시 · 실행 버튼이 없으면 경고를 닫고 문의">
        <Stack spacing={1.25} sx={{ ...windowStyle, bgcolor: "#0067b8", color: "#fff", p: 2 }}>
          <Typography component="div" fontWeight={800}>Windows에서 PC를 보호했습니다</Typography>
          <Box>Microsoft Defender SmartScreen에서 앱의 시작을 차단했습니다.</Box>
          <Box component="span" sx={{ ...control, alignSelf: "flex-end" }}>실행 안 함</Box>
        </Stack>
      </Figure>
      <Typography variant="body2">Microsoft Defender가 위협을 탐지했다면 <strong>Windows 보안 → 바이러스 및 위협 방지 → 보호 기록</strong>에서 탐지 이름을 확인하세요. 문의할 때 오류 문구, 파일명, 보조개톡 버전을 함께 알려 주세요.</Typography>
      <Link href="https://support.microsoft.com/ko-kr/windows/security/threat-malware-protection/smart-app-control-frequently-asked-questions" target="_blank" rel="noopener noreferrer">Microsoft Smart App Control 안내</Link>
    </>
  );
}

const guides = {
  browser: <BrowserDownloadGuide />,
  installer: <FileUnblockGuide />,
  portable: <FileUnblockGuide portable />,
  smartscreen: <SmartScreenGuide />,
  blocked: <BlockedFileGuide />,
};

export default function WindowsSecurityDialog({ securityCase, onClose }) {
  const fullScreen = useMediaQuery(theme => theme.breakpoints.down("sm"));
  return (
    <Dialog open onClose={onClose} fullScreen={fullScreen} fullWidth maxWidth="sm"
      scroll="paper" aria-labelledby="talk-windows-dialog-title">
      <DialogTitle id="talk-windows-dialog-title" sx={{ pr: 7, fontWeight: 800 }}>
        {securityCase.label}
      </DialogTitle>
      <IconButton aria-label="안내 팝업 닫기" onClick={onClose} sx={{ position: "absolute", top: 10, right: 12 }}>
        <CloseRoundedIcon />
      </IconButton>
      <DialogContent dividers sx={{ px: { xs: 2, sm: 3 } }}>
        <Stack spacing={2}>
          {guides[securityCase.id]}
          <Typography variant="caption" color="text.secondary">화면 문구와 버튼 위치는 브라우저 또는 Windows 버전에 따라 달라질 수 있습니다.</Typography>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 2, py: 1.25 }}>
        <Button onClick={onClose} variant="contained">닫기</Button>
      </DialogActions>
    </Dialog>
  );
}
