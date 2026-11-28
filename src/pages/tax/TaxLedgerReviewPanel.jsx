/* eslint-disable react/prop-types */
import { useState } from "react";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import DoNotDisturbOnOutlinedIcon from "@mui/icons-material/DoNotDisturbOnOutlined";
import {
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import { extractTaxError, formatKrw } from "@/services/tax-service";

const REVIEW_BADGE = {
  PENDING: { label: "미검토", color: "warning" },
  CONFIRMED: { label: "업무 확정", color: "success" },
  EXCLUDED: { label: "개인 제외", color: "default" },
};

const VAT_BADGE = {
  DEDUCTIBLE: { label: "공제", color: "success" },
  NON_DEDUCTIBLE: { label: "불공제", color: "error" },
  EXEMPT_ZERO: { label: "영세·외화", color: "info" },
  REVIEW_NEEDED: { label: "확인필요", color: "warning" },
  NOT_APPLICABLE: { label: "면세", color: "default" },
};

export default function TaxLedgerReviewPanel({
  mode = "AGENT",
  apiClient,
  profiles = [],
  transactions = [],
  categories = { income: [], expense: [] },
  onReload,
  onNotify,
}) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({
    profile_id: profiles[0]?.id || "",
    tx_date: new Date().toISOString().slice(0, 10),
    direction: "EXPENSE",
    merchant_name: "",
    description: "",
    amount: "",
    currency: "KRW",
    foreign_amount: "",
    exchange_rate: "",
    evidence_type: "CARD",
    account_category: mode === "COMPANY" ? "서버·클라우드비" : "차량유지비",
    usage_type: "BUSINESS",
    review_status: "CONFIRMED",
  });

  const filtered = transactions.filter((tx) => {
    if (statusFilter !== "ALL" && tx.review_status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const hit =
        tx.merchant_name?.toLowerCase().includes(q) ||
        tx.description?.toLowerCase().includes(q) ||
        tx.account_category?.toLowerCase().includes(q);
      if (!hit) return false;
    }
    return true;
  });

  const allSelected = filtered.length > 0 && filtered.every((t) => selectedIds.includes(t.id));

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map((t) => t.id));
    }
  };

  const toggleOne = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleBulkReview = async (reviewStatus) => {
    if (selectedIds.length === 0) return;
    setBusy(true);
    try {
      const res = await apiClient.bulkReview({
        transaction_ids: selectedIds,
        review_status: reviewStatus,
        usage_type: reviewStatus === "CONFIRMED" ? "BUSINESS" : "PERSONAL",
      });
      onNotify("success", `${res.updated_count}건을 ${reviewStatus === "CONFIRMED" ? "업무용 확정" : "개인용 제외"} 처리했습니다.`);
      setSelectedIds([]);
      await onReload();
    } catch (err) {
      onNotify("error", extractTaxError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleQuickReview = async (tx, reviewStatus) => {
    setBusy(true);
    try {
      await apiClient.updateTransaction(tx.id, {
        review_status: reviewStatus,
        usage_type: reviewStatus === "CONFIRMED" ? "BUSINESS" : "PERSONAL",
      });
      await onReload();
    } catch (err) {
      onNotify("error", extractTaxError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleCategoryChange = async (tx, category) => {
    try {
      await apiClient.updateTransaction(tx.id, { account_category: category });
      await onReload();
    } catch (err) {
      onNotify("error", extractTaxError(err));
    }
  };

  const handleVatToggle = async (tx, vatStatus) => {
    try {
      await apiClient.updateTransaction(tx.id, { vat_deduction_status: vatStatus });
      await onReload();
    } catch (err) {
      onNotify("error", extractTaxError(err));
    }
  };

  const handleAiClassify = async () => {
    setBusy(true);
    try {
      const res = await apiClient.classify({ only_pending: true, use_ai: true });
      onNotify("success", `AI 자동 기장 분류 완료 (${res.classified_count}건)`);
      await onReload();
    } catch (err) {
      onNotify("error", extractTaxError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleAddSubmit = async () => {
    if (!form.merchant_name.trim() || !form.amount) return;
    setBusy(true);
    try {
      await apiClient.createTransaction({
        ...form,
        profile_id: Number(form.profile_id || profiles[0]?.id),
        amount: Number(form.amount),
        foreign_amount: form.foreign_amount ? Number(form.foreign_amount) : null,
        exchange_rate: form.exchange_rate ? Number(form.exchange_rate) : null,
      });
      setAddOpen(false);
      setForm((p) => ({ ...p, merchant_name: "", description: "", amount: "", foreign_amount: "" }));
      onNotify("success", "거래내역을 장부에 추가했습니다.");
      await onReload();
    } catch (err) {
      onNotify("error", extractTaxError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiClient.deleteTransaction(id);
      await onReload();
    } catch (err) {
      onNotify("error", extractTaxError(err));
    }
  };

  return (
    <Stack spacing={2}>
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, bgcolor: "#fff" }}>
        <Stack
          direction={{ xs: "column", lg: "row" }}
          spacing={1.5}
          justifyContent="space-between"
          alignItems={{ lg: "center" }}
        >
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
            {[
              { id: "ALL", label: `전체 (${transactions.length})` },
              { id: "PENDING", label: `미검토 (${transactions.filter((t) => t.review_status === "PENDING").length})` },
              { id: "CONFIRMED", label: "업무 확정" },
              { id: "EXCLUDED", label: "개인 제외" },
            ].map((chip) => (
              <Chip
                key={chip.id}
                label={chip.label}
                clickable
                color={statusFilter === chip.id ? "success" : "default"}
                variant={statusFilter === chip.id ? "filled" : "outlined"}
                onClick={() => setStatusFilter(chip.id)}
              />
            ))}
            <TextField
              size="small"
              placeholder="가맹점·적요·계정과목 검색"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ minWidth: 210 }}
            />
          </Stack>

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button
              size="small"
              variant="contained"
              startIcon={<AutoAwesomeRoundedIcon />}
              onClick={handleAiClassify}
              disabled={busy}
              sx={{ bgcolor: "#03C75A", "&:hover": { bgcolor: "#008A60" } }}
            >
              AI 자동 기장 실행
            </Button>
            {selectedIds.length > 0 && (
              <>
                <Button
                  size="small"
                  variant="outlined"
                  color="success"
                  onClick={() => handleBulkReview("CONFIRMED")}
                  disabled={busy}
                >
                  선택 {selectedIds.length}건 업무 확정
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="inherit"
                  onClick={() => handleBulkReview("EXCLUDED")}
                  disabled={busy}
                >
                  선택 개인 제외
                </Button>
              </>
            )}
            <Button
              size="small"
              variant="outlined"
              startIcon={<AddRoundedIcon />}
              onClick={() => setAddOpen(true)}
            >
              수동 입력
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: "hidden", bgcolor: "#fff" }}>
        <TableContainer>
          <Table size="small">
            <TableHead sx={{ bgcolor: "#F8FAFC" }}>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox checked={allSelected} onChange={toggleAll} size="small" />
                </TableCell>
                <TableCell>일자</TableCell>
                <TableCell>가맹점 / 거래처</TableCell>
                <TableCell>계정과목 (AI 분류)</TableCell>
                <TableCell align="right">금액</TableCell>
                {mode === "COMPANY" && <TableCell>부가세 공제</TableCell>}
                <TableCell>상태</TableCell>
                <TableCell align="right">빠른 분리</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={mode === "COMPANY" ? 8 : 7} align="center" sx={{ py: 5, color: "text.secondary" }}>
                    표시할 거래내역이 없습니다. 상단 수집 탭이나 수동 입력으로 내역을 추가해 보세요.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((tx) => {
                  const badge = REVIEW_BADGE[tx.review_status] || REVIEW_BADGE.PENDING;
                  const vatBadge = VAT_BADGE[tx.vat_deduction_status] || VAT_BADGE.NOT_APPLICABLE;
                  const catOptions =
                    tx.direction === "INCOME" ? categories.income : categories.expense;
                  return (
                    <TableRow key={tx.id} hover>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedIds.includes(tx.id)}
                          onChange={() => toggleOne(tx.id)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell sx={{ whiteSpace: "nowrap" }}>
                        <Typography variant="body2" fontWeight={600}>
                          {tx.tx_date}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {tx.business_name}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ minWidth: 180 }}>
                        <Typography variant="body2" fontWeight={700}>
                          {tx.merchant_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                          {[tx.card_or_account, tx.description, tx.ai_reason].filter(Boolean).join(" · ")}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ minWidth: 170 }}>
                        <TextField
                          select
                          size="small"
                          value={catOptions.includes(tx.account_category) ? tx.account_category : ""}
                          onChange={(e) => handleCategoryChange(tx, e.target.value)}
                          sx={{ minWidth: 155 }}
                        >
                          {!catOptions.includes(tx.account_category) && (
                            <MenuItem value={tx.account_category}>{tx.account_category}</MenuItem>
                          )}
                          {catOptions.map((cat) => (
                            <MenuItem key={cat} value={cat}>
                              {cat}
                            </MenuItem>
                          ))}
                        </TextField>
                      </TableCell>
                      <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                        <Typography
                          variant="body2"
                          fontWeight={800}
                          color={tx.direction === "INCOME" ? "primary.dark" : "#0F172A"}
                        >
                          {tx.direction === "INCOME" ? "+" : "-"}
                          {formatKrw(tx.amount)}
                        </Typography>
                        {tx.currency && tx.currency !== "KRW" && tx.foreign_amount != null && (
                          <Typography variant="caption" color="info.main">
                            {`${tx.currency} ${Number(tx.foreign_amount).toLocaleString()}`}
                          </Typography>
                        )}
                      </TableCell>
                      {mode === "COMPANY" && (
                        <TableCell>
                          <TextField
                            select
                            size="small"
                            value={tx.vat_deduction_status}
                            onChange={(e) => handleVatToggle(tx, e.target.value)}
                            sx={{ minWidth: 112 }}
                          >
                            {Object.entries(VAT_BADGE).map(([k, info]) => (
                              <MenuItem key={k} value={k}>
                                {info.label}
                              </MenuItem>
                            ))}
                          </TextField>
                          <Chip size="small" label={vatBadge.label} color={vatBadge.color} sx={{ ml: 0.5, display: "none" }} />
                        </TableCell>
                      )}
                      <TableCell>
                        <Chip size="small" label={badge.label} color={badge.color} />
                      </TableCell>
                      <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                        <Tooltip title="업무용 확정">
                          <IconButton
                            size="small"
                            color={tx.review_status === "CONFIRMED" ? "success" : "default"}
                            onClick={() => handleQuickReview(tx, "CONFIRMED")}
                          >
                            <CheckCircleOutlineRoundedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="가사·개인용 제외">
                          <IconButton
                            size="small"
                            color={tx.review_status === "EXCLUDED" ? "error" : "default"}
                            onClick={() => handleQuickReview(tx, "EXCLUDED")}
                          >
                            <DoNotDisturbOnOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="삭제">
                          <IconButton size="small" onClick={() => handleDelete(tx.id)}>
                            <DeleteOutlineRoundedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>거래내역 수동 입력</DialogTitle>
        <DialogContent>
          <Grid container spacing={1.5} sx={{ mt: 0.25 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                size="small"
                label="사업장"
                value={form.profile_id || profiles[0]?.id || ""}
                onChange={(e) => setForm((p) => ({ ...p, profile_id: e.target.value }))}
              >
                {profiles.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.business_name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                type="date"
                fullWidth
                size="small"
                label="거래일자"
                value={form.tx_date}
                onChange={(e) => setForm((p) => ({ ...p, tx_date: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                select
                fullWidth
                size="small"
                label="수입 / 지출"
                value={form.direction}
                onChange={(e) => setForm((p) => ({ ...p, direction: e.target.value }))}
              >
                <MenuItem value="EXPENSE">지출 (경비·매입)</MenuItem>
                <MenuItem value="INCOME">수입 (수당·매출)</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField
                select
                fullWidth
                size="small"
                label="증빙 유형"
                value={form.evidence_type}
                onChange={(e) => setForm((p) => ({ ...p, evidence_type: e.target.value }))}
              >
                <MenuItem value="CARD">신용·체크카드</MenuItem>
                <MenuItem value="TAX_INVOICE">전자세금계산서</MenuItem>
                <MenuItem value="CASH_RECEIPT">현금영수증</MenuItem>
                <MenuItem value="BANK_TRANSFER">계좌이체</MenuItem>
                <MenuItem value="FOREIGN_RECEIPT">해외 외화결제(영세/인보이스)</MenuItem>
                <MenuItem value="WITHHOLDING">3.3% 원천징수</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="가맹점 / 거래처명"
                value={form.merchant_name}
                onChange={(e) => setForm((p) => ({ ...p, merchant_name: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="원화 합계금액 (KRW)"
                value={form.amount}
                onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                size="small"
                label="계정과목"
                value={form.account_category}
                onChange={(e) => setForm((p) => ({ ...p, account_category: e.target.value }))}
              >
                {(form.direction === "INCOME" ? categories.income : categories.expense).map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                select
                fullWidth
                size="small"
                label="통화"
                value={form.currency}
                onChange={(e) => setForm((p) => ({ ...p, currency: e.target.value }))}
              >
                <MenuItem value="KRW">KRW</MenuItem>
                <MenuItem value="USD">USD</MenuItem>
                <MenuItem value="EUR">EUR</MenuItem>
                <MenuItem value="JPY">JPY</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="외화 금액"
                value={form.foreign_amount}
                onChange={(e) => setForm((p) => ({ ...p, foreign_amount: e.target.value }))}
                disabled={form.currency === "KRW"}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="적요 / 메모"
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddOpen(false)}>취소</Button>
          <Button variant="contained" onClick={handleAddSubmit} disabled={busy}>
            저장
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
