import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import AttachFileRoundedIcon from "@mui/icons-material/AttachFileRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import {
  Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  Divider, Paper, Stack, Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

import { boardConfig, categoryLabel } from "@/services/board-config";
import {
  boardAttachmentUrl, boardError, deleteBoardPost, getAdminBoardPost, getPublicBoardPost,
} from "@/services/board-service";


export default function BoardPostPage({ admin = false, embedded = false }) { // eslint-disable-line react/prop-types
  const { boardType, postId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [post, setPost] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [working, setWorking] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try {
      setPost(admin ? await getAdminBoardPost(boardType, postId) : await getPublicBoardPost(postId));
    } catch (err) {
      setError(boardError(err));
    }
  }, [admin, boardType, postId]);

  useEffect(() => { load(); }, [load]);

  async function copyLink() {
    const link = `${window.location.origin}/board/posts/${post.id}`;
    try {
      await navigator.clipboard.writeText(link);
      setNotice("공유 링크를 복사했습니다.");
    } catch {
      window.prompt("아래 링크를 복사해주세요.", link);
    }
  }

  async function remove() {
    setWorking(true);
    try {
      await deleteBoardPost(boardType, post.id);
      navigate(`/admin/boards/${boardType}`, { replace: true });
    } catch (err) {
      setError(boardError(err));
      setConfirmDelete(false);
    } finally {
      setWorking(false);
    }
  }

  const resolvedType = post?.board_type || boardType;
  const config = boardConfig(resolvedType);
  const fromBoardList = embedded && Boolean(location.state?.fromBoardList);
  const publicListButton = (sx = {}) => embedded && fromBoardList ? (
    <Button onClick={() => navigate(-1)} startIcon={<ArrowBackRoundedIcon />} sx={sx}>
      목록으로 돌아가기
    </Button>
  ) : embedded ? (
    <Button component={Link} to={`/boards/${resolvedType}`} startIcon={<ArrowBackRoundedIcon />} sx={sx}>
      {config?.label || "게시판"} 목록으로
    </Button>
  ) : (
    <Button component={Link} to="/" startIcon={<ArrowBackRoundedIcon />} sx={sx}>
      보조개 메인으로
    </Button>
  );
  const body = (
    <Box sx={{ width: "100%", maxWidth: 1100, mx: "auto", p: { xs: 2, md: 4 } }}>
      {admin && <Button component={Link} to={`/admin/boards/${boardType}`} startIcon={<ArrowBackRoundedIcon />} sx={{ mb: 2 }}>목록으로</Button>}
      {!admin && post && publicListButton({ mb: 2 })}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {notice && <Alert severity="success" onClose={() => setNotice("")} sx={{ mb: 2 }}>{notice}</Alert>}
      {!post && !error && <Typography color="text.secondary">게시글을 불러오는 중입니다.</Typography>}
      {post && (
        <Paper variant="outlined" sx={{ borderRadius: 3, overflow: "hidden" }}>
          <Box sx={{ p: { xs: 2.5, md: 4 } }}>
            <Stack direction="row" spacing={1} sx={{ mb: 1.5, flexWrap: "wrap" }}>
              <Chip color="primary" variant="outlined" label={config?.label || resolvedType} />
              <Chip label={categoryLabel(resolvedType, post.category)} />
              {post.is_pinned && <Chip color="primary" label="상단 고정" />}
            </Stack>
            <Typography variant="h4" fontWeight={800} sx={{ overflowWrap: "anywhere" }}>{post.title}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
              {new Date(post.created_at).toLocaleString("ko-KR")} · 조회 {post.view_count.toLocaleString("ko-KR")}
              {post.updated_at !== post.created_at && ` · 수정 ${new Date(post.updated_at).toLocaleString("ko-KR")}`}
            </Typography>
            <Divider sx={{ my: 3 }} />
            <Typography sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", lineHeight: 1.85, minHeight: 180 }}>{post.content}</Typography>
            {post.files?.length > 0 && (
              <Box sx={{ mt: 4 }}>
                <Typography fontWeight={750} sx={{ mb: 1 }}>첨부파일</Typography>
                <Stack alignItems="flex-start" spacing={0.5}>
                  {post.files.map(file => (
                    <Button key={file.id} href={boardAttachmentUrl(post.id, file.id)} startIcon={<AttachFileRoundedIcon />} sx={{ textTransform: "none", maxWidth: "100%" }}>
                      <Box component="span" sx={{ overflow: "hidden", textOverflow: "ellipsis" }}>{file.original_filename}</Box>
                    </Button>
                  ))}
                </Stack>
              </Box>
            )}
          </Box>
          <Divider />
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1} sx={{ p: 2 }}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "stretch", sm: "center" }}>
              {!admin && (
                publicListButton()
              )}
              <Button onClick={copyLink} startIcon={<ContentCopyRoundedIcon />}>공유 링크 복사</Button>
            </Stack>
            {admin && (
              <Stack direction="row" spacing={1}>
                <Button component={Link} to={`/admin/boards/${boardType}/${post.id}/edit`} startIcon={<EditRoundedIcon />}>수정</Button>
                <Button color="error" onClick={() => setConfirmDelete(true)}>삭제</Button>
              </Stack>
            )}
          </Stack>
        </Paper>
      )}
      <Dialog open={confirmDelete} onClose={() => !working && setConfirmDelete(false)}>
        <DialogTitle>게시글 삭제</DialogTitle>
        <DialogContent><Typography>이 게시글과 첨부파일을 삭제할까요?</Typography></DialogContent>
        <DialogActions>
          <Button disabled={working} onClick={() => setConfirmDelete(false)}>취소</Button>
          <Button disabled={working} color="error" variant="contained" onClick={remove}>{working ? "삭제 중…" : "삭제"}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );

  if (admin || embedded) return body;
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <Box component="header" sx={{ bgcolor: "#fff", borderBottom: "1px solid #e5eaf1", px: 2.5, py: 1.75 }}>
        <Typography fontWeight={900} color="primary.main">BOJOGAE</Typography>
      </Box>
      {body}
    </Box>
  );
}
