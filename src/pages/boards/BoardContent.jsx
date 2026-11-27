import { Box, Typography } from "@mui/material";
import { useMemo } from "react";
import "suneditor/dist/css/suneditor.min.css";

import { sanitizeBoardHtml } from "@/services/board-html";

export default function BoardContent({ post }) { // eslint-disable-line react/prop-types
  const { content, content_format: contentFormat } = post; // eslint-disable-line react/prop-types
  const html = useMemo(
    () => (contentFormat === "HTML" ? sanitizeBoardHtml(content) : ""),
    [content, contentFormat],
  );

  if (contentFormat !== "HTML") {
    return (
      <Typography sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", lineHeight: 1.85, fontSize: 15.5, color: "#1f2937", minHeight: 140 }}>
        {content}
      </Typography>
    );
  }
  return (
    <Box
      className="sun-editor-editable board-prose"
      sx={{ p: "0 !important", minHeight: 140, overflowWrap: "anywhere" }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
