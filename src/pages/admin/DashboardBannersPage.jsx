import AddPhotoAlternateRoundedIcon from "@mui/icons-material/AddPhotoAlternateRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import ViewCarouselOutlinedIcon from "@mui/icons-material/ViewCarouselOutlined";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Paper,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useEffect, useMemo, useState } from "react";

import {
  dashboardBannerImageUrl,
  dashboardError,
  deleteDashboardBanner,
  listDashboardBanners,
  saveDashboardBanner,
} from "@/services/dashboard-service";
import {
  AdminEmptyState,
  AdminPageContainer,
  AdminPageHeader,
  AdminStatCard,
  AdminStatGrid,
} from "./components/AdminPageShell";

const EMPTY = {
  title: "",
  description: "",
  linkUrl: "",
  startsAt: "",
  endsAt: "",
  sortOrder: 0,
  isActive: true,
  image: null,
  mobileImage: null,
};

function localDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

export default function DashboardBannersPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [items, setItems] = useState([]);
  const [draft, setDraft] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = async () => setItems(await listDashboardBanners());
  useEffect(() => { load().catch((err) => setError(dashboardError(err))); }, []);

  const desktopPreviewUrl = useMemo(() => (
    draft.image ? URL.createObjectURL(draft.image) : null
  ), [draft.image]);
  const mobilePreviewUrl = useMemo(() => (
    draft.mobileImage ? URL.createObjectURL(draft.mobileImage) : null
  ), [draft.mobileImage]);

  useEffect(() => () => {
    if (desktopPreviewUrl) URL.revokeObjectURL(desktopPreviewUrl);
  }, [desktopPreviewUrl]);
  useEffect(() => () => {
    if (mobilePreviewUrl) URL.revokeObjectURL(mobilePreviewUrl);
  }, [mobilePreviewUrl]);

  const openCreate = () => {
    setEditingId(null);
    setDraft(EMPTY);
    setError("");
    setEditorOpen(true);
  };

  const edit = (item) => {
    setEditingId(item.id);
    setDraft({
      title: item.title,
      description: item.description,
      linkUrl: item.link_url || "",
      startsAt: localDateTime(item.starts_at),
      endsAt: localDateTime(item.ends_at),
      sortOrder: item.sort_order,
      isActive: item.is_active,
      image: null,
      mobileImage: null,
    });
    setError("");
    setEditorOpen(true);
  };

  const reset = () => {
    setEditingId(null);
    setDraft(EMPTY);
    setEditorOpen(false);
  };

  const save = async (event) => {
    event.preventDefault();
    setWorking(true);
    setError("");
    setMessage("");
    try {
      await saveDashboardBanner(draft, editingId);
      await load();
      reset();
      setMessage("배너를 저장했습니다.");
    } catch (err) {
      setError(dashboardError(err));
    } finally {
      setWorking(false);
    }
  };

  const remove = async (item) => {
    if (!window.confirm(`'${item.title}' 배너를 삭제할까요?`)) return;
    setWorking(true);
    setError("");
    setMessage("");
    try {
      await deleteDashboardBanner(item.id);
      await load();
      if (editingId === item.id) reset();
      setMessage("배너를 삭제했습니다.");
    } catch (err) {
      setError(dashboardError(err));
    } finally {
      setWorking(false);
    }
  };

  const editingItem = items.find((item) => item.id === editingId) || null;
  const activeCount = items.filter((item) => item.is_active).length;
  const filteredItems = items.filter((item) => {
    if (statusFilter === "active") return item.is_active;
    if (statusFilter === "inactive") return !item.is_active;
    return true;
  });

  return (
    <AdminPageContainer maxWidth={1200}>
      <AdminPageHeader
        icon={ViewCarouselOutlinedIcon}
        badge={`총 ${items.length}개`}
        title="메인 배너 관리"
        description="메인 대시보드에 노출할 광고와 프로모션 배너를 등록하고 순서를 관리합니다."
        actions={(
          <>
            <Button variant="outlined" size="small" startIcon={<RefreshRoundedIcon />} onClick={() => load().catch((err) => setError(dashboardError(err)))}>
              새로고침
            </Button>
            <Button variant="contained" size="small" startIcon={<AddRoundedIcon />} onClick={openCreate}>
              새 배너 등록
            </Button>
          </>
        )}
      />

      {error && <Alert severity="error" onClose={() => setError("")} sx={{ mb: 2, borderRadius: 2.5 }}>{error}</Alert>}
      {message && <Alert severity="success" onClose={() => setMessage("")} sx={{ mb: 2, borderRadius: 2.5 }}>{message}</Alert>}

      <AdminStatGrid columns={{ xs: "repeat(3, 1fr)" }}>
        <AdminStatCard label="전체 배너" value={`${items.length}개`} active={statusFilter === "all"} onClick={() => setStatusFilter("all")} />
        <AdminStatCard label="노출 활성" value={`${activeCount}개`} color="#059669" bg="#ECFDF5" active={statusFilter === "active"} onClick={() => setStatusFilter("active")} />
        <AdminStatCard label="비활성" value={`${items.length - activeCount}개`} color="#64748B" bg="#F1F5F9" active={statusFilter === "inactive"} onClick={() => setStatusFilter("inactive")} />
      </AdminStatGrid>

      <Paper variant="outlined" sx={{ borderRadius: 3, mb: 2.5, px: 1.5, bgcolor: "#FFFFFF" }}>
        <Tabs value={statusFilter} onChange={(_e, val) => setStatusFilter(val)} variant="scrollable" scrollButtons="auto">
          <Tab value="all" label={`전체 (${items.length})`} sx={{ fontWeight: 750 }} />
          <Tab value="active" label={`활성 (${activeCount})`} sx={{ fontWeight: 750 }} />
          <Tab value="inactive" label={`비활성 (${items.length - activeCount})`} sx={{ fontWeight: 750 }} />
        </Tabs>
      </Paper>

      {filteredItems.length === 0 ? (
        <AdminEmptyState
          icon={ViewCarouselOutlinedIcon}
          title="조건에 맞는 배너가 없습니다."
          description="새 배너를 등록해 대시보드에 프로모션을 노출해 보세요."
          action={<Button variant="contained" startIcon={<AddRoundedIcon />} onClick={openCreate}>새 배너 등록</Button>}
        />
      ) : (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" }, gap: 2 }}>
          {filteredItems.map((item) => (
            <Paper
              key={item.id}
              variant="outlined"
              sx={{
                borderRadius: 3,
                overflow: "hidden",
                opacity: item.is_active ? 1 : 0.72,
                bgcolor: "#FFFFFF",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Box sx={{ display: "grid", gridTemplateColumns: item.mobile_image_revision ? "1fr 1fr" : "1fr", bgcolor: "#F1F5F9", borderBottom: "1px solid #E2E8F0" }}>
                <Box sx={{ position: "relative" }}>
                  <Box component="img" src={dashboardBannerImageUrl(item.id, item.image_revision)} alt="데스크톱 배너 미리보기" sx={{ width: "100%", height: 180, objectFit: "cover", display: "block" }} />
                  <Chip label="PC" size="small" sx={{ position: "absolute", top: 8, left: 8, height: 20, fontSize: 10.5, fontWeight: 800, bgcolor: "rgba(15,23,42,0.72)", color: "#fff" }} />
                </Box>
                {item.mobile_image_revision && (
                  <Box sx={{ position: "relative", borderLeft: "1px solid #E2E8F0" }}>
                    <Box component="img" src={dashboardBannerImageUrl(item.id, item.mobile_image_revision, "mobile")} alt="모바일 배너 미리보기" sx={{ width: "100%", height: 180, objectFit: "cover", display: "block" }} />
                    <Chip label="모바일" size="small" sx={{ position: "absolute", top: 8, left: 8, height: 20, fontSize: 10.5, fontWeight: 800, bgcolor: "rgba(3,199,90,0.88)", color: "#fff" }} />
                  </Box>
                )}
              </Box>
              <Stack spacing={1} sx={{ p: 2, flex: 1 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
                  <Typography variant="subtitle1" fontWeight={850} sx={{ lineHeight: 1.3 }}>{item.title}</Typography>
                  <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
                    <Chip size="small" label={`순서 ${item.sort_order}`} variant="outlined" />
                    <Chip size="small" label={item.is_active ? "활성" : "비활성"} color={item.is_active ? "success" : "default"} />
                  </Stack>
                </Stack>
                <Typography variant="body2" color="text.secondary">{item.description || "설명 없음"}</Typography>
                <Typography variant="caption" color="text.secondary">
                  노출 기간: {item.starts_at ? new Date(item.starts_at).toLocaleString("ko-KR") : "즉시"} ~ {item.ends_at ? new Date(item.ends_at).toLocaleString("ko-KR") : "계속"}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ overflowWrap: "anywhere" }}>
                  데스크톱 {item.original_filename} · 모바일 {item.mobile_original_filename || "미등록 (PC 사용)"}
                </Typography>
                <Stack direction="row" justifyContent="flex-end" spacing={1} sx={{ mt: "auto", pt: 1.25, borderTop: "1px solid #F1F5F9" }}>
                  <Button size="small" variant="outlined" startIcon={<EditRoundedIcon />} onClick={() => edit(item)}>수정</Button>
                  <Button size="small" variant="outlined" color="error" startIcon={<DeleteOutlineRoundedIcon />} onClick={() => remove(item)}>삭제</Button>
                </Stack>
              </Stack>
            </Paper>
          ))}
        </Box>
      )}

      <Dialog open={editorOpen} onClose={() => !working && reset()} fullWidth maxWidth="md" fullScreen={isMobile}>
        <Box component="form" onSubmit={save}>
          <DialogTitle fontWeight={850}>{editingId ? "배너 수정" : "새 배너 등록"}</DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2}>
              {error && <Alert severity="error">{error}</Alert>}
              <TextField required size="small" label="제목" value={draft.title} inputProps={{ maxLength: 150 }} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
              <TextField size="small" label="설명" value={draft.description} inputProps={{ maxLength: 500 }} multiline minRows={2} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
              <TextField size="small" label="연결 주소" placeholder="https://" value={draft.linkUrl} inputProps={{ maxLength: 1000 }} onChange={(e) => setDraft({ ...draft, linkUrl: e.target.value })} />
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 140px" }, gap: 1.5 }}>
                <TextField size="small" type="datetime-local" label="노출 시작" value={draft.startsAt} InputLabelProps={{ shrink: true }} onChange={(e) => setDraft({ ...draft, startsAt: e.target.value })} />
                <TextField size="small" type="datetime-local" label="노출 종료" value={draft.endsAt} InputLabelProps={{ shrink: true }} onChange={(e) => setDraft({ ...draft, endsAt: e.target.value })} />
                <TextField size="small" type="number" label="노출 순서" value={draft.sortOrder} inputProps={{ min: 0, max: 10000 }} onChange={(e) => setDraft({ ...draft, sortOrder: Number(e.target.value) })} />
              </Box>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2.5 }}>
                  <Stack spacing={1}>
                    <Typography variant="subtitle2" fontWeight={800}>데스크톱 이미지</Typography>
                    {(desktopPreviewUrl || editingItem) && (
                      <Box
                        component="img"
                        src={desktopPreviewUrl || dashboardBannerImageUrl(editingItem.id, editingItem.image_revision)}
                        alt="PC 배너 미리보기"
                        sx={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 1.5, bgcolor: "#F1F5F9" }}
                      />
                    )}
                    <Button component="label" size="small" variant="outlined" startIcon={<AddPhotoAlternateRoundedIcon />} sx={{ alignSelf: "flex-start" }}>
                      {draft.image ? draft.image.name : editingId ? "데스크톱 이미지 변경" : "데스크톱 이미지 선택"}
                      <input hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setDraft({ ...draft, image: e.target.files?.[0] || null })} />
                    </Button>
                    <Typography variant="caption" color="text.secondary">권장 1600 × 480px · JPG, PNG, WebP · 최대 5MB</Typography>
                  </Stack>
                </Paper>
                <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2.5 }}>
                  <Stack spacing={1}>
                    <Typography variant="subtitle2" fontWeight={800}>모바일 이미지 (선택)</Typography>
                    {(mobilePreviewUrl || editingItem?.mobile_image_revision) && (
                      <Box
                        component="img"
                        src={mobilePreviewUrl || dashboardBannerImageUrl(editingItem.id, editingItem.mobile_image_revision, "mobile")}
                        alt="모바일 배너 미리보기"
                        sx={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 1.5, bgcolor: "#F1F5F9" }}
                      />
                    )}
                    <Button component="label" size="small" variant="outlined" startIcon={<AddPhotoAlternateRoundedIcon />} sx={{ alignSelf: "flex-start" }}>
                      {draft.mobileImage ? draft.mobileImage.name : editingId ? "모바일 이미지 변경" : "모바일 이미지 선택"}
                      <input hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setDraft({ ...draft, mobileImage: e.target.files?.[0] || null })} />
                    </Button>
                    <Typography variant="caption" color="text.secondary">권장 900 × 560px · 미등록 시 PC 이미지 사용</Typography>
                  </Stack>
                </Paper>
              </Box>
              <FormControlLabel control={<Switch color="success" checked={draft.isActive} onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })} />} label="대시보드에 노출 활성화" />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={reset} disabled={working}>취소</Button>
            <Button type="submit" variant="contained" disabled={working || !draft.title.trim() || (!editingId && !draft.image)}>
              {working ? "저장 중…" : "저장"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </AdminPageContainer>
  );
}
