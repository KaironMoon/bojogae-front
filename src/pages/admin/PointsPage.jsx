import KkomakIcon from "@/pages/components/KkomakIcon";
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
  InputAdornment,
  MenuItem,
  Pagination,
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
import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import AddCardRoundedIcon from "@mui/icons-material/AddCardRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import RedeemRoundedIcon from "@mui/icons-material/RedeemRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { getUsers, getPointGrants } from "@/services/auth-service";
import { planName } from "@/constants/plans";
import ManualSubscriptionDialog from "./ManualSubscriptionDialog";
import PointGrantsTable from "./PointGrantsTable";
import GrantFreePointsDialog, { createPointRequestKey } from "./GrantFreePointsDialog";
import {
  AdminEmptyState,
  AdminFilterBar,
  AdminPageContainer,
  AdminPageHeader,
  AdminStatCard,
  AdminStatGrid,
  AdminTableCard,
} from "./components/AdminPageShell";

const USER_STATUSES = [
  { value: "", label: "전체 사용자" },
  { value: "ACTIVE", label: "활성" },
  { value: "PENDING", label: "승인 대기" },
  { value: "SUSPENDED", label: "정지" },
  { value: "REJECTED", label: "거절" },
];

const STATUS_META = {
  ACTIVE: { label: "활성", color: "success" },
  PENDING: { label: "승인 대기", color: "warning" },
  SUSPENDED: { label: "정지", color: "error" },
  REJECTED: { label: "거절", color: "default" },
};

function PointsPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [detailUser, setDetailUser] = useState(null);
  const [details, setDetails] = useState(null);
  const [detailError, setDetailError] = useState("");
  const [grantFilter, setGrantFilter] = useState("ACTIVE");
  const detailRequest = useRef(0);

  const showDetails = async (user, page = 1, filter = "ACTIVE") => {
    const request = ++detailRequest.current;
    setGrantFilter(filter);
    setDetailUser(user);
    setDetails(null);
    setDetailError("");
    try {
      const response = await getPointGrants(user.id, page, filter);
      if (request === detailRequest.current) setDetails(response);
    } catch {
      if (request === detailRequest.current) setDetailError("상세 내역을 불러오지 못했습니다.");
    }
  };

  const [result, setResult] = useState({ items: [], page: 1, total_pages: 0, total: 0 });
  const [status, setStatus] = useState("");
  const [draftQuery, setDraftQuery] = useState("");
  const [query, setQuery] = useState("");
  const listRequest = useRef(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [grantTarget, setGrantTarget] = useState(null);
  const [manualTarget, setManualTarget] = useState(null);

  const load = useCallback(async (page = 1) => {
    const request = ++listRequest.current;
    setLoading(true);
    setError("");
    try {
      const response = await getUsers(status || undefined, page, 20, query);
      if (request === listRequest.current) setResult(response);
    } catch {
      if (request === listRequest.current) setError("꼬막 정보를 불러오지 못했습니다.");
    } finally {
      if (request === listRequest.current) setLoading(false);
    }
  }, [status, query]);

  useEffect(() => { load(1); }, [load]);

  const search = (event) => {
    event.preventDefault();
    const nextQuery = draftQuery.trim();
    if (nextQuery === query) load(1);
    else setQuery(nextQuery);
  };

  const totals = useMemo(() => (result.items || []).reduce(
    (sum, user) => ({
      free: sum.free + user.free_points,
      paid: sum.paid + user.paid_points,
      total: sum.total + user.total_points,
    }),
    { free: 0, paid: 0, total: 0 },
  ), [result.items]);

  const openGrant = (user) => {
    setGrantTarget(user);
    setError("");
    setMessage("");
  };

  const renderUserActions = (user) => (
    <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
      <Button
        size="small"
        variant="contained"
        startIcon={<AddCardRoundedIcon />}
        onClick={() => openGrant(user)}
      >
        꼬막 지급·회수
      </Button>
      {(user.manual_subscription_id || (!user.group_id && user.role === "USER" && user.status === "ACTIVE")) && (
        <Button
          size="small"
          variant="outlined"
          onClick={() => {
            setMessage("");
            setManualTarget({ user, requestKey: createPointRequestKey() });
          }}
        >
          {user.manual_subscription_id ? "수동 구독 종료" : "수동 구독"}
        </Button>
      )}
      <Button size="small" variant="outlined" onClick={() => showDetails(user)}>
        꼬막 상세
      </Button>
    </Stack>
  );

  return (
    <AdminPageContainer maxWidth={1360}>
      <AdminPageHeader
        icon={AccountBalanceWalletRoundedIcon}
        badge={result.total ? `총 ${result.total.toLocaleString()}명` : undefined}
        title="꼬막 지급·회수·내역"
        description="사용자별 지급·구매 꼬막 잔액을 확인하고 꼬막을 지급하거나 회수합니다."
        actions={(
          <Button variant="outlined" size="small" startIcon={<RefreshRoundedIcon />} onClick={() => load(result.page)}>
            새로고침
          </Button>
        )}
      />

      {error && <Alert severity="error" onClose={() => setError("")} sx={{ mb: 2, borderRadius: 2.5 }}>{error}</Alert>}
      {message && <Alert severity="success" onClose={() => setMessage("")} sx={{ mb: 2, borderRadius: 2.5 }}>{message}</Alert>}

      <AdminStatGrid columns={{ xs: "1fr", sm: "repeat(3, 1fr)" }}>
        <AdminStatCard
          label="현재 페이지 지급 꼬막"
          value={<Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}><KkomakIcon size={18} /> {totals.free.toLocaleString()}꼬막</Box>}
          subtext={`표시 ${result.items?.length || 0}명 합계`}
          icon={RedeemRoundedIcon}
          color="#059669"
          bg="#ECFDF5"
        />
        <AdminStatCard
          label="현재 페이지 구매 꼬막"
          value={<Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}><KkomakIcon size={18} /> {totals.paid.toLocaleString()}꼬막</Box>}
          subtext="유료 구매·정액분"
          icon={PaymentsRoundedIcon}
          color="#2563EB"
          bg="#EFF6FF"
        />
        <AdminStatCard
          label="현재 페이지 전체 꼬막"
          value={<Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}><KkomakIcon size={18} /> {totals.total.toLocaleString()}꼬막</Box>}
          subtext="지급 + 구매 총합"
          icon={AccountBalanceWalletRoundedIcon}
          color="#7C3AED"
          bg="#F5F3FF"
        />
      </AdminStatGrid>

      <AdminFilterBar>
        <Stack component="form" onSubmit={search} direction={{ xs: "column", md: "row" }} spacing={1.25} alignItems={{ md: "center" }}>
          <TextField
            size="small"
            placeholder="고객 번호, 이메일, 이름, 닉네임, 전화번호, 사번, 단체명 검색"
            value={draftQuery}
            inputProps={{ maxLength: 100 }}
            onChange={(event) => setDraftQuery(event.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment> }}
            fullWidth
          />
          <TextField
            select
            size="small"
            label="계정 상태"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            sx={{ minWidth: { xs: "100%", md: 180 } }}
          >
            {USER_STATUSES.map((item) => (
              <MenuItem key={item.value || "all"} value={item.value}>{item.label}</MenuItem>
            ))}
          </TextField>
          <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
            <Button type="submit" variant="contained" size="small" sx={{ minHeight: 40, px: 2.5 }}>
              검색
            </Button>
            {(query || status) && (
              <Button
                size="small"
                variant="outlined"
                sx={{ minHeight: 40 }}
                onClick={() => {
                  setDraftQuery("");
                  setQuery("");
                  setStatus("");
                }}
              >
                초기화
              </Button>
            )}
          </Stack>
        </Stack>
      </AdminFilterBar>

      {loading ? (
        <Box sx={{ py: 10, display: "grid", placeItems: "center" }}>
          <CircularProgress />
        </Box>
      ) : !result.items?.length ? (
        <AdminEmptyState
          icon={AccountBalanceWalletRoundedIcon}
          title={query || status ? "검색 결과가 없습니다." : "등록된 사용자가 없습니다."}
          description="검색어나 상태 필터를 변경해 다시 조회해 주세요."
        />
      ) : (
        <>
          <Stack spacing={1.5} sx={{ display: { xs: "flex", md: "none" } }}>
            {result.items.map((user) => {
              const statusMeta = STATUS_META[user.status] || { label: user.status, color: "default" };
              return (
                <Paper key={user.id} variant="outlined" sx={{ p: 1.75, borderRadius: 3 }}>
                  <Stack spacing={1.25}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                      <Box sx={{ minWidth: 0 }}>
                        <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
                          <Chip label={`#${user.id}`} size="small" variant="outlined" sx={{ height: 22, fontSize: "0.72rem" }} />
                          <Typography variant="subtitle1" fontWeight={850}>{user.name || user.display_name}</Typography>
                          {user.role === "ADMIN" && <Chip label="ADMIN" size="small" color="primary" sx={{ height: 22, fontSize: "0.7rem" }} />}
                        </Stack>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.3, overflowWrap: "anywhere" }}>
                          {user.email || "이메일 없음"} · {user.phone || "-"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          소속 {user.group_name || user.affiliation || "-"}{user.employee_number ? ` · 사번 ${user.employee_number}` : ""}
                        </Typography>
                      </Box>
                      <Chip label={statusMeta.label} size="small" color={statusMeta.color} />
                    </Stack>
                    <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap alignItems="center">
                      <Chip label={`지급 ${user.free_points.toLocaleString()}꼬막`} size="small" color="success" variant="outlined" />
                      <Chip label={`구매 ${user.paid_points.toLocaleString()}꼬막`} size="small" color="primary" variant="outlined" />
                      <Typography variant="subtitle2" fontWeight={850} sx={{ ml: "auto" }}>
                        총 {user.total_points.toLocaleString()}꼬막
                      </Typography>
                    </Stack>
                    <Box sx={{ pt: 1, borderTop: "1px solid #F1F5F9" }}>
                      {renderUserActions(user)}
                    </Box>
                  </Stack>
                </Paper>
              );
            })}
          </Stack>

          <AdminTableCard sx={{ display: { xs: "none", md: "block" } }}>
            <Table size="small" aria-label="꼬막 보유 사용자 목록">
              <TableHead>
                <TableRow>
                  <TableCell>고객</TableCell>
                  <TableCell>연락처 · 소속</TableCell>
                  <TableCell>상태 · 구독</TableCell>
                  <TableCell align="right">지급 꼬막</TableCell>
                  <TableCell align="right">구매 꼬막</TableCell>
                  <TableCell align="right">총 보유</TableCell>
                  <TableCell align="right">관리</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {result.items.map((user) => {
                  const statusMeta = STATUS_META[user.status] || { label: user.status, color: "default" };
                  return (
                    <TableRow key={user.id} hover>
                      <TableCell sx={{ py: 1.5 }}>
                        <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
                          <Typography variant="body2" fontWeight={850}>{user.name || user.display_name}</Typography>
                          <Chip label={`#${user.id}`} size="small" variant="outlined" sx={{ height: 20, fontSize: "0.7rem" }} />
                          {user.role === "ADMIN" && <Chip label="ADMIN" size="small" color="primary" sx={{ height: 20, fontSize: "0.7rem" }} />}
                        </Stack>
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                          닉네임 {user.nickname || user.display_name || "-"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ overflowWrap: "anywhere" }}>{user.email || "이메일 없음"}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                          {user.phone || "-"} · {user.group_name || user.affiliation || "-"}
                          {user.employee_number ? ` · 사번 ${user.employee_number}` : ""}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                          <Chip label={statusMeta.label} size="small" color={statusMeta.color} />
                          {user.manual_subscription_id && (
                            <Chip label={`${planName(user.plan_code)} 수동 구독`} size="small" color="primary" variant="outlined" />
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums", color: "#059669", fontWeight: 700, whiteSpace: "nowrap" }}>
                        {user.free_points.toLocaleString()}
                      </TableCell>
                      <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums", color: "#2563EB", fontWeight: 700, whiteSpace: "nowrap" }}>
                        {user.paid_points.toLocaleString()}
                      </TableCell>
                      <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums", fontWeight: 850, whiteSpace: "nowrap" }}>
                        {user.total_points.toLocaleString()}꼬막
                      </TableCell>
                      <TableCell align="right" sx={{ minWidth: 250 }}>
                        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                          {renderUserActions(user)}
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </AdminTableCard>

          {result.total_pages > 1 && (
            <Stack alignItems="center" sx={{ mt: 2.5 }}>
              <Pagination
                count={result.total_pages}
                page={result.page}
                color="primary"
                onChange={(_, page) => load(page)}
              />
            </Stack>
          )}
        </>
      )}

      {grantTarget && (
        <GrantFreePointsDialog
          member={grantTarget}
          onClose={() => setGrantTarget(null)}
          onDone={({ member, amount, action }) => {
            setGrantTarget(null);
            setMessage(`${member.name || member.display_name} 고객의 ${amount.toLocaleString()}꼬막을 ${action === "RECOVER" ? "회수" : "지급"}했습니다.`);
            load(result.page);
          }}
        />
      )}
      {manualTarget && (
        <ManualSubscriptionDialog
          member={manualTarget.user}
          requestKey={manualTarget.requestKey}
          onClose={() => setManualTarget(null)}
          onDone={(outcome) => {
            setManualTarget(null);
            setMessage(outcome.plan_code === "FREE" ? "수동 구독을 종료했습니다." : `${planName(outcome.plan_code)} 수동 구독을 적용했습니다.`);
            load(result.page);
          }}
        />
      )}

      <Dialog open={Boolean(detailUser)} onClose={() => setDetailUser(null)} fullWidth maxWidth="lg" fullScreen={isMobile}>
        <DialogTitle sx={{ fontWeight: 850 }}>{detailUser?.display_name} · 꼬막 구성</DialogTitle>
        <DialogContent dividers>
          <TextField
            select
            size="small"
            label="조회 범위"
            sx={{ mt: 0.5, mb: 2, minWidth: { xs: "100%", sm: 220 } }}
            value={grantFilter}
            onChange={(event) => showDetails(detailUser, 1, event.target.value)}
          >
            {[
              ["ACTIVE", "사용 가능·예약 중"],
              ["ALL", "전체 지급 건"],
              ["EXPIRED", "만료된 지급 건"],
              ["DEPLETED", "소진된 지급 건"],
            ].map(([value, label]) => (
              <MenuItem key={value} value={value}>{label}</MenuItem>
            ))}
          </TextField>
          {detailError ? (
            <Alert severity="error">{detailError}</Alert>
          ) : !details ? (
            <Box sx={{ py: 4, display: "grid", placeItems: "center" }}><CircularProgress /></Box>
          ) : (
            <Stack spacing={2}>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 1.25 }}>
                {[
                  ["free_points", "지급 사용 가능", "#059669", "#ECFDF5"],
                  ["paid_points", "구매 사용 가능", "#2563EB", "#EFF6FF"],
                  ["reserved_points", "예약 중", "#D97706", "#FFFBEB"],
                  ["expiring_points", "7일 내 만료 예정", "#DC2626", "#FEF2F2"],
                ].map(([key, label, color, bg]) => (
                  <Paper key={key} variant="outlined" sx={{ p: 1.75, borderRadius: 2.5, bgcolor: bg, borderColor: "transparent" }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={750}>{label}</Typography>
                    <Typography variant="h6" fontWeight={850} sx={{ color }}>{details.summary[key].toLocaleString()}꼬막</Typography>
                  </Paper>
                ))}
              </Box>
              <Typography variant="caption" color="text.secondary">
                사용자 전체 잔액 기준 · 예약 중 꼬막은 사용 가능 잔액에서 제외됩니다. 월 제공분과 구매분 모두 만료일이 가까운 순서로 표시됩니다.
              </Typography>
              <PointGrantsTable items={details.items} />
              {!details.items.length && <Alert severity="info">지급 내역이 없습니다.</Alert>}
              {details.total_pages > 1 && (
                <Stack alignItems="center">
                  <Pagination page={details.page} count={details.total_pages} onChange={(_, page) => showDetails(detailUser, page, grantFilter)} />
                </Stack>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button variant="outlined" onClick={() => setDetailUser(null)}>닫기</Button>
        </DialogActions>
      </Dialog>
    </AdminPageContainer>
  );
}

export default PointsPage;
