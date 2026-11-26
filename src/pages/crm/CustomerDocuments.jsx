/* eslint-disable react/prop-types */
import { useState } from "react";
import { Alert, Button, Chip, Stack, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import { useCrm, State, Panel, Pages } from "./CrmShared";
import { ContractForm } from "./CrmForms";
import { crmPost } from "@/services/crm-service";
import { proposalFileUrl } from "@/services/proposal-service";
import { dateTime, PROGRESS } from "./crm-utils";

const labels = { QUEUED: "대기 중", RUNNING: "생성 중", CANCEL_REQUESTED: "취소 중", COMPLETED: "완료", FAILED: "실패", CANCELLED: "취소됨" };

export default function CustomerDocuments({ customerId, disabled = false, onSaved }) {
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const resource = useCrm(`/customers/${customerId}/documents`, { page });
  return <Stack gap={1.5}>
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Typography fontWeight={700}>생성 문서 ({resource.data?.total ?? 0}건)</Typography>
      <Stack direction="row" gap={1}>
        <Button onClick={resource.reload}>새로고침</Button>
        <Button component={Link} to={`/proposals?customerId=${customerId}`} disabled={disabled}>문서 생성</Button>
      </Stack>
    </Stack>
    <State resource={resource} />
    {resource.data?.items.map(doc => <Panel key={doc.id}>
      <Stack gap={1}>
        <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap">
          <Typography fontWeight={700}>{doc.title}</Typography>
          <Chip size="small" label={labels[doc.status] || doc.status} />
        </Stack>
        {doc.summary && (
          <Typography variant="body2" sx={{ fontWeight: 700, color: "#1E293B" }}>
            {doc.summary}
          </Typography>
        )}
        <Typography variant="body2" color="text.secondary">{doc.prompt_title} · {dateTime(doc.created_at)}</Typography>
        {doc.contracts?.map(contract => <Button key={contract.id} component={Link} to={`/crm/contracts/${contract.id}`}>
          {contract.product} · {PROGRESS[contract.progress] || "등록 계약"}
        </Button>)}
        <Stack direction="row" gap={1}>
          <Button component={Link} to={`/proposals?generationId=${doc.id}`}>문서 상세</Button>
          {doc.status === "COMPLETED" && <>
            <Button component="a" href={proposalFileUrl(doc.id, "output")} target="_blank" rel="noopener noreferrer">문서 열기</Button>
            <Button variant="outlined" disabled={disabled} onClick={() => setSelected(doc)}>이 문서로 계약 처리</Button>
          </>}
        </Stack>
      </Stack>
    </Panel>)}
    {resource.data?.total === 0 && <Alert severity="info">이 고객에게 연결된 생성 문서가 없습니다.</Alert>}
    <Pages data={resource.data} onChange={setPage} />
    {selected && <ContractForm customerId={customerId} initialDocument={selected}
      onClose={() => setSelected(null)} onSave={async data => {
        await crmPost("/contracts", data);
        resource.reload();
        onSaved?.();
      }} />}
  </Stack>;
}
