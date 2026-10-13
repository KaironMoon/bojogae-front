/* eslint-disable react/prop-types */
import { Alert, Box, Button, ListItemButton, ListItemText, Paper, Stack, TextField, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { commonPromptError, deleteCommonPrompt, saveCommonPrompt } from "@/services/prompt-service";

export default function CommonPromptsPanel({ items, loading, onRefresh, onDirtyChange }) {
  const [selected, setSelected] = useState(null);
  const [draft, setDraft] = useState({ title: "", body: "" });
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const dirty = draft.title !== (selected?.title || "") || draft.body !== (selected?.body || "");
  useEffect(() => {
    onDirtyChange(dirty);
    return () => onDirtyChange(false);
  }, [dirty, onDirtyChange]);

  function choose(item) {
    if (dirty && !window.confirm("저장하지 않은 공통 프롬프트 변경사항을 버릴까요?")) return;
    setSelected(item);
    setDraft({ title: item?.title || "", body: item?.body || "" });
    setError("");
  }
  async function save() {
    setWorking(true);
    setError("");
    try {
      const saved = await saveCommonPrompt(draft, selected?.id);
      setSelected(saved);
      setDraft({ title: saved.title, body: saved.body });
      await onRefresh();
    } catch (err) {
      setError(commonPromptError(err));
    } finally {
      setWorking(false);
    }
  }
  async function remove() {
    if (!window.confirm(`「${selected.title}」을 삭제할까요?`)) return;
    setWorking(true);
    setError("");
    try {
      await deleteCommonPrompt(selected.id);
      setSelected(null);
      setDraft({ title: "", body: "" });
      await onRefresh();
    } catch (err) {
      setError(commonPromptError(err));
    } finally {
      setWorking(false);
    }
  }
  return (
    <Stack spacing={2}>
      {error && <Alert severity="error">{error}</Alert>}
      <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
        <Paper variant="outlined" sx={{ width: { md: 280 }, p: 2 }}>
          <Typography fontWeight={700} sx={{ mb: 1 }}>공통 프롬프트 ({items.length}/5)</Typography>
          <Button fullWidth variant="outlined" disabled={working || loading || items.length >= 5} onClick={() => choose(null)}>새 공통 프롬프트</Button>
          {loading && <Typography sx={{ mt: 2 }}>불러오는 중입니다.</Typography>}
          {items.map(item => (
            <ListItemButton key={item.id} selected={selected?.id === item.id} disabled={working} onClick={() => choose(item)} sx={{ mt: 1, borderRadius: 1 }}>
              <ListItemText primary={item.title} primaryTypographyProps={{ sx: { overflowWrap: "anywhere" } }} />
            </ListItemButton>
          ))}
        </Paper>
        <Paper variant="outlined" sx={{ flex: 1, minWidth: 0, p: 2.5 }}>
          <Stack spacing={2}>
            <Typography fontWeight={700}>{selected ? "공통 프롬프트 수정" : "공통 프롬프트 만들기"}</Typography>
            <TextField label="제목 (선택)" value={draft.title} onChange={event => setDraft(current => ({ ...current, title: event.target.value }))} inputProps={{ maxLength: 200 }} disabled={working || loading} helperText="비워두면 공통프롬프트 1, 2… 이름을 자동으로 지정합니다." />
            <TextField label="본문" required multiline minRows={14} value={draft.body} onChange={event => setDraft(current => ({ ...current, body: event.target.value }))} disabled={working || loading} />
            <Typography variant="body2" color="text.secondary">수정한 내용은 연결된 프롬프트의 다음 실행부터 반영됩니다.</Typography>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              {selected ? <Button color="error" disabled={working || loading} onClick={remove}>삭제</Button> : <span />}
              <Button variant="contained" disabled={working || loading || !draft.body.trim() || (!selected && items.length >= 5)} onClick={save}>저장</Button>
            </Box>
          </Stack>
        </Paper>
      </Stack>
    </Stack>
  );
}
