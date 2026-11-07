/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import {
  Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogTitle, Paper, Stack, Typography,
} from "@mui/material";
import {
  createTemplate, deleteTemplate, getTemplate, listTemplates, templateError, updateTemplate,
} from "@/services/kakao-template-service";
import KakaoTemplateEditor from "./KakaoTemplateEditor";

export default function KakaoTemplatesPage({ collection, label }) {
  const [page, setPage] = useState(null);
  const [reload, setReload] = useState(0);
  const [editor, setEditor] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    listTemplates(collection, 0, controller.signal)
      .then((result) => { if (!controller.signal.aborted) setPage(result); })
      .catch((err) => { if (!controller.signal.aborted) setError(templateError(err)); });
    return () => controller.abort();
  }, [collection, reload]);

  function refresh() {
    setError("");
    setPage(null);
    setReload((value) => value + 1);
  }

  async function run(operation) {
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await operation();
    } catch (err) {
      setError(templateError(err));
    } finally {
      setBusy(false);
    }
  }

  function loadMore() {
    run(async () => {
      const next = await listTemplates(collection, page.next_after);
      setPage((current) => {
        const seen = new Set(current.items.map(({ id }) => id));
        return { ...next, items: [...current.items, ...next.items.filter(({ id }) => !seen.has(id))] };
      });
    });
  }

  function openCreate() {
    setError("");
    setNotice("");
    setEditor({ title: "", body: "" });
  }

  function closeDialog() {
    if (busy) return;
    setEditor(null);
    setRemoving(null);
    setError("");
  }

  function save(data) {
    run(async () => {
      const saved = editor.id
        ? await updateTemplate(collection, editor.id, data)
        : await createTemplate(collection, data);
      setPage((current) => ({
        ...current,
        items: editor.id
          ? current.items.map((item) => item.id === saved.id ? saved : item)
          : [saved, ...current.items],
      }));
      setEditor(null);
      setNotice(`${label} 저장을 완료했습니다.`);
    });
  }

  function remove() {
    run(async () => {
      await deleteTemplate(collection, removing.id);
      setPage((current) => ({ ...current, items: current.items.filter(({ id }) => id !== removing.id) }));
      setRemoving(null);
      setNotice(`${label} 삭제를 완료했습니다.`);
    });
  }

  return (
    <Box component="section" sx={{ maxWidth: 960, mx: "auto", p: { xs: 2, md: 4 } }}>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" fontWeight={800}>{label}</Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>카톡 센더에서 사용할 문구를 관리합니다.</Typography>
        </Box>
        <Button variant="contained" onClick={openCreate} disabled={busy || !page} sx={{ alignSelf: "flex-start" }}>
          {label} 등록
        </Button>
      </Stack>
      {notice && <Alert severity="success" onClose={() => setNotice("")} sx={{ mb: 2 }}>{notice}</Alert>}
      {error && !editor && !removing && (
        <Alert severity="error" sx={{ mb: 2 }} action={<Button color="inherit" size="small" onClick={refresh}>새로고침</Button>}>
          {error}
        </Alert>
      )}
      {!page && !error && <CircularProgress size={28} aria-label={`${label} 목록 불러오는 중`} />}
      {page && (
        <Stack spacing={1.5}>
          {!page.items.length && <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>등록된 항목이 없습니다.</Typography>}
          {page.items.map((item) => (
            <Paper component="article" key={item.id} variant="outlined" sx={{ p: 2.5 }}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} justifyContent="space-between" alignItems={{ sm: "flex-start" }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography component="h2" fontWeight={750} sx={{ overflowWrap: "anywhere" }}>{item.title}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, whiteSpace: "pre-wrap", overflowWrap: "anywhere", overflow: "hidden", display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 3 }}>
                    {item.body}
                  </Typography>
                </Box>
                <Stack direction="row" sx={{ flexShrink: 0 }}>
                  <Button size="small" disabled={busy} aria-label={`${item.title} 수정`}
                    onClick={() => run(async () => setEditor(await getTemplate(collection, item.id)))}>
                    수정
                  </Button>
                  <Button size="small" color="error" disabled={busy} aria-label={`${item.title} 삭제`}
                    onClick={() => { setError(""); setNotice(""); setRemoving(item); }}>
                    삭제
                  </Button>
                </Stack>
              </Stack>
            </Paper>
          ))}
          {page.next_after !== null && <Button onClick={loadMore} disabled={busy} sx={{ alignSelf: "center" }}>더 보기</Button>}
        </Stack>
      )}

      {editor && <KakaoTemplateEditor item={editor} label={label} busy={busy} error={error} onClose={closeDialog} onSave={save} />}
      {removing && (
        <Dialog open fullWidth maxWidth="xs" onClose={closeDialog} aria-labelledby="remove-template-title">
          <DialogTitle id="remove-template-title">{label} 삭제</DialogTitle>
          <DialogContent>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Typography sx={{ overflowWrap: "anywhere" }}>{removing.title}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>이 항목을 삭제할까요?</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeDialog} disabled={busy}>취소</Button>
            <Button onClick={remove} disabled={busy} color="error">삭제</Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
}
