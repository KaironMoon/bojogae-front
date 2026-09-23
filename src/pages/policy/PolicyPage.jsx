/* eslint-disable react/prop-types */
import { Fragment, useEffect } from "react";
import { Box, Button, Container, Paper, Stack, Tab, Tabs, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import GavelRoundedIcon from "@mui/icons-material/GavelRounded";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import { Link as RouterLink, useNavigate } from "react-router-dom";

import policyDocuments from "./policyContent";

const POLICY_META = {
  terms: { path: "/terms", label: "서비스이용약관", tone: "primary", Icon: GavelRoundedIcon },
  privacy: { path: "/privacy", label: "개인정보처리방침", tone: "success", Icon: ShieldOutlinedIcon },
};

function Inline({ nodes }) {
  return nodes.map((node, index) => {
    if (typeof node === "string") return <Fragment key={index}>{node}</Fragment>;
    if (node.t === "br") return <br key={index} />;
    if (node.t === "strong") {
      return (
        <Box key={index} component="strong" sx={{ fontWeight: 800, color: "text.primary" }}>
          <Inline nodes={node.c} />
        </Box>
      );
    }
    return null;
  });
}

function PolicyBlock({ block }) {
  switch (block.t) {
    case "p":
      return (
        <Typography variant="body2" sx={{ color: "text.secondary", lineHeight: 1.85 }}>
          <Inline nodes={block.c} />
        </Typography>
      );
    case "note":
      return (
        <Typography variant="caption" component="p" sx={{ color: "text.disabled", lineHeight: 1.7 }}>
          <Inline nodes={block.c} />
        </Typography>
      );
    case "ul":
      return (
        <Box component="ul" sx={{ m: 0, pl: 2.5, display: "grid", gap: 0.75 }}>
          {block.c.map((item, index) => (
            <Typography key={index} component="li" variant="body2" sx={{ color: "text.secondary", lineHeight: 1.85 }}>
              <Inline nodes={item.c} />
            </Typography>
          ))}
        </Box>
      );
    case "box":
      return (
        <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: "background.default", border: "1px solid", borderColor: "divider", display: "grid", gap: 1 }}>
          {block.c.map((child, index) => (
            <PolicyBlock key={index} block={child} />
          ))}
        </Box>
      );
    case "plans":
      return (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 1.25 }}>
          {block.c.map((plan, index) => (
            <Box
              key={index}
              sx={(theme) => ({
                p: 1.75,
                borderRadius: 2.5,
                border: "1px solid",
                borderColor: index === 0 ? "divider" : alpha(theme.palette.primary.main, 0.25),
                bgcolor: index === 0 ? "background.default" : alpha(theme.palette.primary.main, 0.05),
              })}
            >
              <Typography variant="body2" fontWeight={800} color={index === 0 ? "text.primary" : "primary.dark"}>
                <Inline nodes={plan.name} />
              </Typography>
              <Typography variant="caption" color="text.secondary">
                <Inline nodes={plan.desc} />
              </Typography>
            </Box>
          ))}
        </Box>
      );
    default:
      return null;
  }
}

function PolicyPage({ kind }) {
  const navigate = useNavigate();
  const policy = policyDocuments[kind];
  const meta = POLICY_META[kind];

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = `${meta.label} | 보조개`;
  }, [meta.label]);

  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/");
  };

  return (
    <Box component="main" sx={{ minHeight: "100vh", bgcolor: "background.default", py: { xs: 3, sm: 6 } }}>
      <Container maxWidth="md">
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2.5 }}>
          <Box component={RouterLink} to="/" sx={{ display: "flex", alignItems: "center", gap: 1.25, textDecoration: "none", color: "text.primary" }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                display: "grid",
                placeItems: "center",
                borderRadius: 2.5,
                color: "#fff",
                fontWeight: 900,
                background: "linear-gradient(145deg,#3157e6,#6680f4)",
              }}
            >
              B
            </Box>
            <Typography fontWeight={900} letterSpacing="-0.04em">보조개</Typography>
          </Box>
          <Button size="small" color="inherit" startIcon={<ArrowBackRoundedIcon />} onClick={goBack} sx={{ color: "text.secondary" }}>
            돌아가기
          </Button>
        </Stack>

        <Paper elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 4, overflow: "hidden" }}>
          <Box sx={{ px: { xs: 2.5, sm: 4 }, pt: { xs: 3, sm: 4 }, borderBottom: "1px solid", borderColor: "divider" }}>
            <Stack direction="row" spacing={1.25} alignItems="center">
              <meta.Icon color={meta.tone} />
              <Typography variant="h5" component="h1" fontWeight={850} letterSpacing="-0.03em">
                {meta.label}
              </Typography>
            </Stack>
            <Tabs value={kind} onChange={(_, value) => navigate(POLICY_META[value].path, { replace: true })} sx={{ mt: 2 }}>
              {Object.entries(POLICY_META).map(([value, item]) => (
                <Tab key={value} value={value} label={item.label} sx={{ fontWeight: 800 }} />
              ))}
            </Tabs>
          </Box>

          <Stack spacing={3.5} sx={{ px: { xs: 2.5, sm: 4 }, py: { xs: 3, sm: 4 } }}>
            <Box
              sx={(theme) => ({
                p: 2.25,
                borderRadius: 3,
                border: "1px solid",
                borderColor: alpha(theme.palette[meta.tone].main, 0.3),
                bgcolor: alpha(theme.palette[meta.tone].main, 0.06),
              })}
            >
              <Typography variant="body2" sx={{ color: "text.secondary", lineHeight: 1.8 }}>
                <Inline nodes={policy.notice.c} />
              </Typography>
            </Box>

            {policy.sections.map((section, index) => (
              <Box key={index} component="section" sx={{ display: "grid", gap: 1.25 }}>
                <Typography variant="subtitle1" component="h2" fontWeight={850} letterSpacing="-0.02em">
                  <Inline nodes={section.heading} />
                </Typography>
                {section.blocks.map((block, blockIndex) => (
                  <PolicyBlock key={blockIndex} block={block} />
                ))}
              </Box>
            ))}
          </Stack>
        </Paper>

        <Typography variant="caption" component="p" color="text.disabled" textAlign="center" sx={{ mt: 3 }}>
          © {new Date().getFullYear()} BOJOGAE. All rights reserved.
        </Typography>
      </Container>
    </Box>
  );
}

export default PolicyPage;
