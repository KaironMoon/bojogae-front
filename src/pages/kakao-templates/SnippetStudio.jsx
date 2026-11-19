/* eslint-disable react/prop-types */
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Alert, Dialog } from "@mui/material";
import {
  allTemplateOptions,
  listStudioTemplates,
  saveStudioTemplate,
  deleteTemplate,
  templateError,
} from "@/services/kakao-template-service";
import api from "@/services/api-caller";
import { getMyProfile } from "@/services/profile-service";
import { useAuth } from "@/auth/AuthContext";
import { hasSignatureFields, personalizeSignature, resolveSignatureProfile, SignatureProfileError } from "@/services/signature-personalization";
import SignatureReference from "./design/SignatureReference";
import SignatureCards from "./design/SignatureCards";
import SnippetReference from "./design/SnippetReference";
import SnippetCards from "./design/SnippetCards";
import GuideReference from "./design/GuideReference";
import TemplateIcon from "./design/TemplateIcon";
import SnippetStudioEditor from "./SnippetStudioEditor";
import useTemplatePreview from "./design/useTemplatePreview";
import "./design/template-utilities.css";
import "./design/template-source.css";
import "./design/template-integration.css";
const errorText = (e) =>
  e instanceof SignatureProfileError ? e.message : e.response?.status === 422 && typeof e.response?.data?.detail === "string"
    ? e.response.data.detail
    : e.response?.status === 503
      ? "상용구 관리에 필요한 DB 변경이 적용되지 않았습니다. 서버 업데이트와 SQL 적용 상태를 확인해 주세요."
      : templateError(e);
export default function SnippetStudio({ collection = "snippets" }) {
  const { user } = useAuth();
  const signature = collection === "signatures",
    label = signature ? "서명" : "상용구";
  const [balance, setBalance] = useState(null);
  const profileRequest = useRef(null);
  useEffect(() => {
    let active = true;
    if (signature) {
      api
        .get("/api/v1/points/me")
        .then(({ data }) => {
          if (active) setBalance(data.total_points);
        })
        .catch(() => {});
    }
    return () => {
      active = false;
    };
  }, [signature]);
  const loadSignatureProfile = () => {
    if (!profileRequest.current) profileRequest.current = getMyProfile()
      .then((profile) => resolveSignatureProfile(profile, user))
      .catch(() => { throw new SignatureProfileError("내 정보를 불러오지 못해 서명을 넣지 않았습니다. 다시 시도해 주세요."); })
      .finally(() => { profileRequest.current = null; });
    return profileRequest.current;
  };
  const personalize = async (value, options = {}) => hasSignatureFields(value, options)
    ? personalizeSignature(value, await loadSignatureProfile(), options) : value;
  const [page, setPage] = useState(null),
    [revision, setRevision] = useState(0),
    [category, setCategory] = useState("ALL"),
    [query, setQuery] = useState(""),
    [search, setSearch] = useState("");
  const [options, setOptions] = useState([]),
    [signatures, setSignatures] = useState([]),
    [selectedId, setSelectedId] = useState(""),
    [signatureId, setSignatureId] = useState("");
  const [text, setText] = useState(""),
    [customerName, setCustomerName] = useState("권수경"),
    [editor, setEditor] = useState(null),
    [removing, setRemoving] = useState(null),
    [guide, setGuide] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const messageRef = useRef(null),
    caret = useRef(null);
  useEffect(() => {
    const timer = setTimeout(() => setSearch(query.trim()), 250);
    return () => clearTimeout(timer);
  }, [query]);
  useEffect(() => {
    const ctl = new AbortController();
    setPage(null);
    setError("");
    listStudioTemplates(collection, { category, q: search }, ctl.signal)
      .then((data) => {
        if (!ctl.signal.aborted) setPage(data);
      })
      .catch((e) => {
        if (!ctl.signal.aborted) setError(errorText(e));
      });
    return () => ctl.abort();
  }, [collection, category, search, revision]);
  useEffect(() => {
    const ctl = new AbortController();
    Promise.all([
      allTemplateOptions("snippets", ctl.signal),
      allTemplateOptions("signatures", ctl.signal),
    ])
      .then(([snippets, sigs]) => {
        if (!ctl.signal.aborted) {
          setOptions(snippets);
          setSignatures(sigs);
          setSelectedId((id) =>
            snippets.some((s) => String(s.id) === id)
              ? id
              : snippets[0]
                ? String(snippets[0].id)
                : "",
          );
          setSignatureId((id) =>
            sigs.some((s) => String(s.id) === id) ? id : "",
          );
        }
      })
      .catch((e) => {
        if (!ctl.signal.aborted) setError(errorText(e));
      });
    return () => ctl.abort();
  }, [revision]);
  const preview = useTemplatePreview(
    {
      text,
      customer_name: customerName,
      signature_id: signatureId ? Number(signatureId) : null,
    },
    revision,
  );
  useLayoutEffect(() => {
    if (caret.current !== null && messageRef.current) {
      messageRef.current.focus();
      messageRef.current.setSelectionRange(caret.current, caret.current);
      caret.current = null;
    }
  }, [text]);
  const insertText = (value) => {
    const input = messageRef.current,
      start = input?.selectionStart ?? text.length,
      end = input?.selectionEnd ?? text.length;
    setText(text.slice(0, start) + value + text.slice(end));
    caret.current = start + value.length;
  };
  const insertSelected = () => {
    const item = options.find((i) => String(i.id) === selectedId);
    if (item) insertText(`[[[${item.title}]]]`);
  };
  const copy = async (value) => {
    try {
      if (signature) value = await personalize(value, { examples: false });
      await navigator.clipboard.writeText(value);
      setNotice("문구를 복사했습니다.");
    } catch (e) {
      if (e instanceof SignatureProfileError) { window.alert(e.message); setError(e.message); return; }
      setError(
        "복사하지 못했습니다. 브라우저의 클립보드 권한을 확인해 주세요.",
      );
    }
  };
  const openCreate = (value = { title: "", body: "", category: "REPORT" }, preset = false) => {
    setError("");
    setNotice("");
    if (signature && hasSignatureFields(value.body, { examples: preset })) {
      return run(async () => {
        const profile = await loadSignatureProfile();
        setEditor({ ...value, title: preset ? personalizeSignature(value.title, profile) : value.title,
          body: personalizeSignature(value.body, profile, { examples: preset }) });
      });
    }
    setEditor(value);
  };
  const run = async (action) => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (e) {
      if (e instanceof SignatureProfileError) window.alert(e.message);
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };
  const save = (data) =>
    run(async () => {
      if (signature) data = { ...data, body: await personalize(data.body, { examples: false }) };
      await saveStudioTemplate(collection, editor, data);
      setEditor(null);
      setNotice(`${label} 저장했습니다.`);
      setRevision((r) => r + 1);
    });
  const close = () => {
    if (!busy) {
      setEditor(null);
      setRemoving(null);
      setError("");
    }
  };
  const Cards = signature ? SignatureCards : SnippetCards;
  const list = (
    <>
      {!page && !error && (
        <p role="status" className="template-status">
          {label} 불러오는 중…
        </p>
      )}
      {page && (
        <Cards
          items={page.items}
          selectedId={signature ? signatureId : selectedId}
          busy={busy}
          onSelect={signature ? setSignatureId : setSelectedId}
          onPreview={(item) => {
            setSelectedId(String(item.id));
            setText(`[[[${item.title}]]]`);
            messageRef.current?.scrollIntoView({
              block: "center",
              behavior: "smooth",
            });
          }}
          onEdit={openCreate}
          onDelete={(item) => {
            setError("");
            setRemoving(item);
          }}
          onCopy={copy}
        />
      )}{" "}
      {page?.next_after != null && (
        <button
          type="button"
          className="template-more"
          disabled={busy}
          onClick={() =>
            run(async () => {
              const next = await listStudioTemplates(collection, {
                after: page.next_after,
                category,
                q: search,
              });
              setPage((current) => ({
                ...next,
                items: [...current.items, ...next.items],
              }));
            })
          }
        >
          더 보기
        </button>
      )}
    </>
  );
  const vm = {
    page,
    busy,
    balance,
    selectedSignature: signatures.find(
      (item) => String(item.id) === signatureId,
    ),
    category,
    setCategory,
    query,
    setQuery,
    selectedId,
    setSelectedId,
    signatureId,
    setSignatureId,
    options,
    signatures,
    text,
    setText,
    customerName,
    setCustomerName,
    messageRef,
    insertText,
    insertSelected,
    ...preview,
    copyPreview: () => copy(preview.preview),
    openCreate,
    openPreset: (title, body, category) =>
      openCreate({
        title,
        body,
        category: category || "REPORT",
      }, true),
    openGuide: () => setGuide(true),
    list,
    feedback: (
      <>
        {!editor && !removing && error && (
          <Alert
            severity="error"
            action={
              <button type="button" onClick={() => setRevision((r) => r + 1)}>
                다시 불러오기
              </button>
            }
          >
            {error}
          </Alert>
        )}
        {notice && (
          <Alert severity="success" onClose={() => setNotice("")}>
            {notice}
          </Alert>
        )}
      </>
    ),
  };
  return (
    <>
      <div className="template-design template-page">
        {signature ? (
          <SignatureReference vm={vm} />
        ) : (
          <SnippetReference vm={vm} />
        )}
      </div>
      {editor && (
        <SnippetStudioEditor
          signature={signature}
          personalize={personalize}
          item={editor}
          busy={busy}
          error={error}
          onClose={close}
          onSave={save}
          signatureId={signatureId}
        />
      )}
      <Dialog
        open={guide}
        onClose={() => setGuide(false)}
        maxWidth={false}
        aria-label="보조개톡 Windows 앱 연동 안내"
        slotProps={{
          paper: {
            className: "template-design template-modal template-guide-modal",
          },
        }}
      >
        <GuideReference onClose={() => setGuide(false)} />
      </Dialog>
      <Dialog
        open={Boolean(removing)}
        onClose={close}
        maxWidth={false}
        aria-labelledby="snippet-remove-title"
        slotProps={{ paper: { className: "template-design template-modal" } }}
      >
        <div className="template-dialog-header">
          <TemplateIcon name="trash-2" />
          <h2 id="snippet-remove-title">{label} 삭제</h2>
          <button
            type="button"
            onClick={close}
            disabled={busy}
            aria-label="닫기"
          >
            <TemplateIcon name="x" />
          </button>
        </div>
        <div className="template-dialog-body">
          {error && <Alert severity="error">{error}</Alert>}
          <strong>{removing?.title}</strong>
          <p>
            {signature
              ? "이 서명을 삭제할까요? Windows 앱에서 더 이상 선택할 수 없습니다."
              : "이 상용구를 삭제할까요? 삭제하면 해당 제목의 치환 태그를 사용할 수 없습니다."}
          </p>
          <div className="template-dialog-actions">
            <button type="button" onClick={close} disabled={busy}>
              취소
            </button>
            <button
              type="button"
              className="template-danger"
              disabled={busy}
              onClick={() =>
                run(async () => {
                  await deleteTemplate(collection, removing.id);
                  setRemoving(null);
                  setRevision((r) => r + 1);
                  setNotice(`${label} 삭제했습니다.`);
                })
              }
            >
              삭제
            </button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
