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
      <Typography sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", lineHeight: 1.85, minHeight: 180 }}>
        {content}
      </Typography>
    );
  }
  return (
    <Box
      className="sun-editor-editable"
      sx={{ p: "0 !important", minHeight: 180, overflowWrap: "anywhere", lineHeight: 1.85, "& table": { maxWidth: "100%" } }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
