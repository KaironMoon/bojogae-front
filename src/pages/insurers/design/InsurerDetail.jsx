/* eslint-disable react/prop-types */
import { useState } from "react";
import { Dialog, Alert } from "@mui/material";
import { useNavigate } from "react-router-dom";
import DetailReference from "./DetailReference";
import {
  Logo,
  Browser,
  OfficialLinks,
  Contacts,
  Payments,
  Systems,
  PortalLink,
} from "./Elements";
import {
  ciColor,
  contactsFor,
  linksFor,
  portalFor,
  kindLabel,
  sourcesFor,
} from "../insurer-directory";
import { fullInformation } from "./data";
export default function InsurerDetail({
  insurer,
  favorite,
  memo,
  disabled,
  close,
  toggle,
  save,
  copy,
  notice,
}) {
  const [draft, setDraft] = useState(null),
    [sourcesOpen, setSourcesOpen] = useState(false),
    navigate = useNavigate();
  const notes = insurer.claim_notes || [],
    portal = portalFor(insurer);
  const vm = {
    insurer,
    color: ciColor(insurer),
    sector: kindLabel[insurer.kind],
    close,
    toggle,
    disabled,
    favorite,
    memo: draft ?? memo,
    setMemo: setDraft,
    memoChanged: draft !== null && draft !== memo,
    saveMemo: () => save(draft),
    sourcesOpen,
    setSourcesOpen,
    reportError: () => navigate("/help/contact"),
    copyAll: () => copy(fullInformation(insurer), "전체 정보"),
    copyPayment: () =>
      copy(
        insurer.card_payment.length
          ? insurer.card_payment.map((e) => `${e.label}: ${e.value}`).join("\n")
          : "등록된 카드납 정보가 없습니다.",
        "카드납 기준",
      ),
    copyNotes: () =>
      copy(
        notes.length
          ? notes.join("\n")
          : "구비서류 안내는 보험사 공식 청구 안내에서 확인해 주세요.",
        "구비서류 안내",
      ),
    logo: <Logo insurer={insurer} large />,
    browser: <Browser browser={insurer.browser} />,
    links: <OfficialLinks items={linksFor(insurer)} />,
    contacts: (
      <Contacts
        items={contactsFor(insurer)}
        copy={copy}
        claimLimit={insurer.claim_copy_limit}
      />
    ),
    payments: <Payments items={insurer.card_payment} />,
    systems: (
      <Systems items={insurer.systems} browser={insurer.browser} copy={copy} />
    ),
    tags: insurer.feature_tags?.length ? (
      insurer.feature_tags.map((tag, i) => (
        <span
          key={i}
          className="px-2 py-0.5 rounded-md bg-primary-soft border border-emerald-200 text-[10.5px] text-primary font-extrabold"
        >
          {tag.startsWith("#") ? tag : `#${tag}`}
        </span>
      ))
    ) : (
      <span className="text-[11px] text-[#8b95a1]">
        상품 정보 준비 중입니다.
      </span>
    ),
    notes: (
      <>
        {notes.length ? (
          notes.map((note, i) => <li key={i}>{note}</li>)
        ) : (
          <li>구비서류는 보험사 공식 청구 안내에서 확인해 주세요.</li>
        )}
        {insurer.notes.map((e, i) => (
          <li key={`other-${i}`}>
            <strong>{e.label}: </strong>
            {e.value}
          </li>
        ))}
      </>
    ),
    sources: sourcesFor(insurer).length ? (
      sourcesFor(insurer).map((s, i) => (
        <div
          key={i}
          className="p-2 rounded-lg border border-[#e6eaee] bg-white"
        >
          <strong>{s.label}</strong>
          <p className="mt-1 text-[#8b95a1]">
            <PortalLink
              href={s.source_url}
              className="text-primary hover:underline"
            >
              출처 확인 (새 창)
            </PortalLink>{" "}
            · {s.checked_at || "확인일 미등록"}
          </p>
        </div>
      ))
    ) : (
      <p>등록된 자료 출처가 없습니다.</p>
    ),
    lc: insurer.systems.find((s) => /\bLC\b|전속/i.test(s.link.label)),
    portal,
    portalLabel:
      portal && /GA|교차/i.test(portal.link.label)
        ? "GA/교차 전용 포털 바로가기"
        : "설계사 전산 바로가기",
    feedback: notice && (
      <Alert severity={notice.severity}>{notice.message}</Alert>
    ),
  };
  return (
    <Dialog
      open
      onClose={close}
      maxWidth={false}
      aria-labelledby="insurer-detail-title"
      slotProps={{
        paper: { className: "insurer-design insurer-reference-paper" },
      }}
    >
      <DetailReference vm={vm} />
    </Dialog>
  );
}
