/* eslint-disable react/prop-types */
import FolderOpenRoundedIcon from "@mui/icons-material/FolderOpenRounded";
import { Alert, Box, Chip, Paper, Stack, Typography } from "@mui/material";
import { useMemo } from "react";

import { isCompactCategoryGroup } from "@/services/prompt-category-utils";
import { buildAdminCategoryGroups, selectSingleCategory } from "@/services/prompt-list-utils";
import { brand } from "@/styles/palette";

const CATEGORY_ACCENTS = {
  "알릴의무": "#e11d48",
  "고객관리": "#0284c7",
  "보고서": "#2563eb",
  "건강": "#16a34a",
  "간병/시니어": "#7c3aed",
  "종신/연금": "#ea580c",
  "실손": "#0891b2",
  "태아": "#db2777",
  "재물/운전자": "#4f46e5",
  "펫보험": "#92400e",
};

function PromptCategoryList({ prompts = [], categories = [], selectedCategoryId = null, onSelectCategory }) {
  const { groups, unassigned } = useMemo(
    () => buildAdminCategoryGroups(prompts, categories),
    [prompts, categories],
  );

  const mobileCategories = useMemo(
    () => [
      ...groups.flatMap((group) =>
        group.children.map((child) => ({
          id: child.id,
          name: child.name,
          parentName: group.name,
          count: child.count,
        })),
      ),
      ...(unassigned.length > 0
        ? [{ id: "unassigned", name: "미분류", parentName: "기타", count: unassigned.length }]
        : []),
    ],
    [groups, unassigned.length],
  );

  const chooseCategory = (categoryId) => {
    onSelectCategory(selectSingleCategory(selectedCategoryId, categoryId));
  };

  const handleRadioKeyDown = (event) => {
    if (!["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"].includes(event.key)) return;
    const radios = Array.from(event.currentTarget.querySelectorAll('[role="radio"]'))
      .filter((element) => element.offsetParent !== null);
    if (!radios.length) return;
    const currentIndex = radios.indexOf(document.activeElement);
    if (currentIndex === -1) return;
    event.preventDefault();
    const delta = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1;
    const nextRadio = radios[(currentIndex + delta + radios.length) % radios.length];
    nextRadio.focus();
    const rawId = nextRadio.dataset.categoryId;
    if (rawId === "all") {
      onSelectCategory(null);
    } else if (rawId === "unassigned") {
      onSelectCategory("unassigned");
    } else if (rawId) {
      onSelectCategory(Number(rawId));
    }
  };

  return (
    <Paper
      variant="outlined"
      role="radiogroup"
      aria-label="프롬프트 카테고리 선택"
      onKeyDown={handleRadioKeyDown}
      sx={{
        borderRadius: "16px",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        boxShadow: "0 1px 3px rgba(15, 23, 42, 0.05)",
      }}
    >
      <Box
        sx={{
          px: 1.75,
          py: 1.25,
          flexShrink: 0,
          borderBottom: 1,
          borderColor: "divider",
          bgcolor: "#F8FAFC",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
          <FolderOpenRoundedIcon color="primary" fontSize="small" />
          <Typography variant="subtitle2" fontWeight={800}>카테고리</Typography>
        </Stack>
        <Box
          component="button"
          type="button"
          role="radio"
          aria-checked={selectedCategoryId === null}
          data-category-id="all"
          onClick={() => chooseCategory(null)}
          sx={{
            appearance: "none",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            px: 1.25,
            py: 0.45,
            minHeight: 28,
            borderRadius: "999px",
            border: "1px solid",
            borderColor: selectedCategoryId === null ? brand.accentInk : "#DCE2E8",
            bgcolor: selectedCategoryId === null ? brand.accentInk : "#FFFFFF",
            color: selectedCategoryId === null ? "#FFFFFF" : "text.secondary",
            fontFamily: "inherit",
            fontSize: 12,
            fontWeight: selectedCategoryId === null ? 800 : 700,
            lineHeight: 1.2,
            letterSpacing: "-0.02em",
            whiteSpace: "nowrap",
            cursor: "pointer",
            boxShadow: selectedCategoryId === null ? "0 1px 3px rgba(0, 110, 67, 0.24)" : "none",
            transition: "background-color 120ms ease, border-color 120ms ease, color 120ms ease, box-shadow 120ms ease",
            "&:hover": {
              bgcolor: selectedCategoryId === null ? brand.deep : brand.tint,
              borderColor: selectedCategoryId === null ? brand.deep : brand.accent,
              color: selectedCategoryId === null ? "#FFFFFF" : brand.accentInk,
            },
            "&:focus-visible": {
              outline: `2px solid ${brand.accentInk}`,
              outlineOffset: 2,
            },
          }}
        >
          전체
        </Box>
      </Box>

      <Box
        sx={{
          display: { xs: "grid", md: "none" },
          gridTemplateRows: "repeat(3, auto)",
          gridAutoFlow: "column",
          gridAutoColumns: "max-content",
          gap: 0.75,
          p: 1.25,
          overflowX: "auto",
          overscrollBehaviorX: "contain",
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        {mobileCategories.map((category) => {
          const selected = selectedCategoryId === category.id;
          const accent = CATEGORY_ACCENTS[category.parentName] || "#64748b";
          return (
            <Chip
              key={category.id}
              role="radio"
              aria-checked={selected}
              data-category-id={String(category.id)}
              label={`${category.parentName} · ${category.name} (${category.count})`}
              variant="outlined"
              onClick={() => chooseCategory(category.id)}
              sx={{
                justifyContent: "flex-start",
                borderWidth: 2,
                borderColor: accent,
                color: selected ? accent : "text.primary",
                backgroundColor: selected ? `${accent}2e` : "background.paper",
                fontWeight: selected ? 800 : 650,
                "&&:hover": {
                  borderWidth: 2,
                  borderColor: accent,
                  backgroundColor: selected ? `${accent}38` : `${accent}0d`,
                },
              }}
            />
          );
        })}
        {!mobileCategories.length && (
          <Typography variant="body2" color="text.secondary">등록된 프롬프트가 없습니다.</Typography>
        )}
      </Box>

      <Box
        sx={{
          display: { xs: "none", md: "grid" },
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gridAutoFlow: "row dense",
          gap: 1,
          p: 1.15,
        }}
      >
        {groups.map((group) => {
          const groupSelected = group.children.some((child) => child.id === selectedCategoryId);
          const compact = isCompactCategoryGroup(group);
          return (
            <Paper
              key={group.id}
              data-category-group={group.name}
              variant="outlined"
              sx={{
                gridColumn: compact ? "span 1" : "1 / -1",
                px: 1.1,
                py: 0.9,
                borderRadius: "12px",
                display: "flex",
                flexDirection: "column",
                borderColor: groupSelected ? brand.accent : "divider",
                bgcolor: groupSelected ? "rgba(236, 253, 245, 0.4)" : "background.paper",
                transition: "border-color 150ms ease, background-color 150ms ease",
              }}
            >
              <Typography
                variant="caption"
                component="div"
                sx={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: groupSelected ? brand.accentInk : "text.primary",
                  mb: 0.6,
                  lineHeight: 1.25,
                }}
              >
                {group.name}
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.55 }}>
                {group.children.map((child) => {
                  const selected = selectedCategoryId === child.id;
                  return (
                    <Box
                      key={child.id}
                      component="button"
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      data-category-id={String(child.id)}
                      title={`${child.name} (${child.count}개)`}
                      onClick={() => chooseCategory(child.id)}
                      sx={{
                        appearance: "none",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        maxWidth: "100%",
                        px: 1,
                        py: 0.45,
                        minHeight: 28,
                        borderRadius: "7px",
                        border: "1px solid",
                        borderColor: selected ? brand.accentInk : "#DCE2E8",
                        bgcolor: selected ? brand.accentInk : "#F8FAFC",
                        color: selected ? "#FFFFFF" : "text.primary",
                        fontFamily: "inherit",
                        fontSize: 12,
                        fontWeight: selected ? 800 : 600,
                        lineHeight: 1.25,
                        letterSpacing: "-0.02em",
                        whiteSpace: "normal",
                        wordBreak: "keep-all",
                        overflowWrap: "anywhere",
                        textAlign: "left",
                        cursor: "pointer",
                        boxShadow: selected ? "0 1px 3px rgba(0, 110, 67, 0.24)" : "none",
                        transition: "background-color 120ms ease, border-color 120ms ease, color 120ms ease, box-shadow 120ms ease",
                        "&:hover": {
                          bgcolor: selected ? brand.deep : brand.tint,
                          borderColor: selected ? brand.deep : brand.accent,
                          color: selected ? "#FFFFFF" : brand.accentInk,
                        },
                        "&:focus-visible": {
                          outline: `2px solid ${brand.accentInk}`,
                          outlineOffset: 2,
                        },
                      }}
                    >
                      {child.name}
                    </Box>
                  );
                })}
              </Box>
            </Paper>
          );
        })}

        {unassigned.length > 0 && (
          <Paper
            data-category-group="미분류"
            variant="outlined"
            sx={{
              gridColumn: "span 1",
              px: 1.1,
              py: 0.9,
              borderRadius: "12px",
              display: "flex",
              flexDirection: "column",
              borderColor: selectedCategoryId === "unassigned" ? brand.accent : "divider",
              bgcolor: selectedCategoryId === "unassigned" ? "rgba(236, 253, 245, 0.4)" : "background.paper",
              transition: "border-color 150ms ease, background-color 150ms ease",
            }}
          >
            <Typography
              variant="caption"
              component="div"
              sx={{
                fontSize: 12,
                fontWeight: 800,
                color: selectedCategoryId === "unassigned" ? brand.accentInk : "text.primary",
                mb: 0.6,
                lineHeight: 1.25,
              }}
            >
              기타
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.55 }}>
              <Box
                component="button"
                type="button"
                role="radio"
                aria-checked={selectedCategoryId === "unassigned"}
                data-category-id="unassigned"
                title={`미분류 (${unassigned.length}개)`}
                onClick={() => chooseCategory("unassigned")}
                sx={{
                  appearance: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  maxWidth: "100%",
                  px: 1,
                  py: 0.45,
                  minHeight: 28,
                  borderRadius: "7px",
                  border: "1px solid",
                  borderColor: selectedCategoryId === "unassigned" ? brand.accentInk : "#DCE2E8",
                  bgcolor: selectedCategoryId === "unassigned" ? brand.accentInk : "#F8FAFC",
                  color: selectedCategoryId === "unassigned" ? "#FFFFFF" : "text.primary",
                  fontFamily: "inherit",
                  fontSize: 12,
                  fontWeight: selectedCategoryId === "unassigned" ? 800 : 600,
                  lineHeight: 1.25,
                  letterSpacing: "-0.02em",
                  cursor: "pointer",
                  boxShadow: selectedCategoryId === "unassigned" ? "0 1px 3px rgba(0, 110, 67, 0.24)" : "none",
                  transition: "background-color 120ms ease, border-color 120ms ease, color 120ms ease, box-shadow 120ms ease",
                  "&:hover": {
                    bgcolor: selectedCategoryId === "unassigned" ? brand.deep : brand.tint,
                    borderColor: selectedCategoryId === "unassigned" ? brand.deep : brand.accent,
                    color: selectedCategoryId === "unassigned" ? "#FFFFFF" : brand.accentInk,
                  },
                  "&:focus-visible": {
                    outline: `2px solid ${brand.accentInk}`,
                    outlineOffset: 2,
                  },
                }}
              >
                {`미분류 (${unassigned.length})`}
              </Box>
            </Box>
          </Paper>
        )}

        {!groups.length && !unassigned.length && (
          <Alert severity="info" sx={{ gridColumn: "1 / -1" }}>
            등록된 프롬프트가 없습니다.
          </Alert>
        )}
      </Box>
    </Paper>
  );
}

export default PromptCategoryList;
