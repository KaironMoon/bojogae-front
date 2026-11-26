import ArrowDownwardRoundedIcon from "@mui/icons-material/ArrowDownwardRounded";
import ArrowUpwardRoundedIcon from "@mui/icons-material/ArrowUpwardRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import DragIndicatorRoundedIcon from "@mui/icons-material/DragIndicatorRounded";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import NorthWestRoundedIcon from "@mui/icons-material/NorthWestRounded";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import {
  Alert,
  Box,
  Button,
  Chip,
  Collapse,
  Divider,
  IconButton,
  Paper,
  Popover,
  Stack,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useRef, useState } from "react";

import { BADGE_TONE_STYLES, MenuBadge, MenuIcon } from "@/pages/components/layout/userMenuIcons";
import {
  BADGE_PRESETS,
  BADGE_TONES,
  DEFAULT_USER_MENU_ITEMS,
  hasMenuChanges,
  isChildEligibleForUser,
  isMenuEligibleForUser,
  moveItemByOffset,
  moveMenuNode,
  promoteChildToTop,
} from "@/services/user-menu-config";
import { getAdminUserMenu, updateAdminUserMenu } from "@/services/user-menu-service";
import { reportHero, reportHeroBadge, reportHeroIcon } from "@/styles/reportTheme";

const AUDIENCE_BADGES = {
  GROUP_LEADER: "단체장 전용",
  GROUP_MEMBER: "단체회원 전용",
};

const INTERACTIVE_SELECTOR = "input, textarea, button, a, .MuiSwitch-root, .MuiInputBase-root";

/* eslint-disable react/prop-types */
function BadgeEditorButton({ badge, targetLabel, onChange }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [draftText, setDraftText] = useState("");
  const [draftTone, setDraftTone] = useState("green");
  const open = Boolean(anchorEl);

  const handleOpen = (event) => {
    setAnchorEl(event.currentTarget);
    setDraftText(badge?.text || "");
    setDraftTone(badge?.tone || "green");
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleApplyCustom = () => {
    const trimmed = draftText.trim().slice(0, 10);
    if (!trimmed) return;
    onChange({ text: trimmed, tone: draftTone });
    handleClose();
  };

  return (
    <>
      <Tooltip title="메뉴 뱃지(BETA, NEW, HOT 등) 설정">
        <Button
          size="small"
          variant="outlined"
          aria-label={`${targetLabel} 뱃지 설정`}
          onClick={handleOpen}
          sx={{
            minWidth: 0,
            px: badge ? 0.65 : 0.9,
            py: 0.35,
            borderRadius: "999px",
            borderColor: badge ? "#CBD5E1" : "#E2E8F0",
            bgcolor: "#FFFFFF",
            color: "#475569",
            fontSize: 11.5,
            fontWeight: 650,
            textTransform: "none",
            flexShrink: 0,
            lineHeight: 1.2,
            gap: 0.4,
            "&:hover": { borderColor: "#94A3B8", bgcolor: "#F8FAFC" },
          }}
        >
          {badge ? (
            <MenuBadge badge={badge} compact />
          ) : (
            <>
              <LocalOfferOutlinedIcon sx={{ fontSize: 13 }} />
              <span>뱃지</span>
            </>
          )}
        </Button>
      </Tooltip>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{ paper: { sx: { p: 1.75, width: 280, borderRadius: 2.5 } } }}
      >
        <Stack spacing={1.25}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle2" fontWeight={800} noWrap>
              뱃지 설정 · {targetLabel}
            </Typography>
            {badge && (
              <Button
                size="small"
                color="inherit"
                onClick={() => {
                  onChange(null);
                  handleClose();
                }}
                sx={{ minWidth: 0, px: 0.75, fontSize: 11.5, color: "text.secondary" }}
              >
                제거
              </Button>
            )}
          </Stack>

          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ display: "block", mb: 0.75 }}>
              빠른 선택
            </Typography>
            <Stack direction="row" flexWrap="wrap" gap={0.6}>
              <Chip
                size="small"
                label="없음"
                variant={!badge ? "filled" : "outlined"}
                onClick={() => {
                  onChange(null);
                  handleClose();
                }}
                sx={{ fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}
              />
              {BADGE_PRESETS.map((preset) => {
                const [bg, color, border] = BADGE_TONE_STYLES[preset.tone];
                const active = badge?.text === preset.text && badge?.tone === preset.tone;
                return (
                  <Chip
                    key={`${preset.text}-${preset.tone}`}
                    size="small"
                    label={preset.text}
                    onClick={() => {
                      onChange({ text: preset.text, tone: preset.tone });
                      handleClose();
                    }}
                    sx={{
                      fontSize: 11,
                      fontWeight: 800,
                      cursor: "pointer",
                      bgcolor: bg,
                      color,
                      border: `1px solid ${active ? color : border}`,
                      boxShadow: active ? `0 0 0 1px ${color}` : "none",
                    }}
                  />
                );
              })}
            </Stack>
          </Box>

          <Divider />

          <Stack spacing={1}>
            <Typography variant="caption" color="text.secondary" fontWeight={700}>
              직접 입력
            </Typography>
            <TextField
              size="small"
              fullWidth
              placeholder="예: BETA, v2, 필독 (최대 10자)"
              value={draftText}
              inputProps={{ maxLength: 10, "aria-label": `${targetLabel} 직접 뱃지 문구` }}
              onChange={(event) => setDraftText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && draftText.trim()) {
                  event.preventDefault();
                  handleApplyCustom();
                }
              }}
            />
            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
              {BADGE_TONES.map((tone) => {
                const [bg, color, border] = BADGE_TONE_STYLES[tone.key];
                const selected = draftTone === tone.key;
                return (
                  <Chip
                    key={tone.key}
                    size="small"
                    label={tone.label}
                    onClick={() => setDraftTone(tone.key)}
                    sx={{
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: "pointer",
                      bgcolor: bg,
                      color,
                      border: `1.5px solid ${selected ? color : border}`,
                      boxShadow: selected ? `0 0 0 1px ${color}` : "none",
                    }}
                  />
                );
              })}
            </Stack>
            <Stack direction="row" justifyContent="space-between" alignItems="center" pt={0.5}>
              <Box sx={{ minHeight: 22, display: "flex", alignItems: "center" }}>
                {draftText.trim() ? (
                  <MenuBadge badge={{ text: draftText.trim().slice(0, 10), tone: draftTone }} />
                ) : (
                  <Typography variant="caption" color="text.disabled">미리보기</Typography>
                )}
              </Box>
              <Stack direction="row" spacing={0.75}>
                <Button size="small" color="inherit" onClick={handleClose}>닫기</Button>
                <Button
                  size="small"
                  variant="contained"
                  disableElevation
                  disabled={!draftText.trim()}
                  onClick={handleApplyCustom}
                >
                  적용
                </Button>
              </Stack>
            </Stack>
          </Stack>
        </Stack>
      </Popover>
    </>
  );
}
/* eslint-enable react/prop-types */

function sameDropTarget(a, b) {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return a.kind === b.kind && a.groupKey === b.groupKey && a.key === b.key && a.position === b.position;
}

function findMenuDropTarget(container, clientY, clientX, active) {
  const draggedHasChildren = Boolean(active.draggedHasChildren);

  if (!draggedHasChildren) {
    const childNodes = container.querySelectorAll("[data-parent-key][data-child-key]");
    for (let i = 0; i < childNodes.length; i += 1) {
      const el = childNodes[i];
      const rect = el.getBoundingClientRect();
      if (clientY >= rect.top - 5 && clientY <= rect.bottom + 5 && clientX >= rect.left - 24 && clientX <= rect.right + 24) {
        const groupKey = el.dataset.parentKey;
        const key = el.dataset.childKey;
        if (!groupKey || !key) continue;
        return {
          kind: "child",
          groupKey,
          key,
          position: clientY < rect.top + rect.height / 2 ? "before" : "after",
        };
      }
    }

    const dropzones = container.querySelectorAll("[data-group-dropzone]");
    for (let i = 0; i < dropzones.length; i += 1) {
      const el = dropzones[i];
      const rect = el.getBoundingClientRect();
      if (clientY >= rect.top && clientY <= rect.bottom && clientX >= rect.left - 24 && clientX <= rect.right + 24) {
        const groupKey = el.dataset.groupDropzone;
        if (groupKey && (active.scope === "top" ? groupKey !== active.key : groupKey !== active.groupKey)) {
          return { kind: "group-inside", groupKey };
        }
      }
    }
  }

  const topNodes = container.querySelectorAll("[data-menu-key]");
  for (let i = 0; i < topNodes.length; i += 1) {
    const el = topNodes[i];
    const rect = el.getBoundingClientRect();
    const key = el.dataset.menuKey;
    if (!key) continue;

    const canDropInsideTarget = !draggedHasChildren
      && (active.scope === "top" ? key !== active.key : key !== active.groupKey);

    if (canDropInsideTarget) {
      const headerEl = el.querySelector(`[data-card-header-key="${key}"]`) || el;
      const hRect = headerEl.getBoundingClientRect();
      if (clientY < hRect.top + hRect.height * 0.28) {
        return { kind: "top", key, position: "before" };
      }
      if (clientY <= hRect.top + hRect.height * 0.75) {
        return { kind: "group-inside", groupKey: key };
      }
      if (clientY <= rect.bottom || i === topNodes.length - 1) {
        return { kind: "top", key, position: "after" };
      }
      continue;
    }

    if (clientY < rect.top + rect.height / 2) {
      return { kind: "top", key, position: "before" };
    }
    if (clientY <= rect.bottom || i === topNodes.length - 1) {
      return { kind: "top", key, position: "after" };
    }
  }
  return null;
}

export default function UserMenuSettings() {
  const [items, setItems] = useState(DEFAULT_USER_MENU_ITEMS);
  const [savedItems, setSavedItems] = useState(DEFAULT_USER_MENU_ITEMS);
  const [schemaReady, setSchemaReady] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [expandedGroups, setExpandedGroups] = useState({ claims: true, customers: true });
  const [previewAudience, setPreviewAudience] = useState("personal");

  const [dragState, setDragState] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);

  const editorRef = useRef(null);
  const dragSessionRef = useRef(null);
  const cleanupListenersRef = useRef(null);

  useEffect(() => {
    let active = true;
    getAdminUserMenu()
      .then((data) => {
        if (!active) return;
        setItems(data.items);
        setSavedItems(data.items);
        setSchemaReady(Boolean(data.schema_ready));
      })
      .catch(() => {
        if (active) setError("좌측 메뉴 설정을 불러오지 못했습니다.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      cleanupListenersRef.current?.();
    };
  }, []);

  const dirty = hasMenuChanges(items, savedItems);
  const visibleCount = items.filter((item) => item.visible).length;
  const hiddenCount = items.length - visibleCount;

  const updateItem = useCallback((key, updater) => {
    setItems((current) => current.map((item) => (item.key === key ? updater(item) : item)));
    setMessage("");
    setError("");
  }, []);

  const updateChild = useCallback((groupKey, childKey, updater) => {
    updateItem(groupKey, (group) => ({
      ...group,
      children: (group.children || []).map((child) => (child.key === childKey ? updater(child) : child)),
    }));
  }, [updateItem]);

  const startPointerDrag = useCallback((event, {
    scope,
    draggedKind = "item",
    draggedHasChildren = false,
    groupKey = null,
    key,
    label,
  }) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;

    const fromHandle = Boolean(event.target.closest?.('[data-drag-handle="true"]'));
    if (!fromHandle && event.target.closest?.(INTERACTIVE_SELECTOR)) return;

    if (scope === "child") {
      event.stopPropagation();
    }
    if (fromHandle) {
      event.preventDefault();
    }

    cleanupListenersRef.current?.();

    const session = {
      scope,
      draggedKind,
      draggedHasChildren,
      groupKey,
      key,
      label,
      startX: event.clientX,
      startY: event.clientY,
      started: false,
      target: null,
    };
    dragSessionRef.current = session;

    const clearDrag = () => {
      document.body.style.userSelect = "";
      dragSessionRef.current = null;
      setDragState(null);
      setDropTarget(null);
    };

    const handlePointerMove = (moveEvent) => {
      const active = dragSessionRef.current;
      if (!active) return;

      const distance = Math.hypot(moveEvent.clientX - active.startX, moveEvent.clientY - active.startY);
      if (!active.started) {
        if (distance < 3) return;
        active.started = true;
        document.body.style.userSelect = "none";
      }

      if (moveEvent.clientY < 64) {
        window.scrollBy(0, -14);
      } else if (window.innerHeight - moveEvent.clientY < 64) {
        window.scrollBy(0, 14);
      }

      setDragState({
        scope: active.scope,
        draggedKind: active.draggedKind,
        groupKey: active.groupKey,
        key: active.key,
        label: active.label,
        x: moveEvent.clientX,
        y: moveEvent.clientY,
      });

      const container = editorRef.current;
      if (!container) return;

      const hit = findMenuDropTarget(container, moveEvent.clientY, moveEvent.clientX, active);
      active.target = hit;
      setDropTarget((prev) => (sameDropTarget(prev, hit) ? prev : hit));
    };

    const finishPointerDrag = () => {
      const active = dragSessionRef.current;
      cleanupListenersRef.current?.();
      cleanupListenersRef.current = null;

      if (active?.started && active.target) {
        const target = active.target;
        setItems((current) => moveMenuNode(current, {
          scope: active.scope,
          groupKey: active.groupKey,
          key: active.key,
        }, target));
        if ((target.kind === "group-inside" || target.kind === "child") && target.groupKey) {
          setExpandedGroups((prev) => ({ ...prev, [target.groupKey]: true }));
        }
        setMessage("");
        setError("");
      }
      clearDrag();
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", finishPointerDrag);
    window.addEventListener("pointercancel", finishPointerDrag);

    cleanupListenersRef.current = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", finishPointerDrag);
      window.removeEventListener("pointercancel", finishPointerDrag);
      document.body.style.userSelect = "";
    };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const updated = await updateAdminUserMenu(items);
      setItems(updated.items);
      setSavedItems(updated.items);
      setSchemaReady(Boolean(updated.schema_ready));
      setMessage("좌측 유저 메뉴 설정을 저장했습니다. 사이드바에 즉시 반영됩니다.");
    } catch (failure) {
      const detail = failure.response?.data?.detail;
      if (failure.response?.status === 503) {
        setError("메뉴 설정용 DB 테이블(104_user_menu_settings.sql) 적용 후 저장할 수 있습니다.");
      } else if (failure.response?.status === 422 && typeof detail === "string") {
        setError(detail);
      } else {
        setError("좌측 유저 메뉴 설정을 저장하지 못했습니다.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    setItems(DEFAULT_USER_MENU_ITEMS);
    setMessage("기본 순서·이름·노출·뱃지 상태로 초기화했습니다. 저장 버튼을 누르면 반영됩니다.");
    setError("");
  };

  const handleCancelChanges = () => {
    setItems(savedItems);
    setMessage("");
    setError("");
  };

  const previewUser = previewAudience === "leader"
    ? { group_id: 1, group_role: "LEADER" }
    : { group_id: null, group_role: null };
  const previewVisibleMenus = items.filter((item) => isMenuEligibleForUser(item, previewUser));

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1fr) 300px" },
        gap: 3,
        alignItems: "start",
      }}
    >
      <Stack spacing={2} sx={{ minWidth: 0 }} ref={editorRef}>
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
          <Stack spacing={1.75}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", sm: "center" }}
              gap={1.5}
            >
              <Box>
                <Typography variant="h6" fontWeight={800}>좌측 유저 메뉴 구성</Typography>
                <Typography variant="body2" color="text.secondary">
                  카드를 드래그해 1차 순서를 바꾸거나 그룹 카드·하위 목록 위로 끌어 2차 하위 메뉴로 넣고 뺄 수 있습니다.
                </Typography>
              </Box>
              <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                <Chip size="small" label={`전체 ${items.length}개`} />
                <Chip size="small" color="success" icon={<VisibilityOutlinedIcon />} label={`노출 ${visibleCount}개`} />
                <Chip size="small" variant="outlined" icon={<VisibilityOffOutlinedIcon />} label={`숨김 ${hiddenCount}개`} />
                {dirty && <Chip size="small" color="warning" label="저장 전 변경 있음" />}
              </Stack>
            </Stack>

            {!schemaReady && (
              <Alert severity="warning">
                메뉴 설정 DB 테이블(<code>docs/sql/104_user_menu_settings.sql</code>)을 적용하면 저장할 수 있습니다.
              </Alert>
            )}
            {error && <Alert severity="error">{error}</Alert>}
            {message && <Alert severity="success">{message}</Alert>}

            <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }} gap={1}>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<RestartAltRoundedIcon />}
                  onClick={handleResetDefaults}
                  disabled={loading || saving}
                >
                  기본값 복원
                </Button>
                {dirty && (
                  <Button
                    size="small"
                    color="inherit"
                    onClick={handleCancelChanges}
                    disabled={loading || saving}
                  >
                    변경 취소
                  </Button>
                )}
              </Stack>
              <Button
                variant="contained"
                startIcon={<SaveRoundedIcon />}
                onClick={handleSave}
                disabled={loading || saving || !schemaReady || !dirty}
              >
                {saving ? "저장 중..." : "메뉴 설정 저장"}
              </Button>
            </Stack>
          </Stack>
        </Paper>

        {loading ? (
          <Paper variant="outlined" sx={{ p: 4, textAlign: "center", borderRadius: 3 }}>
            <Typography color="text.secondary">좌측 메뉴 구성을 불러오는 중...</Typography>
          </Paper>
        ) : (
          <Stack spacing={1.25}>
            {items.map((item, index) => {
              const isGroup = item.kind === "group";
              const hasChildren = (item.children || []).length > 0;
              const canHaveSubmenuPanel = isGroup || hasChildren;
              const isExpanded = Boolean(expandedGroups[item.key]);
              const isDragging = dragState?.scope === "top" && dragState.key === item.key;
              const isDropBefore = (
                dropTarget?.kind === "top"
                && dropTarget.key === item.key
                && dropTarget.position === "before"
                && dragState?.key !== item.key
              );
              const isDropAfter = (
                dropTarget?.kind === "top"
                && dropTarget.key === item.key
                && dropTarget.position === "after"
                && dragState?.key !== item.key
              );
              const isGroupInsideTarget = (
                dropTarget?.kind === "group-inside"
                && dropTarget.groupKey === item.key
              );
              const visibleChildrenCount = (item.children || []).filter((c) => c.visible).length;
              const effectiveGroupVisible = !isGroup || (item.visible && visibleChildrenCount > 0);

              return (
                <Box
                  key={item.key}
                  sx={{ position: "relative" }}
                  data-menu-key={item.key}
                  data-menu-kind={item.kind}
                  onPointerDown={(event) => startPointerDrag(event, {
                    scope: "top",
                    draggedKind: item.kind,
                    draggedHasChildren: canHaveSubmenuPanel,
                    key: item.key,
                    label: item.label,
                  })}
                >
                  {isDropBefore && (
                    <Box sx={{ position: "absolute", top: -6, left: 8, right: 8, height: 3, borderRadius: 2, bgcolor: "#03C75A", zIndex: 2 }} />
                  )}

                  <Paper
                    variant="outlined"
                    sx={{
                      p: 1.75,
                      borderRadius: 2.5,
                      opacity: isDragging ? 0.45 : item.visible && effectiveGroupVisible ? 1 : 0.62,
                      bgcolor: isGroupInsideTarget ? "#ECFDF5" : isDragging ? "#F8FAFC" : "#FFFFFF",
                      borderColor: isDropBefore || isDropAfter || isGroupInsideTarget ? "#03C75A" : "var(--bojogae-line)",
                      borderStyle: isGroupInsideTarget ? "dashed" : "solid",
                      boxShadow: isGroupInsideTarget ? "0 0 0 2px rgba(3, 199, 90, 0.16)" : "none",
                      transition: "opacity 150ms ease, border-color 150ms ease, background-color 150ms ease",
                    }}
                  >
                    <Stack spacing={1.25}>
                      <Stack
                        data-card-header-key={item.key}
                        direction={{ xs: "column", md: "row" }}
                        alignItems={{ xs: "stretch", md: "center" }}
                        justifyContent="space-between"
                        gap={1.25}
                      >
                        <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" useFlexGap sx={{ flex: 1, minWidth: 0 }}>
                          <Tooltip title="드래그해서 순서 이동">
                            <Box
                              data-drag-handle="true"
                              aria-label={`${item.label} 순서 드래그`}
                              sx={{
                                display: "grid",
                                placeItems: "center",
                                color: "#94a3b8",
                                cursor: isDragging ? "grabbing" : "grab",
                                flexShrink: 0,
                                touchAction: "none",
                                p: 0.5,
                                borderRadius: 1,
                                "&:hover": { bgcolor: "#F1F5F9", color: "#475569" },
                              }}
                            >
                              <DragIndicatorRoundedIcon fontSize="small" />
                            </Box>
                          </Tooltip>
                          <Chip
                            size="small"
                            label={String(index + 1).padStart(2, "0")}
                            sx={{ minWidth: 34, fontWeight: 800, bgcolor: "#F1F5F9", color: "#334155", flexShrink: 0 }}
                          />
                          <MenuIcon iconKey={item.icon_key} tone={item.tone} />
                          <TextField
                            size="small"
                            value={item.label}
                            inputProps={{ maxLength: 40, "aria-label": `${item.default_label} 표시 이름` }}
                            onBlur={() => {
                              if (!item.label.trim()) {
                                updateItem(item.key, (prev) => ({ ...prev, label: prev.default_label }));
                              }
                            }}
                            onChange={(event) => {
                              const nextLabel = event.target.value;
                              updateItem(item.key, (prev) => ({ ...prev, label: nextLabel }));
                            }}
                            sx={{ minWidth: 160, maxWidth: 240, flex: "1 1 180px" }}
                          />
                          {item.label !== item.default_label && (
                            <Tooltip title={`기본 이름(${item.default_label})으로 되돌리기`}>
                              <IconButton
                                size="small"
                                aria-label={`${item.default_label} 기본 이름 복원`}
                                onClick={() => updateItem(item.key, (prev) => ({ ...prev, label: prev.default_label }))}
                              >
                                <RestartAltRoundedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          <BadgeEditorButton
                            badge={item.badge}
                            targetLabel={item.label}
                            onChange={(nextBadge) => updateItem(item.key, (prev) => ({ ...prev, badge: nextBadge }))}
                          />
                        </Stack>

                        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={0.75} flexWrap="wrap" useFlexGap>
                          <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap" useFlexGap>
                            {item.kind === "hero" && (
                              <Chip size="small" color="success" label="핵심 CTA" />
                            )}
                            {canHaveSubmenuPanel && (
                              <Chip
                                size="small"
                                variant="outlined"
                                label={`${isGroup ? "그룹" : "하위"} · 노출 ${visibleChildrenCount}/${item.children.length}`}
                                color={visibleChildrenCount === 0 ? "warning" : "default"}
                              />
                            )}
                            {isGroupInsideTarget && (
                              <Chip size="small" color="success" label="여기에 놓아 하위 메뉴로 넣기" />
                            )}
                            {AUDIENCE_BADGES[item.audience] && (
                              <Chip size="small" color="info" label={AUDIENCE_BADGES[item.audience]} />
                            )}
                            {item.path && (
                              <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace", px: 0.5 }}>
                                {item.path}
                              </Typography>
                            )}
                          </Stack>

                          <Stack direction="row" alignItems="center" spacing={0.25}>
                            <Tooltip title="위로 이동">
                              <span>
                                <IconButton
                                  size="small"
                                  aria-label={`${item.label} 위로 이동`}
                                  disabled={index === 0}
                                  onClick={() => {
                                    setItems((current) => moveItemByOffset(current, index, -1));
                                    setMessage("");
                                  }}
                                >
                                  <ArrowUpwardRoundedIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip title="아래로 이동">
                              <span>
                                <IconButton
                                  size="small"
                                  aria-label={`${item.label} 아래로 이동`}
                                  disabled={index === items.length - 1}
                                  onClick={() => {
                                    setItems((current) => moveItemByOffset(current, index, 1));
                                    setMessage("");
                                  }}
                                >
                                  <ArrowDownwardRoundedIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                            {canHaveSubmenuPanel && (
                              <Tooltip title={isExpanded ? "하위 메뉴 접기" : "하위 메뉴 펼치기"}>
                                <IconButton
                                  size="small"
                                  aria-label={`${item.label} 하위 메뉴 토글`}
                                  onClick={() => setExpandedGroups((prev) => ({ ...prev, [item.key]: !prev[item.key] }))}
                                >
                                  {isExpanded ? <ExpandLessRoundedIcon fontSize="small" /> : <ExpandMoreRoundedIcon fontSize="small" />}
                                </IconButton>
                              </Tooltip>
                            )}
                            <Stack direction="row" alignItems="center" spacing={0.25} sx={{ pl: 0.5 }}>
                              <Switch
                                size="small"
                                checked={item.visible}
                                inputProps={{ "aria-label": `${item.label} 노출 여부` }}
                                onChange={(_, checked) => updateItem(item.key, (prev) => ({ ...prev, visible: checked }))}
                              />
                              <Typography variant="caption" fontWeight={700} color={item.visible ? "success.main" : "text.secondary"} sx={{ minWidth: 28 }}>
                                {item.visible ? "노출" : "숨김"}
                              </Typography>
                            </Stack>
                          </Stack>
                        </Stack>
                      </Stack>

                      {canHaveSubmenuPanel && (
                        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                          <Divider sx={{ my: 0.75 }} />
                          <Stack
                            spacing={0.75}
                            data-group-dropzone={item.key}
                            sx={{
                              pl: { xs: 1, sm: 4 },
                              pt: 0.5,
                              pb: 0.5,
                              borderRadius: 2,
                              bgcolor: isGroupInsideTarget ? "rgba(3, 199, 90, 0.06)" : "transparent",
                            }}
                          >
                            <Typography variant="caption" color="text.secondary" fontWeight={700}>
                              하위 메뉴 ({item.children.length}개 · 드래그로 1차/2차 자유 이동 가능)
                            </Typography>
                            {item.children.length === 0 && (
                              <Box
                                sx={{
                                  p: 1.5,
                                  borderRadius: 1.5,
                                  border: "1px dashed",
                                  borderColor: isGroupInsideTarget ? "#03C75A" : "#CBD5E1",
                                  bgcolor: isGroupInsideTarget ? "#ECFDF5" : "#F8FAFC",
                                  textAlign: "center",
                                }}
                              >
                                <Typography variant="caption" color="text.secondary" fontWeight={650}>
                                  하위 메뉴가 없습니다. 1차 메뉴나 다른 하위 메뉴를 여기로 드래그해 넣으세요.
                                </Typography>
                              </Box>
                            )}
                            {item.children.map((child, childIndex) => {
                              const isChildDragging = (
                                dragState?.scope === "child"
                                && dragState.groupKey === item.key
                                && dragState.key === child.key
                              );
                              const isChildBefore = (
                                dropTarget?.kind === "child"
                                && dropTarget.groupKey === item.key
                                && dropTarget.key === child.key
                                && dropTarget.position === "before"
                                && dragState?.key !== child.key
                              );
                              const isChildAfter = (
                                dropTarget?.kind === "child"
                                && dropTarget.groupKey === item.key
                                && dropTarget.key === child.key
                                && dropTarget.position === "after"
                                && dragState?.key !== child.key
                              );

                              return (
                                <Box
                                  key={child.key}
                                  sx={{ position: "relative" }}
                                  data-parent-key={item.key}
                                  data-child-key={child.key}
                                  onPointerDown={(event) => startPointerDrag(event, {
                                    scope: "child",
                                    draggedKind: "item",
                                    groupKey: item.key,
                                    key: child.key,
                                    label: child.label,
                                  })}
                                >
                                  {isChildBefore && (
                                    <Box sx={{ position: "absolute", top: -4, left: 4, right: 4, height: 2.5, bgcolor: "#03C75A", borderRadius: 1, zIndex: 2 }} />
                                  )}
                                  <Stack
                                    direction={{ xs: "column", sm: "row" }}
                                    alignItems={{ xs: "stretch", sm: "center" }}
                                    justifyContent="space-between"
                                    gap={1}
                                    sx={{
                                      px: 1.25,
                                      py: 0.75,
                                      borderRadius: 1.5,
                                      border: "1px solid",
                                      borderColor: isChildBefore || isChildAfter ? "#03C75A" : "#E2E8F0",
                                      bgcolor: "#F8FAFC",
                                      opacity: isChildDragging ? 0.45 : child.visible ? 1 : 0.6,
                                    }}
                                  >
                                    <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" useFlexGap sx={{ flex: 1, minWidth: 0 }}>
                                      <Box
                                        data-drag-handle="true"
                                        aria-label={`${child.label} 하위 메뉴 드래그`}
                                        sx={{
                                          display: "grid",
                                          placeItems: "center",
                                          color: "#94a3b8",
                                          cursor: isChildDragging ? "grabbing" : "grab",
                                          touchAction: "none",
                                          p: 0.25,
                                          borderRadius: 0.75,
                                          "&:hover": { bgcolor: "#E2E8F0", color: "#475569" },
                                        }}
                                      >
                                        <DragIndicatorRoundedIcon fontSize="small" />
                                      </Box>
                                      <TextField
                                        size="small"
                                        value={child.label}
                                        inputProps={{ maxLength: 40, "aria-label": `${child.default_label} 하위 메뉴 이름` }}
                                        onBlur={() => {
                                          if (!child.label.trim()) {
                                            updateChild(item.key, child.key, (prev) => ({ ...prev, label: prev.default_label }));
                                          }
                                        }}
                                        onChange={(event) => {
                                          const nextLabel = event.target.value;
                                          updateChild(item.key, child.key, (prev) => ({ ...prev, label: nextLabel }));
                                        }}
                                        sx={{ minWidth: 140, maxWidth: 210, bgcolor: "#fff" }}
                                      />
                                      <BadgeEditorButton
                                        badge={child.badge}
                                        targetLabel={child.label}
                                        onChange={(nextBadge) => updateChild(item.key, child.key, (prev) => ({ ...prev, badge: nextBadge }))}
                                      />
                                      {AUDIENCE_BADGES[child.audience] && (
                                        <Chip size="small" color="info" label={AUDIENCE_BADGES[child.audience]} />
                                      )}
                                      <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace" }}>
                                        {child.path}
                                      </Typography>
                                    </Stack>

                                    <Stack direction="row" alignItems="center" spacing={0.25}>
                                      <Tooltip title="1차 메뉴로 꺼내기">
                                        <IconButton
                                          size="small"
                                          aria-label={`${child.label} 1차 메뉴로 이동`}
                                          onClick={() => {
                                            setItems((current) => promoteChildToTop(current, item.key, child.key));
                                            setMessage("");
                                            setError("");
                                          }}
                                        >
                                          <NorthWestRoundedIcon fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                      <IconButton
                                        size="small"
                                        aria-label={`${child.label} 위로 이동`}
                                        disabled={childIndex === 0}
                                        onClick={() => updateItem(item.key, (group) => ({
                                          ...group,
                                          children: moveItemByOffset(group.children, childIndex, -1),
                                        }))}
                                      >
                                        <ArrowUpwardRoundedIcon fontSize="small" />
                                      </IconButton>
                                      <IconButton
                                        size="small"
                                        aria-label={`${child.label} 아래로 이동`}
                                        disabled={childIndex === item.children.length - 1}
                                        onClick={() => updateItem(item.key, (group) => ({
                                          ...group,
                                          children: moveItemByOffset(group.children, childIndex, 1),
                                        }))}
                                      >
                                        <ArrowDownwardRoundedIcon fontSize="small" />
                                      </IconButton>
                                      <Switch
                                        size="small"
                                        checked={child.visible}
                                        inputProps={{ "aria-label": `${child.label} 노출 여부` }}
                                        onChange={(_, checked) => updateChild(item.key, child.key, (prev) => ({ ...prev, visible: checked }))}
                                      />
                                      <Typography variant="caption" fontWeight={700} color={child.visible ? "success.main" : "text.secondary"} sx={{ minWidth: 28 }}>
                                        {child.visible ? "노출" : "숨김"}
                                      </Typography>
                                    </Stack>
                                  </Stack>
                                  {isChildAfter && (
                                    <Box sx={{ position: "absolute", bottom: -4, left: 4, right: 4, height: 2.5, bgcolor: "#03C75A", borderRadius: 1, zIndex: 2 }} />
                                  )}
                                </Box>
                              );
                            })}
                          </Stack>
                        </Collapse>
                      )}
                    </Stack>
                  </Paper>

                  {isDropAfter && (
                    <Box sx={{ position: "absolute", bottom: -6, left: 8, right: 8, height: 3, borderRadius: 2, bgcolor: "#03C75A", zIndex: 2 }} />
                  )}
                </Box>
              );
            })}
          </Stack>
        )}
      </Stack>

      <Paper
        variant="outlined"
        sx={{
          p: 2.25,
          borderRadius: 3,
          position: { lg: "sticky" },
          top: { lg: 20 },
          bgcolor: "#FFFFFF",
        }}
      >
        <Stack spacing={1.5}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle1" fontWeight={800}>실시간 미리보기</Typography>
            <ToggleButtonGroup
              size="small"
              exclusive
              value={previewAudience}
              onChange={(_, value) => { if (value) setPreviewAudience(value); }}
            >
              <ToggleButton value="personal" sx={{ px: 1.25, py: 0.25, fontSize: 12 }}>개인 회원</ToggleButton>
              <ToggleButton value="leader" sx={{ px: 1.25, py: 0.25, fontSize: 12 }}>단체장</ToggleButton>
            </ToggleButtonGroup>
          </Stack>
          <Typography variant="caption" color="text.secondary">
            저장 전 수정 중인 순서와 노출 여부가 바로 반영됩니다.
          </Typography>
          <Divider />
          <Box sx={{ maxHeight: 580, overflowY: "auto", pr: 0.5 }}>
            <Stack spacing={0.5}>
              {previewVisibleMenus.map((item) => {
                const visibleChildren = (item.children || []).filter((c) => isChildEligibleForUser(c, previewUser));
                const hasSubmenus = item.kind === "group" || visibleChildren.length > 0;
                if (item.kind === "hero") {
                  return (
                    <Box key={item.key} sx={{ flexShrink: 0, mb: 0.75 }}>
                      <Box
                        sx={{
                          ...reportHero,
                          flexShrink: 0,
                          minHeight: 56,
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          px: 1.25,
                          py: 1,
                          borderRadius: "12px",
                        }}
                      >
                        <Box component="span" sx={{ ...reportHeroIcon, width: 32, height: 32, borderRadius: "10px" }}>
                          <AutoAwesomeRoundedIcon sx={{ fontSize: 16 }} />
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
                          <Box sx={{ ...reportHeroBadge, width: "fit-content", fontSize: 9 }}>CORE FEATURE</Box>
                          <Stack direction="row" alignItems="center" spacing={0.6}>
                            <Typography fontSize={13} fontWeight={850} noWrap>{item.label}</Typography>
                            <MenuBadge badge={item.badge} onHero compact />
                          </Stack>
                        </Box>
                        <ChevronRightRoundedIcon sx={{ ml: "auto", fontSize: 16 }} />
                      </Box>
                      {visibleChildren.length > 0 && (
                        <Stack spacing={0.25} sx={{ pl: 2, pt: 0.4, pb: 0.25 }}>
                          {visibleChildren.map((child) => (
                            <Stack key={child.key} direction="row" alignItems="center" spacing={0.5}>
                              <Typography fontSize={12} color="text.secondary" noWrap>
                                · {child.label}
                              </Typography>
                              <MenuBadge badge={child.badge} compact />
                            </Stack>
                          ))}
                        </Stack>
                      )}
                    </Box>
                  );
                }

                return (
                  <Box key={item.key} sx={{ flexShrink: 0, py: 0.35, px: 0.75, borderRadius: 1.5, bgcolor: "#F8FAFC" }}>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <MenuIcon iconKey={item.icon_key} tone={item.tone} compact />
                      <Typography fontSize={13} fontWeight={650} noWrap sx={{ flex: 1 }}>
                        {item.label}
                      </Typography>
                      <MenuBadge badge={item.badge} compact />
                      {hasSubmenus && (
                        <Typography variant="caption" color="text.secondary">▾</Typography>
                      )}
                    </Stack>
                    {hasSubmenus && visibleChildren.length > 0 && (
                      <Stack spacing={0.25} sx={{ pl: 4.25, pt: 0.35, pb: 0.25 }}>
                        {visibleChildren.map((child) => (
                          <Stack key={child.key} direction="row" alignItems="center" spacing={0.5}>
                            <Typography fontSize={12} color="text.secondary" noWrap>
                              · {child.label}
                            </Typography>
                            <MenuBadge badge={child.badge} compact />
                          </Stack>
                        ))}
                      </Stack>
                    )}
                  </Box>
                );
              })}
              {!previewVisibleMenus.length && (
                <Alert severity="warning">현재 조건에서 노출되는 메뉴가 없습니다.</Alert>
              )}
            </Stack>
          </Box>
        </Stack>
      </Paper>

      {dragState && (() => {
        const targetGroup = dropTarget?.groupKey ? items.find((i) => i.key === dropTarget.groupKey) : null;
        let hint = "";
        if (dropTarget?.kind === "group-inside" && targetGroup) {
          hint = `→ ${targetGroup.label} 하위 메뉴로 넣기`;
        } else if (dropTarget?.kind === "child" && targetGroup) {
          hint = `→ ${targetGroup.label} 하위 위치로 이동`;
        } else if (dropTarget?.kind === "top") {
          hint = dragState.scope === "child" ? "→ 1차 메뉴로 꺼내기" : "→ 1차 메뉴 순서 이동";
        }
        return (
          <Paper
            elevation={6}
            sx={{
              position: "fixed",
              left: dragState.x + 12,
              top: dragState.y - 16,
              zIndex: 1500,
              pointerEvents: "none",
              px: 1.5,
              py: 0.75,
              borderRadius: 2,
              border: "1.5px solid #03C75A",
              bgcolor: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              gap: 0.75,
            }}
          >
            <DragIndicatorRoundedIcon fontSize="small" sx={{ color: "#03C75A" }} />
            <Typography fontSize={13} fontWeight={750}>{dragState.label}</Typography>
            {hint && (
              <Typography fontSize={11.5} fontWeight={700} sx={{ color: "#059669" }}>
                {hint}
              </Typography>
            )}
          </Paper>
        );
      })()}
    </Box>
  );
}
