/* eslint-disable react/prop-types */
import { useState } from "react";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import { Box, Collapse, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";

export default function MobileCollapsibleInfo({
  title,
  badge = null,
  action = null,
  toggleLabel = "자세히 보기",
  closeLabel = "접기",
  defaultOpen = false,
  breakpoint = "md",
  sx,
  children,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down(breakpoint));
  const [open, setOpen] = useState(defaultOpen);

  if (!isMobile) {
    return <>{children}</>;
  }

  return (
    <Box sx={{ mb: 1.5, ...sx }}>
      <div
        style={{
          border: "1px solid #E2E8F0",
          borderStyle: "solid",
          borderRadius: 12,
          backgroundColor: "#FFFFFF",
          padding: "8px 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
          minWidth: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            minWidth: 0,
            flex: 1,
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: 15,
              fontWeight: 900,
              letterSpacing: "-0.02em",
              color: "#0F172A",
              lineHeight: 1.25,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {title}
          </h1>
          {typeof badge === "string" ? (
            <span
              style={{
                padding: "2px 8px",
                borderRadius: 999,
                backgroundColor: "#F1F5F9",
                color: "#475569",
                fontSize: 11,
                fontWeight: 800,
                lineHeight: 1.4,
                flexShrink: 0,
                whiteSpace: "nowrap",
              }}
            >
              {badge}
            </span>
          ) : (
            badge
          )}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            flexShrink: 0,
          }}
        >
          {action}
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            aria-expanded={open}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 3,
              minWidth: 0,
              padding: "5px 10px",
              minHeight: 30,
              borderRadius: 999,
              borderStyle: "solid",
              borderWidth: 1,
              borderColor: open ? "#A7F3D0" : "#E2E8F0",
              backgroundColor: open ? "#ECFDF5" : "#F1F5F9",
              color: open ? "#006E43" : "#334155",
              fontSize: 11.5,
              fontWeight: 800,
              lineHeight: 1.2,
              cursor: "pointer",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            <span>{open ? closeLabel : toggleLabel}</span>
            {open ? (
              <ExpandLessRoundedIcon style={{ width: 16, height: 16, fontSize: 16, flexShrink: 0 }} />
            ) : (
              <ExpandMoreRoundedIcon style={{ width: 16, height: 16, fontSize: 16, flexShrink: 0 }} />
            )}
          </button>
        </div>
      </div>

      <Collapse in={open}>
        <div style={{ paddingTop: 10 }}>{children}</div>
      </Collapse>
    </Box>
  );
}
