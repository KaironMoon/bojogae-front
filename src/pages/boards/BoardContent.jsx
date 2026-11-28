/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from "react";
import TableRowsRoundedIcon from "@mui/icons-material/TableRowsRounded";
import ViewAgendaOutlinedIcon from "@mui/icons-material/ViewAgendaOutlined";
import ZoomInRoundedIcon from "@mui/icons-material/ZoomInRounded";
import { Box, Typography, useMediaQuery } from "@mui/material";
import "suneditor/dist/css/suneditor.min.css";

import ImageZoomDialog from "@/components/ImageZoomDialog";
import { parseBoardContentBlocks, sanitizeBoardHtml } from "@/services/board-html";

function cleanCellHtml(html) {
  return String(html || "").replace(/^(\s|&nbsp;|\u00a0)+/i, "");
}

function ResponsiveBoardTable({ block, isMobile, onHtmlClick }) {
  const canCard = block.kind === "columns" || block.kind === "kv";
  const [userChoice, setUserChoice] = useState(null);

  useEffect(() => {
    setUserChoice(null);
  }, [block.tableHtml]);

  const effectiveMode = !canCard
    ? "table"
    : (userChoice || (isMobile ? "card" : "table"));

  const rowCount = block.rows?.length || 0;

  return (
    <div className="board-table-block">
      <div className="board-table-toolbar">
        <span className="board-table-summary">
          {canCard
            ? `표 · ${rowCount}개 항목`
            : "표 · 좌우로 밀어서 확인"}
        </span>
        {canCard && (
          <div className="board-table-toggle" role="group" aria-label="표 보기 방식">
            <button
              type="button"
              className={effectiveMode === "card" ? "is-active" : undefined}
              aria-pressed={effectiveMode === "card"}
              onClick={() => setUserChoice("card")}
            >
              <ViewAgendaOutlinedIcon sx={{ fontSize: 14 }} />
              <span>카드 보기</span>
            </button>
            <button
              type="button"
              className={effectiveMode === "table" ? "is-active" : undefined}
              aria-pressed={effectiveMode === "table"}
              onClick={() => setUserChoice("table")}
            >
              <TableRowsRoundedIcon sx={{ fontSize: 14 }} />
              <span>표 보기</span>
            </button>
          </div>
        )}
      </div>

      {effectiveMode === "card" && block.kind === "columns" && (
        <div className="board-table-card-list" onClick={onHtmlClick}>
          {block.rows.map((cells, rowIdx) => (
            <div className="board-table-card" key={rowIdx}>
              {cells.map((cellHtml, colIdx) => (
                <div
                  className={colIdx === 0 ? "board-table-card-row board-table-card-row--lead" : "board-table-card-row"}
                  key={colIdx}
                >
                  {block.headers[colIdx] && (
                    <span className="board-table-card-label">{block.headers[colIdx]}</span>
                  )}
                  <div
                    className="board-table-card-value"
                    dangerouslySetInnerHTML={{ __html: cleanCellHtml(cellHtml) }}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {effectiveMode === "card" && block.kind === "kv" && (
        <div className="board-table-kv" onClick={onHtmlClick}>
          {block.rows.map((row, rowIdx) => (
            <div className="board-table-kv-row" key={rowIdx}>
              <div className="board-table-kv-label">{row.label}</div>
              <div
                className="board-table-kv-value"
                dangerouslySetInnerHTML={{ __html: cleanCellHtml(row.html) }}
              />
            </div>
          ))}
        </div>
      )}

      {effectiveMode === "table" && (
        <div className="board-table-scroll" onClick={onHtmlClick}>
          <div className="board-prose sun-editor-editable" style={{ padding: 0 }} dangerouslySetInnerHTML={{ __html: block.tableHtml }} />
        </div>
      )}
    </div>
  );
}

export default function BoardContent({ post }) {
  const { content, content_format: contentFormat } = post;
  const isMobile = useMediaQuery("(max-width: 767px)");
  const [zoomIndex, setZoomIndex] = useState(null);

  const sanitizedHtml = useMemo(
    () => (contentFormat === "HTML" ? sanitizeBoardHtml(content) : ""),
    [content, contentFormat],
  );
  const { blocks, images } = useMemo(
    () => (contentFormat === "HTML" ? parseBoardContentBlocks(sanitizedHtml) : { blocks: [], images: [] }),
    [contentFormat, sanitizedHtml],
  );

  const handleHtmlClick = (event) => {
    const targetImg = event.target?.closest?.("img[data-board-img-index]");
    if (!targetImg) return;
    const rawIdx = Number(targetImg.getAttribute("data-board-img-index"));
    if (Number.isInteger(rawIdx) && rawIdx >= 0 && rawIdx < images.length) {
      setZoomIndex(rawIdx);
    }
  };

  if (contentFormat !== "HTML") {
    return (
      <Typography sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", lineHeight: 1.85, fontSize: 15.5, color: "#1f2937", minHeight: 140 }}>
        {content}
      </Typography>
    );
  }

  return (
    <Box sx={{ minHeight: 140 }}>
      {images.length > 0 && (
        <div className="board-zoom-tip">
          <ZoomInRoundedIcon sx={{ fontSize: 15, color: "#03C75A" }} />
          <span>이미지를 누르면 크게 확대해서 볼 수 있습니다.</span>
        </div>
      )}
      {blocks.map((block, index) => (
        block.type === "table" ? (
          <ResponsiveBoardTable
            key={`tbl-${index}`}
            block={block}
            isMobile={isMobile}
            onHtmlClick={handleHtmlClick}
          />
        ) : (
          <Box
            key={`html-${index}`}
            className="sun-editor-editable board-prose"
            sx={{ p: "0 !important", overflowWrap: "anywhere" }}
            onClick={handleHtmlClick}
            dangerouslySetInnerHTML={{ __html: block.html }}
          />
        )
      ))}
      <ImageZoomDialog
        open={zoomIndex !== null}
        images={images}
        initialIndex={zoomIndex ?? 0}
        onClose={() => setZoomIndex(null)}
      />
    </Box>
  );
}
