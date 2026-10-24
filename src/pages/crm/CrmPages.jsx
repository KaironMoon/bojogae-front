/* eslint-disable react/prop-types */
import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { Link, useNavigate, useParams } from "react-router-dom";
import { crmPost, crmPut, crmError } from "@/services/crm-service";
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
export function CustomersPage() {
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState("");
  const [archived, setArchived] = useState(false);
  const [missing, setMissing] = useState(false);
  const [tag, setTag] = useState("");
  const [hasContract, setHasContract] = useState("");
  const [page, setPage] = useState(1);
  const [view, setView] = useState("list");
  const [form, setForm] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const resource = useCrm("/customers", {
    q: search,
    stage,
    archived,
    missing_location: missing,
    tag,
    ...(hasContract !== "" ? { has_contract: hasContract } : {}),
    page,
  });
  const navigate = useNavigate();
  return (
    <Page
      title="내고객"
      description="상담부터 보험·방문까지, 고객의 업무를 한곳에서 관리합니다."
      actions={
        <>
          <Button onClick={() => setImportOpen(true)}>자료 가져오기</Button>
          <Button variant="contained" onClick={() => setForm(true)}>
            고객 등록
          </Button>
        </>
      }
    >
      <Tabs value={view} onChange={(_, v) => setView(v)} sx={{ mb: 2 }}>
        <Tab value="list" label="내고객 목록" />
        <Tab value="map" label="주변 고객 지도" />
      </Tabs>
      {view === "map" ? (
        <CrmMap />
      ) : (
        <>
          <Panel>
            <Box
              component="form"
              onSubmit={(e) => {
                e.preventDefault();
                setSearch(q);
                setPage(1);
              }}
            >
              <Stack direction={{ xs: "column", md: "row" }} gap={1}>
                <Field
                  label="이름·별칭·연락처·주소·메모 검색"
                  value={q}
                  onChange={setQ}
                />
                <Button type="submit">검색</Button>
                <Field
                  label="상담 단계"
                  value={stage}
                  options={{ "": "전체", ...STAGES }}
                  onChange={(v) => {
                    setStage(v);
                    setPage(1);
                  }}
                />
                <Field
                  label="보기"
                  value={archived ? "ARCHIVED" : missing ? "MISSING" : "ACTIVE"}
                  options={{
                    ACTIVE: "관리 고객",
                    ARCHIVED: "보관 고객",
                    MISSING: "위치 미등록",
                  }}
                  onChange={(v) => {
                    setArchived(v === "ARCHIVED");
                    setMissing(v === "MISSING");
                    setPage(1);
                  }}
                />
              </Stack>
              <Stack direction="row" gap={1} mt={2}>
                <Field
                  label="태그"
                  value={tag}
                  onChange={(v) => {
                    setTag(v);
                    setPage(1);
                  }}
                />
                <Field
                  label="계약 보유"
                  value={hasContract}
                  options={{ "": "전체", true: "보유", false: "미보유" }}
                  onChange={(v) => {
                    setHasContract(v);
                    setPage(1);
                  }}
                />
              </Stack>
            </Box>
          </Panel>
          <State resource={resource} />
          <Typography variant="body2" color="text.secondary" mb={1}>
            총 {resource.data?.total || 0}명
          </Typography>
          {resource.data?.items.map((c) => (
            <Panel key={c.id}>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                justifyContent="space-between"
                gap={1}
              >
                <Box>
                  <Stack direction="row" gap={1} alignItems="center">
                    <CustomerLink id={c.id} name={c.alias ? `${c.name} (${c.alias})` : c.name} />
                    <Chip size="small" label={STAGES[c.stage]} />
                    {c.do_not_contact && (
                      <Chip size="small" color="warning" label="연락 중단" />
                    )}
                  </Stack>
                  <Typography variant="body2">
                    {c.phone || "연락처 미등록"} ·{" "}
                    {c.location.address || "주소 미등록"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    최근 상담 {dateTime(c.last_contact_at)} · 계약{" "}
                    {c.contract_count}건 (유지 {c.active_contract_count || 0}건)
                  </Typography>
                  {c.next_task && (
                    <Typography
                      variant="body2"
                      color={
                        c.next_task.is_overdue ? "error" : "text.secondary"
                      }
                    >
                      다음 업무: {c.next_task.due_date} {c.next_task.title}
                    </Typography>
                  )}
                </Box>
                <Stack direction="row" alignItems="center">
                  <Button component={Link} to={`/crm/customers/${c.id}`}>
                    상세
                  </Button>
                  <Directions location={c.location} />
                </Stack>
              </Stack>
            </Panel>
          ))}
          {resource.data && !resource.data.items.length && <Empty />}
          <Pages data={resource.data} onChange={setPage} />
        </>
      )}
      {form && (
        <CustomerForm
          onClose={() => setForm(false)}
          onSave={async (data) => {
            const result = await crmPost("/customers", data);
            navigate(`/crm/customers/${result.id}`);
          }}
        />
      )}
      {importOpen && (
        <CrmImport
          onClose={() => setImportOpen(false)}
          onDone={resource.reload}
        />
      )}
    </Page>
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
  const resource = useCrm(`/customers/${customerId}`);
  const c = resource.data;
  const [tab, setTab] = useState("summary");
  const [editor, setEditor] = useState("");
  const [task, setTask] = useState(null);
  return (
    <Page
      title={c?.name || "고객 상세"}
      actions={
        <>
          <Button component={Link} to="/crm/customers">
            내고객 목록
          </Button>
          {c && (
            <Button onClick={() => setEditor("archive")}>
              {c.archived ? "보관 해제" : "보관"}
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
              보관된 고객입니다. 새 업무를 등록하려면 보관을 해제해 주세요.
            </Alert>
          )}
          <Panel>
            <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap">
              <Chip label={STAGES[c.stage]} />
              {c.do_not_contact && (
                <Chip color="warning" label="연락 중단 요청" />
              )}
              {c.tags.map((t) => (
                <Chip key={t} label={t} size="small" />
              ))}
            </Stack>
            <Typography mt={2}>{c.phone || "연락처 미등록"}</Typography>
            <Typography>
              {c.location.address} {c.address_detail}
            </Typography>
            <Typography variant="caption">
              {ACCURACY[c.location.accuracy]}
            </Typography>
            <Stack direction="row" gap={1} mt={1}>
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
                  ["고객 별칭", c.alias],
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
          {editor === "archive" && (
            <Archive
              kind="customers"
              value={c}
              onClose={() => setEditor("")}
              onDone={resource.reload}
            />
          )}
        </>
      )}
    </Page>
  );
}
export function ContractsPage() {
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [archived, setArchived] = useState("false");
  const [page, setPage] = useState(1);
  const [form, setForm] = useState(false);
  const [origin, setOrigin] = useState("");
  const [progress, setProgress] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
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
    archived,
    customer_id: customerId || undefined,
    page,
  });
  const navigate = useNavigate();
  return (
    <Page
      title="내계약"
      description="기존 가입 보험과 신규 진행 계약을 함께 관리합니다."
      actions={
        <Button variant="contained" onClick={() => setForm(true)}>
          보험 계약 등록
        </Button>
      }
    >
      <Panel>
        <Stack
          component="form"
          onSubmit={(e) => {
            e.preventDefault();
            setSearch(q);
            setPage(1);
          }}
          direction={{ xs: "column", sm: "row" }}
          gap={1}
        >
          <Field
            label="보험회사·상품명·증권/설계번호 검색"
            value={q}
            onChange={setQ}
          />
          <Button type="submit">검색</Button>
          <Field
            label="유지 상태"
            value={status}
            options={{ "": "전체", ...MAINTENANCE }}
            onChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
          />
          <Field
            label="보기"
            value={archived}
            options={{ false: "관리 계약", true: "보관 계약" }}
            onChange={(v) => {
              setArchived(v);
              setPage(1);
            }}
          />
        </Stack>
        <Stack direction={{ xs: "column", sm: "row" }} gap={1} mt={2}>
          <Field
            label="등록 구분"
            value={origin}
            options={{
              "": "전체",
              EXISTING: "기존 가입 보험",
              NEW: "신규 진행 계약",
            }}
            onChange={(v) => {
              setOrigin(v);
              setPage(1);
            }}
          />
          <Field
            label="가입 진행"
            value={progress}
            options={{ "": "전체", ...PROGRESS }}
            onChange={(v) => {
              setProgress(v);
              setPage(1);
            }}
          />
          <Field
            label="성립일 시작"
            type="date"
            value={dateFrom}
            onChange={(v) => {
              setDateFrom(v);
              setPage(1);
            }}
          />
          <Field
            label="성립일 종료"
            type="date"
            value={dateTo}
            onChange={(v) => {
              setDateTo(v);
              setPage(1);
            }}
          />
        </Stack>
      </Panel>
      <State resource={resource} />
      <Typography variant="body2" mb={2}>
        총 {resource.data?.total || 0}건
      </Typography>
      {resource.data?.items.map((c) => (
        <ContractCard key={c.id} contract={c} />
      ))}
      {resource.data && !resource.data.total && <Empty />}
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
    </Page>
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
