import { Container, Box, Divider, Drawer, useMediaQuery } from "@mui/material";
import AppBar from "@mui/material/AppBar";
import { Outlet } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import { useState } from "react";

import PageHeader from "@/pages/components/layout/PageHeader";
import PageLeftMenu from "@/pages/components/layout/PageLeftMenu";
import PageFooter from "@/pages/components/layout/PageFooter";

function PageLayout() {
  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <Container
      maxWidth={false}
      disableGutters
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        backgroundColor: theme.palette.background.default,
      }}
    >
      <AppBar
        position="static"
        sx={{
          position: { xs: "sticky", md: "static" },
          top: { xs: 0, md: "auto" },
          zIndex: { xs: theme.zIndex.drawer + 1, md: theme.zIndex.appBar },
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <PageHeader onMenuClick={() => setMobileMenuOpen(true)} />
      </AppBar>
      <Box sx={{ display: "flex", flexGrow: 1 }}>
        <Box sx={{ display: { xs: "none", md: "block" }, backgroundColor: theme.palette.background.leftMenu, minHeight: "100%", flexShrink: 0 }}>
          <PageLeftMenu />
        </Box>
        <Drawer
          anchor="left"
          open={mobile && mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          ModalProps={{ keepMounted: true }}
          slotProps={{
            paper: {
              sx: {
                width: 224,
                top: 56,
                height: "calc(100% - 56px)",
                overflowY: "auto",
              },
            },
          }}
        >
          <PageLeftMenu onNavigate={() => setMobileMenuOpen(false)} />
        </Drawer>
        <Box sx={{ flexGrow: 1, minWidth: 0, backgroundColor: theme.palette.background.default }}>
          <Outlet />
        </Box>
      </Box>
      <Divider />
      <PageFooter />
    </Container>
  );
}

export default PageLayout;
