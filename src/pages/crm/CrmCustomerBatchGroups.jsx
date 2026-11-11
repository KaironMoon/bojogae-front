/* eslint-disable react/prop-types */
import { useState } from "react";
import { Alert, Dialog } from "@mui/material";
import { CustomerPopupHeader } from "./CustomerReference";
import { State, useCrm } from "./CrmShared";
import { crmGet, crmPut, crmError } from "@/services/crm-service";

export default function CustomerBatchGroups({ customers, onClose }) {
  const groups = useCrm('/customer-groups');
  const [selected, setSelected] = useState([]);
  const [completed, setCompleted] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function apply() {
    setBusy(true);
    setError('');
    try {
      for (const id of selected.filter(id => !completed.includes(id))) {
        const group = await crmGet(`/customer-groups/${id}`);
        await crmPut(`/customer-groups/${id}`, {
          name: group.name, version: group.version,
          customer_ids: [...new Set([...group.customers.map(c => c.id), ...customers.map(c => c.id)])],
        });
        setCompleted(old => [...old, id]);
      }
      onClose();
    } catch (e) { setError(crmError(e)); }
    finally { setBusy(false); }
  }
  return <Dialog open fullWidth maxWidth="xs" onClose={busy ? undefined : onClose} slotProps={{ paper: { className: 'crm-customer-dialog crm-customer-batch-dialog' } }}>
    <CustomerPopupHeader title="선택 고객 그룹에 일괄 추가" icon="folder_plus" busy={busy} onClose={onClose} />
    <div className="customer-popup-batch-body"><div className="customer-popup-batch-summary">현재 선택된 <strong>{customers.length}명</strong>의 고객을 아래 선택한 그룹에 일괄 배정합니다.</div>
      {error && <Alert severity="error">{error}</Alert>}
      {completed.length > 0 && <Alert severity="success">{completed.length}개 그룹에 적용했습니다. 재시도 시 남은 그룹만 처리합니다.</Alert>}
      <State resource={groups} /><div className="customer-popup-batch-options">
      {groups.data?.items.map(g => <label key={g.id}><input type="checkbox" disabled={busy || completed.includes(g.id)} checked={selected.includes(g.id)} onChange={e => setSelected(old => e.target.checked ? [...old,g.id] : old.filter(id => id !== g.id))} /><span>{g.name}</span><small>{g.customer_count}명{completed.includes(g.id) ? ' · 적용 완료' : ''}</small></label>)}
      {groups.data?.items.length === 0 && <p>등록된 그룹이 없습니다. 고객 그룹 관리에서 먼저 그룹을 만들어 주세요.</p>}</div>
      <div className="customer-popup-batch-actions"><button type="button" disabled={busy} onClick={onClose}>취소</button><button type="button" className="customer-popup-primary" disabled={busy || !selected.some(id => !completed.includes(id))} onClick={apply}>{busy ? '적용 중…' : '선택 그룹에 추가 적용'}</button></div>
    </div>
  </Dialog>;
}
