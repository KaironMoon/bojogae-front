import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ArrowDownwardRoundedIcon from "@mui/icons-material/ArrowDownwardRounded";
import ArrowUpwardRoundedIcon from "@mui/icons-material/ArrowUpwardRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import DragIndicatorRoundedIcon from "@mui/icons-material/DragIndicatorRounded";
import FolderOpenRoundedIcon from "@mui/icons-material/FolderOpenRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import SubdirectoryArrowRightRoundedIcon from "@mui/icons-material/SubdirectoryArrowRightRounded";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  createPromptCategory,
  deletePromptCategory,
  getPromptCategories,
  updatePromptCategory,
} from "@/services/prompt-service";
import { brand } from "@/styles/palette";

const EMPTY_DRAFT = { name: "", parent_id: "", sort_order: 0 };

function errorMessage(error) {
  const detail = error?.response?.data?.detail;
  const messages = {
    category_name_exists: "같은 위치에 동일한 이름의 카테고리가 있습니다.",
    category_has_children: "하위 카테고리가 있어 삭제할 수 없습니다.",
    category_in_use: "프롬프트에서 사용 중인 카테고리는 삭제할 수 없습니다.",
    category_depth_exceeded: "카테고리는 대분류와 소분류까지만 만들 수 있습니다.",
    category_with_children_must_be_root: "하위 항목이 있는 대분류는 소분류로 이동할 수 없습니다.",
    category_in_use_must_remain_child: "프롬프트에서 사용 중인 소분류는 대분류로 변경할 수 없습니다.",
  };
  return messages[detail] || "카테고리 요청을 처리하지 못했습니다.";
}

function PromptCategoriesPanel() {
  const [categories, setCategories] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [searchQuery, setSearchQuery] = useState("");
  const [dragItem, setDragItem] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const nameInputRef = useRef(null);

  const flatCategories = useMemo(
    () => categories.flatMap((root) => [root, ...root.children]),
    [categories],
  );
  const totalChildCount = useMemo(
    () => categories.reduce((sum, root) => sum + root.children.length, 0),
    [categories],
  );

  const keyword = searchQuery.trim().toLocaleLowerCase("ko-KR");
  const isSearching = Boolean(keyword);
  const filteredCategories = useMemo(() => {
    if (!keyword) return categories;
    return categories
      .map((root) => {
        const rootMatches = root.name.toLocaleLowerCase("ko-KR").includes(keyword);
        const matchingChildren = root.children.filter((child) =>
          child.name.toLocaleLowerCase("ko-KR").includes(keyword),
        );
        if (rootMatches) return root;
        if (matchingChildren.length > 0) return { ...root, children: matchingChildren };
        return null;
      })
      .filter(Boolean);
  }, [categories, keyword]);

  const selected = flatCategories.find((item) => item.id === selectedId) || null;
  const selectedParent = selected?.parent_id
    ? categories.find((root) => root.id === selected.parent_id) || null
    : null;
  const isNew = selectedId === "new";
  const newParentId = isNew && draft.parent_id ? Number(draft.parent_id) : null;
  const isChildForm = isNew
    ? Boolean(draft.parent_id)
    : selected ? selected.parent_id !== null : false;

  const siblings = useMemo(() => {
    if (isNew || !selected) return [];
    if (selected.parent_id == null) return categories;
    return categories.find((root) => root.id === selected.parent_id)?.children || [];
  }, [categories, isNew, selected]);
  const siblingIndex = selected && !isNew
    ? siblings.findIndex((item) => item.id === selected.id)
    : -1;

  const loadCategories = useCallback(async (
    preferredId = selectedId,
    nextParentId = "",
  ) => {
    setLoading(true);
    setError("");
    try {
      const rows = await getPromptCategories();
      setCategories(rows);
      if (preferredId === "new") {
        setSelectedId("new");
        setDraft({ ...EMPTY_DRAFT, parent_id: nextParentId });
        return;
      }
      const flat = rows.flatMap((root) => [root, ...root.children]);
      const next = flat.find((item) => item.id === preferredId) || flat[0] || null;
      if (next) {
        setSelectedId(next.id);
        setDraft({
          name: next.name,
          parent_id: next.parent_id || "",
          sort_order: next.sort_order,
        });
      } else if (preferredId !== "new") {
        setSelectedId(null);
        setDraft(EMPTY_DRAFT);
      }
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

  useEffect(() => {
    loadCategories(null);
    // 최초 진입 시 한 번만 조회한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectCategory = (category) => {
    setSelectedId(category.id);
    setDraft({
      name: category.name,
      parent_id: category.parent_id || "",
      sort_order: category.sort_order,
    });
    setError("");
  };

  const startNew = (parentId = "") => {
    setSelectedId("new");
    setDraft({ ...EMPTY_DRAFT, parent_id: parentId });
    setError("");
    window.requestAnimationFrame(() => nameInputRef.current?.focus());
  };

  const save = async () => {
    if (!draft.name.trim()) {
      setError("카테고리 이름을 입력해 주세요.");
      return;
    }
    setWorking(true);
    setError("");
    const payload = {
      name: draft.name.trim(),
      parent_id: draft.parent_id ? Number(draft.parent_id) : null,
      sort_order: Number(draft.sort_order) || 0,
    };
    try {
      const saved = isNew
        ? await createPromptCategory(payload)
        : await updatePromptCategory(selected.id, payload);
      if (isNew) {
        await loadCategories("new", payload.parent_id || "");
        window.requestAnimationFrame(() => nameInputRef.current?.focus());
      } else {
        await loadCategories(saved.id);
      }
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setWorking(false);
    }
  };

  const moveCategory = async (category, targetOrder, targetParentId = category.parent_id ?? null) => {
    setWorking(true);
    setError("");
    try {
      await updatePromptCategory(category.id, {
        name: category.name,
        parent_id: targetParentId,
        sort_order: targetOrder,
      });
      await loadCategories(category.id);
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setWorking(false);
    }
  };

  const clearDragState = () => {
    setDragItem(null);
    setDropTarget(null);
  };

  const handleRootDragStart = (event, root) => {
    if (working || isSearching) {
      event.preventDefault();
      return;
    }
    if (event.target instanceof Element && event.target.closest("button, input, textarea, a")) {
      event.preventDefault();
      return;
    }
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", `root:${root.id}`);
    setDragItem({ type: "root", id: root.id });
  };

  const handleRootDragOver = (event, root) => {
    if (working || isSearching || !dragItem) return;
    if (
      (dragItem.type === "root" && dragItem.id !== root.id)
      || (dragItem.type === "child" && dragItem.parentId !== root.id)
    ) {
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      if (dropTarget?.type !== "root" || dropTarget?.id !== root.id) {
        setDropTarget({ type: "root", id: root.id });
      }
    }
  };

  const handleRootDrop = (event, root, rootIndex) => {
    if (working || isSearching || !dragItem) return;
    event.preventDefault();
    const active = dragItem;
    clearDragState();
    if (active.type === "root" && active.id !== root.id) {
      const draggedRoot = categories.find((item) => item.id === active.id);
      if (draggedRoot) moveCategory(draggedRoot, rootIndex + 1, null);
    } else if (active.type === "child" && active.parentId !== root.id) {
      const draggedChild = flatCategories.find((item) => item.id === active.id);
      if (draggedChild) moveCategory(draggedChild, root.children.length + 1, root.id);
    }
  };

  const handleChildDragStart = (event, child, parentId) => {
    event.stopPropagation();
    if (working || isSearching) {
      event.preventDefault();
      return;
    }
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", `child:${child.id}`);
    setDragItem({ type: "child", id: child.id, parentId });
  };

  const handleChildDragOver = (event, child, parentId) => {
    if (working || isSearching || dragItem?.type !== "child" || dragItem.id === child.id) return;
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = "move";
    if (dropTarget?.type !== "child" || dropTarget?.id !== child.id) {
      setDropTarget({ type: "child", id: child.id, parentId });
    }
  };

  const handleChildDrop = (event, child, childIndex, parentId) => {
    if (working || isSearching || dragItem?.type !== "child" || dragItem.id === child.id) return;
    event.preventDefault();
    event.stopPropagation();
    const active = dragItem;
    clearDragState();
    const draggedChild = flatCategories.find((item) => item.id === active.id);
    if (draggedChild) {
      moveCategory(draggedChild, childIndex + 1, parentId);
    }
  };

  const remove = async () => {
    if (!selected || !window.confirm(`'${selected.name}' 카테고리를 삭제할까요?`)) return;
    setWorking(true);
    setError("");
    try {
      await deletePromptCategory(selected.id);
      await loadCategories(null);
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setWorking(false);
    }
  };

  const editorTypeLabel = isNew
    ? (isChildForm ? "새 소분류" : "새 대분류")
    : (selected?.parent_id ? "소분류" : "대분류");
  const editorTitle = isNew
    ? (isChildForm ? "새 소분류" : "새 대분류")
    : (selected?.name || "");
  const newParentName = newParentId
    ? categories.find((root) => root.id === newParentId)?.name
    : null;

  return (
    <Stack spacing={2}>
      {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1.35fr) minmax(320px, 1fr)" },
          gap: 2.5,
          alignItems: "start",
        }}
      >
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
            gap={1.5}
            sx={{
              px: 2,
              py: 1.5,
              bgcolor: "#F8FAFC",
              borderBottom: 1,
              borderColor: "divider",
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <FolderOpenRoundedIcon color="primary" fontSize="small" />
              <Typography variant="subtitle1" fontWeight={800}>카테고리 구조</Typography>
              <Chip size="small" label={`대분류 ${categories.length}개`} variant="outlined" />
              <Chip size="small" color="primary" variant="outlined" label={`소분류 ${totalChildCount}개`} />
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <TextField
                size="small"
                placeholder="카테고리 검색"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                inputProps={{ "aria-label": "카테고리 검색" }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchRoundedIcon fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery ? (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        aria-label="검색어 지우기"
                        onClick={() => setSearchQuery("")}
                      >
                        <CloseRoundedIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                }}
                sx={{
                  width: { xs: "100%", sm: 190 },
                  bgcolor: "background.paper",
                  "& .MuiInputBase-input": { py: 0.7, fontSize: 13 },
                }}
              />
              <Button
                variant="contained"
                size="small"
                startIcon={<AddRoundedIcon />}
                onClick={() => startNew("")}
                disabled={working}
              >
                대분류 추가
              </Button>
            </Stack>
          </Stack>

          <Box sx={{ p: 1.75 }}>
            {loading ? (
              <Box sx={{ py: 8, display: "grid", placeItems: "center" }}>
                <CircularProgress size={28} />
              </Box>
            ) : (
              <Stack spacing={1.5}>
                <Typography variant="caption" color="text.secondary" sx={{ px: 0.25 }}>
                  {isSearching
                    ? "검색어를 지우면 드래그앤드롭으로 순서를 변경할 수 있습니다."
                    : "대분류 카드나 소분류 항목을 드래그해서 순서를 바꾸거나 다른 대분류로 이동할 수 있습니다."}
                </Typography>
                {isNew && newParentId === null && (
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 1.75,
                      borderRadius: "14px",
                      borderStyle: "dashed",
                      borderWidth: 2,
                      borderColor: "primary.main",
                      bgcolor: "primary.light",
                    }}
                  >
                    <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
                      <Stack direction="row" alignItems="center" gap={1}>
                        <Chip size="small" color="primary" label="작성 중" />
                        <Typography fontWeight={800}>
                          {draft.name.trim() || "새 대분류"}
                        </Typography>
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        오른쪽 패널에서 이름 입력 후 저장하세요
                      </Typography>
                    </Stack>
                  </Paper>
                )}

                {filteredCategories.map((root, rootIndex) => {
                  const rootSelected = selectedId === root.id;
                  const childInRootSelected = root.children.some((child) => child.id === selectedId)
                    || (isNew && newParentId === root.id);
                  const isDraggingRoot = dragItem?.type === "root" && dragItem.id === root.id;
                  const isRootDropTarget = dropTarget?.type === "root" && dropTarget.id === root.id;
                  return (
                    <Paper
                      key={root.id}
                      variant="outlined"
                      draggable={!working && !isSearching}
                      onDragStart={(event) => handleRootDragStart(event, root)}
                      onDragOver={(event) => handleRootDragOver(event, root)}
                      onDragLeave={(event) => {
                        if (!event.currentTarget.contains(event.relatedTarget)
                          && dropTarget?.type === "root" && dropTarget?.id === root.id) {
                          setDropTarget(null);
                        }
                      }}
                      onDrop={(event) => handleRootDrop(event, root, rootIndex)}
                      onDragEnd={clearDragState}
                      sx={{
                        borderRadius: "14px",
                        overflow: "hidden",
                        borderWidth: rootSelected || isRootDropTarget ? 2 : 1,
                        borderColor: isRootDropTarget
                          ? brand.accent
                          : rootSelected
                            ? "primary.main"
                            : childInRootSelected
                              ? brand.accent
                              : "divider",
                        boxShadow: isRootDropTarget ? "0 0 0 2px rgba(3, 199, 90, 0.35)" : "none",
                        opacity: isDraggingRoot ? 0.45 : 1,
                        transition: "border-color 120ms ease, box-shadow 120ms ease, opacity 120ms ease",
                      }}
                    >
                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        alignItems={{ xs: "stretch", sm: "center" }}
                        justifyContent="space-between"
                        gap={1}
                        onClick={() => selectCategory(root)}
                        sx={{
                          px: 1.75,
                          py: 1.25,
                          cursor: working || isSearching ? "pointer" : "grab",
                          bgcolor: rootSelected ? "primary.light" : "background.paper",
                          "&:hover": rootSelected ? undefined : { bgcolor: "#FAFCFB" },
                        }}
                      >
                        <Stack direction="row" alignItems="center" gap={1} sx={{ minWidth: 0, flexWrap: "wrap" }}>
                          {!isSearching && (
                            <DragIndicatorRoundedIcon
                              fontSize="small"
                              sx={{ color: "text.disabled", flexShrink: 0, ml: -0.5 }}
                            />
                          )}
                          <Chip
                            size="small"
                            label={`#${root.sort_order}`}
                            variant="outlined"
                            sx={{ height: 22, fontWeight: 750, bgcolor: "background.paper" }}
                          />
                          <Typography fontWeight={800} sx={{ overflowWrap: "anywhere" }}>
                            {root.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            소분류 {root.child_count}개
                          </Typography>
                        </Stack>

                        <Stack
                          direction="row"
                          spacing={0.5}
                          alignItems="center"
                          flexShrink={0}
                          onClick={(event) => event.stopPropagation()}
                        >
                          <Tooltip title={isSearching ? "검색 중에는 순서를 바꿀 수 없습니다" : "위로 이동"}>
                            <span>
                              <IconButton
                                size="small"
                                aria-label={`${root.name} 위로 이동`}
                                disabled={working || isSearching || rootIndex === 0}
                                onClick={() => moveCategory(root, rootIndex)}
                              >
                                <ArrowUpwardRoundedIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title={isSearching ? "검색 중에는 순서를 바꿀 수 없습니다" : "아래로 이동"}>
                            <span>
                              <IconButton
                                size="small"
                                aria-label={`${root.name} 아래로 이동`}
                                disabled={working || isSearching || rootIndex === filteredCategories.length - 1}
                                onClick={() => moveCategory(root, rootIndex + 2)}
                              >
                                <ArrowDownwardRoundedIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<AddRoundedIcon />}
                            disabled={working}
                            onClick={() => startNew(root.id)}
                          >
                            소분류 추가
                          </Button>
                        </Stack>
                      </Stack>

                      <Box
                        sx={{
                          px: 1.75,
                          py: 1.25,
                          borderTop: 1,
                          borderColor: "divider",
                          bgcolor: "#FAFBFC",
                        }}
                      >
                        {root.children.length > 0 || (isNew && newParentId === root.id) ? (
                          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                            {root.children.map((child, childIndex) => {
                              const selectedChild = selectedId === child.id;
                              const isDraggingChild = dragItem?.type === "child" && dragItem.id === child.id;
                              const isChildDropTarget = dropTarget?.type === "child" && dropTarget.id === child.id;
                              return (
                                <Box
                                  key={child.id}
                                  role="button"
                                  tabIndex={0}
                                  draggable={!working && !isSearching}
                                  onDragStart={(event) => handleChildDragStart(event, child, root.id)}
                                  onDragOver={(event) => handleChildDragOver(event, child, root.id)}
                                  onDragLeave={(event) => {
                                    if (!event.currentTarget.contains(event.relatedTarget)
                                      && dropTarget?.type === "child" && dropTarget?.id === child.id) {
                                      setDropTarget(null);
                                    }
                                  }}
                                  onDrop={(event) => handleChildDrop(event, child, childIndex, root.id)}
                                  onDragEnd={(event) => {
                                    event.stopPropagation();
                                    clearDragState();
                                  }}
                                  onClick={() => selectCategory(child)}
                                  onKeyDown={(event) => {
                                    if (event.key === "Enter" || event.key === " ") {
                                      event.preventDefault();
                                      selectCategory(child);
                                    }
                                  }}
                                  sx={{
                                    appearance: "none",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 0.75,
                                    px: 1.25,
                                    py: 0.6,
                                    minHeight: 34,
                                    borderRadius: "10px",
                                    border: "1px solid",
                                    borderColor: isChildDropTarget
                                      ? brand.accent
                                      : selectedChild
                                        ? brand.accentInk
                                        : "#DCE2E8",
                                    bgcolor: selectedChild ? brand.accentInk : "#FFFFFF",
                                    color: selectedChild ? "#FFFFFF" : "text.primary",
                                    fontFamily: "inherit",
                                    fontSize: 13,
                                    cursor: working || isSearching ? "pointer" : "grab",
                                    opacity: isDraggingChild ? 0.45 : 1,
                                    boxShadow: isChildDropTarget
                                      ? "0 0 0 2px rgba(3, 199, 90, 0.35)"
                                      : selectedChild
                                        ? "0 1px 3px rgba(0, 110, 67, 0.24)"
                                        : "none",
                                    transition: "background-color 120ms ease, border-color 120ms ease, color 120ms ease, box-shadow 120ms ease, opacity 120ms ease",
                                    "&:hover": {
                                      bgcolor: selectedChild ? brand.deep : brand.tint,
                                      borderColor: selectedChild ? brand.deep : brand.accent,
                                      color: selectedChild ? "#FFFFFF" : brand.accentInk,
                                    },
                                    "&:focus-visible": {
                                      outline: `2px solid ${brand.accentInk}`,
                                      outlineOffset: 2,
                                    },
                                  }}
                                >
                                  {!isSearching && (
                                    <DragIndicatorRoundedIcon sx={{ fontSize: 15, opacity: 0.6, ml: -0.35 }} />
                                  )}
                                  <Box
                                    component="span"
                                    sx={{
                                      fontSize: 11,
                                      fontWeight: 700,
                                      opacity: selectedChild ? 0.85 : 0.65,
                                    }}
                                  >
                                    #{child.sort_order}
                                  </Box>
                                  <Box component="span" sx={{ fontWeight: 700 }}>
                                    {child.name}
                                  </Box>
                                  <Box
                                    component="span"
                                    sx={{
                                      px: 0.7,
                                      py: 0.15,
                                      borderRadius: 99,
                                      fontSize: 11,
                                      fontWeight: 750,
                                      bgcolor: selectedChild ? "rgba(255,255,255,0.2)" : "#F1F5F9",
                                      color: selectedChild ? "#FFFFFF" : "text.secondary",
                                    }}
                                  >
                                    {child.prompt_count}개
                                  </Box>
                                </Box>
                              );
                            })}

                            {isNew && newParentId === root.id && (
                              <Box
                                sx={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 0.75,
                                  px: 1.25,
                                  py: 0.6,
                                  minHeight: 34,
                                  borderRadius: "10px",
                                  border: "1.5px dashed",
                                  borderColor: "primary.main",
                                  bgcolor: "primary.light",
                                  color: brand.accentInk,
                                  fontSize: 13,
                                  fontWeight: 750,
                                }}
                              >
                                {draft.name.trim() || "새 소분류"} (작성 중)
                              </Box>
                            )}
                          </Box>
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            등록된 소분류가 없습니다. 상단 &lsquo;소분류 추가&rsquo; 버튼으로 추가해 보세요.
                          </Typography>
                        )}
                      </Box>
                    </Paper>
                  );
                })}

                {!isNew && filteredCategories.length === 0 && (
                  <Typography color="text.secondary" variant="body2" sx={{ py: 5, textAlign: "center" }}>
                    {categories.length === 0
                      ? "등록된 카테고리가 없습니다."
                      : "검색어와 일치하는 카테고리가 없습니다."}
                  </Typography>
                )}
              </Stack>
            )}
          </Box>
        </Paper>

        <Paper
          variant="outlined"
          sx={{
            borderRadius: "16px",
            overflow: "hidden",
            position: { lg: "sticky" },
            top: { lg: 16 },
            boxShadow: "0 1px 3px rgba(15, 23, 42, 0.05)",
          }}
        >
          {selectedId ? (
            <Box>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                gap={1.5}
                sx={{
                  px: 2.5,
                  py: 1.75,
                  bgcolor: "#F8FAFC",
                  borderBottom: 1,
                  borderColor: "divider",
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                    <Chip
                      size="small"
                      color={isNew ? "primary" : "default"}
                      variant={isNew ? "filled" : "outlined"}
                      label={editorTypeLabel}
                    />
                    <Typography variant="h6" fontWeight={800} sx={{ overflowWrap: "anywhere" }}>
                      {editorTitle}
                    </Typography>
                  </Stack>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.35 }}>
                    {isNew
                      ? (newParentName ? `${newParentName} 하위 소분류 추가` : "새 대분류 추가")
                      : isChildForm
                        ? `${selectedParent?.name || "대분류"} > ${selected.name} · 연결된 프롬프트 ${selected.prompt_count}개`
                        : `하위 소분류 ${selected.child_count}개 · 정렬 #${selected.sort_order}`}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1} flexShrink={0}>
                  {!isNew && (
                    <Button
                      color="error"
                      variant="outlined"
                      size="small"
                      startIcon={<DeleteOutlineRoundedIcon />}
                      onClick={remove}
                      disabled={working}
                    >
                      삭제
                    </Button>
                  )}
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<SaveRoundedIcon />}
                    onClick={save}
                    disabled={working}
                  >
                    저장
                  </Button>
                </Stack>
              </Stack>

              <Stack spacing={2.25} sx={{ p: 2.5 }}>
                <TextField
                  size="small"
                  inputRef={nameInputRef}
                  label="카테고리명"
                  value={draft.name}
                  onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !working) {
                      event.preventDefault();
                      save();
                    }
                  }}
                  inputProps={{ maxLength: 100 }}
                  fullWidth
                />

                {isChildForm && (
                  <TextField
                    select
                    size="small"
                    label="상위 대분류"
                    value={draft.parent_id}
                    onChange={(event) => setDraft({ ...draft, parent_id: event.target.value })}
                    fullWidth
                  >
                    {categories.map((root) => (
                      <MenuItem key={root.id} value={root.id}>{root.name}</MenuItem>
                    ))}
                  </TextField>
                )}

                {isNew ? (
                  <Alert severity="info">
                    새 카테고리는 선택한 분류의 마지막 순서로 추가됩니다. 저장 후 바로 다음 카테고리를 연속으로 추가할 수 있습니다.
                  </Alert>
                ) : (
                  <>
                    <Stack direction="row" spacing={1} alignItems="flex-start">
                      <TextField
                        size="small"
                        type="number"
                        label="정렬 순서"
                        value={draft.sort_order}
                        inputProps={{ min: 1 }}
                        onChange={(event) => setDraft({ ...draft, sort_order: event.target.value })}
                        helperText="위치를 바꾸면 같은 단계의 카테고리가 자동으로 밀리고 1번부터 다시 정렬됩니다."
                        fullWidth
                      />
                      <Stack direction="row" spacing={0.5} sx={{ pt: 0.4, flexShrink: 0 }}>
                        <Tooltip title="앞 순서로 이동">
                          <span>
                            <IconButton
                              size="small"
                              aria-label="앞 순서로 이동"
                              disabled={working || siblingIndex <= 0}
                              onClick={() => moveCategory(selected, siblingIndex)}
                              sx={{ border: 1, borderColor: "divider", borderRadius: 2 }}
                            >
                              <ArrowUpwardRoundedIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="뒤 순서로 이동">
                          <span>
                            <IconButton
                              size="small"
                              aria-label="뒤 순서로 이동"
                              disabled={working || siblingIndex === -1 || siblingIndex >= siblings.length - 1}
                              onClick={() => moveCategory(selected, siblingIndex + 2)}
                              sx={{ border: 1, borderColor: "divider", borderRadius: 2 }}
                            >
                              <ArrowDownwardRoundedIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Stack>
                    </Stack>

                    {!isChildForm && (
                      <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2.5, bgcolor: "#FAFBFC" }}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
                          <Typography variant="body2" fontWeight={700}>
                            하위 소분류 관리
                          </Typography>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<SubdirectoryArrowRightRoundedIcon />}
                            onClick={() => startNew(selected.id)}
                            disabled={working}
                          >
                            이 대분류에 소분류 추가
                          </Button>
                        </Stack>
                      </Paper>
                    )}

                    {(selected.child_count > 0 || selected.prompt_count > 0) && (
                      <Alert severity="info">
                        {selected.child_count > 0
                          ? `하위 소분류가 ${selected.child_count}개 있어 대분류를 바로 삭제할 수 없습니다.`
                          : `이 소분류에 프롬프트 ${selected.prompt_count}개가 연결되어 있어 바로 삭제할 수 없습니다.`}
                      </Alert>
                    )}
                  </>
                )}

                <Typography variant="caption" color="text.secondary">
                  대분류와 각 대분류의 소분류는 서로 독립적으로 정렬됩니다. 프롬프트에는 소분류만 연결할 수 있습니다.
                </Typography>
              </Stack>
            </Box>
          ) : (
            <Box sx={{ py: 10, px: 3, textAlign: "center" }}>
              <Typography color="text.secondary" sx={{ mb: 2 }}>
                카테고리를 선택하거나 대분류를 추가해 주세요.
              </Typography>
              <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => startNew("")}>
                대분류 추가
              </Button>
            </Box>
          )}
        </Paper>
      </Box>
    </Stack>
  );
}

export default PromptCategoriesPanel;
