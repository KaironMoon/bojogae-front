/* eslint-disable react/prop-types */
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Divider,
  FormControlLabel,
  Stack,
  Typography,
} from "@mui/material";
import ContractParty from "./CrmContractParty";
import { crmError, crmGet, crmPost } from "@/services/crm-service";
import {
  Field,
  Editor,
  useSave,
  LocationFields,
  emptyLocation,
  CustomerPicker,
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
const customerDefaults = {
  name: "",
  alias: "",
  occupation: "",
  resident_number: "",
  resident_number_manual: false,
  phone: "",
  gender: "UNKNOWN",
  birth_raw: "",
  birth_date: null,
  birth_calendar: "UNKNOWN",
  birth_is_leap_month: false,
  birth_century: null,
  received_date: null,
  received_raw: "",
  source: "",
  provider: "",
  region: "",
  location: emptyLocation(),
  address_detail: "",
  visit_note: "",
  call_preference: "",
  visit_preference: "",
  premium_note: "",
  memo: "",
  tags: [],
  stage: "UNCONTACTED",
  do_not_contact: false,
};
export function CustomerForm({ value, onSave, onClose }) {
  const [data, setData] = useState(() => pick(value, customerDefaults));
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
  return (
    <Editor
      open
      title={value ? "고객정보 수정" : "고객 등록"}
      onClose={onClose}
      onSubmit={submit}
      {...state}
    >
      <Stack direction={{ xs: "column", sm: "row" }} gap={2}>
        <Field
          label="고객명"
          value={data.name}
          onChange={(v) => set("name", v)}
          required
        />
        <Field
          label="연락처"
          type="tel"
          autoComplete="tel-national"
          value={formatPhone(data.phone)}
          onChange={(v) => set("phone", formatPhone(v))}
        />
      </Stack>
      <Field
        label="카톡대화명"
        value={data.alias}
        onChange={(v) => set("alias", v)}
        inputProps={{ maxLength: 20 }}
        error={aliasDuplicate || !!aliasCheckError}
        helperText={aliasDuplicate ? "이미 사용 중인 카톡대화명입니다. 다른 대화명으로 수정해 주세요." : aliasCheckError || "카카오톡 대화명을 최대 20자로 입력해 주세요."}
        placeholder="김성춘 흥국화재 도봉"
      />
      <Field label="직업" value={data.occupation} onChange={(v) => set("occupation", v)} inputProps={{ maxLength: 200 }} />
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
      <Stack direction={{ xs: "column", sm: "row" }} gap={2}>
        <Field
          label="성별"
          value={data.gender}
          options={{ UNKNOWN: "미확인", FEMALE: "여성", MALE: "남성" }}
          onChange={(v) => set("gender", v)}
        />
        <Field
          label="생년월일"
          value={data.birth_raw || data.birth_date || ""}
          onChange={(v) => set("birth_raw", v)}
          placeholder="19850307 / 3월 7일 / 85년생"
          helperText="아는 만큼 입력하세요. 월·일까지 알면 생일 알림에 활용할 수 있습니다."
        />
        <Field
          label="양력·음력"
          value={data.birth_calendar}
          options={{ UNKNOWN: "미확인 (양력 기준)", SOLAR: "양력", LUNAR: "음력" }}
          onChange={(v) => set("birth_calendar", v)}
        />
      </Stack>
      {/^[0-9]{6}$/.test(data.birth_raw) && <Field
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
      <Field
        label="주민번호 앞 6자리·뒤 첫 1자리"
        value={data.resident_number_manual ? data.resident_number : birthPreview?.resident_number || ""}
        onChange={(v) => setData((old) => ({ ...old, resident_number: v, resident_number_manual: true }))}
        placeholder="850307-1"
        inputProps={{ maxLength: 8 }}
        helperText={data.resident_number_manual
          ? "직접 수정한 값은 생년월일·성별이 바뀌어도 유지됩니다."
          : "생년월일·성별로 자동 입력합니다. 음력 생일은 양력으로 변환하며 직접 수정할 수 있습니다."}
      />
      {data.resident_number_manual && <Button onClick={() => setData((old) => ({ ...old, resident_number_manual: false, resident_number: "" }))}>
        생년월일·성별로 다시 자동 입력
      </Button>}
      <LocationFields
        value={data.location}
        onChange={(v) => set("location", v)}
      />
      <Field
        label="상세주소"
        value={data.address_detail}
        onChange={(v) => set("address_detail", v)}
        placeholder="동·호수 등 상세주소"
        inputProps={{ maxLength: 500 }}
      />
      <Field
        label="방문 참고사항"
        value={data.visit_note}
        onChange={(v) => set("visit_note", v)}
      />
      <Stack direction={{ xs: "column", sm: "row" }} gap={2}>
        {[
          ["call_preference", "통화 가능 시간"],
          ["visit_preference", "방문 가능 시간"],
        ].map(([key, label]) => (
          <Field
            key={key}
            label={label}
            value={data[key]}
            onChange={(v) => set(key, v)}
          />
        ))}
      </Stack>
      <Field
        label="접수일"
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
      <Field
        label="유입 경로"
        value={data.source}
        onChange={(v) => set("source", v)}
      />
      <Field
        label="상담 단계"
        value={data.stage}
        options={STAGES}
        onChange={(v) => set("stage", v)}
      />
      <Field
        label="태그 (쉼표 구분)"
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
      <Field
        label="상담 참고 보험료 (실제 계약금액과 별도)"
        value={data.premium_note}
        onChange={(v) => set("premium_note", v)}
      />
      <Field
        label="고객 메모"
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
    </Editor>
  );
}
const contractDefaults = {
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
export function ContractForm({ value, customerId, onSave, onClose }) {
  const [data, setData] = useState(() => ({
    ...pick(value, contractDefaults),
    parties: value?.parties || [
      { role: "HOLDER", customer_id: customerId || null, name: "" },
      { role: "INSURED", customer_id: null, name: "", same_as_holder: false },
    ],
  }));
  const state = useSave(onSave, onClose);
  const [duplicates, setDuplicates] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [insurerOptions, setInsurerOptions] = useState({});
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
    const { default: api } = await import("@/services/api-caller");
    try {
      const result = (await api.get("/api/v1/insurers")).data;
      setInsurerOptions(
        Object.fromEntries(result.items.map((r) => [r.name, r.name])),
      );
    } catch {
      setInsurerOptions({});
    }
  }
  async function submit() {
    if (!value && !confirmed) {
      try {
        const result = await crmPost("/contracts/duplicates", data);
        setDuplicates(result.items);
        if (result.items.length) return;
      } catch {
        /* Save returns validation errors. */
      }
    }
    state.save({ ...data, ...(value ? { version: value.version } : {}) });
  }
  return (
    <Editor
      open
      title={value ? "계약정보 수정" : "보험 계약 등록"}
      onClose={onClose}
      onSubmit={submit}
      {...state}
    >
      <Field
        label="등록 구분"
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
      <Stack direction="row" gap={1}>
        <Field
          label="보험회사"
          value={data.insurer}
          onChange={(v) => set("insurer", v)}
          required
        />
        <Button onClick={loadInsurers} sx={{ minWidth: 100 }}>
          보험사 목록
        </Button>
      </Stack>
      {Object.keys(insurerOptions).length > 0 && (
        <Field
          label="등록 보험사에서 선택"
          value={insurerOptions[data.insurer] ? data.insurer : ""}
          options={{ "": "선택하세요", ...insurerOptions }}
          onChange={(v) => set("insurer", v)}
        />
      )}
      <Stack direction={{ xs: "column", sm: "row" }} gap={2}>
        <Field
          label="상품명"
          value={data.product}
          onChange={(v) => set("product", v)}
          required
        />
        <Field
          label="보험 종류"
          value={data.category}
          onChange={(v) => set("category", v)}
        />
      </Stack>
      <Field
        label="증권/설계번호 (미확인 시 비워두기)"
        value={data.policy_number}
        onChange={(v) => set("policy_number", v)}
      />
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
      <Typography fontWeight={700}>계약 관계자</Typography>
      {data.parties.map((p, i) => (
        <ContractParty key={i} value={p} holder={holder} index={i} onChange={updateParty}
          onRemove={data.parties.length > 1 ? () => set("parties", data.parties.filter((_, j) => i !== j)) : undefined} />
      ))}
      <Button
        onClick={() =>
          set("parties", [
            ...data.parties,
            { role: "INSURED", customer_id: null, name: "" },
          ])
        }
      >
        관계자 추가
      </Button>
      <Stack direction={{ xs: "column", sm: "row" }} gap={2}>
        <Field
          label={data.payment_cycle === "MONTHLY" ? "월 보험료 (원)" : "납입금액 (원)"}
          type="number"
          inputProps={{ min: 0, step: ".01" }}
          value={data.premium}
          onChange={(v) => set("premium", v === "" ? null : v)}
        />
        <Field
          label="납입 주기"
          value={data.payment_cycle}
          options={CYCLES}
          onChange={(v) => set("payment_cycle", v)}
        />
      </Stack>
      <Stack direction={{ xs: "column", sm: "row" }} gap={2}>
        <Field
          label="진행 상태"
          disabled={!!value || data.origin === "EXISTING"}
          value={data.progress || ""}
          options={{ "": "해당 없음", ...PROGRESS }}
          onChange={(v) => set("progress", v || null)}
        />
        <Field
          label="유지 상태"
          disabled={
            !!value ||
            (data.origin === "NEW" && data.progress !== "ESTABLISHED")
          }
          value={data.maintenance}
          options={MAINTENANCE}
          onChange={(v) => set("maintenance", v)}
        />
      </Stack>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
          gap: 2,
        }}
      >
        {[
          ["application_date", "청약일"],
          ["establishment_date", "계약 성립일"],
          ["coverage_start", "보장 개시일"],
          ["coverage_end", "보장 종료일"],
          ["payment_end", "납입 종료일"],
          ["verified_date", "정보 확인일"],
        ].map(([key, label]) => (
          <Field
            key={key}
            label={label}
            type="date"
            disabled={key === "establishment_date" && !!value}
            value={data[key]}
            onChange={(v) => set(key, v || null)}
          />
        ))}
      </Box>
      <Field
        label="납입기간"
        value={data.payment_period}
        onChange={(v) => set("payment_period", v)}
        placeholder="20년 / 60세납 / 일시납"
        inputProps={{ maxLength: 100 }}
      />
      <Field
        label="납입·보장 기간 설명"
        value={data.period_note}
        onChange={(v) => set("period_note", v)}
      />
      <Field
        label="주요 보장·가입금액·특약 요약"
        multiline
        minRows={3}
        value={data.coverage_note}
        onChange={(v) => set("coverage_note", v)}
      />
      <Field
        label="정보 출처"
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
    </Editor>
  );
}
export function ConsultationForm({ onSave, onClose }) {
  const [data, setData] = useState({
    occurred_at: localDateTime(),
    method: "PHONE",
    result: "CONNECTED",
    content: "",
    contract_id: null,
  });
  const state = useSave(onSave, onClose);
  const set = (key, value) => setData({ ...data, [key]: value });
  return (
    <Editor
      open
      title="상담 기록"
      onClose={onClose}
      onSubmit={() =>
        state.save({ ...data, occurred_at: data.occurred_at + ":00+09:00" })
      }
      {...state}
    >
      <Field
        label="상담 시각"
        type="datetime-local"
        value={data.occurred_at}
        onChange={(v) => set("occurred_at", v)}
        required
      />
      <Field
        label="상담 방식"
        value={data.method}
        options={METHODS}
        onChange={(v) => set("method", v)}
      />
      <Field
        label="연락 결과"
        value={data.result}
        options={RESULTS}
        onChange={(v) => set("result", v)}
      />
      <Field
        label="상담 내용"
        multiline
        minRows={5}
        value={data.content}
        onChange={(v) => set("content", v)}
        required
      />
    </Editor>
  );
}
export function TaskForm({
  value,
  customerId,
  contractId,
  location,
  onSave,
  onClose,
}) {
  const [data, setData] = useState(() =>
    pick(value, {
      customer_id: customerId || null,
      contract_id: contractId || null,
      kind: location ? "VISIT" : "CALL",
      title: "",
      note: "",
      due_date: today(),
      due_at: null,
      status: "PENDING",
      location: location || emptyLocation(),
    }),
  );
  const [time, setTime] = useState(
    value?.due_at ? localDateTime(value.due_at).slice(11, 16) : "",
  );
  const state = useSave(onSave, onClose);
  const set = (key, v) => setData({ ...data, [key]: v });
  return (
    <Editor
      open
      title={value ? "업무·일정 수정" : "업무·방문 일정 등록"}
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
      <CustomerPicker
        value={data.customer_id}
        onChange={(v) =>
          setData({ ...data, customer_id: v, contract_id: null })
        }
      />
      <Field
        label="업무 종류"
        value={data.kind}
        options={KINDS}
        onChange={(v) => set("kind", v)}
      />
      <Field
        label="업무 제목"
        value={data.title}
        onChange={(v) => set("title", v)}
        required
      />
      <Stack direction="row" gap={2}>
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
      </Stack>
      <Field
        label="처리 상태"
        value={data.status}
        options={TASK_STATUS}
        onChange={(v) => set("status", v)}
      />
      <Field
        label="업무 내용"
        multiline
        minRows={3}
        value={data.note}
        onChange={(v) => set("note", v)}
      />
      {data.kind === "VISIT" && (
        <>
          <Divider />
          <Typography fontWeight={700}>
            방문 장소 (비워두면 고객 기본 위치 사용)
          </Typography>
          <LocationFields
            value={data.location}
            onChange={(v) => set("location", v)}
          />
        </>
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
