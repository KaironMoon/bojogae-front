import { useEffect, useState } from "react";
import { Box, Link } from "@mui/material";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";

import apiCaller from "@/services/api-caller";

export default function MaintenanceBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let active = true;
    let pending = false;
    const check = async () => {
      if (pending) return;
      pending = true;
      try {
        const { data } = await apiCaller.get("/api/v1/maintenance");
        if (!active) return;
        if (data.enabled && data.restricted) {
          window.location.replace("/maintenance");
          return;
        }
        setVisible(data.enabled === true);
      } catch {
        // Keep the last known state until the server responds again.
      } finally {
        pending = false;
      }
    };
    check();
    const timer = window.setInterval(check, 15_000);
    window.addEventListener("focus", check);
    window.addEventListener("bojogae.maintenanceChanged", check);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener("focus", check);
      window.removeEventListener("bojogae.maintenanceChanged", check);
    };
  }, []);

  if (!visible) return null;

  return (
    <Box sx={{ textAlign: "center", bgcolor: "var(--bojogae-tint)", borderBottom: "1px solid var(--bojogae-line)" }}>
      <Link
        href="/maintenance"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="점검 중 · 사용자 화면 보기 (새 탭)"
        sx={{
          display: "inline-flex", gap: 0.75, alignItems: "center", px: 2, minHeight: 38,
          color: "var(--bojogae-accent-ink)", fontSize: 14, fontWeight: 800,
          "&:focus-visible": { outline: "2px solid var(--bojogae-accent-ink)", outlineOffset: -2 },
        }}
      >
        점검 중 · 사용자 화면 보기 <OpenInNewRoundedIcon sx={{ fontSize: 15 }} />
      </Link>
    </Box>
  );
}
