/* eslint-disable react/prop-types, react-refresh/only-export-components */
import { Box, ListItemIcon } from "@mui/material";
import AccountBalanceOutlinedIcon from "@mui/icons-material/AccountBalanceOutlined";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import ContactPageOutlinedIcon from "@mui/icons-material/ContactPageOutlined";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import HelpOutlineOutlinedIcon from "@mui/icons-material/HelpOutlineOutlined";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import RateReviewOutlinedIcon from "@mui/icons-material/RateReviewOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";

export const ICON_TONES = {
  slate: ["#EEF2F6", "#475569"],
  blue: ["#EAF3FF", "#2563EB"],
  green: ["#E6F9EF", "#087A43"],
  indigo: ["#EEF2FF", "#4338CA"],
  amber: ["#FFFBEB", "#92400E"],
  rose: ["#FFF0F2", "#B42347"],
  purple: ["#F3EEFF", "#6B38FB"],
};

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
