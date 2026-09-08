import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  MenuItem,
  Pagination,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddCardRoundedIcon from "@mui/icons-material/AddCardRounded";
import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import RedeemRoundedIcon from "@mui/icons-material/RedeemRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { getUsers, grantFreePoints, getPointGrants } from "@/services/auth-service";
import PointGrantsTable from './PointGrantsTable';


const USER_STATUSES = [
  { value: "", label: "전체 사용자" },
  { value: "ACTIVE", label: "활성" },
  { value: "PENDING", label: "승인 대기" },
  { value: "SUSPENDED", label: "정지" },
  { value: "REJECTED", label: "거절" },
];

function defaultExpirationDate() {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit' }).formatToParts(new Date());
  const year = Number(parts.find(p => p.type === 'year').value);
  const month = Number(parts.find(p => p.type === 'month').value);
  const day = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return `${year}-${String(month).padStart(2, '0')}-${day}`;
}

function idempotencyKey() {
  if (typeof globalThis.crypto?.randomUUID === "function") return globalThis.crypto.randomUUID();
  return `point-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function SummaryCard({ title, value, icon: Icon, color, background }) { // eslint-disable-line react/prop-types
  return (
    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, flex: 1, minWidth: 180 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="body2" color="text.secondary">{title}</Typography>
          <Typography variant="h5" fontWeight={850}>{value.toLocaleString()}P</Typography>
        </Box>
        <Box sx={{ width: 44, height: 44, borderRadius: 2.5, display: "grid", placeItems: "center", color, bgcolor: background }}>
          <Icon />
        </Box>
      </Stack>
    </Paper>
  );
}

function PointsPage() {
  const [detailUser, setDetailUser] = useState(null);
  const [details, setDetails] = useState(null);
  const [detailError, setDetailError] = useState("");
  const [grantFilter, setGrantFilter] = useState('ACTIVE');
  const detailRequest = useRef(0);
  const showDetails = async (user, page = 1, filter = 'ACTIVE') => {
    const request = ++detailRequest.current;
    setGrantFilter(filter);
    setDetailUser(user);
    setDetails(null);
    setDetailError("");
    try {
      const response = await getPointGrants(user.id, page, filter);
      if (request === detailRequest.current) setDetails(response);
    }
    catch { if (request === detailRequest.current) setDetailError("상세 내역을 불러오지 못했습니다."); }
  };
  const [result, setResult] = useState({ items: [], page: 1, total_pages: 0, total: 0 });
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [grantTarget, setGrantTarget] = useState(null);
  const [grantDraft, setGrantDraft] = useState({ amount: "", expirationDate: defaultExpirationDate(), reason: "" });

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    setError("");
    try {
      setResult(await getUsers(status || undefined, page, 20));
    } catch {
      setError("포인트 정보를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => { load(1); }, [load]);

  const visibleUsers = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase("ko-KR");
    if (!keyword) return result.items;
    return result.items.filter((user) => (
      user.display_name.toLocaleLowerCase("ko-KR").includes(keyword)
      || (user.email || "").toLocaleLowerCase("ko-KR").includes(keyword)
      || String(user.id) === keyword
    ));
  }, [result.items, search]);

  const totals = useMemo(() => result.items.reduce(
    (sum, user) => ({
      free: sum.free + user.free_points,
      paid: sum.paid + user.paid_points,
      total: sum.total + user.total_points,
    }),
    { free: 0, paid: 0, total: 0 },
  ), [result.items]);

  const openGrant = (user) => {
    setGrantTarget(user);
    setGrantDraft({ amount: "", expirationDate: defaultExpirationDate(), reason: "" });
    setError("");
    setMessage("");
  };

  const submitGrant = async () => {
    const amount = Number(grantDraft.amount);
    if (!grantTarget || !Number.isInteger(amount) || amount < 1 || !grantDraft.reason.trim() || !grantDraft.expirationDate) {
      setError("지급 포인트, 만료일, 지급 사유를 확인해 주세요.");
      return;
    }
    setWorking(true);
    setError("");
    try {
      await grantFreePoints(grantTarget.id, {
        ...grantDraft,
        amount,
        reason: grantDraft.reason.trim(),
        idempotencyKey: idempotencyKey(),
      });
      const targetName = grantTarget.display_name;
      setGrantTarget(null);
      setMessage(`${targetName} 사용자에게 ${amount.toLocaleString()}P를 지급했습니다.`);
      await load(result.page);
    } catch {
      setError("무료 포인트를 지급하지 못했습니다.");
    } finally {
      setWorking(false);
    }
  };

  return (
    <Box component="main" sx={{ p: { xs: 2, md: 4 }, maxWidth: 1280, mx: "auto" }}>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" fontWeight={850}>포인트 관리</Typography>
          <Typography color="text.secondary">사용자별 무료·유료 포인트 잔액을 확인하고 무료 포인트를 지급합니다.</Typography>
        </Box>
        <Button startIcon={<RefreshRoundedIcon />} onClick={() => load(result.page)}>새로고침</Button>
      </Stack>

      {error && <Alert severity="error" onClose={() => setError("")} sx={{ mb: 2 }}>{error}</Alert>}
      {message && <Alert severity="success" onClose={() => setMessage("")} sx={{ mb: 2 }}>{message}</Alert>}

      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 3 }}>
        <SummaryCard title="현재 페이지 무료 포인트" value={totals.free} icon={RedeemRoundedIcon} color="#059669" background="#ecfdf5" />
        <SummaryCard title="현재 페이지 유료 포인트" value={totals.paid} icon={PaymentsRoundedIcon} color="#2563eb" background="#eff6ff" />
        <SummaryCard title="현재 페이지 전체 포인트" value={totals.total} icon={AccountBalanceWalletRoundedIcon} color="#7c3aed" background="#f5f3ff" />
      </Stack>

      <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, mb: 2 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField
            label="이름·이메일·사용자 ID 검색"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            fullWidth
          />
          <TextField select label="계정 상태" value={status} onChange={(event) => setStatus(event.target.value)} sx={{ minWidth: 180 }}>
            {USER_STATUSES.map((item) => <MenuItem key={item.value || "all"} value={item.value}>{item.label}</MenuItem>)}
          </TextField>
        </Stack>
      </Paper>

      {loading ? (
        <Box sx={{ py: 10, display: "grid", placeItems: "center" }}><CircularProgress /></Box>
      ) : (
        <Stack spacing={1.5}>
          {visibleUsers.map((user) => (
            <Paper key={user.id} variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
              <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ md: "center" }} gap={2}>
                <Box>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                    <Typography variant="h6" fontWeight={800}>{user.display_name}</Typography>
                    <Chip label={user.status} size="small" color={user.status === "ACTIVE" ? "success" : "default"} />
                    <Typography variant="caption" color="text.secondary">ID {user.id}</Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">{user.email || "이메일 없음"}</Typography>
                </Box>
                <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "center" }} gap={1.25}>
                  <Chip label={`무료 ${user.free_points.toLocaleString()}P`} color="success" variant="outlined" />
                  <Chip label={`유료 ${user.paid_points.toLocaleString()}P`} color="primary" variant="outlined" />
                  <Typography sx={{ minWidth: 100, textAlign: { sm: "right" }, fontWeight: 850 }}>
                    총 {user.total_points.toLocaleString()}P
                  </Typography>
                  <Button variant="contained" startIcon={<AddCardRoundedIcon />} onClick={() => openGrant(user)}>
                    무료 포인트 지급
                  </Button>
                  <Button onClick={() => showDetails(user)}>포인트 상세</Button>
                </Stack>
              </Stack>
            </Paper>
          ))}
          {!visibleUsers.length && <Alert severity="info">조건에 맞는 사용자가 없습니다.</Alert>}
        </Stack>
      )}

      {result.total_pages > 1 && (
        <Pagination count={result.total_pages} page={result.page} onChange={(_, page) => load(page)} sx={{ mt: 3 }} />
      )}

      <Dialog open={Boolean(grantTarget)} onClose={() => !working && setGrantTarget(null)} fullWidth maxWidth="xs">
 
        <DialogTitle>무료 포인트 지급</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            {grantTarget?.display_name} 사용자에게 지급할 포인트를 입력하세요.
          </DialogContentText>
          <Stack spacing={2}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              autoFocus
              required
              label="지급 포인트"
              type="number"
              value={grantDraft.amount}
              inputProps={{ min: 1 }}
              onChange={(event) => setGrantDraft((current) => ({ ...current, amount: event.target.value }))}
            />
            <TextField
              required
              type="date"
              label="만료일"
              value={grantDraft.expirationDate}
              InputLabelProps={{ shrink: true }}
              helperText="선택한 날짜까지 사용 가능합니다. 한국 시간 기준 다음 날 00시에 만료됩니다."
              onChange={(event) => setGrantDraft((current) => ({ ...current, expirationDate: event.target.value }))}
            />
            <TextField
              required
              label="지급 사유"
              multiline
              minRows={2}
              value={grantDraft.reason}
              inputProps={{ maxLength: 500 }}
              onChange={(event) => setGrantDraft((current) => ({ ...current, reason: event.target.value }))}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button disabled={working} onClick={() => setGrantTarget(null)}>취소</Button>
          <Button disabled={working} variant="contained" onClick={submitGrant}>
            {working ? "지급 중..." : "지급"}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={Boolean(detailUser)} onClose={() => setDetailUser(null)} fullWidth maxWidth="lg">
        <DialogTitle>{detailUser?.display_name} · 포인트 구성</DialogTitle>
        <DialogContent>
          <TextField select size="small" label="조회 범위" sx={{ mt: 1, mb: 2, minWidth: 200 }} value={grantFilter} onChange={event => showDetails(detailUser, 1, event.target.value)}>
            {[['ACTIVE', '사용 가능·예약 중'], ['ALL', '전체 지급 건'], ['EXPIRED', '만료된 지급 건'], ['DEPLETED', '소진된 지급 건']].map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
          </TextField>
          {detailError ? <Alert severity="error">{detailError}</Alert> : !details ? <CircularProgress /> : (
            <Stack spacing={2}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 1 }}>
                {[['free_points', '무료 사용 가능'], ['paid_points', '유료 사용 가능'], ['reserved_points', '예약 중'], ['expiring_points', '7일 내 만료 예정']].map(([key, label]) => <Paper key={key} variant="outlined" sx={{ p: 2, borderRadius: 2 }}><Typography variant="body2" color="text.secondary">{label}</Typography><Typography variant="h6" fontWeight={800}>{details.summary[key].toLocaleString()}P</Typography></Paper>)}
              </Box>
              <Typography variant="caption" color="text.secondary">사용자 전체 잔액 기준 · 예약 중 포인트는 사용 가능 잔액에서 제외됩니다. 무료는 만료 임박 순, 유료는 마지막에 표시됩니다.</Typography>
              <PointGrantsTable items={details.items} />
              {!details.items.length && <Alert severity="info">지급 내역이 없습니다.</Alert>}
              {details.total_pages > 1 && <Pagination page={details.page} count={details.total_pages} onChange={(_, page) => showDetails(detailUser, page, grantFilter)} />}
            </Stack>
          )}
        </DialogContent>
        <DialogActions><Button onClick={() => setDetailUser(null)}>닫기</Button></DialogActions>
      </Dialog>
    </Box>
  );
}

export default PointsPage;
