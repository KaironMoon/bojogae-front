import ReportShellPanel from "./ReportShellPanel";
import PreviewImageEditor from "./PreviewImageEditor";
import InputSchemaEditor from "./InputSchemaEditor";
import CommonPromptsPanel from "./CommonPromptsPanel";
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
  DialogContentText,
  DialogTitle,
  Divider,
  Drawer,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import FolderOpenRoundedIcon from "@mui/icons-material/FolderOpenRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import RestoreRoundedIcon from "@mui/icons-material/RestoreRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useBlocker } from "react-router-dom";

import {
  commonPromptError,
  getCommonPrompts,
  createPrompt,
  uploadPromptPreviewImage,
  deletePrompt,
  deletePromptVersion,
  getPrompt,
  getPromptCategories,
  getPrompts,
  getPromptVersions,
  getSimpleFeatureState,
  recoverPrompt,
  recoverPromptVersion,
  restorePromptVersion,
  publishPromptVersion,
  setPromptReportMapping,
  setSimpleFeatureState,
  updatePrompt,
} from "@/services/prompt-service";
import { filterAdminPrompts } from "@/services/prompt-list-utils";
import { brand } from "@/styles/palette";
import PromptCategoriesPanel from "./PromptCategoriesPanel";
import PromptCategoryList from "./PromptCategoryList";
import DefaultPromptFavoritesPanel from "./DefaultPromptFavoritesPanel";
import SimplePromptsPanel from "./SimplePromptsPanel";


const EMPTY_PROMPT = { report_template: {}, is_new: false, is_recently_updated: false, is_simple_enabled: true, is_contract_application_enabled: false, title: "", description: "", body: "", category_ids: [], input_schema: [], max_input_files: 10, common_prompt_ids: [] };

function categoryIds(prompt) {
  return (prompt?.categories || []).map((category) => category.id).sort((a, b) => a - b);
}

function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function PromptsPage() {
  const [prompts, setPrompts] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [draft, setDraft] = useState(EMPTY_PROMPT);
  const [previewFile, setPreviewFile] = useState(null);
  const [previewRemoved, setPreviewRemoved] = useState([]);
  const [simplePreviewFile, setSimplePreviewFile] = useState(null);
  const [simplePreviewRemoved, setSimplePreviewRemoved] = useState([]);
  const [versions, setVersions] = useState([]);
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [includeDeletedVersions, setIncludeDeletedVersions] = useState(false);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [publication, setPublication] = useState(null);
  const [publicationError, setPublicationError] = useState("");
  const [reportFolderInput, setReportFolderInput] = useState(null);
  const [reportFolderError, setReportFolderError] = useState("");
  const [viewVersion, setViewVersion] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [simpleFeatureEnabled, setSimpleFeatureEnabled] = useState(true);
  const [simpleFeatureSaving, setSimpleFeatureSaving] = useState(false);
  const [commonPrompts, setCommonPrompts] = useState([]);
  const [commonLoading, setCommonLoading] = useState(true);
  const [commonError, setCommonError] = useState("");
  const [commonDirty, setCommonDirty] = useState(false);
  const loadCommon = useCallback(async () => {
    setCommonLoading(true);
    setCommonError("");
    try {
      setCommonPrompts(await getCommonPrompts());
    } catch (err) {
      setCommonError(commonPromptError(err));
    } finally {
      setCommonLoading(false);
    }
  }, []);
  useEffect(() => { loadCommon(); }, [activeTab, loadCommon]);
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const [categoryGroup, setCategoryGroup] = useState("all");
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [promptSearch, setPromptSearch] = useState("");
  const categoryOptions = useMemo(
    () => categories.flatMap((root) => root.children.map((child) => ({
      ...child,
      parent_name: root.name,
    }))),
    [categories],
  );
  const selectedCategoryOptions = useMemo(
    () => categoryOptions.filter((option) => draft.category_ids.includes(option.id)),
    [categoryOptions, draft.category_ids],
  );
  const visibleCategoryOptions = useMemo(() => {
    const keyword = categorySearch.trim().toLocaleLowerCase("ko-KR");
    return categoryOptions.filter((option) => {
      const matchesGroup = categoryGroup === "all" || option.parent_id === categoryGroup;
      const matchesSearch = !keyword
        || option.name.toLocaleLowerCase("ko-KR").includes(keyword)
        || option.parent_name.toLocaleLowerCase("ko-KR").includes(keyword);
      return matchesGroup && matchesSearch;
    });
  }, [categoryGroup, categoryOptions, categorySearch]);
  const filteredPrompts = useMemo(
    () => filterAdminPrompts(prompts, categories, selectedCategoryId, promptSearch),
    [prompts, categories, selectedCategoryId, promptSearch],
  );
  const activeCategoryLabel = useMemo(() => {
    if (selectedCategoryId === "unassigned") return "미분류 프롬프트";
    if (selectedCategoryId != null) {
      const matched = categoryOptions.find((option) => option.id === selectedCategoryId);
      if (matched) return `${matched.parent_name} · ${matched.name}`;
    }
    return "전체 프롬프트";
  }, [categoryOptions, selectedCategoryId]);

  useEffect(() => {
    getSimpleFeatureState()
      .then((res) => setSimpleFeatureEnabled(Boolean(res.simple_report_enabled)))
      .catch(() => {});
  }, []);

  const handleToggleSimpleFeature = async (checked) => {
    setSimpleFeatureSaving(true);
    setError("");
    try {
      const updated = await setSimpleFeatureState(checked);
      setSimpleFeatureEnabled(Boolean(updated.simple_report_enabled));
    } catch (requestError) {
      setError(requestError.response?.data?.detail === "simple_report_toggle_schema_required"
        ? "간소화 기능 설정을 위한 DB 설정(105_simple_report_toggle.sql)이 필요합니다."
        : "간소화 기능 상태를 변경하지 못했습니다.");
    } finally {
      setSimpleFeatureSaving(false);
    }
  };

  const isNew = selectedId === "new";
  const isDirty = useMemo(() => {
    if (previewFile?.length || previewRemoved.length || simplePreviewFile?.length || simplePreviewRemoved.length) return true;
    if (isNew) {
      return Boolean(
        draft.is_new
        || draft.is_recently_updated
        || draft.is_simple_enabled === false
        || draft.is_contract_application_enabled
        || draft.title
        || draft.description
        || draft.category_ids.length
        || draft.input_schema.length
        || draft.common_prompt_ids.length
        || draft.max_input_files !== 10,
      );
    }
    if (!selectedPrompt || selectedPrompt.is_deleted) return false;
    return JSON.stringify(draft.common_prompt_ids) !== JSON.stringify(selectedPrompt.common_prompt_ids || [])
      || draft.is_new !== Boolean(selectedPrompt.is_new)
      || draft.is_recently_updated !== Boolean(selectedPrompt.is_recently_updated)
      || Boolean(draft.is_simple_enabled ?? true) !== Boolean(selectedPrompt.is_simple_enabled ?? true)
      || Boolean(draft.is_contract_application_enabled) !== Boolean(selectedPrompt.is_contract_application_enabled)
      || draft.title !== selectedPrompt.title
      || draft.description !== (selectedPrompt.description || "")
      || draft.body !== selectedPrompt.body
      || JSON.stringify(draft.report_template) !== JSON.stringify(selectedPrompt.report_template ?? null)
      || draft.max_input_files !== (selectedPrompt.max_input_files ?? 10)
      || JSON.stringify(draft.input_schema) !== JSON.stringify(selectedPrompt.input_schema || [])
      || JSON.stringify([...draft.category_ids].sort((a, b) => a - b))
        !== JSON.stringify(categoryIds(selectedPrompt));
  }, [draft, isNew, selectedPrompt, previewFile, previewRemoved, simplePreviewFile, simplePreviewRemoved]);

  const hasUnsavedChanges = isDirty || commonDirty;

  const blocker = useBlocker(
    useCallback(
      ({ currentLocation, nextLocation }) =>
        hasUnsavedChanges && currentLocation.pathname !== nextLocation.pathname,
      [hasUnsavedChanges],
    ),
  );

  useEffect(() => {
    if (blocker.state !== "blocked") return;
    if (window.confirm("저장하지 않은 변경사항이 있습니다. 페이지를 이동할까요?")) {
      blocker.proceed();
    } else {
      blocker.reset();
    }
  }, [blocker]);

  useEffect(() => {
    const warnBeforeUnload = (event) => {
      if (!hasUnsavedChanges) return;
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [hasUnsavedChanges]);

  const loadVersions = useCallback(async (promptId, showDeleted) => {
    const rows = await getPromptVersions(promptId, showDeleted);
    setVersions(rows);
  }, []);

  const loadDetail = useCallback(
    async (promptId, showDeletedVersions = includeDeletedVersions) => {
      setDetailLoading(true);
      setError("");
      try {
        const [prompt, versionRows] = await Promise.all([
          getPrompt(promptId),
          getPromptVersions(promptId, showDeletedVersions),
        ]);
        setSelectedId(promptId);
        setSelectedPrompt(prompt);
        setPreviewFile(null);
        setPreviewRemoved([]);
        setSimplePreviewFile(null);
        setSimplePreviewRemoved([]);
        setDraft({ report_template: prompt.report_template ?? null, is_new: Boolean(prompt.is_new), is_recently_updated: Boolean(prompt.is_recently_updated), is_simple_enabled: Boolean(prompt.is_simple_enabled ?? true), is_contract_application_enabled: Boolean(prompt.is_contract_application_enabled), title: prompt.title, body: prompt.body, category_ids: categoryIds(prompt), input_schema: prompt.input_schema || [], max_input_files: prompt.max_input_files ?? 10, description: prompt.description || "", common_prompt_ids: prompt.common_prompt_ids || [] });
        setVersions(versionRows);
      } catch {
        setError("프롬프트를 불러오지 못했습니다.");
      } finally {
        setDetailLoading(false);
      }
    },
    [includeDeletedVersions],
  );

  const loadList = useCallback(
    async (preferredId = selectedId) => {
      setLoading(true);
      setError("");
      try {
        const result = await getPrompts(includeDeleted, 1, 100);
        const rows = [...result.items];
        for (let page = 2; page <= result.total_pages; page += 1) {
          const nextPage = await getPrompts(includeDeleted, page, 100);
          rows.push(...nextPage.items);
        }
        setPrompts(rows);
        const nextId = rows.some((row) => row.id === preferredId)
          ? preferredId
          : rows[0]?.id ?? null;
        if (nextId) {
          await loadDetail(nextId);
        } else if (preferredId !== "new") {
          setSelectedId(null);
          setSelectedPrompt(null);
          setDraft({ ...EMPTY_PROMPT });
          setVersions([]);
        }
      } catch {
        setError("프롬프트 목록을 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    },
    [includeDeleted, loadDetail, selectedId],
  );

  useEffect(() => {
    loadList(selectedId);
    // 삭제 항목 표시 조건이 바뀔 때만 목록을 새로 불러온다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [includeDeleted]);

  useEffect(() => {
    getPromptCategories().then(setCategories).catch(() => {
      setError("카테고리 목록을 불러오지 못했습니다.");
    });
  }, [activeTab]);

  useEffect(() => {
    if (categoryGroup !== "all" && !categories.some((root) => root.id === categoryGroup)) {
      setCategoryGroup("all");
    }
  }, [categories, categoryGroup]);

  useEffect(() => {
    if (selectedCategoryId != null && selectedCategoryId !== "unassigned"
      && !categoryOptions.some((option) => option.id === selectedCategoryId)) {
      setSelectedCategoryId(null);
    }
  }, [categoryOptions, selectedCategoryId]);

  useEffect(() => {
    if (!selectedPrompt) return;
    loadVersions(selectedPrompt.id, includeDeletedVersions).catch(() => {
      setError("버전 기록을 불러오지 못했습니다.");
    });
  }, [includeDeletedVersions, loadVersions, selectedPrompt]);

  const canLeaveDraft = () =>
    !hasUnsavedChanges || window.confirm("저장하지 않은 변경사항을 버릴까요?");

  const selectPrompt = (promptId) => {
    if (promptId === selectedId || !canLeaveDraft()) return;
    loadDetail(promptId);
  };

  const startNewPrompt = () => {
    if (!canLeaveDraft()) return;
    setPreviewFile(null);
    setPreviewRemoved([]);
    setSimplePreviewFile(null);
    setSimplePreviewRemoved([]);
    setSelectedId("new");
    setSelectedPrompt(null);
    setDraft({ ...EMPTY_PROMPT });
    setVersions([]);
    setError("");
  };

  const savePrompt = async () => {
    const title = draft.title.trim();
    const emptyTemplateDraft = draft.report_template !== null
      && Object.keys(draft.report_template).length === 0 && !selectedPrompt?.current_version_id;
    if (draft.report_template && !emptyTemplateDraft && (!(draft.report_template.shell_version_id ? draft.report_template.fragment_html : draft.report_template.html)
        || !draft.report_template.schema_document)) {
      setError("HTML 템플릿과 출력 데이터 스키마를 선택해 주세요.");
      return;
    }
    if (!title) {
      setError("제목을 입력해 주세요.");
      return;
    }
    const bodyToSave = draft.body.trim() ? draft.body : "(템플릿 동기화 대기)";
    if (!Number.isInteger(draft.max_input_files) || draft.max_input_files < 1 || draft.max_input_files > 100
      || draft.input_schema.some((field) => ["file", "generated_document"].includes(field.type)
        && (!Number.isInteger(field.max_files) || field.max_files < 1 || field.max_files > 100))) {
      setError("전체·항목별 최대 개수는 1~100의 정수로 입력해 주세요.");
      return;
    }
    if (draft.input_schema.some((field) => field.type === "file" && field.file_types
      && (!field.file_types.length || field.file_types.some((type) => !["pdf", "image", "html", "excel"].includes(type))))) {
      setError("파일 항목의 허용 형식을 하나 이상 선택해 주세요.");
      return;
    }
    const keys = draft.input_schema.map((field) => field.key);
    if (new Set(keys).size !== keys.length || draft.input_schema.some((field) =>
      !/^[a-z][a-z0-9_]{0,49}$/.test(field.key) || !field.label.trim()
      || (field.type === "select" && (!field.options.length
        || field.options.some((option) => !option.trim() || option.length > 100)
        || new Set(field.options).size !== field.options.length)))) {
      setError("입력 UI의 항목 이름·고유 키·선택지를 확인해 주세요. 선택지는 빈 줄이나 중복 없이 입력해야 합니다.");
      return;
    }
    setWorking(true);
    setError("");
    try {
      let saved = isNew
        ? await createPrompt(title, bodyToSave, draft.category_ids, draft.input_schema, draft.description, draft.common_prompt_ids, draft.max_input_files, { is_new: draft.is_new, is_recently_updated: draft.is_recently_updated, is_simple_enabled: draft.is_simple_enabled, is_contract_application_enabled: draft.is_contract_application_enabled }, draft.report_template)
        : await updatePrompt(selectedPrompt.id, title, bodyToSave, draft.category_ids, draft.input_schema, draft.description, draft.common_prompt_ids, draft.max_input_files, { is_new: draft.is_new, is_recently_updated: draft.is_recently_updated, is_simple_enabled: draft.is_simple_enabled, is_contract_application_enabled: draft.is_contract_application_enabled }, draft.report_template);
      setSelectedPrompt(saved);
      setSelectedId(saved.id);
      if (previewFile?.length || previewRemoved.length) {
        const existing = selectedPrompt?.preview_images?.length ? selectedPrompt.preview_images
          : selectedPrompt?.preview_image_available ? [{ id: "legacy" }] : [];
        saved = await uploadPromptPreviewImage(saved.id, previewFile || [], existing.filter((image) => !previewRemoved.includes(image.id)).map((image) => image.id));
      }
      if (simplePreviewFile?.length || simplePreviewRemoved.length) {
        const existingSimple = selectedPrompt?.simple_preview_images || [];
        saved = await uploadPromptPreviewImage(
          saved.id,
          simplePreviewFile || [],
          existingSimple.filter((image) => !simplePreviewRemoved.includes(image.id)).map((image) => image.id),
          "simple",
        );
      }
      setSelectedPrompt(saved);
      setPreviewFile(null);
      setPreviewRemoved([]);
      setSimplePreviewFile(null);
      setSimplePreviewRemoved([]);
      setDraft({ report_template: saved.report_template ?? null, is_new: Boolean(saved.is_new), is_recently_updated: Boolean(saved.is_recently_updated), is_simple_enabled: Boolean(saved.is_simple_enabled ?? true), is_contract_application_enabled: Boolean(saved.is_contract_application_enabled), title: saved.title, body: saved.body, category_ids: categoryIds(saved), input_schema: saved.input_schema || [], max_input_files: saved.max_input_files ?? 10, description: saved.description || "", common_prompt_ids: saved.common_prompt_ids || [] });
      await Promise.all([
        loadVersions(saved.id, includeDeletedVersions),
        loadList(saved.id),
      ]);
    } catch (requestError) {
      const detail = requestError.response?.data?.detail;
      setError(Array.isArray(detail) ? detail.map((item) => item.msg).join(" / ") : typeof detail === "string" && (detail.startsWith("common_prompt_") || detail === "invalid_common_prompt_ids")
        ? commonPromptError(requestError)
        : detail === "prompt_draft_schema_required"
        ? "템플릿 초안을 저장하려면 DB 설정(101_prompt_template_drafts.sql)을 적용해야 합니다."
        : detail === "report_shell_schema_required"
        ? "공통 HTML을 사용하려면 DB 설정을 적용해야 합니다."
        : requestError.response?.status === 422 && typeof detail === "string"
        ? detail
        : detail === "prompt_preview_schema_required"
        ? "프롬프트는 저장됐지만 이미지 저장을 위한 DB 설정이 필요합니다."
        : typeof detail === "string" && detail.startsWith("preview_image_")
          ? "프롬프트는 저장됐지만 이미지 저장에 실패했습니다. 파일 형식과 10MB 제한을 확인해 주세요."
          : "프롬프트 또는 미리보기 이미지 저장에 실패했습니다. 변경사항을 확인하고 다시 저장해 주세요.");
    } finally {
      setWorking(false);
    }
  };

  const saveReportMapping = async () => {
    const promptId = selectedPrompt.id;
    setWorking(true);
    setReportFolderError("");
    try {
      const mapping = await setPromptReportMapping(promptId, reportFolderInput.trim() || null);
      setSelectedPrompt((current) => current?.id === promptId ? { ...current, ...mapping } : current);
      setPrompts((current) => current.map((prompt) => prompt.id === promptId ? { ...prompt, ...mapping } : prompt));
      setReportFolderInput(null);
    } catch (requestError) {
      const detail = requestError.response?.data?.detail;
      if (Array.isArray(detail)) {
        setReportFolderError(detail.map((item) => item.msg).join(" / "));
      } else {
        setReportFolderError({
          report_folder_in_use: "폴더 공유 연결을 위한 DB 설정이 필요합니다. 관리자에게 문의해 주세요.",
          report_mapping_schema_required: "보고서 연결·폴더 공유를 위한 DB 설정이 필요합니다. 관리자에게 문의해 주세요.",
        }[detail] || "보고서 연결을 저장하지 못했습니다. 다시 시도해 주세요.");
      }
    } finally {
      setWorking(false);
    }
  };

  const applyPublication = async () => {
    if (!publication) return;
    setWorking(true);
    setPublicationError("");
    try {
      const updated = await publishPromptVersion(selectedPrompt.id, {
        version_id: publication.version.id,
        is_new: publication.is_new,
        is_recently_updated: publication.is_recently_updated,
        ...(publication.is_simple_enabled !== undefined ? { is_simple_enabled: publication.is_simple_enabled } : {}),
        ...(publication.is_contract_application_enabled !== undefined
          ? { is_contract_application_enabled: publication.is_contract_application_enabled }
          : {}),
      });
      setSelectedPrompt(updated);
      setDraft((current) => ({ ...current, is_new: updated.is_new, is_recently_updated: updated.is_recently_updated, is_simple_enabled: Boolean(updated.is_simple_enabled ?? true), is_contract_application_enabled: Boolean(updated.is_contract_application_enabled) }));
      setPublication(null);
      await Promise.all([loadVersions(updated.id, includeDeletedVersions), loadList(updated.id)]);
    } catch {
      setPublicationError("제공 버전을 지정하지 못했습니다. 버전 상태를 확인하고 다시 시도해 주세요.");
    } finally {
      setWorking(false);
    }
  };

  const runConfirmedAction = async () => {
    const action = confirmAction;
    if (!action) return;
    setConfirmAction(null);
    setWorking(true);
    setError("");
    try {
      if (action.type === "delete-prompt") {
        await deletePrompt(selectedPrompt.id);
        await loadList(includeDeleted ? selectedPrompt.id : null);
      } else if (action.type === "delete-version") {
        await deletePromptVersion(selectedPrompt.id, action.version.id);
        await loadVersions(selectedPrompt.id, includeDeletedVersions);
      } else if (action.type === "restore-version") {
        const restored = await restorePromptVersion(
          selectedPrompt.id,
          action.version.id,
        );
        setSelectedPrompt(restored);
        setDraft({ report_template: restored.report_template ?? null, is_new: Boolean(restored.is_new), is_recently_updated: Boolean(restored.is_recently_updated), is_simple_enabled: Boolean(restored.is_simple_enabled ?? true), is_contract_application_enabled: Boolean(restored.is_contract_application_enabled), title: restored.title, body: restored.body, category_ids: categoryIds(restored), input_schema: restored.input_schema || [], max_input_files: restored.max_input_files ?? 10, description: restored.description || "", common_prompt_ids: restored.common_prompt_ids || [] });
        await Promise.all([
          loadVersions(restored.id, includeDeletedVersions),
          loadList(restored.id),
        ]);
      }
    } catch (requestError) {
      const detail = requestError?.response?.data?.detail;
      setError(
        detail === "current_version_cannot_be_deleted"
          ? "현재 사용 중인 버전은 삭제할 수 없습니다."
          : "요청을 처리하지 못했습니다.",
      );
    } finally {
      setWorking(false);
    }
  };

  const handleRecoverPrompt = async () => {
    setWorking(true);
    setError("");
    try {
      const recovered = await recoverPrompt(selectedPrompt.id);
      setSelectedPrompt(recovered);
      setDraft({ report_template: recovered.report_template ?? null, is_new: Boolean(recovered.is_new), is_recently_updated: Boolean(recovered.is_recently_updated), is_simple_enabled: Boolean(recovered.is_simple_enabled ?? true), is_contract_application_enabled: Boolean(recovered.is_contract_application_enabled), title: recovered.title, body: recovered.body, category_ids: categoryIds(recovered), input_schema: recovered.input_schema || [], max_input_files: recovered.max_input_files ?? 10, description: recovered.description || "", common_prompt_ids: recovered.common_prompt_ids || [] });
      await loadList(recovered.id);
    } catch {
      setError("프롬프트를 복구하지 못했습니다.");
    } finally {
      setWorking(false);
    }
  };

  const handleRecoverVersion = async (version) => {
    setWorking(true);
    setError("");
    try {
      await recoverPromptVersion(selectedPrompt.id, version.id);
      await loadVersions(selectedPrompt.id, includeDeletedVersions);
    } catch {
      setError("버전을 복구하지 못했습니다.");
    } finally {
      setWorking(false);
    }
  };

  const toggleDraftCategory = (categoryId, checked) => {
    setDraft((current) => ({
      ...current,
      category_ids: checked
        ? [...current.category_ids, categoryId]
        : current.category_ids.filter((id) => id !== categoryId),
    }));
  };

  return (
    <Box sx={{ p: { xs: 1.75, sm: 2.5, lg: 3.5 }, maxWidth: 1520, mx: "auto" }}>
      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 2.5 }, mb: 2, borderRadius: "16px" }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", sm: "center" }}
          gap={2}
        >
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontSize: { xs: 20, sm: 24 }, fontWeight: 900, letterSpacing: "-0.025em" }}>
              프롬프트 관리
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.4, fontSize: 13 }}>
              카테고리별로 프롬프트를 선택하고 기본 정보, 노출 설정, 입력 UI를 관리합니다.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1.25} alignItems="center" flexWrap="wrap">
            <Paper variant="outlined" sx={{ px: 1.5, py: 0.5, borderRadius: 2.5, bgcolor: "#F8FAFC" }}>
              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    color="success"
                    checked={Boolean(simpleFeatureEnabled)}
                    disabled={simpleFeatureSaving}
                    onChange={(event) => handleToggleSimpleFeature(event.target.checked)}
                    inputProps={{ "aria-label": "간소화 기능 전체 켜기/끄기" }}
                  />
                }
                label={
                  <Stack direction="row" spacing={0.75} alignItems="center">
                    <Typography variant="body2" fontWeight={700}>간소화 기능</Typography>
                    <Chip
                      size="small"
                      color={simpleFeatureEnabled ? "success" : "default"}
                      variant={simpleFeatureEnabled ? "filled" : "outlined"}
                      label={simpleFeatureEnabled ? "전체 켜짐" : "전체 꺼짐"}
                    />
                  </Stack>
                }
                sx={{ m: 0 }}
              />
            </Paper>
            {activeTab === 0 && (
              <Button
                variant="contained"
                startIcon={<AddRoundedIcon />}
                onClick={startNewPrompt}
              >
                새 프롬프트
              </Button>
            )}
          </Stack>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ borderRadius: "16px", mb: 2, px: 1.5, py: 0.5 }}>
        <Tabs
          value={activeTab}
          onChange={(_, value) => {
            if (value !== activeTab && canLeaveDraft()) setActiveTab(value);
          }}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="프롬프트 관리 메뉴"
          sx={{ minHeight: 44 }}
        >
          <Tab label="프롬프트" sx={{ fontWeight: 750 }} />
          <Tab label="간소화 버전 관리" sx={{ fontWeight: 750 }} />
          <Tab label="카테고리 관리" sx={{ fontWeight: 750 }} />
          <Tab label="기본 즐겨찾기 관리" sx={{ fontWeight: 750 }} />
          <Tab label="공통 프롬프트 관리" sx={{ fontWeight: 750 }} />
          <Tab label="공통 HTML 관리" sx={{ fontWeight: 750 }} />
        </Tabs>
      </Paper>

      {error && (
        <Alert severity="error" onClose={() => setError("")} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {activeTab === 0 ? (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "minmax(260px, 320px) minmax(0, 1fr)" },
            gap: { xs: 2, md: 2.5 },
            alignItems: "start",
          }}
        >
          <Box sx={{ position: { md: "sticky" }, top: { md: 16 }, minWidth: 0 }}>
            <PromptCategoryList
              prompts={prompts}
              categories={categories}
              selectedCategoryId={selectedCategoryId}
              onSelectCategory={setSelectedCategoryId}
            />
          </Box>

          <Stack spacing={2.5} sx={{ minWidth: 0 }}>
            <Paper
              variant="outlined"
              sx={{
                borderRadius: "16px",
                overflow: "hidden",
                boxShadow: "0 1px 3px rgba(15, 23, 42, 0.05)",
              }}
            >
              <Stack
                direction={{ xs: "column", sm: "row" }}
                alignItems={{ xs: "stretch", sm: "center" }}
                justifyContent="space-between"
                gap={1.25}
                sx={{
                  px: 2,
                  py: 1.25,
                  bgcolor: "#F8FAFC",
                  borderBottom: 1,
                  borderColor: "divider",
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0, flexWrap: "wrap" }}>
                  <Typography variant="subtitle2" fontWeight={800} noWrap>
                    {activeCategoryLabel}
                  </Typography>
                  <Chip
                    label={`${filteredPrompts.length}개`}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                </Stack>
                <Stack direction="row" spacing={1.25} alignItems="center" flexWrap="wrap">
                  <TextField
                    size="small"
                    placeholder="프롬프트 검색"
                    value={promptSearch}
                    onChange={(event) => setPromptSearch(event.target.value)}
                    inputProps={{ "aria-label": "프롬프트 검색" }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchRoundedIcon fontSize="small" color="action" />
                        </InputAdornment>
                      ),
                      endAdornment: promptSearch ? (
                        <InputAdornment position="end">
                          <IconButton
                            size="small"
                            aria-label="검색어 지우기"
                            onClick={() => setPromptSearch("")}
                          >
                            <CloseRoundedIcon fontSize="small" />
                          </IconButton>
                        </InputAdornment>
                      ) : null,
                    }}
                    sx={{
                      width: { xs: "100%", sm: 210 },
                      bgcolor: "background.paper",
                      "& .MuiInputBase-input": { py: 0.7, fontSize: 13 },
                    }}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        size="small"
                        checked={includeDeleted}
                        onChange={(event) => setIncludeDeleted(event.target.checked)}
                      />
                    }
                    label="삭제 포함"
                    slotProps={{ typography: { variant: "caption", fontWeight: 600 } }}
                    sx={{ mr: 0 }}
                  />
                </Stack>
              </Stack>

              <Box sx={{ p: 1.5, maxHeight: { xs: 260, md: 250 }, overflowY: "auto" }}>
                {loading ? (
                  <Box sx={{ py: 5, display: "grid", placeItems: "center" }}>
                    <CircularProgress size={28} />
                  </Box>
                ) : (
                  <>
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: {
                          xs: "1fr",
                          sm: "repeat(2, minmax(0, 1fr))",
                          xl: "repeat(3, minmax(0, 1fr))",
                        },
                        gap: 1.25,
                      }}
                    >
                      {isNew && (
                        <Paper
                          variant="outlined"
                          sx={{
                            p: 1.35,
                            borderRadius: "12px",
                            borderWidth: 2,
                            borderColor: "primary.main",
                            bgcolor: "primary.light",
                          }}
                        >
                          <Stack spacing={0.5}>
                            <Stack direction="row" alignItems="center" justifyContent="space-between" gap={0.75}>
                              <Typography sx={{ fontWeight: 750, fontSize: 13.5 }} noWrap>
                                {draft.title.trim() || "새 프롬프트"}
                              </Typography>
                              <Chip label="작성 중" size="small" color="primary" sx={{ height: 20, fontSize: 11 }} />
                            </Stack>
                            <Typography variant="caption" color="text.secondary">
                              저장 전
                            </Typography>
                          </Stack>
                        </Paper>
                      )}
                      {filteredPrompts.map((prompt) => {
                        const selected = selectedId === prompt.id;
                        return (
                          <Paper
                            key={prompt.id}
                            variant="outlined"
                            role="button"
                            tabIndex={0}
                            onClick={() => selectPrompt(prompt.id)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                selectPrompt(prompt.id);
                              }
                            }}
                            sx={{
                              p: 1.35,
                              borderRadius: "12px",
                              borderWidth: selected ? 2 : 1,
                              borderColor: selected ? "primary.main" : "divider",
                              bgcolor: selected ? "primary.light" : "background.paper",
                              opacity: prompt.is_deleted ? 0.62 : 1,
                              cursor: "pointer",
                              transition: "border-color 120ms ease, background-color 120ms ease",
                              "&:hover": selected
                                ? undefined
                                : { borderColor: brand.accent, bgcolor: "#FAFCFB" },
                              "&:focus-visible": {
                                outline: `2px solid ${brand.accentInk}`,
                                outlineOffset: 2,
                              },
                            }}
                          >
                            <Stack spacing={0.6} sx={{ minWidth: 0 }}>
                              <Stack direction="row" alignItems="center" gap={0.6} sx={{ minWidth: 0 }}>
                                <Typography
                                  title={prompt.title}
                                  noWrap
                                  sx={{ fontWeight: 750, fontSize: 13.5, flex: 1, minWidth: 0 }}
                                >
                                  {prompt.title}
                                </Typography>
                                {prompt.is_new && (
                                  <Tooltip title="신규">
                                    <Chip
                                      label="N"
                                      aria-label="신규"
                                      size="small"
                                      sx={{
                                        height: 20,
                                        minWidth: 20,
                                        flexShrink: 0,
                                        bgcolor: "#dcfce7",
                                        color: "#166534",
                                        fontWeight: 800,
                                        fontSize: 11,
                                        "& .MuiChip-label": { px: 0.6 },
                                      }}
                                    />
                                  </Tooltip>
                                )}
                                {prompt.is_recently_updated && (
                                  <Tooltip title="최근 업데이트">
                                    <Chip
                                      label="U"
                                      aria-label="최근 업데이트"
                                      size="small"
                                      sx={{
                                        height: 20,
                                        minWidth: 20,
                                        flexShrink: 0,
                                        bgcolor: "#dbeafe",
                                        color: "#1e40af",
                                        fontWeight: 800,
                                        fontSize: 11,
                                        "& .MuiChip-label": { px: 0.6 },
                                      }}
                                    />
                                  </Tooltip>
                                )}
                                {prompt.is_default_favorite && (
                                  <Chip label="기본" size="small" color="primary" variant="outlined" sx={{ height: 20, fontSize: 11 }} />
                                )}
                                {prompt.is_deleted && (
                                  <Chip label="삭제됨" size="small" sx={{ height: 20, fontSize: 11 }} />
                                )}
                              </Stack>
                              <Stack direction="row" alignItems="center" gap={0.75} flexWrap="wrap">
                                <Typography variant="caption" color="text.secondary" noWrap>
                                  {prompt.current_version_no == null ? "템플릿 준비 중" : `v${prompt.current_version_no}`}
                                  {` · ${formatDate(prompt.updated_at)}`}
                                </Typography>
                                {prompt.report_folder && (
                                  <Chip
                                    label={prompt.report_folder}
                                    size="small"
                                    variant="outlined"
                                    sx={{ height: 18, fontSize: 10.5, "& .MuiChip-label": { px: 0.75 } }}
                                  />
                                )}
                              </Stack>
                            </Stack>
                          </Paper>
                        );
                      })}
                    </Box>
                    {!isNew && filteredPrompts.length === 0 && (
                      <Typography color="text.secondary" variant="body2" sx={{ py: 4, textAlign: "center" }}>
                        {prompts.length === 0
                          ? "등록된 프롬프트가 없습니다."
                          : "선택한 조건에 맞는 프롬프트가 없습니다."}
                      </Typography>
                    )}
                  </>
                )}
              </Box>
            </Paper>

            <Paper
              variant="outlined"
              sx={{
                borderRadius: "16px",
                overflow: "hidden",
                boxShadow: "0 1px 3px rgba(15, 23, 42, 0.05)",
              }}
            >
              {detailLoading ? (
                <Box sx={{ py: 12, display: "grid", placeItems: "center" }}>
                  <CircularProgress />
                </Box>
              ) : selectedId ? (
                <Box>
                  <Stack
                    direction={{ xs: "column", md: "row" }}
                    justifyContent="space-between"
                    alignItems={{ xs: "stretch", md: "center" }}
                    gap={1.5}
                    sx={{
                      px: { xs: 2, md: 3 },
                      py: 1.75,
                      bgcolor: "#F8FAFC",
                      borderBottom: 1,
                      borderColor: "divider",
                    }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
                        <Typography variant="h6" sx={{ fontWeight: 800, overflowWrap: "anywhere" }}>
                          {isNew ? "새 프롬프트" : (selectedPrompt?.title || "프롬프트 상세")}
                        </Typography>
                        <Chip
                          size="small"
                          color={!isNew && selectedPrompt?.current_version_no != null ? "primary" : "default"}
                          variant="outlined"
                          label={
                            isNew
                              ? "작성 중"
                              : selectedPrompt?.current_version_no == null
                                ? "템플릿 준비 중"
                                : `v${selectedPrompt.current_version_no}`
                          }
                        />
                        {isDirty && <Chip label="저장 안 됨" size="small" color="warning" />}
                        {selectedPrompt?.is_deleted && <Chip label="삭제된 프롬프트" size="small" />}
                      </Stack>
                      {!isNew && selectedPrompt?.updated_at && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>
                          마지막 수정 {formatDate(selectedPrompt.updated_at)}
                        </Typography>
                      )}
                    </Box>
                    <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ flexShrink: 0 }}>
                      {!isNew && (
                        <Button
                          variant="outlined"
                          startIcon={<HistoryRoundedIcon />}
                          onClick={() => setHistoryOpen(true)}
                        >
                          버전 기록
                        </Button>
                      )}
                      {selectedPrompt?.is_deleted ? (
                        <Button
                          variant="contained"
                          startIcon={<RestoreRoundedIcon />}
                          onClick={handleRecoverPrompt}
                          disabled={working}
                        >
                          프롬프트 복구
                        </Button>
                      ) : (
                        <>
                          {!isNew && (
                            <Button
                              color="error"
                              variant="outlined"
                              startIcon={<DeleteOutlineRoundedIcon />}
                              onClick={() => setConfirmAction({ type: "delete-prompt" })}
                              disabled={working}
                            >
                              삭제
                            </Button>
                          )}
                          <Button
                            variant="contained"
                            startIcon={<SaveRoundedIcon />}
                            onClick={savePrompt}
                            disabled={working || !isDirty}
                          >
                            저장
                          </Button>
                        </>
                      )}
                    </Stack>
                  </Stack>

                  <Stack spacing={3} sx={{ p: { xs: 2, md: 3 } }}>
                    <Stack spacing={2}>
                      <Typography variant="subtitle1" fontWeight={800}>
                        기본 정보 & 동기화
                      </Typography>

                      {selectedPrompt && (
                        <Paper
                          variant="outlined"
                          sx={{
                            bgcolor: "#F8FAFC",
                            borderRadius: 2,
                            px: 2,
                            py: 1.25,
                          }}
                        >
                          <Stack
                            direction={{ xs: "column", sm: "row" }}
                            gap={1}
                            alignItems={{ xs: "flex-start", sm: "center" }}
                            justifyContent="space-between"
                          >
                            <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap" sx={{ minWidth: 0 }}>
                              <FolderOpenRoundedIcon fontSize="small" color="primary" />
                              <Typography variant="body2" fontWeight={700}>
                                보고서 동기화 폴더
                              </Typography>
                              <Typography variant="body2" color={selectedPrompt.report_folder ? "text.primary" : "text.secondary"}>
                                {selectedPrompt.report_folder || "연결 안 됨"}
                              </Typography>
                              {selectedPrompt.report_folder && !selectedPrompt.report_folder_confirmed && (
                                <Chip label="폴더 확인 대기" size="small" variant="outlined" />
                              )}
                              {(selectedPrompt.report_template?.simple_template || selectedPrompt.has_simple_template) && (
                                <Chip
                                  label={simpleFeatureEnabled && selectedPrompt.is_simple_enabled !== false ? "간소화 노출 중" : "간소화 숨김"}
                                  size="small"
                                  color={simpleFeatureEnabled && selectedPrompt.is_simple_enabled !== false ? "success" : "default"}
                                  variant="outlined"
                                />
                              )}
                            </Stack>
                            {!selectedPrompt.is_deleted && (
                              <Button
                                size="small"
                                variant="outlined"
                                disabled={working}
                                onClick={() => {
                                  setReportFolderError("");
                                  setReportFolderInput(selectedPrompt.report_folder || "");
                                }}
                                sx={{ flexShrink: 0 }}
                              >
                                연결 편집
                              </Button>
                            )}
                          </Stack>
                        </Paper>
                      )}

                      {!selectedPrompt?.current_version_id && (
                        <Alert severity="info">
                          저장 후 동기화 폴더를 연결하고 싱크하면 첫 버전이 생성됩니다. 초안은 일반 사용자에게 표시되지 않습니다.
                        </Alert>
                      )}

                      <TextField
                        size="small"
                        label="제목"
                        value={draft.title}
                        onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
                        disabled={selectedPrompt?.is_deleted || working}
                        inputProps={{ maxLength: 200 }}
                        fullWidth
                      />
                      <TextField
                        size="small"
                        label="간단한 설명"
                        value={draft.description}
                        onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
                        disabled={selectedPrompt?.is_deleted || working}
                        helperText={`보고서 선택 화면에 표시됩니다. 버전 관리 대상이 아닙니다. (${draft.description.length}/300)`}
                        inputProps={{ maxLength: 300 }}
                        multiline
                        minRows={2}
                        fullWidth
                      />
                      <Box>
                        <Typography variant="subtitle2" fontWeight={750} sx={{ mb: 1 }}>
                          카테고리 (다중 선택)
                        </Typography>
                        {categoryOptions.length ? (
                          <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2.5 }}>
                            <Stack direction="row" gap={0.75} alignItems="center" flexWrap="wrap">
                              {selectedCategoryOptions.map((option) => (
                                <Chip
                                  key={option.id}
                                  size="small"
                                  label={option.name}
                                  onDelete={selectedPrompt?.is_deleted || working
                                    ? undefined
                                    : () => toggleDraftCategory(option.id, false)}
                                />
                              ))}
                              {!selectedCategoryOptions.length && (
                                <Typography variant="body2" color="text.secondary" sx={{ mr: 0.5 }}>
                                  선택된 카테고리가 없습니다.
                                </Typography>
                              )}
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<AddRoundedIcon />}
                                onClick={() => setCategoryPickerOpen(true)}
                                disabled={selectedPrompt?.is_deleted || working}
                                sx={{ ml: { sm: "auto" } }}
                              >
                                카테고리 선택
                              </Button>
                            </Stack>
                          </Paper>
                        ) : (
                          <Alert severity="info">카테고리 관리 탭에서 소분류를 먼저 만들어 주세요.</Alert>
                        )}
                      </Box>
                    </Stack>

                    <Divider />

                    <Stack spacing={1.5}>
                      <Typography variant="subtitle1" fontWeight={800}>
                        노출 및 기능 설정
                      </Typography>
                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: { xs: "1fr", lg: "repeat(2, minmax(0, 1fr))" },
                          gap: 1.5,
                        }}
                      >
                        <Paper variant="outlined" sx={{ p: 1.75, borderRadius: 2.5, bgcolor: "#FAFBFC" }}>
                          <Typography variant="subtitle2" fontWeight={750}>홈 보고서 노출</Typography>
                          <Stack direction="row" gap={2} flexWrap="wrap" sx={{ mt: 0.5 }}>
                            <FormControlLabel
                              label="신규"
                              control={(
                                <Checkbox
                                  checked={draft.is_new}
                                  disabled={selectedPrompt?.is_deleted || working}
                                  onChange={(event) => setDraft((current) => ({ ...current, is_new: event.target.checked }))}
                                />
                              )}
                            />
                            <FormControlLabel
                              label="최근 업데이트"
                              control={(
                                <Checkbox
                                  checked={draft.is_recently_updated}
                                  disabled={selectedPrompt?.is_deleted || working}
                                  onChange={(event) => setDraft((current) => ({ ...current, is_recently_updated: event.target.checked }))}
                                />
                              )}
                            />
                          </Stack>
                          <Typography variant="caption" color="text.secondary">
                            각각 설정할 수 있습니다. 신규는 생성일, 최근 업데이트는 제공 전환일 기준으로 최대 6개 표시됩니다.
                          </Typography>
                        </Paper>

                        <Paper variant="outlined" sx={{ p: 1.75, borderRadius: 2.5, bgcolor: "#FAFBFC" }}>
                          <Typography variant="subtitle2" fontWeight={750}>보고서 리스트 &lsquo;청약&rsquo; 버튼 노출</Typography>
                          <FormControlLabel
                            sx={{ mt: 0.5 }}
                            label={draft.is_contract_application_enabled ? "고객 연결 후 보고서 리스트에서 '청약' 자동 입력 버튼을 노출합니다." : "고객을 연결해도 보고서 리스트에 '청약' 버튼을 노출하지 않습니다."}
                            control={
                              <Switch
                                color="success"
                                checked={Boolean(draft.is_contract_application_enabled)}
                                disabled={selectedPrompt?.is_deleted || working}
                                onChange={(event) => setDraft((current) => ({ ...current, is_contract_application_enabled: event.target.checked }))}
                              />
                            }
                          />
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                            단일 제안서를 요약해 내 계약에 자동 입력할 수 있는 템플릿에만 켜두는 것을 권장합니다.
                          </Typography>
                        </Paper>

                        {Boolean(draft.report_template?.simple_template || selectedPrompt?.has_simple_template) && (
                          <Paper
                            variant="outlined"
                            sx={{
                              gridColumn: { lg: "1 / -1" },
                              p: 1.75,
                              borderRadius: 2.5,
                              bgcolor: "#FAFBFC",
                            }}
                          >
                            <Typography variant="subtitle2" fontWeight={750}>간소화 버전 사용자 노출</Typography>
                            <FormControlLabel
                              sx={{ mt: 0.5 }}
                              label={draft.is_simple_enabled ? "이 프롬프트의 간소화 미리보기·생성을 사용자에게 노출합니다." : "이 프롬프트의 간소화 미리보기·생성을 사용자에게 숨깁니다."}
                              control={
                                <Switch
                                  color="success"
                                  checked={Boolean(draft.is_simple_enabled)}
                                  disabled={selectedPrompt?.is_deleted || working}
                                  onChange={(event) => setDraft((current) => ({ ...current, is_simple_enabled: event.target.checked }))}
                                />
                              }
                            />
                            {!simpleFeatureEnabled && (
                              <Alert severity="info" sx={{ mt: 0.75 }}>
                                현재 상단의 전체 <b>간소화 기능</b>이 꺼져 있어 모든 프롬프트의 간소화 버전이 사용자에게 숨겨져 있습니다.
                              </Alert>
                            )}
                          </Paper>
                        )}
                      </Box>
                    </Stack>

                    <Divider />

                    <Stack spacing={2}>
                      <Typography variant="subtitle1" fontWeight={800}>
                        미리보기 이미지
                      </Typography>
                      <PreviewImageEditor
                        prompt={selectedPrompt}
                        file={previewFile}
                        removed={previewRemoved}
                        disabled={selectedPrompt?.is_deleted || working}
                        onFile={setPreviewFile}
                        onRemove={(id) => setPreviewRemoved((current) => [...current, id])}
                      />
                      {Boolean(draft.report_template?.simple_template || selectedPrompt?.simple_preview_image_available) && (
                        <PreviewImageEditor
                          prompt={selectedPrompt}
                          file={simplePreviewFile}
                          removed={simplePreviewRemoved}
                          variant="simple"
                          title="간소화 버전 미리보기 이미지 (선택)"
                          description="미리보기 이미지가 없어도 간소화 예시 데이터 기반 HTML 미리보기가 제공됩니다. PNG·JPG·WebP 최대 20장, 장당 10MB."
                          disabled={selectedPrompt?.is_deleted || working}
                          onFile={setSimplePreviewFile}
                          onRemove={(id) => setSimplePreviewRemoved((current) => [...current, id])}
                        />
                      )}
                    </Stack>

                    <Divider />

                    <Stack spacing={1.5}>
                      <Typography variant="subtitle1" fontWeight={800}>
                        입력 UI 설정
                      </Typography>
                      <InputSchemaEditor
                        value={draft.input_schema}
                        maxInputFiles={draft.max_input_files}
                        onMaxInputFilesChange={(max_input_files) => setDraft((current) => ({ ...current, max_input_files }))}
                        disabled={selectedPrompt?.is_deleted || working}
                        onChange={(input_schema) => setDraft((current) => ({ ...current, input_schema }))}
                      />
                    </Stack>

                    {!isNew && (
                      <Typography variant="caption" color="text.secondary">
                        마지막 수정 {formatDate(selectedPrompt.updated_at)} · 제목·입력 UI를 변경하면 새 버전이 생성되며, 카테고리·설명·노출 설정만 바꾸면 버전 번호를 유지하고 현재 프롬프트에 반영됩니다.
                      </Typography>
                    )}
                  </Stack>
                </Box>
              ) : (
                <Box sx={{ py: 12, textAlign: "center" }}>
                  <Typography color="text.secondary">
                    프롬프트를 선택하거나 새로 만들어 주세요.
                  </Typography>
                </Box>
              )}
            </Paper>
          </Stack>
        </Box>
      ) : activeTab === 1 ? (
        <SimplePromptsPanel
          simpleFeatureEnabled={simpleFeatureEnabled}
          simpleFeatureSaving={simpleFeatureSaving}
          onToggleSimpleFeature={handleToggleSimpleFeature}
          onPromptSimpleChanged={(promptId, enabled) => {
            setPrompts((current) => current.map((item) => (
              item.id === promptId ? { ...item, is_simple_enabled: enabled } : item
            )));
            if (selectedPrompt?.id === promptId) {
              setSelectedPrompt((current) => (current ? { ...current, is_simple_enabled: enabled } : current));
              setDraft((current) => ({ ...current, is_simple_enabled: enabled }));
            }
          }}
        />
      ) : activeTab === 2 ? (
        <PromptCategoriesPanel />
      ) : activeTab === 3 ? (
        <DefaultPromptFavoritesPanel />
      ) : activeTab === 4 ? (
        <Stack spacing={2}>
          {commonError && <Alert severity="warning">{commonError}</Alert>}
          <CommonPromptsPanel items={commonPrompts} loading={commonLoading || Boolean(commonError)}
            onRefresh={loadCommon} onDirtyChange={setCommonDirty} />
        </Stack>
      ) : <ReportShellPanel onDirtyChange={setCommonDirty} />}

      <Drawer
        anchor="right"
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        PaperProps={{ sx: { width: { xs: "100%", sm: 560 }, p: 2.5 } }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <div>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>버전 기록</Typography>
            <Typography variant="body2" color="text.secondary">
              {selectedPrompt?.title}
            </Typography>
          </div>
          <IconButton onClick={() => setHistoryOpen(false)} aria-label="버전 기록 닫기">
            <CloseRoundedIcon />
          </IconButton>
        </Stack>
        <FormControlLabel
          control={
            <Switch
              checked={includeDeletedVersions}
              onChange={(event) => setIncludeDeletedVersions(event.target.checked)}
            />
          }
          label="삭제된 버전 포함"
          sx={{ mt: 2 }}
        />
        <Divider sx={{ mb: 2 }} />
        <Stack spacing={1.5} sx={{ overflowY: "auto" }}>
          {versions.map((version) => (
            <Paper
              key={version.id}
              variant="outlined"
              sx={{ p: 2, borderRadius: 2.5, opacity: version.is_deleted ? 0.58 : 1 }}
            >
              <Stack direction="row" justifyContent="space-between" gap={2}>
                <Stack spacing={0.5} sx={{ minWidth: 0 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography sx={{ fontWeight: 750 }}>v{version.version_no}</Typography>
                    {version.is_current && <Chip label="최신 편집" size="small" color="primary" />}
                    {version.is_published && <Chip label="제공 중" size="small" color="success" />}
                    <Chip label={version.report_template ? "템플릿" : "HTML 전체"} size="small" variant="outlined" />
                    {version.report_template?.simple_template && (
                      <Chip label="간소화 포함" size="small" color="info" variant="outlined" />
                    )}
                    {version.is_deleted && <Chip label="삭제됨" size="small" />}
                  </Stack>
                  <Typography noWrap>{version.title}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatDate(version.created_at)} · {version.created_by_name || `사용자 ${version.created_by}`}
                  </Typography>
                </Stack>
                <Stack direction="row" alignItems="center">
                  <Tooltip title="내용 보기">
                    <IconButton onClick={() => setViewVersion(version)} aria-label={`버전 ${version.version_no} 보기`}>
                      <VisibilityOutlinedIcon />
                    </IconButton>
                  </Tooltip>
                  {version.is_deleted ? (
                    <Tooltip title="삭제 취소">
                      <span>
                        <IconButton
                          onClick={() => handleRecoverVersion(version)}
                          disabled={working}
                          aria-label={`버전 ${version.version_no} 삭제 취소`}
                        >
                          <RestoreRoundedIcon />
                        </IconButton>
                      </span>
                    </Tooltip>
                  ) : (
                    <>
                      <Button size="small" disabled={working || selectedPrompt?.is_deleted}
                        onClick={() => {
                          setPublicationError("");
                          setPublication({
                            version,
                            is_new: Boolean(selectedPrompt?.is_new),
                            is_recently_updated: Boolean(selectedPrompt?.is_recently_updated),
                            is_simple_enabled: Boolean(selectedPrompt?.is_simple_enabled ?? true),
                            is_contract_application_enabled: Boolean(selectedPrompt?.is_contract_application_enabled),
                          });
                        }}>
                        {version.is_published ? "노출 설정" : "일반 사용자에게 제공"}
                      </Button>
                      {!version.is_current && (
                        <Tooltip title="이 내용으로 새 버전 생성">
                          <span>
                            <IconButton
                              onClick={() => setConfirmAction({ type: "restore-version", version })}
                              disabled={working || selectedPrompt?.is_deleted}
                              aria-label={`버전 ${version.version_no} 복원`}
                            >
                              <RestoreRoundedIcon />
                            </IconButton>
                          </span>
                        </Tooltip>
                      )}
                      <Tooltip title={(version.is_current || version.is_published) ? "최신 편집 또는 제공 중인 버전은 삭제할 수 없습니다" : "버전 삭제"}>
                        <span>
                          <IconButton
                            color="error"
                            onClick={() => setConfirmAction({ type: "delete-version", version })}
                            disabled={working || version.is_current || version.is_published}
                            aria-label={`버전 ${version.version_no} 삭제`}
                          >
                            <DeleteOutlineRoundedIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </>
                  )}
                </Stack>
              </Stack>
            </Paper>
          ))}
          {versions.length === 0 && (
            <Typography color="text.secondary" sx={{ py: 6, textAlign: "center" }}>
              표시할 버전이 없습니다.
            </Typography>
          )}
        </Stack>
      </Drawer>

      <Dialog open={Boolean(viewVersion)} onClose={() => setViewVersion(null)} fullWidth maxWidth="md">
        <DialogTitle>버전 {viewVersion?.version_no} · {viewVersion?.title}</DialogTitle>
        <DialogContent>
          <Box
            component="pre"
            sx={{
              m: 0,
              p: 2,
              bgcolor: "grey.50",
              borderRadius: 2,
              whiteSpace: "pre-wrap",
              overflowWrap: "anywhere",
              fontSize: 14,
              lineHeight: 1.65,
            }}
          >
            {viewVersion?.body}
          </Box>
          {viewVersion?.report_template && <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2">템플릿과 출력 데이터</Typography>
            {viewVersion.report_template.shell_version_id && <Typography variant="body2">
              공통 HTML #{viewVersion.report_template.shell_version_id} · 조립 규칙 v{viewVersion.report_template.assembly_version}
            </Typography>}
            {Object.entries({
              "유형별 HTML 템플릿": viewVersion.report_template.fragment_html,
              "HTML 템플릿": viewVersion.report_template.html,
              "출력 데이터 스키마": JSON.stringify(viewVersion.report_template.schema_document, null, 2),
              "템플릿 점검용 예시 데이터": viewVersion.report_template.example_data && JSON.stringify(viewVersion.report_template.example_data, null, 2),
            }).filter(([, value]) => value).map(([label, value]) => <details key={label}>
              <summary>{label}</summary>
              <Box component="pre" sx={{ overflow: "auto", maxHeight: 300 }}>{value}</Box>
            </details>)}
          </Box>}
          {viewVersion?.report_template?.simple_template && <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2">간소화 버전(simple/) 템플릿</Typography>
            {Object.entries({
              "간소화 프롬프트 본문": viewVersion.report_template.simple_template.body,
              "간소화 유형별 HTML 템플릿": viewVersion.report_template.simple_template.fragment_html,
              "간소화 HTML 템플릿": viewVersion.report_template.simple_template.html,
              "간소화 출력 데이터 스키마": JSON.stringify(viewVersion.report_template.simple_template.schema_document, null, 2),
              "간소화 점검용 예시 데이터": viewVersion.report_template.simple_template.example_data && JSON.stringify(viewVersion.report_template.simple_template.example_data, null, 2),
            }).filter(([, value]) => value).map(([label, value]) => <details key={label}>
              <summary>{label}</summary>
              <Box component="pre" sx={{ overflow: "auto", maxHeight: 300 }}>{value}</Box>
            </details>)}
          </Box>}
          {Boolean(viewVersion?.common_prompt_ids?.length) && (
            <Typography variant="body2" sx={{ mt: 2 }}>
              공통 프롬프트 적용 순서: {viewVersion.common_prompt_ids.map(id => commonPrompts.find(item => item.id === id)?.title || "삭제된 공통 프롬프트").join(" → ")}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewVersion(null)}>닫기</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={categoryPickerOpen}
        onClose={() => setCategoryPickerOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { m: { xs: 1.5, sm: 4 }, maxHeight: { xs: "calc(100% - 24px)", sm: "calc(100% - 64px)" } } }}
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
            <Box>
              <Typography variant="h6" component="div" fontWeight={800}>카테고리 선택</Typography>
              <Typography variant="caption" color="text.secondary">
                여러 카테고리를 선택할 수 있습니다.
              </Typography>
            </Box>
            <Chip size="small" color="primary" label={`${draft.category_ids.length}개 선택됨`} />
          </Stack>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          <Box sx={{ p: 1.5, borderBottom: 1, borderColor: "divider" }}>
            <TextField
              fullWidth
              size="small"
              placeholder="카테고리 검색"
              value={categorySearch}
              onChange={(event) => setCategorySearch(event.target.value)}
              autoFocus
            />
          </Box>

          <Box sx={{ px: 1.5, py: 1.25, bgcolor: "grey.50", borderBottom: 1, borderColor: "divider" }}>
            <Typography variant="caption" fontWeight={700} color="text.secondary">
              선택된 카테고리
            </Typography>
            <Stack direction="row" gap={0.75} flexWrap="wrap" sx={{ mt: 0.75, maxHeight: 72, overflowY: "auto" }}>
              {selectedCategoryOptions.map((option) => (
                <Chip
                  key={option.id}
                  size="small"
                  label={option.name}
                  onDelete={() => toggleDraftCategory(option.id, false)}
                />
              ))}
              {!selectedCategoryOptions.length && (
                <Typography variant="caption" color="text.secondary">
                  아래 목록에서 카테고리를 선택해 주세요.
                </Typography>
              )}
            </Stack>
          </Box>

          <Tabs
            value={categoryGroup}
            onChange={(_, value) => setCategoryGroup(value)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              minHeight: 40,
              borderBottom: 1,
              borderColor: "divider",
              "& .MuiTab-root": { minHeight: 40, py: 0.75 },
            }}
          >
            <Tab value="all" label="전체" />
            {categories.map((root) => (
              <Tab key={root.id} value={root.id} label={root.name} />
            ))}
          </Tabs>

          <Stack spacing={0.75} sx={{ p: 1.25, minHeight: 220, maxHeight: { xs: "42vh", sm: 360 }, overflowY: "auto" }}>
            {visibleCategoryOptions.map((option) => {
              const checked = draft.category_ids.includes(option.id);
              return (
                <Paper
                  key={option.id}
                  variant="outlined"
                  sx={{
                    borderColor: checked ? "primary.main" : "divider",
                    bgcolor: checked ? "primary.light" : "background.paper",
                    borderRadius: 2,
                  }}
                >
                  <FormControlLabel
                    control={(
                      <Checkbox
                        size="small"
                        checked={checked}
                        onChange={(event) => toggleDraftCategory(option.id, event.target.checked)}
                      />
                    )}
                    label={(
                      <Box sx={{ py: 0.75 }}>
                        <Typography variant="body2" fontWeight={checked ? 750 : 600}>
                          {option.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.parent_name}
                        </Typography>
                      </Box>
                    )}
                    sx={{ m: 0, px: 1, width: "100%" }}
                  />
                </Paper>
              );
            })}
            {!visibleCategoryOptions.length && (
              <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
                일치하는 카테고리가 없습니다.
              </Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 2, py: 1.5 }}>
          <Button
            color="inherit"
            disabled={!draft.category_ids.length}
            onClick={() => setDraft((current) => ({ ...current, category_ids: [] }))}
          >
            초기화
          </Button>
          <Box sx={{ flex: 1 }} />
          <Button variant="contained" onClick={() => setCategoryPickerOpen(false)}>
            선택 완료
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={reportFolderInput !== null} onClose={() => !working && setReportFolderInput(null)} fullWidth maxWidth="xs">
        <DialogTitle>보고서 동기화 폴더</DialogTitle>
        <DialogContent>
          {reportFolderError && <Alert severity="error" sx={{ mb: 1 }}>{reportFolderError}</Alert>}
          <TextField
            autoFocus
            fullWidth
            margin="dense"
            label="빌더 폴더명"
            value={reportFolderInput ?? ""}
            onChange={(event) => setReportFolderInput(event.target.value)}
            inputProps={{ maxLength: 64 }}
            disabled={working}
            helperText="같은 폴더를 여러 프롬프트에 연결할 수 있습니다. 동기화하면 연결된 각 프롬프트에 폴더 내용이 반영됩니다. 비워 두고 저장하면 이 프롬프트의 연결만 해제합니다."
          />
        </DialogContent>
        <DialogActions>
          <Button disabled={working} onClick={() => setReportFolderInput(null)}>취소</Button>
          <Button variant="contained" disabled={working} onClick={saveReportMapping}>저장</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(publication)} onClose={() => !working && setPublication(null)} fullWidth maxWidth="xs">
        <DialogTitle>제공 버전과 홈 노출</DialogTitle>
        <DialogContent>
          {publicationError && <Alert severity="error" sx={{ mb: 1 }}>{publicationError}</Alert>}
          <DialogContentText>
            {versions.find((version) => version.is_published)
              ? `v${versions.find((version) => version.is_published).version_no} (${versions.find((version) => version.is_published).report_template ? "템플릿" : "HTML 전체"})`
              : "미제공"}
            {" → "}v{publication?.version.version_no} ({publication?.version.report_template ? "템플릿" : "HTML 전체"})
          </DialogContentText>
          <Stack>
            <FormControlLabel label="새로 나온 보고서에 노출" control={<Checkbox checked={Boolean(publication?.is_new)}
              disabled={working} onChange={(e) => setPublication((current) => ({ ...current, is_new: e.target.checked }))} />} />
            <FormControlLabel label="최근 업데이트된 보고서에 노출" control={<Checkbox checked={Boolean(publication?.is_recently_updated)}
              disabled={working} onChange={(e) => setPublication((current) => ({ ...current, is_recently_updated: e.target.checked }))} />} />
            <FormControlLabel label="보고서 리스트 '청약' 버튼 노출" control={<Checkbox checked={Boolean(publication?.is_contract_application_enabled)}
              disabled={working} onChange={(e) => setPublication((current) => ({ ...current, is_contract_application_enabled: e.target.checked }))} />} />
            {Boolean(publication?.version?.report_template?.simple_template) && (
              <FormControlLabel label="간소화 버전 함께 노출" control={<Checkbox checked={Boolean(publication?.is_simple_enabled ?? true)}
                disabled={working} onChange={(e) => setPublication((current) => ({ ...current, is_simple_enabled: e.target.checked }))} />} />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button disabled={working} onClick={() => setPublication(null)}>취소</Button>
          <Button disabled={working} variant="contained" onClick={applyPublication}>적용</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(confirmAction)} onClose={() => setConfirmAction(null)}>
        <DialogTitle>
          {confirmAction?.type === "delete-prompt"
            ? "프롬프트를 삭제할까요?"
            : confirmAction?.type === "delete-version"
              ? `버전 ${confirmAction?.version?.version_no}을 삭제할까요?`
              : `버전 ${confirmAction?.version?.version_no}을 복원할까요?`}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirmAction?.type === "restore-version"
              ? "선택한 버전의 내용으로 새 버전이 생성됩니다. 기존 이력은 유지됩니다."
              : "삭제 플래그만 변경되며 나중에 다시 복구할 수 있습니다."}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmAction(null)}>취소</Button>
          <Button
            color={confirmAction?.type === "restore-version" ? "primary" : "error"}
            variant="contained"
            onClick={runConfirmedAction}
          >
            {confirmAction?.type === "restore-version" ? "복원" : "삭제"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default PromptsPage;
