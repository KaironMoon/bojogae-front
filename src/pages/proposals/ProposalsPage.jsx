import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Pagination,
  Paper,
  Radio,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import FactCheckRoundedIcon from "@mui/icons-material/FactCheckRounded";
import FolderOpenRoundedIcon from "@mui/icons-material/FolderOpenRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import ReplayRoundedIcon from "@mui/icons-material/ReplayRounded";
import SearchOffRoundedIcon from "@mui/icons-material/SearchOffRounded";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import ZoomInRoundedIcon from "@mui/icons-material/ZoomInRounded";
import ZoomOutRoundedIcon from "@mui/icons-material/ZoomOutRounded";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  cancelProposal,
  createIdempotencyKey,
  createProposal,
  deleteProposal,
  getPromptOptions,
  getProposal,
  getProposals,
  proposalEventSource,
  proposalFileUrl,
  retryProposal,
} from "@/services/proposal-service";


const MAX_FILES = 5;
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ACTIVE = new Set(["QUEUED", "RUNNING", "CANCEL_REQUESTED"]);
const PREVIEW_WIDTH = 794;
const PREVIEW_HEIGHT = 1123;

const PROMPT_META = [
  {
    fit: 98,
    categories: ["3대 진단비", "면책기간 표기", "보장강조"],
    description: "핵심 보장과 가입 조건을 한눈에 보기 쉽게 카드형으로 정리하는 표준 템플릿입니다.",
  },
  {
    fit: 94,
    categories: ["보장 공백 비교", "가성비 갱신형"],
    description: "기존 보험과 신규 제안서의 보장 금액을 비교해 부족한 보장을 설득력 있게 전달합니다.",
  },
  {
    fit: 91,
    categories: ["간병 보장", "고객 설명형"],
    description: "간병과 장기요양 관련 핵심 담보를 고객이 이해하기 쉬운 문장으로 안내합니다.",
  },
  {
    fit: 88,
    categories: ["종합 분석", "상세 리포트"],
    description: "여러 보장 항목과 주요 조건을 빠짐없이 보여주는 상세 분석형 템플릿입니다.",
  },
];

const STATUS_LABELS = {
  QUEUED: "대기 중",
  RUNNING: "생성 중",
  CANCEL_REQUESTED: "취소 중",
  COMPLETED: "완료",
  FAILED: "실패",
  CANCELLED: "취소됨",
};

const WORKFLOW_STEPS = [
  {
    eyebrow: "Step 1",
    title: "1. 고객 제안서 PDF 업로드",
    description: "보험사 원본 PDF 첨부 및 분석",
    icon: CloudUploadRoundedIcon,
    color: "#2563eb",
    background: "#eff6ff",
    border: "#bfdbfe",
  },
  {
    eyebrow: "Step 2",
    title: "2. 카테고리 체크 & 프롬프트",
    description: "체크 항목 연동 추천 및 결과 미리보기",
    icon: FactCheckRoundedIcon,
    color: "#4f46e5",
    background: "#eef2ff",
    border: "#c7d2fe",
  },
  {
    eyebrow: "Step 3",
    title: "3. 제안서 캔버스 & 공유",
    description: "실시간 미리보기, 출력, 이미지 저장",
    icon: TaskAltRoundedIcon,
    color: "#059669",
    background: "#ecfdf5",
    border: "#a7f3d0",
  },
];

function formatBytes(value) {
  if (!value) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  return `${(value / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`;
}

function formatDate(value) {
  return value
    ? new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
    : "-";
}

function statusColor(status) {
  if (status === "COMPLETED") return "success";
  if (status === "FAILED") return "error";
  if (ACTIVE.has(status)) return "primary";
  return "default";
}

function isCompletedStatus(status) {
  return String(status || "").trim().toUpperCase() === "COMPLETED";
}

function ProposalsPage() {
  const [promptOptions, setPromptOptions] = useState([]);
  const [promptId, setPromptId] = useState("");
  const [title, setTitle] = useState("");
  const [titleTouched, setTitleTouched] = useState(false);
  const [files, setFiles] = useState([]);
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [activeId, setActiveId] = useState(null);
  const [progress, setProgress] = useState(null);
  const [detail, setDetail] = useState(null);
  const [previewItem, setPreviewItem] = useState(null);
  const [openedDocument, setOpenedDocument] = useState(null);
  const [previewZoom, setPreviewZoom] = useState(0.75);
  const submissionKey = useRef(null);

  const loadList = useCallback(async (targetPage = page) => {
    const result = await getProposals(targetPage, 10);
    setItems(result.items);
    setPage(result.page);
    setTotalPages(result.total_pages);
    const active = result.items.find((item) => ACTIVE.has(item.status));
    if (active) setActiveId((current) => current || active.id);
    return result;
  }, [page]);

  const loadDocumentIntoWorkspace = useCallback(async (item) => {
    const document = await getProposal(item.id);
    setPreviewItem({ id: item.id, title: document.title || item.title });
    setOpenedDocument(document);
    setPromptId(document.prompt_id || item.prompt_id || "");
    setTitle(document.title || item.title || "");
    setTitleTouched(true);
    setFiles([]);
    submissionKey.current = null;
  }, []);

  useEffect(() => {
    Promise.all([getPromptOptions(), getProposals(1, 10)])
      .then(([options, result]) => {
        setPromptOptions(options);
        setPromptId(options[0]?.id || "");
        setItems(result.items);
        setTotalPages(result.total_pages);
        const active = result.items.find((item) => ACTIVE.has(item.status));
        if (active) setActiveId(active.id);
      })
      .catch(() => setError("제안서 화면을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!activeId) return undefined;
    const source = proposalEventSource(activeId);
    const eventTypes = ["status", "uploading", "generating", "thought_summary", "completed", "failed", "cancelled"];
    const handler = async (event) => {
      const data = JSON.parse(event.data || "{}");
      setProgress({ type: event.type, ...data });
      if (["completed", "failed", "cancelled"].includes(event.type)) {
        source.close();
        const completedId = activeId;
        setActiveId(null);
        try {
          const result = await loadList(1);
          if (event.type === "completed") {
            const completed = result.items.find((item) => item.id === completedId);
            await loadDocumentIntoWorkspace(completed || { id: completedId, title: "생성된 제안서" });
          }
        } catch {
          setError("목록을 갱신하지 못했습니다.");
        }
      }
    };
    eventTypes.forEach((type) => source.addEventListener(type, handler));
    source.onerror = () => {
      setProgress((current) => current || { message: "상태를 다시 확인하고 있습니다." });
    };
    const poll = window.setInterval(() => {
      getProposal(activeId).then(async (job) => {
        if (!ACTIVE.has(job.status)) {
          setActiveId(null);
          source.close();
          const result = await loadList(1);
          if (job.status === "COMPLETED") {
            const completed = result.items.find((item) => item.id === job.id);
            await loadDocumentIntoWorkspace(completed || job);
          }
        }
      }).catch(() => {});
    }, 5000);
    return () => {
      source.close();
      window.clearInterval(poll);
    };
  }, [activeId, loadDocumentIntoWorkspace, loadList]);

  const acceptFiles = (selected) => {
    if (selected.length > MAX_FILES) {
      setError(`PDF는 최대 ${MAX_FILES}개까지 선택할 수 있습니다.`);
      return;
    }
    const invalid = selected.find(
      (file) => !file.name.toLowerCase().endsWith(".pdf") || file.size > MAX_FILE_BYTES,
    );
    if (invalid) {
      setError("PDF 파일만 가능하며 파일당 크기는 10MB 이하여야 합니다.");
      return;
    }
    setError("");
    const replacingOpenedDocument = Boolean(openedDocument);
    setOpenedDocument(null);
    setPreviewItem(null);
    setFiles(selected);
    if (selected[0] && (!titleTouched || replacingOpenedDocument)) {
      setTitle(selected[0].name.replace(/\.pdf$/i, ""));
      setTitleTouched(false);
    }
    submissionKey.current = null;
  };

  const chooseFiles = (event) => {
    const selected = Array.from(event.target.files || []);
    event.target.value = "";
    acceptFiles(selected);
  };

  const submit = async () => {
    if (!promptId || !title.trim() || files.length === 0) {
      setError("프롬프트, 제안서 제목, PDF 파일을 모두 입력해 주세요.");
      return;
    }
    setWorking(true);
    setError("");
    try {
      submissionKey.current ||= createIdempotencyKey();
      const job = await createProposal({
        title: title.trim(),
        promptId,
        files,
        idempotencyKey: submissionKey.current,
      });
      submissionKey.current = null;
      setActiveId(job.id);
      setProgress({ message: "작업이 대기열에 등록되었습니다.", status: job.status });
      setFiles([]);
      setOpenedDocument(null);
      setTitle("");
      setTitleTouched(false);
      await loadList(1);
    } catch (requestError) {
      const detailCode = requestError.response?.data?.detail;
      setError(
        detailCode === "active_job_limit_exceeded"
          ? "동시에 진행할 수 있는 작업 수를 초과했습니다."
          : "제안서 생성 작업을 등록하지 못했습니다.",
      );
    } finally {
      setWorking(false);
    }
  };

  const runAction = async (action, item) => {
    setError("");
    try {
      if (action === "cancel") {
        if (!window.confirm("생성을 취소해도 이미 처리된 비용은 환불되지 않습니다. 취소할까요?")) return;
        await cancelProposal(item.id);
      } else if (action === "retry") {
        const job = await retryProposal(item.id);
        setActiveId(job.id);
      } else if (action === "delete") {
        if (!window.confirm("이 제안서를 목록에서 삭제할까요?")) return;
        await deleteProposal(item.id);
        if (previewItem?.id === item.id) {
          setPreviewItem(null);
          setOpenedDocument(null);
          setTitle("");
          setTitleTouched(false);
        }
      }
      await loadList(page);
    } catch {
      setError("요청을 처리하지 못했습니다.");
    }
  };

  const showFiles = async (item) => {
    try {
      setDetail(await getProposal(item.id));
    } catch {
      setError("파일 정보를 불러오지 못했습니다.");
    }
  };

  const openPreview = async (item) => {
    setError("");
    try {
      await loadDocumentIntoWorkspace(item);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("선택한 제안서 정보를 불러오지 못했습니다.");
    }
  };

  const changeZoom = (amount) => {
    setPreviewZoom((current) => Math.min(1.25, Math.max(0.5, Number((current + amount).toFixed(2)))));
  };

  const resetWorkspace = () => {
    setPreviewItem(null);
    setOpenedDocument(null);
    setFiles([]);
    setTitle("");
    setTitleTouched(false);
    setProgress(null);
    setError("");
    setPromptId(promptOptions[0]?.id || "");
    submissionKey.current = null;
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) {
    return <Box sx={{ py: 12, display: "grid", placeItems: "center" }}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3, lg: 4 }, width: "100%", boxSizing: "border-box" }}>
      <Box sx={{ mb: 2.5 }}>
        <Typography variant="h4" sx={{ fontWeight: 850, letterSpacing: "-0.04em" }}>제안서 만들기</Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          고객의 원본 보험설계서 PDF를 분석하고 원하는 카테고리를 다중 체크하여, 최적의 추천 프롬프트로 제안서를 자동 생성합니다.
        </Typography>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 2, mb: 2 }}>
        {WORKFLOW_STEPS.map(({ eyebrow, title: stepTitle, description, icon: StepIcon, color, background, border }) => (
          <Paper
            key={eyebrow}
            variant="outlined"
            sx={{ p: 2, borderRadius: "12px", display: "flex", alignItems: "center", gap: 1.75, boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)" }}
          >
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: "12px",
                display: "grid",
                placeItems: "center",
                color,
                bgcolor: background,
                border: `1px solid ${border}`,
                flexShrink: 0,
              }}
            >
              <StepIcon />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="caption" sx={{ color, fontWeight: 850, textTransform: "uppercase" }}>{eyebrow}</Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#0f172a" }}>{stepTitle}</Typography>
              <Typography variant="caption" color="text.secondary">{description}</Typography>
            </Box>
          </Paper>
        ))}
      </Box>

      <Alert
        severity="info"
        action={<Chip label="스마트 매칭" size="small" color="info" sx={{ fontWeight: 750 }} />}
        sx={{ mb: 2, border: "1px solid #bae6fd", bgcolor: "#f0f9ff", alignItems: "center" }}
      >
        카테고리를 체크하시면 우측에 연관 추천 프롬프트가 실시간으로 재구성되며, [결과 미리보기]로 슬라이드를 확인할 수 있습니다.
      </Alert>

      {error && <Alert severity="error" onClose={() => setError("")} sx={{ mb: 2 }}>{error}</Alert>}
      {progress && (
        <Alert severity={progress.type === "failed" ? "error" : "info"} sx={{ mb: 2 }}>
          {progress.message || progress.status || "생성 중입니다."}
        </Alert>
      )}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", xl: "repeat(12, minmax(0, 1fr))" },
          gap: 3,
          alignItems: "stretch",
        }}
      >
        <Paper
          variant="outlined"
          sx={{ gridColumn: { xl: "span 3" }, borderRadius: "16px", height: { xs: 280, xl: 900 }, overflow: "hidden", boxShadow: "0 1px 3px rgba(15, 23, 42, 0.05)" }}
        >
          <Box sx={{ px: 2, py: 1.75, borderBottom: 1, borderColor: "divider" }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Stack direction="row" spacing={1} alignItems="center">
                <FolderOpenRoundedIcon color="primary" fontSize="small" />
                <Typography variant="subtitle2" fontWeight={800}>보험 카테고리</Typography>
              </Stack>
              <Chip label="준비 중" size="small" variant="outlined" />
            </Stack>
          </Box>
          <Box sx={{ p: 2, height: "calc(100% - 58px)", display: "grid", placeItems: "center" }}>
            <Stack alignItems="center" spacing={1.25} sx={{ color: "text.secondary", textAlign: "center", maxWidth: 220 }}>
              <Box sx={{ width: 56, height: 56, borderRadius: "50%", bgcolor: "action.hover", display: "grid", placeItems: "center" }}>
                <SearchOffRoundedIcon />
              </Box>
              <Typography variant="subtitle2" fontWeight={750}>카테고리 정보가 아직 없습니다</Typography>
              <Typography variant="caption">카테고리 데이터가 준비되면 이 영역에서 보험 항목을 선택할 수 있습니다.</Typography>
            </Stack>
          </Box>
        </Paper>

        <Stack spacing={2} sx={{ gridColumn: { xl: "span 4" }, minWidth: 0, height: { xl: 900 } }}>
          <Paper variant="outlined" sx={{ p: 2.25, borderRadius: "16px", boxShadow: "0 1px 3px rgba(15, 23, 42, 0.05)" }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
              <CloudUploadRoundedIcon color="primary" fontSize="small" />
              <Typography variant="subtitle2" fontWeight={800}>PDF 제안서 첨부 및 자동 분석</Typography>
            </Stack>
            <Paper
              component="label"
              variant="outlined"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                acceptFiles(Array.from(event.dataTransfer.files || []));
              }}
              sx={{
                p: 2,
                borderRadius: "12px",
                borderStyle: "dashed",
                borderWidth: 2,
                bgcolor: "#f8faff",
                cursor: "pointer",
                textAlign: "center",
                display: "block",
                "&:hover": { borderColor: "primary.main", bgcolor: "primary.light" },
              }}
            >
              <CloudUploadRoundedIcon color="primary" />
              <Typography variant="body2" fontWeight={750}>PDF 선택 또는 파일 드래그</Typography>
              <Typography variant="caption" color="text.secondary">최대 5개 · 파일당 10MB</Typography>
              <input hidden type="file" accept="application/pdf,.pdf" multiple onChange={chooseFiles} />
            </Paper>
            <Stack spacing={0.75} sx={{ mt: 1.25 }}>
              {openedDocument?.files?.map((file) => (
                <Stack
                  key={file.id}
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ px: 1.25, py: 0.9, borderRadius: "8px", bgcolor: "#f1f5f9" }}
                >
                  <Stack direction="row" alignItems="center" spacing={0.8} sx={{ minWidth: 0 }}>
                    <Chip label="PDF" size="small" sx={{ height: 20, bgcolor: "#fee2e2", color: "#b91c1c", fontSize: 10, fontWeight: 800 }} />
                    <Typography variant="caption" noWrap>{file.original_filename}</Typography>
                  </Stack>
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 1, whiteSpace: "nowrap" }}>
                    {formatBytes(file.size_bytes)}
                  </Typography>
                </Stack>
              ))}
              {files.map((file, index) => (
                <Stack
                  key={`${file.name}-${file.lastModified}`}
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ px: 1.25, py: 0.75, borderRadius: 1.5, bgcolor: "action.hover" }}
                >
                  <Typography variant="caption" noWrap sx={{ minWidth: 0, mr: 1 }}>
                    <b>PDF</b> {file.name} · {formatBytes(file.size)}
                  </Typography>
                  <Button size="small" color="error" onClick={() => setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))}>제거</Button>
                </Stack>
              ))}
            </Stack>
            <TextField
              fullWidth
              size="small"
              label="제안서 제목"
              value={title}
              disabled={Boolean(openedDocument) && files.length === 0}
              inputProps={{ maxLength: 300 }}
              onChange={(event) => {
                setTitle(event.target.value);
                setTitleTouched(true);
                submissionKey.current = null;
              }}
              sx={{ mt: 1.5 }}
            />
          </Paper>

          <Paper
            variant="outlined"
            sx={{ p: 2, borderRadius: "16px", minHeight: { xs: 440, xl: 0 }, flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 1px 3px rgba(15, 23, 42, 0.05)" }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ pb: 1.25, borderBottom: 1, borderColor: "divider" }}>
              <Box>
                <Stack direction="row" spacing={0.75} alignItems="center">
                  <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#10b981" }} />
                  <Typography variant="subtitle2" fontWeight={800}>추천 프롬프트</Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary">사용 가능한 프롬프트 전체 목록입니다.</Typography>
              </Box>
              <Chip label={`${promptOptions.length}개`} size="small" color="primary" variant="outlined" />
            </Stack>

            <Stack spacing={1.1} sx={{ py: 1.25, pr: 0.5, flex: 1, minHeight: 0, overflowY: "auto" }}>
              {promptOptions.map((option, index) => {
                const meta = PROMPT_META[index % PROMPT_META.length];
                const selected = promptId === option.id;
                return (
                  <Paper
                    key={option.id}
                    variant="outlined"
                    onClick={() => {
                      setPromptId(option.id);
                      submissionKey.current = null;
                    }}
                    sx={{
                      p: 1.4,
                      borderRadius: "12px",
                      borderWidth: selected ? 2 : 1,
                      borderColor: selected ? "primary.main" : "divider",
                      bgcolor: selected ? "#f5f8ff" : "background.paper",
                      cursor: "pointer",
                    }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
                        <Stack direction="row" alignItems="center" gap={0.75} sx={{ minWidth: 0 }}>
                          <Chip
                            label={`${index + 1}순위`}
                            size="small"
                            color={selected ? "primary" : "default"}
                            sx={{ height: 22, fontSize: 10, fontWeight: 850, borderRadius: "5px" }}
                          />
                          <Typography variant="body2" fontWeight={800} noWrap>
                            {option.title} <Typography component="span" variant="caption" color="text.secondary">v{option.current_version_no}</Typography>
                          </Typography>
                        </Stack>
                        <Radio checked={selected} size="small" sx={{ p: 0.1 }} />
                      </Stack>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.8, lineHeight: 1.45 }}>
                        {meta.description}
                      </Typography>
                      <Stack direction="row" alignItems="center" gap={0.6} flexWrap="wrap" sx={{ mt: 1 }}>
                        <Chip label={`적합도 ${meta.fit}%`} size="small" color="primary" variant="outlined" />
                        {meta.categories.map((category) => <Chip key={category} label={category} size="small" />)}
                        <Button
                          type="button"
                          size="small"
                          variant="outlined"
                          startIcon={<VisibilityOutlinedIcon />}
                          onClick={(event) => event.stopPropagation()}
                          sx={{ ml: "auto", borderRadius: "8px" }}
                        >
                          결과 미리보기
                        </Button>
                      </Stack>
                    </Box>
                  </Paper>
                );
              })}
              {!promptOptions.length && <Alert severity="info">사용 가능한 프롬프트가 없습니다.</Alert>}
            </Stack>

            <Button
              variant="contained"
              size="large"
              onClick={submit}
              disabled={working || !promptOptions.length}
              startIcon={working ? <CircularProgress size={18} color="inherit" /> : <DescriptionRoundedIcon />}
              sx={{ mt: 1, py: 1.25, fontWeight: 800, borderRadius: "12px" }}
            >
              {working ? "등록 중..." : "선택 프롬프트로 제안서 생성"}
            </Button>
          </Paper>
        </Stack>

        <Paper
          variant="outlined"
          sx={{ gridColumn: { xl: "span 5" }, borderRadius: "16px", height: { xs: 720, xl: 900 }, overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 1px 3px rgba(15, 23, 42, 0.05)" }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            gap={1}
            sx={{ px: 2, py: 1.25, borderBottom: 1, borderColor: "divider", minHeight: 58 }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle2" fontWeight={800}>제안서 캔버스</Typography>
              <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>
                {previewItem?.title || "생성된 HTML 제안서를 표시합니다"}
              </Typography>
            </Box>
            <Stack direction="row" alignItems="center" spacing={0.25}>
              <Tooltip title="축소"><IconButton size="small" onClick={() => changeZoom(-0.1)}><ZoomOutRoundedIcon fontSize="small" /></IconButton></Tooltip>
              <Typography variant="caption" sx={{ minWidth: 42, textAlign: "center", fontFamily: "monospace" }}>{Math.round(previewZoom * 100)}%</Typography>
              <Tooltip title="확대"><IconButton size="small" onClick={() => changeZoom(0.1)}><ZoomInRoundedIcon fontSize="small" /></IconButton></Tooltip>
              {previewItem && (
                <Tooltip title="새 창에서 열기">
                  <IconButton
                    size="small"
                    onClick={() => window.open(proposalFileUrl(previewItem.id, "output"), "_blank", "noopener,noreferrer")}
                  >
                    <OpenInNewRoundedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>
          </Stack>
          <Box sx={{ flex: 1, minHeight: 0, overflow: "hidden", bgcolor: "#e8edf5", p: { xs: 1.5, md: 2.5 } }}>
            {previewItem ? (
              <Box
                sx={{
                  width: `min(100%, ${PREVIEW_WIDTH * previewZoom}px)`,
                  height: `min(100%, ${PREVIEW_HEIGHT * previewZoom}px)`,
                  mx: "auto",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <Box
                  component="iframe"
                  key={previewItem.id}
                  title={`${previewItem.title} 미리보기`}
                  src={proposalFileUrl(previewItem.id, "output")}
                  sandbox=""
                  referrerPolicy="no-referrer"
                  sx={{
                    position: "absolute",
                    inset: 0,
                    width: `${100 / previewZoom}%`,
                    height: `${100 / previewZoom}%`,
                    border: 0,
                    bgcolor: "white",
                    boxShadow: "0 12px 30px rgba(15, 23, 42, 0.16)",
                    transform: `scale(${previewZoom})`,
                    transformOrigin: "top left",
                  }}
                />
              </Box>
            ) : (
              <Box sx={{ height: "100%", minHeight: 560, display: "grid", placeItems: "center" }}>
                <Stack alignItems="center" spacing={1.25} sx={{ color: "text.secondary", textAlign: "center" }}>
                  <Box sx={{ width: 64, height: 64, borderRadius: 2, bgcolor: "white", display: "grid", placeItems: "center", boxShadow: 1 }}>
                    <DescriptionRoundedIcon color="primary" />
                  </Box>
                  <Typography variant="subtitle2" fontWeight={750}>표시할 제안서가 없습니다</Typography>
                  <Typography variant="caption">제안서 생성이 완료되면 이곳에서 HTML 결과를 확인할 수 있습니다.</Typography>
                </Stack>
              </Box>
            )}
          </Box>
        </Paper>
      </Box>

      <Paper variant="outlined" sx={{ p: { xs: 2, md: 2.5 }, borderRadius: "16px", mt: 3, boxShadow: "0 1px 3px rgba(15, 23, 42, 0.05)" }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Box>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>내 생성 문서</Typography>
              <Button size="small" variant="outlined" startIcon={<AddRoundedIcon />} onClick={resetWorkspace}>
                신규
              </Button>
            </Stack>
            <Typography variant="caption" color="text.secondary">최근 생성한 맞춤 제안서 보관함</Typography>
          </Box>
          <Button startIcon={<RefreshRoundedIcon />} onClick={() => loadList(page)}>새로고침</Button>
        </Stack>
        <Stack>
          {items.map((item) => (
            <Box
              key={item.id}
              role={isCompletedStatus(item.status) ? "button" : undefined}
              tabIndex={isCompletedStatus(item.status) ? 0 : undefined}
              onClick={() => {
                if (isCompletedStatus(item.status)) openPreview(item);
              }}
              onKeyDown={(event) => {
                if (isCompletedStatus(item.status) && (event.key === "Enter" || event.key === " ")) {
                  event.preventDefault();
                  openPreview(item);
                }
              }}
              sx={{
                px: 1,
                py: 1.5,
                borderTop: "1px solid #f1f5f9",
                borderRadius: "10px",
                cursor: isCompletedStatus(item.status) ? "pointer" : "default",
                bgcolor: previewItem?.id === item.id ? "#eff6ff" : "transparent",
                outline: previewItem?.id === item.id ? "2px solid #3b82f6" : "none",
                outlineOffset: "-2px",
                transition: "background-color 150ms ease, outline-color 150ms ease",
                "&:hover": { bgcolor: isCompletedStatus(item.status) ? "#f8fafc" : "transparent" },
                "&:focus-visible": { outline: "2px solid #2563eb", outlineOffset: "-2px" },
              }}
            >
              <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={1.5}>
                <Box sx={{ minWidth: 0 }}>
                  <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{item.title}</Typography>
                    <Chip size="small" color={statusColor(item.status)} label={STATUS_LABELS[item.status] || item.status} />
                    {previewItem?.id === item.id && (
                      <Chip size="small" color="primary" variant="outlined" label="선택됨" sx={{ fontWeight: 750 }} />
                    )}
                  </Stack>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                    {item.prompt_title} v{item.prompt_version_no} · PDF {item.input_file_count}개 ({formatBytes(item.total_input_bytes)}) · {formatDate(item.created_at)}
                  </Typography>
                  {item.error_message && <Typography color="error" variant="caption">{item.error_message}</Typography>}
                </Box>
                <Stack
                  direction="row"
                  alignItems="center"
                  gap={0.5}
                  flexWrap="wrap"
                  onClick={(event) => event.stopPropagation()}
                  onKeyDown={(event) => event.stopPropagation()}
                >
                  <Button size="small" onClick={() => showFiles(item)}>파일</Button>
                  <Button
                    size="small"
                    variant={isCompletedStatus(item.status) ? "contained" : "outlined"}
                    startIcon={<VisibilityOutlinedIcon />}
                    disabled={!isCompletedStatus(item.status)}
                    onClick={() => openPreview(item)}
                  >
                    열기
                  </Button>
                  {ACTIVE.has(item.status) && <Button size="small" color="warning" startIcon={<CancelOutlinedIcon />} onClick={() => runAction("cancel", item)}>취소</Button>}
                  {item.status === "FAILED" && item.retryable && <Button size="small" startIcon={<ReplayRoundedIcon />} onClick={() => runAction("retry", item)}>재시도</Button>}
                  {!ACTIVE.has(item.status) && <Button size="small" color="error" startIcon={<DeleteOutlineRoundedIcon />} onClick={() => runAction("delete", item)}>삭제</Button>}
                </Stack>
              </Stack>
            </Box>
          ))}
          {!items.length && <Typography color="text.secondary">생성한 제안서가 없습니다.</Typography>}
        </Stack>
        {totalPages > 1 && <Pagination count={totalPages} page={page} onChange={(_, value) => loadList(value)} sx={{ mt: 3 }} />}
      </Paper>

      <Dialog open={Boolean(detail)} onClose={() => setDetail(null)} fullWidth maxWidth="sm">
        <DialogTitle>{detail?.title}</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ mt: 1 }}>
            {detail?.files.map((file) => (
              <Paper key={file.id} variant="outlined" sx={{ p: 1.5 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography noWrap>{file.original_filename}</Typography>
                    <Typography variant="caption" color="text.secondary">{formatBytes(file.size_bytes)}</Typography>
                  </Box>
                  <Stack direction="row">
                    <Button size="small" onClick={() => window.open(proposalFileUrl(detail.id, "input", { fileId: file.id }), "_blank", "noopener,noreferrer")}>열기</Button>
                    <Button size="small" href={proposalFileUrl(detail.id, "input", { fileId: file.id, download: true })}>다운로드</Button>
                  </Stack>
                </Stack>
              </Paper>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions><Button onClick={() => setDetail(null)}>닫기</Button></DialogActions>
      </Dialog>
    </Box>
  );
}

export default ProposalsPage;
