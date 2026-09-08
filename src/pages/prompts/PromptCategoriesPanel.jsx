import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  List,
  ListItemButton,
  ListItemText,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import SubdirectoryArrowRightRoundedIcon from "@mui/icons-material/SubdirectoryArrowRightRounded";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  createPromptCategory,
  deletePromptCategory,
  getPromptCategories,
  updatePromptCategory,
} from "@/services/prompt-service";


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
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const nameInputRef = useRef(null);

  const flatCategories = useMemo(
    () => categories.flatMap((root) => [root, ...root.children]),
    [categories],
  );
  const selected = flatCategories.find((item) => item.id === selectedId) || null;
  const isNew = selectedId === "new";
  const newParentId = isNew && draft.parent_id ? Number(draft.parent_id) : null;
  const isChildForm = isNew
    ? Boolean(draft.parent_id)
    : selected ? selected.parent_id !== null : false;

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

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={1.5}>
        <Box>
          <Typography variant="h6" fontWeight={800}>카테고리 관리</Typography>
          <Typography color="text.secondary" variant="body2">
            대분류와 소분류의 2단 구조로 관리합니다.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button startIcon={<AddRoundedIcon />} onClick={() => startNew("")}>대분류 추가</Button>
          <Button
            variant="contained"
            startIcon={<SubdirectoryArrowRightRoundedIcon />}
            disabled={!selected || selected.parent_id !== null}
            onClick={() => startNew(selected.id)}
          >
            소분류 추가
          </Button>
        </Stack>
      </Stack>

      {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "360px minmax(0, 1fr)" }, gap: 2 }}>
        <Paper variant="outlined" sx={{ borderRadius: 3, overflow: "hidden" }}>
          <Typography fontWeight={750} sx={{ px: 2, py: 1.5 }}>분류 목록</Typography>
          <Divider />
          {loading ? (
            <Box sx={{ py: 8, display: "grid", placeItems: "center" }}><CircularProgress size={28} /></Box>
          ) : (
            <List disablePadding>
              {isNew && newParentId === null && (
                <ListItemButton selected>
                  <ListItemText primary="새 카테고리" secondary="새 대분류 · 저장 전" />
                </ListItemButton>
              )}
              {categories.map((root) => (
                <Box key={root.id}>
                  <ListItemButton selected={selectedId === root.id} onClick={() => selectCategory(root)}>
                    <ListItemText
                      primary={<Typography fontWeight={750}>{root.name} (#{root.sort_order})</Typography>}
                      secondary={`소분류 ${root.child_count}개`}
                    />
                  </ListItemButton>
                  {root.children.map((child) => (
                    <ListItemButton
                      key={child.id}
                      selected={selectedId === child.id}
                      onClick={() => selectCategory(child)}
                      sx={{ pl: 4 }}
                    >
                      <ListItemText primary={`${child.name} (#${child.sort_order})`} secondary={`프롬프트 ${child.prompt_count}개`} />
                    </ListItemButton>
                  ))}
                  {isNew && newParentId === root.id && (
                    <ListItemButton selected sx={{ pl: 4 }}>
                      <ListItemText primary="새 카테고리" secondary="새 소분류 · 저장 전" />
                    </ListItemButton>
                  )}
                </Box>
              ))}
              {!isNew && !categories.length && (
                <Typography color="text.secondary" variant="body2" sx={{ p: 3, textAlign: "center" }}>
                  등록된 카테고리가 없습니다.
                </Typography>
              )}
            </List>
          )}
        </Paper>

        <Paper variant="outlined" sx={{ borderRadius: 3, p: { xs: 2, md: 3 } }}>
          {selectedId ? (
            <Stack spacing={2.5}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="h6" fontWeight={750}>{isNew ? "새 카테고리" : selected.name}</Typography>
                  {!isNew && <Chip size="small" label={selected.parent_id ? "소분류" : "대분류"} />}
                </Stack>
                <Stack direction="row" spacing={1}>
                  {!isNew && (
                    <Button color="error" variant="outlined" startIcon={<DeleteOutlineRoundedIcon />} onClick={remove} disabled={working}>
                      삭제
                    </Button>
                  )}
                  <Button variant="contained" startIcon={<SaveRoundedIcon />} onClick={save} disabled={working}>
                    저장
                  </Button>
                </Stack>
              </Stack>
              <TextField
                inputRef={nameInputRef}
                label="카테고리명"
                value={draft.name}
                onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                inputProps={{ maxLength: 100 }}
              />
              {isChildForm && (
                <TextField
                  select
                  label="상위 대분류"
                  value={draft.parent_id}
                  onChange={(event) => setDraft({ ...draft, parent_id: event.target.value })}
                >
                  {categories.map((root) => <MenuItem key={root.id} value={root.id}>{root.name}</MenuItem>)}
                </TextField>
              )}
              {isNew ? (
                <Alert severity="info">새 카테고리는 선택한 분류의 마지막 순서로 추가됩니다.</Alert>
              ) : (
                <TextField
                  type="number"
                  label="정렬 순서"
                  value={draft.sort_order}
                  inputProps={{ min: 1 }}
                  onChange={(event) => setDraft({ ...draft, sort_order: event.target.value })}
                  helperText="위치를 바꾸면 같은 단계의 카테고리가 자동으로 밀리고 1번부터 다시 정렬됩니다."
                />
              )}
              <Typography variant="caption" color="text.secondary">
                대분류와 각 대분류의 소분류는 서로 독립적으로 정렬됩니다. 프롬프트에는 소분류만 연결할 수 있습니다.
              </Typography>
            </Stack>
          ) : (
            <Box sx={{ py: 10, textAlign: "center" }}><Typography color="text.secondary">카테고리를 추가해 주세요.</Typography></Box>
          )}
        </Paper>
      </Box>
    </Stack>
  );
}

export default PromptCategoriesPanel;
