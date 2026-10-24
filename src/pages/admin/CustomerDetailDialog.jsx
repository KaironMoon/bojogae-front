/* eslint-disable react/prop-types */
import {
  Accordion, AccordionDetails, AccordionSummary, Alert, Box, Button, Chip, CircularProgress,
  Dialog, DialogActions, DialogContent, DialogTitle, Pagination, Paper, Stack,
  Tab, Tabs, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, useMediaQuery,
} from "@mui/material";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import { useTheme } from "@mui/material/styles";
import { useEffect, useState } from "react";
import { planName } from "@/constants/plans";
import { customerError, getCustomerDetail, getCustomerRecords } from "@/services/customer-service";

const TABS = [
  ["overview", "기본 정보"], ["points", "꼬막 내역"], ["reports", "보고서"],
  ["payments", "결제·환불"], ["requests", "문의·신청"], ["logins", "로그인"], ["audit", "대리 접속 감사"],
];
const TABLE_NAMES = { user_sessions: "로그인 세션", users: "설계사 정보", office_groups: "조직 정보", point_grants: "꼬막 지급",
  referral_aliases: "추천용 닉네임", user_referrals: "추천인 등록",
  point_usages: "꼬막 사용", point_usage_allocations: "꼬막 차감·반환", billing_subscriptions: "구독",
  payment_orders: "결제", payment_refunds: "결제 환불", payment_methods: "결제 수단",
  personal_plan_requests: "요금제 신청", proposal_generations: "보고서", proposal_input_files: "보고서 첨부",
  proposal_generation_calls: "보고서 생성", document_suggestions: "문서 건의", document_refund_requests: "문서 환불",
  group_point_transfers: "조직 꼬막 이동", group_purchase_requests: "조직 구매 신청", prompt_favorites: "즐겨찾기",
  notification_preferences: "알림 설정", web_push_subscriptions: "알림 수신", user_email_change_requests: "이메일 변경",
};
const FIELD_NAMES = { id: "번호", user_id: "설계사 번호", email: "이메일", name: "이름", nickname: "닉네임",
  referred_user_id: "추천받은 설계사 번호", referrer_user_id: "추천인 설계사 번호", bonus_amount: "추천 보너스", bonus_expires_at: "보너스 만료일", grant_id: "지급 내역 번호",
  phone: "전화번호", affiliation: "소속", display_name: "표시 이름", status: "상태", role: "권한", plan_code: "요금제",
  amount: "금액·수량", remaining_amount: "남은 꼬막", point_type: "꼬막 종류", point_cost: "사용 꼬막", point_status: "꼬막 처리",
  title: "제목", group_id: "조직 번호", group_role: "조직 역할", employee_number: "사번", password_hash: "비밀번호",
  pending_email: "인증 대기 이메일", must_change_password: "비밀번호 변경 필요", expires_at: "만료일",
  refunded_amount: "환불 수량·금액", next_plan_code: "예정 요금제", period_start: "구독 시작", period_end: "구독 종료",
  cancel_at_period_end: "구독 종료 예정", is_deleted: "삭제 여부", is_selected: "선택 여부", alias: "별칭",
  output_object_key: "보고서 본문", output_bytes: "보고서 크기", output_filename: "보고서 파일명", share_summary: "공유 요약",
  content: "내용", enabled: "활성 여부", is_active: "활성 여부", updated_at: "변경 시각", source: "지급 경로", impersonation_session_id: "대리 접속 번호", revoked_at: "접속 종료", revoked_reason: "종료 사유",
  prompt_id: "프롬프트 번호", generation_id: "보고서 번호", requested_plan_code: "신청 요금제", completed_at: "완료 시각",
};
const STATUS_NAMES = { ACTIVE: "활성", PENDING: "대기", SUSPENDED: "정지", REJECTED: "거절", COMPLETED: "완료",
  FAILED: "실패", QUEUED: "대기", RUNNING: "생성 중", CANCELED: "취소", CANCELING: "해지 예정", PAID: "결제 완료",
  READY: "준비", SCHEDULED: "예약", REVIEW: "확인 필요", REFUNDED: "환불 완료", ACCEPTED: "반영 예정", APPROVED: "승인" };
function auditAction(item) {
  if (item.title.startsWith("START ")) return "대리 접속 시작";
  if (item.title.startsWith("END ")) return "관리자 복귀";
  const read = item.title.startsWith("GET ") || item.title.startsWith("HEAD ");
  if (item.title.includes('/users/me/referral/alias')) return '추천용 닉네임 변경';
  if (item.title.includes('/users/me/referral')) return read ? '추천인 정보 조회' : '추천인 등록';
  if (item.title.includes("/users/me/profile")) return read ? "설계사 정보 조회" : "설계사 정보 수정";
  if (item.title.includes("/users/me/account")) return "계정 탈퇴";
  if (item.title.includes("/group-password")) return "비밀번호 관련 작업";
  if (item.title.includes("/proposals")) return read ? "보고서 조회" : "보고서 생성·관리";
  if (item.title.includes("/payments")) return read ? "결제·구독 조회" : "결제·구독 변경";
  if (item.title.includes("/plan-requests")) return "요금제 신청·취소";
  if (item.title.includes("/document-suggestions")) return read ? "건의 조회" : "건의 작성·변경";
  if (item.title.includes("/refund-requests")) return read ? "환불 요청 조회" : "환불 요청 작성·변경";
  if (item.title.includes("/groups")) return read ? "조직 조회" : "조직 관리";
  if (item.title.includes("/notifications")) return read ? "알림 조회" : "알림 설정·관리";
  return read ? "설계사 기능 조회" : "설계사 기능 작업";
}
function date(value) { return value ? new Date(value).toLocaleString("ko-KR") : "-"; }
function number(value) { return Number(value || 0).toLocaleString("ko-KR"); }
function display(value) {
  if (value === null || value === undefined) return "-";
  if (typeof value === "boolean") return value ? "예" : "아니오";
  return typeof value === "object" ? JSON.stringify(value) : String(value);
}
function Stat({ label, value }) {
  return <Paper variant="outlined" sx={{ p: 1.75, flex: 1, minWidth: 135 }}><Typography variant="caption" color="text.secondary">{label}</Typography><Typography fontWeight={750}>{value}</Typography></Paper>;
}
function AuditChanges({ changes }) {
  if (!changes?.length) return <Typography color="text.secondary" variant="body2">저장된 데이터 변경이 없습니다.</Typography>;
  return changes.map(change => (
    <Box key={change.id} sx={{ mb: 2 }}>
      <Typography fontWeight={700}>{TABLE_NAMES[change.table_name] || "관련 정보"} #{change.record_id} · {{ INSERT: "추가", UPDATE: "수정", DELETE: "삭제" }[change.operation]} · {date(change.occurred_at)}</Typography>
      <TableContainer><Table size="small"><TableHead><TableRow><TableCell>변경 항목</TableCell><TableCell>이전</TableCell><TableCell>이후</TableCell></TableRow></TableHead><TableBody>
        {change.changed_fields.filter(field => !["updated_at", "created_at", "impersonation_audit_event_id"].includes(field)).map(field => {
          const before = change.before_data;
          const after = change.after_data;
          const recorded = Object.hasOwn(before || {}, field) || Object.hasOwn(after || {}, field);
          return <TableRow key={field}><TableCell>{FIELD_NAMES[field] || field}</TableCell><TableCell sx={{ overflowWrap: "anywhere" }}>{recorded ? display(before?.[field]) : "값 미표시"}</TableCell><TableCell sx={{ overflowWrap: "anywhere" }}>{recorded ? display(after?.[field]) : "값 미표시"}</TableCell></TableRow>;
        })}
      </TableBody></Table></TableContainer>
    </Box>
  ));
}

export default function CustomerDetailDialog({ customer, onClose, onImpersonate, working, actionError }) {
  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [detail, setDetail] = useState(null);
  const [records, setRecords] = useState(null);
  const [kind, setKind] = useState("overview");
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    let ignore = false;
    setDetail(null); setKind("overview"); setPage(1); setError("");
    if (customer) getCustomerDetail(customer.id).then(data => { if (!ignore) setDetail(data); })
      .catch(err => { if (!ignore) setError(customerError(err)); });
    return () => { ignore = true; };
  }, [customer]);
  useEffect(() => {
    let ignore = false;
    setRecords(null);
    if (!customer || kind === "overview") return;
    setLoading(true); setError("");
    getCustomerRecords(customer.id, kind, page).then(data => { if (!ignore) setRecords(data); })
      .catch(err => { if (!ignore) setError(customerError(err)); }).finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, [customer, kind, page]);
  const user = detail?.user || customer;
  const summary = detail?.summary;
  return (
    <Dialog open={Boolean(customer)} onClose={working ? undefined : onClose} fullWidth maxWidth="lg" fullScreen={mobile} scroll="paper">
      <DialogTitle><Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={1}>
        <Typography component="span" variant="h6" fontWeight={800}>설계사 #{user?.id} · {user?.name || user?.display_name}</Typography>
        <Chip size="small" label={planName(user?.plan_code)} color="primary" variant="outlined" />
      </Stack></DialogTitle>
      <DialogContent dividers>
        {(error || actionError) && <Alert severity="error" sx={{ mb: 2 }}>{error || actionError}</Alert>}
        <Stack direction="row" flexWrap="wrap" gap={1.25} sx={{ mb: 2 }}>
          <Stat label="보유 꼬막" value={`${number(user?.total_points)}개`} />
          <Stat label="누적 사용 (환불 제외)" value={`${number(user?.used_points)}개`} />
          <Stat label="예약 중" value={`${number(user?.reserved_points)}개`} />
          {summary && <Stat label="이번 달 사용" value={`${number(summary.month_used_points)}개`} />}
        </Stack>
        <Tabs value={kind} onChange={(_, value) => { setKind(value); setPage(1); }} variant="scrollable" scrollButtons="auto" aria-label="설계사 상세 정보" sx={{ mb: 2 }}>
          {TABS.map(([key, label]) => <Tab key={key} value={key} label={label} />)}
        </Tabs>
        {kind === "overview" ? detail ? (
          <Stack spacing={2.5}>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
              {[["설계사 번호", user.id], ["이름", user.name], ["닉네임", user.nickname], ["이메일", user.email], ["전화번호", user.phone],
                ["소속", user.affiliation], ["조직", user.group_name], ["사번", user.employee_number], ["조직 역할", user.group_role === "LEADER" ? "조직 관리자" : user.group_role === "MEMBER" ? "구성원" : "-"],
                ["계정 상태", STATUS_NAMES[user.status] || user.status], ["가입일", date(user.created_at)], ["최근 로그인", date(user.last_login_at)],
                ["로그인 방식", user.providers?.join(" · ")], ["지급 꼬막", number(user.free_points)], ["구매 꼬막", number(user.paid_points)],
                ["현재 구독", planName(user.plan_code)], ["구독 상태", STATUS_NAMES[user.subscription_status] || user.subscription_status],
                ["예정 요금제", user.next_plan_code ? `${planName(user.next_plan_code)} (${date(user.next_plan_effective_at)})` : "-"],
                ["검토 메모", user.review_note],
              ].map(([label, value]) => <Box key={label}><Typography variant="caption" color="text.secondary">{label}</Typography><Typography sx={{ overflowWrap: "anywhere" }}>{display(value)}</Typography></Box>)}
            </Box>
            {detail.subscription && <Alert severity="info">구독 기간: {date(detail.subscription.period_start)} ~ {date(detail.subscription.period_end)}{detail.subscription.cancel_at_period_end && " · 기간 종료 시 해지 예정"}</Alert>}
            <Stack direction="row" flexWrap="wrap" gap={1.25}>
              <Stat label="전체 보고서" value={number(summary.total_reports)} /><Stat label="완료 / 실패" value={`${number(summary.completed_reports)} / ${number(summary.failed_reports)}`} />
              <Stat label="누적 결제 (환불 제외)" value={`${number(summary.total_paid_amount)}원`} />
            </Stack>
          </Stack>
        ) : !error && <CircularProgress size={28} /> : loading ? <CircularProgress size={28} /> : records && (
          <Stack spacing={1.5}>
            {records.items.map(item => kind === "audit" ? (
              <Accordion key={item.id} variant="outlined" disableGutters>
                <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}><Box sx={{ minWidth: 0 }}>
                  <Typography fontWeight={700} sx={{ overflowWrap: "anywhere" }}>{auditAction(item)}</Typography>
                  <Typography variant="caption" color="text.secondary">{date(item.created_at)} · 실제 관리자: {item.actor_name} #{item.actor_admin_id} · {item.status_code === null ? "처리 중/완료 미확인" : `응답 ${item.status_code}`} · 변경 {item.changes.length}건</Typography>
                </Box></AccordionSummary>
                <AccordionDetails><Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>{item.title} · 대리 접속 #{item.session_id}</Typography><AuditChanges changes={item.changes} /></AccordionDetails>
              </Accordion>
            ) : (
              <Paper key={item.id} variant="outlined" sx={{ p: 1.75 }}>
                <Stack direction="row" justifyContent="space-between" gap={1}><Typography fontWeight={700} sx={{ overflowWrap: "anywhere" }}>{item.title || item.description}</Typography>
                  {item.status && <Chip size="small" label={STATUS_NAMES[item.status] || item.status} />}
                </Stack>
                <Typography variant="caption" color="text.secondary">{date(item.created_at || item.occurred_at)} · #{item.id}{item.kind ? ` · ${item.kind}` : ""}{item.is_deleted ? " · 삭제됨" : ""}</Typography>
                {kind === "points" && <Typography color={item.credit ? "success.main" : "text.primary"}>{item.credit ? `+${number(item.credit)}` : `−${number(item.debit)}`} 꼬막</Typography>}
                {kind === "reports" && <Typography variant="body2">{item.description} · {number(item.amount)} 꼬막</Typography>}
                {kind === "payments" && <Typography variant="body2">{number(item.amount)}원 · {number(item.points)} 꼬막</Typography>}
                {kind === "logins" && <Typography variant="body2" sx={{ overflowWrap: "anywhere" }}>{item.ip_address || "-"} · {item.user_agent || "-"}</Typography>}
              </Paper>
            ))}
            {!records.items.length && <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>기록이 없습니다.</Typography>}
            {records.total_pages > 1 && <Pagination count={records.total_pages} page={page} onChange={(_, value) => setPage(value)} sx={{ display: "flex", justifyContent: "center" }} />}
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button disabled={working || user?.role !== "USER" || user?.status !== "ACTIVE"} variant="contained" onClick={() => onImpersonate(user)}>설계사로 접속 (Impersonate)</Button>
        <Button disabled={working} onClick={onClose}>닫기</Button>
      </DialogActions>
    </Dialog>
  );
}
