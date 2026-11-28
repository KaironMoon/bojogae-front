/* eslint-disable react/prop-types */
import { Box, Chip, Paper, Stack, TableContainer, Typography } from "@mui/material";

export function AdminPageContainer({ maxWidth = 1360, children }) {
  return (
    <Box
      component="main"
      sx={{
        p: { xs: 1.5, sm: 2.5, md: 3.5 },
        maxWidth,
        width: "100%",
        mx: "auto",
        minWidth: 0,
        boxSizing: "border-box",
      }}
    >
      {children}
    </Box>
  );
}

export function AdminPageHeader({ icon: Icon, badge, title, description, actions }) {
  return (
    <Stack
      direction={{ xs: "column", lg: "row" }}
      justifyContent="space-between"
      alignItems={{ xs: "stretch", lg: "center" }}
      gap={2}
      sx={{ mb: 2.5 }}
    >
      <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ minWidth: 0 }}>
        {Icon && (
          <Box
            sx={{
              width: { xs: 40, sm: 44 },
              height: { xs: 40, sm: 44 },
              borderRadius: 3,
              bgcolor: "#ECFDF5",
              color: "#03C75A",
              border: "1px solid rgba(3, 199, 90, 0.22)",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
              mt: 0.25,
            }}
          >
            <Icon fontSize="small" />
          </Box>
        )}
        <Box sx={{ minWidth: 0 }}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <Typography
              component="h1"
              variant="h4"
              sx={{
                fontWeight: 850,
                fontSize: { xs: "1.35rem", sm: "1.6rem", md: "1.75rem" },
                letterSpacing: "-0.03em",
                lineHeight: 1.2,
              }}
            >
              {title}
            </Typography>
            {badge && (
              <Chip
                size="small"
                label={badge}
                sx={{
                  height: 22,
                  fontSize: "0.72rem",
                  fontWeight: 800,
                  bgcolor: "#F1F5F9",
                  color: "#334155",
                }}
              />
            )}
          </Stack>
          {description && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.45, lineHeight: 1.5 }}>
              {description}
            </Typography>
          )}
        </Box>
      </Stack>
      {actions && (
        <Stack
          direction="row"
          spacing={1}
          flexWrap="wrap"
          useFlexGap
          alignItems="center"
          sx={{ justifyContent: { xs: "flex-start", lg: "flex-end" }, flexShrink: 0 }}
        >
          {actions}
        </Stack>
      )}
    </Stack>
  );
}

export function AdminStatGrid({ columns = { xs: "repeat(2, 1fr)", md: "repeat(4, 1fr)" }, children }) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: columns,
        gap: { xs: 1.25, sm: 1.75 },
        mb: 2.5,
      }}
    >
      {children}
    </Box>
  );
}

export function AdminStatCard({
  label,
  value,
  subtext,
  icon: Icon,
  color = "#03C75A",
  bg = "#ECFDF5",
  onClick,
  active = false,
}) {
  return (
    <Paper
      variant="outlined"
      onClick={onClick}
      sx={{
        p: { xs: 1.5, sm: 2 },
        borderRadius: 3,
        bgcolor: active ? "#F0FDF4" : "#FFFFFF",
        borderColor: active ? color : "var(--bojogae-line)",
        borderWidth: active ? 2 : 1,
        cursor: onClick ? "pointer" : "default",
        transition: "border-color 140ms ease, box-shadow 140ms ease",
        ...(onClick && {
          "&:hover": {
            borderColor: color,
            boxShadow: "0 4px 12px rgba(15, 23, 42, 0.05)",
          },
        }),
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontWeight: 750, display: "block", letterSpacing: "-0.01em" }}
          >
            {label}
          </Typography>
          <Typography
            sx={{
              mt: 0.4,
              fontWeight: 850,
              fontSize: { xs: "1.15rem", sm: "1.45rem" },
              letterSpacing: "-0.03em",
              color: "#0F172A",
              fontVariantNumeric: "tabular-nums",
              lineHeight: 1.2,
            }}
          >
            {value}
          </Typography>
        </Box>
        {Icon && (
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: 2,
              bgcolor: bg,
              color,
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            <Icon sx={{ fontSize: 18 }} />
          </Box>
        )}
      </Stack>
      {subtext && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
          {subtext}
        </Typography>
      )}
    </Paper>
  );
}

export function AdminFilterBar({ children, sx }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: { xs: 1.5, sm: 2 },
        mb: 2.5,
        borderRadius: 3,
        bgcolor: "#FFFFFF",
        ...sx,
      }}
    >
      {children}
    </Paper>
  );
}

export function AdminTableCard({ children, sx }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: 3,
        overflow: "hidden",
        bgcolor: "#FFFFFF",
        ...sx,
      }}
    >
      <TableContainer
        sx={{
          "& .MuiTableHead-root .MuiTableCell-root": {
            bgcolor: "#F8FAFC",
            color: "#475569",
            fontWeight: 800,
            fontSize: "0.78rem",
            whiteSpace: "nowrap",
            borderBottom: "1px solid #E2E8F0",
            py: 1.4,
          },
          "& .MuiTableBody-root .MuiTableRow-root:last-child .MuiTableCell-root": {
            borderBottom: 0,
          },
        }}
      >
        {children}
      </TableContainer>
    </Paper>
  );
}

export function AdminEmptyState({ icon: Icon, title, description, action }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        py: 6,
        px: 3,
        borderRadius: 3,
        textAlign: "center",
        bgcolor: "#FFFFFF",
      }}
    >
      <Stack spacing={1} alignItems="center">
        {Icon && (
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              bgcolor: "#F1F5F9",
              color: "#64748B",
              display: "grid",
              placeItems: "center",
              mb: 0.5,
            }}
          >
            <Icon />
          </Box>
        )}
        <Typography variant="subtitle1" fontWeight={800} color="#0F172A">
          {title}
        </Typography>
        {description && (
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420 }}>
            {description}
          </Typography>
        )}
        {action && <Box sx={{ pt: 1 }}>{action}</Box>}
      </Stack>
    </Paper>
  );
}
