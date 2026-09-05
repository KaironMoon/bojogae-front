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
  Paper,
  Pagination,
  Stack,
  Typography,
} from "@mui/material";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import ManageAccountsRoundedIcon from "@mui/icons-material/ManageAccountsRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import { useCallback, useEffect, useState } from "react";

import {
  deleteUser,
  getUsers,
  updateUserRole,
  updateUserStatus,
} from "@/services/auth-service";

const PROTECTED_ADMIN_EMAIL = "bojoge.smith@gmail.com";

function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [workingUserId, setWorkingUserId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [roleTarget, setRoleTarget] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const loadUsers = useCallback(async (targetPage = 1) => {
    setLoading(true);
    setError("");
    try {
      const result = await getUsers(undefined, targetPage, 20);
      setUsers(result.items);
      setPage(result.page);
      setTotalPages(result.total_pages);
    } catch {
      setError("사용자 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const changeStatus = async (userId, status) => {
    setWorkingUserId(userId);
    setError("");
    try {
      await updateUserStatus(userId, status);
      await loadUsers(page);
    } catch {
      setError("사용자 상태를 변경하지 못했습니다.");
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
      setError("사용자를 삭제하지 못했습니다.");
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
          ? "보호된 최고 관리자 계정은 일반 사용자로 변경할 수 없습니다."
          : "사용자 권한을 변경하지 못했습니다.",
      );
    } finally {
      setWorkingUserId(null);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <div>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>사용자 관리</Typography>
          <Typography color="text.secondary">가입 요청을 승인하거나 계정 상태를 관리합니다.</Typography>
        </div>
        <Button onClick={() => loadUsers(page)} startIcon={<RefreshRoundedIcon />}>새로고침</Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading ? (
        <Box sx={{ py: 8, display: "grid", placeItems: "center" }}><CircularProgress /></Box>
      ) : (
        <Stack spacing={1.5}>
          {users.map((user) => (
            <Paper key={user.id} variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
              <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={2}>
                <Stack spacing={0.75}>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                    <Typography variant="h6" sx={{ fontWeight: 750 }}>{user.display_name}</Typography>
                    <Chip label={user.status} size="small" color={user.status === "ACTIVE" ? "success" : user.status === "PENDING" ? "warning" : "default"} />
                    {user.role === "ADMIN" && <Chip label="ADMIN" size="small" color="primary" />}
                  </Stack>
                  <Typography variant="body2" color="text.secondary">{user.email || "이메일 없음"}</Typography>
                  <Typography variant="caption" color="text.secondary">{user.providers.join(" · ")}</Typography>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                  {user.role !== "ADMIN" && (
                    <>
                      {user.status === "PENDING" ? (
                        <>
                        <Button
                          variant="contained"
                          color="success"
                          disabled={workingUserId === user.id}
                          onClick={() => changeStatus(user.id, "ACTIVE")}
                          startIcon={<CheckRoundedIcon />}
                        >
                          승인
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          disabled={workingUserId === user.id}
                          onClick={() => changeStatus(user.id, "REJECTED")}
                          startIcon={<CloseRoundedIcon />}
                        >
                          거절
                        </Button>
                        </>
                      ) : (
                        <Button
                          variant="outlined"
                          color="error"
                          disabled={workingUserId === user.id}
                          onClick={() => setDeleteTarget(user)}
                          startIcon={<DeleteOutlineRoundedIcon />}
                        >
                          삭제
                        </Button>
                      )}
                    </>
                  )}
                  <Button
                    variant="outlined"
                    color={user.role === "ADMIN" ? "warning" : "primary"}
                    disabled={
                      workingUserId === user.id
                      || (user.role === "ADMIN" && user.email?.toLowerCase() === PROTECTED_ADMIN_EMAIL)
                    }
                    onClick={() => setRoleTarget(user)}
                    startIcon={<ManageAccountsRoundedIcon />}
                  >
                    {user.role === "ADMIN" ? "일반 사용자로 변경" : "관리자로 변경"}
                  </Button>
                </Stack>
              </Stack>
            </Paper>
          ))}
          {users.length === 0 && <Typography color="text.secondary">등록된 사용자가 없습니다.</Typography>}
          {totalPages > 1 && (
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, value) => loadUsers(value)}
              sx={{ pt: 2 }}
            />
          )}
        </Stack>
      )}

      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>사용자를 삭제할까요?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {deleteTarget?.display_name} 사용자의 소셜 계정과 로그인 세션이 함께 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>취소</Button>
          <Button color="error" variant="contained" onClick={handleDelete}>
            삭제
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(roleTarget)} onClose={() => setRoleTarget(null)}>
        <DialogTitle>사용자 권한을 변경할까요?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {roleTarget?.display_name} 사용자를 {roleTarget?.role === "ADMIN" ? "일반 사용자" : "관리자"}로 변경합니다.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRoleTarget(null)}>취소</Button>
          <Button variant="contained" onClick={handleRoleChange}>변경</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default UsersPage;
