import {
  ciColor,
  contactsFor,
  linksFor,
  portalFor,
  kindLabel,
  sourcesFor,
} from "../insurer-directory";
export function cardData(raw, fav) {
  const contacts = contactsFor(raw),
    links = linksFor(raw),
    portal = portalFor(raw);
  return {
    raw,
    fav,
    ciColor: ciColor(raw),
    name: raw.name,
    fullName: raw.name,
    callCenter: contacts[0].value || "미확인",
    incallMonitor: contacts[1].value,
    agentDesk: contacts[2].value || "미확인",
    claimFax: contacts[3].value || "미확인",
    cardType: raw.card_payment.find((e) => e.label === "구분")?.value,
    portalName: portal?.link.label || "전산 정보 준비 중",
    portalUrl: portal?.link.url,
    homeUrl: links[0].url,
    claimGuideUrl: links[1].url,
    disclosureUrl: links[2].url,
    claimFormUrl: links[3].url,
    browserLabel:
      raw.browser?.icons?.map((i) => i.name).join(" · ") || "브라우저 미확인",
  };
}
export function fullInformation(insurer) {
  const rows = (entries, field) =>
    entries.map((e) => `${e.label}: ${e[field] || "미확인"}`).join("\n");
  return [
    `${insurer.name} · ${kindLabel[insurer.kind]}`,
    insurer.browser?.value,
    rows(linksFor(insurer), "url"),
    rows(contactsFor(insurer), "value"),
    rows(insurer.card_payment, "value"),
    ...insurer.systems.map((s) =>
      [
        `${s.link.label}: ${s.link.url}`,
        `지원 브라우저: ${(s.browser || insurer.browser)?.value || "미확인"}`,
        `보안·필수 프로그램: ${s.security_program?.value || "미확인"}`,
        `로그인·이용 권한: ${s.login?.value || "미확인"}`,
      ].join("\n"),
    ),
    rows(insurer.notes, "value"),
    insurer.claim_copy_limit,
    insurer.esign_cutoff_time,
    (insurer.feature_tags || []).join(", "),
    ...(insurer.claim_notes || []),
    insurer.uw_tip,
    ...sourcesFor(insurer).map(
      (s) => `${s.label}: ${s.source_url} (${s.checked_at})`,
    ),
  ]
    .filter(Boolean)
    .join("\n\n");
}
