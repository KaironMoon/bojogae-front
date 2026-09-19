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
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import { useEffect, useMemo, useState } from "react";

import { getPrompts, setPromptDefaultFavorite } from "@/services/prompt-service";

async function getAllPrompts() {
  const firstPage = await getPrompts(false, 1, 100);
  const rows = [...firstPage.items];
  for (let page = 2; page <= firstPage.total_pages; page += 1) {
    const nextPage = await getPrompts(false, page, 100);
    rows.push(...nextPage.items);
  }
  return rows;
}

export default function DefaultPromptFavoritesPanel() {
  const [prompts, setPrompts] = useState([]);
  const [search, setSearch] = useState("");
  const [defaultsOnly, setDefaultsOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getAllPrompts()
      .then(setPrompts)
      .catch(() => setError("프롬프트 목록을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, []);

  const defaultCount = prompts.filter((prompt) => prompt.is_default_favorite).length;
  const visiblePrompts = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase("ko-KR");
    return prompts.filter((prompt) => {
      if (defaultsOnly && !prompt.is_default_favorite) return false;
      if (!keyword) return true;
      return prompt.title.toLocaleLowerCase("ko-KR").includes(keyword)
        || (prompt.categories || []).some((category) => (
          category.name.toLocaleLowerCase("ko-KR").includes(keyword)
          || category.parent_name.toLocaleLowerCase("ko-KR").includes(keyword)
        ));
    });
  }, [defaultsOnly, prompts, search]);

  const toggleDefault = async (prompt, checked) => {
    setSavingId(prompt.id);
    setError("");
    try {
      await setPromptDefaultFavorite(prompt.id, checked);
      setPrompts((current) => current.map((item) => (
        item.id === prompt.id ? { ...item, is_default_favorite: checked } : item
      )));
    } catch (requestError) {
      setError(requestError.response?.data?.detail === "default_prompt_favorites_schema_required"
        ? "기본 즐겨찾기 DB 설정이 필요합니다."
        : "기본 즐겨찾기 상태를 변경하지 못했습니다.");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <Stack spacing={2}>
      <Paper variant="outlined" sx={{ p: { xs: 1.5, md: 2 }, borderRadius: 3 }}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ md: "center" }} gap={1.5}>
          <Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <StarRoundedIcon sx={{ color: "#f59e0b" }} />
              <Typography variant="h6" fontWeight={800}>기본 즐겨찾기</Typography>
              <Chip label={`${defaultCount}개 지정`} size="small" color="primary" />
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              모든 사용자에게 기본으로 표시되며, 사용자는 개인별로 제외하거나 다시 추가할 수 있습니다.
            </Typography>
          </Box>
          <FormControlLabel
            control={<Switch checked={defaultsOnly} onChange={(event) => setDefaultsOnly(event.target.checked)} />}
            label="기본 지정만 보기"
            sx={{ mr: 0, flexShrink: 0 }}
          />
        </Stack>
        <TextField
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="프롬프트 또는 카테고리 검색"
          size="small"
          fullWidth
          sx={{ mt: 2 }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment>,
          }}
        />
      </Paper>

      {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}

      {loading ? (
        <Box sx={{ py: 10, display: "grid", placeItems: "center" }}><CircularProgress /></Box>
      ) : (
        <Stack spacing={1}>
          {visiblePrompts.map((prompt) => (
            <Paper key={prompt.id} variant="outlined" sx={{ p: { xs: 1.5, md: 2 }, borderRadius: 2.5, borderColor: prompt.is_default_favorite ? "primary.light" : "divider" }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" gap={2}>
                <Box sx={{ minWidth: 0 }}>
                  <Stack direction="row" spacing={0.75} alignItems="center" sx={{ minWidth: 0 }}>
                    <Typography fontWeight={750} noWrap title={prompt.title} sx={{ minWidth: 0 }}>{prompt.title}</Typography>
                    {prompt.is_default_favorite && <Chip label="기본" size="small" color="primary" variant="outlined" />}
                  </Stack>
                  <Stack direction="row" gap={0.5} flexWrap="wrap" sx={{ mt: 0.75 }}>
                    {(prompt.categories || []).map((category) => (
                      <Chip key={category.id} label={`${category.parent_name} · ${category.name}`} size="small" />
                    ))}
                    {!prompt.categories?.length && <Typography variant="caption" color="text.secondary">미분류</Typography>}
                  </Stack>
                </Box>
                <Switch
                  checked={Boolean(prompt.is_default_favorite)}
                  onChange={(event) => toggleDefault(prompt, event.target.checked)}
                  disabled={savingId !== null}
                  inputProps={{ "aria-label": `${prompt.title} 기본 즐겨찾기` }}
                />
              </Stack>
            </Paper>
          ))}
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
