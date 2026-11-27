import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import EditNoteRoundedIcon from "@mui/icons-material/EditNoteRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import ReplayRoundedIcon from "@mui/icons-material/ReplayRounded";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Pagination,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  decideRequest,
  deleteRequest,
  getRequest,
  listRequests,
  requestError,
  suggestionFileUrl,
  updateRefund,
} from "@/services/document-request-service";
import { getProposal, proposalFileUrl, proposalRawResponseUrl } from "@/services/proposal-service";
import "./document-requests.css";

const STATES = {
  PENDING: "접수",
  REFUNDED: "환불 완료",
  REJECTED: "거절",
  ACCEPTED: "반영 예정",
  COMPLETED: "완료됨",
};

const KINDS = {
  NEW_DOCUMENT: "새 양식 추가 요청",
  ADD_CONTENT: "기존 양식 수정 및 추가 요청",
};

function statusTone(status) {
  switch (status) {
    case "REFUNDED":
    case "COMPLETED":
      return "refunded";
    case "ACCEPTED":
      return "accepted";
    case "REJECTED":
      return "rejected";
    default:
      return "pending";
  }
}

// 접수 화면은 각각 분리하고, 내역 표시만 공통 컴포넌트를 사용합니다.
export default function RequestHistoryPage({ kind, admin = false }) { // eslint-disable-line react/prop-types
  const refund = kind === "refund";
  const location = useLocation();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [result, setResult] = useState(null);
  const [detail, setDetail] = useState(null);
  const [document, setDocument] = useState(null);
  const [error, setError] = useState("");
  const [detailError, setDetailError] = useState("");
  const [response, setResponse] = useState("");
  const [state, setState] = useState(refund ? "REFUND" : "ACCEPTED");
  const [working, setWorking] = useState(false);
  const [opening, setOpening] = useState(false);
  const [editingRefund, setEditingRefund] = useState(false);
  const [content, setContent] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const load = useCallback(async () => {
    try {
      setResult(await listRequests(kind, page, admin));
    } catch (err) {
      setError(requestError(err));
    }
  }, [kind, page, admin]);

  useEffect(() => {
    setResult(null);
    setError("");
    load();
  }, [load]);

  useEffect(() => {
    setStatusFilter("ALL");
  }, [kind, admin]);

  useEffect(() => {
    const id = new URLSearchParams(location.search).get("requestId");
    if (!/^[1-9]\d*$/.test(id || "")) return;
    let active = true;
    setOpening(true);
    getRequest(kind, id, admin)
      .then((data) => {
        if (!active) return;
        setDetail(data);
        setContent(data.content);
        setResponse(data.response || "");
        setState(kind === "refund" ? "REFUND" : data.status);
      })
      .catch(() => {
        if (active) setError("대상이 삭제되었거나 접근 권한이 없습니다.");
      })
      .finally(() => {
        if (active) setOpening(false);
      });
    return () => {
      active = false;
    };
  }, [location.search, kind, admin]);

  async function open(item) {
    setEditingRefund(false);
    setConfirmDelete(false);
    setOpening(true);
    setError("");
    setDetailError("");
    setDocument(null);
    try {
      const data = await getRequest(kind, item.id, admin);
      setDetail(data);
      setContent(data.content);
      setResponse(data.response || "");
      setState(refund ? "REFUND" : data.status);
      if (admin && refund) {
        try {
          setDocument(await getProposal(data.generation_id, true));
        } catch (err) {
          setDetailError(requestError(err));
        }
      }
    } catch (err) {
      setError(requestError(err));
    } finally {
      setOpening(false);
    }
  }

  async function decide() {
    setWorking(true);
    setDetailError("");
    try {
      await decideRequest(kind, detail.id, state, response.trim());
      setDetail(null);
      await load();
    } catch (err) {
      setDetailError(requestError(err));
    } finally {
      setWorking(false);
    }
  }

  async function saveRefund(event) {
    event.preventDefault();
    setWorking(true);
    setDetailError("");
    try {
      await updateRefund(detail.id, content.trim());
      setDetail(null);
      setEditingRefund(false);
      await load();
    } catch (err) {
      setDetailError(requestError(err));
    } finally {
      setWorking(false);
    }
  }

  async function remove() {
    setWorking(true);
    setDetailError("");
    try {
      await deleteRequest(kind, detail.id);
      setConfirmDelete(false);
      setDetail(null);
      await load();
    } catch (err) {
      setConfirmDelete(false);
      setDetailError(requestError(err));
    } finally {
      setWorking(false);
    }
  }

  const items = useMemo(() => result?.items || [], [result]);
  const filterOptions = useMemo(() => {
    const keys = refund
      ? ["ALL", "PENDING", "REFUNDED", "REJECTED"]
      : ["ALL", "PENDING", "ACCEPTED", "COMPLETED", "REJECTED"];
    return keys.map((key) => ({
      key,
      label: key === "ALL" ? "전체" : STATES[key],
      count: key === "ALL" ? items.length : items.filter((item) => item.status === key).length,
    }));
  }, [items, refund]);

  const filteredItems = useMemo(
    () => (statusFilter === "ALL" ? items : items.filter((item) => item.status === statusFilter)),
    [items, statusFilter],
  );

  const canProcess = detail && (!refund || detail.status === "PENDING");
  const pageTitle = refund
    ? (admin ? "환불 요청 관리" : "환불 요청 내역")
    : (admin ? "보고서 개선 건의 관리" : "보고서 개선 건의");
  const pageDesc = refund
    ? (admin
        ? "회원이 접수한 보고서 오류 환불 요청을 검토하고 꼬막 반환 또는 거절을 처리합니다."
        : "생성 오류가 발생한 보고서의 환불 접수 현황과 관리자 검토 결과를 확인할 수 있습니다.")
    : (admin
        ? "현장에서 요청한 신규 서식 및 기존 보고서 개선 제안을 검토하고 답변합니다."
        : "새로운 보험 서식 추가나 기존 보고서 개선이 필요할 때 자유롭게 의견을 보내주세요.");

  return (
    <Box component="main" className="docreq-workspace">
      <header className={`docreq-hero${refund ? " docreq-hero--refund" : ""}`}>
        <div className="docreq-hero-main">
          <span className="docreq-hero-icon">
            {refund ? <ReplayRoundedIcon /> : <EditNoteRoundedIcon />}
          </span>
          <div>
            <div className="docreq-hero-badge-row">
              <span className="docreq-hero-pill">
                {refund ? (admin ? "관리자 환불 검토" : "꼬막 환불 케어") : (admin ? "서식·보고서 개선 큐" : "서식 개선 제안")}
              </span>
              {result && (
                <span className="docreq-id-chip">
                  총 {(result.total ?? items.length).toLocaleString("ko-KR")}건
                </span>
              )}
            </div>
            <h1 className="docreq-hero-title">{pageTitle}</h1>
            <p className="docreq-hero-desc">{pageDesc}</p>
          </div>
        </div>

        <div className="docreq-hero-actions">
          <Button
            className="docreq-btn-ghost"
            startIcon={<RefreshRoundedIcon />}
            onClick={() => {
              setError("");
              load();
            }}
          >
            새로고침
          </Button>
          {!admin && refund && (
            <Button
              component={Link}
              to="/proposals"
              className="docreq-btn-primary docreq-btn-primary--refund"
              startIcon={<DescriptionRoundedIcon />}
            >
              내 보고서 확인
            </Button>
          )}
          {!admin && !refund && (
            <Button
              component={Link}
              to="/document-suggestions/new"
              className="docreq-btn-primary"
              startIcon={<AddRoundedIcon />}
            >
              보고서 개선 건의 작성
            </Button>
          )}
        </div>
      </header>

      {!admin && refund && (
        <div className="docreq-callout">
          <span>
            환불 요청은 <Link to="/proposals">생성 보고서 목록</Link>에서 해당 보고서를 선택해 바로 접수할 수 있습니다.
          </span>
        </div>
      )}

      {location.state?.notice && (
        <Alert severity="success" sx={{ mb: 2, borderRadius: 2.5 }}>
          {location.state.notice}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2.5 }}>
          {error}
        </Alert>
      )}

      {result && items.length > 0 && (
        <div className="docreq-filter-bar">
          <div className="docreq-filter-pills" role="group" aria-label="처리 상태 필터">
            {filterOptions.map((opt) => (
              <button
                key={opt.key}
                type="button"
                className="docreq-filter-pill"
                aria-pressed={statusFilter === opt.key}
                onClick={() => setStatusFilter(opt.key)}
              >
                {opt.label}
                <span>{opt.count}</span>
              </button>
            ))}
          </div>
          <span className="docreq-count-note">
            현재 페이지 {filteredItems.length}건 표시
          </span>
        </div>
      )}

      {!result && !error && (
        <div className="docreq-list">
          {[0, 1, 2].map((idx) => (
            <Skeleton key={idx} variant="rounded" height={94} sx={{ borderRadius: 3 }} />
          ))}
        </div>
      )}

      {result && filteredItems.length > 0 && (
        <div className="docreq-list">
          {filteredItems.map((item) => {
            const tone = statusTone(item.status);
            return (
              <article key={item.id} className={`docreq-card docreq-card--${tone}`}>
                <div className="docreq-card-main">
                  <div className="docreq-card-badges">
                    <span className={`docreq-status-badge docreq-status-badge--${tone}`}>
                      {STATES[item.status] || item.status}
                    </span>
                    {!refund && (
                      <span className="docreq-kind-pill">
                        {KINDS[item.kind] || item.kind}
                      </span>
                    )}
                    <span className="docreq-id-chip">#{item.id}</span>
                    {refund && item.point_cost != null && (
                      <span className="docreq-point-pill">
                        {item.point_cost}꼬막
                      </span>
                    )}
                  </div>
                  <h2 className="docreq-card-title">
                    {refund ? item.generation_title : item.title}
                  </h2>
                  <div className="docreq-card-meta">
                    <span>{new Date(item.created_at).toLocaleString("ko-KR")}</span>
                    {admin && <span>회원 #{item.user_id}</span>}
                    {refund && item.generation_id && <span>생성 건 #{item.generation_id}</span>}
                  </div>
                </div>
                <div className="docreq-card-actions">
                  {admin && (
                    <Button
                      component={Link}
                      to={`/admin/users?userId=${item.user_id}`}
                      size="small"
                      className="docreq-btn-ghost"
                      startIcon={<PersonOutlineRoundedIcon />}
                    >
                      회원 조회
                    </Button>
                  )}
                  <Button
                    className="docreq-detail-btn"
                    disabled={opening}
                    onClick={() => open(item)}
                  >
                    상세 보기
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {result && filteredItems.length === 0 && (
        <div className="docreq-empty">
          <span className="docreq-empty-icon">
            {refund ? <ReplayRoundedIcon /> : <EditNoteRoundedIcon />}
          </span>
          <strong>
            {statusFilter === "ALL"
              ? (refund ? "접수된 환불 요청 내역이 없습니다." : "접수된 보고서 개선 건의가 없습니다.")
              : "선택한 상태에 해당하는 내역이 없습니다."}
          </strong>
          <p>
            {statusFilter !== "ALL"
              ? "전체 필터로 전환하여 다른 처리 상태의 내역을 확인해 보세요."
              : refund
                ? "생성 결과에 문제가 있는 보고서가 있다면 생성 보고서 화면에서 환불을 요청하실 수 있습니다."
                : "새로운 서식이 필요하거나 기존 보고서에 보완할 내용이 있다면 언제든 건의해 주세요."}
          </p>
          {!admin && !refund && statusFilter === "ALL" && (
            <Button
              component={Link}
              to="/document-suggestions/new"
              className="docreq-btn-primary"
              startIcon={<AddRoundedIcon />}
              sx={{ mt: 1 }}
            >
              첫 건의사항 작성하기
            </Button>
          )}
        </div>
      )}

      {result?.total_pages > 1 && (
        <Pagination
          sx={{ mt: 3, display: "flex", justifyContent: "center" }}
          page={page}
          count={result.total_pages}
          onChange={(_, value) => setPage(value)}
        />
      )}

      <Dialog
        open={Boolean(detail)}
        onClose={() => {
          if (!working && !opening) setDetail(null);
        }}
        fullWidth
        maxWidth="md"
        slotProps={{ paper: { className: "docreq-dialog" } }}
      >
        <div className="docreq-dialog-header">
          <div className="docreq-dialog-header-main">
            <span className={`docreq-dialog-header-icon${refund ? " docreq-dialog-header-icon--refund" : ""}`}>
              {refund ? <ReplayRoundedIcon /> : <EditNoteRoundedIcon />}
            </span>
            <div>
              <DialogTitle>
                {refund ? "환불 요청 상세" : "보고서 개선 건의 상세"}
              </DialogTitle>
              <small>
                #{detail?.id} · {detail?.created_at ? new Date(detail.created_at).toLocaleString("ko-KR") : ""}
              </small>
            </div>
          </div>
          <IconButton
            aria-label="닫기"
            disabled={working || opening}
            onClick={() => setDetail(null)}
          >
            <CloseRoundedIcon />
          </IconButton>
        </div>

        <DialogContent>
          <Stack spacing={2}>
            {detailError && <Alert severity="error">{detailError}</Alert>}

            <section className="docreq-section-card">
              <div className="docreq-card-badges">
                <span className={`docreq-status-badge docreq-status-badge--${statusTone(detail?.status)}`}>
                  {STATES[detail?.status] || ""}
                </span>
                {!refund && detail?.kind && (
                  <span className="docreq-kind-pill">{KINDS[detail.kind] || detail.kind}</span>
                )}
                {refund && detail?.point_cost != null && (
                  <span className="docreq-point-pill">사용 {detail.point_cost}꼬막</span>
                )}
                {refund && detail?.generation_id && (
                  <span className="docreq-id-chip">생성 건 #{detail.generation_id}</span>
                )}
              </div>
              <Typography variant="h6" fontWeight={900} sx={{ overflowWrap: "anywhere", color: "#121314" }}>
                {refund ? detail?.generation_title : detail?.title}
              </Typography>
              {editingRefund ? (
                <Box component="form" id="refund-edit-form" onSubmit={saveRefund}>
                  <TextField
                    fullWidth
                    label="문제 내용 및 환불 요청 사유"
                    required
                    multiline
                    minRows={6}
                    value={content}
                    disabled={working}
                    inputProps={{ maxLength: 10000 }}
                    onChange={(e) => setContent(e.target.value)}
                  />
                </Box>
              ) : (
                <p className="docreq-content-box">{detail?.content}</p>
              )}
            </section>

            {document && (
              <section className="docreq-section-card">
                <h3>
                  <span>생성 보고서 검토</span>
                  <small>
                    {document.prompt_title} v{document.prompt_version_no}
                  </small>
                </h3>
                <div className="docreq-card-badges">
                  <span className="docreq-kind-pill">생성 상태: {document.status}</span>
                  <span className="docreq-kind-pill">과금 상태: {document.point_status}</span>
                </div>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {document.status === "COMPLETED" && (
                    <Button
                      className="docreq-btn-emerald"
                      href={proposalFileUrl(document.id, "output", { admin: true })}
                      target="_blank"
                      rel="noopener noreferrer"
                      endIcon={<OpenInNewRoundedIcon />}
                    >
                      생성 보고서 열기
                    </Button>
                  )}
                  {document.response_available && (
                    <Button
                      className="docreq-btn-ghost"
                      href={proposalRawResponseUrl(document.id, true, true)}
                    >
                      LLM 응답 다운로드
                    </Button>
                  )}
                  {document.files?.map((file) => (
                    <Button
                      key={file.id}
                      className="docreq-btn-ghost"
                      href={proposalFileUrl(document.id, "input", {
                        admin: true,
                        fileId: file.id,
                        download: true,
                      })}
                    >
                      {file.original_filename}
                    </Button>
                  ))}
                </Stack>
                {document.input_values && Object.keys(document.input_values).length > 0 && (
                  <pre className="docreq-code-pre">
                    {JSON.stringify(document.input_values, null, 2)}
                  </pre>
                )}
              </section>
            )}

            {!refund && (detail?.generation_id || (detail?.files?.length ?? 0) > 0) && (
              <section className="docreq-section-card">
                <h3>
                  <span>첨부 자료</span>
                  <small>연결 보고서 및 업로드 파일</small>
                </h3>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {detail?.generation_id && (
                    <Button
                      className="docreq-btn-ghost"
                      href={suggestionFileUrl(detail.id, null, admin)}
                      startIcon={<DescriptionRoundedIcon />}
                    >
                      첨부 보고서: {detail.generation_title}
                    </Button>
                  )}
                  {detail?.files?.map((file) => (
                    <Button
                      key={file.id}
                      className="docreq-btn-ghost"
                      href={suggestionFileUrl(detail.id, file.id, admin)}
                    >
                      {file.original_filename} 다운로드
                    </Button>
                  ))}
                </Stack>
              </section>
            )}

            {detail?.response && (
              <div className="docreq-reply-box">
                <strong>관리자 답변</strong>
                <p>{detail.response}</p>
                {detail.decided_at && (
                  <small>처리 일시: {new Date(detail.decided_at).toLocaleString("ko-KR")}</small>
                )}
              </div>
            )}

            {admin && canProcess && (
              <section className="docreq-section-card">
                <h3>
                  <span>관리자 처리</span>
                  <small>{refund ? "반환 여부 및 사유 입력" : "진행 상태 및 답변 등록"}</small>
                </h3>
                <TextField
                  select
                  size="small"
                  label="처리 상태"
                  value={state}
                  disabled={working || opening}
                  onChange={(e) => setState(e.target.value)}
                >
                  {refund
                    ? [
                        <MenuItem key="refund" value="REFUND">사용 꼬막 반환</MenuItem>,
                        <MenuItem key="reject" value="REJECT">환불 거절</MenuItem>,
                      ]
                    : [
                        <MenuItem key="pending" value="PENDING">접수</MenuItem>,
                        <MenuItem key="accept" value="ACCEPTED">반영 예정</MenuItem>,
                        <MenuItem key="complete" value="COMPLETED">완료됨</MenuItem>,
                        <MenuItem key="reject" value="REJECTED">거절</MenuItem>,
                      ]}
                </TextField>
                <TextField
                  label={refund ? "처리 사유" : "답변 내용"}
                  required
                  multiline
                  minRows={3}
                  value={response}
                  disabled={working || opening}
                  inputProps={{ maxLength: refund ? 500 : 2000 }}
                  onChange={(e) => setResponse(e.target.value)}
                />
              </section>
            )}
          </Stack>
        </DialogContent>

        <DialogActions>
          {!admin && detail?.status === "PENDING" && (
            editingRefund ? (
              <>
                <Button
                  type="submit"
                  form="refund-edit-form"
                  className="docreq-btn-emerald"
                  disabled={working || !content.trim()}
                >
                  수정 저장
                </Button>
                <Button
                  className="docreq-btn-ghost"
                  disabled={working}
                  onClick={() => {
                    setEditingRefund(false);
                    setContent(detail.content);
                  }}
                >
                  수정 취소
                </Button>
              </>
            ) : (
              <>
                <Button
                  className="docreq-btn-ghost"
                  startIcon={<EditOutlinedIcon />}
                  disabled={working || opening}
                  onClick={() =>
                    refund
                      ? setEditingRefund(true)
                      : navigate(`/document-suggestions/${detail.id}/edit`)
                  }
                >
                  수정
                </Button>
                <Button
                  color="error"
                  startIcon={<DeleteOutlineRoundedIcon />}
                  disabled={working || opening}
                  onClick={() => setConfirmDelete(true)}
                >
                  삭제
                </Button>
              </>
            )
          )}
          {admin && detail && (
            <Button
              component={Link}
              to={`/admin/users?userId=${detail.user_id}`}
              className="docreq-btn-ghost"
              startIcon={<PersonOutlineRoundedIcon />}
            >
              회원 조회
            </Button>
          )}
          {admin && canProcess && (
            <Button
              className="docreq-btn-emerald"
              disabled={working || opening || !response.trim()}
              onClick={decide}
            >
              {working ? "처리 중…" : "처리 저장"}
            </Button>
          )}
          <Button
            className="docreq-btn-ghost"
            disabled={working || opening}
            onClick={() => setDetail(null)}
          >
            닫기
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={confirmDelete}
        onClose={() => {
          if (!working) setConfirmDelete(false);
        }}
        fullWidth
        maxWidth="xs"
        slotProps={{ paper: { className: "docreq-dialog" } }}
      >
        <div className="docreq-dialog-header">
          <div className="docreq-dialog-header-main">
            <span className="docreq-dialog-header-icon docreq-dialog-header-icon--refund">
              <DeleteOutlineRoundedIcon />
            </span>
            <div>
              <DialogTitle>
                {refund ? "환불 요청 삭제" : "보고서 개선 건의 삭제"}
              </DialogTitle>
              <small>삭제 후에는 복구할 수 없습니다</small>
            </div>
          </div>
        </div>
        <DialogContent>
          <Typography variant="body2" fontWeight={600} color="text.primary">
            이 접수 내역을 삭제하시겠습니까?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            className="docreq-btn-ghost"
            disabled={working}
            onClick={() => setConfirmDelete(false)}
          >
            취소
          </Button>
          <Button
            color="error"
            variant="contained"
            disabled={working}
            onClick={remove}
          >
            {working ? "삭제 중…" : "삭제"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
