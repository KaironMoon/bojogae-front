/* eslint-disable react/prop-types */
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import AttachFileRoundedIcon from "@mui/icons-material/AttachFileRounded";
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import NewspaperOutlinedIcon from "@mui/icons-material/NewspaperOutlined";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import PushPinRoundedIcon from "@mui/icons-material/PushPinRounded";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import {
  Alert,
  Box,
  Button,
  IconButton,
  InputAdornment,
  Pagination,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  BOARD_ORDER,
  boardConfig,
  categoryLabel,
  categoryTone,
  extractDomain,
  formatBoardDate,
  isRecentPost,
} from "@/services/board-config";
import { boardError, listBoardPosts } from "@/services/board-service";
import "./boards.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

const BOARD_ICONS = {
  notices: CampaignOutlinedIcon,
  "industry-news": NewspaperOutlinedIcon,
  "insurance-knowledge": SchoolOutlinedIcon,
};

function BoardThumbnail({ src, alt = "", className = "", fallbackClassName = "" }) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;
  return (
    <Box className={`${className} ${!showImage ? fallbackClassName : ""}`.trim()}>
      <img
        src={showImage ? `${API_BASE_URL}${src}` : "/bojogae-icon.png"}
        alt={alt}
        loading="lazy"
        onError={showImage ? () => setFailed(true) : undefined}
      />
    </Box>
  );
}

function NewsCard({ item, boardType, target, state }) {
  const tone = categoryTone(boardType, item.category);
  const domain = extractDomain(item.source_url);
  const dateLabel = formatBoardDate(item.created_at);
  const isNew = isRecentPost(item.created_at, 7);

  return (
    <article className="board-news-card">
      <BoardThumbnail
        key={item.thumbnail_url || `news-${item.id}`}
        src={item.thumbnail_url}
        alt={item.title}
        className="board-news-thumb"
        fallbackClassName="board-news-thumb--fallback"
      />
      <div className="board-news-body">
        <div>
          <div className="board-news-meta-top">
            {item.is_pinned && (
              <span className="board-badge board-badge--pin">
                <PushPinRoundedIcon sx={{ fontSize: 12 }} />
                고정
              </span>
            )}
            <span className={`board-badge board-badge--${tone}`}>
              {categoryLabel(boardType, item.category)}
            </span>
            {isNew && <span className="board-badge board-badge--new">NEW</span>}
            {domain && <span className="board-domain-chip">{domain}</span>}
            {dateLabel && <span className="board-meta-date">{dateLabel}</span>}
          </div>

          <h2 className="board-news-title" style={{ marginTop: 7 }}>
            <Link to={target} state={state} className="board-news-card-link">
              {item.title}
            </Link>
          </h2>

          {item.summary && (
            <p className="board-news-summary" style={{ marginTop: 6 }}>
              {item.summary}
            </p>
          )}
        </div>

        <div className="board-news-footer">
          <div className="board-news-stats">
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <VisibilityOutlinedIcon sx={{ fontSize: 14 }} />
              {Number(item.view_count || 0).toLocaleString("ko-KR")}
            </span>
            {item.attachment_count > 0 && (
              <span className="board-attach-chip">
                <AttachFileRoundedIcon sx={{ fontSize: 13 }} />
                {item.attachment_count}
              </span>
            )}
          </div>
          <div className="board-news-actions">
            {item.source_url && (
              <a
                href={item.source_url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="board-source-pill"
              >
                원문 보기
                <OpenInNewRoundedIcon sx={{ fontSize: 13 }} />
              </a>
            )}
            <span className="board-readmore-cue">
              요약 보기
              <ArrowForwardRoundedIcon sx={{ fontSize: 14 }} />
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

function NoticeRow({ item, boardType, target, state }) {
  const tone = categoryTone(boardType, item.category);
  const dateLabel = formatBoardDate(item.created_at);
  const isNew = isRecentPost(item.created_at, 7);

  return (
    <Link
      to={target}
      state={state}
      className={`board-notice-row ${item.is_pinned ? "board-notice-row--pinned" : ""}`}
    >
      <div className="board-notice-main">
        <div className="board-notice-badges">
          {item.is_pinned && (
            <span className="board-badge board-badge--pin">
              <PushPinRoundedIcon sx={{ fontSize: 12 }} />
              중요 공지
            </span>
          )}
          <span className={`board-badge board-badge--${tone}`}>
            {categoryLabel(boardType, item.category)}
          </span>
          {isNew && <span className="board-badge board-badge--new">NEW</span>}
        </div>
        <h2 className="board-notice-title">{item.title}</h2>
        {item.summary && <p className="board-notice-summary">{item.summary}</p>}
      </div>

      <div className="board-notice-side">
        <div className="board-notice-meta">
          {item.attachment_count > 0 && (
            <span className="board-attach-chip">
              <AttachFileRoundedIcon sx={{ fontSize: 13 }} />
              첨부 {item.attachment_count}
            </span>
          )}
          {dateLabel && <span>{dateLabel}</span>}
          <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
            <VisibilityOutlinedIcon sx={{ fontSize: 14 }} />
            {Number(item.view_count || 0).toLocaleString("ko-KR")}
          </span>
        </div>
        <ChevronRightRoundedIcon sx={{ color: "#94a3b8", fontSize: 20, display: { xs: "none", sm: "block" } }} />
      </div>
    </Link>
  );
}

function KnowledgeCard({ item, boardType, target, state }) {
  const tone = categoryTone(boardType, item.category);
  const dateLabel = formatBoardDate(item.created_at);
  const isNew = isRecentPost(item.created_at, 7);

  return (
    <Link to={target} state={state} className="board-knowledge-card">
      <BoardThumbnail
        key={item.thumbnail_url || `knowledge-${item.id}`}
        src={item.thumbnail_url}
        alt={item.title}
        className="board-knowledge-thumb"
        fallbackClassName="board-knowledge-thumb--fallback"
      />
      <div className="board-knowledge-body">
        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
          {item.is_pinned && (
            <span className="board-badge board-badge--pin">
              <PushPinRoundedIcon sx={{ fontSize: 12 }} />
              고정
            </span>
          )}
          <span className={`board-badge board-badge--${tone}`}>
            {categoryLabel(boardType, item.category)}
          </span>
          {isNew && <span className="board-badge board-badge--new">NEW</span>}
        </div>
        <h2 className="board-knowledge-title">{item.title}</h2>
        {item.summary && <p className="board-knowledge-summary">{item.summary}</p>}
        <div className="board-knowledge-footer">
          <span>{dateLabel}</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            {item.attachment_count > 0 && (
              <span className="board-attach-chip">
                <AttachFileRoundedIcon sx={{ fontSize: 12 }} />
                {item.attachment_count}
              </span>
            )}
            <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
              <VisibilityOutlinedIcon sx={{ fontSize: 14 }} />
              {Number(item.view_count || 0).toLocaleString("ko-KR")}
            </span>
          </span>
        </div>
      </div>
    </Link>
  );
}

function BoardSkeleton({ boardType }) {
  if (boardType === "industry-news") {
    return (
      <div className="board-news-list">
        {[0, 1, 2, 3].map((idx) => (
          <div key={idx} className="board-news-card">
            <Skeleton variant="rounded" sx={{ width: "100%", height: { xs: 90, sm: 132, md: 156 }, borderRadius: 2 }} />
            <Stack spacing={1} justifyContent="center">
              <Skeleton variant="text" width="38%" height={22} />
              <Skeleton variant="text" width="88%" height={28} />
              <Skeleton variant="text" width="96%" height={20} />
              <Skeleton variant="text" width="74%" height={20} />
            </Stack>
          </div>
        ))}
      </div>
    );
  }
  if (boardType === "insurance-knowledge") {
    return (
      <div className="board-knowledge-grid">
        {[0, 1, 2].map((idx) => (
          <Box key={idx} sx={{ borderRadius: "18px", overflow: "hidden", border: "1px solid #e6eaee", bgcolor: "#fff" }}>
            <Skeleton variant="rectangular" height={190} />
            <Box sx={{ p: 2.25 }}>
              <Skeleton variant="text" width="35%" height={24} />
              <Skeleton variant="text" width="90%" height={28} />
              <Skeleton variant="text" width="75%" height={20} />
            </Box>
          </Box>
        ))}
      </div>
    );
  }
  return (
    <div className="board-notice-list">
      {[0, 1, 2, 3].map((idx) => (
        <Box key={idx} className="board-notice-row">
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Skeleton variant="text" width="28%" height={22} />
            <Skeleton variant="text" width="76%" height={28} />
            <Skeleton variant="text" width="60%" height={18} />
          </Box>
        </Box>
      ))}
    </div>
  );
}

export default function BoardListPage({ admin = false }) {
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

  if (!config) {
    return (
      <Box className="board-workspace">
        <Alert severity="error">게시판을 찾을 수 없습니다.</Alert>
      </Box>
    );
  }

  const HeroIcon = BOARD_ICONS[boardType] || CampaignOutlinedIcon;
  const hasFilters = Boolean(category || query);

  function search(event) {
    event.preventDefault();
    setPage(1);
    setQuery(draftQuery.trim());
  }

  function resetFilters() {
    setCategory("");
    setDraftQuery("");
    setQuery("");
    setPage(1);
  }

  return (
    <Box className={`board-workspace board-workspace--${boardType}`}>
      <header className={`board-hero board-hero--${boardType}`}>
        <div className="board-hero-main">
          <div className="board-hero-icon" aria-hidden="true">
            <HeroIcon sx={{ fontSize: 26 }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="board-hero-pill-row">
              <span className="board-hero-pill">{config.badgeText}</span>
              {admin && <span className="board-badge board-badge--slate">관리자 모드</span>}
            </div>
            <h1 className="board-hero-title">{admin ? config.adminLabel : config.label}</h1>
            <p className="board-hero-desc">
              {admin ? config.adminDescription : config.description}
            </p>
          </div>
        </div>
        {admin && (
          <div className="board-hero-actions">
            <Button
              component={Link}
              to={`/admin/boards/${boardType}/new`}
              variant="contained"
              startIcon={<AddRoundedIcon />}
              className="board-write-btn"
            >
              글 작성
            </Button>
          </div>
        )}
      </header>

      <nav className="board-switcher" aria-label="게시판 이동">
        {BOARD_ORDER.map((typeKey) => {
          const itemCfg = boardConfig(typeKey);
          const TabIcon = BOARD_ICONS[typeKey] || CampaignOutlinedIcon;
          const active = typeKey === boardType;
          return (
            <Link
              key={typeKey}
              to={admin ? `/admin/boards/${typeKey}` : `/boards/${typeKey}`}
              aria-current={active ? "page" : undefined}
              className="board-switch-tab"
            >
              <TabIcon sx={{ fontSize: 17 }} />
              {admin ? itemCfg.adminLabel : itemCfg.label}
            </Link>
          );
        })}
      </nav>

      <section className="board-toolbar" aria-label="분류 및 검색">
        <div className="board-filter-row">
          <div className="board-category-pills" role="group" aria-label="분류 필터">
            <button
              type="button"
              className="board-category-pill"
              aria-pressed={category === ""}
              onClick={() => { setCategory(""); setPage(1); }}
            >
              전체
            </button>
            {Object.entries(config.categories).map(([value, label]) => (
              <button
                key={value}
                type="button"
                className="board-category-pill"
                aria-pressed={category === value}
                onClick={() => { setCategory(value); setPage(1); }}
              >
                {label}
              </button>
            ))}
          </div>
          {result && (
            <span className="board-total-count">
              총 <strong>{Number(result.total || 0).toLocaleString("ko-KR")}</strong>건
            </span>
          )}
        </div>

        <form onSubmit={search} className="board-search-form">
          <TextField
            size="small"
            fullWidth
            placeholder="제목 또는 본문 내용 검색"
            value={draftQuery}
            inputProps={{ maxLength: 200 }}
            onChange={(event) => setDraftQuery(event.target.value)}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px", bgcolor: "#f8fafc" } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon fontSize="small" sx={{ color: "#64748b" }} />
                </InputAdornment>
              ),
              endAdornment: (draftQuery || query) ? (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    aria-label="검색어 지우기"
                    onClick={() => {
                      setDraftQuery("");
                      if (query) {
                        setQuery("");
                        setPage(1);
                      }
                    }}
                  >
                    <CloseRoundedIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
          />
          <Button type="submit" variant="outlined" className="board-search-btn">
            검색
          </Button>
        </form>
      </section>

      {error && <Alert severity="error" sx={{ mb: 2.5 }}>{error}</Alert>}
      {!result && !error && <BoardSkeleton boardType={boardType} />}

      {result && result.items.length > 0 && (
        <Box
          className={
            boardType === "industry-news"
              ? "board-news-list"
              : boardType === "insurance-knowledge"
                ? "board-knowledge-grid"
                : "board-notice-list"
          }
        >
          {result.items.map((item) => {
            const target = admin ? `/admin/boards/${boardType}/${item.id}` : `/boards/${boardType}/${item.id}`;
            const state = admin ? undefined : { fromBoardList: true };
            if (boardType === "industry-news") {
              return <NewsCard key={item.id} item={item} boardType={boardType} target={target} state={state} />;
            }
            if (boardType === "insurance-knowledge") {
              return <KnowledgeCard key={item.id} item={item} boardType={boardType} target={target} state={state} />;
            }
            return <NoticeRow key={item.id} item={item} boardType={boardType} target={target} state={state} />;
          })}
        </Box>
      )}

      {result && result.items.length === 0 && (
        <div className="board-empty">
          <Typography fontWeight={800} fontSize={16} color="#121314">
            {hasFilters ? "조건에 맞는 게시글이 없습니다." : "아직 등록된 게시글이 없습니다."}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
            {hasFilters ? "다른 분류를 선택하거나 검색어를 초기화해 보세요." : "새로운 소식이 등록되면 이곳에 표시됩니다."}
          </Typography>
          {hasFilters && (
            <Button variant="outlined" onClick={resetFilters} sx={{ mt: 2 }}>
              필터 초기화
            </Button>
          )}
        </div>
      )}

      {result?.total_pages > 1 && (
        <Pagination
          page={page}
          count={result.total_pages}
          color="primary"
          shape="rounded"
          onChange={(_, value) => setPage(value)}
          sx={{ mt: 3.5, display: "flex", justifyContent: "center" }}
        />
      )}
    </Box>
  );
}
