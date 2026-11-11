/* eslint-disable react/prop-types */
import ContractDesignIcon from "./ContractDesignIcon";
import { useEffect, useState } from "react";
import { Alert, Button, Checkbox, Chip, Drawer, IconButton, Paper, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import { crmGet, crmPut, crmError, crmPost } from "@/services/crm-service";
import { CYCLES, PROGRESS, money } from "./crm-utils";
import "./crm-contracts.css";

const kinds = [
  ["waiver", "면책기간 종료 알림", "보장개시 +90일", "shield", "면책기간 확인", "면책기간(90일) 종료 임박", "보장개시일 입력 시 자동계산"],
  ["reduction", "감액기간 종료 알림", "성립일 +1~2년", "sparkles", "감액기간 확인", "감액기간(1~2년) 종료 임박", "계약성립일 입력 시 자동계산"],
  ["insurance_age", "상령일 도래 알림", "생일 +6개월", "trend", "보장 점검 참고", "상령일 도래 계약", "생년월일 입력 시 자동계산"],
  ["birthday", "생일 · 기념일", "생년월일 기준", "cake", "고객 연락 참고", "생일·계약 기념일", "생년월일 또는 계약성립일 입력 시 자동계산"],
];

export function ContractReminderFilters({ selected, counts, onChange, loading, viewControl }) {
  return <section aria-labelledby="crm-reminder-title" className="crm-reminder-section">
    <Typography component="h2" id="crm-reminder-title" className="crm-contract-sr-only">고객 연락 참고일</Typography>
    <div className="crm-reminder-grid">
      {kinds.map(([key, label, rule, icon, hint]) => <button className={`crm-reminder-filter crm-reminder-filter--${key}`}
        type="button" key={key} aria-pressed={selected === key} onClick={() => onChange(selected === key ? "" : key)}>
        <span className="crm-reminder-filter-copy">
          <span className="crm-reminder-filter-label"><span>{rule}</span><strong>{label}</strong></span>
          <span className="crm-reminder-filter-count"><b>{loading || counts?.[key] == null ? "—" : `${counts[key]}건`}</b><small>({hint})</small></span>
        </span>
        <span className="crm-reminder-filter-icon"><ContractDesignIcon name={icon} /></span>
      </button>)}
    </div>
    <div className="crm-reminder-toolbar">
      <div role="group" aria-label="알림 종류 빠른 필터">
        <button type="button" onClick={() => onChange("")} aria-pressed={!selected}>전체 등록 계약</button>
        {kinds.map(([key, , , icon, , label]) => <button type="button" key={key}
          onClick={() => onChange(key)} aria-pressed={selected === key}><span aria-hidden="true">{({ shield: "🛡️", sparkles: "🎉", trend: "📈", cake: "🎂" })[icon]}</span>{label}</button>)}
      </div>
      {viewControl}
    </div>
    <Typography variant="caption" color="text.secondary">오늘부터 30일 이내 계약 기준 · 면책·감액 참고일은 상품별 약관과 증권에서 확인해 주세요.</Typography>
  </section>;
}

function EventList({ events }) {
  return <ul className="crm-reminder-events">
    {events.map((event, index) => <li key={`${event.kind}-${event.date}-${index}`} className={`crm-reminder-event crm-reminder-event--${event.kind}`}>
      <ContractDesignIcon name={kinds.find(([key]) => key === event.kind)?.[3] || "bell"} /><span>{event.label}{event.person && ` · ${event.person}`}</span><time dateTime={event.date}>{event.date}</time>
    </li>)}
  </ul>;
}

export function ContractReminderPreview({ establishmentDate, coverageStart, parties }) {
  const holder = parties.find(party => party.role === "HOLDER");
  const draft = {
    establishment_date: establishmentDate || null,
    coverage_start: coverageStart || null,
    parties: parties.flatMap(party => {
      const prefix = (party.same_as_holder ? holder : party)?.resident_number?.trim();
      return prefix && /^[0-9]{6}(?:-?[0-9]?)?$/.test(prefix)
        ? [{ role: party.role, resident_number: prefix }] : [];
    }),
  };
  const request = draft.establishment_date || draft.coverage_start || draft.parties.length ? JSON.stringify(draft) : "";
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!request) return undefined;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const data = await crmPost("/contracts/reminder-preview", JSON.parse(request), { signal: controller.signal });
        if (!controller.signal.aborted) setResult({ request, items: data.items });
      } catch {
        if (!controller.signal.aborted) setResult({ request, error: true });
      }
    }, 220);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [request]);

  const latest = request && result?.request === request ? result : null;
  return <section className="crm-reminder-preview" aria-labelledby="crm-reminder-preview-title" aria-live="polite">
    <Typography component="h3" className="crm-contract-sr-only" id="crm-reminder-preview-title" fontWeight={850}>알림 참고일 미리보기</Typography>
    {request && !latest && <p>참고일을 계산하고 있습니다.</p>}
    {latest?.error && <p>참고일을 불러오지 못했습니다. 입력을 확인해 주세요.</p>}
    <div className="crm-reminder-preview-grid">
      {kinds.map(([key, , , , , , prompt]) => {
        const events = latest?.items?.filter(event => event.kind === key) || [];
        return <div className={`crm-reminder-preview-tile crm-reminder-filter--${key}`} key={key}>
          <strong>{({ waiver: "🛡️ 면책기간(90일) 종료 참고일", reduction: "🎉 1년/2년 감액기간 종료일", insurance_age: "📈 매년 상령일 (생일+6개월)", birthday: "🎂 고객 생일 알림" })[key]}</strong>
          {events.length ? <EventList events={events} /> : <p>{prompt}</p>}
        </div>;
      })}
    </div>
    <Typography variant="caption">실제 보장 적용 여부와 날짜는 약관과 증권을 확인해 주세요.</Typography>
  </section>;
}

export function ContractReminderDetails({ events }) {
  return <Paper component="section" aria-labelledby="crm-contract-reminder-details" variant="outlined" sx={{ p: 2 }}>
    <Typography component="h2" id="crm-contract-reminder-details" fontWeight={850}>고객 연락 참고일</Typography>
    {events?.length ? <EventList events={events} /> : <Typography variant="body2" color="text.secondary" my={1}>계산할 수 있는 참고일이 없습니다.</Typography>}
    <Alert severity="info">면책·감액 참고일은 약관과 증권에서 확인해 주세요.</Alert>
  </Paper>;
}

const reminderHelp = {
  waiver: "면책기간 종료 여부와 날짜를 약관에서 확인할 참고일입니다.",
  reduction: "감액 적용 기간과 종료 조건을 약관에서 확인할 참고일입니다.",
  insurance_age: "보험나이 변경 전 보장을 점검할 참고일입니다.",
  birthday: "계약 관계자의 생일이나 계약 기념일을 챙길 참고일입니다.",
};

export function ContractReminderDrawer(props) {
  return props.contract ? <ContractDrawerContent key={`${props.contract.id}-${props.contract.version}`} {...props} /> : null;
}

function ContractDrawerContent({ contract, onClose, onSchedule, onPrevious, onNext, onArchive, onEdit, onSaved }) {
  const [loaded, setLoaded] = useState(null);
  const [draft, setDraft] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    crmGet(`/contracts/${contract.id}`).then(data => {
      if (!active) return;
      setLoaded(data);
      setDraft({ coverage_start: data.coverage_start || "", coverage_note: data.coverage_note || "" });
    }).catch(e => { if (active) setError(crmError(e)); });
    return () => { active = false; };
  }, [contract.id]);
  async function save() {
    if (!loaded || !draft || busy) return;
    setBusy(true); setError("");
    try {
      const keys = ["origin", "insurer", "product", "category", "policy_number", "parties", "premium", "payment_cycle", "application_date", "establishment_date", "coverage_start", "coverage_end", "payment_end", "payment_period", "period_note", "coverage_note", "progress", "maintenance", "information_source", "verified", "verified_date", "version"];
      const data = Object.fromEntries(keys.filter(key => loaded[key] !== undefined).map(key => [key, loaded[key]]));
      await crmPut(`/contracts/${contract.id}`, { ...data, ...draft, coverage_start: draft.coverage_start || null });
      onSaved();
    } catch (e) { setError(crmError(e)); } finally { setBusy(false); }
  }
  const parties = contract.parties || [];
  const reminders = contract.reminders || [];
  const canSchedule = !contract.archived && parties.some(party => party.customer_id);
  const fields = [
    ["월 보험료", contract.premium_monthly == null ? "미확인" : `${money(contract.premium_monthly)}원`],
    ["납입 주기", CYCLES[contract.payment_cycle] || "미확인"],
    ["납입·보장 기간", [contract.payment_period, contract.period_note].filter(Boolean).join(" · ") || "미확인"],
    ["계약 성립일", contract.establishment_date || "미확인"],
    ["보장 개시일", contract.coverage_start || "미확인"],
  ];
  return <Drawer anchor="right" open onClose={busy ? undefined : onClose} sx={{ zIndex: theme => theme.zIndex.modal }} slotProps={{
    paper: { className: "crm-contract-drawer", role: "dialog", "aria-modal": true, "aria-labelledby": "crm-contract-drawer-title" },
  }}>
    <header className="crm-contract-drawer-header">
      <span className="crm-contract-drawer-insurer">{contract.insurer}</span>
      <div className="crm-contract-drawer-heading">
        <div><Typography component="h2" id="crm-contract-drawer-title">{contract.product}</Typography>
          <span className="crm-contract-drawer-status">{PROGRESS[contract.progress] || (contract.origin === "NEW" ? "신규 진행 계약" : "기존 가입 보험")}</span></div>
        <p>증권번호 {contract.policy_number || "미확인"} · 계약 성립일 {contract.establishment_date || "미확인"}</p>
      </div>
      <div className="crm-contract-drawer-navigation">
        <IconButton disabled={busy || !onPrevious} onClick={onPrevious} aria-label="이전 계약"><ContractDesignIcon name="up" /></IconButton>
        <IconButton disabled={busy || !onNext} onClick={onNext} aria-label="다음 계약"><ContractDesignIcon name="down" /></IconButton>
        <IconButton disabled={busy} onClick={onClose} aria-label="계약 상세 닫기"><ContractDesignIcon name="close" /></IconButton>
      </div>
    </header>
    <div className="crm-contract-drawer-content">
      <section className="crm-contract-drawer-reminders" aria-labelledby="crm-contract-drawer-reminders">
        <div className="crm-contract-drawer-reminder-heading"><Typography component="h3" id="crm-contract-drawer-reminders"><ContractDesignIcon name="bell" />보조개 자동 산출 4대 고객 터치 일정</Typography><span>성립일 · 보장개시일 · 생년월일 기준</span></div>
        <div className="crm-contract-drawer-dates">
          {kinds.map(([key]) => {
            const events = reminders.filter(event => event.kind === key);
            return <article key={key} className={`crm-contract-drawer-date crm-reminder-filter--${key}`}>
              <h4>{({ waiver: "🛡️ 면책기간(90일) 종료일", reduction: "🎉 감액기간(1~2년) 종료일", insurance_age: "📈 피보험자 상령일 (생일+6개월)", birthday: "🎂 피보험자 생일 알림" })[key]}</h4>
              <div className="crm-contract-drawer-date-value">{events.length ? events.map((event, index) => <time key={`${event.date}-${index}`} dateTime={event.date} title={[event.label, event.person].filter(Boolean).join(" · ")}>{event.date}</time>) : "참고일 미확인"}</div>
              <p>{reminderHelp[key]}</p>
            </article>;
          })}
        </div>
        <p className="crm-contract-drawer-disclaimer">실제 면책·감액 적용 여부는 약관과 증권을 확인해 주세요.</p>
      </section>
      <div className="crm-contract-drawer-launchers">
        <Button className="crm-contract-drawer-launcher crm-contract-drawer-launcher--message" disabled startIcon={<ContractDesignIcon name="message" />}><span>면책·감액종료 카톡</span><small>준비중</small></Button>
        <Button className="crm-contract-drawer-launcher crm-contract-drawer-launcher--age" disabled startIcon={<ContractDesignIcon name="trend" />}><span>상령일 안내 카톡</span><small>준비중</small></Button>
        <Button className="crm-contract-drawer-launcher" onClick={onSchedule} disabled={!canSchedule} startIcon={<ContractDesignIcon name="calendar" />}>할 일·일정에 알림등록</Button>
      </div>
      <section className="crm-contract-drawer-summary" aria-labelledby="crm-contract-drawer-info">
        <Typography component="h3" id="crm-contract-drawer-info" className="crm-contract-sr-only">계약 정보</Typography>
        <div className="crm-contract-drawer-summary-grid">
          <div><span>계약자 / 피보험자</span>
            <p className="crm-contract-drawer-party-names"><strong>{parties.map(party => `${party.role === "HOLDER" ? "계약자" : "피보험자"}: ${party.name || (party.same_as_holder ? "계약자와 동일" : "미확인")}`).join(" · ")}</strong></p>
            <p className="crm-contract-drawer-party-contact">{(loaded?.parties || parties).find(party => party.role === "INSURED")?.phone || "연락처 미등록"}</p>
          </div>
          <div className="crm-contract-summary-premium"><span>월 보험료 · 납기/만기</span>
            <p><strong>월 {fields[0][1]} ({fields[1][1]})</strong></p><p>{fields[2][1]}</p>
          </div>
        </div>
      </section>
      <section className="crm-contract-drawer-editor" aria-label="계약 일자 및 보장 메모 수정">
        {error && <Alert severity="error">{error}</Alert>}
        {!draft && !error && <p role="status">계약 정보를 불러오는 중입니다.</p>}
        <div className="crm-contract-drawer-edit-dates">
          <label>계약 성립일 (감액기간 기준)<input type="date" readOnly value={loaded?.establishment_date || contract.establishment_date || ""} /></label>
          <label>보장 개시일 (면책기간 90일 기준)<input type="date" value={draft?.coverage_start || ""} disabled={!draft || busy || contract.archived} onChange={event => setDraft({ ...draft, coverage_start: event.target.value })} /></label>
        </div>
        <Button component={Link} to={`/crm/contracts/${contract.id}`} size="small" disabled={busy}>계약 성립일은 상태 변경에서 수정</Button>
        <label>주요 보장 · 특약 및 면책/감액 조건 메모<textarea rows={3} value={draft?.coverage_note || ""} disabled={!draft || busy || contract.archived} onChange={event => setDraft({ ...draft, coverage_note: event.target.value })} /></label>
        <Button onClick={onEdit} disabled={busy || contract.archived} size="small">보험 상품·관계자 등 전체 정보 수정</Button>
      </section>
    </div>
    <footer className="crm-contract-drawer-footer">
      <Button className="crm-contract-drawer-archive" onClick={onArchive} disabled={busy || contract.archived} startIcon={<ContractDesignIcon name="archive" />}>계약 보관 처리</Button>
      <Button onClick={onClose} disabled={busy} variant="outlined">닫기</Button>
      <Button className="crm-contract-drawer-edit" onClick={save} disabled={!draft || busy || contract.archived} variant="contained" startIcon={<ContractDesignIcon name="check" />}>{busy ? "저장 중…" : "변경사항 저장"}</Button>
    </footer>
  </Drawer>;
}

export function ContractListEntry({ contract, selected, onSchedule, onDetails, checked, onCheck }) {
  const dates = contract.reminders || [];
  const birthday = dates.find(event => event.label === "생일");
  const anniversary = dates.find(event => event.label === "계약 기념일");
  const insuranceAge = dates.find(event => event.kind === "insurance_age");
  const personalDates = [
    selected === "birthday" ? dates.find(event => event.kind === "birthday") : birthday || anniversary,
    insuranceAge,
  ].filter(Boolean);
  const coverageDates = dates.filter(event => event.kind === "waiver" || event.kind === "reduction");
  const coverageMatches = coverageDates.filter(event => event.kind === selected);
  const parties = contract.parties || [];
  const insured = parties.filter(party => party.role === "INSURED");
  const names = [...new Set(insured.map(party => party.name).filter(Boolean))];
  const linked = [...insured, ...parties].some(party => party.customer_id);
  return <Paper component="article" variant="outlined" className="crm-contract-entry" data-selected={checked || undefined}>
    <div className="crm-contract-entry-name">
      {onCheck && <Checkbox size="small" checked={checked} onChange={event => onCheck(event.target.checked)}
        slotProps={{ input: { "aria-label": `${contract.insurer} ${contract.product} 계약 선택` } }} />}
      <div className="crm-contract-entry-identity"><div className="crm-contract-entry-badges"><Chip size="small" className={contract.origin === "NEW" ? "crm-contract-origin-new" : "crm-contract-origin-existing"} label={contract.origin === "NEW" ? "신규청약" : "기존가입"} />
        <span>{contract.insurer}</span></div>
        <div className="crm-contract-entry-product"><Typography component="h3" fontWeight={850}><button type="button" onClick={onDetails} title={contract.product}>{contract.product}</button></Typography>
        <Typography className="crm-contract-entry-policy" variant="body2">{contract.policy_number ? `증권 #${contract.policy_number}` : "증권번호 미확인"}</Typography></div>
      </div>
    </div>
    <div className="crm-contract-entry-person">
      <Typography variant="body2" fontWeight={750}>{names.join(", ") || "피보험자 미확인"} <small>(계약: {parties.find(party => party.role === "HOLDER")?.name || "미확인"})</small></Typography>
      {personalDates.length > 0 && <EventList events={personalDates.slice(0, 2)} />}
    </div>
    <div className="crm-contract-entry-premium">
      <Typography variant="body2" fontWeight={750}>월 {contract.premium_monthly == null ? "보험료 미확인" : `${money(contract.premium_monthly)}원`}</Typography>
      <Typography variant="caption" color="text.secondary">성립일 · {contract.establishment_date || "미확인"}</Typography>
    </div>
    <div>{coverageDates.length ? <EventList events={(coverageMatches.length ? coverageMatches : coverageDates).slice(0, 3)} />
      : <Typography variant="body2" color="text.secondary">면책·감액 참고일 미확인</Typography>}</div>
    <div className="crm-contract-entry-actions">
      <Button onClick={onDetails} variant="outlined" size="small" startIcon={<ContractDesignIcon name="bell" />}>상세·알림일</Button>
      <Button onClick={onSchedule} disabled={contract.archived || !linked} size="small" startIcon={<ContractDesignIcon name="calendar" />}>일정 등록</Button>
    </div>
  </Paper>;
}
