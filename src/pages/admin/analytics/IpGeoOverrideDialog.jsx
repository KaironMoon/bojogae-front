/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { deleteIpGeoOverride, upsertIpGeoOverride } from "@/services/analytics-service";

const KR_REGION_OPTIONS = [
  "서울특별시",
  "부산광역시",
  "대구광역시",
  "인천광역시",
  "광주광역시",
  "대전광역시",
  "울산광역시",
  "세종특별자치시",
  "경기도",
  "강원특별자치도",
  "충청북도",
  "충청남도",
  "전북특별자치도",
  "전라남도",
  "경상북도",
  "경상남도",
  "제주특별자치도",
  "해외",
  "로컬/사내망",
];

function IpGeoOverrideDialog({
  open,
  onClose,
  ipEntry,
  onChanged,
}) {
  const [regionName, setRegionName] = useState("대구광역시");
  const [cityName, setCityName] = useState("");
  const [ispNote, setIspNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open && ipEntry) {
      setRegionName(
        KR_REGION_OPTIONS.includes(ipEntry.region_name) ? ipEntry.region_name : "대구광역시",
      );
      setCityName(ipEntry.city_name && ipEntry.city_name !== "미확인" ? ipEntry.city_name : "");
      setIspNote(ipEntry.isp_name || "");
      setError("");
    }
  }, [open, ipEntry]);

  const handleSave = async (event) => {
    event.preventDefault();
    if (!ipEntry?.ip_address || !regionName.trim()) {
      setError("시/도 지역을 선택해 주세요.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await upsertIpGeoOverride({
        ip_address: ipEntry.ip_address,
        region_name: regionName.trim(),
        city_name: cityName.trim(),
        isp_note: ispNote.trim() || null,
      });
      onChanged?.();
      onClose?.();
    } catch {
      setError("IP 지역 보정을 저장하지 못했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleResetAuto = async () => {
    if (!ipEntry?.ip_address) return;
    setSaving(true);
    setError("");
    try {
      await deleteIpGeoOverride(ipEntry.ip_address);
      onChanged?.();
      onClose?.();
    } catch {
      setError("자동 추적으로 복원하지 못했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: 800 }}>접속 IP 지역 수동 보정</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          IP: <strong>{ipEntry?.ip_address || "-"}</strong>
          {(ipEntry?.top_companies || []).length > 0
            ? ` · 주요 소속: ${ipEntry.top_companies.join(", ")}`
            : ""}
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Stack component="form" id="ip-geo-override-form" onSubmit={handleSave} spacing={1.75}>
          <TextField
            size="small"
            select
            label="시 / 도 선택"
            value={regionName}
            onChange={(e) => setRegionName(e.target.value)}
            required
          >
            {KR_REGION_OPTIONS.map((r) => (
              <MenuItem key={r} value={r}>{r}</MenuItem>
            ))}
          </TextField>
          <TextField
            size="small"
            label="도시 / 지점 메모 (예: 대구, 대구 강대한지점)"
            value={cityName}
            onChange={(e) => setCityName(e.target.value)}
            placeholder="비워두면 시/도명으로 표시"
          />
          <TextField
            size="small"
            label="통신사 / 회선 메모 (선택)"
            value={ispNote}
            onChange={(e) => setIspNote(e.target.value)}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, justifyContent: "space-between" }}>
        {ipEntry?.geo_source === "manual" ? (
          <Button color="inherit" disabled={saving} onClick={handleResetAuto}>
            자동 추적으로 복원
          </Button>
        ) : <span />}
        <Stack direction="row" spacing={1}>
          <Button onClick={onClose} disabled={saving}>취소</Button>
          <Button type="submit" form="ip-geo-override-form" variant="contained" disabled={saving}>
            {saving ? "저장 및 재집계 중..." : "저장 및 재집계"}
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}

export default IpGeoOverrideDialog;
