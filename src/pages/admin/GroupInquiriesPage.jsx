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
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import BusinessRoundedIcon from "@mui/icons-material/BusinessRounded";
import ContactPhoneOutlinedIcon from "@mui/icons-material/ContactPhoneOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import { useCallback, useEffect, useState } from "react";

import {
  groupInquiryError,
  listGroupInquiries,
  updateGroupInquiry,
} from "@/services/group-inquiry-service";
import {
  AdminEmptyState,
  AdminPageContainer,
  AdminPageHeader,
  AdminTableCard,
} from "./components/AdminPageShell";

const statusInfo = {
  PENDING: { label: "접수", color: "warning" },
  CONTACTED: { label: "연락 완료", color: "info" },
  CLOSED: { label: "종료", color: "default" },
};

export default function GroupInquiriesPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [data, setData] = useState({ items: [], page: 1, total_pages: 0, total: 0 });
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [editStatus, setEditStatus] = useState("PENDING");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await listGroupInquiries(page, status));
    } catch (requestError) {
      setError(groupInquiryError(requestError));
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => { load(); }, [load]);

  const openItem = (item) => {
    setSelected(item);
    setEditStatus(item.status);
    setNote(item.admin_note || "");
  };

  const save = async () => {
    setSaving(true);
    setError("");
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
    <AdminPageContainer maxWidth={1240}>
      <AdminPageHeader
        icon={ContactPhoneOutlinedIcon}
        badge={data.total ? `총 ${data.total}건` : undefined}
        title="단체 문의 관리"
        description="랜딩페이지에서 접수된 단체 도입 문의를 확인하고 연락·처리 상태를 관리합니다."
        actions={(
          <Button size="small" variant="outlined" startIcon={<RefreshRoundedIcon />} onClick={load} disabled={loading}>
            새로고침
          </Button>
        )}
      />

      <Paper variant="outlined" sx={{ borderRadius: 3, mb: 2.5, px: 1.5, bgcolor: "#FFFFFF" }}>
        <Tabs
          value={status}
          onChange={(_e, next) => { setStatus(next); setPage(1); }}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ "& .MuiTab-root": { minHeight: 46, fontWeight: 750 } }}
        >
          <Tab value="" label="전체" />
          <Tab value="PENDING" label="접수" />
          <Tab value="CONTACTED" label="연락 완료" />
          <Tab value="CLOSED" label="종료" />
        </Tabs>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2.5 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ minHeight: 280, display: "grid", placeItems: "center" }}>
          <CircularProgress size={30} />
        </Box>
      ) : !data.items.length ? (
        <AdminEmptyState
          icon={ContactPhoneOutlinedIcon}
          title="접수된 단체 문의가 없습니다."
          description="처리 상태 탭을 변경해 다른 문의 내역을 확인할 수 있습니다."
        />
      ) : (
        <>
          <Stack spacing={1.25} sx={{ display: { xs: "flex", md: "none" } }}>
            {data.items.map((item) => (
              <Paper key={item.id} variant="outlined" sx={{ p: 1.75, borderRadius: 3 }}>
                <Stack spacing={1}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
                    <Stack direction="row" spacing={1.2} alignItems="center" sx={{ minWidth: 0 }}>
                      <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: "#ECFDF5", color: "#03C75A", display: "grid", placeItems: "center", flexShrink: 0 }}>
                        <BusinessRoundedIcon fontSize="small" />
                      </Box>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography fontWeight={850} sx={{ overflowWrap: "anywhere" }}>{item.organization_name}</Typography>
                        <Typography variant="caption" color="text.secondary">{item.contact_name}</Typography>
                      </Box>
                    </Stack>
                    <Chip size="small" label={statusInfo[item.status].label} color={statusInfo[item.status].color} variant={item.status === "CLOSED" ? "outlined" : "filled"} />
                  </Stack>
                  <Typography variant="body2" color="text.secondary">{item.phone} · {item.email}</Typography>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ pt: 0.75, borderTop: "1px solid #F1F5F9" }}>
                    <Typography variant="caption" color="text.secondary">{new Date(item.created_at).toLocaleString("ko-KR")}</Typography>
                    <Button size="small" variant="contained" onClick={() => openItem(item)}>확인</Button>
                  </Stack>
                </Stack>
              </Paper>
            ))}
          </Stack>

          <AdminTableCard sx={{ display: { xs: "none", md: "block" } }}>
            <Table aria-label="단체 문의 목록">
              <TableHead>
                <TableRow>
                  <TableCell>단체 / 담당자</TableCell>
                  <TableCell>연락처</TableCell>
                  <TableCell>접수일</TableCell>
                  <TableCell>상태</TableCell>
                  <TableCell align="right">관리</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.items.map((item) => (
                  <TableRow key={item.id} hover onClick={() => openItem(item)} sx={{ cursor: "pointer" }}>
                    <TableCell>
                      <Stack direction="row" spacing={1.2} alignItems="center">
                        <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: "#ECFDF5", color: "#03C75A", display: "grid", placeItems: "center", flexShrink: 0 }}>
                          <BusinessRoundedIcon fontSize="small" />
                        </Box>
                        <Box>
                          <Typography fontWeight={800}>{item.organization_name}</Typography>
                          <Typography variant="caption" color="text.secondary">{item.contact_name}</Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{item.phone}</Typography>
                      <Typography variant="caption" color="text.secondary">{item.email}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{new Date(item.created_at).toLocaleString("ko-KR")}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip size="small" label={statusInfo[item.status].label} color={statusInfo[item.status].color} variant={item.status === "CLOSED" ? "outlined" : "filled"} />
                    </TableCell>
                    <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                      <Button size="small" variant="outlined" onClick={() => openItem(item)}>확인</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </AdminTableCard>
        </>
      )}

      {data.total_pages > 1 && (
        <Stack alignItems="center" sx={{ mt: 2.5 }}>
          <Pagination count={data.total_pages} page={page} onChange={(_, value) => setPage(value)} color="primary" />
        </Stack>
      )}

      <Dialog open={Boolean(selected)} onClose={() => !saving && setSelected(null)} fullWidth maxWidth="sm" fullScreen={isMobile}>
        <DialogTitle fontWeight={850}>단체 문의 상세</DialogTitle>
        <DialogContent dividers>
          {selected && (
            <Stack spacing={2}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5, bgcolor: "#F8FAFC" }}>
                <Typography variant="subtitle1" fontWeight={850}>{selected.organization_name}</Typography>
                <Typography color="text.secondary" variant="body2" sx={{ mt: 0.25 }}>담당자: {selected.contact_name}</Typography>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 1.5 }} flexWrap="wrap" useFlexGap>
                  <Button size="small" variant="outlined" component="a" href={`tel:${selected.phone}`} startIcon={<PhoneOutlinedIcon fontSize="small" />}>
                    {selected.phone}
                  </Button>
                  <Button size="small" variant="outlined" component="a" href={`mailto:${selected.email}`} startIcon={<EmailOutlinedIcon fontSize="small" />}>
                    {selected.email}
                  </Button>
                </Stack>
              </Paper>

              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1 }}>
                <Typography variant="body2"><strong>도입 예정 인원:</strong> {selected.headcount || "미입력"}</Typography>
                <Typography variant="body2"><strong>접수일:</strong> {new Date(selected.created_at).toLocaleString("ko-KR")}</Typography>
              </Box>

              <Paper variant="outlined" sx={{ p: 1.75, borderRadius: 2 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={750} sx={{ display: "block", mb: 0.5 }}>문의사항</Typography>
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", lineHeight: 1.65 }}>
                  {selected.message || "미입력"}
                </Typography>
              </Paper>

              <FormControl size="small" fullWidth>
                <InputLabel>처리 상태</InputLabel>
                <Select value={editStatus} label="처리 상태" onChange={(event) => setEditStatus(event.target.value)}>
                  <MenuItem value="PENDING">접수</MenuItem>
                  <MenuItem value="CONTACTED">연락 완료</MenuItem>
                  <MenuItem value="CLOSED">종료</MenuItem>
                </Select>
              </FormControl>
              <TextField
                size="small"
                label="관리자 메모"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                multiline
                minRows={4}
                inputProps={{ maxLength: 2000 }}
                helperText={`${note.length}/2000`}
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setSelected(null)} disabled={saving}>취소</Button>
          <Button variant="contained" onClick={save} disabled={saving}>{saving ? "저장 중..." : "저장"}</Button>
        </DialogActions>
      </Dialog>
    </AdminPageContainer>
  );
}
