/* eslint-disable react/prop-types */
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
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
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  groupApplicationStatuses,
  groupSignupError,
  listGroupApplications,
  openGroupApplication,
  reviewGroupApplication,
} from "@/services/group-signup-service";
import { AdminTableCard } from "@/pages/admin/components/AdminPageShell";

export default function GroupApplicationsPanel({ onOpened }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    const timer = setTimeout(() => listGroupApplications(query, status)
      .then((data) => {
        if (active) { setRows(data); setError(""); }
      })
      .catch((failure) => { if (active) setError(groupSignupError(failure)); })
      .finally(() => { if (active) setLoading(false); }), 250);
    return () => { active = false; clearTimeout(timer); };
  }, [query, status, revision]);

  const select = (row) => {
    setSelected(row);
    setError("");
    setForm({
      status: row.status,
      note: row.admin_note || "",
      employee_number: "",
      monthly_basic_points: "",
      max_members: "",
      payment_reference: "",
    });
  };

  const run = async (operation) => {
    setBusy(true);
    setError("");
    try {
      await operation();
      setSelected(null);
      setRevision((value) => value + 1);
    } catch (failure) {
      setError(groupSignupError(failure));
    } finally {
      setBusy(false);
    }
  };

  const field = (key, label, props = {}) => (
    <TextField
      size="small"
      label={label}
      value={form[key] ?? ""}
      onChange={(event) => setForm({ ...form, [key]: event.target.value })}
      disabled={busy}
      fullWidth
      {...props}
    />
  );

  const open = (event) => {
    event.preventDefault();
    run(async () => {
      await openGroupApplication(selected.id, {
        employee_number: form.employee_number,
        monthly_basic_points: Number(form.monthly_basic_points),
        max_members: form.max_members ? Number(form.max_members) : null,
        payment_reference: form.payment_reference,
        note: form.note,
      });
      onOpened();
    });
  };

  return (
    <Paper variant="outlined" sx={{ p: { xs: 1.75, sm: 2.5 }, borderRadius: 3, bgcolor: "#FFFFFF" }}>
      <Stack spacing={2}>
        <Box>
          <Typography variant="h6" fontWeight={850}>조직 관리자 가입 신청</Typography>
          <Typography variant="body2" color="text.secondary">
            이메일 인증을 완료한 신청입니다. 담당자 연락과 요금 협의 후 결제를 확인해 개통하세요.
          </Typography>
        </Box>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
          <TextField
            size="small"
            fullWidth
            label="조직명 / 담당자 검색"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment> }}
          />
          <TextField
            select
            size="small"
            label="진행 상태"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            sx={{ minWidth: { xs: "100%", sm: 180 } }}
          >
            <MenuItem value="">전체</MenuItem>
            {Object.entries(groupApplicationStatuses)
              .filter(([key]) => key !== "UNVERIFIED")
              .map(([key, label]) => (
                <MenuItem key={key} value={key}>{label}</MenuItem>
              ))}
          </TextField>
        </Stack>

        {error && !selected && <Alert severity="error">{error}</Alert>}

        <AdminTableCard>
          <Table size="small">
            <TableHead>
              <TableRow>
                {["조직 / GA", "담당자 / 연락처", "상태", "관리"].map((label) => (
                  <TableCell key={label}>{label}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={750}>{row.group_name}</Typography>
                    <Typography variant="caption" display="block" color="text.secondary">
                      {row.affiliation}{row.branch_name ? ` · ${row.branch_name}` : ""}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{row.contact_name}</Typography>
                    <Typography variant="caption" display="block" color="text.secondary">{row.contact_phone}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={groupApplicationStatuses[row.status]}
                      color={row.status === "ACTIVE" ? "success" : row.status === "PAYMENT_PENDING" ? "warning" : "default"}
                    />
                  </TableCell>
                  <TableCell>
                    <Button size="small" variant="outlined" onClick={() => select(row)}>상세 / 처리</Button>
                  </TableCell>
                </TableRow>
              ))}
              {!rows.length && (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 4, color: "text.secondary" }}>
                    {loading ? "불러오는 중…" : "해당 신청이 없습니다."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </AdminTableCard>

        {rows.length === 200 && (
          <Typography variant="caption" color="text.secondary">
            최신 200건입니다. 검색 또는 상태 필터로 범위를 좁혀 주세요.
          </Typography>
        )}
      </Stack>

      <Dialog open={Boolean(selected)} onClose={() => { if (!busy) setSelected(null); }} fullWidth maxWidth="sm" fullScreen={isMobile}>
        <DialogTitle fontWeight={850}>조직 가입 신청 관리</DialogTitle>
        <DialogContent dividers>
          <Stack component="form" id="group-application-open" spacing={2} onSubmit={open}>
            {error && <Alert severity="error">{error}</Alert>}
            <Paper variant="outlined" sx={{ p: 1.75, borderRadius: 2.5, bgcolor: "#F8FAFC" }}>
              <Typography fontWeight={800}>{selected?.group_name}</Typography>
              <Typography variant="body2" color="text.secondary">{selected?.affiliation} {selected?.branch_name || ""}</Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>{selected?.contact_name} · {selected?.contact_phone}</Typography>
              <Typography variant="body2" color="text.secondary">{selected?.contact_email}</Typography>
              <Typography variant="caption" color="text.secondary">접수일: {selected && new Date(selected.created_at).toLocaleString("ko-KR")}</Typography>
            </Paper>
            {selected?.status === "ACTIVE" ? (
              <>
                <Alert severity="success">개통 완료</Alert>
                <Typography sx={{ whiteSpace: "pre-wrap" }}>{selected.admin_note || "메모 없음"}</Typography>
                <Button variant="outlined" component={Link} to={`/admin/groups/${selected.group_id}`}>개통된 조직 관리</Button>
              </>
            ) : (
              <>
                {field("status", "진행 상태", {
                  select: true,
                  children: ["REVIEW", "CONTACTING", "PAYMENT_PENDING"].map((key) => (
                    <MenuItem key={key} value={key}>{groupApplicationStatuses[key]}</MenuItem>
                  )),
                })}
                {field("note", "연락·요금 협의 메모", { multiline: true, minRows: 3, inputProps: { maxLength: 3000 } })}
                <Button variant="outlined" disabled={busy} onClick={() => run(() => reviewGroupApplication(selected.id, { status: form.status, note: form.note }))}>
                  진행 상태와 메모 저장
                </Button>
                <Typography fontWeight={800} sx={{ pt: 1 }}>결제 확인 후 개통</Typography>
                {field("employee_number", "조직 관리자 사번", { required: true, inputProps: { maxLength: 50 }, helperText: "개통 후 담당자에게 사번을 안내해 주세요. 초기 비밀번호는 사번과 같습니다." })}
                {field("monthly_basic_points", "1인당 월 기본 꼬막", { required: true, type: "number", inputProps: { min: 1, max: 10000000, step: 1 } })}
                {field("max_members", "인원 제한 (조직 관리자 포함, 선택)", { type: "number", inputProps: { min: 1, max: 10000, step: 1 } })}
                {field("payment_reference", "결제 확인 번호", { required: true, inputProps: { maxLength: 100 } })}
                <Alert severity="info">실제 결제를 확인한 뒤 개통하세요. 조직과 조직 관리자 계정이 생성되고 이용 권한이 부여됩니다.</Alert>
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button disabled={busy} onClick={() => setSelected(null)}>닫기</Button>
          {selected?.status !== "ACTIVE" && (
            <Button form="group-application-open" type="submit" variant="contained" disabled={busy}>결제 확인·개통</Button>
          )}
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
