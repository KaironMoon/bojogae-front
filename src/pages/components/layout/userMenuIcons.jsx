/* eslint-disable react/prop-types, react-refresh/only-export-components */
import { Box, ListItemIcon } from "@mui/material";
import AccountBalanceOutlinedIcon from "@mui/icons-material/AccountBalanceOutlined";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import AnalyticsOutlinedIcon from "@mui/icons-material/AnalyticsOutlined";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import BugReportOutlinedIcon from "@mui/icons-material/BugReportOutlined";
import CalculateOutlinedIcon from "@mui/icons-material/CalculateOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import ContactPageOutlinedIcon from "@mui/icons-material/ContactPageOutlined";
import ContactPhoneOutlinedIcon from "@mui/icons-material/ContactPhoneOutlined";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import EditNoteRoundedIcon from "@mui/icons-material/EditNoteRounded";
import FolderOutlinedIcon from "@mui/icons-material/FolderOutlined";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import HelpOutlineOutlinedIcon from "@mui/icons-material/HelpOutlineOutlined";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import LibraryBooksOutlinedIcon from "@mui/icons-material/LibraryBooksOutlined";
import RateReviewOutlinedIcon from "@mui/icons-material/RateReviewOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import ReplayRoundedIcon from "@mui/icons-material/ReplayRounded";
import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";
import ViewCarouselOutlinedIcon from "@mui/icons-material/ViewCarouselOutlined";

export const ICON_TONES = {
  slate: ["#EEF2F6", "#475569"],
  blue: ["#EAF3FF", "#2563EB"],
  green: ["#E6F9EF", "#087A43"],
  indigo: ["#EEF2FF", "#4338CA"],
  amber: ["#FFFBEB", "#92400E"],
  rose: ["#FFF0F2", "#B42347"],
  purple: ["#F3EEFF", "#6B38FB"],
};

export const BADGE_TONE_STYLES = {
  green: ["#DCFCE7", "#15803D", "#86EFAC"],
  rose: ["#FFE4E6", "#BE123C", "#FDA4AF"],
  purple: ["#F3E8FF", "#6D28D9", "#D8B4FE"],
  blue: ["#DBEAFE", "#1D4ED8", "#93C5FD"],
  amber: ["#FEF3C7", "#B45309", "#FCD34D"],
  slate: ["#E2E8F0", "#334155", "#CBD5E1"],
};

export function MenuBadge({ badge, onHero = false, compact = false }) {
  if (!badge?.text) return null;
  const [bg, color, border] = BADGE_TONE_STYLES[badge.tone] || BADGE_TONE_STYLES.green;
  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        flexShrink: 0,
        px: compact ? 0.6 : 0.75,
        py: compact ? 0.1 : 0.2,
        borderRadius: "999px",
        fontSize: compact ? 9.5 : 10,
        fontWeight: 800,
        lineHeight: 1.2,
        letterSpacing: "0.02em",
        whiteSpace: "nowrap",
        bgcolor: onHero ? "rgba(255,255,255,0.94)" : bg,
        color,
        border: onHero ? "1px solid rgba(255,255,255,0.5)" : `1px solid ${border}`,
      }}
    >
      {badge.text}
    </Box>
  );
}

export const USER_MENU_ICONS = {
  auto_awesome: AutoAwesomeRoundedIcon,
  home: HomeOutlinedIcon,
  account_balance: AccountBalanceOutlinedIcon,
  info: InfoOutlinedIcon,
  receipt_long: ReceiptLongOutlinedIcon,
  contact_page: ContactPageOutlinedIcon,
  chat_bubble: ChatBubbleOutlineRoundedIcon,
  calendar_month: CalendarMonthOutlinedIcon,
  rate_review: RateReviewOutlinedIcon,
  account_circle: AccountCircleOutlinedIcon,
  article: ArticleOutlinedIcon,
  help_outline: HelpOutlineOutlinedIcon,
  group: GroupOutlinedIcon,
  download: DownloadRoundedIcon,
  dashboard: DashboardOutlinedIcon,
  folder: FolderOutlinedIcon,
  wallet: AccountBalanceWalletOutlinedIcon,
  library_books: LibraryBooksOutlinedIcon,
  replay: ReplayRoundedIcon,
  edit_note: EditNoteRoundedIcon,
  analytics: AnalyticsOutlinedIcon,
  tune: TuneOutlinedIcon,
  view_carousel: ViewCarouselOutlinedIcon,
  contact_phone: ContactPhoneOutlinedIcon,
  campaign: CampaignOutlinedIcon,
  bug_report: BugReportOutlinedIcon,
  calculate: CalculateOutlinedIcon,
};

export function MenuIcon({ icon, iconKey, tone = "slate", compact = false }) {
  const Icon = icon || USER_MENU_ICONS[iconKey] || InfoOutlinedIcon;
  const [background, color] = ICON_TONES[tone] || ICON_TONES.slate;
  const boxSize = compact ? 24 : 28;
  const iconSize = compact ? 15 : 17;

  return (
    <ListItemIcon sx={{ minWidth: compact ? 30 : 36 }}>
      <Box
        sx={{
          width: boxSize,
          height: boxSize,
          borderRadius: compact ? "8px" : "10px",
          display: "grid",
          placeItems: "center",
          bgcolor: background,
          color,
        }}
      >
        <Icon sx={{ fontSize: iconSize }} />
      </Box>
    </ListItemIcon>
  );
}
