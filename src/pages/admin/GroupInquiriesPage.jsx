import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Pagination,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import BusinessRoundedIcon from "@mui/icons-material/BusinessRounded";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import { useEffect, useState } from "react";

import {
  groupInquiryError,
  listGroupInquiries,
  updateGroupInquiry,
} from "@/services/group-inquiry-service";


const statusInfo = {
  PENDING: { label: "접수", color: "warning" },
  CONTACTED: { label: "연락 완료", color: "info" },
  CLOSED: { label: "종료", color: "default" },
};

export default function GroupInquiriesPage() {
  const [data, setData] = useState({ items: [], page: 1, total_pages: 0, total: 0 });
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [editStatus, setEditStatus] = useState("PENDING");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true); setError("");
    try {
      setData(await listGroupInquiries(page, status));
    } catch (requestError) {
      setError(groupInquiryError(requestError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [page, status]); // eslint-disable-line react-hooks/exhaustive-deps

  const openItem = (item) => {
    setSelected(item);
    setEditStatus(item.status);
    setNote(item.admin_note || "");
  };
  const save = async () => {
    setSaving(true); setError("");
    try {
      await updateGroupInquiry(selected.id, editStatus, note);
      setSelected(null);
      await load();
    } catch (requestError) {
      setError(groupInquiryError(requestError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", p: { xs: 2, md: 4 } }}>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }} spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={850} letterSpacing="-0.04em">단체 문의 관리</Typography>
          <Typography color="text.secondary" sx={{ mt: .7 }}>랜딩페이지에서 접수된 단체 도입 문의를 확인합니다.</Typography>
        </Box>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>처리 상태</InputLabel>
          <Select value={status} label="처리 상태" onChange={(event) => { setStatus(event.target.value); setPage(1); }}>
            <MenuItem value="">전체</MenuItem>
            <MenuItem value="PENDING">접수</MenuItem>
            <MenuItem value="CONTACTED">연락 완료</MenuItem>
            <MenuItem value="CLOSED">종료</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: "hidden" }}>
        {loading ? (
          <Box sx={{ minHeight: 300, display: "grid", placeItems: "center" }}><CircularProgress size={30} /></Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead><TableRow sx={{ bgcolor: "#f8fafc" }}><TableCell>단체 / 담당자</TableCell><TableCell>연락처</TableCell><TableCell>접수일</TableCell><TableCell>상태</TableCell><TableCell align="right">관리</TableCell></TableRow></TableHead>
              <TableBody>
                {data.items.map(item => (
                  <TableRow key={item.id} hover>
                    <TableCell><Stack direction="row" spacing={1.2} alignItems="center"><Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: "primary.light", color: "primary.main", display: "grid", placeItems: "center" }}><BusinessRoundedIcon fontSize="small" /></Box><Box><Typography fontWeight={750}>{item.organization_name}</Typography><Typography variant="caption" color="text.secondary">{item.contact_name}</Typography></Box></Stack></TableCell>
                    <TableCell><Typography variant="body2">{item.phone}</Typography><Typography variant="caption" color="text.secondary">{item.email}</Typography></TableCell>
                    <TableCell><Typography variant="body2">{new Date(item.created_at).toLocaleString("ko-KR")}</Typography></TableCell>
                    <TableCell><Chip size="small" label={statusInfo[item.status].label} color={statusInfo[item.status].color} variant={item.status === "CLOSED" ? "outlined" : "filled"} /></TableCell>
                    <TableCell align="right"><Button size="small" onClick={() => openItem(item)}>확인</Button></TableCell>
                  </TableRow>
                ))}
                {!data.items.length && <TableRow><TableCell colSpan={5} align="center" sx={{ py: 8, color: "text.secondary" }}>접수된 단체 문의가 없습니다.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
      {data.total_pages > 1 && <Stack alignItems="center" sx={{ mt: 3 }}><Pagination count={data.total_pages} page={page} onChange={(_, value) => setPage(value)} color="primary" /></Stack>}

      <Dialog open={Boolean(selected)} onClose={() => !saving && setSelected(null)} fullWidth maxWidth="sm">
        <DialogTitle fontWeight={850}>단체 문의 상세</DialogTitle>
        <DialogContent>
          {selected && <Stack spacing={2.2} sx={{ pt: 1 }}>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5 }}><Typography fontWeight={800}>{selected.organization_name}</Typography><Typography color="text.secondary" variant="body2" sx={{ mt: .5 }}>{selected.contact_name}</Typography><Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 2 }}><Stack direction="row" spacing={.7} alignItems="center"><PhoneOutlinedIcon fontSize="small" color="action" /><Typography variant="body2">{selected.phone}</Typography></Stack><Stack direction="row" spacing={.7} alignItems="center"><EmailOutlinedIcon fontSize="small" color="action" /><Typography variant="body2">{selected.email}</Typography></Stack></Stack></Paper>
            <FormControl fullWidth><InputLabel>처리 상태</InputLabel><Select value={editStatus} label="처리 상태" onChange={event => setEditStatus(event.target.value)}><MenuItem value="PENDING">접수</MenuItem><MenuItem value="CONTACTED">연락 완료</MenuItem><MenuItem value="CLOSED">종료</MenuItem></Select></FormControl>
            <TextField label="관리자 메모" value={note} onChange={event => setNote(event.target.value)} multiline minRows={4} inputProps={{ maxLength: 2000 }} helperText={`${note.length}/2000`} />
          </Stack>}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}><Button onClick={() => setSelected(null)} disabled={saving}>취소</Button><Button variant="contained" onClick={save} disabled={saving}>{saving ? "저장 중..." : "저장"}</Button></DialogActions>
      </Dialog>
    </Box>
  );
}
