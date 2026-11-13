import { useState } from "react";
import { Alert, Button, Divider, Paper, Stack, Typography } from "@mui/material";
import apiCaller from "@/services/api-caller";

const AREAS = { maintenance: "서비스 점검", proposal: "보고서 옵션", point_cost: "문서별 꼬막", email: "관리자 이메일 알림" };
const FIELDS = {
  title: "제목", message: "안내 문구", starts_at: "시작", ends_at: "종료", enabled: "점검 설정",
  gemini_model: "LLM 모델", llm_model: "LLM 모델", thinking_level: "Thinking level", max_output_tokens: "최대 출력 토큰",
  max_pdf_files: "최대 파일 개수", max_pdf_bytes: "파일당 최대 바이트", max_active_jobs_per_user: "사용자당 활성 작업",
  max_global_running_jobs: "전체 동시 생성", point_cost: "소진 꼬막", recipients: "수신자", enabled_events: "알림 항목",
};
const KST = new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "medium", timeZone: "Asia/Seoul" });

function display(field, value) {
  if (value == null) return "없음";
  if (field === "starts_at" || field === "ends_at") return KST.format(new Date(value));
  if (typeof value === "boolean") return value ? "사용" : "해제";
  if (Array.isArray(value)) return value.join(", ") || "없음";
  return String(value);
}

export default function AdminSettingsAudit() {
  const [items, setItems] = useState(null);
  const [next, setNext] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const load = async (beforeId) => {
    setLoading(true);
    setError("");
    try {
      const { data } = await apiCaller.get("/api/v1/admin/settings-audit", beforeId ? { before_id: beforeId } : {});
      setItems((current) => beforeId ? [...current, ...data.items] : data.items);
      setNext(data.next_before_id);
    } catch (failure) {
      setError(failure.response?.status === 503 ? "감사 이력 테이블을 적용하면 조회할 수 있습니다." : "변경 이력을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, mb: 3 }}>
      <Stack spacing={2}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6" fontWeight={800}>설정 변경 이력</Typography>
          <Button disabled={loading} onClick={() => load(null)}>{items ? "새로고침" : "이력 보기"}</Button>
        </Stack>
        {error && <Alert severity="error">{error}</Alert>}
        {items?.length === 0 && <Typography color="text.secondary">기록된 변경이 없습니다.</Typography>}
        <Stack divider={<Divider flexItem />} spacing={2}>
          {items?.map((item) => (
            <Stack key={item.id} spacing={0.5}>
              <Typography fontWeight={700}>{AREAS[item.area]}{item.area === "point_cost" ? ` · 문서 #${item.target_id}` : ""}</Typography>
              <Typography variant="body2" color="text.secondary">
                {KST.format(new Date(item.created_at))} KST · {item.actor_name ?? "수정자 미기록"}{item.actor_id ? ` (#${item.actor_id})` : ""}
              </Typography>
              {Object.entries(item.changes).map(([field, change]) => (
                <Typography key={field} variant="body2" sx={{ overflowWrap: "anywhere", whiteSpace: "pre-line" }}>
                  {FIELDS[field] ?? field} · {display(field, change.before)} → {display(field, change.after)}
                </Typography>
              ))}
            </Stack>
          ))}
        </Stack>
        {next && <Button disabled={loading} onClick={() => load(next)}>이전 이력 더 보기</Button>}
      </Stack>
    </Paper>
  );
}
