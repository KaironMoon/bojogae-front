/* eslint-disable react/prop-types */
import { Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from "@mui/material";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import { Link } from "react-router-dom";
import { ContractForm } from "../crm/CrmForms";
import "../crm/crm-contracts.css";

// eslint-disable-next-line react-refresh/only-export-components
export const applicationButtonStyle = {
  background: "linear-gradient(120deg, #6B38FB, #8B5CF6 55%, #03C75A)", color: "#fff",
  borderRadius: "12px", fontWeight: 800, px: 1.5, boxShadow: "0 3px 12px #6b38fb26",
  "&:hover": { background: "linear-gradient(120deg, #5B21B6, #7C3AED 55%, #00A84B)" },
};

export default function ProposalApplicationDialog({ open, loading, error, draft, drafts, onSelect, onClose, onRetry, onSave, saved }) {
  if (!open) return null;
  if (draft && !saved) return <ContractForm initialDraft={draft} applicationDraft onClose={onClose} onSave={onSave} />;
  return <Dialog open onClose={loading ? undefined : onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 4, overflow: "hidden" } }}>
    <DialogTitle sx={{ bgcolor: "#121314", color: "#fff", display: "flex", gap: 1, alignItems: "center", fontWeight: 900 }}><AutoAwesomeRoundedIcon sx={{ color: "#c4b5fd" }} />AI 청약 · 내 계약 등록</DialogTitle>
    <DialogContent sx={{ bgcolor: "#f8fafc", pt: "24px !important" }}>
      {loading && <Box sx={{ py: 4, textAlign: "center" }}><CircularProgress sx={{ color: "#6b38fb" }} /><Typography fontWeight={800} mt={2}>제안서에서 계약 정보를 정리하고 있어요</Typography><Typography variant="body2" color="text.secondary" mt={1}>자동 입력된 내용을 확인한 뒤 등록해 주세요.</Typography></Box>}
      {drafts?.length > 1 && !saved && !loading && !error && <Box><Typography fontWeight={800}>등록할 보험 상품을 선택해 주세요</Typography><Typography variant="body2" color="text.secondary" mb={2}>상품별로 내용을 확인하고 등록합니다.</Typography>{drafts.map((item, index) => <Button key={index} fullWidth variant="outlined" sx={{ mb: 1, p: 2, textAlign: "left", justifyContent: "space-between", borderColor: "#e6eaee", borderRadius: 3 }} onClick={() => onSelect(item)}>{item.insurer || "보험사 확인 필요"} · {item.product || "상품명 확인 필요"}<span>내용 확인 →</span></Button>)}</Box>}
      {error && <Alert severity="error">{error}</Alert>}
      {saved && <Alert severity="success">내 계약에 등록했습니다. 계약 정보를 확인할 수 있습니다.</Alert>}
    </DialogContent>
    <DialogActions sx={{ p: 2, borderTop: "1px solid #e6eaee" }}><Button onClick={onClose} disabled={loading}>닫기</Button>{error && <Button sx={applicationButtonStyle} onClick={onRetry}>다시 시도</Button>}{saved && <Button component={Link} to={`/crm/contracts/${saved.id}`} sx={applicationButtonStyle}>등록한 계약 보기</Button>}</DialogActions>
  </Dialog>;
}
