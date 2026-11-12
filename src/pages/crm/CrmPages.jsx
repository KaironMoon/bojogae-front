import { CustomerWorkspace, CustomerField } from "./CustomerReference";
import CustomerBatchGroups from "./CrmCustomerBatchGroups";
/* eslint-disable react/prop-types */
import { CustomerDesignRow, CustomerDesignDrawer, CustomerConsultationTimeline, CustomerContractPreview } from "./CrmCustomerDesign";
import ContractDesignIcon from "./ContractDesignIcon";
import { useState } from "react";
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
import { Link, useNavigate, useParams } from "react-router-dom";
import { crmGet, crmPost, crmPut, crmError, crmDeleteCustomers } from "@/services/crm-service";
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
        {error && <Alert severity="error">{error}</Alert>}보관 시 기본 목록에서
        제외되며 기존 기록은 유지됩니다.
      </DialogContent>
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
  return <Dialog open onClose={busy?undefined:onClose} fullWidth maxWidth="xs" aria-labelledby="customer-delete-title" slotProps={{paper:{className:"crm-customer-dialog customer-delete-dialog"}}}><DialogTitle id="customer-delete-title"><ContractDesignIcon name="trash" />선택 고객 삭제</DialogTitle><DialogContent>{error&&<Alert severity="error">{error}</Alert>}<Typography>선택하신 {customers.length}명의 고객을 삭제하시겠습니까? 삭제된 고객은 목록에서 제외됩니다.</Typography><Typography variant="body2" sx={{mt:2}}>고객 정보와 상담·할 일 기록은 서버에 보존됩니다. 계약 또는 첨부파일이 연결된 고객은 먼저 연결 정보를 정리해야 합니다.</Typography></DialogContent><DialogActions><Button onClick={onClose} disabled={busy}>닫기</Button><Button variant="contained" color="error" onClick={remove} disabled={busy}>{busy?"삭제 중…":`${customers.length}명 삭제`}</Button></DialogActions></Dialog>;
}
export function CustomersPage() {
  const [pageSize, setPageSize] = useState(30);
  const [deleteTargets, setDeleteTargets] = useState(null);
  const [density, setDensity] = useState("rows");
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
  const selectionScope = JSON.stringify([search, stage, archived, missing, unconfirmed, tag, hasContract, page, view, groupId, allCustomers, pageSize]);
  const selectable = resource.data?.items || [];
  const selected = !resource.loading && !resource.error && selection.data === resource.data && selection.scope === selectionScope
    ? selectable.filter((customer) => selection.ids.includes(customer.id)) : [];
  function selectCustomers(ids) {
    setSelection({ data: resource.data, scope: selectionScope, ids });
  }
  function finishRegistration(count) {
    setForm(false);
    setView("list");
    setPage(1);
    setActionNotice(`${count}명의 고객을 등록했습니다.`);
    resource.reload();
  }
  return (
    <div className="crm-customers-workspace"><CustomerWorkspace
      headerClassName="crm-customers-header"
      badges={<div className="crm-customer-header-badges"><span>SMART CRM & GROUP WORKSPACE</span><span>보조개톡 · 보장분석 · 방문일정 실시간 연동</span></div>}
      title="내고객"
      description="상담부터 보험·방문까지, 고객의 업무를 한곳에서 관리합니다. (고객명 또는 우측 [상세] 버튼을 누르면 상세 워크스페이스가 열립니다)"
      actions={
        <>
          <Button className="crm-customer-group-button" startIcon={<ContractDesignIcon name="folder" />} onClick={() => setGroupTargets([])}>고객 그룹 관리 <span className="crm-customer-group-count">{groups.data?.items.length ?? "—"}</span></Button>
          <Button className="crm-customer-primary" startIcon={<ContractDesignIcon name="user_plus" />} variant="contained" onClick={() => setForm(true)}>
            고객 등록
          </Button>
        </>
      }
    >
      <section className="crm-customer-switches">
        <div><Tabs value={view} onChange={(_, v) => { selectCustomers([]); setView(v); }}><Tab value="list" icon={<ContractDesignIcon name="rows" />} iconPosition="start" label="내고객 목록" /><Tab value="map" icon={<ContractDesignIcon name="pin" />} iconPosition="start" label="주변 고객 지도" /></Tabs>
        <div className="crm-customer-list-controls"><CustomerPageSize value={pageSize} onChange={v => { setPageSize(v); setPage(1); selectCustomers([]); }} /><div className="crm-customer-density"><span>화면 표시 밀도:</span><ToggleButtonGroup exclusive size="small" value={density} onChange={(_, v) => { if (v) setDensity(v); }}><ToggleButton value="rows"><ContractDesignIcon name="rows" />초슬림 행(최대노출)</ToggleButton><ToggleButton value="cards"><ContractDesignIcon name="grid" />2열 컴팩트 카드</ToggleButton></ToggleButtonGroup></div></div></div>
        <div className="crm-customer-group-pills"><Button aria-pressed={!groupId} onClick={() => { setGroupId(""); setPage(1); }}>전체 고객</Button>{groups.data?.items.map(g => <Button key={g.id} aria-pressed={groupId === g.id} onClick={() => { setGroupId(g.id); setView("list"); setPage(1); }}>{g.name} {g.customer_count}명</Button>)}<Button onClick={() => setGroupTargets([])}>+ 새 그룹 만들기 · 편집</Button></div>
        {groups.error && <Alert severity="warning">{groups.error}</Alert>}
      </section>
      {view === "map" ? (
        <section className="crm-customer-map"><header><div><span>LOCATION CRM</span><h3>주변 고객 지도 & 방문 동선</h3><p>주소가 등록된 고객(연락 중단 제외)의 위치를 지도에서 확인하고 원클릭 길찾기를 실행합니다.</p></div><Button onClick={() => setView("list")}>← 내고객 목록으로 돌아가기</Button></header><CrmMap /></section>
      ) : (
        <>
          <Panel className="crm-customer-filters">
            <Box component="form" className="crm-customer-filter-grid" onSubmit={e => { e.preventDefault(); setSearch(q); setPage(1); }}>
              <div className="crm-customer-search"><ContractDesignIcon name="search" /><CustomerField id=":r1ea:" inputProps={{ "aria-label": "이름·카톡대화명·연락처·주소·메모 검색" }} placeholder="이름·카톡대화명·연락처·주소·메모 검색" value={q} onChange={setQ} /><Button type="submit">검색</Button></div>
              <CustomerField id=":r1ec:" inputProps={{ "aria-label": "상담 단계" }} SelectProps={{ displayEmpty: true }} value={stage} options={{ "": "상담 단계: 전체", ...STAGES }} onChange={v => { setStage(v); setPage(1); }} />
              <CustomerField id=":r1ee:" inputProps={{ "aria-label": "보기" }} value={allCustomers ? "ALL" : archived ? "ARCHIVED" : missing ? "MISSING" : unconfirmed ? "UNCONFIRMED" : "ACTIVE"} options={{ ACTIVE: "보기: 관리 고객", ARCHIVED: "보관된 고객", ALL: "전체 고객", MISSING: "위치 미등록", UNCONFIRMED: "미확정 주소만 보기" }} onChange={v => { setAllCustomers(v === "ALL"); setArchived(v === "ARCHIVED"); setMissing(v === "MISSING"); setUnconfirmed(v === "UNCONFIRMED"); setPage(1); }} />
              <CustomerField id=":r1eg:" inputProps={{ "aria-label": "태그" }} placeholder="#태그 (예: 현대홈쇼핑, 지점장)" value={tag} onChange={v => { setTag(v); setPage(1); }} />
              <CustomerField id=":r1eh:" inputProps={{ "aria-label": "계약 보유" }} SelectProps={{ displayEmpty: true }} value={hasContract} options={{ "": "계약 보유: 전체", true: "계약 보유 (1건 이상)", false: "미보유 (0건)" }} onChange={v => { setHasContract(v); setPage(1); }} />
            </Box>
          </Panel>
          <State resource={resource} />
          {actionNotice && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setActionNotice("")}>{actionNotice}</Alert>}
          <div className="crm-customer-batch">
            <div className="customer-ref-selection">
              {<FormControlLabel label="현재 페이지 전체 선택" control={<Checkbox size="small" disabled={resource.loading || !!resource.error || !selectable.length} checked={selected.length > 0 && selected.length === selectable.length} indeterminate={selected.length > 0 && selected.length < selectable.length} onChange={e => selectCustomers(e.target.checked ? selectable.map(c => c.id) : [])} />} />}
              <p>총 <strong>{resource.data?.total || 0}</strong>명 <small>(현재 페이지 표시 {resource.data?.items.length || 0}명)</small></p>
              <span>선택 {selected.length}명</span>{selected.length > 0 && <Button className="customer-clear-selection" startIcon={<ContractDesignIcon name="close" />} onClick={() => selectCustomers([])}>선택 해제</Button>}
            </div>
            {<div className="customer-ref-batch-actions"><Button startIcon={<ContractDesignIcon name="folder" />} variant="outlined" disabled={!selected.length || selected.some(c => c.archived)} onClick={() => setGroupTargets(selected)}>선택 고객 그룹에 추가</Button><Button className="customer-bulk-delete" startIcon={<ContractDesignIcon name="trash" />} disabled={!selected.length || resource.loading} onClick={() => setDeleteTargets(selected)}>선택 고객 삭제</Button></div>}
          </div>
          <div className={`crm-customer-list crm-customer-list--${density}`}>
            {density === "rows" && <div className="crm-customer-list-head"><span>고객명 (카톡대화명 · 메모)</span><span>상담단계 · 그룹</span><span>연락처 · 주소 상태</span><span>최근 상담 · 보유계약</span><span>업무액션</span></div>}
            {resource.data?.items.map(c => <CustomerDesignRow key={c.id} customer={c} onDetails={() => setDetail(c)} checked={selected.some(item => item.id === c.id)} onCheck={checked => selectCustomers(checked ? [...selected.map(item => item.id), c.id] : selected.filter(item => item.id !== c.id).map(item => item.id))} />)}
          </div>
          {resource.data && !resource.data.items.length && <Empty />}
          <div className="crm-customer-pagination"><span>전체 {resource.data?.total || 0}명 중 {resource.data?.page_start ?? "—"} - {resource.data?.page_end ?? "—"}번째 고객 표시 (페이지당 {pageSize}명 고밀도 뷰)</span><CustomerPageSize bottom value={pageSize} onChange={v => { setPageSize(v); setPage(1); selectCustomers([]); }} /><Pages data={resource.data} onChange={setPage} /></div>
        </>
      )}
      {form && (
        <CrmImport
          onClose={() => setForm(false)}
          onDone={finishRegistration}
          renderRegistration={(spreadsheet) => (
            <CustomerForm open={spreadsheet.open} spreadsheet={spreadsheet} onClose={() => setForm(false)}
              onSave={async (data) => {
                await crmPost("/customers", data);
                finishRegistration(1);
              }} />
          )}
        />
      )}
      {groupTargets?.length > 0 && <CustomerBatchGroups customers={groupTargets} onClose={() => { setGroupTargets(null); groups.reload(); resource.reload(); }} />}
      {groupTargets?.length === 0 && <CrmCustomerGroups onFilter={id => { setGroupId(id); setView("list"); setPage(1); setGroupTargets(null); groups.reload(); }} selectedCustomers={groupTargets} onClose={() => { setGroupTargets(null); groups.reload(); resource.reload(); }} />}
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
  return (
    <Panel>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        gap={1}
      >
        <Box>
          <Typography fontWeight={700}>
            {c.insurer} · {c.product}
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={1} my={1}>
            <Chip
              size="small"
              label={
                c.origin === "EXISTING" ? "기존 가입 보험" : "신규 진행 계약"
              }
            />
            {c.progress && <Chip size="small" label={PROGRESS[c.progress]} />}
            <Chip size="small" label={MAINTENANCE[c.maintenance]} />
          </Stack>
          <Typography variant="body2">
            {c.premium === null ? "보험료 미확인" : `${money(c.premium)}원`} ·{" "}
            {CYCLES[c.payment_cycle]}
          </Typography>
        </Box>
        <Button component={Link} to={`/crm/contracts/${c.id}`}>
          계약 상세
        </Button>
      </Stack>
    </Panel>
  );
}
function TaskCard({ task: t, onEdit, customerLocation }) {
  return (
    <Panel>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        gap={1}
      >
        <Box>
          <Typography fontWeight={700}>{t.title}</Typography>
          <Stack
            direction="row"
            gap={1}
            alignItems="center"
            flexWrap="wrap"
            my={1}
          >
            <Chip size="small" label={KINDS[t.kind]} />
            <Chip size="small" label={TASK_STATUS[t.status]} />
            {t.is_overdue && (
              <Chip size="small" label="기한 초과" color="error" />
            )}
            <Typography variant="body2">
              {t.due_at ? dateTime(t.due_at) : `${t.due_date} · 시각 미정`}
            </Typography>
          </Stack>
          <CustomerLink id={t.customer_id} name={t.customer_name} />
          <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
            {t.note}
          </Typography>
        </Box>
        <Stack direction="row" alignItems="center">
          <Button onClick={() => onEdit(t)}>수정·처리</Button>
          {t.kind === "VISIT" && (
            <Directions
              location={
                t.location?.lat == null
                  ? customerLocation || t.customer_location
                  : t.location
              }
            />
          )}
        </Stack>
      </Stack>
    </Panel>
  );
}
function Consultations({ customerId }) {
  const [page, setPage] = useState(1);
  const resource = useCrm(`/customers/${customerId}/consultations`, { page });
  return (
    <>
      <State resource={resource} />
      {resource.data?.items.map((r) => (
        <Panel key={r.id}>
          <Typography fontWeight={700}>
            {dateTime(r.occurred_at)} · {METHODS[r.method]} ·{" "}
            {RESULTS[r.result]}
          </Typography>
          <Typography sx={{ whiteSpace: "pre-wrap", mt: 1 }}>
            {r.content}
          </Typography>
          {r.contract_id && (
            <Button component={Link} to={`/crm/contracts/${r.contract_id}`}>
              관련 계약
            </Button>
          )}
        </Panel>
      ))}
      {resource.data && !resource.data.total && <Empty />}
      <Pages data={resource.data} onChange={setPage} />
    </>
  );
}
export function CustomerDetailPage() {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const resource = useCrm(`/customers/${customerId}`);
  const c = resource.data;
  const [tab, setTab] = useState("summary");
  const [editor, setEditor] = useState("");
  const [task, setTask] = useState(null);
  return (
    <Page
      headerClassName="crm-customer-detail-header"
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
      {c && (
        <>
          {c.archived && (
            <Alert severity="info" sx={{ mb: 2 }}>
              이전에 보관된 고객입니다. 기록을 확인하거나 고객을 삭제할 수 있습니다.
            </Alert>
          )}
          <Panel>
            <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap">
              <Chip label={STAGES[c.stage]} />
              {c.do_not_contact && (
                <Chip color="warning" label="연락 중단 요청" />
              )}
              {c.groups?.map(group => <Chip key={group.id} label={group.name} size="small" sx={{ color: "#5b21b6", bgcolor: "#f5f3ff" }} />)}
            </Stack>
            <Typography mt={2}>{c.phone || "연락처 미등록"}</Typography>
            <Typography>
              {c.location.address} {c.address_detail}
              {c.address_resolution?.status === "UNRESOLVED" && <Chip size="small" color="warning" label="미확정 주소" sx={{ ml: 1 }} />}
              {["PENDING", "PROCESSING"].includes(c.address_resolution?.status) && <Chip size="small" label="주소 확인 대기·진행" sx={{ ml: 1 }} />}
            </Typography>
            <Typography variant="caption">
              {ACCURACY[c.location.accuracy]}
            </Typography>
            <Stack className="crm-customer-detail-actions" direction="row" gap={1} mt={1} flexWrap="wrap">
              {c.phone && <Button href={`tel:${c.phone}`}>전화</Button>}
              <Directions location={c.location} />
              <Button
                disabled={c.archived}
                onClick={() => setEditor("consultation")}
              >
                상담 기록 등록
              </Button>
              <Button
                disabled={c.archived}
                onClick={() => {
                  setTask(null);
                  setEditor("task");
                }}
              >
                업무·방문 등록
              </Button>
              <Button
                disabled={c.archived}
                onClick={() => setEditor("contract")}
              >
                보험 등록
              </Button>
            </Stack>
          </Panel>
          <Tabs
            className="crm-customer-detail-tabs"
            value={tab}
            onChange={(_, v) => setTab(v)}
            variant="scrollable"
            sx={{ mb: 2 }}
          >
            <Tab label="요약" value="summary" />
            <Tab
              label={`상담 (${c.consultations.length})`}
              value="consultations"
            />
            <Tab label={`보험 계약 (${c.contracts.total})`} value="contracts" />
            <Tab label="업무·일정" value="tasks" />
            <Tab label="문서" value="files" />
          </Tabs>
          {tab === "summary" && (
            <>
              <Panel>
                <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
                  <Typography fontWeight={700}>최근 상담 내역</Typography>
                  <Button onClick={() => setTab("consultations")}>전체 보기</Button>
                </Stack>
                <CustomerConsultationTimeline items={(c.consultations || []).slice(0, 5)} />
              </Panel>
              <Panel>
                <Typography fontWeight={700} mb={1}>보유 보험 계약 ({c.contracts.total}건)</Typography>
                <CustomerContractPreview contracts={c.contracts} customerId={c.id} />
              </Panel>
              <Panel>
                <Typography fontWeight={700}>보험료 요약</Typography>
                <Typography variant="h6" mt={1}>
                  확인된 월 환산 보험료 {money(c.premium_summary.monthly_known)}
                  원
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  정상 유지·계약자 역할 기준 / 금액·주기 등 미확인{" "}
                  {c.premium_summary.unknown_count}건
                </Typography>
              </Panel>
              <Panel>
                <Typography fontWeight={700}>연락·방문 참고</Typography>
                {[
                  ["통화 가능 시간", c.call_preference],
                  ["방문 가능 시간", c.visit_preference],
                  ["방문 참고", c.visit_note],
                  ["카톡대화명", c.alias],
                  ["직업", c.occupation],
                  ["주민번호 앞 6자리·뒤 첫 1자리", c.resident_number],
                  ["유입", c.source],
                  ["접수일", c.received_display || c.received_date || c.received_raw],
                  ["생년월일", c.birth_display || c.birth_date || c.birth_raw],
                  ["상담 참고 보험료", c.premium_note],
                  ["메모", c.memo],
                ].map(([label, text]) => (
                  <Typography
                    key={label}
                    sx={{ my: 1, whiteSpace: "pre-wrap" }}
                  >
                    <strong>{label}</strong> {text || "미확인"}
                  </Typography>
                ))}
              </Panel>
              {c.tasks.items
                .filter((t) => t.status === "PENDING")
                .slice(0, 5)
                .map((t) => (
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
            </>
          )}
          {tab === "consultations" && (
            <Consultations
              key={JSON.stringify(c.consultations.map((r) => r.id))}
              customerId={c.id}
            />
          )}
          {tab === "contracts" && (
            <>
              {c.contracts.items.map((r) => (
                <ContractCard key={r.id} contract={r} />
              ))}
              {!c.contracts.total && <Empty />}
              <Button
                component={Link}
                to={`/crm/contracts?customer_id=${c.id}`}
              >
                전체 연결 계약 보기
              </Button>
            </>
          )}
          {tab === "tasks" && (
            <>
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
              {!c.tasks.total && <Empty />}
              <Button component={Link} to={`/crm/tasks?customer_id=${c.id}`}>
                전체 업무 보기
              </Button>
            </>
          )}
          {tab === "files" && (
            <Attachments customerId={c.id} disabled={c.archived} />
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
      )}
    </Page>
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
  return <Dialog open onClose={busy ? undefined : onClose} aria-labelledby="crm-contract-batch-title" fullWidth maxWidth="xs" slotProps={{ paper: { className: `crm-contract-batch-dialog crm-contract-batch-dialog--${action}` } }}>
    <DialogTitle id="crm-contract-batch-title"><ContractDesignIcon name={archive ? "archive" : "calendar"} />선택한 계약 {contracts.length}건 {archive ? "보관" : "알림 등록"}</DialogTitle>
    <DialogContent>
      {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
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
  </Dialog>;
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
      <Panel className="crm-contracts-filters css-cj0pfk">
        <form className="crm-contract-search-row css-pyv44k" onSubmit={event => {
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
        <div className="crm-contract-filter-row css-94s6u9">
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
  return (
    <Page
      title={c?.product || "계약 상세"}
      actions={
        <>
          <Button component={Link} to="/crm/contracts">
            계약 목록
          </Button>
          {c && (
            <Button onClick={() => setEditor("archive")}>
              {c.archived ? "보관 해제" : "보관"}
            </Button>
          )}
          {c && !c.archived && (
            <>
              <Button onClick={() => setEditor("status")}>상태 변경</Button>
              <Button variant="contained" onClick={() => setEditor("contract")}>
                정보 수정
              </Button>
            </>
          )}
        </>
      }
    >
      <State resource={resource} />
      {c && (
        <>
          <ContractCard contract={c} />
          <ContractReminderDetails events={c.reminders} />
          {c.archived && <Alert severity="info">보관된 계약입니다.</Alert>}
          <Panel>
            <Typography fontWeight={700}>계약 관계자</Typography>
            {c.parties.map((p, i) => (
              <Stack key={i} direction="row" alignItems="center" gap={1}>
                <Typography>
                  {p.role === "HOLDER" ? "계약자" : "피보험자"} · {p.name}
                  {p.resident_number && ` · ${p.resident_number}`}
                  {p.phone && ` · ${formatPhone(p.phone)}`}
                </Typography>
                {p.customer_id && (
                  <>
                    <CustomerLink id={p.customer_id} name="고객 보기" />
                    <Button
                      disabled={c.archived}
                      onClick={() => {
                        setEditor(`task:${p.customer_id}`);
                      }}
                    >
                      후속 업무 등록
                    </Button>
                  </>
                )}
              </Stack>
            ))}
          </Panel>
          <Panel>
            <Typography fontWeight={700}>계약정보</Typography>
            {[
              ["보험회사", c.insurer],
              ["청약일", c.application_date],
              ["상품명", c.product],
              ["월 보험료", c.premium_monthly == null ? "미확인" : `${money(c.premium_monthly)}원`],
              ["납입기간", c.payment_period],
              ["증권/설계번호", c.policy_number],
              ["보험 종류", c.category],
              ["성립일", c.establishment_date],
              [
                "보장 기간",
                `${c.coverage_start || "미확인"} ~ ${c.coverage_end || "미확인"}`,
              ],
              ["납입 종료일", c.payment_end],
              ["기간 설명", c.period_note],
              ["주요 보장·특약", c.coverage_note],
              ["정보 출처", c.information_source],
              [
                "확인 상태",
                c.verified
                  ? `확인됨 · ${c.verified_date || "확인일 미입력"}`
                  : "미확인",
              ],
            ].map(([label, text]) => (
              <Typography key={label} sx={{ my: 1, whiteSpace: "pre-wrap" }}>
                <strong>{label}</strong> {text || "미확인"}
              </Typography>
            ))}
          </Panel>
          <Attachments contractId={c.id} disabled={c.archived} />
          <Panel>
            <Typography fontWeight={700}>계약 상태 이력</Typography>
            {c.events.map((e) => (
              <Box key={e.id} my={2}>
                <Typography>
                  {e.occurred_date || dateTime(e.created_at)} ·{" "}
                  {e.correction
                    ? "정정"
                    : e.type === "CREATED"
                      ? "등록"
                      : "상태 변경"}
                </Typography>
                <Typography variant="body2">
                  {PROGRESS[e.progress] || ""} {MAINTENANCE[e.maintenance]} ·{" "}
                  {e.reason || "최초 등록"}
                </Typography>
                <Divider sx={{ mt: 1 }} />
              </Box>
            ))}
          </Panel>
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
        </>
      )}
    </Page>
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
