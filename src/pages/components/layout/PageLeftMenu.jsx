import {
  Box,
  Collapse,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import AnalyticsOutlinedIcon from "@mui/icons-material/AnalyticsOutlined";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import NewspaperOutlinedIcon from "@mui/icons-material/NewspaperOutlined";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import ViewCarouselOutlinedIcon from "@mui/icons-material/ViewCarouselOutlined";
import ContactPhoneOutlinedIcon from "@mui/icons-material/ContactPhoneOutlined";
import HelpOutlineOutlinedIcon from "@mui/icons-material/HelpOutlineOutlined";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { planName } from "@/constants/plans";

import { useAuth } from "@/auth/AuthContext";


const PRIMARY_MENU = [
  { label: "Home", path: "/home", icon: HomeOutlinedIcon },
  { label: "보험사 정보·링크", path: "/insurers", icon: ContactPhoneOutlinedIcon },
  { label: "보고서 만들기", path: "/proposals", icon: DescriptionOutlinedIcon },
];

const CUSTOMER_MENU = [
  { label: "내 고객", path: "/crm/customers" },
  { label: "내 계약", path: "/crm/contracts" },
];

const CLAIM_MENU = [
  { label: "청구", path: "/claims/new" },
  { label: "청구내역", path: "/claims/history" },
];

const ADMIN_POINT_MENU = [
  { label: '꼬막 지급·내역', path: '/admin/points' },
  { label: '결제·환불 처리', path: '/admin/payment-support' },
];

const ADMIN_MENU = [
  { label: "조직 관리", path: "/admin/groups", icon: GroupOutlinedIcon },
  { label: "설계사 관리", path: "/admin/users", icon: GroupOutlinedIcon },
  { label: "꼬막 관리", items: ADMIN_POINT_MENU, icon: AccountBalanceWalletOutlinedIcon },
  { label: "예약결제 목록", path: "/admin/payment-reservations", icon: AccountBalanceWalletOutlinedIcon },
  { label: "프롬프트 관리", path: "/admin/prompts", icon: AutoAwesomeOutlinedIcon },
  { label: "보고서 관리", path: "/admin/proposals", icon: DescriptionOutlinedIcon },
  { label: "환불 요청 관리", path: "/admin/refund-requests", icon: AccountBalanceWalletOutlinedIcon },
  { label: "문서 건의 관리", path: "/admin/document-suggestions", icon: DescriptionOutlinedIcon },
  { label: "사용량 / 통계", path: "/admin/usage", icon: AnalyticsOutlinedIcon },
  { label: "설정 및 서식", path: "/admin/proposal-settings", icon: TuneOutlinedIcon },
  { label: "메인 배너 관리", path: "/admin/dashboard-banners", icon: ViewCarouselOutlinedIcon },
  { label: "보험사 정보 관리", path: "/admin/insurers", icon: ContactPhoneOutlinedIcon },
  { label: "단체 문의 관리", path: "/admin/group-inquiries", icon: ContactPhoneOutlinedIcon },
];

const BOARD_MENU = [
  { label: "공지사항", path: "/boards/notices", icon: CampaignOutlinedIcon },
  { label: "업계소식", path: "/boards/industry-news", icon: NewspaperOutlinedIcon },
  { label: "보험 지식", path: "/boards/insurance-knowledge", icon: SchoolOutlinedIcon },
];

const REPORT_MENU = [
  { label: "환불 요청 내역", path: "/refund-requests", icon: AccountBalanceWalletOutlinedIcon },
  { label: "문서 개선 건의", path: "/document-suggestions", icon: DescriptionOutlinedIcon },
];

const HELP_MENU = [
  { label: "FAQ", path: "/help/faq", icon: HelpOutlineOutlinedIcon },
  { label: "1:1 문의", path: "/help/contact", icon: ContactPhoneOutlinedIcon },
];

const PROFILE_MENU = [
  { label: "정보수정·결제", path: "/profile", icon: AccountCircleOutlinedIcon },
  { label: "내꼬막", path: "/my-coins", icon: AccountBalanceWalletOutlinedIcon },
];

const ADMIN_BOARD_MENU = [
  { label: "공지사항 관리", path: "/admin/boards/notices", icon: CampaignOutlinedIcon },
  { label: "업계소식 관리", path: "/admin/boards/industry-news", icon: NewspaperOutlinedIcon },
  { label: "보험 지식 관리", path: "/admin/boards/insurance-knowledge", icon: SchoolOutlinedIcon },
];

function PageLeftMenu({ onNavigate }) { // eslint-disable-line react/prop-types
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [reportOpen, setReportOpen] = useState(
    location.pathname.startsWith("/proposals")
      || location.pathname.startsWith("/refund-requests")
      || location.pathname.startsWith("/document-suggestions"),
  );
  const [profileOpen, setProfileOpen] = useState(
    location.pathname === "/profile" || location.pathname.startsWith("/my-coins"),
  );
  const [boardsOpen, setBoardsOpen] = useState(location.pathname.startsWith("/boards/"));
  const [helpOpen, setHelpOpen] = useState(location.pathname.startsWith("/help/"));
  const [customersOpen, setCustomersOpen] = useState(CUSTOMER_MENU.some(item => location.pathname.startsWith(item.path)));
  const [claimsOpen, setClaimsOpen] = useState(location.pathname.startsWith("/claims"));
  const [adminBoardsOpen, setAdminBoardsOpen] = useState(location.pathname.startsWith("/admin/boards/"));
  const [adminPointsOpen, setAdminPointsOpen] = useState(ADMIN_POINT_MENU.some(item => location.pathname === item.path));

  useEffect(() => {
    if (location.pathname.startsWith("/proposals")
        || location.pathname.startsWith("/refund-requests")
        || location.pathname.startsWith("/document-suggestions")) setReportOpen(true);
    if (location.pathname === "/profile" || location.pathname.startsWith("/my-coins")) setProfileOpen(true);
    if (location.pathname.startsWith("/boards/")) setBoardsOpen(true);
    if (location.pathname.startsWith("/help/")) setHelpOpen(true);
    if (location.pathname.startsWith("/claims")) setClaimsOpen(true);
    if (CUSTOMER_MENU.some(item => location.pathname.startsWith(item.path))) setCustomersOpen(true);
    if (location.pathname.startsWith("/admin/boards/")) setAdminBoardsOpen(true);
    if (ADMIN_POINT_MENU.some(item => location.pathname === item.path)) setAdminPointsOpen(true);
  }, [location.pathname]);

  const isActive = (path) => (
    location.pathname === path || (path !== "/home" && location.pathname.startsWith(`${path}/`))
  );

  const renderMenuItem = ({ label, path, icon: Icon }) => {
    const active = isActive(path);
    return (
      <ListItem key={path} disablePadding sx={{ px: 1.25, mb: 0.35 }}>
        <ListItemButton
          selected={active}
          onClick={() => {
            navigate(path);
            onNavigate?.();
          }}
          sx={{
            minHeight: 42,
            px: 1.5,
            borderRadius: 1.5,
            color: active ? "primary.dark" : "var(--bojogae-muted)",
            position: "relative",
            "&::after": active ? {
              content: '""',
              position: "absolute",
              right: -10,
              top: 7,
              bottom: 7,
              width: 3,
              borderRadius: "3px 0 0 3px",
              bgcolor: "primary.dark",
            } : undefined,
            "&.Mui-selected": {
              bgcolor: "var(--bojogae-tint)",
              color: "primary.dark",
              "&:hover": { bgcolor: "var(--bojogae-tint-hover)" },
            },
            "&:hover": { bgcolor: "var(--bojogae-canvas)", color: "var(--bojogae-ink)" },
          }}
        >
          <ListItemIcon sx={{ minWidth: 34, color: "inherit" }}>
            <Icon sx={{ fontSize: 20 }} />
          </ListItemIcon>
          <ListItemText
            primary={label}
            primaryTypographyProps={{
              fontSize: 14,
              fontWeight: active ? 750 : 550,
              letterSpacing: "-0.01em",
            }}
          />
        </ListItemButton>
      </ListItem>
    );
  };

  const renderMenuGroup = ({ label, icon: Icon, items, open, setOpen, prefix }) => {
    const active = items.some(item => isActive(item.path));
    return (
      <Box key={prefix}>
        <ListItem disablePadding sx={{ px: 1.25, mb: 0.35 }}>
          <ListItemButton
            selected={active}
            aria-expanded={open}
            onClick={() => setOpen(value => !value)}
            sx={{
              minHeight: 42,
              px: 1.5,
              borderRadius: 1.5,
              color: active ? "primary.dark" : "var(--bojogae-muted)",
              "&.Mui-selected": { bgcolor: "var(--bojogae-tint)", color: "primary.dark" },
              "&:hover": { bgcolor: "var(--bojogae-canvas)", color: "var(--bojogae-ink)" },
            }}
          >
            <ListItemIcon sx={{ minWidth: 34, color: "inherit" }}><Icon sx={{ fontSize: 20 }} /></ListItemIcon>
            <ListItemText primary={label} primaryTypographyProps={{ fontSize: 14, fontWeight: active ? 750 : 550 }} />
            {open ? <ExpandLessRoundedIcon fontSize="small" /> : <ExpandMoreRoundedIcon fontSize="small" />}
          </ListItemButton>
        </ListItem>
        <Collapse in={open} timeout="auto" unmountOnExit>
          <List disablePadding>
            {items.map(item => {
              const childActive = isActive(item.path);
              return (
                <ListItem key={item.path} disablePadding sx={{ px: 1.25, mb: 0.25 }}>
                  <ListItemButton
                    selected={childActive}
                    onClick={() => { navigate(item.path); onNavigate?.(); }}
                    sx={{ minHeight: 38, pl: 5.75, pr: 1.5, borderRadius: 1.5, color: childActive ? "primary.dark" : "var(--bojogae-muted)", "&.Mui-selected": { bgcolor: "var(--bojogae-tint)" } }}
                  >
                    <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 13.5, fontWeight: childActive ? 750 : 500 }} />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Collapse>
      </Box>
    );
  };

  return (
    <Box
      component="nav"
      aria-label="주요 메뉴"
      sx={{
        width: 224,
        minWidth: 224,
        height: "100%",
        minHeight: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: "#fff",
        borderRight: "1px solid var(--bojogae-line)",
      }}
    >
      <List sx={{ pt: 2, pb: 1 }}>
        {PRIMARY_MENU.map(renderMenuItem)}
        {renderMenuGroup({ label: "보험금 청구", icon: DescriptionOutlinedIcon, items: CLAIM_MENU, open: claimsOpen, setOpen: setClaimsOpen, prefix: "/claims/" })}
        {renderMenuGroup({ label: "고객관리", icon: ContactPhoneOutlinedIcon, items: CUSTOMER_MENU, open: customersOpen, setOpen: setCustomersOpen, prefix: "/crm/customer-menu/" })}
        {renderMenuItem({ label: "할 일·방문 일정", path: "/crm/tasks", icon: HomeOutlinedIcon })}
        {renderMenuGroup({ label: "요청하기", icon: DescriptionOutlinedIcon, items: REPORT_MENU, open: reportOpen, setOpen: setReportOpen, prefix: "/report-menu/" })}
        {renderMenuGroup({ label: "내 정보", icon: AccountCircleOutlinedIcon, items: PROFILE_MENU, open: profileOpen, setOpen: setProfileOpen, prefix: "/account/" })}
        {renderMenuGroup({ label: "게시판", icon: ArticleOutlinedIcon, items: BOARD_MENU, open: boardsOpen, setOpen: setBoardsOpen, prefix: "/boards/" })}
        {renderMenuGroup({ label: "도움말 센터", icon: HelpOutlineOutlinedIcon, items: HELP_MENU, open: helpOpen, setOpen: setHelpOpen, prefix: "/help/" })}
        {user?.group_role === "LEADER" && renderMenuItem({ label: "조직 관리", path: "/group", icon: GroupOutlinedIcon })}
        {user?.group_id && renderMenuItem({ label: "비밀번호 변경", path: "/group/change-password", icon: AccountCircleOutlinedIcon })}
      </List>

      {user?.role === "ADMIN" && (
        <>
          <Divider sx={{ mx: 2, my: 1 }} />
          <Typography
            variant="caption"
            sx={{ px: 2.75, pt: 1.25, pb: 0.75, color: "#94a3b8", fontWeight: 800, letterSpacing: "0.08em" }}
          >
            MANAGEMENT
          </Typography>
          <List sx={{ py: 0 }}>
            {ADMIN_MENU.map(item => item.items
              ? renderMenuGroup({ ...item, open: adminPointsOpen, setOpen: setAdminPointsOpen, prefix: '/admin/point-menu/' })
              : renderMenuItem(item))}
            {renderMenuGroup({ label: "게시판 관리", icon: ArticleOutlinedIcon, items: ADMIN_BOARD_MENU, open: adminBoardsOpen, setOpen: setAdminBoardsOpen, prefix: "/admin/boards/" })}
            {renderMenuItem({ label: "Info", path: "/admin/info", icon: InfoOutlinedIcon })}
            {renderMenuItem({ label: "FAQ 관리", path: "/admin/faqs", icon: HelpOutlineOutlinedIcon })}
          </List>
        </>
      )}

      <Box sx={{ flex: 1 }} />
      <Box sx={{ px: 2, py: 1.75, borderTop: "1px solid #eef1f5", textAlign: "center" }}>
        {user && !user.group_id && (
          <Typography
            onClick={() => navigate("/profile#plan")}
            sx={{ color: user?.plan_code && user.plan_code !== "FREE" ? "primary.dark" : "var(--bojogae-muted)", fontSize: 11, fontWeight: 800, mb: 0.5, cursor: "pointer" }}
          >
            개인 {planName(user?.plan_code)} 요금제
          </Typography>
        )}
        <StackVersion />
      </Box>
    </Box>
  );
}

function StackVersion() {
  return (
    <>
      <StackedBrand />
      <Typography variant="caption" sx={{ color: "#94a3b8", fontSize: 10.5 }}>
        BOJOGAE AI Engine v2.5
      </Typography>
    </>
  );
}

function StackedBrand() {
  return (
    <Typography sx={{ color: "var(--bojogae-muted)", fontSize: 11, fontWeight: 800, mb: 0.25 }}>
      BOJOGAE
    </Typography>
  );
}

export default PageLeftMenu;
