/* eslint-disable react/prop-types */
import { useState } from "react";
import { Button, Checkbox } from "@mui/material";
import { Link } from "react-router-dom";
import Icon from "./ContractDesignIcon";
import { Directions } from "./CrmShared";
import { customerAddressDisplay } from "./customer-address-display";
import { STAGES, formatPhone, localDateTime } from "./crm-utils";
import { residentPrefix } from "./customer-group-options";

function CustomerListEntry({ customer: c, cards, checked, selection, onDetails, groupColors }) {
  const address = customerAddressDisplay(c);
  const prefix = residentPrefix(c.resident_number);
  const [copyStatus, setCopyStatus] = useState("");
  const detail = event => {
    if (!event.metaKey && !event.ctrlKey && !event.shiftKey && event.button === 0) {
      event.preventDefault();
      onDetails();
    }
  };
  const checkbox = <Checkbox size="small" checked={checked} onChange={e => selection.change(c.id, e.target.checked, e.nativeEvent.shiftKey)} inputProps={{ "aria-label": `${c.name} 고객 선택` }} />;
  const name = <Link className="customer-list-name" to={`/crm/customers/${c.id}`} onClick={detail}>{c.name}</Link>;
  const notes = <>{c.alias && <small>{c.alias}</small>}{c.memo && <small title={c.memo}>{c.memo}</small>}</>;
  const rrn = prefix ? <span className="customer-list-rrn">{prefix}</span> : null;
  const stage = <span className={`crm-customer-stage crm-customer-stage--${c.stage}`}>{STAGES[c.stage] || "미확인"}</span>;
  const contracts = <span className="customer-list-contracts">계약 {c.contract_count || 0}건</span>;
  const groups = <>{c.do_not_contact && <span className="crm-customer-stop">연락 중단</span>}{c.groups?.map(group => <span className="customer-list-group" data-group-color={groupColors.get(group.id) || "green"} key={group.id}>{group.name}</span>)}</>;
  const contact = <>
    {c.phone ? <button className="customer-list-copy" type="button" title="전화번호 복사" onClick={async () => {
      try {
        await navigator.clipboard.writeText(formatPhone(c.phone));
        setCopyStatus("전화번호를 복사했습니다.");
      } catch { setCopyStatus("전화번호를 복사하지 못했습니다."); }
    }}>{formatPhone(c.phone)}</button> : <span>연락처 미등록</span>}
    {copyStatus && <small role="status">{copyStatus}</small>}
    {c.location?.address && <small title={c.location.address}>{c.location.address}</small>}
    {address.state !== "confirmed" && <button type="button" className="crm-customer-address-status" data-state={address.state} onClick={onDetails}>{address.label}</button>}
  </>;
  const dates = <div className="customer-list-dates">{[["수정", c.updated_at], ["등록", c.created_at]].map(([label, value]) => <span key={label}>{label} <time dateTime={value || undefined}>{value ? localDateTime(value).replace("T", " ") : "—"}</time></span>)}</div>;
  const actions = <div className="customer-list-actions">{c.phone && cards && <Button component="a" href={`tel:${c.phone.replace(/[^\d+]/g, "")}`}><Icon name="phone" />전화</Button>}<Button component={Link} to={`/crm/customers/${c.id}`} onClick={detail}>상세</Button><Directions location={c.location || {}} /></div>;
  const row = { ...selection.row(c.id), "data-selected": checked || undefined };
  if (cards) return <article className="customer-list-card" {...row}>
    <div className="customer-list-card-heading"><div>{checkbox}{name}{rrn}</div><div>{stage}{contracts}</div></div>
    <div className="customer-list-card-body">{contact}{notes}<div className="customer-list-badges">{groups}</div></div>
    <div className="customer-list-card-footer">{dates}{actions}</div>
  </article>;
  return <tr {...row}>
    <td>{checkbox}</td><td>{name}{notes}</td><td>{rrn ?? "—"}</td><td>{contact}</td>
    <td><div className="customer-list-badges">{stage}{contracts}{groups}</div></td><td>{dates}</td><td>{actions}</td>
  </tr>;
}

export default function CrmCustomerList({ cards, customers, ...entry }) {
  const rows = customers.map(customer => <CustomerListEntry key={customer.id} customer={customer} cards={cards}
    checked={entry.selectedIds.has(customer.id)} onDetails={() => entry.onDetails(customer)}
    selection={entry.selection} groupColors={entry.groupColors} />);
  return cards ? <div className="customer-list-cards">{rows}</div> : <div className="customer-list-table-wrap" role="region" aria-label="고객 테이블" tabIndex={0}>
    <table className="customer-list-table"><thead><tr>
      {["선택", "고객명 · 별칭/메모", "주민번호", "연락처 · 주소", "소속 그룹 · 상담단계", "수정일 / 등록일", "상세 · 길찾기"].map(label => <th key={label} scope="col">{label}</th>)}
    </tr></thead><tbody>{rows}</tbody></table>
  </div>;
}
