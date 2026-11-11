/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import { Alert, Box, Button, Checkbox, FormControlLabel, Stack } from "@mui/material";
import { crmError, crmGet } from "@/services/crm-service";
import { CustomerPicker, Field } from "./CrmShared";
import ContractDesignIcon from "./ContractDesignIcon";
import { formatPhone } from "./crm-utils";

const defaultFieldIds = [
  { role: ":rf9:", search: ":rfb:", select: ":rfd:", name: ":rff:", resident: ":rfg:", phone: ":rfh:" },
  { role: ":rfj:", search: ":rfl:", select: ":rfn:", name: ":rfp:", resident: ":rfq:", phone: ":rfr:" },
];

export default function ContractParty({ value, holder, index, onChange, onRemove }) {
  const { customer_id, details_confirmed, same_as_holder } = value;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setError("");
    setLoading(false);
    if (!customer_id || details_confirmed || same_as_holder) return;
    setLoading(true);
    crmGet(`/customers/${customer_id}/contract-party`).then((result) => {
      if (active) onChange(index, result, customer_id);
    }).catch((e) => {
      if (active) setError(crmError(e));
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [customer_id, details_confirmed, same_as_holder, index, onChange, retry]);
  const fieldIds = defaultFieldIds[index] || {};
  const displayed = same_as_holder && holder ? holder : value;
  const disabled = loading || same_as_holder;
  const edit = (key, v) => onChange(index, { [key]: v, details_confirmed: true });
  return (
    <Box className="crm-contract-party" sx={{ p: 1.5, border: "1px solid #dfe8e4", borderRadius: 2 }}>
      <Stack gap={1}>
        <div className="crm-contract-party-heading">
          <div><span className={`crm-contract-party-badge crm-contract-party-badge--${value.role.toLowerCase()}`}>{value.role === "HOLDER" ? "계약자" : "피보험자 (생일·상령일 기준)"}</span>
            <select id={fieldIds.role} aria-label="역할" value={value.role} onChange={event => onChange(index, { role: event.target.value, same_as_holder: false })}>
              <option value="HOLDER">역할: 계약자</option><option value="INSURED">역할: 피보험자</option>
            </select>
          </div>
          {value.role === "HOLDER" && onRemove && <Button onClick={onRemove}>관계자 제거</Button>}
          {value.role === "INSURED" && <FormControlLabel className="crm-contract-party-same"
            label="계약자와 동일" control={<Checkbox size="small" checked={!!same_as_holder} disabled={!holder}
              onChange={event => onChange(index, { same_as_holder: event.target.checked })} />} />}
        </div>
        <fieldset className={`crm-contract-party-search crm-contract-party-search--${value.role.toLowerCase()}`} disabled={!!same_as_holder}>
          <legend className="crm-contract-sr-only">{value.role === "HOLDER" ? "계약자" : "피보험자"} 고객 불러오기</legend>
          <strong><ContractDesignIcon name="search" />내고객 목록에서 {value.role === "HOLDER" ? "계약자" : "피보험자"} 불러오기</strong>
          <CustomerPicker compact disabled={!!same_as_holder} searchId={fieldIds.search} selectId={fieldIds.select} label={value.role === "HOLDER" ? "계약자 고객" : "피보험자 고객"}
            value={customer_id} allowEmpty onChange={id => onChange(index, {
              customer_id: id, name: "", phone: "", resident_number: "", details_confirmed: false,
            })} />
        </fieldset>
        {loading && <Alert severity="info">고객 정보를 불러오는 중입니다.</Alert>}
        {error && <Alert severity="warning">{error}<Button onClick={() => setRetry((v) => v + 1)}>다시 불러오기</Button></Alert>}
        <div className="crm-contract-party-identity">
          <Field id={fieldIds.name} label="성함" placeholder={value.role === "HOLDER" ? "계약자 성함" : "피보험자 성함"} value={displayed.name || ""} disabled={disabled}
            onChange={(v) => edit("name", v)} inputProps={{ maxLength: 100 }} />
          <Field id={fieldIds.resident} label="주민번호 앞 7자리" value={displayed.resident_number || ""} disabled={disabled}
            onChange={(v) => edit("resident_number", v)} placeholder="760503-1" inputProps={{ maxLength: 8 }} />
          <Field id={fieldIds.phone} label="연락처" type="tel" placeholder="010-0000-0000" value={formatPhone(displayed.phone || "")} disabled={disabled}
            onChange={(v) => edit("phone", formatPhone(v))} />
        </div>
        {value.role === "HOLDER" ? <div className="crm-contract-party-help"><ContractDesignIcon name="info" /><span>고객 정보를 불러온 뒤 수정해도 고객관리 원본은 변경되지 않습니다.</span></div>
          : <div className="crm-contract-party-footer"><span>고객관리 원본과 독립 저장됩니다.</span>{onRemove && <Button onClick={onRemove}>관계자 제거</Button>}</div>}
      </Stack>
    </Box>
  );
}
