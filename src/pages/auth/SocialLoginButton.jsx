import { Box, Button } from "@mui/material";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";

export default function SocialLoginButton({ provider, children, ...buttonProps }) { // eslint-disable-line react/prop-types
  const { id, name, mark, background, color, border, markColor } = provider; // eslint-disable-line react/prop-types
  if (id === "naver") {
    return (
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
      {children ?? `${name}로 계속하기`}
    </Button>
  );
}
