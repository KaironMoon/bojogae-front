/* eslint-disable react/prop-types */
import { useLayoutEffect, useRef, useState } from "react";
import { Dialog } from "@mui/material";
import ErrorNoticeDialog from "@/components/ErrorNoticeDialog";
import SignatureEditorReference from "./design/SignatureEditorReference";
import SnippetEditorReference from "./design/SnippetEditorReference";
import useTemplatePreview from "./design/useTemplatePreview";
import { SignatureProfileError } from "@/services/signature-personalization";
export default function SnippetStudioEditor({
  item,
  busy,
  error,
  onClearError,
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
  const [personalizing, setPersonalizing] = useState(false);
  const [insertionError, setInsertionError] = useState("");
  const bodyRef = useRef(null);
  const caret = useRef(null);
  const titleLength = Array.from(title.trim()).length,
    bodyLength = Array.from(body).length;
  const canSave =
    !busy && !personalizing &&
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
  const insertText = async (value) => {
    if (busy || personalizing) return;
    const el = bodyRef.current;
    const start = el?.selectionStart ?? body.length,
      end = el?.selectionEnd ?? body.length;
    setInsertionError("");
    setPersonalizing(true);
    try {
      if (signature) value = await personalize(value);
      setBody(body.slice(0, start) + value + body.slice(end));
      caret.current = start + value.length;
      setEmojiOpen(false);
    } catch (e) { if (e instanceof SignatureProfileError) window.alert(e.message); setInsertionError(e.message); }
    finally { setPersonalizing(false); }
  };
  const submit = (e) => {
    e.preventDefault();
    if (canSave) onSave({ title: title.trim(), body, category });
  };
  const vm = {
    item,
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
    busy: busy || personalizing,
    onClose,
    ...preview,
    feedback: null,
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
    <>
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
      <ErrorNoticeDialog
        message={error || insertionError}
        onClose={() => {
          setInsertionError("");
          onClearError?.();
        }}
      />
    </>
  );
}
