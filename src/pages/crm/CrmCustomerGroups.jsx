import { CustomerField, CustomerPopupHeader } from "./CustomerReference";
import "./crm-customers.css";
import "./customer-popup-reference.css";
/* eslint-disable react/prop-types */
import Icon from "./ContractDesignIcon";
import { useState } from "react";
import { Alert, Dialog } from "@mui/material";
import { crmDelete, crmError, crmGet, crmPost, crmPut } from "@/services/crm-service";
import { State, useCrm } from "./CrmShared";

const path = "/customer-groups";

export default function CrmCustomerGroups({ selectedCustomers, onClose, onFilter }) {
  const groups = useCrm(path);
  const [memberQuery, setMemberQuery] = useState("");
  const [memberId, setMemberId] = useState("");
  const members = useCrm("/customers", { q: memberQuery, page_size: 100 });
  const [pending, setPending] = useState(selectedCustomers);
  const [newName, setNewName] = useState("");
  const [draft, setDraft] = useState(null);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function createGroup() {
    if (!newName.trim() || busy) return;
    setBusy(true); setError("");
    try {
      const created = await crmPost(path, { name: newName.trim(), customer_ids: [] });
      setDraft(created); setNewName(""); setConfirmDelete(false); groups.reload();
    } catch (e) { setError(crmError(e)); }
    finally { setBusy(false); }
  }

  async function openEditor(id) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const group = id ? await crmGet(`${path}/${id}`) : { name: "", customers: [] };
      const customers = new Map(group.customers.map((customer) => [customer.id, customer]));
      for (const customer of pending) {
        if (!customers.has(customer.id)) customers.set(customer.id, customer);
      }
      setDraft({ ...group, customers: [...customers.values()] });
    } catch (e) {
      setError(crmError(e));
    } finally {
      setBusy(false);
    }
  }

  async function save(remove = false) {
    setBusy(true);
    setError("");
    try {
      const groupPath = `${path}/${draft.id}`;
      const data = { name: draft.name.trim(), customer_ids: draft.customers.map((customer) => customer.id) };
      if (remove) await crmDelete(groupPath, { version: draft.version });
      else if (draft.id) await crmPut(groupPath, { ...data, version: draft.version });
      else await crmPost(path, data);
      if (!remove) setPending([]);
      setNotice(remove ? "고객 그룹을 삭제했습니다." : "고객 그룹을 저장했습니다.");
      setDraft(null);
      setConfirmDelete(false);
      groups.reload();
    } catch (e) {
      setError(crmError(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog slotProps={{ paper: { className: "crm-customer-dialog crm-customer-groups-dialog" } }} open fullWidth maxWidth="md" onClose={busy ? undefined : onClose}>
      <CustomerPopupHeader title="스마트 고객 그룹 관리 (2-Pane Group Studio)" icon="folder" badge description="그룹 생성·색상 지정·이름 변경부터 소속 고객 추가/제외까지 한 화면에서 즉시 관리하세요." busy={busy} onClose={onClose} />
      <form className="customer-popup-group-studio" onSubmit={event => { event.preventDefault(); if (draft && !busy && !confirmDelete && draft.name.trim()) save(); }}>
        <aside>
          <div className="customer-popup-group-list-top"><div className="customer-popup-group-list-heading"><strong>내 고객 그룹 목록</strong><small>클릭하여 우측에서 멤버 관리</small></div>
            <div className="customer-popup-group-create"><strong>+ 새 그룹 만들기</strong><div>
              <CustomerField inputProps={{ "aria-label": "새 그룹 이름", maxLength: 100 }} placeholder="그룹명 입력 (예: 11월 암보험 리모델링)" value={newName} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); createGroup(); } }} onChange={setNewName} disabled={busy} />
              <select aria-label="새 그룹 색상" disabled defaultValue="pending"><option value="pending">색상 준비중</option></select>
              <button type="button" disabled={busy || !newName.trim()} onClick={createGroup}>생성</button>
            </div></div>
            <State resource={groups} />
            <div className="customer-popup-group-list">{groups.data?.items.map(group => <button type="button" key={group.id} disabled={busy} aria-pressed={draft?.id === group.id} onClick={() => { setConfirmDelete(false); setMemberId(""); openEditor(group.id); }}><span className="customer-popup-group-dot" /><strong>{group.name}</strong><small>{group.customer_count}명</small></button>)}</div>
          </div>
          <p className="customer-popup-group-help">💡 여기서 만든 그룹은 상단 <strong>그룹 빠른 필터 바</strong>와 <strong>보조개톡 카톡 일괄발송 그룹</strong>에 즉시 연동됩니다.</p>
        </aside>
        <main>
          <div className="customer-popup-group-main-content">
            {error && <Alert severity="error">{error}</Alert>}
            {notice && <Alert severity="success">{notice}</Alert>}
            {draft ? <>
              <div className="customer-popup-group-editor-heading"><div><span className="customer-popup-group-dot" /><input aria-label="그룹 이름" required maxLength={100} value={draft.name} disabled={busy || confirmDelete} onChange={e => setDraft({ ...draft, name: e.target.value })} /><span className="customer-popup-group-count">{draft.customers.length}명</span></div><div className="customer-popup-group-editor-actions">
                {draft.id && onFilter && <button type="button" disabled={busy || confirmDelete} onClick={() => onFilter(draft.id)}>이 그룹만 메인에서 보기</button>}
                {draft.id && <button type="button" className="customer-popup-group-delete" disabled={busy} onClick={() => confirmDelete ? save(true) : setConfirmDelete(true)}>{confirmDelete ? "삭제 확인" : "그룹 삭제"}</button>}
              </div></div>
              <details className="customer-popup-member-search"><summary>추가할 고객 검색</summary><CustomerField inputProps={{ "aria-label": "추가할 고객 검색" }} placeholder="고객명 또는 연락처 검색" value={memberQuery} onChange={setMemberQuery} disabled={busy || confirmDelete} /></details>
              <div className="customer-popup-group-add"><div><Icon name="user_plus" /><select aria-label="이 그룹에 추가할 고객" value={memberId} disabled={busy || confirmDelete || members.loading} onChange={e => setMemberId(e.target.value)}><option value="">{members.loading ? "고객 불러오는 중…" : "고객을 선택하세요"}</option>{members.data?.items.filter(c => !draft.customers.some(member => member.id === c.id)).map(c => <option key={c.id} value={c.id}>{c.name}{c.alias && ` (${c.alias})`}</option>)}</select></div><button type="button" disabled={busy || confirmDelete || !memberId} onClick={async () => { const id = Number(memberId); if (!id || draft.customers.some(c => c.id === id)) return; setBusy(true); try { const customer = await crmGet(`/customers/${id}`); setDraft(old => ({ ...old, customers: [...old.customers, customer] })); setMemberId(""); } catch (e) { setError(crmError(e)); } finally { setBusy(false); } }}>+ 이 그룹에 고객 추가</button></div>
              {members.error && <Alert severity="error">고객 목록을 불러오지 못했습니다.</Alert>}
              <div className="customer-popup-group-members" aria-label="소속 고객">{draft.customers.map(customer => <div key={customer.id}><span className="customer-popup-member-avatar">{customer.name?.slice(0,1)}</span><div><strong>{customer.name}{customer.alias && <span> ({customer.alias})</span>}</strong>{customer.archived && <small>보관 고객</small>}</div><button type="button" disabled={busy || confirmDelete} aria-label={`${customer.name} 그룹에서 제외`} onClick={() => setDraft({ ...draft, customers: draft.customers.filter(member => member.id !== customer.id) })}>제외</button></div>)}{!draft.customers.length && <p>소속 고객이 없습니다. 위에서 고객을 검색하여 추가하세요.</p>}</div>
              {confirmDelete && <Alert severity="warning">이 그룹을 삭제할까요? 소속 고객 정보는 유지됩니다.</Alert>}
            </> : <>
              {pending.length > 0 && <Alert severity="info">선택한 고객 {pending.length}명을 추가할 그룹을 고르거나 새 그룹을 만드세요.</Alert>}
              <p>왼쪽에서 그룹을 선택하면 소속 고객을 확인하고 추가·제외할 수 있습니다.</p>
              {groups.data?.items.length === 0 && <p>등록된 고객 그룹이 없습니다.</p>}
            </>}
          </div>
          <footer>{confirmDelete ? <button type="button" disabled={busy} onClick={() => setConfirmDelete(false)}>삭제 취소</button> : <>{draft && <button type="submit" className="customer-popup-primary" disabled={busy || !draft.name.trim()}>{busy ? "저장 중…" : "그룹 변경사항 저장"}</button>}<button type="button" disabled={busy} className={!draft ? "customer-popup-primary" : ""} onClick={onClose}>그룹 설정 완료</button></>}</footer>
        </main>
      </form>
    </Dialog>
  );
}
