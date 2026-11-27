import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import AttachFileRoundedIcon from "@mui/icons-material/AttachFileRounded";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import PushPinRoundedIcon from "@mui/icons-material/PushPinRounded";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

import BoardContent from "@/pages/boards/BoardContent";
import {
  boardConfig,
  categoryLabel,
  categoryTone,
  extractDomain,
  formatBoardDateTime,
  formatFileSize,
} from "@/services/board-config";
import { extractFirstExternalLink } from "@/services/board-html";
import {
  boardAttachmentUrl,
  boardError,
  deleteBoardPost,
  getAdminBoardPost,
  getPublicBoardPost,
} from "@/services/board-service";
import "./boards.css";

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
  const tone = categoryTone(resolvedType, post?.category);
  const fromBoardList = embedded && Boolean(location.state?.fromBoardList);
  const externalLink = useMemo(
    () => (post?.content_format === "HTML" ? extractFirstExternalLink(post.content) : null),
    [post],
  );
  const externalDomain = extractDomain(externalLink?.href);

  const publicListButton = (variant = "text") => (
    embedded && fromBoardList ? (
      <Button variant={variant} onClick={() => navigate(-1)} startIcon={<ArrowBackRoundedIcon />}>
        목록으로 돌아가기
      </Button>
    ) : embedded ? (
      <Button component={Link} to={`/boards/${resolvedType}`} variant={variant} startIcon={<ArrowBackRoundedIcon />}>
        {config?.label || "게시판"} 목록으로
      </Button>
    ) : (
      <Button component={Link} to="/" variant={variant} startIcon={<ArrowBackRoundedIcon />}>
        보조개 메인으로
      </Button>
    )
  );

  const body = (
    <Box className="board-workspace">
      <div className="board-detail-topbar">
        <div className="board-breadcrumb">
          {admin ? (
            <>
              <Link to={`/admin/boards/${boardType}`}>{config?.adminLabel || "게시판 관리"}</Link>
              <span>/</span>
              <span>게시글 상세</span>
            </>
          ) : embedded ? (
            <>
              <Link to={`/boards/${resolvedType}`}>{config?.label || "게시판"}</Link>
              <span>/</span>
              <span>게시글 상세</span>
            </>
          ) : (
            <span>{config?.label || "보조개 게시판"}</span>
          )}
        </div>
        {admin ? (
          <Button component={Link} to={`/admin/boards/${boardType}`} variant="outlined" size="small" startIcon={<ArrowBackRoundedIcon />}>
            목록으로
          </Button>
        ) : (
          post && publicListButton("outlined")
        )}
      </div>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {notice && <Alert severity="success" onClose={() => setNotice("")} sx={{ mb: 2 }}>{notice}</Alert>}

      {!post && !error && (
        <div className="board-detail-card" style={{ padding: 32 }}>
          <Skeleton variant="text" width="32%" height={28} />
          <Skeleton variant="text" width="84%" height={42} sx={{ mt: 1 }} />
          <Skeleton variant="text" width="46%" height={22} sx={{ mb: 3 }} />
          <Skeleton variant="rounded" height={240} />
        </div>
      )}

      {post && (
        <article className="board-detail-card">
          <header className="board-detail-header">
            <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
              <span className="board-badge board-badge--slate">{config?.label || resolvedType}</span>
              <span className={`board-badge board-badge--${tone}`}>
                {categoryLabel(resolvedType, post.category)}
              </span>
              {post.is_pinned && (
                <span className="board-badge board-badge--pin">
                  <PushPinRoundedIcon sx={{ fontSize: 12 }} />
                  상단 고정
                </span>
              )}
            </div>
            <h1 className="board-detail-title">{post.title}</h1>
            <div className="board-detail-meta">
              <span className="board-detail-meta-item">
                <CalendarTodayOutlinedIcon sx={{ fontSize: 14 }} />
                {formatBoardDateTime(post.created_at)}
              </span>
              <span className="board-detail-meta-item">
                <VisibilityOutlinedIcon sx={{ fontSize: 15 }} />
                조회 {Number(post.view_count || 0).toLocaleString("ko-KR")}
              </span>
              {post.updated_at !== post.created_at && (
                <span className="board-detail-meta-item">
                  수정 {formatBoardDateTime(post.updated_at)}
                </span>
              )}
            </div>
          </header>

          <div className="board-detail-body">
            <BoardContent post={post} />

            {externalLink && (
              <div className="board-source-banner">
                <div style={{ minWidth: 0, flex: "1 1 240px" }}>
                  <Typography fontSize={12} fontWeight={800} color="#1d4ed8">
                    원문 기사 바로가기 {externalDomain ? `· ${externalDomain}` : ""}
                  </Typography>
                  <Typography fontSize={14} fontWeight={700} color="#121314" sx={{ mt: 0.25, overflowWrap: "anywhere" }}>
                    {externalLink.text}
                  </Typography>
                </div>
                <Button
                  component="a"
                  href={externalLink.href}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  variant="contained"
                  endIcon={<OpenInNewRoundedIcon />}
                  sx={{
                    borderRadius: "11px",
                    bgcolor: "#1d4ed8",
                    "&:hover": { bgcolor: "#1e40af" },
                    flexShrink: 0,
                  }}
                >
                  원문 기사 열기
                </Button>
              </div>
            )}

            {post.files?.length > 0 && (
              <div className="board-attachments-box">
                <Typography fontSize={13.5} fontWeight={850} color="#121314" sx={{ mb: 1.25 }}>
                  첨부파일 ({post.files.length})
                </Typography>
                <Stack spacing={1}>
                  {post.files.map((file) => (
                    <a
                      key={file.id}
                      href={boardAttachmentUrl(post.id, file.id)}
                      className="board-attachment-item"
                    >
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0 }}>
                        <AttachFileRoundedIcon fontSize="small" sx={{ color: "#006e43", flexShrink: 0 }} />
                        <Typography fontSize={13.5} fontWeight={700} noWrap>
                          {file.original_filename}
                        </Typography>
                      </Stack>
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ flexShrink: 0, color: "#64748b" }}>
                        {file.size_bytes != null && (
                          <Typography fontSize={12} fontWeight={650}>
                            {formatFileSize(file.size_bytes)}
                          </Typography>
                        )}
                        <DownloadRoundedIcon fontSize="small" />
                      </Stack>
                    </a>
                  ))}
                </Stack>
              </div>
            )}
          </div>

          <footer className="board-detail-footer">
            <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
              {!admin && publicListButton("outlined")}
              <Button variant="outlined" onClick={copyLink} startIcon={<ContentCopyRoundedIcon />}>
                공유 링크 복사
              </Button>
            </Stack>
            {admin && (
              <Stack direction="row" spacing={1}>
                <Button
                  component={Link}
                  to={`/admin/boards/${boardType}/${post.id}/edit`}
                  variant="outlined"
                  startIcon={<EditOutlinedIcon />}
                >
                  수정
                </Button>
                <Button
                  color="error"
                  variant="outlined"
                  startIcon={<DeleteOutlineRoundedIcon />}
                  onClick={() => setConfirmDelete(true)}
                >
                  삭제
                </Button>
              </Stack>
            )}
          </footer>
        </article>
      )}

      <Dialog open={confirmDelete} onClose={() => !working && setConfirmDelete(false)}>
        <DialogTitle>게시글 삭제</DialogTitle>
        <DialogContent>
          <Typography>이 게시글과 첨부파일을 삭제할까요?</Typography>
        </DialogContent>
        <DialogActions>
          <Button disabled={working} onClick={() => setConfirmDelete(false)}>취소</Button>
          <Button disabled={working} color="error" variant="contained" onClick={remove}>
            {working ? "삭제 중…" : "삭제"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );

  if (admin || embedded) return body;
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <Box
        component="header"
        sx={{
          bgcolor: "#fff",
          borderBottom: "1px solid var(--bojogae-line)",
          px: { xs: 2, md: 4 },
          py: 1.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <img src="/bojogae-icon.png" alt="보조개" style={{ width: 28, height: 28, borderRadius: 8 }} />
          <Typography fontWeight={900} fontSize={17} color="primary.dark">BOJOGAE</Typography>
        </Link>
        <Typography variant="caption" fontWeight={700} color="text.secondary">
          {config?.label || "게시판"}
        </Typography>
      </Box>
      {body}
    </Box>
  );
}
