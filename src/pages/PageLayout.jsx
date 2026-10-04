import { Container, Box, Divider, Drawer, useMediaQuery, Alert, Button } from "@mui/material";
import AppBar from "@mui/material/AppBar";
import { Link, Outlet } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import { useEffect, useState } from "react";

import { useAuth } from "@/auth/AuthContext";

import PageHeader from "@/pages/components/layout/PageHeader";
import PageLeftMenu from "@/pages/components/layout/PageLeftMenu";
import PageFooter from "@/pages/components/layout/PageFooter";

function PageLayout() {
  const theme = useTheme();
  const { user } = useAuth();
  const [dismissedReminder, setDismissedReminder] = useState('');
  const reminderKey = user?.pending_email ? `${user.id}:${user.pending_email}` : '';
  useEffect(() => { if (!user) setDismissedReminder(''); }, [user]);
  const compactMenu = useMediaQuery(theme.breakpoints.down("lg"));
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
          position: { xs: "sticky", lg: "static" },
          top: { xs: 0, lg: "auto" },
          zIndex: { xs: theme.zIndex.drawer + 1, lg: theme.zIndex.appBar },
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <PageHeader onMenuClick={() => setMobileMenuOpen(true)} />
      </AppBar>
      <Box sx={{ display: "flex", flexGrow: 1 }}>
        <Box sx={{ display: { xs: "none", lg: "block" }, backgroundColor: theme.palette.background.leftMenu, minHeight: "100%", flexShrink: 0 }}>
          <PageLeftMenu />
        </Box>
        <Drawer
          anchor="left"
          open={compactMenu && mobileMenuOpen}
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
          {reminderKey && dismissedReminder !== reminderKey && <Alert severity="warning" sx={{ m:2 }} onClose={() => setDismissedReminder(reminderKey)}
            action={<><Button component={Link} to="/profile#email-verification" color="inherit" size="small">내정보에서 인증하기</Button><Button color="inherit" size="small" onClick={() => setDismissedReminder(reminderKey)}>닫기</Button></>}>
            인증하지 않은 이메일이 있습니다. 내정보에서 이메일 인증을 완료해 주세요.
          </Alert>}
          <Outlet />
        </Box>
      </Box>
      <Divider />
      <PageFooter />
    </Container>
  );
}

export default PageLayout;
