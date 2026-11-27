import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import EditNoteRoundedIcon from "@mui/icons-material/EditNoteRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Pagination,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { getProposal, getProposals, proposalFileUrl } from "@/services/proposal-service";
import { createSuggestion, getRequest, requestError, suggestionFileUrl } from "@/services/document-request-service";
import "./document-requests.css";

const SUGGESTION_KINDS = [
  {
    key: "NEW_DOCUMENT",
    title: "새 양식 추가 요청",
    desc: "현재 제공되지 않는 보험사·상품 또는 상담용 신규 보고서 양식을 요청합니다.",
  },
  {
    key: "ADD_CONTENT",
    title: "기존 양식 수정 및 추가 요청",
    desc: "기존 보고서 양식의 문구·항목·시각화 구성을 개선하거나 추가를 제안합니다.",
  },
];

function documentMetadata(item) {
  const date = item.created_at ? new Date(item.created_at).toLocaleString("ko-KR") : "일시 정보 없음";
  const bytes = Number(item.total_input_bytes || 0);
  const size = bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)}MB` : `${Math.ceil(bytes / 1024)}KB`;
  return `보고서 #${item.id} · 생성 ${date} · 입력 파일 ${item.input_file_count ?? 0}개 (${size})`;
}

export default function SuggestionCreatePage() {
  const navigate = useNavigate();
  const { requestId } = useParams();
  const editing = Boolean(requestId);
  const [loading, setLoading] = useState(editing);
  const [editable, setEditable] = useState(!editing);
  const [existingFiles, setExistingFiles] = useState([]);
  const [kind, setKind] = useState("NEW_DOCUMENT");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [generation, setGeneration] = useState(null);
  const [files, setFiles] = useState([]);
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);
  const [picker, setPicker] = useState(false);
  const [page, setPage] = useState(1);
  const [documents, setDocuments] = useState(null);
  const [pickerError, setPickerError] = useState("");

  useEffect(() => {
    if (!requestId) {
      setLoading(false);
      setEditable(true);
      return;
    }
    let active = true;
    setLoading(true);
    setEditable(false);
    setError("");
    setFiles([]);
    setExistingFiles([]);
    setGeneration(null);
    getRequest("suggestion", requestId)
      .then(async (data) => {
        if (!active) return;
        if (data.status !== "PENDING") {
          setError("접수 상태에서만 수정할 수 있습니다.");
          return;
        }
        setKind(data.kind);
        setTitle(data.title);
        setContent(data.content);
        setExistingFiles(data.files || []);
        setGeneration(data.generation_id ? { id: data.generation_id, title: data.generation_title } : null);
        if (data.generation_id) {
          try {
            const document = await getProposal(data.generation_id);
            if (active) setGeneration(document);
          } catch {
            // 논리 삭제된 보고서는 저장해둔 첨부 연결을 유지합니다.
          }
        }
        if (active) setEditable(true);
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
  }, [requestId]);

  useEffect(() => {
    if (!picker) return;
    let active = true;
    setDocuments(null);
    setPickerError("");
    getProposals(page, 20)
      .then((result) => {
        if (active) setDocuments(result);
      })
      .catch((err) => {
        if (active) setPickerError(requestError(err));
      });
    return () => {
      active = false;
    };
  }, [picker, page]);

  function chooseFiles(event) {
    const selected = Array.from(event.target.files || []);
    event.target.value = "";
    if (selected.length + files.length + existingFiles.length > 5) {
      setError("첨부파일은 최대 5개까지 가능합니다.");
      return;
    }
    if (selected.some((file) => file.size === 0 || file.size > 10 * 1024 * 1024)) {
      setError("파일은 0바이트보다 크고, 파일당 최대 10MB까지 가능합니다.");
      return;
    }
    setFiles((current) => [...current, ...selected]);
    setError("");
  }

  async function submit(event) {
    event.preventDefault();
    setWorking(true);
    setError("");
    try {
      await createSuggestion({
        kind,
        title: title.trim(),
        content: content.trim(),
        generation,
        files,
        requestId,
        keptFileIds: existingFiles.map((file) => file.id),
      });
      navigate("/document-suggestions", {
        state: { notice: editing ? "보고서 개선 건의가 수정되었습니다." : "보고서 개선 건의가 접수되었습니다." },
      });
    } catch (err) {
      setError(requestError(err));
    } finally {
      setWorking(false);
    }
  }

  return (
    <Box component="main" className="docreq-workspace docreq-form-workspace">
      <header className="docreq-hero">
        <div className="docreq-hero-main">
          <span className="docreq-hero-icon">
            <EditNoteRoundedIcon />
          </span>
          <div>
            <div className="docreq-hero-badge-row">
              <span className="docreq-hero-pill">서식 개선 제안</span>
            </div>
            <h1 className="docreq-hero-title">
              {editing ? "보고서 개선 건의 수정" : "보고서 개선 건의 작성"}
            </h1>
            <p className="docreq-hero-desc">
              새 보고서 양식 추가나 기존 보고서 양식의 보완 아이디어를 자세히 남겨주시면 검토 후 반영합니다.
            </p>
          </div>
        </div>
        <div className="docreq-hero-actions">
          <Button
            className="docreq-btn-ghost"
            startIcon={<ArrowBackRoundedIcon />}
            disabled={working}
            onClick={() => navigate("/document-suggestions")}
          >
            목록으로
          </Button>
        </div>
      </header>

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2.5 }}>
          {error}
        </Alert>
      )}
      {loading && (
        <Stack spacing={1.5} sx={{ mb: 2 }}>
          <Skeleton variant="rounded" height={120} sx={{ borderRadius: 3 }} />
          <Skeleton variant="rounded" height={240} sx={{ borderRadius: 3 }} />
        </Stack>
      )}

      <Box component="form" onSubmit={submit}>
        <Stack spacing={2}>
          <section className="docreq-form-card">
            <div className="docreq-form-card-head">
              <h2>1. 건의 유형 및 내용</h2>
              <small>필수 항목</small>
            </div>
            <div className="docreq-kind-grid" role="group" aria-label="건의 유형 선택">
              {SUGGESTION_KINDS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className="docreq-kind-tile"
                  aria-pressed={kind === item.key}
                  disabled={working || loading || !editable}
                  onClick={() => setKind(item.key)}
                >
                  <strong>{item.title}</strong>
                  <span>{item.desc}</span>
                </button>
              ))}
            </div>
            <TextField
              label="제목"
              placeholder="예: 간병인 사용일당 제안서 요약에 가족간병 유의사항 추가 요청"
              required
              value={title}
              disabled={working || loading || !editable}
              inputProps={{ maxLength: 200 }}
              onChange={(e) => setTitle(e.target.value)}
            />
            <TextField
              label="건의 내용"
              placeholder="필요한 보험사·상품명, 추가되었으면 하는 표/문구, 현장 상담 시 불편했던 점을 적어주세요."
              required
              multiline
              minRows={6}
              value={content}
              disabled={working || loading || !editable}
              inputProps={{ maxLength: 10000 }}
              onChange={(e) => setContent(e.target.value)}
              helperText={`${content.length.toLocaleString("ko-KR")} / 10,000자`}
            />
          </section>

          <section className="docreq-form-card">
            <div className="docreq-form-card-head">
              <h2>2. 생성 보고서 첨부</h2>
              <small>선택 사항</small>
            </div>
            <div className="docreq-upload-drop">
              <div>
                <Typography variant="body2" fontWeight={800} color="#121314">
                  기존에 생성한 보고서를 연결하면 더 정확히 파악할 수 있습니다
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  완료된 보고서 목록에서 대상 보고서를 선택해 첨부할 수 있습니다.
                </Typography>
              </div>
              <Button
                className="docreq-btn-ghost"
                startIcon={<DescriptionRoundedIcon />}
                disabled={working || loading || !editable}
                onClick={() => setPicker(true)}
              >
                생성 보고서 선택
              </Button>
            </div>
            {generation && (
              <div className="docreq-attached-report">
                <Typography fontWeight={850} sx={{ overflowWrap: "anywhere", color: "#121314" }}>
                  {generation.title}
                </Typography>
                {generation.summary && (
                  <Typography variant="body2" fontWeight={700} color="#5b21b6">
                    {generation.summary}
                  </Typography>
                )}
                {generation.prompt_title && (
                  <Typography variant="body2" sx={{ overflowWrap: "anywhere", color: "#4e5968" }}>
                    서식: {generation.prompt_title}
                  </Typography>
                )}
                <Typography variant="caption" color="text.secondary">
                  {generation.created_at ? documentMetadata(generation) : `보고서 #${generation.id}`}
                </Typography>
                <Stack direction="row" spacing={1} justifyContent="flex-end" flexWrap="wrap" useFlexGap>
                  <Button
                    className="docreq-btn-ghost"
                    href={editing && !generation.created_at ? suggestionFileUrl(requestId, null) : proposalFileUrl(generation.id, "output")}
                    target="_blank"
                    rel="noopener noreferrer"
                    endIcon={<OpenInNewRoundedIcon />}
                  >
                    {editing && !generation.created_at ? "첨부한 보고서 다운로드" : "생성 결과 보기"}
                  </Button>
                  <Button
                    color="error"
                    disabled={working || loading || !editable}
                    onClick={() => setGeneration(null)}
                  >
                    연결 해제
                  </Button>
                </Stack>
              </div>
            )}
          </section>

          <section className="docreq-form-card">
            <div className="docreq-form-card-head">
              <h2>3. 참고 파일 첨부</h2>
              <small>선택 · 최대 5개 · 파일당 10MB</small>
            </div>
            <div className="docreq-upload-drop">
              <Typography variant="body2" fontWeight={700} color="#4e5968">
                참고할 가입설계서, 약관 캡처, 예시 이미지를 첨부해 주세요.
              </Typography>
              <Button
                component="label"
                className="docreq-btn-ghost"
                startIcon={<CloudUploadRoundedIcon />}
                disabled={working || loading || !editable}
              >
                파일 추가
                <input
                  hidden
                  type="file"
                  multiple
                  disabled={working || loading || !editable}
                  onChange={chooseFiles}
                />
              </Button>
            </div>
            {existingFiles.map((file) => (
              <div key={file.id} className="docreq-file-row">
                <Button
                  href={suggestionFileUrl(requestId, file.id)}
                  sx={{ minWidth: 0, overflowWrap: "anywhere", textAlign: "left", justifyContent: "flex-start" }}
                >
                  {file.original_filename}
                </Button>
                <Button
                  color="error"
                  disabled={working || loading || !editable}
                  onClick={() => setExistingFiles((current) => current.filter((item) => item.id !== file.id))}
                >
                  제거
                </Button>
              </div>
            ))}
            {files.map((file, index) => (
              <div key={`${file.name}-${index}`} className="docreq-file-row">
                <Typography variant="body2" fontWeight={700} sx={{ minWidth: 0, overflowWrap: "anywhere" }}>
                  {file.name}
                </Typography>
                <Button
                  color="error"
                  disabled={working || loading || !editable}
                  onClick={() => setFiles((current) => current.filter((_, i) => i !== index))}
                >
                  제거
                </Button>
              </div>
            ))}
          </section>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} justifyContent="flex-end">
            <Button
              className="docreq-btn-ghost"
              disabled={working}
              onClick={() => navigate("/document-suggestions")}
            >
              건의 내역으로
            </Button>
            <Button
              type="submit"
              className="docreq-btn-primary"
              disabled={working || loading || !editable || !title.trim() || !content.trim()}
            >
              {working ? "저장 중…" : editing ? "수정 저장" : "보고서 개선 건의 접수"}
            </Button>
          </Stack>
        </Stack>
      </Box>

      <Dialog
        open={picker}
        onClose={() => setPicker(false)}
        fullWidth
        maxWidth="md"
        slotProps={{ paper: { className: "docreq-dialog" } }}
      >
        <div className="docreq-dialog-header">
          <div className="docreq-dialog-header-main">
            <span className="docreq-dialog-header-icon">
              <DescriptionRoundedIcon />
            </span>
            <div>
              <DialogTitle>내 생성 보고서 선택</DialogTitle>
              <small>완료된 생성 보고서를 선택해 건의에 첨부할 수 있습니다</small>
            </div>
          </div>
          <IconButton aria-label="닫기" onClick={() => setPicker(false)}>
            <CloseRoundedIcon />
          </IconButton>
        </div>
        <DialogContent>
          <Stack spacing={1.25}>
            {pickerError && <Alert severity="error">{pickerError}</Alert>}
            {!documents && !pickerError && (
              <Stack spacing={1}>
                <Skeleton variant="rounded" height={80} sx={{ borderRadius: 2.5 }} />
                <Skeleton variant="rounded" height={80} sx={{ borderRadius: 2.5 }} />
              </Stack>
            )}
            {documents?.items
              .filter((item) => item.status === "COMPLETED")
              .map((item) => (
                <div
                  key={item.id}
                  className="docreq-card"
                  style={{
                    borderLeftColor: generation?.id === item.id ? "#6b38fb" : "#cbd5e1",
                  }}
                >
                  <div className="docreq-card-main">
                    <div className="docreq-card-badges">
                      {generation?.id === item.id && (
                        <Chip size="small" color="primary" label="선택됨" />
                      )}
                      <span className="docreq-kind-pill">{item.prompt_title}</span>
                    </div>
                    <h3 className="docreq-card-title">{item.title}</h3>
                    {item.summary && (
                      <Typography variant="body2" fontWeight={700} color="#5b21b6">
                        {item.summary}
                      </Typography>
                    )}
                    <div className="docreq-card-meta">
                      <span>{documentMetadata(item)}</span>
                    </div>
                  </div>
                  <div className="docreq-card-actions">
                    <Button
                      className="docreq-btn-ghost"
                      href={proposalFileUrl(item.id, "output")}
                      target="_blank"
                      rel="noopener noreferrer"
                      endIcon={<OpenInNewRoundedIcon />}
                    >
                      결과 보기
                    </Button>
                    <Button
                      className="docreq-btn-primary"
                      onClick={() => {
                        setGeneration(item);
                        setPicker(false);
                      }}
                    >
                      선택
                    </Button>
                  </div>
                </div>
              ))}
            {documents && !documents.items.some((item) => item.status === "COMPLETED") && (
              <div className="docreq-empty">
                <strong>이 페이지에 완료된 보고서가 없습니다.</strong>
              </div>
            )}
            {documents?.total_pages > 1 && (
              <Pagination
                sx={{ mt: 1, display: "flex", justifyContent: "center" }}
                page={page}
                count={documents.total_pages}
                onChange={(_, value) => setPage(value)}
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button className="docreq-btn-ghost" onClick={() => setPicker(false)}>
            닫기
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
