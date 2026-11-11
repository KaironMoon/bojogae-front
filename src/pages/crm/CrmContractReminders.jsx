/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import { Alert, Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";
import CakeOutlinedIcon from "@mui/icons-material/CakeOutlined";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import { Link } from "react-router-dom";
import { crmPost } from "@/services/crm-service";
import { money } from "./crm-utils";
import "./crm-contracts.css";

const kinds = [
  ["waiver", "면책기간 종료", "보장 개시일 + 90일", VerifiedUserOutlinedIcon],
  ["reduction", "감액기간 종료", "계약 성립일 + 1년·2년", EventAvailableOutlinedIcon],
  ["insurance_age", "상령일", "피보험자 생일 + 6개월", TrendingUpOutlinedIcon],
  ["birthday", "생일·계약 기념일", "관계자 생년월일·계약 성립일", CakeOutlinedIcon],
];

export function ContractReminderFilters({ selected, counts, onChange, loading, viewControl }) {
  return <section aria-labelledby="crm-reminder-title" className="crm-reminder-section">
    <Stack direction="row" flexWrap="wrap" alignItems="center" justifyContent="space-between" gap={1}>
      <Box>
        <Typography component="h2" id="crm-reminder-title" fontWeight={850}>고객 연락 참고일</Typography>
        <Typography variant="body2" color="text.secondary">현재 검색 조건에서 오늘부터 30일 안에 해당하는 계약입니다.</Typography>
      </Box>
    </Stack>
    <div className="crm-reminder-grid">
      {kinds.map(([key, label, rule, Icon]) => <button className={`crm-reminder-filter crm-reminder-filter--${key}`}
        type="button" key={key} aria-pressed={selected === key} onClick={() => onChange(selected === key ? "" : key)}>
        <Icon aria-hidden="true" /><strong>{label}</strong><span>{rule}</span>
        <b>{loading || counts?.[key] == null ? "—" : `${counts[key]}건`}</b>
      </button>)}
    </div>
    <div className="crm-reminder-toolbar">
      <div role="group" aria-label="알림 종류 빠른 필터">
        <button type="button" onClick={() => onChange("")} aria-pressed={!selected}>전체</button>
        {kinds.map(([key, label]) => <button type="button" key={key}
          onClick={() => onChange(key)} aria-pressed={selected === key}>{label}</button>)}
      </div>
      {viewControl}
    </div>
    <Typography variant="caption" color="text.secondary">면책·감액 참고일은 상품별 약관과 증권에서 확인해 주세요.</Typography>
  </section>;
}

function EventList({ events }) {
  return <ul className="crm-reminder-events">
    {events.map((event, index) => <li key={`${event.kind}-${event.date}-${index}`} className={`crm-reminder-event crm-reminder-event--${event.kind}`}>
      <span>{event.label}{event.person && ` · ${event.person}`}</span><time dateTime={event.date}>{event.date}</time>
    </li>)}
  </ul>;
}

export function ContractReminderPreview({ establishmentDate, coverageStart, parties }) {
  const holder = parties.find(party => party.role === "HOLDER");
  const draft = {
    establishment_date: establishmentDate || null,
    coverage_start: coverageStart || null,
    parties: parties.flatMap(party => {
      const prefix = (party.same_as_holder ? holder : party)?.resident_number?.trim();
      return prefix && /^[0-9]{6}(?:-?[0-9]?)?$/.test(prefix)
        ? [{ role: party.role, resident_number: prefix }] : [];
    }),
  };
  const request = draft.establishment_date || draft.coverage_start || draft.parties.length ? JSON.stringify(draft) : "";
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!request) return undefined;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const data = await crmPost("/contracts/reminder-preview", JSON.parse(request), { signal: controller.signal });
        if (!controller.signal.aborted) setResult({ request, items: data.items });
      } catch {
        if (!controller.signal.aborted) setResult({ request, error: true });
      }
    }, 220);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [request]);

  const latest = request && result?.request === request ? result : null;
  return <section className="crm-reminder-preview" aria-labelledby="crm-reminder-preview-title" aria-live="polite">
    <Typography component="h3" id="crm-reminder-preview-title" fontWeight={850}>알림 참고일 미리보기</Typography>
    {!request && <p>계약 성립일, 보장 개시일 또는 관계자의 생년월일 정보를 입력하면 참고일이 표시됩니다.</p>}
    {request && !latest && <p>참고일을 계산하고 있습니다.</p>}
    {latest?.error && <p>참고일을 불러오지 못했습니다. 입력을 확인해 주세요.</p>}
    {latest?.items?.length > 0 && <EventList events={latest.items} />}
    {latest?.items?.length === 0 && <p>입력한 정보로 계산할 수 있는 참고일이 없습니다.</p>}
    <Typography variant="caption">실제 보장 적용 여부와 날짜는 약관과 증권을 확인해 주세요.</Typography>
  </section>;
}

export function ContractReminderDetails({ events }) {
  return <Paper component="section" aria-labelledby="crm-contract-reminder-details" variant="outlined" sx={{ p: 2 }}>
    <Typography component="h2" id="crm-contract-reminder-details" fontWeight={850}>고객 연락 참고일</Typography>
    {events?.length ? <EventList events={events} /> : <Typography variant="body2" color="text.secondary" my={1}>계산할 수 있는 참고일이 없습니다.</Typography>}
    <Alert severity="info">면책·감액 참고일은 약관과 증권에서 확인해 주세요.</Alert>
  </Paper>;
}

export function ContractListEntry({ contract, selected, onSchedule }) {
  const dates = contract.reminders || [];
  const birthday = dates.find(event => event.label === "생일");
  const anniversary = dates.find(event => event.label === "계약 기념일");
  const insuranceAge = dates.find(event => event.kind === "insurance_age");
  const personalDates = [
    selected === "birthday" ? dates.find(event => event.kind === "birthday") : birthday || anniversary,
    insuranceAge,
  ].filter(Boolean);
  const coverageDates = dates.filter(event => event.kind === "waiver" || event.kind === "reduction");
  const coverageMatches = coverageDates.filter(event => event.kind === selected);
  const parties = contract.parties || [];
  const insured = parties.filter(party => party.role === "INSURED");
  const names = [...new Set(insured.map(party => party.name).filter(Boolean))];
  const linked = [...insured, ...parties].some(party => party.customer_id);
  return <Paper component="article" variant="outlined" className="crm-contract-entry">
    <div><Typography component="h3" fontWeight={850}>{contract.product}</Typography>
      <Typography variant="body2" color="text.secondary">{contract.insurer} · {contract.policy_number || "증권번호 미확인"}</Typography>
      <Chip size="small" label={contract.origin === "NEW" ? "신규 진행 계약" : "기존 가입 보험"} />
    </div>
    <div>
      <Typography variant="body2" fontWeight={750}>{names.join(", ") || "피보험자 미확인"}</Typography>
      {personalDates.length > 0 && <EventList events={personalDates.slice(0, 2)} />}
    </div>
    <div>
      <Typography variant="body2" fontWeight={750}>월 {contract.premium_monthly == null ? "보험료 미확인" : `${money(contract.premium_monthly)}원`}</Typography>
      <Typography variant="caption" color="text.secondary">성립일 · {contract.establishment_date || "미확인"}</Typography>
    </div>
    <div>{coverageDates.length ? <EventList events={(coverageMatches.length ? coverageMatches : coverageDates).slice(0, 3)} />
      : <Typography variant="body2" color="text.secondary">면책·감액 참고일 미확인</Typography>}</div>
    <div className="crm-contract-entry-actions">
      <Button component={Link} to={`/crm/contracts/${contract.id}`} variant="outlined" size="small">상세·알림일</Button>
      <Button onClick={onSchedule} disabled={contract.archived || !linked} size="small">일정 등록</Button>
    </div>
  </Paper>;
}
