import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
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
  Tooltip,
  Typography,
} from "@mui/material";
import AddCardRoundedIcon from "@mui/icons-material/AddCardRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import ManageAccountsRoundedIcon from "@mui/icons-material/ManageAccountsRounded";
import PendingActionsRoundedIcon from "@mui/icons-material/PendingActionsRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumOutlined";

import { useAuth } from "@/auth/AuthContext";
import { planName } from "@/constants/plans";
import {
  decidePersonalPlanRequest,
  deleteUser,
  getUsers,
  updateUserRole,
} from "@/services/auth-service";
import { customerError, signalIdentityChange, startImpersonation } from "@/services/customer-service";
import CustomerDetailDialog from "./CustomerDetailDialog";
import GrantFreePointsDialog, {
  canManageManualSubscription,
  createPointRequestKey,
} from "./GrantFreePointsDialog";
import ManualSubscriptionDialog from "./ManualSubscriptionDialog";
import {
  AdminEmptyState,
  AdminFilterBar,
  AdminPageContainer,
  AdminPageHeader,
  AdminStatCard,
  AdminStatGrid,
  AdminTableCard,
} from "./components/AdminPageShell";

const PROTECTED_ADMIN_EMAIL = "bojoge.smith@gmail.com";

const USER_STATUS_OPTIONS = [
  { value: "", label: "전체 상태" },
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

function UsersPage() {
  const { clearIdentity } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const userId = /^\d+$/.test(searchParams.get("userId") || "") && Number(searchParams.get("userId")) > 0
    ? searchParams.get("userId")
    : undefined;
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [workingUserId, setWorkingUserId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [roleTarget, setRoleTarget] = useState(null);
  const [detailTarget, setDetailTarget] = useState(null);
  const [grantTarget, setGrantTarget] = useState(null);
  const [manualTarget, setManualTarget] = useState(null);
  const [detailRefreshKey, setDetailRefreshKey] = useState(0);
  const [message, setMessage] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [draftQuery, setDraftQuery] = useState("");
  const [query, setQuery] = useState("");

  const loadUsers = useCallback(async (targetPage = 1) => {
    setLoading(true);
    setError("");
    try {
      const result = await getUsers(statusFilter || undefined, targetPage, 20, query, userId);
      setUsers(result.items || []);
      setPage(result.page || 1);
      setTotalPages(result.total_pages || 0);
      setTotalCount(result.total ?? result.items?.length ?? 0);
      setDetailTarget((current) => {
        if (!current) return null;
        return (result.items || []).find((item) => item.id === current.id) || current;
      });
    } catch {
      setError("설계사 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [query, statusFilter, userId]);

  const search = (event) => {
    event.preventDefault();
    const next = draftQuery.trim();
    if (next === query) loadUsers(1);
    else setQuery(next);
  };

  useEffect(() => {
    loadUsers(1);
  }, [loadUsers]);

  const decidePlan = async (user, action) => {
    setWorkingUserId(user.id);
    setError("");
    try {
      await decidePersonalPlanRequest(user.pending_plan_request_id, action);
      await loadUsers(page);
    } catch {
      setError("요금제 신청을 처리하지 못했습니다.");
    } finally {
      setWorkingUserId(null);
    }
  };

  const impersonate = async (user) => {
    setWorkingUserId(user.id);
    setError("");
    try {
      await startImpersonation(user.id);
      clearIdentity();
      signalIdentityChange();
      window.location.assign("/home");
    } catch (err) {
      setError(customerError(err));
    } finally {
      setWorkingUserId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setWorkingUserId(deleteTarget.id);
    setError("");
    try {
      await deleteUser(deleteTarget.id);
      setDeleteTarget(null);
      await loadUsers(page);
    } catch {
      setError("설계사 계정을 삭제하지 못했습니다.");
    } finally {
      setWorkingUserId(null);
    }
  };

  const handleRoleChange = async () => {
    if (!roleTarget) return;
    const nextRole = roleTarget.role === "ADMIN" ? "USER" : "ADMIN";
    setWorkingUserId(roleTarget.id);
    setError("");
    try {
      await updateUserRole(roleTarget.id, nextRole);
      setRoleTarget(null);
      await loadUsers(page);
    } catch (requestError) {
      setError(
        requestError.response?.data?.detail === "protected_admin_role"
          ? "보호된 최고 관리자 계정은 일반 설계사로 변경할 수 없습니다."
          : "계정 권한을 변경하지 못했습니다.",
      );
    } finally {
      setWorkingUserId(null);
    }
  };

  const summary = useMemo(() => {
    const active = users.filter((u) => u.status === "ACTIVE").length;
    const pendingPlans = users.filter((u) => u.plan_request_status === "PENDING").length;
    const paid = users.filter((u) => u.plan_code && u.plan_code !== "FREE").length;
    return { active, pendingPlans, paid };
  }, [users]);

  const renderUserActions = (user, compact = false) => (
    <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
      <Button
        size="small"
        variant="contained"
        startIcon={<AddCardRoundedIcon />}
        disabled={workingUserId === user.id}
        onClick={(event) => {
          event.stopPropagation();
          setMessage("");
          setGrantTarget(user);
        }}
      >
        꼬막 지급·회수
      </Button>
      {canManageManualSubscription(user) && (
        <Button
          size="small"
          variant="outlined"
          disabled={workingUserId === user.id}
          onClick={(event) => {
            event.stopPropagation();
            setMessage("");
            setManualTarget({ user, requestKey: createPointRequestKey() });
          }}
        >
          {user.manual_subscription_id ? "수동 구독 종료" : "수동 구독"}
        </Button>
      )}
      <Button
        size="small"
        variant="outlined"
        onClick={(event) => {
          event.stopPropagation();
          setDetailTarget(user);
        }}
      >
        상세
      </Button>
      <Button
        size="small"
        variant="outlined"
        disabled={workingUserId !== null || user.role !== "USER" || user.status !== "ACTIVE"}
        onClick={(event) => {
          event.stopPropagation();
          impersonate(user);
        }}
      >
        대행 로그인
      </Button>
      {user.pending_plan_request_id && user.status !== "PENDING" && (
        <>
          <Button
            size="small"
            variant="contained"
            color="primary"
            disabled={workingUserId === user.id}
            onClick={(event) => {
              event.stopPropagation();
              decidePlan(user, "APPROVE");
            }}
          >
            {user.requested_plan_code === "FREE" ? "해지" : planName(user.requested_plan_code)} 승인
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="warning"
            disabled={workingUserId === user.id}
            onClick={(event) => {
              event.stopPropagation();
              decidePlan(user, "REJECT");
            }}
          >
            거절
          </Button>
        </>
      )}
      <Tooltip title={user.role === "ADMIN" ? "일반 설계사로 변경" : "관리자로 변경"}>
        <span>
          <Button
            size="small"
            variant="outlined"
            color={user.role === "ADMIN" ? "warning" : "primary"}
            disabled={
              workingUserId === user.id
              || (user.role === "ADMIN" && user.email?.toLowerCase() === PROTECTED_ADMIN_EMAIL)
            }
            onClick={(event) => {
              event.stopPropagation();
              setRoleTarget(user);
            }}
            startIcon={<ManageAccountsRoundedIcon />}
          >
            {compact ? (user.role === "ADMIN" ? "일반 전환" : "관리자 지정") : (user.role === "ADMIN" ? "일반 설계사" : "관리자")}
          </Button>
        </span>
      </Tooltip>
      {user.role !== "ADMIN" && (
        <Button
          size="small"
          variant="outlined"
          color="error"
          disabled={workingUserId === user.id}
          onClick={(event) => {
            event.stopPropagation();
            setDeleteTarget(user);
          }}
          startIcon={<DeleteOutlineRoundedIcon />}
        >
          삭제
        </Button>
      )}
    </Stack>
  );

  return (
    <AdminPageContainer maxWidth={1440}>
      <AdminPageHeader
        icon={GroupOutlinedIcon}
        badge={totalCount ? `총 ${totalCount.toLocaleString()}명` : undefined}
        title="설계사 관리"
        description="설계사 정보·구독·꼬막·활동 내역을 한눈에 조회하고 응대합니다."
        actions={(
          <Button
            variant="outlined"
            size="small"
            onClick={() => loadUsers(page)}
            startIcon={<RefreshRoundedIcon />}
          >
            새로고침
          </Button>
        )}
      />

      <AdminStatGrid>
        <AdminStatCard
          label="조회 결과"
          value={`${(totalCount || users.length).toLocaleString()}명`}
          subtext={`페이지 ${page} / ${Math.max(1, totalPages)}`}
          icon={GroupOutlinedIcon}
        />
        <AdminStatCard
          label="현재 페이지 활성"
          value={`${summary.active.toLocaleString()}명`}
          subtext={`표시 중 ${users.length}명 기준`}
          icon={CheckCircleOutlineRoundedIcon}
          color="#059669"
          bg="#ECFDF5"
        />
        <AdminStatCard
          label="유료·수동 구독"
          value={`${summary.paid.toLocaleString()}명`}
          subtext="FREE 제외"
          icon={WorkspacePremiumRoundedIcon}
          color="#2563EB"
          bg="#EFF6FF"
        />
        <AdminStatCard
          label="요금제 신청 대기"
          value={`${summary.pendingPlans.toLocaleString()}명`}
          subtext="승인·거절 처리 필요"
          icon={PendingActionsRoundedIcon}
          color="#D97706"
          bg="#FFFBEB"
        />
      </AdminStatGrid>

      <AdminFilterBar>
        <Stack component="form" onSubmit={search} direction={{ xs: "column", md: "row" }} spacing={1.25} alignItems={{ md: "center" }}>
          <TextField
            size="small"
            fullWidth
            placeholder="설계사 번호, 이메일, 이름, 닉네임, 전화번호, 사번, 조직명 검색"
            value={draftQuery}
            inputProps={{ maxLength: 100 }}
            onChange={(event) => setDraftQuery(event.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment> }}
          />
          <TextField
            select
            size="small"
            label="계정 상태"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            sx={{ minWidth: { xs: "100%", md: 160 } }}
          >
            {USER_STATUS_OPTIONS.map((item) => (
              <MenuItem key={item.value || "all"} value={item.value}>{item.label}</MenuItem>
            ))}
          </TextField>
          <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
            <Button type="submit" variant="contained" size="small" sx={{ minHeight: 40, px: 2.5 }}>
              검색
            </Button>
            {(query || statusFilter) && (
              <Button
                size="small"
                variant="outlined"
                sx={{ minHeight: 40 }}
                onClick={() => {
                  setDraftQuery("");
                  setQuery("");
                  setStatusFilter("");
                }}
              >
                초기화
              </Button>
            )}
          </Stack>
        </Stack>
      </AdminFilterBar>

      {userId && (
        <Alert severity="info" sx={{ mb: 2, borderRadius: 2.5 }} action={<Button size="small" onClick={() => setSearchParams({})}>전체 설계사 보기</Button>}>
          설계사 #{userId} 단독 조회 중
        </Alert>
      )}
      {message && <Alert severity="success" onClose={() => setMessage("")} sx={{ mb: 2, borderRadius: 2.5 }}>{message}</Alert>}
      {error && <Alert severity="error" onClose={() => setError("")} sx={{ mb: 2, borderRadius: 2.5 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ py: 10, display: "grid", placeItems: "center" }}>
          <CircularProgress />
        </Box>
      ) : users.length === 0 ? (
        <AdminEmptyState
          icon={GroupOutlinedIcon}
          title={query || statusFilter ? "검색 조건에 맞는 설계사가 없습니다." : "등록된 설계사가 없습니다."}
          description="검색어나 계정 상태 필터를 조정해 다시 조회해 주세요."
        />
      ) : (
        <>
          {/* Mobile card view */}
          <Stack spacing={1.5} sx={{ display: { xs: "flex", md: "none" } }}>
            {users.map((user) => {
              const statusMeta = STATUS_META[user.status] || { label: user.status, color: "default" };
              return (
                <Paper
                  key={user.id}
                  variant="outlined"
                  onClick={() => setDetailTarget(user)}
                  sx={{ p: 1.75, borderRadius: 3, cursor: "pointer" }}
                >
                  <Stack spacing={1.25}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                      <Box sx={{ minWidth: 0 }}>
                        <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
                          <Chip label={`#${user.id}`} size="small" variant="outlined" sx={{ height: 22, fontSize: "0.72rem" }} />
                          <Typography variant="subtitle1" fontWeight={850} sx={{ lineHeight: 1.25 }}>
                            {user.name || user.display_name}
                          </Typography>
                          {user.role === "ADMIN" && <Chip label="ADMIN" size="small" color="primary" sx={{ height: 22, fontSize: "0.7rem", fontWeight: 800 }} />}
                        </Stack>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35, overflowWrap: "anywhere" }}>
                          {user.email || "이메일 없음"} · {user.phone || "-"}
                        </Typography>
                      </Box>
                      <Chip label={statusMeta.label} size="small" color={statusMeta.color} sx={{ flexShrink: 0, fontWeight: 750 }} />
                    </Stack>

                    <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                      <Chip
                        label={user.manual_subscription_id ? `${planName(user.plan_code)} 수동` : planName(user.plan_code)}
                        size="small"
                        color={user.plan_code && user.plan_code !== "FREE" ? "primary" : "default"}
                        variant="outlined"
                      />
                      <Chip label={`보유 ${Number(user.total_points || 0).toLocaleString()}꼬막`} size="small" sx={{ bgcolor: "#ECFDF5", color: "#006E43", fontWeight: 800 }} />
                      <Chip label={`지급 ${user.free_points.toLocaleString()} / 구매 ${user.paid_points.toLocaleString()}`} size="small" variant="outlined" />
                    </Stack>

                    <Typography variant="caption" color="text.secondary">
                      소속 {user.group_name || user.affiliation || "-"}{user.employee_number ? ` · 사번 ${user.employee_number}` : ""} · 최근 {user.last_login_at ? new Date(user.last_login_at).toLocaleDateString("ko-KR") : "기록 없음"}
                    </Typography>

                    <Box sx={{ pt: 1, borderTop: "1px solid #F1F5F9" }}>
                      {renderUserActions(user, true)}
                    </Box>
                  </Stack>
                </Paper>
              );
            })}
          </Stack>

          {/* Desktop table view */}
          <AdminTableCard sx={{ display: { xs: "none", md: "block" } }}>
            <Table size="small" aria-label="설계사 목록">
              <TableHead>
                <TableRow>
                  <TableCell>설계사</TableCell>
                  <TableCell>연락처 · 소속</TableCell>
                  <TableCell>상태 · 요금제</TableCell>
                  <TableCell align="right">꼬막 현황</TableCell>
                  <TableCell align="right">관리</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => {
                  const statusMeta = STATUS_META[user.status] || { label: user.status, color: "default" };
                  return (
                    <TableRow
                      key={user.id}
                      hover
                      onClick={() => setDetailTarget(user)}
                      sx={{ cursor: "pointer" }}
                    >
                      <TableCell sx={{ py: 1.5 }}>
                        <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
                          <Typography variant="body2" fontWeight={850} color="#0F172A">
                            {user.name || user.display_name}
                          </Typography>
                          <Chip label={`#${user.id}`} size="small" variant="outlined" sx={{ height: 20, fontSize: "0.7rem" }} />
                          {user.role === "ADMIN" && <Chip label="ADMIN" size="small" color="primary" sx={{ height: 20, fontSize: "0.7rem", fontWeight: 800 }} />}
                        </Stack>
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.3 }}>
                          닉네임 {user.nickname || user.display_name || "-"} · {user.providers?.join(" · ")}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                          가입 {new Date(user.created_at).toLocaleDateString("ko-KR")} · 최근 로그인{" "}
                          {user.last_login_at ? new Date(user.last_login_at).toLocaleString("ko-KR") : "기록 없음"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ overflowWrap: "anywhere" }}>{user.email || "이메일 없음"}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                          전화 {user.phone || "-"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                          소속 {user.group_name || user.affiliation || "-"}{user.employee_number ? ` · 사번 ${user.employee_number}` : ""}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Stack spacing={0.5} alignItems="flex-start">
                          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                            <Chip label={statusMeta.label} size="small" color={statusMeta.color} sx={{ fontWeight: 750 }} />
                            <Chip
                              label={user.manual_subscription_id ? `${planName(user.plan_code)} 수동 구독` : planName(user.plan_code)}
                              size="small"
                              color={user.plan_code && user.plan_code !== "FREE" ? "primary" : "default"}
                              variant="outlined"
                            />
                          </Stack>
                          {user.next_plan_code && (
                            <Chip
                              label={`${new Date(user.next_plan_effective_at).toLocaleDateString("ko-KR")}부터 ${user.next_plan_code === "FREE" ? "해지" : planName(user.next_plan_code)}`}
                              size="small"
                              variant="outlined"
                            />
                          )}
                          {user.plan_request_status === "PENDING" && (
                            <Chip
                              label={`${user.requested_plan_code === "FREE" ? "해지" : planName(user.requested_plan_code)} 신청 대기`}
                              size="small"
                              color="warning"
                            />
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                        <Typography variant="body2" fontWeight={850} color="#006E43" sx={{ fontVariantNumeric: "tabular-nums" }}>
                          {Number(user.total_points || 0).toLocaleString()}꼬막
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontVariantNumeric: "tabular-nums" }}>
                          지급 {user.free_points.toLocaleString()} · 구매 {user.paid_points.toLocaleString()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontVariantNumeric: "tabular-nums" }}>
                          사용 {Number(user.used_points || 0).toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ minWidth: 280 }}>
                        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                          {renderUserActions(user, false)}
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </AdminTableCard>

          {totalPages > 1 && (
            <Stack alignItems="center" sx={{ mt: 2.5 }}>
              <Pagination
                count={totalPages}
                page={page}
                color="primary"
                onChange={(_, value) => loadUsers(value)}
              />
            </Stack>
          )}
        </>
      )}

      <CustomerDetailDialog
        customer={detailTarget}
        onClose={() => setDetailTarget(null)}
        onImpersonate={impersonate}
        onGrantPoints={(targetUser) => {
          setMessage("");
          setGrantTarget(targetUser);
        }}
        onManualSubscription={(targetUser) => {
          setMessage("");
          setManualTarget({ user: targetUser, requestKey: createPointRequestKey() });
        }}
        refreshKey={detailRefreshKey}
        actionMessage={message}
        working={workingUserId !== null}
        actionError={error}
      />
      {grantTarget && (
        <GrantFreePointsDialog
          member={grantTarget}
          onClose={() => setGrantTarget(null)}
          onDone={async ({ member, amount, action }) => {
            setGrantTarget(null);
            setMessage(`${member.name || member.display_name} 설계사에게 ${amount.toLocaleString()}꼬막을 ${action === "RECOVER" ? "회수" : "지급"}했습니다.`);
            setDetailRefreshKey((value) => value + 1);
            await loadUsers(page);
          }}
        />
      )}
      {manualTarget && (
        <ManualSubscriptionDialog
          member={manualTarget.user}
          requestKey={manualTarget.requestKey}
          onClose={() => setManualTarget(null)}
          onDone={async (outcome) => {
            setManualTarget(null);
            setMessage(outcome.plan_code === "FREE" ? "수동 구독을 종료했습니다." : `${planName(outcome.plan_code)} 수동 구독을 적용했습니다.`);
            setDetailRefreshKey((value) => value + 1);
            await loadUsers(page);
          }}
        />
      )}

      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)}>
        <DialogTitle fontWeight={800}>설계사 계정을 삭제할까요?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {deleteTarget?.display_name} 설계사의 소셜 계정과 로그인 세션이 함께 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setDeleteTarget(null)}>취소</Button>
          <Button color="error" variant="contained" onClick={handleDelete}>삭제</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(roleTarget)} onClose={() => setRoleTarget(null)}>
        <DialogTitle fontWeight={800}>계정 권한을 변경할까요?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {roleTarget?.display_name} 계정을 {roleTarget?.role === "ADMIN" ? "일반 설계사" : "관리자"}로 변경합니다.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setRoleTarget(null)}>취소</Button>
          <Button variant="contained" onClick={handleRoleChange}>변경</Button>
        </DialogActions>
      </Dialog>
    </AdminPageContainer>
  );
}

export default UsersPage;
