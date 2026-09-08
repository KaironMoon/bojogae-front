import PromptInputForm from "@/pages/components/PromptInputForm";
import { acceptsFile, fileTypeLabel, missingInputGroup } from "@/services/prompt-input-utils";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Drawer,
  FormControlLabel,
  IconButton,
  Pagination,
  Paper,
  Radio,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import FactCheckRoundedIcon from "@mui/icons-material/FactCheckRounded";
import FolderOpenRoundedIcon from "@mui/icons-material/FolderOpenRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import ReplayRoundedIcon from "@mui/icons-material/ReplayRounded";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import ZoomInRoundedIcon from "@mui/icons-material/ZoomInRounded";
import ZoomOutRoundedIcon from "@mui/icons-material/ZoomOutRounded";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "@mui/material/styles";
import ExpiringPoints from "@/pages/components/ExpiringPoints";

import {
  cancelProposal,
  createIdempotencyKey,
  createProposal,
  deleteProposal,
  getPromptOptions,
  getPointBalance,
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
    description: "기존 보험과 신규 문서의 보장 금액을 비교해 부족한 보장을 설득력 있게 전달합니다.",
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
    title: "1. 고객 문서 PDF 업로드",
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
    title: "3. 문서 캔버스 & 공유",
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
  const theme = useTheme();
  const mobilePreview = useMediaQuery(theme.breakpoints.down("sm"));
  const [promptOptions, setPromptOptions] = useState([]);
  const [pointBalance, setPointBalance] = useState({ free_points: 0, paid_points: 0, total_points: 0 });
  const [promptId, setPromptId] = useState("");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [title, setTitle] = useState("");
  const [titleTouched, setTitleTouched] = useState(false);
  const [files, setFiles] = useState([]);
  const [inputValues, setInputValues] = useState({});
  const [fieldUploads, setFieldUploads] = useState({});
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
  const [canvasOpen, setCanvasOpen] = useState(false);
  const [openedDocument, setOpenedDocument] = useState(null);
  const [previewZoom, setPreviewZoom] = useState(0.75);
  const submissionKey = useRef(null);

  const categoryGroups = useMemo(() => {
    const groups = new Map();
    promptOptions.forEach((option) => {
      (option.categories || []).forEach((category) => {
        if (!groups.has(category.parent_id)) {
          groups.set(category.parent_id, {
            id: category.parent_id,
            name: category.parent_name,
            children: new Map(),
          });
        }
        groups.get(category.parent_id).children.set(category.id, category);
      });
    });
    return Array.from(groups.values()).map((group) => ({
      ...group,
      children: Array.from(group.children.values()),
    }));
  }, [promptOptions]);

  const filteredPromptOptions = useMemo(() => {
    if (!selectedCategoryIds.length) return promptOptions;
    const selected = new Set(selectedCategoryIds);
    return promptOptions.filter((option) => (
      (option.categories || []).some((category) => selected.has(category.id))
    ));
  }, [promptOptions, selectedCategoryIds]);

  const selectedPrompt = promptOptions.find((option) => option.id === promptId);
  const inputSchema = selectedPrompt?.input_schema || [];
  const customInputs = inputSchema.length > 0;

  useEffect(() => {
    setInputValues({});
    setFieldUploads({});
    submissionKey.current = null;
  }, [promptId, selectedPrompt?.current_version_id]);

  const selectedPointCost = useMemo(
    () => promptOptions.find((option) => option.id === promptId)?.point_cost || 0,
    [promptId, promptOptions],
  );

  useEffect(() => {
    if (!filteredPromptOptions.some((option) => option.id === promptId)) {
      setPromptId(filteredPromptOptions[0]?.id || "");
      submissionKey.current = null;
    }
  }, [filteredPromptOptions, promptId]);

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
    setCanvasOpen(true);
    setOpenedDocument(document);
    setPromptId(document.prompt_id || item.prompt_id || "");
    setTitle(document.title || item.title || "");
    setTitleTouched(true);
    setFiles([]);
    setInputValues({});
    setFieldUploads({});
    submissionKey.current = null;
  }, []);

  useEffect(() => {
    Promise.all([getPromptOptions(), getProposals(1, 10), getPointBalance()])
      .then(([options, result, balance]) => {
        setPromptOptions(options);
        setPromptId(options[0]?.id || "");
        setItems(result.items);
        setTotalPages(result.total_pages);
        setPointBalance(balance);
        const active = result.items.find((item) => ACTIVE.has(item.status));
        if (active) setActiveId(active.id);
      })
      .catch(() => setError("문서 화면을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setPreviewZoom(mobilePreview ? 0.4 : 0.75);
  }, [mobilePreview]);

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
          setPointBalance(await getPointBalance());
          if (event.type === "completed") {
            const completed = result.items.find((item) => item.id === completedId);
            await loadDocumentIntoWorkspace(completed || { id: completedId, title: "생성된 문서" });
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
    const groupError = missingInputGroup(inputSchema, inputValues, fieldUploads);
    if (groupError) { setError(groupError); return; }
    const selectedFiles = customInputs ? inputSchema.flatMap((field) => fieldUploads[field.key] || []) : files;
    const fileFields = customInputs ? inputSchema.flatMap((field) => (fieldUploads[field.key] || []).map(() => field.key)) : [];
    const values = {};
    for (const field of inputSchema) {
      if (field.type === "file") {
        const count = (fieldUploads[field.key] || []).length;
        if ((field.required && !count) || count > field.max_files) {
          setError(`${field.label}: ${fileTypeLabel(field)} 파일을 ${field.required ? "1" : "0"}~${field.max_files}개 선택해 주세요.`);
          return;
        }
      } else {
        const value = inputValues[field.key] ?? "";
        if (field.required && !String(value).trim()) {
          setError(`${field.label} 항목을 입력해 주세요.`);
          return;
        }
        if (value !== "") {
          values[field.key] = field.type === "number" ? Number(value) : value;
          if (field.type === "number" && !Number.isFinite(values[field.key])) {
            setError(`${field.label}: 올바른 숫자를 입력해 주세요.`);
            return;
          }
        }
      }
    }
    if (selectedFiles.length > MAX_FILES) {
      setError("전체 파일은 최대 5개까지 첨부할 수 있습니다.");
      return;
    }
    if (!promptId || !title.trim() || (!customInputs && selectedFiles.length === 0)) {
      setError("프롬프트, 문서 제목, PDF 파일을 모두 입력해 주세요.");
      return;
    }
    setWorking(true);
    setError("");
    try {
      submissionKey.current ||= createIdempotencyKey();
      const job = await createProposal({
        title: title.trim(),
        promptId,
        files: selectedFiles,
        inputValues: values,
        fileFields,
        promptVersionId: selectedPrompt.current_version_id,
        idempotencyKey: submissionKey.current,
      });
      submissionKey.current = null;
      setActiveId(job.id);
      setProgress({ message: "작업이 대기열에 등록되었습니다.", status: job.status });
      setFiles([]);
      setInputValues({});
      setFieldUploads({});
      setOpenedDocument(null);
      setTitle("");
      setTitleTouched(false);
      await Promise.all([loadList(1), getPointBalance().then(setPointBalance)]);
    } catch (requestError) {
      const detailCode = requestError.response?.data?.detail;
      setError(
        detailCode === "active_job_limit_exceeded"
          ? "동시에 진행할 수 있는 작업 수를 초과했습니다."
          : detailCode === "insufficient_points"
            ? "포인트가 부족합니다. 잔액을 확인해 주세요."
          : detailCode === "prompt_version_changed"
            ? "프롬프트가 변경되었습니다. 페이지를 새로고침한 후 입력해 주세요."
          : ["invalid_input_values", "invalid_input_files", "required_input_missing", "required_input_group_missing", "invalid_input_file_type"].includes(detailCode)
            ? "입력 항목과 필수 자료, 파일 형식을 확인해 주세요."
          : ["invalid_html_document", "html_utf8_required", "html_text_too_large"].includes(detailCode)
            ? "본문이 있는 UTF-8 HTML 파일을 첨부해 주세요. HTML의 본문은 20만 자 이하여야 합니다."
          : "문서 생성 작업을 등록하지 못했습니다.",
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
        if (!window.confirm("이 문서를 목록에서 삭제할까요?")) return;
        await deleteProposal(item.id);
        if (previewItem?.id === item.id) {
          setPreviewItem(null);
          setOpenedDocument(null);
          setTitle("");
          setTitleTouched(false);
        }
      }
      await loadList(page);
      setPointBalance(await getPointBalance());
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
    } catch {
      setError("선택한 문서 정보를 불러오지 못했습니다.");
    }
  };

  const changeZoom = (amount) => {
    setPreviewZoom((current) => Math.min(1.25, Math.max(0.3, Number((current + amount).toFixed(2)))));
  };

  const resetWorkspace = () => {
    setPreviewItem(null);
    setCanvasOpen(false);
    setOpenedDocument(null);
    setFiles([]);
    setInputValues({});
    setFieldUploads({});
    setTitle("");
    setTitleTouched(false);
    setProgress(null);
    setError("");
    setPromptId(promptOptions[0]?.id || "");
    setSelectedCategoryIds([]);
    submissionKey.current = null;
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) {
    return <Box sx={{ py: 12, display: "grid", placeItems: "center" }}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2, md: 3, lg: 4 }, width: "100%", boxSizing: "border-box", overflowX: "hidden" }}>
      <Box sx={{ mb: 2.5 }}>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={1}>
          <Typography variant="h4" sx={{ fontSize: { xs: 26, sm: 30, md: 34 }, fontWeight: 850, letterSpacing: "-0.04em" }}>문서 만들기</Typography>
          <Stack direction="row" spacing={1}>
            <Chip label={`무료 ${pointBalance.free_points.toLocaleString()}P`} color="success" variant="outlined" />
            <Chip label={`유료 ${pointBalance.paid_points.toLocaleString()}P`} color="primary" variant="outlined" />
          </Stack>
        </Stack>
        <Typography color="text.secondary" sx={{ mt: 0.5, fontSize: { xs: 13, sm: 14 } }}>
          문서 유형을 선택하고 필요한 자료를 입력하면, 선택한 프롬프트로 문서를 생성합니다.
        </Typography>
      </Box>

      <Box sx={{ display: { xs: "none", md: "grid" }, gridTemplateColumns: "repeat(3, 1fr)", gap: 2, mb: 2 }}>
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
        sx={{
          mb: 2,
          border: "1px solid #bae6fd",
          bgcolor: "#f0f9ff",
          alignItems: "center",
          fontSize: { xs: 12, sm: 14 },
          "& .MuiAlert-action": { display: { xs: "none", sm: "flex" } },
        }}
      >
        카테고리를 체크하시면 입력폼 상단의 추천 프롬프트가 실시간으로 재구성되며, [결과 미리보기]로 슬라이드를 확인할 수 있습니다.
      </Alert>

      {error && <Alert severity="error" onClose={() => setError("")} sx={{ mb: 2 }}>{error}</Alert>}
      <ExpiringPoints balance={pointBalance} />
      {progress && (
        <Alert severity={progress.type === "failed" ? "error" : "info"} sx={{ mb: 2 }}>
          {progress.message || progress.status || "생성 중입니다."}
        </Alert>
      )}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "repeat(12, minmax(0, 1fr))" },
          gap: { xs: 2, md: 2.5, xl: 3 },
          alignItems: "stretch",
        }}
      >
        <Stack spacing={2} sx={{ gridColumn: { md: "span 5", xl: "span 3" }, minWidth: 0, alignSelf: "start" }}>
          <Paper
            variant="outlined"
            sx={{ borderRadius: "16px", height: { xs: 240, md: 280, xl: 320 }, flexShrink: 0, overflow: "hidden", boxShadow: "0 1px 3px rgba(15, 23, 42, 0.05)" }}
          >
            <Box sx={{ px: 2, py: 1.75, borderBottom: 1, borderColor: "divider" }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Stack direction="row" spacing={1} alignItems="center">
                  <FolderOpenRoundedIcon color="primary" fontSize="small" />
                  <Typography variant="subtitle2" fontWeight={800}>보험 카테고리</Typography>
                </Stack>
                <Chip label={`${selectedCategoryIds.length}개 선택`} size="small" variant="outlined" />
              </Stack>
            </Box>
            <Box sx={{ p: 1.5, height: "calc(100% - 58px)", overflowY: "auto" }}>
              <Button
                size="small"
                onClick={() => setSelectedCategoryIds([])}
                disabled={!selectedCategoryIds.length}
                sx={{ mb: 1 }}
              >
                전체 보기
              </Button>
              <Stack spacing={1.25}>
                {categoryGroups.map((group) => (
                  <Paper key={group.id} variant="outlined" sx={{ p: 1.25, borderRadius: "10px" }}>
                    <Typography variant="body2" fontWeight={800} sx={{ mb: 0.5 }}>{group.name}</Typography>
                    <Stack>
                      {group.children.map((child) => (
                        <FormControlLabel
                          key={child.id}
                          control={(
                            <Checkbox
                              size="small"
                              checked={selectedCategoryIds.includes(child.id)}
                              onChange={(event) => setSelectedCategoryIds((current) => (
                                event.target.checked
                                  ? [...current, child.id]
                                  : current.filter((id) => id !== child.id)
                              ))}
                            />
                          )}
                          label={child.name}
                          slotProps={{ typography: { variant: "body2" } }}
                          sx={{ my: -0.25 }}
                        />
                      ))}
                    </Stack>
                  </Paper>
                ))}
                {!categoryGroups.length && (
                  <Alert severity="info">등록된 프롬프트 카테고리가 없습니다.</Alert>
                )}
              </Stack>
            </Box>
          </Paper>


        </Stack>

        <Stack spacing={0} sx={{ gridColumn: { md: "span 7", xl: "span 9" }, minWidth: 0, alignSelf: "start" }}>
          <Paper
            variant="outlined"
            sx={{ p: 2, borderRadius: "16px", maxHeight: { xs: 380, md: 360 }, minHeight: 0, mb: 2, display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 1px 3px rgba(15, 23, 42, 0.05)" }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ pb: 1.25, borderBottom: 1, borderColor: "divider" }}>
              <Box>
                <Stack direction="row" spacing={0.75} alignItems="center">
                  <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#10b981" }} />
                  <Typography variant="subtitle2" fontWeight={800}>추천 프롬프트</Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  {selectedCategoryIds.length ? "선택한 카테고리의 프롬프트입니다." : "사용 가능한 프롬프트 전체 목록입니다."}
                </Typography>
              </Box>
              <Chip label={`${filteredPromptOptions.length}개`} size="small" color="primary" variant="outlined" />
            </Stack>

            <Stack spacing={1.1} sx={{ py: 1.25, pr: 0.5, flex: 1, minHeight: 0, overflowY: "auto" }}>
              {filteredPromptOptions.map((option, index) => {
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
                          <Typography variant="body2" fontWeight={800} sx={{ minWidth: 0, overflowWrap: "anywhere" }}>
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
                        <Chip label={`${option.point_cost.toLocaleString()}P`} size="small" color="warning" variant="outlined" />
                        {(option.categories || []).map((category) => (
                          <Chip key={category.id} label={`${category.parent_name} · ${category.name}`} size="small" />
                        ))}
                        {!option.categories?.length && <Chip label="미분류" size="small" />}
                        <Button
                          type="button"
                          size="small"
                          variant="outlined"
                          startIcon={<VisibilityOutlinedIcon />}
                          onClick={(event) => event.stopPropagation()}
                          sx={{ ml: { xs: 0, sm: "auto" }, borderRadius: "8px", minHeight: 36 }}
                        >
                          결과 미리보기
                        </Button>
                      </Stack>
                    </Box>
                  </Paper>
                );
              })}
              {!filteredPromptOptions.length && <Alert severity="info">조건에 맞는 프롬프트가 없습니다.</Alert>}
            </Stack>
          </Paper>
          <Paper variant="outlined" sx={{ p: 2.25, borderRadius: "16px 16px 0 0", boxShadow: "0 1px 3px rgba(15, 23, 42, 0.05)" }}>
            {customInputs ? <PromptInputForm fields={inputSchema} values={inputValues} uploads={fieldUploads} disabled={working}
              onValue={(key, value) => {
                setInputValues((current) => ({ ...current, [key]: value }));
                setOpenedDocument(null);
                submissionKey.current = null;
              }}
              onFiles={(key, selected) => {
                const field = inputSchema.find((item) => item.key === key);
                const total = Object.entries(fieldUploads).reduce((sum, [id, items]) => sum + (id === key ? 0 : items.length), selected.length);
                if (selected.length > field.max_files || total > MAX_FILES) {
                  setError("항목별 첨부 개수와 전체 파일 최대 5개 제한을 확인해 주세요.");
                  return;
                }
                if (selected.some((file) => !acceptsFile(field, file) || file.size > MAX_FILE_BYTES)) {
                  setError(`${fileTypeLabel(field)} 파일만 가능하며 파일당 크기는 10MB 이하여야 합니다.`);
                  return;
                }
                setError("");
                setFieldUploads((current) => ({ ...current, [key]: selected }));
                setOpenedDocument(null);
                submissionKey.current = null;
              }} /> : <>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
              <CloudUploadRoundedIcon color="primary" fontSize="small" />
              <Typography variant="subtitle2" fontWeight={800}>PDF 문서 첨부 및 자동 분석</Typography>
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
                p: { xs: 1.5, sm: 2 },
                borderRadius: "12px",
                borderStyle: "dashed",
                borderWidth: 2,
                bgcolor: "#f8faff",
                cursor: "pointer",
                textAlign: "center",
                display: "block",
                minHeight: { xs: 112, sm: 124 },
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
                  <Stack direction="row" alignItems="center" spacing={0.8} sx={{ minWidth: 0, flex: 1 }}>
                    <Chip label="PDF" size="small" sx={{ height: 20, bgcolor: "#fee2e2", color: "#b91c1c", fontSize: 10, fontWeight: 800 }} />
                    <Typography variant="caption" noWrap sx={{ minWidth: 0 }}>{file.original_filename}</Typography>
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
                  <Typography variant="caption" noWrap sx={{ minWidth: 0, mr: 1, flex: 1 }}>
                    <b>PDF</b> {file.name} · {formatBytes(file.size)}
                  </Typography>
                  <Button size="small" color="error" onClick={() => { setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index)); submissionKey.current = null; }}>제거</Button>
                </Stack>
              ))}
            </Stack>
            </>}
            <TextField
              fullWidth
              size="small"
              label="문서 제목"
              value={title}
              disabled={working}
              inputProps={{ maxLength: 300 }}
              onChange={(event) => {
                setTitle(event.target.value);
                setTitleTouched(true);
                submissionKey.current = null;
              }}
              sx={{ mt: 1.5 }}
            />
          </Paper>

          <Button
            variant="contained"
            size="large"
            onClick={submit}
            disabled={working || !filteredPromptOptions.length || pointBalance.total_points < selectedPointCost}
            startIcon={working ? <CircularProgress size={18} color="inherit" /> : <DescriptionRoundedIcon />}
            sx={{ flexShrink: 0, py: 1.25, fontWeight: 800, borderRadius: "0 0 12px 12px" }}
          >
            {working
              ? "등록 중..."
              : pointBalance.total_points < selectedPointCost
                ? `포인트 부족 (${selectedPointCost.toLocaleString()}P 필요)`
                : `문서 생성 · ${selectedPointCost.toLocaleString()}P`}
          </Button>
        </Stack>

      </Box>

      {!canvasOpen && (
        <Button
          variant="contained"
          aria-label="문서 캔버스 열기"
          aria-expanded={canvasOpen}
          aria-controls="document-canvas-panel"
          onClick={() => setCanvasOpen(true)}
          sx={{ position: "fixed", right: 0, top: "50%", transform: "translateY(-50%)", zIndex: (theme) => theme.zIndex.drawer - 1, writingMode: "vertical-rl", minWidth: 40, px: 1, py: 2, borderRadius: "12px 0 0 12px", letterSpacing: 2 }}
        >
          캔버스
        </Button>
      )}
      <Drawer
        anchor="right"
        open={canvasOpen}
        onClose={() => setCanvasOpen(false)}
        PaperProps={{
          id: "document-canvas-panel", role: "dialog", "aria-modal": true,
          "aria-labelledby": "document-canvas-title",
          sx: { width: { xs: "100%", sm: "min(760px, 70vw)", lg: "min(900px, 60vw)" }, height: "100dvh", overflow: "hidden" },
        }}
      >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "stretch", sm: "center" }}
            gap={1}
            sx={{ px: { xs: 1.5, sm: 2 }, py: 1.25, borderBottom: 1, borderColor: "divider", minHeight: { xs: 90, sm: 58 } }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography id="document-canvas-title" variant="subtitle2" fontWeight={800}>문서 캔버스</Typography>
              <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>
                {previewItem?.title || "생성된 HTML 문서를 표시합니다"}
              </Typography>
            </Box>
            <Stack direction="row" alignItems="center" justifyContent="flex-end" spacing={0.25}>
              <Tooltip title="축소"><IconButton size="small" onClick={() => changeZoom(-0.1)}><ZoomOutRoundedIcon fontSize="small" /></IconButton></Tooltip>
              <Typography variant="caption" sx={{ minWidth: 42, textAlign: "center", fontFamily: "monospace" }}>{Math.round(previewZoom * 100)}%</Typography>
              <Tooltip title="확대"><IconButton size="small" onClick={() => changeZoom(0.1)}><ZoomInRoundedIcon fontSize="small" /></IconButton></Tooltip>
              {previewItem && (
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<OpenInNewRoundedIcon fontSize="small" />}
                  onClick={() => window.open(proposalFileUrl(previewItem.id, "output"), "_blank", "noopener,noreferrer")}
                  sx={{ minHeight: 36, ml: 0.5 }}
                >
                  전체보기
                </Button>
              )}
              <Tooltip title="캔버스 접기"><IconButton aria-label="캔버스 접기" onClick={() => setCanvasOpen(false)}><CloseRoundedIcon /></IconButton></Tooltip>
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
              <Box sx={{ height: "100%", display: "grid", placeItems: "center" }}>
                <Stack alignItems="center" spacing={1.25} sx={{ color: "text.secondary", textAlign: "center" }}>
                  <Box sx={{ width: 64, height: 64, borderRadius: 2, bgcolor: "white", display: "grid", placeItems: "center", boxShadow: 1 }}>
                    <DescriptionRoundedIcon color="primary" />
                  </Box>
                  <Typography variant="subtitle2" fontWeight={750}>표시할 문서가 없습니다</Typography>
                  <Typography variant="caption">문서 생성이 완료되면 이곳에서 HTML 결과를 확인할 수 있습니다.</Typography>
                </Stack>
              </Box>
            )}
          </Box>
      </Drawer>

      <Paper variant="outlined" sx={{ p: { xs: 2, md: 2.5 }, borderRadius: "16px", mt: 3, boxShadow: "0 1px 3px rgba(15, 23, 42, 0.05)" }}>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }} gap={1.5} sx={{ mb: 2 }}>
          <Box>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>내 생성 문서</Typography>
              <Button size="small" variant="outlined" startIcon={<AddRoundedIcon />} onClick={resetWorkspace}>
                신규
              </Button>
            </Stack>
            <Typography variant="caption" color="text.secondary">최근 생성한 맞춤 문서 보관함</Typography>
          </Box>
          <Button startIcon={<RefreshRoundedIcon />} onClick={() => loadList(page)} sx={{ alignSelf: { xs: "flex-start", sm: "center" } }}>새로고침</Button>
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
                  justifyContent={{ xs: "flex-end", md: "flex-start" }}
                  gap={0.5}
                  flexWrap="wrap"
                  sx={{ width: { xs: "100%", md: "auto" } }}
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
          {!items.length && <Typography color="text.secondary">생성한 문서가 없습니다.</Typography>}
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
