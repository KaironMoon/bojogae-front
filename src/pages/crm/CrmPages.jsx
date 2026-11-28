import ErrorNoticeDialog from "@/components/ErrorNoticeDialog";
import { CustomerWorkspace, CustomerField } from "./CustomerReference";
import CrmCustomerList from "./CrmCustomerList";
import CustomerDocuments from "./CustomerDocuments";
import { useCustomerSelection } from "./use-customer-selection";
import { CUSTOMER_SORTS } from "./customer-group-options";
import useMediaQuery from "@mui/material/useMediaQuery";
/* eslint-disable react/prop-types */
import { CustomerDesignDrawer, CustomerConsultationTimeline, CustomerContractPreview } from "./CrmCustomerDesign";
import ContractDesignIcon from "./ContractDesignIcon";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Stack,
  Tab,
  Tabs,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { crmGet, crmPost, crmPut, crmError, crmDeleteCustomers } from "@/services/crm-service";
import { proposalFileUrl } from "@/services/proposal-service";
import {
  useCrm,
  Page,
  Panel,
  State,
  Pages,
  Empty,
  Field,
  Directions,
  Attachments,
  CustomerLink,
} from "./CrmShared";
import {
  CustomerForm,
  ContractForm,
  ConsultationForm,
  TaskForm,
  StatusForm,
} from "./CrmForms";
import {
  STAGES,
  PROGRESS,
  MAINTENANCE,
  CYCLES,
  KINDS,
  RESULTS,
  METHODS,
  TASK_STATUS,
  ACCURACY,
  money,
  dateTime,
  formatPhone,
} from "./crm-utils";
import CrmMap from "./CrmMap";
import CrmImport from "./CrmImport";
import CrmCustomerGroups from "./CrmCustomerGroups";
import { ContractListEntry, ContractReminderDetails, ContractReminderDrawer, ContractReminderFilters } from "./CrmContractReminders";

function Archive({ kind, value, onClose, onDone }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit() {
    setBusy(true);
    try {
      await crmPost(`/${kind}/${value.id}/archive`, {
        version: value.version,
        archived: !value.archived,
      });
      onDone();
      onClose();
    } catch (e) {
      setError(crmError(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog open onClose={busy ? undefined : onClose}>
      <DialogTitle>
        {value.archived ? "보관을 해제할까요?" : "보관할까요?"}
      </DialogTitle>
      <DialogContent>
        보관 시 기본 목록에서
        제외되며 기존 기록은 유지됩니다.
      </DialogContent>
      <ErrorNoticeDialog message={error} onClose={() => setError("")} />
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>
          취소
        </Button>
        <Button onClick={submit} disabled={busy}>
          확인
        </Button>
      </DialogActions>
    </Dialog>
  );
}
function CustomerPageSize({ value, onChange, bottom = false }) {
  return <label className="customer-page-size"><span>페이지당 표시:</span><select aria-label={bottom ? "하단 페이지당 표시 인원수" : "페이지당 표시 인원수"} value={value} onChange={e => onChange(Number(e.target.value))}><option value="30">30명씩 (기본)</option><option value="50">50명씩</option><option value="100">100명씩</option><option value="200">200명씩 (최대)</option></select></label>;
}
function BulkCustomerDelete({customers, onClose, onDone}) {
  const [busy,setBusy]=useState(false),[error,setError]=useState("");
  async function remove(){if(busy)return;setBusy(true);setError("");try{const result=await crmDeleteCustomers(customers.map(({id,version})=>({id,version})));onDone(result.count);}catch(e){setError(crmError(e));}finally{setBusy(false);}}
  return <><Dialog open onClose={busy?undefined:onClose} fullWidth maxWidth="xs" aria-labelledby="customer-delete-title" slotProps={{paper:{className:"crm-customer-dialog customer-delete-dialog"}}}><DialogTitle id="customer-delete-title"><ContractDesignIcon name="trash" />선택 고객 삭제</DialogTitle><DialogContent><Typography>선택하신 {customers.length}명의 고객을 삭제하시겠습니까? 삭제된 고객은 목록에서 제외됩니다.</Typography><Typography variant="body2" sx={{mt:2}}>고객 정보와 상담·할 일 기록은 서버에 보존됩니다. 계약 또는 첨부파일이 연결된 고객은 먼저 연결 정보를 정리해야 합니다.</Typography></DialogContent><DialogActions><Button onClick={onClose} disabled={busy}>닫기</Button><Button variant="contained" color="error" onClick={remove} disabled={busy}>{busy?"삭제 중…":`${customers.length}명 삭제`}</Button></DialogActions></Dialog><ErrorNoticeDialog message={error} onClose={() => setError("")} /></>;
}
export function CustomersPage() {
  const [pageSize, setPageSize] = useState(30);
  const [deleteTargets, setDeleteTargets] = useState(null);
  const mobile = useMediaQuery("(max-width: 767px)");
  const [density, setDensity] = useState(null);
  const cards = (density ?? (mobile ? "cards" : "table")) === "cards";
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sort, setSort] = useState("updated_desc");
  const [detail, setDetail] = useState(null);
  const [groupId, setGroupId] = useState("");
  const groups = useCrm("/customer-groups");
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState("");
  const [archived, setArchived] = useState(false);
  const [allCustomers, setAllCustomers] = useState(false);
  const [missing, setMissing] = useState(false);
  const [unconfirmed, setUnconfirmed] = useState(false);
  const [tag, setTag] = useState("");
  const [hasContract, setHasContract] = useState("");
  const [page, setPage] = useState(1);
  const [view, setView] = useState("list");
  const [form, setForm] = useState(false);
  const [selection, setSelection] = useState({ data: null, scope: "", ids: [] });
  const [actionNotice, setActionNotice] = useState("");
  const [groupTargets, setGroupTargets] = useState(null);
  const resource = useCrm("/customers", {
    q: search,
    sort,
    group_id: groupId || undefined,
    include_archived: allCustomers,
    page_size: pageSize,
    stage,
    archived,
    missing_location: missing,
    unconfirmed_address: unconfirmed,
    tag,
    ...(hasContract !== "" ? { has_contract: hasContract } : {}),
    page,
  });
  const selectionScope = JSON.stringify([search, stage, archived, missing, unconfirmed, tag, hasContract, page, view, groupId, allCustomers, pageSize, sort]);
  const selectable = resource.data?.items || [];
  const activeIds = !resource.loading && !resource.error && selection.data === resource.data && selection.scope === selectionScope
    ? selection.ids : [];
  const selectedIds = new Set(activeIds);
  const selected = selectable.filter(customer => selectedIds.has(customer.id));
  const groupColors = new Map(groups.data?.items?.map(group => [group.id, group.color]));
  function selectCustomers(ids) {
    setSelection({ data: resource.data, scope: selectionScope, ids });
  }
  const rowSelection = useCustomerSelection(
    selectionScope, resource.loading || resource.error ? [] : selectable, activeIds, selectCustomers,
  );
  function clearSelection() {
    selectCustomers([]);
    rowSelection.reset();
  }
  function reloadGroups() {
    groups.reload();
    resource.reload();
  }
  function finishRegistration(count) {
    setForm(false);
    setView("list");
    setPage(1);
    setActionNotice(`${count}명의 고객을 등록했습니다.`);
    resource.reload();
  }
  return (
    <div className={`crm-customers-workspace${view === "map" ? " crm-customers-map-view" : ""}`}><CustomerWorkspace
      badges={<div className="crm-customer-header-badges"><span>SMART CRM & GROUP WORKSPACE</span><span>보조개톡 · 보장분석 · 방문일정 실시간 연동</span></div>}
      title="내고객"
      description="상담부터 보험·방문까지, 고객의 업무를 한곳에서 관리합니다. (고객명 또는 우측 [상세] 버튼을 누르면 상세 워크스페이스가 열립니다)"
      actions={
        <>
          <Button className="crm-customer-group-button" startIcon={<ContractDesignIcon name="upload" />} onClick={() => setForm("import")}>자료 가져오기</Button>
          <Button className="crm-customer-primary" startIcon={<ContractDesignIcon name="user_plus" />} variant="contained" onClick={() => setForm("register")}>
            고객 등록
          </Button>
        </>
      }
    >
      <section className="crm-customer-switches">
        <div><Tabs value={view} variant="scrollable" scrollButtons="auto" onChange={(_, v) => { selectCustomers([]); setView(v); }}><Tab value="list" icon={<ContractDesignIcon name="rows" />} iconPosition="start" label="내고객 목록" /><Tab value="map" icon={<ContractDesignIcon name="pin" />} iconPosition="start" label="주변 고객 지도" /></Tabs>
        </div>
      </section>
      {view === "map" ? (
        <section className="crm-customer-map"><CrmMap /></section>
      ) : (
        <>
          <Panel className="crm-customer-filters">
            <Box component="form" className="crm-customer-filter-grid" onSubmit={e => { e.preventDefault(); setSearch(q); setPage(1); }}>
              <div className="customer-filter-search-row">
              <div className="crm-customer-search"><ContractDesignIcon name="search" /><CustomerField id=":r1ea:" inputProps={{ "aria-label": "이름·카톡대화명·연락처·주소·메모 검색" }} placeholder="이름·카톡대화명·연락처·주소·메모 검색" value={q} onChange={setQ} /><Button type="submit">검색</Button></div>
                <Button className="customer-filter-toggle" type="button" aria-controls="customer-detailed-filters" aria-expanded={filtersOpen} onClick={() => setFiltersOpen(!filtersOpen)}>필터 {filtersOpen ? "▲" : "▼"}</Button>
              </div>
              <div id="customer-detailed-filters" className="customer-detailed-filters" data-open={filtersOpen}>
              <CustomerField id=":r1ec:" inputProps={{ "aria-label": "상담 단계" }} SelectProps={{ displayEmpty: true }} value={stage} options={{ "": "상담 단계: 전체", ...STAGES }} onChange={v => { setStage(v); setPage(1); }} />
              <CustomerField id=":r1ee:" inputProps={{ "aria-label": "보기" }} value={allCustomers ? "ALL" : archived ? "ARCHIVED" : missing ? "MISSING" : unconfirmed ? "UNCONFIRMED" : "ACTIVE"} options={{ ACTIVE: "보기: 관리 고객", ARCHIVED: "보관된 고객", ALL: "전체 고객", MISSING: "위치 미등록", UNCONFIRMED: "미확정 주소만 보기" }} onChange={v => { setAllCustomers(v === "ALL"); setArchived(v === "ARCHIVED"); setMissing(v === "MISSING"); setUnconfirmed(v === "UNCONFIRMED"); setPage(1); }} />
              <CustomerField id=":r1eg:" inputProps={{ "aria-label": "태그" }} placeholder="#태그 (예: 현대홈쇼핑, 지점장)" value={tag} onChange={v => { setTag(v); setPage(1); }} />
              <CustomerField id=":r1eh:" inputProps={{ "aria-label": "계약 보유" }} SelectProps={{ displayEmpty: true }} value={hasContract} options={{ "": "계약 보유: 전체", true: "계약 보유 (1건 이상)", false: "미보유 (0건)" }} onChange={v => { setHasContract(v); setPage(1); }} />
                <CustomerField inputProps={{ "aria-label": "정렬 기준" }} value={sort} options={CUSTOMER_SORTS} onChange={v => { setSort(v); setPage(1); }} />
              </div>
            </Box>
          </Panel>
          <section className="customer-group-bar" aria-label="고객 그룹 필터">
            <strong>고객 그룹</strong>
            <div className="crm-customer-group-pills">
              <Button aria-pressed={!groupId} onClick={() => { setGroupId(""); setPage(1); }}>전체 고객</Button>
              {groups.data?.items?.map(g => <Button key={g.id} aria-pressed={groupId === g.id} data-group-color={g.color || "green"} onClick={() => { setGroupId(g.id); setPage(1); }}>{g.name} {g.customer_count}명</Button>)}
              <Button className="crm-customer-group-button" startIcon={<ContractDesignIcon name="folder" />} onClick={() => setGroupTargets([])}>고객 그룹 관리</Button>
            </div>
            {groups.error && <Alert severity="warning">{groups.error}</Alert>}
          </section>
          <div className="customer-list-toolbar">
            <CustomerPageSize value={pageSize} onChange={v => { setPageSize(v); setPage(1); clearSelection(); }} />
            <div className="crm-customer-density"><ToggleButtonGroup exclusive size="small" value={cards ? "cards" : "table"} aria-label="리스트 뷰 전환" onChange={(_, v) => { if (v) setDensity(v); }}>
              <ToggleButton value="table"><ContractDesignIcon name="rows" />테이블 뷰</ToggleButton><ToggleButton value="cards"><ContractDesignIcon name="grid" />카드 뷰</ToggleButton>
            </ToggleButtonGroup></div>
          </div>
          <State resource={resource} />
          {actionNotice && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setActionNotice("")}>{actionNotice}</Alert>}
          <div className="crm-customer-batch">
            <div className="customer-ref-selection">
              {<FormControlLabel label="현재 페이지 전체 선택" control={<Checkbox size="small" disabled={resource.loading || !!resource.error || !selectable.length} checked={selected.length > 0 && selected.length === selectable.length} indeterminate={selected.length > 0 && selected.length < selectable.length} onChange={e => selectCustomers(e.target.checked ? selectable.map(c => c.id) : [])} />} />}
              <p>총 <strong>{resource.data?.total || 0}</strong>명 <small>(현재 페이지 표시 {resource.data?.items.length || 0}명)</small></p>
              <span>선택 {selected.length}명</span>{selected.length > 0 && <Button className="customer-clear-selection" startIcon={<ContractDesignIcon name="close" />} onClick={clearSelection}>선택 해제</Button>}
            </div>
            <div className="customer-ref-batch-actions">
              <Button className="customer-group-register" startIcon={<ContractDesignIcon name="folder" />} disabled={!selected.length || selected.some(c => c.archived)} onClick={() => setGroupTargets(selected)}>선택 그룹 등록</Button>
              <Button className="customer-bulk-delete" startIcon={<ContractDesignIcon name="trash" />} disabled={!selected.length || resource.loading} onClick={() => setDeleteTargets(selected)}>선택 고객 삭제</Button>
            </div>
            {!!selected.length && <div className="customer-selection-tray" aria-label="선택한 고객" tabIndex={0}>{selected.map(c => <button type="button" key={c.id} aria-label={`${c.name} 선택 해제`} onClick={() => selectCustomers(activeIds.filter(id => id !== c.id))}>{c.name} ×</button>)}</div>}
          </div>
          <CrmCustomerList cards={cards} customers={selectable} selectedIds={selectedIds} selection={rowSelection} groupColors={groupColors} onDetails={setDetail} />
          {resource.data && !resource.data.items.length && <Empty />}
          <div className="crm-customer-pagination"><span>전체 {resource.data?.total || 0}명 중 {resource.data?.page_start ?? "—"} - {resource.data?.page_end ?? "—"}번째 고객 표시 (페이지당 {pageSize}명 고밀도 뷰)</span><CustomerPageSize bottom value={pageSize} onChange={v => { setPageSize(v); setPage(1); selectCustomers([]); }} /><Pages data={resource.data} onChange={setPage} /></div>
        </>
      )}
      {form && (
        <CrmImport
          onClose={() => setForm(false)}
          onDone={finishRegistration}
          renderRegistration={form === "register" ? (spreadsheet) => (
            <CustomerForm open={spreadsheet.open} spreadsheet={spreadsheet} onClose={() => setForm(false)}
              onSave={async (data) => {
                await crmPost("/customers", data);
                finishRegistration(1);
              }} />
          ) : undefined}
        />
      )}
      {groupTargets !== null && <CrmCustomerGroups selectedCustomers={groupTargets}
        onFilter={id => { setGroupId(id); setView("list"); setPage(1); setGroupTargets(null); }}
        onChanged={deletedId => {
          if (deletedId && groupId === deletedId) { setGroupId(""); setPage(1); }
          reloadGroups();
        }} onClose={() => setGroupTargets(null)} />}
      {deleteTargets && <BulkCustomerDelete customers={deleteTargets} onClose={() => setDeleteTargets(null)} onDone={count => {
        setDeleteTargets(null); setDetail(null); selectCustomers([]); groups.reload();
        setActionNotice(`${count}명의 고객을 삭제했습니다.`);
        if (page > 1 && count === resource.data?.items.length) setPage(page - 1); else resource.reload();
      }} />}
      <CustomerDesignDrawer customer={detail} onClose={() => { setDetail(null); resource.reload(); groups.reload(); }} onSaved={() => { setDetail(null); resource.reload(); groups.reload(); }} onDelete={() => setDeleteTargets([detail])}
        onPrevious={resource.data?.items.indexOf(detail) > 0 ? () => setDetail(resource.data.items[resource.data.items.indexOf(detail) - 1]) : undefined}
        onNext={detail && resource.data?.items.indexOf(detail) < resource.data?.items.length - 1 ? () => setDetail(resource.data.items[resource.data.items.indexOf(detail) + 1]) : undefined} />
    </CustomerWorkspace></div>
  );
}
function ContractCard({ contract: c }) {
  const isNew = c.origin === "NEW";
  const maintTone = c.maintenance === "ACTIVE" ? "active" : ["LAPSED", "TERMINATED"].includes(c.maintenance) ? "danger" : "neutral";
  return (
    <article className="crm-detail-contract-card">
      <div className="crm-detail-contract-body">
        <div className="crm-detail-contract-badges">
          <span className={`crm-detail-pill crm-detail-pill--${isNew ? "violet" : "slate"}`}>
            {isNew ? "신규 진행 계약" : "기존 가입 보험"}
          </span>
          {c.insurer && <span className="crm-detail-contract-insurer">{c.insurer}</span>}
          {c.progress && (
            <span className="crm-detail-pill crm-detail-pill--blue">{PROGRESS[c.progress]}</span>
          )}
          <span className={`crm-detail-pill crm-detail-pill--${maintTone}`}>
            {MAINTENANCE[c.maintenance] || "유지 미확인"}
          </span>
          {c.archived && <span className="crm-detail-pill crm-detail-pill--muted">보관됨</span>}
        </div>
        <h4 className="crm-detail-contract-title">{c.product || "상품명 미등록"}</h4>
        <div className="crm-detail-contract-meta">
          <span>
            {c.premium === null || c.premium === undefined ? "보험료 미확인" : `${money(c.premium)}원`}
            {c.payment_cycle && CYCLES[c.payment_cycle] ? ` · ${CYCLES[c.payment_cycle]}` : ""}
            {c.premium_monthly != null ? ` (월 환산 ${money(c.premium_monthly)}원)` : ""}
          </span>
          {c.policy_number && <span className="crm-mono">증권 #{c.policy_number}</span>}
          {c.establishment_date && <span className="crm-mono">성립 {c.establishment_date}</span>}
        </div>
      </div>
      <div className="crm-detail-contract-action">
        <Button
          size="small"
          variant="outlined"
          component={Link}
          to={`/crm/contracts/${c.id}`}
          className="crm-detail-link-btn"
        >
          계약 상세 →
        </Button>
      </div>
    </article>
  );
}
function TaskCard({ task: t, onEdit, customerLocation }) {
  const statusTone = t.status === "DONE" ? "done" : t.status === "CANCELLED" ? "muted" : t.is_overdue ? "overdue" : "pending";
  return (
    <article className={`crm-detail-task-card is-${statusTone}`}>
      <div className="crm-detail-task-body">
        <div className="crm-detail-task-badges">
          <span className="crm-detail-pill crm-detail-pill--violet">{KINDS[t.kind]}</span>
          <span className={`crm-detail-pill crm-detail-pill--${statusTone === "done" ? "active" : statusTone === "overdue" ? "danger" : "neutral"}`}>
            {TASK_STATUS[t.status]}
          </span>
          {t.is_overdue && (
            <span className="crm-detail-pill crm-detail-pill--danger">기한 초과</span>
          )}
          <time className="crm-detail-task-time">
            {t.due_at ? dateTime(t.due_at) : `${t.due_date} · 시각 미정`}
          </time>
        </div>
        <h4 className="crm-detail-task-title">{t.title}</h4>
        {t.note && <p className="crm-detail-task-note">{t.note}</p>}
        {t.customer_id && (
          <div className="crm-detail-task-customer">
            <CustomerLink id={t.customer_id} name={t.customer_name} />
          </div>
        )}
      </div>
      <div className="crm-detail-task-actions">
        <Button size="small" variant="outlined" className="crm-detail-link-btn" onClick={() => onEdit(t)}>
          수정·처리
        </Button>
        {t.kind === "VISIT" && (
          <Directions
            location={
              t.location?.lat == null
                ? customerLocation || t.customer_location
                : t.location
            }
          />
        )}
      </div>
    </article>
  );
}
function Consultations({ customerId }) {
  const [page, setPage] = useState(1);
  const resource = useCrm(`/customers/${customerId}/consultations`, { page });
  return (
    <div className="crm-detail-consultations-list">
      <State resource={resource} />
      {resource.data?.items.map((r) => (
        <article key={r.id} className="crm-detail-consultation-card">
          <div className="crm-detail-consultation-head">
            <div className="crm-detail-consultation-badges">
              <span className="crm-detail-pill crm-detail-pill--blue">{METHODS[r.method]}</span>
              <span className={`crm-detail-pill crm-detail-pill--${r.result === "CONNECTED" ? "active" : r.result === "REFUSED" || r.result === "WRONG_NUMBER" ? "danger" : "neutral"}`}>
                {RESULTS[r.result]}
              </span>
            </div>
            <time className="crm-detail-consultation-time">{dateTime(r.occurred_at)}</time>
          </div>
          <p className="crm-detail-consultation-content">{r.content}</p>
          {r.contract_id && (
            <div className="crm-detail-consultation-footer">
              <Button
                size="small"
                variant="outlined"
                className="crm-detail-link-btn"
                component={Link}
                to={`/crm/contracts/${r.contract_id}`}
              >
                관련 계약 보기 →
              </Button>
            </div>
          )}
        </article>
      ))}
      {resource.data && !resource.data.total && <Empty>등록된 상담 이력이 없습니다.</Empty>}
      <Pages data={resource.data} onChange={setPage} />
    </div>
  );
}
function CustomerInfoTile({ label, value, fullWidth = false }) {
  const hasValue = Boolean(value && String(value).trim());
  return (
    <Box
      sx={{
        px: 1.75,
        py: 1.35,
        borderRadius: "12px",
        border: "1px solid",
        borderColor: hasValue ? "#E2E8F0" : "#F1F5F9",
        bgcolor: hasValue ? "#FFFFFF" : "#F8FAFC",
        gridColumn: fullWidth ? "1 / -1" : undefined,
      }}
    >
      <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: "#64748B", mb: 0.4 }}>
        {label}
      </Typography>
      <Typography
        sx={{
          fontSize: hasValue ? 14 : 13,
          fontWeight: hasValue ? 750 : 500,
          color: hasValue ? "#121314" : "#94A3B8",
          lineHeight: 1.45,
          whiteSpace: "pre-wrap",
          overflowWrap: "anywhere",
        }}
      >
        {hasValue ? value : "미확인"}
      </Typography>
    </Box>
  );
}
const CUSTOMER_DETAIL_TABS = new Set(["summary", "consultations", "contracts", "tasks", "files"]);

export function CustomerDetailPage() {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const targetTab = CUSTOMER_DETAIL_TABS.has(requestedTab) ? requestedTab : null;
  const scrollKey = targetTab ? `${customerId}:${targetTab}` : "";
  const resource = useCrm(`/customers/${customerId}`);
  const c = resource.data;
  const hasCustomer = Boolean(c);
  const [tab, setTab] = useState(() => targetTab || "summary");
  const [editor, setEditor] = useState("");
  const [task, setTask] = useState(null);
  const tabsAnchorRef = useRef(null);
  const scrolledTabKeyRef = useRef("");

  useEffect(() => {
    if (targetTab) {
      setTab(targetTab);
    }
  }, [customerId, targetTab]);

  useEffect(() => {
    if (!scrollKey) {
      scrolledTabKeyRef.current = "";
    }
  }, [scrollKey]);

  useEffect(() => {
    if (!hasCustomer || !targetTab || tab !== targetTab || scrolledTabKeyRef.current === scrollKey) {
      return undefined;
    }
    scrolledTabKeyRef.current = scrollKey;
    const frame = window.requestAnimationFrame(() => {
      const anchor = tabsAnchorRef.current;
      if (!anchor) return;
      const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
      anchor.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      const activeTab = anchor.querySelector('[role="tab"][aria-selected="true"]');
      activeTab?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [hasCustomer, scrollKey, tab, targetTab]);

  const changeTab = (nextTab) => {
    setTab(nextTab);
    if (searchParams.has("tab")) {
      const next = new URLSearchParams(searchParams);
      if (nextTab === "summary") next.delete("tab");
      else next.set("tab", nextTab);
      setSearchParams(next, { replace: true });
    }
  };
  return (
    <div className="crm-customers-workspace crm-customer-detail-workspace"><CustomerWorkspace
      badges={<div className="crm-customer-header-badges"><span>CUSTOMER WORKSPACE</span><span>고객 정보 · 상담 · 계약 · 일정</span></div>}
      description="고객의 상세 정보와 상담·계약 이력을 한곳에서 확인합니다."
      title={c ? `${c.name}${c.alias ? ` (${c.alias})` : ""}` : "고객 상세"}
      actions={
        <>
          <Button component={Link} to="/crm/customers">
            내고객 목록
          </Button>
          {c && (
            <Button color="error" onClick={() => setEditor("delete")}>
              고객 삭제
            </Button>
          )}
          {c && !c.archived && (
            <Button variant="contained" onClick={() => setEditor("customer")}>
              고객 수정
            </Button>
          )}
        </>
      }
    >
      <State resource={resource} />
      {c && (() => {
        const pendingTasks = (c.tasks?.items || []).filter((t) => t.status === "PENDING");
        const overdueCount = pendingTasks.filter((t) => t.is_overdue).length;
        const addressText = [c.location?.address, c.address_detail].filter(Boolean).join(" ");
        return (
        <>
          {c.archived && (
            <Alert severity="info" sx={{ mb: 2, borderRadius: "14px" }}>
              이전에 보관된 고객입니다. 기록을 확인하거나 고객을 삭제할 수 있습니다.
            </Alert>
          )}
          <section className="crm-customer-hero">
            <div className="crm-customer-hero-top">
              <div className="crm-customer-hero-identity">
                <span className="crm-customer-hero-avatar" aria-hidden="true">
                  {c.name?.slice(0, 1) || "고"}
                </span>
                <div className="crm-customer-hero-info">
                  <div className="crm-customer-hero-badges">
                    <span className={`crm-customer-stage crm-customer-stage--${c.stage}`}>
                      {STAGES[c.stage]}
                    </span>
                    {c.do_not_contact && (
                      <span className="crm-customer-stop">연락 중단 요청</span>
                    )}
                    {c.groups?.map((group) => (
                      <span key={group.id} className="crm-customer-membership">
                        {group.name}
                      </span>
                    ))}
                  </div>
                  <div className="crm-customer-hero-contact">
                    <span className={`crm-customer-hero-phone${c.phone ? "" : " is-empty"}`}>
                      <ContractDesignIcon name="phone" />
                      {c.phone ? formatPhone(c.phone) : "연락처 미등록"}
                    </span>
                    <span className="crm-customer-hero-address">
                      <ContractDesignIcon name="pin" />
                      <span>{addressText || "주소 미등록"}</span>
                      <span className="crm-customer-accuracy-pill">
                        {ACCURACY[c.location?.accuracy] || "위치 미등록"}
                      </span>
                      {c.address_resolution?.status === "UNRESOLVED" && (
                        <span className="crm-customer-address-status">미확정 주소</span>
                      )}
                      {["PENDING", "PROCESSING"].includes(c.address_resolution?.status) && (
                        <span className="crm-customer-accuracy-pill">주소 확인 대기·진행</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
              <div className="crm-customer-kpi-grid">
                <div className="crm-customer-kpi crm-customer-kpi--green">
                  <span>월 환산 보험료</span>
                  <strong>{money(c.premium_summary.monthly_known)}원</strong>
                  <small>정상 유지·계약자 · 미확인 {c.premium_summary.unknown_count}건</small>
                </div>
                <div className="crm-customer-kpi">
                  <span>보유 보험 계약</span>
                  <strong>{c.contracts.total}건</strong>
                  <small>누적 등록 계약 기준</small>
                </div>
                <div className="crm-customer-kpi">
                  <span>상담 이력</span>
                  <strong>{c.consultations.length}건</strong>
                  <small>{c.consultations[0] ? `최근 ${dateTime(c.consultations[0].occurred_at)}` : "상담 기록 없음"}</small>
                </div>
                <div className={`crm-customer-kpi${overdueCount > 0 ? " crm-customer-kpi--warn" : ""}`}>
                  <span>예정 업무</span>
                  <strong>{pendingTasks.length}건</strong>
                  <small>{overdueCount > 0 ? `기한 초과 ${overdueCount}건` : "기한 내 관리 중"}</small>
                </div>
              </div>
            </div>
            <div className="crm-customer-detail-actions">
              {c.phone && (
                <Button href={`tel:${c.phone}`} startIcon={<ContractDesignIcon name="phone" />}>
                  전화
                </Button>
              )}
              <Directions location={c.location} />
              <Button
                disabled={c.archived}
                startIcon={<ContractDesignIcon name="message_plus" />}
                onClick={() => setEditor("consultation")}
              >
                상담 기록 등록
              </Button>
              <Button
                disabled={c.archived}
                startIcon={<ContractDesignIcon name="calendar" />}
                onClick={() => {
                  setTask(null);
                  setEditor("task");
                }}
              >
                업무·방문 등록
              </Button>
              <Button
                disabled={c.archived}
                startIcon={<ContractDesignIcon name="folder_plus" />}
                onClick={() => setEditor("contract")}
              >
                보험 등록
              </Button>
              <Button
                component={Link}
                to={`/proposals?customerId=${c.id}`}
                disabled={c.archived}
                className="crm-customer-ai-action"
                startIcon={<ContractDesignIcon name="sparkles" />}
              >
                AI 보고서 생성
              </Button>
            </div>
          </section>
          <Box ref={tabsAnchorRef} sx={{ scrollMarginTop: "24px" }}>
            <Tabs
              className="crm-customer-detail-tabs"
              value={tab}
              onChange={(_, v) => changeTab(v)}
              variant="scrollable"
              sx={{ mb: 2 }}
            >
              <Tab label="요약" value="summary" />
              <Tab
                label={`상담 (${c.consultations.length})`}
                value="consultations"
              />
              <Tab label={`보험 계약 (${c.contracts.total})`} value="contracts" />
              <Tab label={`업무·일정 (${c.tasks.total})`} value="tasks" />
              <Tab label="문서" value="files" />
            </Tabs>
          </Box>
          {tab === "summary" && (
            <div className="crm-customer-overview-grid">
              <div className="crm-customer-overview-main">
                <Panel className="crm-customer-section-panel">
                  <div className="crm-customer-section-head">
                    <div>
                      <h3>
                        <ContractDesignIcon name="clipboard" />
                        보유 보험 계약 ({c.contracts.total}건)
                      </h3>
                      <p>월 환산 보험료 {money(c.premium_summary.monthly_known)}원 (정상 유지·계약자 기준)</p>
                    </div>
                    <Button
                      size="small"
                      variant="outlined"
                      disabled={c.archived}
                      startIcon={<ContractDesignIcon name="folder_plus" />}
                      onClick={() => setEditor("contract")}
                    >
                      보험 계약 추가
                    </Button>
                  </div>
                  <CustomerContractPreview contracts={c.contracts} customerId={c.id} disabled={c.archived} />
                </Panel>
                <Panel className="crm-customer-section-panel">
                  <div className="crm-customer-section-head">
                    <div>
                      <h3>
                        <ContractDesignIcon name="id_card" />
                        고객 상세 정보 · 연락 참고
                      </h3>
                      <p>인적 사항, 유입 경로 및 방문·통화 참고 정보</p>
                    </div>
                    {!c.archived && (
                      <Button size="small" variant="outlined" onClick={() => setEditor("customer")}>
                        정보 수정
                      </Button>
                    )}
                  </div>
                  <Typography sx={{ fontSize: 12, fontWeight: 800, color: "#4E5968", mb: 1 }}>
                    기본 인적 · 유입 정보
                  </Typography>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", md: "repeat(3, minmax(0, 1fr))" },
                      gap: 1.25,
                    }}
                  >
                    {[
                      ["카톡대화명", c.alias],
                      ["생년월일", c.birth_display || c.birth_date || c.birth_raw],
                      ["주민번호 앞 6자리·뒤 첫 1자리", c.resident_number],
                      ["직업", c.occupation],
                      ["유입", c.source],
                      ["접수일", c.received_display || c.received_date || c.received_raw],
                    ].map(([label, value]) => (
                      <CustomerInfoTile key={label} label={label} value={value} />
                    ))}
                  </Box>
                  <Divider sx={{ my: 2, borderColor: "#F1F5F9" }} />
                  <Typography sx={{ fontSize: 12, fontWeight: 800, color: "#4E5968", mb: 1 }}>
                    연락 · 방문 · 상담 참고
                  </Typography>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", md: "repeat(3, minmax(0, 1fr))" },
                      gap: 1.25,
                    }}
                  >
                    {[
                      ["통화 가능 시간", c.call_preference, false],
                      ["방문 가능 시간", c.visit_preference, false],
                      ["상담 참고 보험료", c.premium_note, false],
                      ["방문 참고", c.visit_note, true],
                    ].map(([label, value, fullWidth]) => (
                      <CustomerInfoTile key={label} label={label} value={value} fullWidth={fullWidth} />
                    ))}
                  </Box>
                  <Box
                    sx={{
                      mt: 1.5,
                      p: 1.75,
                      borderRadius: "12px",
                      bgcolor: c.memo ? "#FFFBEB" : "#F8FAFC",
                      border: "1px solid",
                      borderColor: c.memo ? "#FDE68A" : "#F1F5F9",
                    }}
                  >
                    <Typography sx={{ fontSize: 12, fontWeight: 800, color: c.memo ? "#92400E" : "#64748B", mb: 0.5 }}>
                      메모
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: 13.5,
                        fontWeight: c.memo ? 600 : 500,
                        color: c.memo ? "#1E293B" : "#94A3B8",
                        lineHeight: 1.65,
                        whiteSpace: "pre-wrap",
                        overflowWrap: "anywhere",
                      }}
                    >
                      {c.memo || "미확인"}
                    </Typography>
                  </Box>
                </Panel>
              </div>
              <div className="crm-customer-overview-side">
                <Panel className="crm-customer-section-panel">
                  <div className="crm-customer-section-head">
                    <div>
                      <h3>
                        <ContractDesignIcon name="message" />
                        최근 상담 내역
                      </h3>
                      <p>최근 기록 5건 표시</p>
                    </div>
                    <Stack direction="row" gap={0.75}>
                      {!c.archived && (
                        <Button size="small" variant="outlined" onClick={() => setEditor("consultation")}>
                          + 상담
                        </Button>
                      )}
                      <Button size="small" onClick={() => changeTab("consultations")}>
                        전체 보기
                      </Button>
                    </Stack>
                  </div>
                  <CustomerConsultationTimeline items={(c.consultations || []).slice(0, 5)} />
                </Panel>
                <Panel className="crm-customer-section-panel">
                  <div className="crm-customer-section-head">
                    <div>
                      <h3>
                        <ContractDesignIcon name="calendar" />
                        예정된 업무·방문 ({pendingTasks.length}건)
                      </h3>
                      <p>대기 중인 할 일 및 방문 일정</p>
                    </div>
                    <Stack direction="row" gap={0.75}>
                      {!c.archived && (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => {
                            setTask(null);
                            setEditor("task");
                          }}
                        >
                          + 업무
                        </Button>
                      )}
                      <Button size="small" onClick={() => changeTab("tasks")}>
                        전체 보기
                      </Button>
                    </Stack>
                  </div>
                  {pendingTasks.length > 0 ? (
                    <div className="crm-detail-stack">
                      {pendingTasks.slice(0, 5).map((t) => (
                        <TaskCard
                          key={t.id}
                          task={t}
                          customerLocation={c.location}
                          onEdit={(v) => {
                            setTask(v);
                            setEditor("task");
                          }}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="crm-detail-empty-box">
                      예정된 업무나 방문 일정이 없습니다.
                    </div>
                  )}
                </Panel>
              </div>
            </div>
          )}
          {tab === "consultations" && (
            <Panel className="crm-customer-section-panel">
              <div className="crm-customer-section-head">
                <div>
                  <h3>
                    <ContractDesignIcon name="message" />
                    상담 이력 ({c.consultations.length}건)
                  </h3>
                  <p>전화·방문·메시지 상담 기록 전체</p>
                </div>
                {!c.archived && (
                  <Button
                    size="small"
                    variant="contained"
                    className="crm-customer-primary"
                    startIcon={<ContractDesignIcon name="message_plus" />}
                    onClick={() => setEditor("consultation")}
                  >
                    상담 기록 등록
                  </Button>
                )}
              </div>
              <Consultations
                key={JSON.stringify(c.consultations.map((r) => r.id))}
                customerId={c.id}
              />
            </Panel>
          )}
          {tab === "contracts" && (
            <Panel className="crm-customer-section-panel">
              <div className="crm-customer-section-head">
                <div>
                  <h3>
                    <ContractDesignIcon name="clipboard" />
                    보유 보험 계약 ({c.contracts.total}건)
                  </h3>
                  <p>월 환산 보험료 {money(c.premium_summary.monthly_known)}원 (정상 유지·계약자 기준)</p>
                </div>
                <Stack direction="row" gap={1} flexWrap="wrap">
                  <Button
                    size="small"
                    variant="outlined"
                    component={Link}
                    to={`/crm/contracts?customer_id=${c.id}`}
                  >
                    내계약에서 전체 보기
                  </Button>
                  {!c.archived && (
                    <Button
                      size="small"
                      variant="contained"
                      className="crm-customer-primary"
                      startIcon={<ContractDesignIcon name="folder_plus" />}
                      onClick={() => setEditor("contract")}
                    >
                      보험 계약 등록
                    </Button>
                  )}
                </Stack>
              </div>
              {c.contracts.items.length > 0 ? (
                <div className="crm-detail-stack">
                  {c.contracts.items.map((r) => (
                    <ContractCard key={r.id} contract={r} />
                  ))}
                </div>
              ) : (
                <div className="crm-detail-empty-box">
                  등록된 보험 계약이 없습니다.
                </div>
              )}
            </Panel>
          )}
          {tab === "tasks" && (
            <Panel className="crm-customer-section-panel">
              <div className="crm-customer-section-head">
                <div>
                  <h3>
                    <ContractDesignIcon name="calendar" />
                    업무·방문 일정 ({c.tasks.total}건)
                  </h3>
                  <p>고객에게 연결된 할 일, 재통화 및 방문 일정</p>
                </div>
                <Stack direction="row" gap={1} flexWrap="wrap">
                  <Button
                    size="small"
                    variant="outlined"
                    component={Link}
                    to={`/crm/tasks?customer_id=${c.id}`}
                  >
                    전체 업무 보기
                  </Button>
                  {!c.archived && (
                    <Button
                      size="small"
                      variant="contained"
                      className="crm-customer-primary"
                      startIcon={<ContractDesignIcon name="calendar" />}
                      onClick={() => {
                        setTask(null);
                        setEditor("task");
                      }}
                    >
                      업무·방문 등록
                    </Button>
                  )}
                </Stack>
              </div>
              {c.tasks.items.length > 0 ? (
                <div className="crm-detail-stack">
                  {c.tasks.items.map((t) => (
                    <TaskCard
                      key={t.id}
                      task={t}
                      customerLocation={c.location}
                      onEdit={(v) => {
                        setTask(v);
                        setEditor("task");
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="crm-detail-empty-box">
                  등록된 업무·일정이 없습니다.
                </div>
              )}
            </Panel>
          )}
          {tab === "files" && (
            <div className="crm-customer-files-stack">
              <Panel className="crm-customer-section-panel crm-customer-documents-panel">
                <CustomerDocuments customerId={c.id} disabled={c.archived} onSaved={resource.reload} />
              </Panel>
              <Attachments customerId={c.id} disabled={c.archived} />
            </div>
          )}
          {editor === "customer" && (
            <CustomerForm
              value={c}
              onClose={() => setEditor("")}
              onSave={async (data) => {
                await crmPut(`/customers/${c.id}`, data);
                resource.reload();
              }}
            />
          )}
          {editor === "consultation" && (
            <ConsultationForm
              customerId={c.id}
              customerName={c.name}
              onClose={() => setEditor("")}
              onSave={async (data) => {
                await crmPost(`/customers/${c.id}/consultations`, data);
                resource.reload();
              }}
            />
          )}
          {editor === "contract" && (
            <ContractForm
              customerId={c.id}
              onClose={() => setEditor("")}
              onSave={async (data) => {
                await crmPost("/contracts", data);
                resource.reload();
              }}
            />
          )}
          {editor === "task" && (
            <TaskForm
              value={task}
              customerId={c.id}
              customerName={c.name}
              location={!task ? c.location : undefined}
              onClose={() => setEditor("")}
              onSave={async (data) => {
                await (task
                  ? crmPut(`/tasks/${task.id}`, data)
                  : crmPost("/tasks", data));
                resource.reload();
              }}
            />
          )}
          {editor === "delete" && (
            <BulkCustomerDelete
              customers={[c]}
              onClose={() => setEditor("")}
              onDone={() => navigate("/crm/customers", { replace: true })}
            />
          )}
        </>
        );
      })()}
    </CustomerWorkspace></div>
  );
}
function ContractBatchDialog({ action, contracts, reminder, onClose, onDone }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const archive = action === "archive";
  async function submit() {
    setBusy(true);
    setError("");
    try {
      const result = await crmPost(archive ? "/contracts/bulk-archive" : "/contracts/bulk-schedule", {
        contracts: contracts.map(({ id, version }) => ({ id, version })),
        ...(archive ? { confirmed: true } : { reminder }),
      });
      onDone(result);
    } catch (e) {
      setError(crmError(e));
    } finally {
      setBusy(false);
    }
  }
  return <><Dialog open onClose={busy ? undefined : onClose} aria-labelledby="crm-contract-batch-title" fullWidth maxWidth="xs" slotProps={{ paper: { className: `crm-contract-batch-dialog crm-contract-batch-dialog--${action}` } }}>
    <DialogTitle id="crm-contract-batch-title"><ContractDesignIcon name={archive ? "archive" : "calendar"} />선택한 계약 {contracts.length}건 {archive ? "보관" : "알림 등록"}</DialogTitle>
    <DialogContent>
      <Typography variant="body2">{archive
        ? "선택한 계약을 기본 목록에서 제외합니다. 보관 계약 목록에서 다시 확인할 수 있습니다."
        : "오늘 이후의 참고일을 연결된 고객의 할 일·방문 일정에 등록합니다. 알림 종류를 선택한 상태라면 해당 종류만 등록합니다."}</Typography>
      <Box component="ul" sx={{ pl: 2.5, mb: 0, maxHeight: 180, overflowY: "auto" }}>
        {contracts.map(contract => <li key={contract.id}>{contract.insurer} · {contract.product}</li>)}
      </Box>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} disabled={busy}>취소</Button>
      <Button onClick={submit} variant="contained" color={archive ? "error" : "primary"} disabled={busy}>
        {archive ? "보관하기" : "일정 등록하기"}
      </Button>
    </DialogActions>
  </Dialog>
  <ErrorNoticeDialog message={error} onClose={() => setError("")} /></>;
}

export function ContractsPage() {
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [archived, setArchived] = useState("false");
  const [page, setPage] = useState(1);
  const [form, setForm] = useState(false);
  const [view, setView] = useState("rows");
  const [reminder, setReminder] = useState("");
  const [schedule, setSchedule] = useState(null);
  const [detailContract, setDetailContract] = useState(null);
  const [editContract, setEditContract] = useState(null);
  const [origin, setOrigin] = useState("");
  const [progress, setProgress] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selection, setSelection] = useState(null);
  const [batch, setBatch] = useState(null);
  const [batchNotice, setBatchNotice] = useState("");
  const customerId = new URLSearchParams(window.location.search).get(
    "customer_id",
  );
  const resource = useCrm("/contracts", {
    q: search,
    status,
    origin,
    progress,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
    archived: archived === "all" ? undefined : archived,
    include_archived: archived === "all" || undefined,
    customer_id: customerId || undefined,
    page,
    include_reminders: true,
    reminder: reminder || undefined,
  });
  const navigate = useNavigate();
  const scope = JSON.stringify([search, status, origin, progress, dateFrom, dateTo, archived, customerId, page, reminder]);
  const selectable = archived !== "true" && !resource.loading && !resource.error
    ? (resource.data?.items || []).filter(contract => !contract.archived) : [];
  const selected = selection?.data === resource.data && selection?.scope === scope
    ? selectable.filter(contract => selection.ids.includes(contract.id)) : [];
  const allSelected = selectable.length > 0 && selected.length === selectable.length;
  const pageContracts = resource.data?.items || [];
  const detailIndex = detailContract ? pageContracts.findIndex(contract => contract.id === detailContract.id) : -1;
  function select(ids) {
    setSelection({ data: resource.data, scope, ids });
  }
  function batchDone(result) {
    if (batch.action === "archive") {
      setBatchNotice(`계약 ${result.count}건을 보관했습니다.`);
      setDetailContract(null);
      const remainingPages = Math.max(1, Math.ceil((resource.data.total - result.count) / resource.data.page_size));
      if (page > remainingPages) setPage(remainingPages);
      else resource.reload();
    } else {
      setBatchNotice([
        `일정 ${result.created}건을 등록했습니다.`,
        result.duplicates ? `이미 등록된 일정 ${result.duplicates}건.` : "",
        result.skipped_contracts ? `등록할 일정이 없거나 고객 연결이 없는 계약 ${result.skipped_contracts}건.` : "",
      ].filter(Boolean).join(" "));
    }
    setSelection(null);
    setBatch(null);
  }
  function scheduleFor(contract) {
    const parties = contract.parties || [];
    const linked = parties.find(party => party.role === "INSURED" && party.customer_id)
      || parties.find(party => party.customer_id);
    if (!linked || contract.archived) return;
    const event = contract.reminders?.find(item => (
      item.date >= resource.data.reminder_today && (!reminder || item.kind === reminder)
    ));
    setSchedule({ contract, customerId: event?.customer_id || linked.customer_id, event });
  }
  return (
    <div className="crm-contracts-workspace"><Page
      title="내계약"
      headerClassName="crm-contracts-header css-1r40e5"
      badges={<Stack direction="row" gap={0.75} flexWrap="wrap" mb={0.5}>
        <Chip size="small" label="SMART TOUCH & MILESTONE TRACKER" className="crm-contracts-badge" />
        <Chip size="small" label="상령일 · 면책기간 종료(90일) · 감액기간 종료(1~2년) · 생일 참고일" className="crm-contracts-badge crm-contracts-badge--violet" />
      </Stack>}
      description={<>기존 가입 보험과 신규 진행 계약을 함께 관리합니다. <strong>계약일·생년월일을 바탕으로 고객 연락 참고일을 계산합니다.</strong></>}
      actions={
        <Button variant="contained" className="css-15diaom crm-contract-primary" startIcon={<ContractDesignIcon name="file" />} onClick={() => setForm(true)}>
          보험 계약 등록
        </Button>
      }
    >
      <ContractReminderFilters selected={reminder} counts={resource.data?.reminder_counts} loading={resource.loading}
        onChange={value => { setReminder(value); setPage(1); }}
        viewControl={<div className="crm-contract-view-control"><span>화면 표시 밀도</span>
          <ToggleButtonGroup exclusive size="small" value={view} aria-label="계약 보기 방식"
            onChange={(_, value) => { if (value) setView(value); }}>
            <ToggleButton value="rows"><ContractDesignIcon name="rows" />초슬림 행(내고객형)</ToggleButton>
            <ToggleButton value="cards"><ContractDesignIcon name="grid" />2열 컴팩트 카드</ToggleButton>
          </ToggleButtonGroup>
        </div>} />
      <Panel className="crm-contracts-filters">
        <form className="crm-contract-search-row" onSubmit={event => {
          event.preventDefault(); setSearch(q); setPage(1);
        }}>
          <div className="crm-contract-search">
            <label className="crm-contract-sr-only" htmlFor=":rbl:">보험회사·상품명·증권번호·계약자/피보험자 검색</label>
            <ContractDesignIcon name="search" />
            <input id=":rbl:" value={q} onChange={event => setQ(event.target.value)} placeholder="보험회사·상품명·증권번호·계약자/피보험자 성함 검색" />
            <button type="submit">검색</button>
          </div>
          <select id=":rbn:" aria-label="유지 상태" value={status} onChange={event => { setStatus(event.target.value); setPage(1); }}>
            {Object.entries({ "": "유지 상태(설계사 메모): 전체", ...MAINTENANCE }).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <select id=":rbp:" aria-label="보기" value={archived} onChange={event => { setArchived(event.target.value); setPage(1); }}>
            <option value="false">보기: 관리 계약</option><option value="true">보기: 보관 계약</option><option value="all">보기: 전체 계약</option>
          </select>
        </form>
        <div className="crm-contract-filter-row">
          <select id=":rbr:" aria-label="등록 구분" value={origin} onChange={event => { setOrigin(event.target.value); setPage(1); }}>
            <option value="">등록 구분: 전체</option><option value="EXISTING">기존 가입 보험</option><option value="NEW">신규 진행 계약</option>
          </select>
          <select id=":rbt:" aria-label="가입 진행" value={progress} onChange={event => { setProgress(event.target.value); setPage(1); }}>
            {Object.entries({ "": "가입 진행: 전체", ...PROGRESS }).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <div className="crm-contract-date-filter"><label htmlFor=":rbv:">성립일 시작</label><input id=":rbv:" type="date" value={dateFrom} onChange={event => { setDateFrom(event.target.value); setPage(1); }} /></div>
          <div className="crm-contract-date-filter"><label htmlFor=":rc0:">성립일 종료</label><input id=":rc0:" type="date" value={dateTo} onChange={event => { setDateTo(event.target.value); setPage(1); }} /></div>
        </div>
      </Panel>
      <State resource={resource} />
      <div className="crm-contract-batch-bar" role="group" aria-label="계약 일괄 작업">
        <div>
          <FormControlLabel className="crm-contract-batch-select" label="현재 페이지 전체 선택" control={
            <Checkbox size="small" checked={allSelected} indeterminate={selected.length > 0 && !allSelected}
              disabled={!selectable.length} onChange={event => select(event.target.checked ? selectable.map(contract => contract.id) : [])} />
          } />
          <span className="crm-contract-batch-divider" aria-hidden="true">|</span><Typography className="crm-contracts-count css-kqdt2x" variant="body2" role="status">총 <strong>{resource.data?.total || 0}</strong>건</Typography>
          <span className="crm-contract-batch-count">선택 {selected.length}건</span>
        </div>
        <div>
          <Button variant="outlined" size="small" className="crm-contract-batch-schedule" disabled={!selected.length}
            startIcon={<ContractDesignIcon name="calendar" />} onClick={() => setBatch({ action: "schedule", contracts: selected, reminder })}>선택 계약 [할 일·방문 일정]에 알림 등록</Button>
          <Button variant="outlined" size="small" className="crm-contract-batch-coming" disabled startIcon={<ContractDesignIcon name="message" />}>보조개톡 안부·종료안내 발송 <span>준비중</span></Button>
          <Button variant="outlined" size="small" className="crm-contract-batch-archive" disabled={!selected.length}
            startIcon={<ContractDesignIcon name="archive" />} onClick={() => setBatch({ action: "archive", contracts: selected })}>선택 계약 보관</Button>
        </div>
      </div>
      {batchNotice && <Alert severity="info" onClose={() => setBatchNotice("")} sx={{ mb: 1 }}>{batchNotice}</Alert>}
      <section className="crm-contract-list-panel" aria-label="계약 목록">
      {view === "rows" && resource.data?.items.length > 0 && <div className="crm-contract-column-labels" aria-hidden="true">
        <span>보험사 · 상품명 · 증권번호</span><span>피보험자 · 생일 · 상령일</span><span>성립일 · 월 보험료</span><span>면책·감액 참고일</span><span>상세 · 일정 관리</span>
      </div>}
      <div className={`crm-contract-entries crm-contract-entries--${view}`}>
        {resource.data?.items.map(contract => <ContractListEntry key={contract.id} contract={contract} selected={reminder}
          checked={selected.some(item => item.id === contract.id)}
          onCheck={selectable.includes(contract) ? checked => select(checked
            ? [...selected.map(item => item.id), contract.id] : selected.filter(item => item.id !== contract.id).map(item => item.id)) : undefined}
          onDetails={() => setDetailContract(contract)} onSchedule={() => scheduleFor(contract)} />)}
      </div>
      {resource.data && !resource.data.total && <div className="crm-contract-empty">
        <span className="crm-contract-empty-icon"><ContractDesignIcon name="bell" /></span>
        <p className="css-uz2gxn">등록된 항목이 없습니다.</p>
        <p>계약 성립일과 피보험자 생년월일을 등록하면 상령일, 면책·감액기간 종료, 생일 참고일을 확인할 수 있습니다.</p>
        <Button className="crm-contract-primary" variant="contained" startIcon={<ContractDesignIcon name="file" />} onClick={() => setForm(true)}>보험 계약 등록하기</Button>
      </div>}
      </section>
      <Pages data={resource.data} onChange={setPage} />
      {form && (
        <ContractForm
          customerId={customerId ? Number(customerId) : undefined}
          onClose={() => setForm(false)}
          onSave={async (data) => {
            const result = await crmPost("/contracts", data);
            navigate(`/crm/contracts/${result.id}`);
          }}
        />
      )}
      {schedule && <TaskForm contractTaskLayout customerId={schedule.customerId} contractId={schedule.contract.id}
        initialReminder={schedule.event} onClose={() => setSchedule(null)}
        onSave={data => crmPost("/tasks", data)} />}
      {editContract && <ContractForm value={editContract} onClose={() => setEditContract(null)} onSave={async data => {
        await crmPut(`/contracts/${editContract.id}`, data);
        setDetailContract(null);
        resource.reload();
      }} />}
      <ContractReminderDrawer contract={detailContract} onSaved={() => { setDetailContract(null); setBatchNotice("계약 변경사항을 저장했습니다."); resource.reload(); }} onEdit={async () => {
        try { setEditContract(await crmGet(`/contracts/${detailContract.id}`)); }
        catch (error) { setBatchNotice(crmError(error)); }
      }} onArchive={() => setBatch({ action: "archive", contracts: [detailContract] })} onClose={() => setDetailContract(null)}
        onPrevious={detailIndex > 0 ? () => setDetailContract(pageContracts[detailIndex - 1]) : undefined}
        onNext={detailIndex >= 0 && detailIndex < pageContracts.length - 1 ? () => setDetailContract(pageContracts[detailIndex + 1]) : undefined}
        onSchedule={() => setBatch({ action: "schedule", contracts: [detailContract], reminder: "" })} />
      {batch && <ContractBatchDialog {...batch} onClose={() => setBatch(null)} onDone={batchDone} />}
    </Page></div>
  );
}
export function ContractDetailPage() {
  const { contractId } = useParams();
  const resource = useCrm(`/contracts/${contractId}`);
  const c = resource.data;
  const [editor, setEditor] = useState("");
  const navigate = useNavigate();
  const doc = c?.proposal_document;
  const maintTone = c?.maintenance === "ACTIVE" ? "active" : ["LAPSED", "TERMINATED"].includes(c?.maintenance) ? "danger" : "neutral";
  const infoFields = c
    ? [
        ["보험회사", c.insurer],
        ["보험 종류", c.category],
        ["상품명", c.product],
        ["증권/설계번호", c.policy_number],
        ["청약일", c.application_date],
        ["성립일", c.establishment_date],
        ["보장 기간", `${c.coverage_start || "미확인"} ~ ${c.coverage_end || "미확인"}`],
        ["납입 주기", CYCLES[c.payment_cycle] || "미확인"],
        ["납입 기간", c.payment_period],
        ["납입 종료일", c.payment_end],
        ["정보 출처", c.information_source],
        ["확인 상태", c.verified ? `확인됨 · ${c.verified_date || "확인일 미입력"}` : "미확인"],
      ]
    : [];

  return (
    <div className="crm-contracts-workspace crm-contract-detail-workspace">
      <Page
        title={c?.product || "계약 상세"}
        headerClassName="crm-contracts-header crm-contract-detail-header"
        badges={
          <Stack direction="row" gap={0.75} flexWrap="wrap" mb={0.5}>
            <Chip size="small" label="CONTRACT WORKSPACE" className="crm-contracts-badge" />
            {c && (
              <Chip
                size="small"
                label={c.origin === "NEW" ? "신규 진행 계약" : "기존 가입 보험"}
                className="crm-contracts-badge crm-contracts-badge--violet"
              />
            )}
          </Stack>
        }
        description={
          c
            ? [c.insurer, c.policy_number ? `증권 #${c.policy_number}` : "증권번호 미등록", c.establishment_date ? `성립일 ${c.establishment_date}` : null]
                .filter(Boolean)
                .join(" · ")
            : "계약 상세 정보와 연락 참고일, 상태 이력을 관리합니다."
        }
        actions={
          <div className="crm-contract-detail-header-actions">
            <Button
              variant="outlined"
              component={Link}
              to="/crm/contracts"
              className="crm-contract-detail-back-btn"
            >
              계약 목록
            </Button>
            {c && (
              <Button
                variant="outlined"
                className="crm-contract-detail-archive-btn"
                startIcon={<ContractDesignIcon name="archive" />}
                onClick={() => setEditor("archive")}
              >
                {c.archived ? "보관 해제" : "보관"}
              </Button>
            )}
            {c && !c.archived && (
              <>
                <Button
                  variant="outlined"
                  className="crm-contract-detail-status-btn"
                  onClick={() => setEditor("status")}
                >
                  상태 변경
                </Button>
                <Button
                  variant="contained"
                  className="crm-contract-primary"
                  startIcon={<ContractDesignIcon name="file" />}
                  onClick={() => setEditor("contract")}
                >
                  정보 수정
                </Button>
              </>
            )}
          </div>
        }
      >
        <State resource={resource} />
        {c && (
          <div className="crm-contract-detail-body">
            {c.archived && (
              <Alert severity="info" sx={{ borderRadius: "14px" }}>
                보관된 계약입니다. 보관 해제 후 정보 수정이나 상태 변경을 진행할 수 있습니다.
              </Alert>
            )}

            <section className="crm-contract-detail-hero">
              <div className="crm-contract-detail-hero-badges">
                {c.insurer && <span className="crm-contract-detail-insurer">{c.insurer}</span>}
                <span className={`crm-contract-detail-pill crm-contract-detail-pill--${c.origin === "NEW" ? "violet" : "slate"}`}>
                  {c.origin === "NEW" ? "신규 진행 계약" : "기존 가입 보험"}
                </span>
                {c.progress && (
                  <span className="crm-contract-detail-pill crm-contract-detail-pill--blue">
                    진행: {PROGRESS[c.progress]}
                  </span>
                )}
                <span className={`crm-contract-detail-pill crm-contract-detail-pill--${maintTone}`}>
                  유지: {MAINTENANCE[c.maintenance] || "미확인"}
                </span>
                <span className={`crm-contract-detail-pill crm-contract-detail-pill--${c.verified ? "active" : "warn"}`}>
                  {c.verified ? `확인됨 (${c.verified_date || "날짜 미입력"})` : "미확인 계약"}
                </span>
              </div>

              <div className="crm-contract-detail-kpis">
                <div className="crm-contract-detail-kpi crm-contract-detail-kpi--green">
                  <span>월 환산 보험료</span>
                  <strong>{c.premium_monthly == null ? "미확인" : `${money(c.premium_monthly)}원`}</strong>
                  <small>
                    납입 {c.premium == null ? "미확인" : `${money(c.premium)}원`} · {CYCLES[c.payment_cycle] || "주기 미확인"}
                  </small>
                </div>
                <div className="crm-contract-detail-kpi">
                  <span>계약 성립일</span>
                  <strong>{c.establishment_date || "미확인"}</strong>
                  <small>청약일 {c.application_date || "미확인"}</small>
                </div>
                <div className="crm-contract-detail-kpi">
                  <span>보장 기간</span>
                  <strong>
                    {c.coverage_start || "미확인"} ~ {c.coverage_end || "미확인"}
                  </strong>
                  <small>보험 종류: {c.category || "미확인"}</small>
                </div>
                <div className="crm-contract-detail-kpi">
                  <span>납입 기간</span>
                  <strong>{c.payment_period || "미확인"}</strong>
                  <small>납입 종료일 {c.payment_end || "미확인"}</small>
                </div>
              </div>
            </section>

            <ContractReminderDetails events={c.reminders} />

            <div className="crm-contract-detail-grid">
              <div className="crm-contract-detail-main">
                {c.proposal_generation_id && (
                  <section className="crm-contract-source-doc">
                    <div className="crm-contract-source-doc-head">
                      <span className="crm-contract-source-doc-badge">
                        <ContractDesignIcon name="sparkles" />
                        AI 생성 문서에서 등록된 계약
                      </span>
                      {doc?.prompt_title && (
                        <span className="crm-doc-prompt-pill">{doc.prompt_title}</span>
                      )}
                    </div>
                    <h3>{doc?.title || `생성 문서 #${c.proposal_generation_id}`}</h3>
                    {doc?.summary && <p className="crm-contract-source-doc-summary">{doc.summary}</p>}
                    <div className="crm-contract-source-doc-footer">
                      <span className="crm-mono">
                        문서 #{c.proposal_generation_id}
                        {doc?.created_at ? ` · ${dateTime(doc.created_at)}` : ""}
                      </span>
                      <div className="crm-contract-source-doc-actions">
                        {(!doc || doc.status === "COMPLETED") && (
                          <Button
                            size="small"
                            variant="outlined"
                            component="a"
                            href={proposalFileUrl(c.proposal_generation_id, "output")}
                            target="_blank"
                            rel="noopener noreferrer"
                            startIcon={<ContractDesignIcon name="sheet" />}
                          >
                            보고서 열기
                          </Button>
                        )}
                        <Button
                          size="small"
                          variant="contained"
                          className="crm-contract-source-doc-btn"
                          component={Link}
                          to={`/proposals?generationId=${c.proposal_generation_id}`}
                          startIcon={<ContractDesignIcon name="document" />}
                        >
                          문서 상세 보기
                        </Button>
                      </div>
                    </div>
                  </section>
                )}

                <section className="crm-contract-section-card">
                  <div className="crm-contract-section-card-head">
                    <div>
                      <h3>
                        <ContractDesignIcon name="clipboard" />
                        계약 상세 정보
                      </h3>
                      <p>보험사, 증권번호, 납입 및 보장 일정</p>
                    </div>
                    {!c.archived && (
                      <Button size="small" variant="outlined" onClick={() => setEditor("contract")}>
                        수정
                      </Button>
                    )}
                  </div>
                  <div className="crm-contract-info-grid">
                    {infoFields.map(([label, text]) => {
                      const hasValue = Boolean(text && String(text).trim() && text !== "미확인" && text !== "미확인 ~ 미확인");
                      return (
                        <div key={label} className={`crm-contract-info-tile${hasValue ? "" : " is-empty"}`}>
                          <span>{label}</span>
                          <strong>{text || "미확인"}</strong>
                        </div>
                      );
                    })}
                  </div>
                </section>

                <section className="crm-contract-section-card">
                  <div className="crm-contract-section-card-head">
                    <div>
                      <h3>
                        <ContractDesignIcon name="shield" />
                        주요 보장 · 특약 및 기간 메모
                      </h3>
                      <p>설계사 확인 메모 및 특약 요약</p>
                    </div>
                  </div>
                  <div className="crm-contract-notes-stack">
                    <div className={`crm-contract-note-box${c.coverage_note ? "" : " is-empty"}`}>
                      <span>주요 보장·특약</span>
                      <p>{c.coverage_note || "등록된 주요 보장·특약 메모가 없습니다."}</p>
                    </div>
                    <div className={`crm-contract-note-box${c.period_note ? "" : " is-empty"}`}>
                      <span>기간 설명</span>
                      <p>{c.period_note || "등록된 기간 설명이 없습니다."}</p>
                    </div>
                  </div>
                </section>

                <Attachments contractId={c.id} disabled={c.archived} />
              </div>

              <div className="crm-contract-detail-side">
                <section className="crm-contract-section-card">
                  <div className="crm-contract-section-card-head">
                    <div>
                      <h3>
                        <ContractDesignIcon name="person" />
                        계약 관계자 ({c.parties.length}명)
                      </h3>
                      <p>계약자 · 피보험자 연결 고객</p>
                    </div>
                  </div>
                  <div className="crm-contract-party-list">
                    {c.parties.map((p, i) => {
                      const isHolder = p.role === "HOLDER";
                      return (
                        <article key={i} className="crm-contract-party-card">
                          <div className="crm-contract-party-card-top">
                            <span className={`crm-contract-detail-pill crm-contract-detail-pill--${isHolder ? "active" : "violet"}`}>
                              {isHolder ? "계약자" : "피보험자"}
                            </span>
                            <strong>{p.name || "성함 미입력"}</strong>
                          </div>
                          <div className="crm-contract-party-card-meta">
                            <span>주민번호: {p.resident_number || "미확인"}</span>
                            <span>연락처: {p.phone ? formatPhone(p.phone) : "미등록"}</span>
                          </div>
                          {p.customer_id && (
                            <div className="crm-contract-party-card-actions">
                              <CustomerLink id={p.customer_id} name="고객 상세 보기" />
                              <Button
                                size="small"
                                variant="outlined"
                                disabled={c.archived}
                                startIcon={<ContractDesignIcon name="calendar" />}
                                onClick={() => setEditor(`task:${p.customer_id}`)}
                              >
                                후속 업무 등록
                              </Button>
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                </section>

                <section className="crm-contract-section-card">
                  <div className="crm-contract-section-card-head">
                    <div>
                      <h3>
                        <ContractDesignIcon name="calendar_clock" />
                        계약 상태 이력 ({c.events.length}건)
                      </h3>
                      <p>등록 및 진행·유지 상태 변경 로그</p>
                    </div>
                    {!c.archived && (
                      <Button size="small" variant="outlined" onClick={() => setEditor("status")}>
                        상태 변경
                      </Button>
                    )}
                  </div>
                  <div className="crm-contract-timeline">
                    {c.events.map((e) => {
                      const dotKind = e.correction ? "correction" : e.type === "CREATED" ? "created" : "change";
                      return (
                        <article key={e.id} className="crm-contract-timeline-item">
                          <span className={`crm-contract-timeline-dot is-${dotKind}`} aria-hidden="true" />
                          <div className="crm-contract-timeline-content">
                            <div className="crm-contract-timeline-head">
                              <span className={`crm-contract-timeline-type is-${dotKind}`}>
                                {e.correction ? "정정" : e.type === "CREATED" ? "최초 등록" : "상태 변경"}
                              </span>
                              <time>{e.occurred_date || dateTime(e.created_at)}</time>
                            </div>
                            <div className="crm-contract-timeline-badges">
                              {PROGRESS[e.progress] && (
                                <span className="crm-contract-detail-pill crm-contract-detail-pill--blue">
                                  {PROGRESS[e.progress]}
                                </span>
                              )}
                              {MAINTENANCE[e.maintenance] && (
                                <span className="crm-contract-detail-pill crm-contract-detail-pill--neutral">
                                  {MAINTENANCE[e.maintenance]}
                                </span>
                              )}
                            </div>
                            <p>{e.reason || "최초 등록"}</p>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              </div>
            </div>

            {editor === "contract" && (
              <ContractForm
                value={c}
                onClose={() => setEditor("")}
                onSave={async (data) => {
                  await crmPut(`/contracts/${c.id}`, data);
                  resource.reload();
                }}
              />
            )}
            {editor === "status" && (
              <StatusForm
                value={c}
                onClose={() => setEditor("")}
                onSave={async (data) => {
                  await crmPost(`/contracts/${c.id}/status-events`, data);
                  resource.reload();
                }}
              />
            )}
            {editor === "archive" && (
              <Archive
                kind="contracts"
                value={c}
                onClose={() => setEditor("")}
                onDone={resource.reload}
              />
            )}
            {editor.startsWith("task:") && (
              <TaskForm
                customerId={Number(editor.split(":")[1])}
                contractId={c.id}
                onClose={() => setEditor("")}
                onSave={async (data) => {
                  await crmPost("/tasks", data);
                  navigate("/crm/tasks");
                }}
              />
            )}
          </div>
        )}
      </Page>
    </div>
  );
}
export function TasksPage() {
  const [status, setStatus] = useState(
    new URLSearchParams(window.location.search).has("customer_id")
      ? ""
      : "TODAY",
  );
  const [page, setPage] = useState(1);
  const [editor, setEditor] = useState(false);
  const [value, setValue] = useState(null);
  const customerId = new URLSearchParams(window.location.search).get(
    "customer_id",
  );
  const resource = useCrm("/tasks", {
    status,
    page,
    customer_id: customerId || undefined,
  });
  return (
    <Page
      title="할 일·방문 일정"
      description="고객·계약에서 등록한 업무를 함께 확인합니다."
      actions={
        <Button
          variant="contained"
          onClick={() => {
            setValue(null);
            setEditor(true);
          }}
        >
          업무 등록
        </Button>
      }
    >
      <Panel>
        <Field
          label="업무 보기"
          value={status}
          options={{
            TODAY: "오늘 할 일",
            OVERDUE: "기한 초과",
            UPCOMING: "앞으로 할 일",
            PENDING: "전체 예정",
            DONE: "완료",
            CANCELLED: "취소",
            "": "전체",
          }}
          onChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
        />
      </Panel>
      <State resource={resource} />
      {resource.data?.items.map((t) => (
        <TaskCard
          key={t.id}
          task={t}
          onEdit={(v) => {
            setValue(v);
            setEditor(true);
          }}
        />
      ))}
      {resource.data && !resource.data.total && (
        <Empty>해당하는 업무가 없습니다.</Empty>
      )}
      <Pages data={resource.data} onChange={setPage} />
      {editor && (
        <TaskForm
          value={value}
          customerId={customerId ? Number(customerId) : undefined}
          onClose={() => setEditor(false)}
          onSave={async (data) => {
            await (value
              ? crmPut(`/tasks/${value.id}`, data)
              : crmPost("/tasks", data));
            resource.reload();
          }}
        />
      )}
    </Page>
  );
}
