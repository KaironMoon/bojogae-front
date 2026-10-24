/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import { Alert, Box, Button, Checkbox, FormControlLabel, Stack } from "@mui/material";
import { crmError, crmGet } from "@/services/crm-service";
import { CustomerPicker, Field } from "./CrmShared";
import { formatPhone } from "./crm-utils";

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
  const displayed = same_as_holder && holder ? holder : value;
  const disabled = loading || same_as_holder;
  const edit = (key, v) => onChange(index, { [key]: v, details_confirmed: true });
  return (
    <Box sx={{ p: 2, border: "1px solid #ddd", borderRadius: 2 }}>
      <Stack gap={1}>
        <Field label="역할" value={value.role} options={{ HOLDER: "계약자", INSURED: "피보험자" }}
          onChange={(role) => onChange(index, { role, same_as_holder: false })} />
        {value.role === "INSURED" && <FormControlLabel
          label="계약자와 동일"
          control={<Checkbox checked={!!same_as_holder} disabled={!holder}
            onChange={(e) => onChange(index, { same_as_holder: e.target.checked })} />}
        />}
        {!same_as_holder && <CustomerPicker label={value.role === "HOLDER" ? "계약자 고객" : "피보험자 고객"}
          value={customer_id} allowEmpty onChange={(id) => onChange(index, {
            customer_id: id, name: "", phone: "", resident_number: "", details_confirmed: false,
          })} />}
        {loading && <Alert severity="info">고객 정보를 불러오는 중입니다.</Alert>}
        {error && <Alert severity="warning">{error}<Button onClick={() => setRetry((v) => v + 1)}>다시 불러오기</Button></Alert>}
        <Field label="성함" value={displayed.name || ""} disabled={disabled}
          onChange={(v) => edit("name", v)} inputProps={{ maxLength: 100 }} />
        <Field label="주민번호 앞 7자리" value={displayed.resident_number || ""} disabled={disabled}
          onChange={(v) => edit("resident_number", v)} placeholder="760503-1" inputProps={{ maxLength: 8 }} />
        <Field label="연락처" type="tel" value={formatPhone(displayed.phone || "")} disabled={disabled}
          onChange={(v) => edit("phone", formatPhone(v))} />
        {!same_as_holder && <Alert severity="info">고객 정보를 불러온 뒤 수정해도 고객관리 원본은 변경되지 않습니다.</Alert>}
        {onRemove && <Button onClick={onRemove}>관계자 제거</Button>}
      </Stack>
    </Box>
  );
}
