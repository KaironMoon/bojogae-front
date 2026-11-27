import CustomerAiFill from "./CustomerAiFill";
import { CustomerField, CustomerModal } from "./CustomerReference";
import { customerDefaults } from "./customer-defaults";
/* eslint-disable react/prop-types */
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Stack,
  Typography,
} from "@mui/material";
import ContractDesignIcon from "./ContractDesignIcon";
import ContractParty from "./CrmContractParty";
import ContractDocumentAutofill from "./ContractDocumentAutofill";
import { ContractReminderPreview } from "./CrmContractReminders";
import { crmError, crmGet, crmPost, residentNumberHelp } from "@/services/crm-service";
import {
  Field,
  Editor,
  useSave,
  LocationFields,
  emptyLocation,
  CustomerPicker,
  useCrm,
  State,
  Pages,
} from "./CrmShared";
import {
  STAGES,
  PROGRESS,
  MAINTENANCE,
  CYCLES,
  KINDS,
  RESULTS,
  METHODS,
  TASK_STATUS,
  today,
  localDateTime,
  formatPhone,
} from "./crm-utils";

const pick = (value, defaults) =>
  Object.fromEntries(
    Object.entries(defaults).map(([k, v]) => [k, value?.[k] ?? v]),
  );
export function CustomerForm({ open = true, value, onSave, onClose, spreadsheet, importReview }) {
  const [aiBusy,setAiBusy]=useState(false);
  const [initial] = useState(() => pick(value, customerDefaults));
  const [data, setData] = useState(initial);
  const state = useSave(onSave, onClose);
  const [duplicates, setDuplicates] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [aliasDuplicate, setAliasDuplicate] = useState(false);
  const [aliasCheckError, setAliasCheckError] = useState("");
  const { alias } = data;
  const customerId = value?.id;
  useEffect(() => {
    let active = true;
    setAliasDuplicate(false);
    setAliasCheckError("");
    if (!alias.trim() || alias.length > 20) return;
    const timer = setTimeout(async () => {
      try {
        const result = await crmGet("/customers/kakao-name-check", {
          alias: alias.trim(), ...(customerId ? { exclude_id: customerId } : {}),
        });
        if (active) setAliasDuplicate(result.duplicate);
      } catch (error) {
        if (active) setAliasCheckError(crmError(error));
      }
    }, 350);
    return () => { active = false; clearTimeout(timer); };
  }, [alias, customerId]);
  const [tagsText, setTagsText] = useState((value?.tags || []).join(", "));
  const [aiApplication, setAiApplication] = useState(null);
  useEffect(() => {
    if (!aiApplication) return;
    const { fields, resolve } = aiApplication;
    const applied = Object.keys(fields).filter((key) => {
      if (key === "resident_number_manual") return false;
      if (key === "tags") return Array.isArray(fields.tags) && fields.tags.length > 0 && tagsText === fields.tags.join(", ");
      if (key === "location") return Boolean(fields.location?.address) && data.location?.address === fields.location.address;
      if (key === "resident_number" && !data.resident_number_manual) return false;
      return Object.hasOwn(customerDefaults, key) && Boolean(fields[key]) && Object.is(data[key], fields[key]);
    });
    resolve(applied);
    setAiApplication(null);
  }, [aiApplication, data, tagsText]);

  function applyAiFields(fields) {
    const changes = Object.fromEntries(Object.entries(fields).filter(([key]) => Object.hasOwn(customerDefaults, key)));
    if (Array.isArray(changes.tags)) setTagsText(changes.tags.join(", "));
    setData((old) => ({ ...old, ...changes }));
    setDuplicates(null);
    setConfirmed(false);
    return new Promise((resolve) => setAiApplication({ fields, resolve }));
  }
  const [birthPreview, setBirthPreview] = useState(null);
  const [birthError, setBirthError] = useState("");
  const [receivedPreview, setReceivedPreview] = useState(null);
  const [receivedError, setReceivedError] = useState("");
  const [receivedEditing, setReceivedEditing] = useState(false);
  const { received_raw, received_date } = data;
  useEffect(() => {
    let active = true;
    setReceivedPreview(null);
    setReceivedError("");
    if (!received_raw && !received_date) return;
    const timer = setTimeout(async () => {
      try {
        const result = await crmPost("/received-date/normalize", { received_raw, received_date });
        if (active) setReceivedPreview(result);
      } catch (error) {
        if (active) setReceivedError(crmError(error));
      }
    }, 350);
    return () => { active = false; clearTimeout(timer); };
  }, [received_raw, received_date]);
  const { birth_raw, birth_date, birth_calendar, birth_is_leap_month, birth_century, gender } = data;
  useEffect(() => {
    let active = true;
    setBirthPreview(null);
    setBirthError("");
    const timer = setTimeout(async () => {
      try {
        const result = await crmPost("/customer-identity/normalize", {
          birth_raw, birth_date, birth_calendar, birth_is_leap_month, birth_century, gender,
        });
        if (active) setBirthPreview(result);
      } catch (error) {
        if (active) setBirthError(crmError(error));
      }
    }, 400);
    return () => { active = false; clearTimeout(timer); };
  }, [birth_raw, birth_date, birth_calendar, birth_is_leap_month, birth_century, gender]);
  const set = (key, v) => {
    setData((old) => ({
      ...old, [key]: v,
      ...(key === "received_raw" ? { received_date: null } : {}),
      ...(key === "birth_raw" ? { birth_date: null, birth_century: null } : {}),
      ...(key === "birth_calendar" && !old.birth_raw && old.birth_date
        ? { birth_raw: old.birth_date }
        : {}),
      ...(key === "birth_calendar" && v !== "LUNAR" ? { birth_is_leap_month: false } : {}),
    }));
    if (key === "phone") {
      setDuplicates(null);
      setConfirmed(false);
    }
  };
  async function submit() {
    if (aiBusy || spreadsheet?.busy) return;
    if (aliasDuplicate) return;
    if (!value && !confirmed) {
      try {
        const result = await crmPost("/customers/duplicates", data);
        setDuplicates(result.items);
        if (result.items.length) return;
      } catch {
        /* Save below returns full validation errors. */
      }
    }
    state.save({ ...data, ...(value ? { version: value.version } : {}) });
  }
  const draft = data !== initial ? data : null;
  const invalidResidentNumber = data.resident_number_manual
    && !/^(?:[0-9]{6}-?[0-9]?)?$/.test(data.resident_number.trim());
  return (
    <CustomerModal
      open={open}
      titleId=":rff:"
      title={importReview ? "고객 등록 · 엑셀 검토" : value ? "고객정보 수정" : "고객 등록"}
      description={importReview ? "가져온 고객 정보를 한 명씩 확인하고 수정할 수 있습니다." : undefined}
      onClose={onClose}
      onSubmit={importReview ? undefined : submit}
      error={importReview?.error || state.error}
      busy={state.busy || aiBusy || spreadsheet?.busy || importReview?.busy}
      footer={importReview?.renderFooter(draft)}
    >
      {importReview?.renderDetails(draft)}
      {!value && <CustomerAiFill disabled={state.busy || spreadsheet?.busy} spreadsheet={spreadsheet} onBusy={setAiBusy} onApply={applyAiFields} />}
      <section className="crm-customer-form-section"><h3><ContractDesignIcon name="id_card" />1. 기본 인적사항 및 보조개톡 연결<small>* 고객명 필수</small></h3>
      <div className="crm-customer-form-grid">
        <CustomerField
          id=":rfg:" label="고객명" placeholder="실명 또는 식별 이름"
          value={data.name}
          onChange={(v) => set("name", v)}
          required
        />
<CustomerField
          id=":rfh:" label="연락처" placeholder="010-0000-0000 또는 숫자만"
          type="tel"
          autoComplete="tel-national"
          value={formatPhone(data.phone)}
          onChange={(v) => set("phone", formatPhone(v))}
        />
      </div>
      <div className="crm-customer-form-grid">        <CustomerField
        id=":rfi:" label={<>카톡대화명 <small className="customer-ref-kakao-hint">(보조개톡 자동매칭)</small></>} labelAside={`${data.alias?.length || 0} / 20자`}
        value={data.alias}
        onChange={(v) => set("alias", v)}
        inputProps={{ maxLength: 20 }}
        error={aliasDuplicate || !!aliasCheckError}
        helperText={aliasDuplicate ? "이미 사용 중인 카톡대화명입니다. 다른 대화명으로 수정해 주세요." : aliasCheckError || "카카오톡 대화명을 최대 20자로 입력해 주세요."}
        placeholder="김성춘 흥국화재 도봉"
      />
      <CustomerField id=":rfj:" label="직업" placeholder="예: 사무직, 간호사, 자영업 (상해급수 참고)" helperText="보장분석 및 리포트 직업급수 표기에 활용됩니다." value={data.occupation} onChange={(v) => set("occupation", v)} inputProps={{ maxLength: 200 }} /></div>
      {duplicates?.length > 0 && (
        <Alert severity="warning">
          같은 연락처 고객: {duplicates.map((v) => v.name).join(", ")}
          <FormControlLabel
            control={
              <Checkbox
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
              />
            }
            label="별도 고객으로 등록합니다"
          />
        </Alert>
      )}
      </section><section className="crm-customer-form-section"><h3><ContractDesignIcon name="cake" />2. 성별 · 생년월일 · 주민번호 7자리 자동 연동<small>생년월일·성별 입력 시 주민번호 자동 계산</small></h3>
      <div className="crm-customer-form-grid crm-customer-form-three">
        <CustomerField
          id=":rfk:" label="성별"
          value={data.gender}
          options={{ UNKNOWN: "미확인", FEMALE: "여성", MALE: "남성" }}
          onChange={(v) => set("gender", v)}
        />
        <CustomerField
          id=":rfm:" label="생년월일"
          value={data.birth_raw || data.birth_date || ""}
          onChange={(v) => set("birth_raw", v)}
          placeholder="19850307 / 3월 7일 / 85년생"
          helperText="아는 만큼 입력하세요. 월·일까지 알면 생일 알림에 활용할 수 있습니다."
        />
        <CustomerField
          id=":rfn:" label="양력·음력"
          value={data.birth_calendar}
          options={{ UNKNOWN: "미확인 (양력 기준)", SOLAR: "양력", LUNAR: "음력" }}
          onChange={(v) => set("birth_calendar", v)}
        />
      </div>
      {/^[0-9]{6}$/.test(data.birth_raw) && <CustomerField
        label="출생 연도 확인 (선택)"
        value={data.birth_century ?? ""}
        options={{ "": "연도 미확인", 1900: "1900년대", 2000: "2000년대" }}
        onChange={(v) => set("birth_century", v ? Number(v) : null)}
      />}
      {data.birth_calendar === "LUNAR" && <FormControlLabel
        control={<Checkbox checked={data.birth_is_leap_month} onChange={(e) => set("birth_is_leap_month", e.target.checked)} />}
        label="윤달 생일"
      />}
      {birthError && <Alert severity="info">{birthError}</Alert>}
      {birthPreview?.birth_display && <Typography variant="body2" color="text.secondary">
        {birthPreview.birth_display}
        {data.birth_calendar === "LUNAR" && birthPreview.birth_date && ` · 양력 ${birthPreview.birth_date.replace(/([0-9]{4})-([0-9]{2})-([0-9]{2})/, "$1년 $2월 $3일")}`}
        {birthPreview.birth_reminder_eligible ? " · 생일 알림에 활용 가능" : " · 생일 알림용 월·일 미확인"}
      </Typography>}
      <CustomerField
        id=":rfp:" label="주민번호 앞 6자리·뒤 첫 1자리" inputAside="****** (뒷자리 미수집·보안처리)"
        value={data.resident_number_manual ? data.resident_number : birthPreview?.resident_number || ""}
        onChange={(v) => setData((old) => ({ ...old, resident_number: v, resident_number_manual: true }))}
        placeholder="850307-1"
        inputProps={{ maxLength: 8 }}
        error={invalidResidentNumber}
        helperText={invalidResidentNumber ? residentNumberHelp : data.resident_number_manual
          ? "직접 수정한 값은 생년월일·성별이 바뀌어도 유지됩니다."
          : "생년월일·성별로 자동 입력합니다. 음력 생일은 양력으로 변환하며 직접 수정할 수 있습니다."}
      />
      {data.resident_number_manual && <Button onClick={() => setData((old) => ({ ...old, resident_number_manual: false, resident_number: "" }))}>
        생년월일·성별로 다시 자동 입력
      </Button>}
      </section><section className="crm-customer-form-section"><h3><ContractDesignIcon name="pin" />3. 방문 주소 · 위치 좌표 · 통화/방문 가능 시간</h3>
      <LocationFields customerDesign addressId=":rfq:"
        value={data.location}
        onChange={(v) => set("location", v)}
      />
      <div className="crm-customer-form-grid"><CustomerField
        id=":rft:" label="상세주소"
        value={data.address_detail}
        onChange={(v) => set("address_detail", v)}
        placeholder="동·호수 등 상세주소"
        inputProps={{ maxLength: 500 }}
      />
      <CustomerField
        id=":rfu:" label="방문 참고사항"
        value={data.visit_note}
        onChange={(v) => set("visit_note", v)}
        placeholder="예: 1층 카페 미팅 선호, 주차 가능"
      /></div>
      <div className="crm-customer-form-grid">
        {[
          ["call_preference", "통화 가능 시간"],
          ["visit_preference", "방문 가능 시간"],
        ].map(([key, label]) => (
          <CustomerField
            placeholder={key === "call_preference" ? "예: 평일 점심시간(12~1시) 또는 오후 6시 이후" : "예: 화·목 오후 2시~5시"}
            key={key} id={key === "call_preference" ? ":rfv:" : ":rg0:"}
            label={label}
            value={data[key]}
            onChange={(v) => set(key, v)}
          />
        ))}
      </div>
      </section><section className="crm-customer-form-section"><h3><ContractDesignIcon name="clipboard" />4. 접수·유입경로·상담단계·태그 및 메모<small>CRM 필터 연동</small></h3>
      <div className="crm-customer-form-grid crm-customer-form-three"><CustomerField
        id=":rg1:" label="접수일"
        value={receivedEditing
          ? data.received_raw || data.received_date || ""
          : receivedPreview?.received_display || data.received_raw || data.received_date || ""}
        onChange={(v) => set("received_raw", v)}
        onFocus={() => setReceivedEditing(true)}
        onBlur={() => setReceivedEditing(false)}
        placeholder="20261024 / 10월 24일 / 10월쯤"
        helperText={receivedError || "아는 만큼 입력하세요. 확인할 수 있는 날짜만 정리합니다."}
        error={!!receivedError}
        inputProps={{ maxLength: 100 }}
      />
      <CustomerField
        id=":rg2:" label="유입 경로"
        value={data.source}
        placeholder="예: 현대홈쇼핑 DB, 기존고객 소개, 블로그"
        onChange={(v) => set("source", v)}
      />
      <CustomerField
        id=":rg3:" label="상담 단계"
        value={data.stage}
        options={STAGES}
        onChange={(v) => set("stage", v)}
      /></div>
      <div className="crm-customer-form-grid"><CustomerField
        placeholder="예: 현대홈쇼핑, 암보장보완, 가족결합"
        id=":rg5:" label="태그 (쉼표 구분)"
        value={tagsText}
        onChange={(v) => {
          setTagsText(v);
          set(
            "tags",
            v
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean),
          );
        }}
      />
      <CustomerField
        id=":rg6:" label="상담 참고 보험료 (실제 계약금액과 별도)"
        value={data.premium_note}
        onChange={(v) => set("premium_note", v)}
        placeholder="예: 월 25만원"
      /></div>
      <CustomerField
        placeholder="가족력, 기왕증(고지사항), 리모델링 희망 담보 등 상담 메모를 자유롭게 기록하세요."
        id=":rg7:" label="고객 메모"
        multiline
        minRows={3}
        value={data.memo}
        onChange={(v) => set("memo", v)}
      />
      <FormControlLabel
        control={
          <Checkbox
            checked={data.do_not_contact}
            onChange={(e) => set("do_not_contact", e.target.checked)}
          />
        }
        label="연락 중단 요청 (주변 고객 검색에서 제외)"
      />
      </section>
    </CustomerModal>
  );
}
const contractDefaults = {
  proposal_generation_id: null,
  origin: "EXISTING",
  insurer: "",
  product: "",
  category: "",
  policy_number: "",
  parties: [],
  premium: null,
  payment_cycle: "MONTHLY",
  application_date: null,
  establishment_date: null,
  coverage_start: null,
  coverage_end: null,
  payment_end: null,
  payment_period: "",
  period_note: "",
  coverage_note: "",
  progress: null,
  maintenance: "UNKNOWN",
  information_source: "",
  verified: false,
  verified_date: null,
};
function ContractDocumentPicker({ data, setData, initialDocument }) {
  const ids = [...new Set(data.parties.map(p => p.customer_id).filter(Boolean))];
  const [chosenCustomer, setChosenCustomer] = useState(null);
  const [page, setPage] = useState(1);
  const customer = ids.includes(chosenCustomer) ? chosenCustomer : ids[0];
  const resource = useCrm(customer ? `/customers/${customer}/documents` : null,
    { page, completed_only: true });
  const documents = resource.data?.items || [];
  const selected = data.proposal_generation_id;
  return <Stack gap={1} sx={{ mb: 2 }}>
    <Typography fontWeight={700}>계약에 연결할 생성 문서 (선택 사항)</Typography>
    {ids.length > 1 && <Field label="문서 조회 고객" value={customer || ""}
      options={Object.fromEntries(ids.map(id => [id, `고객 #${id}`]))}
      onChange={id => { setChosenCustomer(Number(id)); setPage(1); }} />}
    <State resource={resource} />
    <Field label="생성 완료 문서" value={selected || ""}
      disabled={!customer || resource.loading}
      options={{ "": "연결하지 않음", ...(selected && !documents.some(d => d.id === selected)
        ? { [selected]: initialDocument?.id === selected ? initialDocument.title : `연결 문서 #${selected}` } : {}),
        ...Object.fromEntries(documents.map(d => [d.id, `${d.title} (#${d.id})`])) }}
      onChange={id => setData(old => ({ ...old, proposal_generation_id: id ? Number(id) : null }))} />
    <Pages data={resource.data} onChange={setPage} />
    {selected && <Button component={Link} to={`/proposals?generationId=${selected}`} target="_blank" rel="noopener noreferrer">선택 문서 확인</Button>}
  </Stack>;
}

export function ContractForm({ value, initialDraft, applicationDraft = false, customerId, initialDocument, onSave, onClose }) {
  const [data, setData] = useState(() => ({
    ...pick(value || initialDraft, contractDefaults),
    ...(!value && !initialDraft && initialDocument ? {
      proposal_generation_id: initialDocument.id,
      origin: "NEW", progress: "ESTABLISHED", maintenance: "ACTIVE", establishment_date: null,
    } : {}),
    parties: value?.parties || initialDraft?.parties || [
      { role: "HOLDER", customer_id: customerId || null, name: "" },
      { role: "INSURED", customer_id: null, name: "", same_as_holder: false },
    ],
  }));
  const submitting = useRef(false);
  const state = useSave(onSave, applicationDraft ? () => {} : onClose);
  const [duplicates, setDuplicates] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [insurers, setInsurers] = useState(null);
  const [insurersError, setInsurersError] = useState("");
  const set = (key, v) => {
    setData((old) => ({ ...old, [key]: v }));
    if (["policy_number", "insurer"].includes(key)) {
      setConfirmed(false);
      setDuplicates(null);
    }
  };
  const updateParty = useCallback((index, patch, expectedCustomerId) => {
    setData((old) => ({ ...old, parties: old.parties.map((party, i) =>
      i === index && (expectedCustomerId === undefined || party.customer_id === expectedCustomerId)
        ? { ...party, ...patch } : party,
    ) }));
  }, []);
  const holder = data.parties.find((party) => party.role === "HOLDER");
  async function loadInsurers() {
    if (insurers) {
      setInsurers(null);
      return;
    }
    setInsurersError("");
    try {
      const { default: api } = await import("@/services/api-caller");
      setInsurers((await api.get("/api/v1/insurers")).data.items);
    } catch {
      setInsurersError("보험사 목록을 불러오지 못했습니다.");
    }
  }
  async function submit() {
    if (submitting.current) return;
    submitting.current = true;
    try {
      if (!value && !confirmed) {
        try {
          const result = await crmPost("/contracts/duplicates", data);
          setDuplicates(result.items);
          if (result.items.length) return;
        } catch {
          /* Save returns validation errors. */
        }
      }
      await state.save({ ...data, ...(value ? { version: value.version } : {}) });
    } finally {
      submitting.current = false;
    }
  }
  return (
    <Editor
      open
      title={applicationDraft ? "✨ AI 청약 · 내 계약 등록" : value ? "계약정보 수정" : "보험 계약 등록"}
      submitLabel={applicationDraft ? "등록" : "저장"}
      applicationDraft={applicationDraft}
      titleId=":rf1:"
      contractLayout
      onClose={onClose}
      onSubmit={submit}
      {...state}
    >
      {applicationDraft && <Alert severity="info">제안서에서 자동 입력한 내용입니다. 보험사·상품·보험료와 계약자·피보험자를 확인해 주세요. 최소 한 명을 내고객에 연결한 뒤 등록할 수 있습니다. 등록하면 내 계약에 청약 접수 상태로 저장됩니다.</Alert>}
      <ContractDocumentPicker data={data} setData={setData} initialDocument={initialDocument} />
      <ContractDocumentAutofill data={data} setData={setData} existingGenerationId={value?.proposal_generation_id ?? initialDraft?.proposal_generation_id}
        editing={!!value} />
      <Stack component="section" gap={1.5} className="crm-contract-form-section" aria-labelledby="crm-contract-base">
        <div className="crm-contract-section-heading">
          <Typography component="h3" id="crm-contract-base"><ContractDesignIcon name="shield_plain" />1. 등록 구분 및 보험 상품 기본 정보</Typography>
          <Field
            id=":rf2:" label="등록 구분"
            value={data.origin}
            disabled={!!value}
            options={{ EXISTING: "기존 가입 보험", NEW: "신규 진행 계약" }}
            onChange={(origin) =>
              setData({
                ...data,
                origin,
                progress: origin === "NEW" ? "DRAFT" : null,
                maintenance: "UNKNOWN",
              })
            }
          />
        </div>
        <div className="crm-contract-base-grid">
          <Stack direction="row" gap={1}>
            <Field id=":rf4:" placeholder="우측 [보험사 목록]에서 선택하거나 직접 입력" label="보험회사" value={data.insurer} onChange={(v) => set("insurer", v)} required />
            <Button className="crm-contract-insurer-button" onClick={loadInsurers} variant="contained" aria-expanded={Boolean(insurers)} aria-controls="crm-insurer-picker"
              startIcon={<ContractDesignIcon name="building" />} sx={{ minWidth: 88, flexShrink: 0, bgcolor: "#121314", "&:hover": { bgcolor: "#273241" } }}>보험사 목록</Button>
          </Stack>
          <Field id=":rf7:" placeholder="예: 종합건강보험, 간편건강보험, 암보험" label="보험 종류" value={data.category} onChange={(v) => set("category", v)} />
          <Field id=":rf6:" placeholder="예: (무)KB 3.5.5 오! 슬기로운 간편실속종합건강보험" label="상품명" value={data.product} onChange={(v) => set("product", v)} required />
          <Field id=":rf8:" placeholder="증권번호 또는 청약번호" label="증권/설계번호 (미확인 시 비워두기)" value={data.policy_number} onChange={(v) => set("policy_number", v)} />
        </div>
        {insurersError && <Alert severity="warning">{insurersError}</Alert>}
        <div id="crm-insurer-picker" hidden={!insurers}>
          {insurers && <div className="crm-insurer-palette">
            <div><strong>🏢 {insurers.length}개 보험회사 빠른 선택 (클릭 시 자동 입력)</strong><Button onClick={() => setInsurers(null)}>닫기 ✕</Button></div>
            {[["non_life", "손해보험 · 공제"], ["life", "생명보험"]].map(([kind, label]) => <section key={kind}>
              <h4>{label}</h4><div className="crm-insurer-picker" aria-label={label}>
                {insurers.filter(insurer => kind === "life" ? insurer.kind === "life" : insurer.kind !== "life").map(insurer => <Button key={insurer.id} size="small" variant="outlined"
                  aria-pressed={data.insurer === insurer.name} onClick={() => { set("insurer", insurer.name); setInsurers(null); }}>{insurer.name}</Button>)}
              </div>
            </section>)}
            {!insurers.length && <Typography variant="body2" color="text.secondary">등록된 보험사가 없습니다.</Typography>}
          </div>}
        </div>
        {duplicates?.length > 0 && (
          <Alert severity="warning">
            동일 보험사·증권번호 계약이 있습니다.
            <FormControlLabel
              control={
                <Checkbox
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                />
              }
              label="확인 후 별도 계약으로 등록합니다"
            />
          </Alert>
        )}
      </Stack>
      <Stack component="section" gap={1.5} className="crm-contract-form-section" aria-labelledby="crm-contract-parties">
        <div className="crm-contract-section-heading"><Typography component="h3" id="crm-contract-parties"><ContractDesignIcon name="person" />2. 계약 관계자 (피보험자 생년월일로 생일 · 상령일 자동 계산)</Typography>        <Button
          className="crm-contract-party-add" startIcon={<ContractDesignIcon name="user_plus" />}
          onClick={() =>
            set("parties", [
              ...data.parties,
              { role: "INSURED", customer_id: null, name: "" },
            ])
          }
        >
          관계자 추가
        </Button></div>
        <div className="crm-contract-party-grid">
          {data.parties.map((p, i) => (
            <ContractParty key={i} value={p} holder={holder} index={i} onChange={updateParty}
              onRemove={data.parties.length > 1 ? () => set("parties", data.parties.filter((_, j) => i !== j)) : undefined} />
          ))}
        </div>

      </Stack>
      <Stack component="section" gap={1.5} className="crm-contract-form-section" aria-labelledby="crm-contract-period">
        <Typography component="h3" id="crm-contract-period"><ContractDesignIcon name="calendar_clock" />3. 계약 일자 및 고객 터치 알림일(면책종료 · 감액종료 · 상령일 · 생일) 자동 산출</Typography>
        <ContractReminderPreview establishmentDate={data.establishment_date} coverageStart={data.coverage_start} parties={data.parties} />
        <div className="crm-contract-payment-grid">
          <Field
            id=":rfu:" placeholder="예: 149370" label={data.payment_cycle === "MONTHLY" ? "월 보험료 (원)" : "납입금액 (원)"}
            type="number"
            inputProps={{ min: 0, step: ".01" }}
            value={data.premium}
            onChange={(v) => set("premium", v === "" ? null : v)}
          />
          <Field
            id=":rfv:" label="납입 주기"
            value={data.payment_cycle}
            options={CYCLES}
            onChange={(v) => set("payment_cycle", v)}
          />

          <Field
            id=":rg1:" label="진행 상태" SelectProps={{ displayEmpty: true }}
            disabled={!!value || data.origin === "EXISTING"}
            value={data.progress || ""}
            options={{ "": "해당 없음", ...PROGRESS }}
            onChange={(v) => set("progress", v || null)}
          />
          <Field
            id=":rg3:" label="유지 상태 (설계사 기록용)"
            disabled={
              !!value ||
              (data.origin === "NEW" && data.progress !== "ESTABLISHED")
            }
            value={data.maintenance}
            options={MAINTENANCE}
            onChange={(v) => set("maintenance", v)}
          />
        </div>
        <Box className="crm-contract-dates-grid"
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" },
            gap: 2,
          }}
        >
          {[
            ["application_date", "청약일"],
            ["establishment_date", "계약 성립일 (감액기준)"],
            ["coverage_start", "보장 개시일 (면책기준)"],
            ["coverage_end", "보장 종료일"],
            ["payment_end", "납입 종료일"],
            ["verified_date", "정보 확인일"],
          ].map(([key, label], index) => (
            <Field
              className={`crm-contract-date--${key}`} key={key}
              id={`:rg${(index + 5).toString(16)}:`} label={label}
              type="date"
              disabled={key === "establishment_date" && !!value}
              value={data[key]}
              onChange={(v) => set(key, v || null)}
            />
          ))}
        </Box>
        <div className="crm-contract-period-grid"><Field
          id=":rgb:" label="납입기간"
          value={data.payment_period}
          onChange={(v) => set("payment_period", v)}
          placeholder="20년 / 60세납 / 일시납"
          inputProps={{ maxLength: 100 }}
        />
        <Field
          id=":rgc:" label="납입·보장 기간 설명 (면책·감액 특이사항 메모)" placeholder="예: 암 면책 90일 / 일반암·유사암 1년 50% 감액"
          value={data.period_note}
          onChange={(v) => set("period_note", v)}
        />
        </div>
      </Stack>
      <Stack component="section" gap={1.5} className="crm-contract-form-section" aria-labelledby="crm-contract-coverage">
        <div className="crm-contract-section-heading crm-contract-coverage-heading"><Typography component="h3" id="crm-contract-coverage"><ContractDesignIcon name="document" />4. 주요 보장·가입금액·특약 요약 및 정보 출처</Typography>
        <div className="crm-contract-coverage-tags" aria-label="보장 내용 빠른 입력">
          {[
            ["암진단(면책90일)", "일반암 3,000만(면책90일/감액1년)"],
            ["비통치 1억", "비급여 암통합치료비 1억"],
            ["2대진단(감액1년)", "뇌혈관·허혈성심장 각 2,000만(1년 50%감액)"],
            ["치아(면책/감액)", "치아보철/크라운(면책90일/감액1~2년)"],
          ].map(([label, text]) => <button type="button" key={label} onClick={() => set("coverage_note", [data.coverage_note, text].filter(Boolean).join(" · "))}>+ {label}</button>)}
        </div>
        </div>
        <Field
          id=":rgd:" label="주요 보장·가입금액·특약 요약" placeholder="면책기간·감액기간 적용 담보 및 가입금액을 기록해 두면 종료 시점에 고객에게 안내하기 편리합니다."
          multiline
          minRows={3}
          value={data.coverage_note}
          onChange={(v) => set("coverage_note", v)}
        />
        <div className="crm-contract-verification-row">
        <Field
          id=":rge:" label="정보 출처" placeholder="예: 고객 전달 증권, 청약서 부본, 보장분석 리포트"
          value={data.information_source}
          onChange={(v) => set("information_source", v)}
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={data.verified}
              onChange={(e) => set("verified", e.target.checked)}
            />
          }
          label="증권 등으로 확인한 정보"
        />
        </div>
      </Stack>
    </Editor>
  );
}
const CONSULTATION_QUICK_NOTES = [
  ["보장분석 안내", "보장분석 내용 및 보완 필요 담보 안내"],
  ["제안서 발송", "맞춤 제안서 요약본 전달 및 설명 완료"],
  ["부재 문자 발송", "부재중 안내 문자 발송 및 재통화 요청"],
  ["재통화 약속", "추후 재통화 일정 협의"],
];

function shiftSeoulDate(days) {
  const base = new Date(`${today()}T12:00:00+09:00`);
  base.setUTCDate(base.getUTCDate() + days);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(base);
}

export function ConsultationForm({ customerName, onSave, onClose }) {
  const [data, setData] = useState({
    occurred_at: localDateTime(),
    method: "PHONE",
    result: "CONNECTED",
    content: "",
    contract_id: null,
  });
  const state = useSave(onSave, onClose);
  const set = (key, value) => setData((old) => ({ ...old, [key]: value }));
  return (
    <Editor
      open
      activityLayout
      maxWidth="sm"
      titleId=":crm-consultation-title:"
      title="상담 기록"
      headerIcon="message_plus"
      headerBadge={customerName ? `${customerName}님 상담` : "상담 타임라인 기록"}
      headerSubtitle="상담 시각과 진행 방식·결과를 남기면 고객 타임라인에 바로 기록됩니다."
      footerNote="💡 저장 즉시 고객 상세의 상담 내역과 요약 카드에 반영됩니다."
      onClose={onClose}
      onSubmit={() =>
        state.save({ ...data, occurred_at: data.occurred_at + ":00+09:00" })
      }
      {...state}
    >
      <section className="crm-activity-section">
        <div className="crm-activity-section-head">
          <h3><ContractDesignIcon name="calendar_clock" />1. 상담 시각 · 방식 · 연락 결과</h3>
          <small>원클릭 선택</small>
        </div>
        <div className="crm-activity-datetime-row">
          <Field
            label="상담 시각"
            type="datetime-local"
            value={data.occurred_at}
            onChange={(v) => set("occurred_at", v)}
            required
          />
          <button
            type="button"
            className="crm-activity-now-btn"
            onClick={() => set("occurred_at", localDateTime())}
          >
            현재 시각
          </button>
        </div>
        <div className="crm-activity-grid-2">
          <div className="crm-activity-pill-group">
            <span className="crm-activity-field-label">상담 방식</span>
            <div className="crm-activity-pills" role="group" aria-label="상담 방식">
              {Object.entries(METHODS).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  className="crm-activity-pill crm-activity-pill--violet"
                  aria-pressed={data.method === key}
                  onClick={() => set("method", key)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="crm-activity-pill-group">
            <span className="crm-activity-field-label">연락 결과</span>
            <div className="crm-activity-pills" role="group" aria-label="연락 결과">
              {Object.entries(RESULTS).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  className="crm-activity-pill crm-activity-pill--emerald"
                  aria-pressed={data.result === key}
                  onClick={() => set("result", key)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
      <section className="crm-activity-section">
        <div className="crm-activity-section-head">
          <h3><ContractDesignIcon name="message" />2. 상담 내용</h3>
          <small>{data.content.length.toLocaleString("ko-KR")}자</small>
        </div>
        <div className="crm-activity-quick-tags" aria-label="자주 쓰는 문구">
          {CONSULTATION_QUICK_NOTES.map(([label, text]) => (
            <button
              key={label}
              type="button"
              className="crm-activity-quick-tag"
              onClick={() =>
                set("content", data.content.trim() ? `${data.content.trim()}\n${text}` : text)
              }
            >
              + {label}
            </button>
          ))}
        </div>
        <Field
          label="상담 내용"
          placeholder="고객 반응, 추가 문의사항, 다음 안내 일정을 구체적으로 기록해 주세요."
          multiline
          minRows={5}
          value={data.content}
          onChange={(v) => set("content", v)}
          required
        />
      </section>
    </Editor>
  );
}
export function TaskForm({
  value,
  customerId,
  customerName,
  contractId,
  location,
  initialReminder,
  contractTaskLayout = false,
  onSave,
  onClose,
}) {
  const [data, setData] = useState(() =>
    pick(value, {
      customer_id: customerId || null,
      contract_id: contractId || null,
      kind: location ? "VISIT" : "CALL",
      title: initialReminder ? `${initialReminder.label} 안내` : "",
      note: "",
      due_date: initialReminder?.date || today(),
      due_at: null,
      status: "PENDING",
      location: location || emptyLocation(),
    }),
  );
  const [time, setTime] = useState(
    value?.due_at ? localDateTime(value.due_at).slice(11, 16) : "",
  );
  const [changingCustomer, setChangingCustomer] = useState(false);
  const state = useSave(onSave, onClose);
  const set = (key, v) => setData((old) => ({ ...old, [key]: v }));
  const isVisit = data.kind === "VISIT";
  const quickTitles = isVisit
    ? ["방문 상담", "청약 서명 방문", "증권 전달 방문", "보장분석 대면 안내"]
    : ["재통화 안내", "제안서 설명 통화", "청약 서류 확인", "심사 결과 안내"];
  return (
    <Editor
      open
      activityLayout={!contractTaskLayout}
      contractTaskLayout={contractTaskLayout}
      maxWidth="sm"
      titleId=":crm-task-title:"
      title={value ? "업무·일정 수정" : "업무·방문 일정 등록"}
      headerIcon={isVisit ? "pin" : "calendar"}
      headerBadge={
        isVisit
          ? "방문 일정 · 지도 연동"
          : customerName
            ? `${customerName}님 일정`
            : "업무·일정 관리"
      }
      headerSubtitle="예정일과 업무 내용을 등록하면 내 업무 캘린더와 고객 상세에 자동 연동됩니다."
      footerNote={
        isVisit
          ? "📍 방문 주소를 비워두면 고객의 기본 주소·위치 좌표가 자동 적용됩니다."
          : "💡 예정일·시각을 지정하면 일정 리마인더에서 바로 확인할 수 있습니다."
      }
      onClose={onClose}
      onSubmit={() =>
        state.save({
          ...data,
          due_at: time ? `${data.due_date}T${time}:00+09:00` : null,
          ...(value ? { version: value.version } : {}),
        })
      }
      {...state}
    >
      <section className="crm-activity-section">
        <div className="crm-activity-section-head">
          <h3><ContractDesignIcon name="clipboard" />1. 연결 고객 · 업무 분류 · 제목</h3>
          <small>{isVisit ? "대면 방문 일정" : "일반 후속 업무"}</small>
        </div>
        {customerName && data.customer_id === customerId && !changingCustomer ? (
          <div className="crm-activity-customer-badge">
            <span>연결 고객: {customerName}님</span>
            <button type="button" onClick={() => setChangingCustomer(true)}>
              다른 고객 선택
            </button>
          </div>
        ) : (
          <CustomerPicker
            compact
            value={data.customer_id}
            onChange={(v) =>
              setData((old) => ({ ...old, customer_id: v, contract_id: null }))
            }
          />
        )}
        <div className="crm-activity-pill-group">
          <span className="crm-activity-field-label">업무 종류</span>
          <div className="crm-activity-pills" role="group" aria-label="업무 종류">
            {Object.entries(KINDS).map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={`crm-activity-pill ${key === "VISIT" ? "crm-activity-pill--emerald" : "crm-activity-pill--violet"}`}
                aria-pressed={data.kind === key}
                onClick={() => set("kind", key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="crm-activity-quick-tags" aria-label="자주 쓰는 업무 제목">
          {quickTitles.map((preset) => (
            <button
              key={preset}
              type="button"
              className="crm-activity-quick-tag"
              onClick={() => set("title", preset)}
            >
              + {preset}
            </button>
          ))}
        </div>
        <div className="crm-activity-grid-2">
          <Field
            label="업무 제목"
            placeholder={isVisit ? "예: 보장분석 대면 상담 방문" : "예: 제안서 확인 후 재통화"}
            value={data.title}
            onChange={(v) => set("title", v)}
            required
          />
          <Field
            label="처리 상태"
            value={data.status}
            options={TASK_STATUS}
            onChange={(v) => set("status", v)}
          />
        </div>
      </section>
      <section className="crm-activity-section">
        <div className="crm-activity-section-head">
          <h3><ContractDesignIcon name="calendar_clock" />2. 예정 일시 · 상세 메모</h3>
          <div className="crm-activity-quick-tags">
            {[
              ["오늘", 0],
              ["내일", 1],
              ["+3일", 3],
              ["+1주", 7],
            ].map(([label, offset]) => (
              <button
                key={label}
                type="button"
                className="crm-activity-quick-tag"
                onClick={() => set("due_date", shiftSeoulDate(offset))}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="crm-activity-grid-2">
          <Field
            label="예정일"
            type="date"
            value={data.due_date}
            onChange={(v) => set("due_date", v)}
            required
          />
          <Field
            label="확정 시각 (선택)"
            type="time"
            InputLabelProps={{ shrink: true }}
            value={time}
            onChange={setTime}
          />
        </div>
        <Field
          label="업무 내용"
          placeholder="준비 서류, 미팅 포인트, 통화 참고사항을 적어두세요."
          multiline
          minRows={3}
          value={data.note}
          onChange={(v) => set("note", v)}
        />
      </section>
      {isVisit && (
        <section className="crm-activity-section crm-activity-section--visit">
          <div className="crm-activity-section-head">
            <h3><ContractDesignIcon name="pin" />3. 방문 장소</h3>
            <small>비워두면 고객 기본 위치 사용</small>
          </div>
          <LocationFields
            customerDesign
            value={data.location}
            onChange={(v) => set("location", v)}
          />
        </section>
      )}
    </Editor>
  );
}
export function StatusForm({ value, onSave, onClose }) {
  const [data, setData] = useState({
    version: value.version,
    progress: value.progress,
    maintenance: value.maintenance,
    establishment_date: value.establishment_date,
    occurred_date: today(),
    reason: "",
    correction: false,
  });
  const state = useSave(onSave, onClose);
  const set = (key, v) => setData({ ...data, [key]: v });
  return (
    <Editor
      open
      title="계약 상태 변경"
      onClose={onClose}
      onSubmit={() => state.save(data)}
      {...state}
    >
      {value.origin === "NEW" && (
        <Field
          label="가입 진행"
          value={data.progress}
          options={PROGRESS}
          onChange={(v) =>
            setData({
              ...data,
              progress: v,
              maintenance: v === "ESTABLISHED" ? data.maintenance : "UNKNOWN",
            })
          }
        />
      )}
      <Field
        label="유지 상태"
        disabled={value.origin === "NEW" && data.progress !== "ESTABLISHED"}
        value={data.maintenance}
        options={MAINTENANCE}
        onChange={(v) => set("maintenance", v)}
      />
      {data.progress === "ESTABLISHED" && (
        <Field
          label="계약 성립일"
          type="date"
          value={data.establishment_date}
          onChange={(v) => set("establishment_date", v || null)}
          required
        />
      )}
      <Field
        label="변경 발생일"
        type="date"
        value={data.occurred_date}
        onChange={(v) => set("occurred_date", v)}
        required
      />
      <Field
        label="변경 사유"
        value={data.reason}
        multiline
        minRows={3}
        onChange={(v) => set("reason", v)}
        required
      />
      <FormControlLabel
        control={
          <Checkbox
            checked={data.correction}
            onChange={(e) => set("correction", e.target.checked)}
          />
        }
        label="실제 진행이 아닌 잘못 입력된 상태 정정"
      />
    </Editor>
  );
}
