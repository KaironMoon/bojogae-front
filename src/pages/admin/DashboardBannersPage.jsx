import AddPhotoAlternateRoundedIcon from "@mui/icons-material/AddPhotoAlternateRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import {
  Alert, Box, Button, Checkbox, FormControlLabel, Paper, Stack, TextField, Typography,
} from "@mui/material";
import { useEffect, useState } from "react";

import {
  dashboardBannerImageUrl, dashboardError, deleteDashboardBanner,
  listDashboardBanners, saveDashboardBanner,
} from "@/services/dashboard-service";

const EMPTY = { title: "", description: "", linkUrl: "", startsAt: "", endsAt: "", sortOrder: 0, isActive: true, image: null };

function localDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

export default function DashboardBannersPage() {
  const [items, setItems] = useState([]);
  const [draft, setDraft] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = async () => setItems(await listDashboardBanners());
  useEffect(() => { load().catch(err => setError(dashboardError(err))); }, []);

  const edit = item => {
    setEditingId(item.id);
    setDraft({ title: item.title, description: item.description, linkUrl: item.link_url || "", startsAt: localDateTime(item.starts_at), endsAt: localDateTime(item.ends_at), sortOrder: item.sort_order, isActive: item.is_active, image: null });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const reset = () => { setEditingId(null); setDraft(EMPTY); };

  const save = async event => {
    event.preventDefault(); setWorking(true); setError(""); setMessage("");
    try { await saveDashboardBanner(draft, editingId); await load(); reset(); setMessage("배너를 저장했습니다."); }
    catch (err) { setError(dashboardError(err)); }
    finally { setWorking(false); }
  };

  const remove = async item => {
    if (!window.confirm(`'${item.title}' 배너를 삭제할까요?`)) return;
    setWorking(true); setError(""); setMessage("");
    try { await deleteDashboardBanner(item.id); await load(); if (editingId === item.id) reset(); setMessage("배너를 삭제했습니다."); }
    catch (err) { setError(dashboardError(err)); }
    finally { setWorking(false); }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1050, mx: "auto" }}>
      <Typography variant="h4" fontWeight={850}>메인 배너 관리</Typography>
      <Typography color="text.secondary" sx={{ mt: 0.5, mb: 3 }}>메인 대시보드에 노출할 광고와 프로모션을 관리합니다.</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
      <Paper component="form" onSubmit={save} variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, mb: 3 }}>
        <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>{editingId ? "배너 수정" : "새 배너"}</Typography>
        <Stack spacing={2}>
          <TextField required label="제목" value={draft.title} inputProps={{ maxLength: 150 }} onChange={e => setDraft({ ...draft, title: e.target.value })} />
          <TextField label="설명" value={draft.description} inputProps={{ maxLength: 500 }} multiline minRows={2} onChange={e => setDraft({ ...draft, description: e.target.value })} />
          <TextField label="연결 주소" placeholder="https://" value={draft.linkUrl} inputProps={{ maxLength: 1000 }} onChange={e => setDraft({ ...draft, linkUrl: e.target.value })} />
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 140px" }, gap: 2 }}>
            <TextField type="datetime-local" label="노출 시작" value={draft.startsAt} InputLabelProps={{ shrink: true }} onChange={e => setDraft({ ...draft, startsAt: e.target.value })} />
            <TextField type="datetime-local" label="노출 종료" value={draft.endsAt} InputLabelProps={{ shrink: true }} onChange={e => setDraft({ ...draft, endsAt: e.target.value })} />
            <TextField type="number" label="노출 순서" value={draft.sortOrder} inputProps={{ min: 0, max: 10000 }} onChange={e => setDraft({ ...draft, sortOrder: Number(e.target.value) })} />
          </Box>
          <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "center" }} spacing={2}>
            <Button component="label" variant="outlined" startIcon={<AddPhotoAlternateRoundedIcon />}>
              {draft.image ? draft.image.name : editingId ? "이미지 변경" : "이미지 선택"}
              <input hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={e => setDraft({ ...draft, image: e.target.files?.[0] || null })} />
            </Button>
            <FormControlLabel control={<Checkbox checked={draft.isActive} onChange={e => setDraft({ ...draft, isActive: e.target.checked })} />} label="활성화" />
          </Stack>
          <Stack direction="row" justifyContent="flex-end" spacing={1}>
            {editingId && <Button onClick={reset} disabled={working}>취소</Button>}
            <Button type="submit" variant="contained" disabled={working || !draft.title.trim() || (!editingId && !draft.image)}>{working ? "저장 중…" : "저장"}</Button>
          </Stack>
        </Stack>
      </Paper>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2,minmax(0,1fr))" }, gap: 2 }}>
        {items.map(item => <Paper key={item.id} variant="outlined" sx={{ borderRadius: 3, overflow: "hidden", opacity: item.is_active ? 1 : 0.62 }}>
          <Box component="img" src={dashboardBannerImageUrl(item.id, item.image_revision)} alt="" sx={{ width: "100%", height: 180, objectFit: "cover", display: "block" }} />
          <Stack spacing={1} sx={{ p: 2.2 }}>
            <Stack direction="row" justifyContent="space-between"><Typography fontWeight={850}>{item.title}</Typography><Typography variant="caption" color={item.is_active ? "success.main" : "text.secondary"}>{item.is_active ? "활성" : "비활성"}</Typography></Stack>
            <Typography variant="body2" color="text.secondary">{item.description || "설명 없음"}</Typography>
            <Typography variant="caption" color="text.secondary">순서 {item.sort_order} · {item.starts_at ? new Date(item.starts_at).toLocaleString("ko-KR") : "즉시"} ~ {item.ends_at ? new Date(item.ends_at).toLocaleString("ko-KR") : "계속"}</Typography>
            <Stack direction="row" justifyContent="flex-end" spacing={1}><Button size="small" startIcon={<EditRoundedIcon />} onClick={() => edit(item)}>수정</Button><Button size="small" color="error" startIcon={<DeleteOutlineRoundedIcon />} onClick={() => remove(item)}>삭제</Button></Stack>
          </Stack>
        </Paper>)}
        {!items.length && <Paper variant="outlined" sx={{ p: 5, textAlign: "center", gridColumn: "1/-1" }}><Typography color="text.secondary">등록된 배너가 없습니다.</Typography></Paper>}
      </Box>
    </Box>
  );
}
