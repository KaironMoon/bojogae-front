import { Alert, Box, Button, Paper, Stack, Typography } from "@mui/material";
import ChatOutlinedIcon from "@mui/icons-material/ChatOutlined";

export default function HelpContactPage() {
  return (
    <Box sx={{ maxWidth: 900, mx: "auto", p: { xs: 2, md: 4 } }}>
      <Typography variant="overline" color="text.secondary">도움말 센터</Typography>
      <Typography variant="h4" fontWeight={800}>1:1 문의</Typography>
      <Paper variant="outlined" sx={{ p: { xs: 3, md: 5 }, mt: 3, borderRadius: 3 }}>
        <Stack spacing={2.5} alignItems="flex-start">
          <ChatOutlinedIcon sx={{ fontSize: 40, color: "primary.main" }} />
          <Typography variant="h6" fontWeight={750}>카카오톡으로 편하게 문의하세요</Typography>
          <Typography color="text.secondary">보조개 카카오톡 채널에서 1:1 상담을 진행합니다. 버튼을 누르면 카카오톡 채팅 연결 화면이 새 창으로 열립니다.</Typography>
          <Button component="a" href="https://pf.kakao.com/_xjaxjmX/chat" target="_blank" rel="noopener noreferrer" variant="contained" size="large"
            sx={{ bgcolor: "#FEE500", color: "#191919", boxShadow: "none", "&:hover": { bgcolor: "#f3d900" } }}>
            카카오톡 1:1 문의하기
          </Button>
          <Button component="a" href="https://pf.kakao.com/_xjaxjmX" target="_blank" rel="noopener noreferrer">보조개 카카오톡 채널 보기</Button>
          <Alert severity="info">상담 가능 시간과 답변은 카카오톡 채널에서 확인해 주세요.</Alert>
        </Stack>
      </Paper>
    </Box>
  );
}
