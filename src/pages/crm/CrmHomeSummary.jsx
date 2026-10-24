import { Button, Chip, Stack, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import { useCrm, Panel } from "./CrmShared";
import { dateTime } from "./crm-utils";
export function CrmHomeSummary() {
  const resource = useCrm("/summary");
  if (resource.error || !resource.data)
    return (
      <Panel>
        <Stack direction="row" justifyContent="space-between">
          <Typography fontWeight={700}>내고객·계약 업무</Typography>
          <Button component={Link} to="/crm/customers">
            내고객 열기
          </Button>
        </Stack>
        <Typography variant="body2" color="text.secondary">
          고객 상담, 보험 계약과 방문 일정을 관리하세요.
        </Typography>
      </Panel>
    );
  const d = resource.data;
  return (
    <Panel>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography fontWeight={700}>내고객·계약 업무</Typography>
        <Button component={Link} to="/crm/tasks">
          전체 업무
        </Button>
      </Stack>
      <Stack direction="row" gap={2} flexWrap="wrap" my={2}>
        <Chip label={`관리 고객 ${d.customers}명`} />
        <Chip label={`계약 ${d.contracts}건`} />
        <Chip color="primary" label={`오늘 ${d.today.total}건`} />
        <Chip
          color={d.overdue.total ? "warning" : "default"}
          label={`기한 초과 ${d.overdue.total}건`}
        />
      </Stack>
      {d.today.items.slice(0, 3).map((t) => (
        <Typography key={t.id} variant="body2" my={1}>
          {t.due_at ? dateTime(t.due_at) : "시각 미정"} · {t.title}
        </Typography>
      ))}
    </Panel>
  );
}
