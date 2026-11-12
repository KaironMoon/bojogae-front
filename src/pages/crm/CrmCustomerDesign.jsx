import { customerAddressDisplay } from "./customer-address-display";
import { CustomerField } from "./CustomerReference";
/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import { Alert, Button, Checkbox, Drawer } from "@mui/material";
import { Link } from "react-router-dom";
import Icon from "./ContractDesignIcon";
import { Directions, LocationFields } from "./CrmShared";
import { customerDefaults } from "./customer-defaults";
import { STAGES, METHODS, RESULTS, MAINTENANCE, CYCLES, money, dateTime, formatPhone } from "./crm-utils";
import { crmGet, crmPut, crmPost, crmError } from "@/services/crm-service";
import "./crm-customers.css";
import "./customer-popup-reference.css";

export function CustomerConsultationTimeline({ items = [] }) {
  return <div className="crm-customer-timeline" aria-label="최근 상담 내역">
    {!items.length && <p className="crm-customer-timeline-empty">등록된 상담 이력이 없습니다.</p>}
    {items.map(h => <article className="crm-customer-timeline-item" key={h.id}>
      <span className="crm-customer-timeline-dot" aria-hidden="true" />
      <div className="crm-customer-timeline-content"><p>{h.content}</p><small>{[METHODS[h.method], RESULTS[h.result]].filter(Boolean).join(" · ")}</small>{h.contract_id && <Link to={`/crm/contracts/${h.contract_id}`}>관련 계약</Link>}</div>
      <time dateTime={h.occurred_at}>{dateTime(h.occurred_at)}</time>
    </article>)}
  </div>;
}

export function CustomerContractPreview({ contracts, customerId }) {
  return <div className="crm-customer-contract-preview">
    {!contracts?.total && <p className="crm-customer-timeline-empty">연결된 보험 계약이 없습니다.</p>}
    {contracts?.items?.slice(0, 5).map(c => <Link className="crm-customer-contract-item" key={c.id} to={`/crm/contracts/${c.id}`}>
      <div><small>{c.insurer}</small><strong>{c.product || "상품명 미등록"}</strong><span>{c.premium == null ? "보험료 미확인" : `${money(c.premium)}원`} · {CYCLES[c.payment_cycle] || "납입주기 미확인"}</span></div>
      <span className="crm-customer-contract-status">{MAINTENANCE[c.maintenance] || "유지 상태 미확인"}</span>
    </Link>)}
    <Link className="crm-customer-contract-all" to={`/crm/contracts?customer_id=${customerId}`}>전체 연결 계약 보기{contracts?.total != null && ` (${contracts.total}건)`}</Link>
  </div>;
}

export function CustomerDesignRow({ customer: c, checked, onCheck, onDetails }) {
  const address = customerAddressDisplay(c);
  const [copyStatus, setCopyStatus] = useState("");
  const detail = event => { if (!event.metaKey && !event.ctrlKey && !event.shiftKey && event.button === 0) { event.preventDefault(); onDetails(); } };
  return <article className="crm-customer-row" data-selected={checked || undefined}>
    <div className="crm-customer-row-name">
      {onCheck && <Checkbox size="small" checked={checked} onChange={e => onCheck(e.target.checked)} inputProps={{ "aria-label": `${c.name} 고객 선택` }} />}
      <span className="crm-customer-avatar">{c.name?.slice(0, 1)}</span><div>
        <Link to={`/crm/customers/${c.id}`} onClick={detail}>{c.name}{c.alias && <span> ({c.alias})</span>}</Link>
        {c.memo && <small className="crm-customer-row-memo" title={c.memo}>{c.memo}</small>}
      </div>
    </div>
    <div className="crm-customer-row-tags"><span className={`crm-customer-stage crm-customer-stage--${c.stage}`}>{STAGES[c.stage] || "미확인"}</span>{c.do_not_contact && <span className="crm-customer-stop">연락 중단</span>}{c.groups?.map(group => <span className="crm-customer-membership" key={group.id}>{group.name}</span>)}</div>
    <div className="crm-customer-row-contact">{c.phone ? <button type="button" className="crm-customer-row-phone" title="클릭하여 전화번호 복사" onClick={async () => { try { await navigator.clipboard.writeText(formatPhone(c.phone)); setCopyStatus("전화번호를 복사했습니다."); } catch { setCopyStatus("전화번호를 복사하지 못했습니다."); } }}><Icon name="phone" />{formatPhone(c.phone)}</button> : <small>연락처 미등록</small>}{copyStatus && <small role="status">{copyStatus}</small>}{c.location?.address && <small title={c.location.address}>{c.location.address}</small>}{address.state !== "confirmed" && <button type="button" className="crm-customer-address-status" data-state={address.state} onClick={onDetails}>{address.label}</button>}</div>
    <div className="crm-customer-row-history">최근 상담 {dateTime(c.last_contact_at)} · <strong>계약 {c.contract_count || 0}건 (유지 {c.active_contract_count || 0}건)</strong></div>
    <div className="crm-customer-row-actions"><Button component={Link} to={`/crm/customers/${c.id}`} onClick={detail}>상세</Button><Directions location={c.location || {}} /></div>
  </article>;
}

export function CustomerDesignDrawer(props) {
  return props.customer ? <CustomerDrawerContent key={props.customer.id} {...props} /> : null;
}
function CustomerDrawerContent({ customer, onClose, onSaved, onDelete, onPrevious, onNext }) {
  const [data, setData] = useState(null);
  const [version, setVersion] = useState(null);
  const [savedAddress, setSavedAddress] = useState(customer);
  const [groups, setGroups] = useState([]);
  const [history, setHistory] = useState([]);
  const [contracts, setContracts] = useState(null);
  const [method, setMethod] = useState("PHONE");
  const [result, setResult] = useState("CONNECTED");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    crmGet(`/customers/${customer.id}`).then(c => {
      if (!active) return;
      setData(Object.fromEntries(Object.entries(customerDefaults).map(([key, fallback]) => [key, c[key] ?? fallback])));
      setSavedAddress(c);
      setVersion(c.version); setHistory(c.consultations || []); setContracts(c.contracts);
    }).catch(e => { if (active) setError(crmError(e)); });
    crmGet('/customer-groups').then(async result => Promise.all(result.items.map(g => crmGet(`/customer-groups/${g.id}`)))).then(items => { if (active) setGroups(items); }).catch(e => { if (active) setError(crmError(e)); });
    return () => { active = false; };
  }, [customer.id]);
  const set = (key, value) => setData(old => ({ ...old, [key]: value, ...(key === "birth_raw" ? { birth_date: null, birth_century: null } : {}) }));
  async function run(action) { setBusy(true); setError(""); try { await action(); } catch (e) { setError(crmError(e)); } finally { setBusy(false); } }
  const save = () => run(async () => { await crmPut(`/customers/${customer.id}`, { ...data, version }); onSaved(); });
  const toggleGroup = group => run(async () => {
    const ids = group.customers.map(c => c.id);
    await crmPut(`/customer-groups/${group.id}`, { name: group.name, version: group.version, customer_ids: ids.includes(customer.id) ? ids.filter(id => id !== customer.id) : [...ids, customer.id] });
    const updated = await crmGet(`/customer-groups/${group.id}`);
    setGroups(old => old.map(g => g.id === group.id ? updated : g));
  });
  const addNote = () => run(async () => {
    await crmPost(`/customers/${customer.id}/consultations`, { occurred_at: new Date().toISOString(), method, result, content: note, contract_id: null });
    const updated = await crmGet(`/customers/${customer.id}`); setHistory(updated.consultations || []); setNote("");
  });
  const address = data && JSON.stringify(data.location) !== JSON.stringify(savedAddress.location)
    ? { state: "pending", label: "주소 변경사항 저장 필요" }
    : customerAddressDisplay(savedAddress);
  return <Drawer sx={{ zIndex: theme => theme.zIndex.modal }} anchor="right" open onClose={busy ? undefined : onClose} slotProps={{ paper: { className: "crm-customer-drawer", role: "dialog", "aria-modal": true, "aria-labelledby": "customer-drawer-title" } }}>
    <header className="customer-popup-drawer-header">
      <div className="customer-popup-customer-heading">
        <span className="crm-customer-avatar">{customer.name?.slice(0, 1)}</span>
        <div><div className="customer-popup-title-line"><h2 id="customer-drawer-title">{customer.name}{customer.alias && ` (${customer.alias})`}</h2><span className="crm-customer-drawer-stage">{STAGES[data?.stage || customer.stage]}</span></div><p>/crm/customers/{customer.id} · 고객 상세 워크스페이스</p></div>
      </div>
      <nav><button type="button" disabled={busy || !onPrevious} onClick={onPrevious} aria-label="이전 고객"><Icon name="up" /></button><button type="button" disabled={busy || !onNext} onClick={onNext} aria-label="다음 고객"><Icon name="down" /></button><button type="button" disabled={busy} onClick={onClose} aria-label="고객 상세 닫기"><Icon name="close" /></button></nav>
    </header>
    <div className="crm-customer-drawer-body">
      {error && <Alert severity="error">{error}</Alert>}
      <div className="customer-popup-launchers">
        <Link to="/proposals"><Icon name="sparkles" /><span>AI 보고서 생성</span></Link>
        <Link to="/claims/new"><Icon name="receipt" /><span>보험금 청구서</span></Link>
        <button type="button" disabled><Icon name="message" /><span>보조개톡 발송</span><small>준비중</small></button>
        <Directions label={<><Icon name="navigation" /><span>방문 길찾기</span></>} location={data?.location || customer.location || {}} />
      </div>
      <section><div className="customer-popup-section-heading"><h3><Icon name="folder" />소속 고객 그룹 (클릭하여 배정/해제)</h3><small>즉시 반영</small></div><div className="customer-popup-group-toggles">{groups.map(g => <button type="button" key={g.id} disabled={busy || customer.archived || !data} aria-pressed={g.customers.some(c => c.id === customer.id)} onClick={() => toggleGroup(g)}><span aria-hidden="true">●</span> {g.name} <span aria-hidden="true">{g.customers.some(c => c.id === customer.id) ? "✓" : "+"}</span></button>)}{!groups.length && <p>등록된 고객 그룹이 없습니다.</p>}</div></section>
      {!data ? <p role="status">고객 정보를 불러오는 중입니다.</p> : <>
        <section><div className="customer-popup-section-heading customer-popup-section-heading-lined"><h3><Icon name="user_check" />기본 인적사항 · 연락처 · 상담단계 수정</h3><small>수정 후 하단 [저장] 클릭</small></div><div className="crm-customer-form-grid crm-customer-identity-grid">
          <CustomerField label="고객명" required value={data.name} onChange={v => set('name', v)} /><CustomerField label="카톡대화명 (보조개톡 매칭용)" value={data.alias} inputProps={{ maxLength: 20 }} onChange={v => set('alias', v)} /><CustomerField label="연락처" value={formatPhone(data.phone)} onChange={v => set('phone', v)} /><CustomerField label="상담 단계" options={STAGES} value={data.stage} onChange={v => set('stage', v)} />
          <CustomerField label="직업 / 상해급수 메모" value={data.occupation} onChange={v => set('occupation', v)} /><CustomerField label="생년월일" placeholder="19850307" value={data.birth_raw} onChange={v => set('birth_raw', v)} />
          <CustomerField label="주민번호 앞 7자리" placeholder="850307-1" value={data.resident_number} inputProps={{ maxLength: 8 }} onChange={v => { set('resident_number', v); set('resident_number_manual', true); }} /><CustomerField label="상담 참고 월 보험료" placeholder="예: 월 25만원" value={data.premium_note} onChange={v => set('premium_note', v)} />
        </div></section>
        <section><div className="customer-popup-section-heading"><h3><Icon name="pin" />방문 주소 및 길찾기 좌표 설정</h3><span className="crm-customer-address-status" data-state={address.state}>{address.label}</span></div><LocationFields customerDesign compact value={data.location} onChange={v => set('location', v)} /><div className="crm-customer-form-grid"><CustomerField inputProps={{ "aria-label": "통화 가능 시간" }} placeholder="예: 평일 12~1시" value={data.call_preference} onChange={v => set('call_preference', v)} /><CustomerField inputProps={{ "aria-label": "방문 가능 시간" }} placeholder="예: 목요일 오후" value={data.visit_preference} onChange={v => set('visit_preference', v)} /></div></section>
        <section><div className="customer-popup-section-heading"><h3><Icon name="message_plus" />상담 메모 및 최근 상담 이력</h3><small>최근 상담: {dateTime(history[0]?.occurred_at)}</small></div><details className="customer-ref-consultation-options"><summary>상담 방식·결과: {METHODS[method]} · {RESULTS[result]}</summary><div className="crm-customer-form-grid"><CustomerField label="상담 방식" options={METHODS} value={method} onChange={setMethod} /><CustomerField label="상담 결과" options={RESULTS} value={result} onChange={setResult} /></div></details><div className="crm-customer-note"><CustomerField multiline minRows={2} inputProps={{ "aria-label": "새 상담 내용" }} placeholder="새로운 상담 내용이나 보장 리모델링 포인트를 입력해 주세요." value={note} onChange={setNote} /><button type="button" disabled={busy || customer.archived || !note.trim()} onClick={addNote}>상담 일지<br />추가</button></div><CustomerConsultationTimeline items={history} /></section>
        <section><h3><Icon name="clipboard" />보유 보험 계약<small>{contracts?.total ?? 0}건</small></h3><CustomerContractPreview contracts={contracts} customerId={customer.id} /></section>
      </>}
      <Button component={Link} to={`/crm/customers/${customer.id}`}>전체 고객 상세</Button>
    </div>
    <footer className="customer-popup-drawer-footer"><button type="button" disabled={busy} onClick={onDelete} className="customer-popup-delete"><Icon name="trash" />고객 삭제</button><div><button type="button" disabled={busy} onClick={onClose}>닫기</button><button type="button" disabled={busy || customer.archived || !data || !data.name.trim()} onClick={save} className="customer-popup-primary"><Icon name="check" />{busy ? "처리 중…" : "변경사항 저장"}</button></div></footer>
  </Drawer>;
}
