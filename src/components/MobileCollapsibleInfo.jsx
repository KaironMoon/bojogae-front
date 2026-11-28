/* eslint-disable react/prop-types */
import { useState } from "react";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import { Box, Button, Collapse, Typography, useMediaQuery } from "@mui/material";
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
      <Box
        sx={{
          border: "1px solid #E2E8F0",
          borderRadius: 2.5,
          bgcolor: "#FFFFFF",
          px: 1.5,
          py: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          boxShadow: "0 1px 2px rgba(15, 23, 42, 0.03)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, minWidth: 0, flex: 1 }}>
          <Typography
            component="h1"
            sx={{
              fontSize: 15.5,
              fontWeight: 900,
              letterSpacing: "-0.02em",
              color: "#0F172A",
              lineHeight: 1.25,
            }}
            noWrap
          >
            {title}
          </Typography>
          {typeof badge === "string" ? (
            <Box
              component="span"
              sx={{
                px: 0.85,
                py: 0.25,
                borderRadius: 99,
                bgcolor: "#F1F5F9",
                color: "#475569",
                fontSize: 11,
                fontWeight: 800,
                flexShrink: 0,
                whiteSpace: "nowrap",
              }}
            >
              {badge}
            </Box>
          ) : (
            badge
          )}
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexShrink: 0 }}>
          {action}
          <Button
            size="small"
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            aria-expanded={open}
            endIcon={open ? <ExpandLessRoundedIcon fontSize="small" /> : <ExpandMoreRoundedIcon fontSize="small" />}
            sx={{
              minWidth: 0,
              px: 1,
              py: 0.4,
              minHeight: 30,
              borderRadius: 99,
              fontSize: 11.5,
              fontWeight: 800,
              textTransform: "none",
              color: open ? "#006E43" : "#475569",
              bgcolor: open ? "#ECFDF5" : "#F1F5F9",
              flexShrink: 0,
              "&:hover": {
                bgcolor: open ? "#DCFCE7" : "#E2E8F0",
              },
              "& .MuiButton-endIcon": { ml: 0.25 },
            }}
          >
            {open ? closeLabel : toggleLabel}
          </Button>
        </Box>
      </Box>

      <Collapse in={open}>
        <Box sx={{ pt: 1.25 }}>{children}</Box>
      </Collapse>
    </Box>
  );
}
