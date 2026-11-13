import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";

export default function SocialLoginButton({ provider, recent, ...buttonProps }) { // eslint-disable-line react/prop-types
  const { id, name, mark, background, color, border, markColor } = provider; // eslint-disable-line react/prop-types
  if (id === "naver") {
    return (
      <Stack spacing={0.5} alignItems="center">
        <Button {...buttonProps} fullWidth aria-label="네이버 로그인" sx={{
          p: 0,
          minHeight: 56,
          overflow: "hidden",
          borderRadius: 1.5,
          backgroundColor: background,
          "&:hover": { backgroundColor: background },
          "&.Mui-disabled": { opacity: 0.5, backgroundColor: background },
        }}>
          <Box component="img" src="/images/naver-login-green.png" alt=""
            sx={{ display: "block", width: 368, maxWidth: "100%", height: "auto" }} />
        </Button>
        {recent && <Typography variant="caption" color="text.secondary">최근 로그인</Typography>}
      </Stack>
    );
  }

  return (
    <Button {...buttonProps} fullWidth variant="outlined" endIcon={<ArrowForwardRoundedIcon />}
      startIcon={<Box component="span" sx={{ width: 24, fontWeight: 900, color: markColor, textAlign: "center" }}>{mark}</Box>}
      sx={{
        minHeight: 54,
        justifyContent: "space-between",
        px: 2,
        borderRadius: 2.5,
        borderColor: border,
        backgroundColor: background,
        color,
        fontWeight: 750,
        "&:hover": { borderColor: border, backgroundColor: background, filter: "brightness(.97)" },
      }}>
      <Stack component="span" direction="row" spacing={1} alignItems="center">
        <Box component="span">{name}로 계속하기</Box>
        {recent && (
          <Chip component="span" label="최근 로그인" size="small" sx={{
            height: 22,
            backgroundColor: id === "kakao" ? "rgba(25, 25, 25, .12)" : "rgba(3, 199, 90, .12)",
            color: "inherit",
            fontSize: 11,
            fontWeight: 800,
          }} />
        )}
      </Stack>
    </Button>
  );
}
