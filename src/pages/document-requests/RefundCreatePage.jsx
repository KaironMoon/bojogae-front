import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import ReplayRoundedIcon from "@mui/icons-material/ReplayRounded";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Alert, Box, Button, Skeleton, Stack, TextField, Typography } from "@mui/material";
import ErrorNoticeDialog from "@/components/ErrorNoticeDialog";
import { getProposal, proposalFileUrl } from "@/services/proposal-service";
import { createRefund, requestError } from "@/services/document-request-service";
import "./document-requests.css";

export default function RefundCreatePage() {
  const { generationId } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setDocument(null);
    setError("");
    getProposal(generationId)
      .then((item) => {
        if (active) setDocument(item);
      })
      .catch((err) => {
        if (active) setError(requestError(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [generationId]);

  const eligible =
    document &&
    ["COMPLETED", "FAILED"].includes(document.status) &&
    ["CONSUMED", "REVIEW_REQUIRED"].includes(document.point_status);

  async function submit(event) {
    event.preventDefault();
    setWorking(true);
    setError("");
    try {
      await createRefund(Number(generationId), content.trim());
      navigate("/refund-requests", {
        state: { notice: "환불 요청이 접수되었습니다. 관리자 검토 후 처리됩니다." },
      });
    } catch (err) {
      setError(requestError(err));
    } finally {
      setWorking(false);
    }
  }

  return (
    <Box component="main" className="docreq-workspace docreq-form-workspace">
      <header className="docreq-hero docreq-hero--refund">
        <div className="docreq-hero-main">
          <span className="docreq-hero-icon">
            <ReplayRoundedIcon />
          </span>
          <div>
            <div className="docreq-hero-badge-row">
              <span className="docreq-hero-pill">꼬막 환불 요청</span>
            </div>
            <h1 className="docreq-hero-title">보고서 환불 요청</h1>
            <p className="docreq-hero-desc">
              생성된 보고서에 품질 오류나 누락이 있는 경우 사유를 남겨주시면 확인 후 꼬막을 반환해 드립니다.
            </p>
          </div>
        </div>
        <div className="docreq-hero-actions">
          <Button
            className="docreq-btn-ghost"
            startIcon={<ArrowBackRoundedIcon />}
            disabled={working}
            onClick={() => navigate("/proposals")}
          >
            생성 내역으로
          </Button>
        </div>
      </header>

      <ErrorNoticeDialog message={error} onClose={() => setError("")} />

      {loading ? (
        <Stack spacing={1.5}>
          <Skeleton variant="rounded" height={110} sx={{ borderRadius: 3 }} />
          <Skeleton variant="rounded" height={240} sx={{ borderRadius: 3 }} />
        </Stack>
      ) : (
        document && (
          <Box component="form" onSubmit={submit}>
            <Stack spacing={2}>
              <section className="docreq-form-card">
                <div className="docreq-form-card-head">
                  <h2>대상 보고서 정보</h2>
                  <span className="docreq-point-pill">사용 {document.point_cost}꼬막</span>
                </div>
                <div className="docreq-card-badges">
                  <span className="docreq-id-chip">생성 건 #{document.id}</span>
                  {document.prompt_title && (
                    <span className="docreq-kind-pill">{document.prompt_title}</span>
                  )}
                </div>
                <Typography variant="h6" fontWeight={900} color="#121314" sx={{ overflowWrap: "anywhere" }}>
                  {document.title}
                </Typography>
                {document.summary && (
                  <Typography variant="body2" fontWeight={700} color="#5b21b6">
                    {document.summary}
                  </Typography>
                )}
                <Alert severity={eligible ? "info" : "warning"} sx={{ borderRadius: 2 }}>
                  {eligible
                    ? "발생한 문제 내용을 작성해 주세요. 관리자가 생성 보고서를 검토한 뒤 사용 꼬막 반환 또는 거절을 결정합니다."
                    : "현재 과금 상태에서는 환불을 요청할 수 없습니다."}
                </Alert>
                {document.status === "COMPLETED" && (
                  <Box>
                    <Button
                      className="docreq-btn-ghost"
                      href={proposalFileUrl(document.id, "output")}
                      target="_blank"
                      rel="noopener noreferrer"
                      endIcon={<OpenInNewRoundedIcon />}
                    >
                      생성 보고서 확인
                    </Button>
                  </Box>
                )}
              </section>

              <section className="docreq-form-card">
                <div className="docreq-form-card-head">
                  <h2>문제 내용 및 환불 사유</h2>
                  <small>필수 입력</small>
                </div>
                <TextField
                  label="문제 내용 및 환불 요청 사유"
                  placeholder="예: 업로드한 설계서의 특약 금액과 다르게 추출되었거나, 일부 페이지 레이아웃이 비정상적으로 출력되었습니다."
                  multiline
                  minRows={6}
                  required
                  value={content}
                  disabled={working || !eligible}
                  inputProps={{ maxLength: 10000 }}
                  onChange={(e) => setContent(e.target.value)}
                  helperText={`${content.length.toLocaleString("ko-KR")} / 10,000자`}
                />
              </section>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} justifyContent="flex-end">
                <Button
                  className="docreq-btn-ghost"
                  disabled={working}
                  onClick={() => navigate("/proposals")}
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  className="docreq-btn-primary docreq-btn-primary--refund"
                  disabled={working || !eligible || !content.trim()}
                >
                  {working ? "접수 중…" : "환불 요청 접수"}
                </Button>
              </Stack>
            </Stack>
          </Box>
        )
      )}
    </Box>
  );
}
