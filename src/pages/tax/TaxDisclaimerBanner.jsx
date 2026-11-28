import GavelOutlinedIcon from "@mui/icons-material/GavelOutlined";
import { Alert, Typography } from "@mui/material";

import { TAX_DISCLAIMER } from "@/services/tax-service";

export default function TaxDisclaimerBanner() {
  return (
    <Alert
      severity="info"
      icon={<GavelOutlinedIcon fontSize="small" />}
      sx={{
        mt: 3,
        borderRadius: 2.5,
        bgcolor: "#F8FAFC",
        border: "1px solid #CBD5E1",
        color: "#334155",
        "& .MuiAlert-icon": { color: "#475569" },
      }}
    >
      <Typography variant="body2" sx={{ fontWeight: 700, color: "#0F172A" }}>
        세무사법 준수 및 법적 안내
      </Typography>
      <Typography variant="caption" sx={{ display: "block", mt: 0.25, color: "#475569", lineHeight: 1.55 }}>
        {TAX_DISCLAIMER} 본 기능은 대리 신고나 세무 조정을 확정하지 않는 장부 정리 보조 도구입니다.
      </Typography>
    </Alert>
  );
}
