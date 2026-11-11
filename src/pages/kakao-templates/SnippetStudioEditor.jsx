/* eslint-disable react/prop-types */
import { useLayoutEffect, useRef, useState } from "react";
import { Alert, Dialog } from "@mui/material";
import SignatureEditorReference from "./design/SignatureEditorReference";
import SnippetEditorReference from "./design/SnippetEditorReference";
import useTemplatePreview from "./design/useTemplatePreview";
export default function SnippetStudioEditor({
  item,
  busy,
  error,
  onClose,
  onSave,
  signatureId,
  signature = false,
  personalize = (value) => value,
}) {
  const [title, setTitle] = useState(item.title);
  const [body, setBody] = useState(item.body);
  const [category, setCategory] = useState(item.category || "REPORT");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const bodyRef = useRef(null);
  const caret = useRef(null);
  const titleLength = Array.from(title.trim()).length,
    bodyLength = Array.from(body).length;
  const canSave =
    !busy &&
    title.trim() &&
    body.trim() &&
    titleLength <= 100 &&
    bodyLength <= 5000 &&
    (!item.id ||
      title.trim() !== item.title ||
      body !== item.body ||
      category !== item.category);
  const draft =
    title.trim() && body.trim() && titleLength <= 100 && bodyLength <= 5000
      ? { title: title.trim(), body, category }
      : null;
  const preview = useTemplatePreview({
    text: !signature && draft ? body : "",
    customer_name: "권수경",
    signature_id: signatureId ? Number(signatureId) : null,
    draft,
    draft_id: item.id || null,
  });
  useLayoutEffect(() => {
    if (caret.current !== null && bodyRef.current) {
      bodyRef.current.focus();
      bodyRef.current.setSelectionRange(caret.current, caret.current);
      caret.current = null;
    }
  }, [body, emojiOpen]);
  const insertText = (value) => {
    const el = bodyRef.current;
    const start = el?.selectionStart ?? body.length,
      end = el?.selectionEnd ?? body.length;
    setBody(body.slice(0, start) + value + body.slice(end));
    caret.current = start + value.length;
    setEmojiOpen(false);
  };
  const submit = (e) => {
    e.preventDefault();
    if (canSave) onSave({ title: title.trim(), body, category });
  };
  const vm = {
    item,
    personalize,
    title,
    setTitle,
    body,
    setBody,
    category,
    setCategory,
    titleLength,
    bodyLength,
    bodyRef,
    emojiOpen,
    setEmojiOpen,
    insertText,
    submit,
    canSave,
    busy,
    onClose,
    ...preview,
    feedback: error ? (
      <Alert severity="error" className="template-feedback">
        {error}
      </Alert>
    ) : null,
    emojis: [
      "😀",
      "😊",
      "🙂",
      "😉",
      "🙇",
      "🙏",
      "👋",
      "👍",
      "👏",
      "❤️",
      "💛",
      "🎉",
      "✨",
      "🌷",
      "☀️",
      "☕",
      "🎁",
      "✅",
      "📌",
      "📅",
      "⏰",
      "📞",
      "💬",
      "📎",
      "📍",
      "🔗",
      "📄",
      "💡",
      "🏥",
      "🛡️",
      "📈",
      "🏢",
    ],
  };
  return (
    <Dialog
      open
      onClose={onClose}
      maxWidth={false}
      aria-labelledby=":r10k:"
      slotProps={{
        paper: {
          className: "template-design template-modal template-editor-modal",
        },
      }}
    >
      {signature ? (
        <SignatureEditorReference vm={vm} />
      ) : (
        <SnippetEditorReference vm={vm} />
      )}
    </Dialog>
  );
}
