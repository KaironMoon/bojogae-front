/* eslint-disable react/prop-types */
import { useEffect, useRef, useState } from "react";
import { Alert, Button, Stack } from "@mui/material";
import { crmGet, crmError } from "@/services/crm-service";
import { Field } from "./CrmShared";
import { applyContractDraft } from "./contract-document-draft";

export default function ContractDocumentAutofill({ data, setData, existingGenerationId, editing }) {
  const generationId = data.proposal_generation_id;
  const latest = useRef(data);
  const applied = useRef(null);
  latest.current = data;
  const [result, setResult] = useState(null);
  const [choice, setChoice] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setResult(null); setChoice(""); setError(""); setBusy(false);
    if (!generationId) return;
    const baseline = latest.current;
    setBusy(true);
    crmGet(`/documents/${generationId}/contract-draft`).then(response => {
      if (!active) return;
      setResult(response);
      if (response.drafts.length === 1) {
        setChoice("0");
        if (generationId !== existingGenerationId) {
          const previous = applied.current;
          applied.current = applyContractDraft(latest.current, baseline, response.drafts[0], editing, response.customer, previous);
          setData(current => current.proposal_generation_id === generationId
            ? applyContractDraft(current, baseline, response.drafts[0], editing, response.customer, previous).after : current);
        }
      }
    }).catch(e => { if (active) setError(crmError(e)); })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [generationId, existingGenerationId, editing, retry, setData]);
  if (!generationId) return null;
  const apply = index => {
    setChoice(index);
    const draft = result?.drafts[Number(index)];
    if (index !== "" && draft) {
      const previous = applied.current;
      applied.current = applyContractDraft(latest.current, latest.current, draft, editing, result.customer, previous);
      setData(current => applyContractDraft(current, current, draft, editing, result.customer, previous).after);
    }
  };
  return <Stack gap={1}>
    {busy && <Alert severity="info">문서에서 계약 정보를 불러오는 중입니다.</Alert>}
    {error && <Alert severity="warning">{error}<Button onClick={() => setRetry(v => v + 1)}>다시 불러오기</Button></Alert>}
    {result?.drafts.length === 0 && <Alert severity="info">이 문서에는 자동 입력할 계약 정보가 없습니다. 확인한 내용을 직접 입력해 주세요.</Alert>}
    {result?.drafts.length > 1 && <Field label="계약할 보험 상품 선택" value={choice}
      options={{ "": "문서에 포함된 상품을 선택하세요", ...Object.fromEntries(result.drafts.map((draft, index) => [String(index),
        [draft.insurer, draft.product || `상품 ${index + 1}`, draft.premium != null ? `${Number(draft.premium).toLocaleString()}원` : ""].filter(Boolean).join(" · ")])) }}
      onChange={apply} />}
    {choice !== "" && result && <Alert severity="info">
      문서에서 계약 정보를 불러왔습니다. 계약 내용과 성립일을 확인한 뒤 저장해 주세요.
      <Button onClick={() => apply(choice)}>문서 내용으로 다시 채우기</Button>
    </Alert>}
  </Stack>;
}
