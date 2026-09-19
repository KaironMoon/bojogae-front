import AddRoundedIcon from "@mui/icons-material/AddRounded";
import PushPinOutlinedIcon from "@mui/icons-material/PushPinOutlined";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import {
  Alert, Box, Button, Chip, InputAdornment, MenuItem, Pagination, Paper,
  Stack, TextField, Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { boardConfig, categoryLabel } from "@/services/board-config";
import { boardError, listBoardPosts } from "@/services/board-service";


export default function BoardListPage({ admin = false }) { // eslint-disable-line react/prop-types
  const { boardType } = useParams();
  const config = boardConfig(boardType);
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState("");
  const [draftQuery, setDraftQuery] = useState("");
  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!config) return;
    setError("");
    try {
      setResult(await listBoardPosts(boardType, { page, category, q: query, admin }));
    } catch (err) {
      setError(boardError(err));
    }
  }, [admin, boardType, category, config, page, query]);

  useEffect(() => {
    setPage(1);
    setCategory("");
    setDraftQuery("");
    setQuery("");
  }, [boardType]);

  useEffect(() => {
    setResult(null);
    load();
  }, [load]);

  if (!config) return <Alert severity="error">게시판을 찾을 수 없습니다.</Alert>;

  function search(event) {
    event.preventDefault();
    setPage(1);
    setQuery(draftQuery.trim());
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1100, mx: "auto" }}>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={800}>{admin ? config.adminLabel : config.label}</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            {admin ? "게시글을 작성하고 공개 내용을 관리합니다." : "새로운 소식과 유용한 정보를 확인하세요."}
          </Typography>
        </Box>
        {admin && (
          <Button component={Link} to={`/admin/boards/${boardType}/new`} variant="contained" startIcon={<AddRoundedIcon />} sx={{ alignSelf: { sm: "center" } }}>
            글 작성
          </Button>
        )}
      </Stack>

      <Paper component="form" onSubmit={search} variant="outlined" sx={{ p: 2, mb: 2.5, borderRadius: 2.5 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          <TextField
            select size="small" label="분류" value={category} sx={{ minWidth: { sm: 210 } }}
            onChange={event => { setCategory(event.target.value); setPage(1); }}
          >
            <MenuItem value="">전체 분류</MenuItem>
            {Object.entries(config.categories).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
          </TextField>
          <TextField
            size="small" fullWidth placeholder="제목과 내용 검색" value={draftQuery}
            inputProps={{ maxLength: 200 }} onChange={event => setDraftQuery(event.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment> }}
          />
          <Button type="submit" variant="outlined">검색</Button>
        </Stack>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {!result && !error && <Typography color="text.secondary">게시글을 불러오는 중입니다.</Typography>}
      <Stack spacing={1.25}>
        {result?.items.map(item => {
          const target = admin ? `/admin/boards/${boardType}/${item.id}` : `/boards/${boardType}/${item.id}`;
          return (
            <Paper
              key={item.id}
              component={Link}
              to={target}
              state={admin ? undefined : { fromBoardList: true }}
              variant="outlined"
              sx={{ p: 2.25, borderRadius: 2.5, textDecoration: "none", color: "inherit", "&:hover": { borderColor: "primary.light", bgcolor: "#fbfdff" } }}
            >
              <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1.5}>
                <Box sx={{ minWidth: 0 }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.75 }}>
                    {item.is_pinned && <PushPinOutlinedIcon color="primary" sx={{ fontSize: 18 }} />}
                    <Chip size="small" label={categoryLabel(boardType, item.category)} />
                  </Stack>
                  <Typography fontWeight={750} sx={{ overflowWrap: "anywhere" }}>{item.title}</Typography>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0, alignSelf: { sm: "center" } }}>
                  {new Date(item.created_at).toLocaleDateString("ko-KR")} · 조회 {item.view_count.toLocaleString("ko-KR")}
                </Typography>
              </Stack>
            </Paper>
          );
        })}
        {result && !result.items.length && <Paper variant="outlined" sx={{ p: 5, textAlign: "center" }}><Typography color="text.secondary">등록된 게시글이 없습니다.</Typography></Paper>}
      </Stack>
      {result?.total_pages > 1 && <Pagination page={page} count={result.total_pages} onChange={(_, value) => setPage(value)} sx={{ mt: 3, display: "flex", justifyContent: "center" }} />}
    </Box>
  );
}
