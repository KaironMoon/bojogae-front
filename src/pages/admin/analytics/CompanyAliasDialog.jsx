/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";

import { deleteCompanyAlias, upsertCompanyAlias } from "@/services/analytics-service";

function CompanyAliasDialog({
  open,
  onClose,
  aliases = [],
  initialRawLabel = "",
  initialCanonicalName = "",
  onChanged,
}) {
  const [rawLabel, setRawLabel] = useState("");
  const [canonicalName, setCanonicalName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setRawLabel(initialRawLabel || "");
      setCanonicalName(initialCanonicalName || "");
      setError("");
    }
  }, [open, initialRawLabel, initialCanonicalName]);

  const handleSave = async (event) => {
    event.preventDefault();
    if (!rawLabel.trim() || !canonicalName.trim()) {
      setError("원본 소속명과 통합 회사명을 모두 입력해 주세요.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await upsertCompanyAlias(rawLabel.trim(), canonicalName.trim());
      setRawLabel("");
      setCanonicalName("");
      onChanged?.();
    } catch {
      setError("회사 병합 규칙을 저장하지 못했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (aliasId) => {
    setSaving(true);
    setError("");
    try {
      await deleteCompanyAlias(aliasId);
      onChanged?.();
    } catch {
      setError("회사 병합 규칙을 삭제하지 못했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 800 }}>유사 회사명 통합 규칙 관리</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          자동 클러스터링 외에 추가로 하나로 합치고 싶은 원본 소속명을 지정하면 통계와 마케팅 추출에 즉시 반영됩니다.
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Stack component="form" onSubmit={handleSave} spacing={1.5} sx={{ mb: 3 }}>
          <TextField
            size="small"
            label="원본 소속명 (예: 현대홈, A+, 강대한지점)"
            value={rawLabel}
            onChange={(e) => setRawLabel(e.target.value)}
            required
          />
          <TextField
            size="small"
            label="통합할 공식 회사명 (예: 현대홈쇼핑 GA)"
            value={canonicalName}
            onChange={(e) => setCanonicalName(e.target.value)}
            required
          />
          <Button type="submit" variant="contained" disabled={saving}>
            {saving ? "적용 및 재집계 중..." : "병합 규칙 추가 및 재집계"}
          </Button>
        </Stack>

        <Divider sx={{ mb: 2 }} />
        <Typography variant="subtitle2" sx={{ fontWeight: 750, mb: 1 }}>
          등록된 수동 병합 규칙 ({aliases.length}개)
        </Typography>
        {aliases.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            아직 등록된 수동 규칙이 없습니다. (기본 GA 디렉터리·유사도 자동 병합만 적용 중)
          </Typography>
        ) : (
          <Stack spacing={1}>
            {aliases.map((item) => (
              <Stack
                key={item.id}
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ px: 1.5, py: 0.75, borderRadius: 1.5, border: "1px solid var(--bojogae-line)" }}
              >
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                  <Chip size="small" label={item.raw_label} variant="outlined" />
                  <Typography variant="body2">→</Typography>
                  <Chip size="small" label={item.canonical_name} color="primary" variant="outlined" />
                </Stack>
                <IconButton
                  size="small"
                  color="error"
                  disabled={saving}
                  onClick={() => handleDelete(item.id)}
                  aria-label="규칙 삭제"
                >
                  <DeleteOutlineRoundedIcon fontSize="small" />
                </IconButton>
              </Stack>
            ))}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>닫기</Button>
      </DialogActions>
    </Dialog>
  );
}

export default CompanyAliasDialog;
