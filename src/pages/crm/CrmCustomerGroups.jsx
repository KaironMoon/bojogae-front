/* eslint-disable react/prop-types */
import { useEffect, useId, useRef, useState } from "react";
import { Alert, Button, Checkbox, Dialog, ToggleButton, ToggleButtonGroup, useMediaQuery } from "@mui/material";
import { crmDelete, crmError, crmGet, crmPost, crmPut } from "@/services/crm-service";
import { CustomerField } from "./CustomerReference";
import { Pages, State, useCrm } from "./CrmShared";
import { GROUP_COLORS, GROUP_MEMBER_LIMIT, residentPrefix } from "./customer-group-options";
import { useCustomerSelection } from "./use-customer-selection";
import Icon from "./ContractDesignIcon";
import "./customer-group-studio.css";

const path = "/customer-groups";
const candidatesPath = `${path}/candidates/search`;
const searchExamples = ["김**, 보험고객", "퍼미션, 관악", "현대홈쇼핑, 지점장"];
const groupSorts = {
  updated_desc: "최근 수정순", created_desc: "최근 입력순", name_asc: "이름순", rrn_asc: "주민번호순",
};

function GroupColorField({ value, onChange, disabled, label }) {
  const options = value === "teal" ? { ...GROUP_COLORS, teal: "청록" } : GROUP_COLORS;
  return <CustomerField inputProps={{ "aria-label": label }} options={options} value={value} onChange={onChange} disabled={disabled} />;
}

const emptySearch = { q: "", logic: "AND", sort: "updated_desc", only_nonmembers: false };
const memberMap = customers => new Map(customers.map(customer => [customer.id, customer]));

function GroupDot({ color }) {
  return <span className="customer-popup-group-dot" data-group-color={color || "green"} aria-hidden="true" />;
}

function GroupEditor({ draft, setDraft, busy, setBusy, setError, confirmDelete, setConfirmDelete, onFilter, onDelete }) {
  const [query, setQuery] = useState(emptySearch);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(null);
  const ids = [...draft.members.keys()];
  const searchKey = JSON.stringify({ ...query, page, customer_ids: query.only_nonmembers ? ids : [] });
  const pageData = result?.key === searchKey ? result.data : null;
  const ready = !busy && !confirmDelete;
  useEffect(() => {
    let current = true;
    const timer = setTimeout(() => {
      crmPost(candidatesPath, JSON.parse(searchKey)).then(data => {
        if (current) setResult({ key: searchKey, data });
      }).catch(error => {
        if (current) setResult({ key: searchKey, error: crmError(error) });
      });
    }, 180);
    return () => { current = false; clearTimeout(timer); };
  }, [searchKey]);

  function updateSearch(patch) {
    setQuery(old => ({ ...old, ...patch }));
    setPage(1);
  }
  function updateMembers(members) {
    if (members.size > GROUP_MEMBER_LIMIT) {
      setError("한 그룹에는 고객을 최대 10,000명까지 등록할 수 있습니다.");
      return;
    }
    setError("");
    setDraft(old => ({ ...old, members }));
    if (query.only_nonmembers) setPage(1);
  }
  const items = pageData?.items ?? [];
  const candidates = new Map(items.map(c => [c.id, c]));
  const selection = useCustomerSelection(searchKey, ready ? items : [], ids, (next) => {
    const members = new Map();
    for (const id of next) {
      const customer = draft.members.get(id) || candidates.get(id);
      if (customer) members.set(id, customer);
    }
    updateMembers(members);
  });

  async function bulk(action) {
    setBusy(true);
    setError("");
    try {
      const { items } = await crmPost(candidatesPath, { ...query, customer_ids: ids, action });
      const members = new Map(draft.members);
      for (const customer of items) {
        if (action === "add") members.set(customer.id, customer);
        else members.delete(customer.id);
      }
      updateMembers(members);
    } catch (error) { setError(crmError(error)); }
    finally { setBusy(false); }
  }

  const memberCount = `${ids.length.toLocaleString()}명`;
  return <>
    <div className="customer-popup-group-editor-heading">
      <div className="group-editor-identity">
        <GroupDot color={draft.color} />
        <input aria-label="그룹 이름" maxLength={100} value={draft.name} disabled={!ready} onChange={e => setDraft(old => ({ ...old, name: e.target.value }))} />
        <span className="group-count">{memberCount}</span>
      </div>
      <div className="group-editor-actions">
        <GroupColorField label="그룹 색상" value={draft.color} disabled={!ready} onChange={color => setDraft(old => ({ ...old, color }))} />
        {draft.id && <Button disabled={!ready} onClick={onFilter}>이 그룹만 메인 보기</Button>}
        {draft.id && <Button className="group-delete" disabled={busy} onClick={() => confirmDelete ? onDelete() : setConfirmDelete(true)}>{confirmDelete ? "삭제 확인" : "그룹 삭제"}</Button>}
      </div>
    </div>
    {confirmDelete && <Alert severity="warning">이 그룹을 삭제할까요? 고객 정보는 유지됩니다.</Alert>}
    <section className="group-member-box" aria-label="소속 고객">
      <div className="group-studio-controls">
        <div className="group-member-heading"><Icon name="person" /><strong>선택된 그룹 소속 고객 상자</strong><span className="group-count">{memberCount}</span></div>
        <Button disabled={!ready || !ids.length} onClick={() => updateMembers(new Map())}>전체 비우기</Button>
      </div>
      {ids.length ? <div className="customer-selection-tray" aria-label="그룹 소속 고객 목록" tabIndex={0}>
        {[...draft.members.values()].map(c => <span className="group-member-chip" key={c.id}>
          <span className="group-member-initial" aria-hidden="true">{c.name?.slice(0, 1)}</span>
          <span>{c.name}{c.archived ? " (보관)" : ""}</span>
          {residentPrefix(c.resident_number) && <small>{residentPrefix(c.resident_number)}</small>}
          <button type="button" disabled={!ready} aria-label={`${c.name} 그룹에서 제외`} onClick={() => {
            const members = new Map(draft.members);
            members.delete(c.id);
            updateMembers(members);
          }}>×</button>
        </span>)}
      </div> : <p>소속 고객이 없습니다. 아래에서 검색 후 선택해 추가하세요.</p>}
    </section>
    <section className="group-search-box" aria-label="그룹 고객 검색">
      <div className="group-search-options">
        <div className="group-search-input">
          <Icon name="search" />
          <CustomerField inputProps={{ "aria-label": "추가할 고객 검색", maxLength: 200 }} placeholder="예: 김**, 보험고객 / 현대홈쇼핑, 지점장 / 760113-1" value={query.q} onChange={q => updateSearch({ q })} disabled={!ready} />
          <button type="button" aria-label="검색어 지우기" disabled={!ready || !query.q} onClick={() => updateSearch({ q: "" })}><Icon name="close" /></button>
        </div>
        <div className="group-search-filters">
          <ToggleButtonGroup exclusive value={query.logic} aria-label="검색 조건 조합" size="small" disabled={!ready} onChange={(_, logic) => { if (logic) updateSearch({ logic }); }}>
            <ToggleButton value="AND" aria-label="모든 조건 (AND)">AND</ToggleButton>
            <ToggleButton value="OR" aria-label="하나 이상 (OR)">OR</ToggleButton>
          </ToggleButtonGroup>
          <CustomerField inputProps={{ "aria-label": "검색 고객 정렬" }} value={query.sort} options={groupSorts} onChange={sort => updateSearch({ sort })} disabled={!ready} />
        </div>
      </div>
      <div className="group-studio-controls group-search-examples">
        <div>{searchExamples.map(q => <button key={q} type="button" disabled={!ready} onClick={() => updateSearch({ q, logic: "AND" })}>{q}</button>)}</div>
        <label><input type="checkbox" checked={query.only_nonmembers} disabled={!ready} onChange={e => updateSearch({ only_nonmembers: e.target.checked })} />미소속만</label>
      </div>
    </section>
    <section className="group-candidate-box" aria-label="그룹 고객 검색 결과">
      <div className="group-studio-controls group-results-heading">
        <strong aria-live="polite">검색 결과 <span>{pageData ? `${pageData.total.toLocaleString()}명` : "—"}</span></strong>
        <div>
          <Button className="group-bulk-add" disabled={!ready || !pageData?.total} onClick={() => bulk("add")}><Icon name="check" />검색 고객 전체 추가</Button>
          <Button className="group-bulk-remove" disabled={!ready || !pageData?.total || !ids.length || query.only_nonmembers} onClick={() => bulk("remove")}>일괄 제외</Button>
        </div>
      </div>
      <div className="group-candidate-list" aria-label="검색 고객">
        <State resource={{ loading: result?.key !== searchKey, error: result?.key === searchKey ? result.error : "" }} />
        {pageData?.total === 0 && <p>검색 조건에 일치하는 고객이 없습니다.</p>}
        {items.map(c => {
          const member = draft.members.has(c.id);
          return <div className="group-candidate-row" key={c.id} {...selection.row(c.id)} data-selected={member || undefined}>
            <Checkbox size="small" inputProps={{ "aria-label": `${c.name} 그룹 소속` }} disabled={!ready} checked={member} onChange={e => selection.change(c.id, e.target.checked, e.nativeEvent.shiftKey)} />
            {residentPrefix(c.resident_number) && <span className="customer-list-rrn">{residentPrefix(c.resident_number)}</span>}
            <strong>{c.name}</strong>{c.alias && <span className="group-candidate-alias" title={c.alias}>{c.alias}</span>}
            <span className="group-candidate-status">{member ? "소속됨 ✓" : "미소속"}</span>
          </div>;
        })}
      </div>
      <Pages data={pageData} onChange={setPage} />
    </section>
  </>;
}

export default function CrmCustomerGroups({ selectedCustomers, onClose, onFilter, onChanged }) {
  const titleId = useId();
  const mobile = useMediaQuery("(max-width: 1023px)");
  const groups = useCrm(path);
  const [pending, setPending] = useState(selectedCustomers);
  const [pane, setPane] = useState("groups");
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("green");
  const [draft, setDraft] = useState(null);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const panesRef = useRef(null);
  useEffect(() => {
    if (mobile && panesRef.current) panesRef.current.scrollTop = 0;
  }, [mobile, pane]);

  const dirty = draft && (draft.name !== draft.savedName || draft.color !== draft.savedColor ||
    draft.members.size !== draft.savedIds.size || [...draft.members.keys()].some(id => !draft.savedIds.has(id)));
  function allowDiscard() {
    return !dirty || window.confirm("저장하지 않은 변경사항이 있습니다. 변경사항을 버릴까요?");
  }
  function close() {
    if (!busy && allowDiscard()) onClose();
  }
  function asDraft(group, additional = []) {
    const members = memberMap(group.customers);
    const savedIds = new Set(members.keys());
    for (const customer of additional) if (!members.has(customer.id)) members.set(customer.id, customer);
    const color = group.color || "green";
    return { ...group, members, savedIds, color, savedColor: color, savedName: group.id ? group.name : "", stagedSelection: additional.length > 0 };
  }
  function showDraft(group) {
    setConfirmDelete(false);
    setDraft(group);
    setPane("members");
  }
  async function openEditor(id) {
    if (id === draft?.id) { setPane("members"); return; }
    if (!allowDiscard()) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const group = await crmGet(`${path}/${id}`);
      const withPending = asDraft(group, pending);
      if (withPending.members.size > GROUP_MEMBER_LIMIT) {
        setError("선택한 고객을 포함하면 10,000명을 초과합니다. 기존 소속을 먼저 줄이거나 다른 그룹을 선택해 주세요.");
        showDraft(asDraft(group));
      } else {
        showDraft(withPending);
      }
    } catch (e) { setError(crmError(e)); }
    finally { setBusy(false); }
  }
  function createDraft() {
    if (!newName.trim() || !allowDiscard()) return;
    setError(""); setNotice("");
    showDraft(asDraft({ name: newName.trim(), color: newColor, customers: [] }, pending));
  }
  async function save(remove = false) {
    if (busy || !draft || (!remove && (!draft.name.trim() || draft.members.size > GROUP_MEMBER_LIMIT))) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const groupPath = `${path}/${draft.id}`;
      const data = { name: draft.name.trim(), color: draft.color, customer_ids: [...draft.members.keys()] };
      if (remove) {
        await crmDelete(groupPath, { version: draft.version });
        setDraft(null);
        setPane("groups");
      } else {
        const saved = draft.id ? await crmPut(groupPath, { ...data, version: draft.version }) : await crmPost(path, data);
        if (!draft.id) setNewName("");
        setDraft(asDraft(saved));
        if (draft.stagedSelection) setPending([]);
      }
      setNotice(remove ? "고객 그룹을 삭제했습니다." : "고객 그룹을 저장했습니다.");
      setConfirmDelete(false);
      groups.reload();
      onChanged(remove ? draft.id : undefined);
    } catch (e) { setError(crmError(e)); }
    finally { setBusy(false); }
  }

  return <Dialog slotProps={{ paper: { className: "crm-customer-dialog crm-customer-groups-dialog" } }} open fullWidth maxWidth={false} aria-labelledby={titleId} onClose={close}>
    <header className="group-studio-header">
      <div className="group-studio-header-icon"><Icon name="folder" /></div>
      <div className="group-studio-heading">
        <div><h2 id={titleId}>스마트 고객 그룹 관리</h2><span>1,000명+ 다중선택</span></div>
        <p>그룹 생성·색상 지정부터 다중 조건(김**, 보험고객) 검색 및 일괄 추가·제외</p>
      </div>
      <button type="button" aria-label="스마트 고객 그룹 관리 닫기" onClick={close} disabled={busy}><Icon name="close" /></button>
    </header>
    {pending.length > 0 && !draft?.stagedSelection && <Alert className="group-studio-message" severity="info">선택한 고객 {pending.length}명입니다. 등록할 그룹을 선택하거나 새로 만드세요.</Alert>}
    {error && <Alert className="group-studio-message" severity="error">{error}</Alert>}
    {notice && <Alert className="group-studio-message" severity="success">{notice}</Alert>}
    {mobile && <div className="group-studio-tabs" role="group" aria-label="그룹 관리 화면">
      <Button aria-pressed={pane === "groups"} onClick={() => setPane("groups")}><Icon name="folder" />1. 그룹 선택·생성</Button>
      <Button aria-pressed={pane === "members"} disabled={!draft} onClick={() => setPane("members")}><Icon name="user_plus" />2. 멤버 검색·추가</Button>
    </div>}
    <div ref={panesRef} className="customer-popup-group-studio" data-pane={pane}>
      <aside>
        <div className="customer-popup-group-list-top">
          <div className="customer-popup-group-list-heading"><div><strong>내 고객 그룹 목록</strong><small>그룹 클릭 시 멤버 관리</small></div><span className="group-count">{groups.data?.items?.length ?? 0}개 그룹</span></div>
          <form className="customer-popup-group-create" onSubmit={e => { e.preventDefault(); createDraft(); }}>
            <strong><Icon name="folder_plus" />+ 새 그룹 만들기</strong>
            <CustomerField inputProps={{ "aria-label": "새 그룹 이름", maxLength: 100 }} placeholder="그룹명 입력 (예: 11월 암보험 리모델링)" value={newName} onChange={setNewName} disabled={busy} />
            <div><GroupColorField label="새 그룹 색상" value={newColor} onChange={setNewColor} disabled={busy} />
              <button type="submit" disabled={busy || !newName.trim()}>생성</button></div>
          </form>
          <State resource={groups} />
          <div className="customer-popup-group-list">{groups.data?.items?.map(group => <button type="button" key={group.id} disabled={busy} aria-pressed={draft?.id === group.id} onClick={() => openEditor(group.id)}><GroupDot color={group.color} /><strong>{group.name}</strong><small>{group.customer_count}명</small></button>)}</div>
        </div>
        <p className="customer-popup-group-help">💡 여기서 만든 그룹은 <strong>고객 그룹 필터 바</strong>와 <strong>보조개톡 발송 그룹</strong>에 연동됩니다.</p>
      </aside>
      <section className="group-studio-editor" aria-label="그룹 편집">
        {draft ? <GroupEditor key={draft.id ?? "new"} draft={draft} setDraft={setDraft} busy={busy} setBusy={setBusy} setError={setError}
          confirmDelete={confirmDelete} setConfirmDelete={setConfirmDelete} onDelete={() => save(true)}
          onFilter={() => { if (allowDiscard()) onFilter(draft.id); }} /> : <p>그룹을 선택하면 소속 고객을 확인하고 추가·제외할 수 있습니다.</p>}
        <footer className="group-studio-footer">
          <Button disabled={busy} onClick={close}>그룹 설정 완료</Button>
          {confirmDelete ? <Button disabled={busy} onClick={() => setConfirmDelete(false)}>삭제 취소</Button> :
            draft && <Button className="group-save" disabled={busy || !dirty || !draft.name.trim() || draft.members.size > GROUP_MEMBER_LIMIT} onClick={() => save()}><Icon name="save" />{busy ? "처리 중…" : "그룹 변경사항 저장"}</Button>}
        </footer>
      </section>
    </div>
  </Dialog>;
}
