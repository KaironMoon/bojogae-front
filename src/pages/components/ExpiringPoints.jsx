import { Alert } from "@mui/material";

export default function ExpiringPoints({ balance }) { // eslint-disable-line react/prop-types
  // eslint-disable-next-line react/prop-types
  if (!balance?.expiring_points || !balance.next_expiration) return null;
  return (
    <Alert severity="warning" sx={{ my: 2 }}>
      {/* eslint-disable-next-line react/prop-types */}
      7일 이내 만료 예정: {balance.expiring_points.toLocaleString()}P · 가장 가까운 만료:
      {/* eslint-disable-next-line react/prop-types */}
      {new Date(balance.next_expiration).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })} (한국 시간)
    </Alert>
  );
}
