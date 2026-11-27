/* eslint-disable react/prop-types */
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  IconButton,
  Pagination,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import { useTheme } from "@mui/material/styles";
import { useEffect, useState } from "react";
import { planName } from "@/constants/plans";
import { customerError, getCustomerDetail, getCustomerRecords } from "@/services/customer-service";
import { canManageManualSubscription } from "./GrantFreePointsDialog";
import "./customer-detail-dialog.css";

const TABS = [
  ["overview", "기본 정보"],
  ["points", "꼬막 내역"],
  ["reports", "보고서"],
  ["payments", "결제·환불"],
  ["requests", "문의·신청"],
  ["logins", "로그인"],
  ["audit", "대리 접속 감사"],
];

const TABLE_NAMES = {
  user_sessions: "로그인 세션",
  users: "설계사 정보",
  office_groups: "조직 정보",
  point_grants: "꼬막 지급",
  referral_aliases: "추천용 닉네임",
  user_referrals: "추천인 등록",
  point_usages: "꼬막 사용",
  point_usage_allocations: "꼬막 차감·반환",
  billing_subscriptions: "구독",
  payment_orders: "결제",
  payment_refunds: "결제 환불",
  payment_methods: "결제 수단",
  personal_plan_requests: "요금제 신청",
  proposal_generations: "보고서",
  proposal_input_files: "보고서 첨부",
  proposal_generation_calls: "보고서 생성",
  document_suggestions: "문서 건의",
  document_refund_requests: "문서 환불",
  group_point_transfers: "조직 꼬막 이동",
  group_purchase_requests: "조직 구매 신청",
  prompt_favorites: "즐겨찾기",
  notification_preferences: "알림 설정",
  web_push_subscriptions: "알림 수신",
  user_email_change_requests: "이메일 변경",
};

const FIELD_NAMES = {
  id: "번호",
  user_id: "설계사 번호",
  email: "이메일",
  name: "이름",
  nickname: "닉네임",
  referred_user_id: "추천받은 설계사 번호",
  referrer_user_id: "추천인 설계사 번호",
  bonus_amount: "추천 보너스",
  bonus_expires_at: "보너스 만료일",
  grant_id: "지급 내역 번호",
  phone: "전화번호",
  affiliation: "소속",
  display_name: "표시 이름",
  status: "상태",
  role: "권한",
  plan_code: "요금제",
  amount: "금액·수량",
  remaining_amount: "남은 꼬막",
  point_type: "꼬막 종류",
  point_cost: "사용 꼬막",
  point_status: "꼬막 처리",
  title: "제목",
  group_id: "조직 번호",
  group_role: "조직 역할",
  employee_number: "사번",
  password_hash: "비밀번호",
  pending_email: "인증 대기 이메일",
  must_change_password: "비밀번호 변경 필요",
  expires_at: "만료일",
  refunded_amount: "환불 수량·금액",
  next_plan_code: "예정 요금제",
  period_start: "구독 시작",
  period_end: "구독 종료",
  cancel_at_period_end: "구독 종료 예정",
  is_deleted: "삭제 여부",
  is_selected: "선택 여부",
  alias: "별칭",
  output_object_key: "보고서 본문",
  output_bytes: "보고서 크기",
  output_filename: "보고서 파일명",
  share_summary: "공유 요약",
  content: "내용",
  enabled: "활성 여부",
  is_active: "활성 여부",
  updated_at: "변경 시각",
  source: "지급 경로",
  impersonation_session_id: "대리 접속 번호",
  revoked_at: "접속 종료",
  revoked_reason: "종료 사유",
  prompt_id: "프롬프트 번호",
  generation_id: "보고서 번호",
  requested_plan_code: "신청 요금제",
  completed_at: "완료 시각",
};

const STATUS_NAMES = {
  ACTIVE: "활성",
  PENDING: "대기",
  SUSPENDED: "정지",
  REJECTED: "거절",
  COMPLETED: "완료",
  FAILED: "실패",
  QUEUED: "대기",
  RUNNING: "생성 중",
  CANCELED: "취소",
  CANCELING: "해지 예정",
  PAID: "결제 완료",
  READY: "준비",
  SCHEDULED: "예약",
  REVIEW: "확인 필요",
  REFUNDED: "환불 완료",
  ACCEPTED: "반영 예정",
  APPROVED: "승인",
  유효: "유효",
  만료: "만료",
  종료: "종료",
};

const PROVIDER_LABELS = {
  KAKAO: "카카오",
  NAVER: "네이버",
  GOOGLE: "구글",
  LOCAL: "이메일",
  GROUP: "사번",
};

const LEDGER_CATEGORIES = {
  PLUS: { label: "충전·지급", tone: "green" },
  DOC: { label: "문서생성", tone: "violet" },
  FAX: { label: "PC팩스", tone: "blue" },
  EXPIRE: { label: "기간만료", tone: "rose" },
  OTHER: { label: "기타", tone: "slate" },
};

function statusTone(status) {
  if (["ACTIVE", "COMPLETED", "PAID", "APPROVED", "유효"].includes(status)) return "green";
  if (["RUNNING", "READY", "ACCEPTED"].includes(status)) return "blue";
  if (["PENDING", "SCHEDULED", "REVIEW", "CANCELING"].includes(status)) return "amber";
  if (["FAILED", "SUSPENDED", "REJECTED", "REFUNDED", "CANCELED"].includes(status)) return "rose";
  return "slate";
}

function auditAction(item) {
  if (item.title.startsWith("START ")) return "대리 접속 시작";
  if (item.title.startsWith("END ")) return "관리자 복귀";
  const read = item.title.startsWith("GET ") || item.title.startsWith("HEAD ");
  if (item.title.includes("/users/me/referral/alias")) return "추천용 닉네임 변경";
  if (item.title.includes("/users/me/referral")) return read ? "추천인 정보 조회" : "추천인 등록";
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

function date(value) {
  return value ? new Date(value).toLocaleString("ko-KR") : "-";
}

function number(value) {
  return Number(value || 0).toLocaleString("ko-KR");
}

function formatPhone(value) {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (!digits) return "";
  if (/^1[568]/.test(digits) && digits.length <= 8) {
    return digits.length > 4 ? `${digits.slice(0, 4)}-${digits.slice(4)}` : digits;
  }
  const prefixLength = digits.startsWith("02") ? 2 : digits.startsWith("0505") ? 4 : 3;
  const trimmed = digits.slice(0, prefixLength + 8);
  if (trimmed.length <= prefixLength) return trimmed;
  const rest = trimmed.slice(prefixLength);
  const middleLength = rest.length > 7 ? 4 : 3;
  return `${trimmed.slice(0, prefixLength)}-${rest.slice(0, middleLength)}${rest.length > middleLength ? `-${rest.slice(middleLength)}` : ""}`;
}

function parseUserAgent(ua) {
  if (!ua) return "기기 정보 없음";
  const os = /iPhone|iPad|iOS/i.test(ua)
    ? "iOS"
    : /Android/i.test(ua)
      ? "Android"
      : /Windows/i.test(ua)
        ? "Windows"
        : /Mac OS X|Macintosh/i.test(ua)
          ? "macOS"
          : /Linux/i.test(ua)
            ? "Linux"
            : "기타 OS";
  const browser = /Whale/i.test(ua)
    ? "Naver Whale"
    : /Edg/i.test(ua)
      ? "Edge"
      : /SamsungBrowser/i.test(ua)
        ? "Samsung Internet"
        : /Chrome|CriOS/i.test(ua)
          ? "Chrome"
          : /Firefox|FxiOS/i.test(ua)
            ? "Firefox"
            : /Safari/i.test(ua)
              ? "Safari"
              : "브라우저";
  return `${os} · ${browser}`;
}

function display(value) {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "boolean") return value ? "예" : "아니오";
  return typeof value === "object" ? JSON.stringify(value) : String(value);
}

function InfoTile({ label, children, empty = false, full = false }) {
  return (
    <div className={`admin-user-info-tile${empty ? " is-empty" : ""}${full ? " is-full" : ""}`}>
      <span>{label}</span>
      <div className="admin-user-info-value">{children}</div>
    </div>
  );
}

function AuditChanges({ changes }) {
  if (!changes?.length) {
    return (
      <Typography color="text.secondary" variant="body2">
        저장된 데이터 변경이 없습니다.
      </Typography>
    );
  }
  return changes.map((change) => (
    <Box key={change.id} sx={{ mb: 2 }}>
      <Typography fontWeight={800} fontSize={12.5} sx={{ mb: 0.75, color: "#121314" }}>
        {TABLE_NAMES[change.table_name] || "관련 정보"} #{change.record_id} ·{" "}
        {{ INSERT: "추가", UPDATE: "수정", DELETE: "삭제" }[change.operation]} ·{" "}
        <span className="admin-mono">{date(change.occurred_at)}</span>
      </Typography>
      <div className="admin-user-table-wrap">
        <Table size="small" className="admin-user-table">
          <TableHead>
            <TableRow>
              <TableCell>변경 항목</TableCell>
              <TableCell>이전</TableCell>
              <TableCell>이후</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {change.changed_fields
              .filter((field) => !["updated_at", "created_at", "impersonation_audit_event_id"].includes(field))
              .map((field) => {
                const before = change.before_data;
                const after = change.after_data;
                const recorded = Object.hasOwn(before || {}, field) || Object.hasOwn(after || {}, field);
                return (
                  <TableRow key={field}>
                    <TableCell sx={{ fontWeight: 750 }}>{FIELD_NAMES[field] || field}</TableCell>
                    <TableCell className="admin-audit-before" sx={{ overflowWrap: "anywhere" }}>
                      {recorded ? display(before?.[field]) : "값 미표시"}
                    </TableCell>
                    <TableCell className="admin-audit-after" sx={{ overflowWrap: "anywhere" }}>
                      {recorded ? display(after?.[field]) : "값 미표시"}
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </div>
    </Box>
  ));
}

export default function CustomerDetailDialog({
  customer,
  onClose,
  onImpersonate,
  onGrantPoints,
  onManualSubscription,
  refreshKey = 0,
  actionMessage = "",
  working,
  actionError,
}) {
  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down("sm"));
  const customerId = customer?.id || null;
  const [detail, setDetail] = useState(null);
  const [records, setRecords] = useState(null);
  const [kind, setKind] = useState("overview");
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setDetail(null);
    setKind("overview");
    setPage(1);
    setError("");
  }, [customerId]);

  useEffect(() => {
    let ignore = false;
    setError("");
    if (customerId) {
      getCustomerDetail(customerId)
        .then((data) => {
          if (!ignore) setDetail(data);
        })
        .catch((err) => {
          if (!ignore) setError(customerError(err));
        });
    }
    return () => {
      ignore = true;
    };
  }, [customerId, refreshKey]);

  useEffect(() => {
    let ignore = false;
    setRecords(null);
    if (!customerId || kind === "overview") return;
    setLoading(true);
    setError("");
    getCustomerRecords(customerId, kind, page)
      .then((data) => {
        if (!ignore) setRecords({ kind, page, data });
      })
      .catch((err) => {
        if (!ignore) setError(customerError(err));
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [customerId, kind, page, refreshKey]);

  const activeRecords = records?.kind === kind && records?.page === page ? records.data : null;

  const headerUser = detail?.user || customer;
  const resolvedUser = detail?.user || (customer?.plan_code ? customer : null);
  const user = detail?.user;
  const summary = detail?.summary;
  const displayName = headerUser?.name || headerUser?.display_name || headerUser?.nickname || "-";
  const initial = displayName && displayName !== "-" ? displayName.slice(0, 1) : "#";
  const formattedPhone = formatPhone(headerUser?.phone);
  const headerSub = [
    headerUser?.email || "이메일 미등록",
    formattedPhone || "전화 미등록",
    headerUser?.group_name || headerUser?.affiliation || null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Dialog
      open={Boolean(customer)}
      onClose={working ? undefined : onClose}
      fullWidth
      maxWidth="lg"
      fullScreen={mobile}
      scroll="paper"
      slotProps={{ paper: { className: "admin-user-dialog" } }}
    >
      <header className="admin-user-dialog-header">
        <div className="admin-user-dialog-identity">
          <span className="admin-user-dialog-avatar" aria-hidden="true">
            {initial}
          </span>
          <div className="admin-user-dialog-heading">
            <div className="admin-user-dialog-title-row">
              <h2>
                설계사 #{headerUser?.id} · {displayName}
              </h2>
              {resolvedUser?.status && (
                <span className={`admin-pill admin-pill--${statusTone(resolvedUser.status)}`}>
                  {STATUS_NAMES[resolvedUser.status] || resolvedUser.status}
                </span>
              )}
              {resolvedUser?.role === "ADMIN" && (
                <span className="admin-pill admin-pill--violet">ADMIN</span>
              )}
              {resolvedUser?.plan_code && (
                <span className="admin-pill admin-pill--dark">
                  {resolvedUser.manual_subscription_id
                    ? `${planName(resolvedUser.plan_code)} 수동 구독`
                    : planName(resolvedUser.plan_code)}
                </span>
              )}
            </div>
            <p className="admin-user-dialog-sub">{headerSub}</p>
          </div>
        </div>
        <IconButton
          aria-label="설계사 상세 닫기"
          className="admin-user-dialog-close"
          disabled={working}
          onClick={onClose}
        >
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </header>

      <DialogContent className="admin-user-dialog-body">
        {actionMessage && (
          <Alert severity="success" sx={{ borderRadius: "12px" }}>
            {actionMessage}
          </Alert>
        )}
        {(error || actionError) && (
          <Alert severity="error" sx={{ borderRadius: "12px" }}>
            {error || actionError}
          </Alert>
        )}

        {resolvedUser && (
          <div className="admin-user-kpi-grid">
            <div className="admin-user-kpi admin-user-kpi--green">
              <span>보유 꼬막</span>
              <strong>{number(resolvedUser.total_points)}개</strong>
              <small>
                지급 {number(resolvedUser.free_points)}개 · 구매 {number(resolvedUser.paid_points)}개
              </small>
            </div>
            <div className="admin-user-kpi admin-user-kpi--violet">
              <span>이번 달 사용</span>
              <strong>{summary ? `${number(summary.month_used_points)}개` : "—"}</strong>
              <small>당월(서울 기준) 차감 합계</small>
            </div>
            <div className="admin-user-kpi">
              <span>누적 사용 (환불 제외)</span>
              <strong>{number(resolvedUser.used_points)}개</strong>
              <small>전체 보고서·팩스 사용 합계</small>
            </div>
            <div className={`admin-user-kpi${Number(resolvedUser.reserved_points || 0) > 0 ? " admin-user-kpi--amber" : ""}`}>
              <span>예약 중</span>
              <strong>{number(resolvedUser.reserved_points)}개</strong>
              <small>생성 대기·진행 중인 차감 예약</small>
            </div>
          </div>
        )}

        <div className="admin-user-tabs-wrap">
          <Tabs
            value={kind}
            onChange={(_, value) => {
              setKind(value);
              setPage(1);
            }}
            variant="scrollable"
            scrollButtons="auto"
            aria-label="설계사 상세 정보"
          >
            {TABS.map(([key, label]) => (
              <Tab
                key={key}
                value={key}
                label={key === "reports" && summary ? `${label} (${number(summary.total_reports)})` : label}
              />
            ))}
          </Tabs>
        </div>

        {kind === "overview" ? (
          detail ? (
            <div className="admin-user-overview-wrap">
              <div className="admin-user-overview-kpis">
                <div className="admin-user-mini-stat">
                  <span>전체 보고서</span>
                  <strong>{number(summary.total_reports)}건</strong>
                  <small>
                    완료 {number(summary.completed_reports)}건 · 실패 {number(summary.failed_reports)}건
                  </small>
                </div>
                <div className="admin-user-mini-stat">
                  <span>누적 결제 (환불 제외)</span>
                  <strong>{number(summary.total_paid_amount)}원</strong>
                  <small>결제 완료 {number(summary.paid_orders)}건</small>
                </div>
                <div className="admin-user-mini-stat">
                  <span>최근 보고서 생성</span>
                  <strong style={{ fontSize: 13.5 }}>{date(summary.last_report_at)}</strong>
                  <small>최근 로그인 {date(user.last_login_at)}</small>
                </div>
              </div>

              <div className="admin-user-overview-grid">
                <section className="admin-user-section-card">
                  <div className="admin-user-section-head">
                    <h3>기본 인적 · 계정 정보</h3>
                    <span>회원 고유 #{user.id}</span>
                  </div>
                  <div className="admin-user-info-grid">
                    <InfoTile label="설계사 번호">
                      <span className="admin-mono">#{user.id}</span>
                    </InfoTile>
                    <InfoTile label="이름" empty={!user.name}>
                      {display(user.name)}
                    </InfoTile>
                    <InfoTile label="닉네임" empty={!user.nickname}>
                      {display(user.nickname)}
                    </InfoTile>
                    <InfoTile label="전화번호" empty={!user.phone}>
                      <span className={user.phone ? "admin-mono" : undefined}>
                        {user.phone ? formatPhone(user.phone) : "-"}
                      </span>
                    </InfoTile>
                    <InfoTile label="이메일" empty={!user.email} full>
                      {display(user.email)}
                    </InfoTile>
                    <InfoTile label="계정 상태">
                      <span className={`admin-pill admin-pill--${statusTone(user.status)}`}>
                        {STATUS_NAMES[user.status] || user.status}
                      </span>
                    </InfoTile>
                    <InfoTile label="로그인 방식" empty={!user.providers?.length}>
                      {user.providers?.length ? (
                        <div className="admin-user-provider-list">
                          {user.providers.map((provider) => (
                            <span key={provider} className="admin-pill admin-pill--slate">
                              {PROVIDER_LABELS[provider] || provider}
                            </span>
                          ))}
                        </div>
                      ) : (
                        "-"
                      )}
                    </InfoTile>
                    <InfoTile label="가입일">
                      <span className="admin-mono" style={{ fontSize: 12 }}>
                        {date(user.created_at)}
                      </span>
                    </InfoTile>
                    <InfoTile label="최근 로그인" empty={!user.last_login_at}>
                      <span className="admin-mono" style={{ fontSize: 12 }}>
                        {date(user.last_login_at)}
                      </span>
                    </InfoTile>
                  </div>
                </section>

                <section className="admin-user-section-card">
                  <div className="admin-user-section-head">
                    <h3>소속 · 조직 · 구독 및 꼬막</h3>
                    <span>{planName(user.plan_code)}</span>
                  </div>
                  <div className="admin-user-info-grid">
                    <InfoTile label="소속" empty={!user.affiliation}>
                      {display(user.affiliation)}
                    </InfoTile>
                    <InfoTile label="조직" empty={!user.group_name}>
                      {display(user.group_name)}
                    </InfoTile>
                    <InfoTile label="사번" empty={!user.employee_number}>
                      <span className={user.employee_number ? "admin-mono" : undefined}>
                        {display(user.employee_number)}
                      </span>
                    </InfoTile>
                    <InfoTile label="조직 역할" empty={!user.group_role}>
                      {user.group_role === "LEADER"
                        ? "조직 관리자"
                        : user.group_role === "MEMBER"
                          ? "구성원"
                          : "-"}
                    </InfoTile>
                    <InfoTile label="현재 구독">
                      <span className="admin-pill admin-pill--violet">
                        {user.manual_subscription_id
                          ? `${planName(user.plan_code)} (수동)`
                          : planName(user.plan_code)}
                      </span>
                    </InfoTile>
                    <InfoTile label="구독 상태" empty={!user.subscription_status}>
                      {user.subscription_status ? (
                        <span className={`admin-pill admin-pill--${statusTone(user.subscription_status)}`}>
                          {STATUS_NAMES[user.subscription_status] || user.subscription_status}
                        </span>
                      ) : (
                        "-"
                      )}
                    </InfoTile>
                    <InfoTile label="예정 요금제" empty={!user.next_plan_code} full>
                      {user.next_plan_code
                        ? `${user.next_plan_code === "FREE" ? "해지" : planName(user.next_plan_code)} (${date(user.next_plan_effective_at)})`
                        : "-"}
                    </InfoTile>
                    <InfoTile label="지급 꼬막 (FREE)">
                      <span className="admin-mono">{number(user.free_points)}개</span>
                    </InfoTile>
                    <InfoTile label="구매 꼬막 (PAID)">
                      <span className="admin-mono">{number(user.paid_points)}개</span>
                    </InfoTile>
                  </div>

                  {detail.subscription && (
                    <div className="admin-user-sub-banner">
                      <span>
                        구독 기간: <strong className="admin-mono">{date(detail.subscription.period_start)}</strong> ~{" "}
                        <strong className="admin-mono">{date(detail.subscription.period_end)}</strong>
                      </span>
                      {detail.subscription.cancel_at_period_end && (
                        <span className="admin-pill admin-pill--amber">기간 종료 시 해지 예정</span>
                      )}
                    </div>
                  )}

                  <div className={`admin-user-memo-box${user.review_note ? "" : " is-empty"}`}>
                    <span>검토 메모</span>
                    <p>{user.review_note || "등록된 검토 메모가 없습니다."}</p>
                  </div>
                </section>
              </div>
            </div>
          ) : (
            !error && (
              <div className="admin-user-loading-box">
                <CircularProgress size={26} />
                <span>설계사 상세 정보를 불러오는 중입니다…</span>
              </div>
            )
          )
        ) : loading || !activeRecords ? (
          <div className="admin-user-loading-box">
            <CircularProgress size={26} />
            <span>내역을 불러오는 중입니다…</span>
          </div>
        ) : (
          <section className="admin-user-records-card">
            <div className="admin-user-section-head">
              <h3>{TABS.find(([key]) => key === kind)?.[1]}</h3>
              <span>총 {number(activeRecords.total)}건</span>
            </div>

            {!activeRecords.items?.length ? (
              <div className="admin-user-empty">해당 항목의 기록이 없습니다.</div>
            ) : kind === "points" ? (
              <div className="admin-user-table-wrap">
                <table className="admin-user-table">
                  <thead>
                    <tr>
                      <th>일시</th>
                      <th>구분</th>
                      <th>내역</th>
                      <th style={{ textAlign: "right" }}>증감</th>
                      <th style={{ textAlign: "right" }}>거래 후 잔액</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeRecords.items.map((item) => {
                      const cat = LEDGER_CATEGORIES[item.category] || LEDGER_CATEGORIES.OTHER;
                      return (
                        <tr key={item.id}>
                          <td className="admin-mono" style={{ whiteSpace: "nowrap", fontSize: 11.5, color: "#64748b" }}>
                            {date(item.occurred_at || item.created_at)}
                          </td>
                          <td>
                            <span className={`admin-pill admin-pill--${cat.tone}`}>{cat.label}</span>
                          </td>
                          <td style={{ fontWeight: 700 }}>{item.description || item.title || "-"}</td>
                          <td className={`admin-user-cell-num ${item.credit ? "admin-user-credit" : `admin-user-debit${item.category === "EXPIRE" ? " is-expire" : ""}`}`}>
                            {item.credit ? `+${number(item.credit)}` : `−${number(item.debit)}`}
                          </td>
                          <td className="admin-user-cell-num">
                            {item.balance_after != null ? `${number(item.balance_after)}개` : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : kind === "reports" ? (
              <div className="admin-user-table-wrap">
                <table className="admin-user-table">
                  <thead>
                    <tr>
                      <th>번호</th>
                      <th>보고서 · 프롬프트</th>
                      <th>상태</th>
                      <th style={{ textAlign: "right" }}>꼬막</th>
                      <th>생성 시각</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeRecords.items.map((item) => (
                      <tr key={item.id}>
                        <td className="admin-mono" style={{ fontWeight: 800, color: "#64748b" }}>#{item.id}</td>
                        <td>
                          <div style={{ fontWeight: 800 }}>
                            {item.title}
                            {item.is_deleted && (
                              <span className="admin-pill admin-pill--rose" style={{ marginLeft: 6 }}>삭제됨</span>
                            )}
                          </div>
                          {item.description && <span className="admin-user-cell-sub">{item.description}</span>}
                        </td>
                        <td>
                          <span className={`admin-pill admin-pill--${statusTone(item.status)}`}>
                            {STATUS_NAMES[item.status] || item.status}
                          </span>
                        </td>
                        <td className="admin-user-cell-num">{number(item.amount)}개</td>
                        <td className="admin-mono" style={{ whiteSpace: "nowrap", fontSize: 11.5, color: "#64748b" }}>
                          {date(item.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : kind === "payments" ? (
              <div className="admin-user-table-wrap">
                <table className="admin-user-table">
                  <thead>
                    <tr>
                      <th>구분</th>
                      <th>내역</th>
                      <th>상태</th>
                      <th style={{ textAlign: "right" }}>금액</th>
                      <th style={{ textAlign: "right" }}>꼬막</th>
                      <th>일시</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeRecords.items.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <span className={`admin-pill admin-pill--${item.kind === "환불" ? "rose" : "green"}`}>
                            {item.kind || "결제"}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 800 }}>{item.title}</div>
                          <span className="admin-user-cell-sub admin-mono">{item.id}</span>
                        </td>
                        <td>
                          <span className={`admin-pill admin-pill--${statusTone(item.status)}`}>
                            {STATUS_NAMES[item.status] || item.status}
                          </span>
                        </td>
                        <td className="admin-user-cell-num">{number(item.amount)}원</td>
                        <td className="admin-user-cell-num">{number(item.points)}개</td>
                        <td className="admin-mono" style={{ whiteSpace: "nowrap", fontSize: 11.5, color: "#64748b" }}>
                          {date(item.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : kind === "requests" ? (
              <div className="admin-user-card-list">
                {activeRecords.items.map((item) => {
                  const kindTone = item.kind === "문서 환불" ? "amber" : item.kind === "요금제 신청" ? "blue" : "violet";
                  const requestTitle = item.kind === "요금제 신청"
                    ? (item.title === "FREE" ? "구독 해지 신청" : `${planName(item.title)} 요금제 신청`)
                    : item.title;
                  return (
                    <article key={item.id} className="admin-user-record-card">
                      <div className="admin-user-record-card-top">
                        <div className="admin-user-record-card-badges">
                          <span className={`admin-pill admin-pill--${kindTone}`}>{item.kind || "요청"}</span>
                          {item.status && (
                            <span className={`admin-pill admin-pill--${statusTone(item.status)}`}>
                              {STATUS_NAMES[item.status] || item.status}
                            </span>
                          )}
                          <span className="admin-mono" style={{ fontSize: 11, color: "#8b95a1" }}>{item.id}</span>
                        </div>
                        <time className="admin-mono" style={{ fontSize: 11.5, color: "#64748b" }}>
                          {date(item.created_at)}
                        </time>
                      </div>
                      <h4 className="admin-user-record-title">{requestTitle}</h4>
                    </article>
                  );
                })}
              </div>
            ) : kind === "logins" ? (
              <div className="admin-user-table-wrap">
                <table className="admin-user-table">
                  <thead>
                    <tr>
                      <th>세션 상태</th>
                      <th>접속 시각</th>
                      <th>접속 IP</th>
                      <th>기기 · 브라우저</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeRecords.items.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <span className={`admin-pill admin-pill--${statusTone(item.status)}`}>
                            {STATUS_NAMES[item.status] || item.status}
                          </span>
                        </td>
                        <td className="admin-mono" style={{ whiteSpace: "nowrap", fontSize: 11.5, color: "#64748b" }}>
                          {date(item.created_at)}
                        </td>
                        <td>
                          <span className="admin-pill admin-pill--slate admin-mono">
                            {item.ip_address || "-"}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 750 }}>{parseUserAgent(item.user_agent)}</div>
                          {item.user_agent && <span className="admin-user-cell-sub">{item.user_agent}</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="admin-user-audit-list">
                {activeRecords.items.map((item) => {
                  const changes = Array.isArray(item.changes) ? item.changes : [];
                  const statusOk = item.status_code != null && item.status_code >= 200 && item.status_code < 400;
                  const statusToneName = item.status_code == null ? "amber" : statusOk ? "green" : "rose";
                  return (
                    <Accordion key={item.id} className="admin-user-audit-item" disableGutters>
                      <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
                        <div className="admin-user-audit-summary">
                          <div className="admin-user-audit-badges">
                            <Typography fontWeight={850} fontSize={13.5} sx={{ color: "#121314", overflowWrap: "anywhere" }}>
                              {auditAction(item)}
                            </Typography>
                            <span className={`admin-pill admin-pill--${statusToneName}`}>
                              {item.status_code === null ? "미확인" : `응답 ${item.status_code}`}
                            </span>
                            <span className="admin-pill admin-pill--violet">
                              변경 {changes.length}건
                            </span>
                          </div>
                          <span className="admin-user-audit-meta">
                            <span className="admin-mono">{date(item.created_at)}</span> · 관리자:{" "}
                            {item.actor_name} (#{item.actor_admin_id})
                          </span>
                        </div>
                      </AccordionSummary>
                      <AccordionDetails sx={{ pt: 0, bgcolor: "#f8fafc", borderTop: "1px solid #f1f5f9" }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", my: 1 }} className="admin-mono">
                          {item.title} · 대리 접속 #{item.session_id}
                        </Typography>
                        <AuditChanges changes={changes} />
                      </AccordionDetails>
                    </Accordion>
                  );
                })}
              </div>
            )}

            {activeRecords.total_pages > 1 && (
              <Pagination
                count={activeRecords.total_pages}
                page={page}
                onChange={(_, value) => setPage(value)}
                sx={{ display: "flex", justifyContent: "center", pt: 0.5 }}
              />
            )}
          </section>
        )}
      </DialogContent>

      <DialogActions className="admin-user-dialog-footer">
        <div className="admin-user-footer-group">
          {onGrantPoints && (
            <Button disabled={working || !resolvedUser} variant="outlined" onClick={() => onGrantPoints(resolvedUser)}>
              꼬막 지급·회수
            </Button>
          )}
          {onManualSubscription && canManageManualSubscription(resolvedUser) && (
            <Button disabled={working || !resolvedUser} variant="outlined" onClick={() => onManualSubscription(resolvedUser)}>
              {resolvedUser?.manual_subscription_id ? "수동 구독 종료" : "수동 구독 적용"}
            </Button>
          )}
        </div>
        <div className="admin-user-footer-group">
          {onImpersonate && (
            <Button
              disabled={working || resolvedUser?.role !== "USER" || resolvedUser?.status !== "ACTIVE"}
              variant="contained"
              className="admin-user-btn-primary"
              onClick={() => onImpersonate(resolvedUser)}
            >
              설계사로 접속 (Impersonate)
            </Button>
          )}
          <Button disabled={working} variant="outlined" onClick={onClose}>
            닫기
          </Button>
        </div>
      </DialogActions>
    </Dialog>
  );
}
