/* eslint-disable react/prop-types */
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  FormControlLabel,
  InputAdornment,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import SummarizeOutlinedIcon from "@mui/icons-material/SummarizeOutlined";
import { useEffect, useMemo, useState } from "react";

import { getPrompts, setPromptSimpleEnabled } from "@/services/prompt-service";

async function getAllPrompts() {
  const firstPage = await getPrompts(false, 1, 100);
  const rows = [...firstPage.items];
  for (let page = 2; page <= firstPage.total_pages; page += 1) {
    const nextPage = await getPrompts(false, page, 100);
    rows.push(...nextPage.items);
  }
  return rows;
}

export default function SimplePromptsPanel({
  simpleFeatureEnabled = true,
  simpleFeatureSaving = false,
  onToggleSimpleFeature,
  onPromptSimpleChanged,
}) {
  const [prompts, setPrompts] = useState([]);
  const [search, setSearch] = useState("");
  const [onlyWithSimple, setOnlyWithSimple] = useState(true);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getAllPrompts()
      .then(setPrompts)
      .catch(() => setError("프롬프트 목록을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, []);

  const simpleCount = prompts.filter((prompt) => prompt.has_simple_template).length;
  const activeSimpleCount = prompts.filter(
    (prompt) => prompt.has_simple_template && prompt.is_simple_enabled !== false,
  ).length;

  const visiblePrompts = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase("ko-KR");
    return prompts.filter((prompt) => {
      if (onlyWithSimple && !prompt.has_simple_template) return false;
      if (!keyword) return true;
      return prompt.title.toLocaleLowerCase("ko-KR").includes(keyword)
        || (prompt.report_folder || "").toLocaleLowerCase("ko-KR").includes(keyword)
        || (prompt.categories || []).some((category) => (
          category.name.toLocaleLowerCase("ko-KR").includes(keyword)
          || category.parent_name.toLocaleLowerCase("ko-KR").includes(keyword)
        ));
    });
  }, [onlyWithSimple, prompts, search]);

  const togglePromptSimple = async (prompt, checked) => {
    setSavingId(prompt.id);
    setError("");
    try {
      await setPromptSimpleEnabled(prompt.id, checked);
      setPrompts((current) => current.map((item) => (
        item.id === prompt.id ? { ...item, is_simple_enabled: checked } : item
      )));
      onPromptSimpleChanged?.(prompt.id, checked);
    } catch (requestError) {
      setError(requestError.response?.data?.detail === "simple_report_toggle_schema_required"
        ? "간소화 기능 설정을 위한 DB 설정(105_simple_report_toggle.sql)이 필요합니다."
        : "프롬프트별 간소화 상태를 변경하지 못했습니다.");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <Stack spacing={2}>
      <Paper variant="outlined" sx={{ p: { xs: 1.5, md: 2 }, borderRadius: 3 }}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ md: "center" }} gap={1.5}>
          <Box>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <SummarizeOutlinedIcon color="success" />
              <Typography variant="h6" fontWeight={800}>간소화 보고서 전체 기능</Typography>
              <Chip
                label={simpleFeatureEnabled ? "전체 켜짐" : "전체 꺼짐"}
                size="small"
                color={simpleFeatureEnabled ? "success" : "default"}
              />
              <Chip label={`보유 ${simpleCount}종 · 노출 ${activeSimpleCount}종`} size="small" variant="outlined" />
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              전체 기능을 끄면 간소화 템플릿이 있는 모든 보고서에서 간소화 미리보기 아이콘과 간소화 버전 선택 옵션이 숨겨집니다. 기존 템플릿은 유지되어 다시 켜면 즉시 복구됩니다.
            </Typography>
          </Box>
          <FormControlLabel
            control={
              <Switch
                color="success"
                checked={Boolean(simpleFeatureEnabled)}
                disabled={simpleFeatureSaving}
                onChange={(event) => onToggleSimpleFeature?.(event.target.checked)}
                inputProps={{ "aria-label": "간소화 보고서 전체 기능" }}
              />
            }
            label={simpleFeatureEnabled ? "켜짐" : "꺼짐"}
            sx={{ mr: 0, flexShrink: 0 }}
          />
        </Stack>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ xs: "stretch", sm: "center" }} sx={{ mt: 2 }}>
          <TextField
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="프롬프트, 동기화 폴더 또는 카테고리 검색"
            size="small"
            fullWidth
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment>,
            }}
          />
          <FormControlLabel
            control={<Switch size="small" checked={onlyWithSimple} onChange={(event) => setOnlyWithSimple(event.target.checked)} />}
            label="간소화 보유만 보기"
            sx={{ mr: 0, whiteSpace: "nowrap", flexShrink: 0 }}
          />
        </Stack>
      </Paper>

      {simpleFeatureEnabled === false && (
        <Alert severity="warning">
          현재 <b>간소화 보고서 전체 기능</b>이 꺼져 있습니다. 아래 개별 프롬프트 설정은 저장되지만, 전체 기능을 다시 켤 때까지 사용자 화면에는 간소화 버전이 노출되지 않습니다.
        </Alert>
      )}

      {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}

      {loading ? (
        <Box sx={{ py: 10, display: "grid", placeItems: "center" }}><CircularProgress /></Box>
      ) : (
        <Stack spacing={1}>
          {visiblePrompts.map((prompt) => {
            const enabled = prompt.is_simple_enabled !== false;
            return (
              <Paper
                key={prompt.id}
                variant="outlined"
                sx={{
                  p: { xs: 1.5, md: 2 },
                  borderRadius: 2.5,
                  borderColor: prompt.has_simple_template && enabled ? "success.light" : "divider",
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="center" gap={2}>
                  <Box sx={{ minWidth: 0 }}>
                    <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" sx={{ minWidth: 0 }}>
                      <Typography fontWeight={750} noWrap title={prompt.title} sx={{ minWidth: 0 }}>
                        {prompt.title}
                      </Typography>
                      {prompt.has_simple_template ? (
                        <Chip
                          label={enabled ? "간소화 노출" : "간소화 숨김"}
                          size="small"
                          color={enabled ? "success" : "default"}
                          variant={enabled ? "outlined" : "filled"}
                        />
                      ) : (
                        <Chip label="간소화 미지원" size="small" variant="outlined" />
                      )}
                      {prompt.report_folder && (
                        <Chip label={prompt.report_folder} size="small" variant="outlined" />
                      )}
                    </Stack>
                    <Stack direction="row" gap={0.5} flexWrap="wrap" sx={{ mt: 0.75 }}>
                      {(prompt.categories || []).map((category) => (
                        <Chip key={category.id} label={`${category.parent_name} · ${category.name}`} size="small" />
                      ))}
                      {!prompt.categories?.length && <Typography variant="caption" color="text.secondary">미분류</Typography>}
                    </Stack>
                  </Box>
                  <Switch
                    color="success"
                    checked={enabled}
                    onChange={(event) => togglePromptSimple(prompt, event.target.checked)}
                    disabled={savingId !== null}
                    inputProps={{ "aria-label": `${prompt.title} 간소화 노출` }}
                  />
                </Stack>
              </Paper>
            );
          })}
          {!visiblePrompts.length && (
            <Paper variant="outlined" sx={{ p: 4, borderRadius: 3, textAlign: "center" }}>
              <Typography color="text.secondary">조건에 맞는 프롬프트가 없습니다.</Typography>
            </Paper>
          )}
        </Stack>
      )}
    </Stack>
  );
}
