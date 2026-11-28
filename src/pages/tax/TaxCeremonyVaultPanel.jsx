/* eslint-disable react/prop-types */
import { useState } from "react";
import CardGiftcardOutlinedIcon from "@mui/icons-material/CardGiftcardOutlined";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import {
  Alert,
  Box,
  Button,
  Chip,
  Grid,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

import { AdminTableCard } from "@/pages/admin/components/AdminPageShell";
import { extractTaxError, formatKrw } from "@/services/tax-service";

const EVENT_LIMIT = 200_000;

export default function TaxCeremonyVaultPanel({
  apiClient,
  profiles = [],
  vault = { items: [], total_count: 0, total_recognized_amount: 0, event_limit: EVENT_LIMIT },
  taxYear,
  onReload,
  onNotify,
}) {
  const defaultDate = `${taxYear || new Date().getFullYear()}-11-28`;
  const [form, setForm] = useState({
    profile_id: profiles[0]?.id || "",
    event_type: "WEDDING",
    tx_date: defaultDate,
    recipient_name: "",
    amount: "",
    memo: "",
  });
  const [proofFile, setProofFile] = useState(null);
  const [busy, setBusy] = useState(false);

  const numericAmount = Number(form.amount || 0);
  const exceedsLimit = numericAmount > EVENT_LIMIT;
  const items = vault?.items || [];

  const handleSubmit = async () => {
    if (!form.recipient_name.trim() || numericAmount <= 0) {
      onNotify("warning", "대상자·고객명과 지출 금액(1원 이상)을 입력해 주세요.");
      return;
    }
    setBusy(true);
    try {
      const created = await apiClient.createCeremonyEvidence({
        profile_id: form.profile_id || profiles[0]?.id,
        tx_date: form.tx_date || defaultDate,
        event_type: form.event_type,
        recipient_name: form.recipient_name.trim(),
        amount: numericAmount,
        memo: form.memo.trim(),
        file: proofFile,
      });
      onNotify(
        "success",
        created.limit_applied
          ? `경조사 증빙 등록 완료 (법정 한도 적용: ${formatKrw(created.original_amount)} → ${formatKrw(created.recognized_amount)} 접대비 합산)`
          : `경조사 증빙 등록 완료 (${formatKrw(created.recognized_amount)} 접대비 합산)`,
      );
      setForm((prev) => ({ ...prev, recipient_name: "", amount: "", memo: "" }));
      setProofFile(null);
      await onReload();
    } catch (err) {
      onNotify("error", extractTaxError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (itemId) => {
    setBusy(true);
    try {
      await apiClient.deleteTransaction(itemId);
      onNotify("success", "경조사 증빙 내역을 삭제했습니다.");
      await onReload();
    } catch (err) {
      onNotify("error", extractTaxError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, bgcolor: "#fff" }}>
      <Stack spacing={2}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={1}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <CardGiftcardOutlinedIcon color="success" />
            <Box>
              <Typography variant="subtitle1" fontWeight={800}>
                경조사 증빙 보관함 (모바일 청첩장·부고장 → 건당 20만 원 자동 합산)
              </Typography>
              <Typography variant="caption" color="text.secondary">
                결혼식 축의금·장례식 조의금은 청첩장·부고장 캡처와 이체 내역만으로 영수증 없이 건당 최대 20만 원까지 접대비 필요경비로 인정됩니다.
              </Typography>
            </Box>
          </Stack>
          <Chip
            size="small"
            color="success"
            variant="outlined"
            label={`인정 합계 ${formatKrw(vault?.total_recognized_amount || 0)} (${vault?.total_count || 0}건)`}
            sx={{ fontWeight: 800, flexShrink: 0 }}
          />
        </Stack>

        <Grid container spacing={1.5} alignItems="center">
          <Grid item xs={12} sm={2.5}>
            <TextField
              select
              fullWidth
              size="small"
              label="경조사 구분"
              value={form.event_type}
              onChange={(e) => setForm((p) => ({ ...p, event_type: e.target.value }))}
            >
              <MenuItem value="WEDDING">결혼식 축의금</MenuItem>
              <MenuItem value="FUNERAL">장례식 조의금</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={6} sm={2.5}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="일자"
              InputLabelProps={{ shrink: true }}
              value={form.tx_date}
              onChange={(e) => setForm((p) => ({ ...p, tx_date: e.target.value }))}
            />
          </Grid>
          <Grid item xs={6} sm={3.5}>
            <TextField
              fullWidth
              size="small"
              label="대상자·고객명 (예: 홍길동 고객 자녀 결혼)"
              value={form.recipient_name}
              onChange={(e) => setForm((p) => ({ ...p, recipient_name: e.target.value }))}
            />
          </Grid>
          <Grid item xs={6} sm={3.5}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="지출 금액 (원)"
              value={form.amount}
              onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
            />
          </Grid>

          <Grid item xs={12} sm={4.5}>
            <TextField
              fullWidth
              size="small"
              label="메모 (선택: 관계·계좌이체 출처 등)"
              value={form.memo}
              onChange={(e) => setForm((p) => ({ ...p, memo: e.target.value }))}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button
              fullWidth
              variant="outlined"
              component="label"
              startIcon={<CloudUploadOutlinedIcon />}
              sx={{ height: 40, justifyContent: "flex-start", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
            >
              {proofFile ? proofFile.name : "청첩장·부고장 이미지 업로드 (선택)"}
              <input
                hidden
                type="file"
                accept=".png,.jpg,.jpeg,.webp,.pdf"
                onChange={(e) => setProofFile(e.target.files?.[0] || null)}
              />
            </Button>
          </Grid>
          <Grid item xs={12} sm={3.5}>
            <Button
              fullWidth
              variant="contained"
              disabled={busy || !form.recipient_name.trim() || numericAmount <= 0}
              onClick={handleSubmit}
              sx={{ height: 40, bgcolor: "#03C75A", "&:hover": { bgcolor: "#008A60" }, fontWeight: 700 }}
            >
              {busy ? "저장 중..." : "경조사비 장부 자동 합산"}
            </Button>
          </Grid>
        </Grid>

        {exceedsLimit && (
          <Alert severity="info" sx={{ py: 0.5, borderRadius: 2 }}>
            입력 금액({formatKrw(numericAmount)})은 세법상 경조사비 건당 한도 <strong>200,000원</strong>을 초과하여, 장부 접대비에는{" "}
            <strong>200,000원</strong>으로 자동 한도 조정되어 반영됩니다.
          </Alert>
        )}

        <AdminTableCard>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>일자</TableCell>
                <TableCell>구분</TableCell>
                <TableCell>대상자·고객명</TableCell>
                <TableCell align="right">원지출</TableCell>
                <TableCell align="right">경비 인정액</TableCell>
                <TableCell>청첩장·부고장 증빙</TableCell>
                <TableCell align="right">관리</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3, color: "text.secondary" }}>
                    등록된 경조사 증빙이 없습니다. 모바일 청첩장·부고장 캡처를 함께 올리면 접대비로 자동 합산됩니다.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.tx_date}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={item.event_type === "FUNERAL" ? "장례 조의" : "결혼 축의"}
                        color={item.event_type === "FUNERAL" ? "default" : "success"}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>
                      {item.recipient_name}
                      {item.memo ? (
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                          {item.memo}
                        </Typography>
                      ) : null}
                    </TableCell>
                    <TableCell align="right">{formatKrw(item.original_amount)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, color: "#006E43" }}>
                      <Stack direction="row" spacing={0.75} justifyContent="flex-end" alignItems="center">
                        <span>{formatKrw(item.recognized_amount)}</span>
                        {item.limit_applied && <Chip size="small" label="20만 원 한도 적용" color="warning" />}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      {item.has_file ? (
                        <Button
                          size="small"
                          startIcon={<DownloadOutlinedIcon fontSize="small" />}
                          onClick={() => apiClient.downloadCeremonyFile(item.id, item.file_name)}
                        >
                          {item.file_name || "증빙 보기"}
                        </Button>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          이체 내역만 등록
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        color="error"
                        startIcon={<DeleteOutlineRoundedIcon fontSize="small" />}
                        disabled={busy}
                        onClick={() => handleDelete(item.id)}
                      >
                        삭제
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </AdminTableCard>
      </Stack>
    </Paper>
  );
}
