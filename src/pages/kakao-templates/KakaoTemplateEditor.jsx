/* eslint-disable react/prop-types */
import { useId, useLayoutEffect, useRef, useState } from "react";
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Stack, TextField, Tooltip } from "@mui/material";
import EmojiEmotionsOutlinedIcon from "@mui/icons-material/EmojiEmotionsOutlined";

const TITLE_LIMIT = 100;
const BODY_LIMIT = 5000;
const EMOJIS = [
  ["😀", "웃는 얼굴"], ["😊", "미소"], ["🙂", "가벼운 미소"], ["😉", "윙크"],
  ["😄", "활짝 웃는 얼굴"], ["🙇", "인사"], ["🙏", "감사"], ["👋", "손 흔들기"],
  ["👍", "엄지 척"], ["👌", "좋아요"], ["👏", "박수"], ["🙌", "두 손 들기"],
  ["❤️", "빨간 하트"], ["💛", "노란 하트"], ["🎉", "축하"], ["✨", "반짝임"],
  ["🌷", "튤립"], ["☀️", "해"], ["☕", "커피"], ["🎁", "선물"],
  ["✅", "확인"], ["📌", "압정"], ["📅", "달력"], ["⏰", "알람"],
  ["📞", "전화"], ["💬", "말풍선"], ["✉️", "편지"], ["📎", "첨부"],
  ["📍", "위치"], ["🔗", "링크"], ["📄", "문서"], ["💡", "전구"],
];

export default function KakaoTemplateEditor({ item, label, busy, error, onClose, onSave }) {
  const [title, setTitle] = useState(item.title);
  const [body, setBody] = useState(item.body);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const bodyInput = useRef(null);
  const pendingCaret = useRef(null);
  const headingId = useId();
  const emojiListId = useId();
  const trimmedTitle = title.trim();
  const titleLength = Array.from(trimmedTitle).length;
  const bodyLength = Array.from(body).length;
  const unchanged = item.id && item.title === trimmedTitle && item.body === body;
  const canSave = !busy && !unchanged && trimmedTitle && body.trim() && titleLength <= TITLE_LIMIT && bodyLength <= BODY_LIMIT;

  useLayoutEffect(() => {
    if (pendingCaret.current === null || !bodyInput.current) return;
    bodyInput.current.focus();
    bodyInput.current.setSelectionRange(pendingCaret.current, pendingCaret.current);
    pendingCaret.current = null;
  }, [body, emojiOpen]);

  function insertEmoji(emoji) {
    const { value, selectionStart, selectionEnd } = bodyInput.current;
    setBody(value.slice(0, selectionStart) + emoji + value.slice(selectionEnd));
    pendingCaret.current = selectionStart + emoji.length;
    setEmojiOpen(false);
  }

  function submit(event) {
    event.preventDefault();
    if (!canSave) return;
    const data = {};
    if (!item.id || trimmedTitle !== item.title) data.title = trimmedTitle;
    if (!item.id || body !== item.body) data.body = body;
    onSave(data);
  }

  return (
    <Dialog open fullWidth maxWidth="sm" onClose={onClose} aria-labelledby={headingId}>
      <Box component="form" onSubmit={submit}>
        <DialogTitle id={headingId}>{label} {item.id ? "수정" : "등록"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField autoFocus required label="제목" value={title} disabled={busy} error={titleLength > TITLE_LIMIT}
              onChange={(event) => setTitle(event.target.value)} helperText={`${titleLength}/${TITLE_LIMIT}자`} />
            <TextField required label="본문" value={body} inputRef={bodyInput} disabled={busy} error={bodyLength > BODY_LIMIT}
              multiline minRows={5} maxRows={12} onChange={(event) => setBody(event.target.value)} helperText={`${bodyLength}/${BODY_LIMIT.toLocaleString()}자`} />
            <Box>
              <Button type="button" size="small" variant="outlined" startIcon={<EmojiEmotionsOutlinedIcon />}
                disabled={busy} aria-expanded={emojiOpen} aria-controls={emojiOpen ? emojiListId : undefined}
                onClick={() => setEmojiOpen((open) => !open)}>
                이모지 삽입
              </Button>
              {emojiOpen && (
                <Box id={emojiListId} role="group" aria-label="이모지 선택"
                  sx={{ display: "flex", flexWrap: "wrap", gap: 0.25, mt: 1, p: 0.5, border: 1, borderColor: "divider", borderRadius: 1 }}>
                  {EMOJIS.map(([emoji, name]) => (
                    <Tooltip key={emoji} title={name}>
                      <IconButton type="button" aria-label={name} disabled={busy} onClick={() => insertEmoji(emoji)} sx={{ width: 40, height: 40, fontSize: 21 }}>
                        <span aria-hidden="true">{emoji}</span>
                      </IconButton>
                    </Tooltip>
                  ))}
                </Box>
              )}
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={busy}>취소</Button>
          <Button type="submit" variant="contained" disabled={!canSave}>{busy ? "저장 중…" : "저장"}</Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
