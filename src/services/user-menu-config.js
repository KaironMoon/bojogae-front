import {
  BADGE_PRESETS,
  BADGE_TONES,
  createMenuEngine,
  isCustomGroupKey,
  moveItemByDrop,
  moveItemByOffset,
  normalizeMenuBadge,
} from "./menu-tree-utils";

export {
  BADGE_PRESETS,
  BADGE_TONES,
  isCustomGroupKey,
  moveItemByDrop,
  moveItemByOffset,
  normalizeMenuBadge,
};

export const DEFAULT_USER_MENU_ITEMS = [
  {
    key: "proposals",
    label: "보고서 만들기",
    default_label: "보고서 만들기",
    kind: "hero",
    path: "/proposals",
    prefix: null,
    icon_key: "auto_awesome",
    tone: "slate",
    audience: "ALL",
    visible: true,
    badge: null,
    children: [],
  },
  {
    key: "home",
    label: "Home",
    default_label: "Home",
    kind: "item",
    path: "/home",
    prefix: null,
    icon_key: "home",
    tone: "slate",
    audience: "ALL",
    visible: true,
    badge: null,
    children: [],
  },
  {
    key: "insurers",
    label: "보험사 정보·링크",
    default_label: "보험사 정보·링크",
    kind: "item",
    path: "/insurers",
    prefix: null,
    icon_key: "account_balance",
    tone: "blue",
    audience: "ALL",
    visible: true,
    badge: null,
    children: [],
  },
  {
    key: "plans",
    label: "요금 안내",
    default_label: "요금 안내",
    kind: "item",
    path: "/plans",
    prefix: null,
    icon_key: "info",
    tone: "slate",
    audience: "ALL",
    visible: true,
    badge: null,
    children: [],
  },
  {
    key: "claims",
    label: "보험금 청구",
    default_label: "보험금 청구",
    kind: "group",
    path: null,
    prefix: "/claims/",
    icon_key: "receipt_long",
    tone: "green",
    audience: "ALL",
    visible: true,
    badge: null,
    children: [
      { key: "claims_new", label: "청구", default_label: "청구", path: "/claims/new", visible: true, badge: null },
      { key: "claims_history", label: "청구내역", default_label: "청구내역", path: "/claims/history", visible: true, badge: null },
    ],
  },
  {
    key: "customers",
    label: "고객관리",
    default_label: "고객관리",
    kind: "group",
    path: null,
    prefix: "/crm/customer-menu/",
    icon_key: "contact_page",
    tone: "indigo",
    audience: "ALL",
    visible: true,
    badge: null,
    children: [
      { key: "crm_customers", label: "내 고객", default_label: "내 고객", path: "/crm/customers", visible: true, badge: null },
      { key: "crm_contracts", label: "내 계약", default_label: "내 계약", path: "/crm/contracts", visible: true, badge: null },
    ],
  },
  {
    key: "kakao_templates",
    label: "카톡 상용구/서명 관리",
    default_label: "카톡 상용구/서명 관리",
    kind: "group",
    path: null,
    prefix: "/kakao-message-templates/",
    icon_key: "chat_bubble",
    tone: "amber",
    audience: "ALL",
    visible: true,
    badge: null,
    children: [
      { key: "kakao_snippets", label: "상용구", default_label: "상용구", path: "/kakao-message-templates/snippets", visible: true, badge: null },
      { key: "kakao_signatures", label: "서명", default_label: "서명", path: "/kakao-message-templates/signatures", visible: true, badge: null },
    ],
  },
  {
    key: "crm_tasks",
    label: "할 일·방문 일정",
    default_label: "할 일·방문 일정",
    kind: "item",
    path: "/crm/tasks",
    prefix: null,
    icon_key: "calendar_month",
    tone: "rose",
    audience: "ALL",
    visible: true,
    badge: null,
    children: [],
  },
  {
    key: "requests",
    label: "요청하기",
    default_label: "요청하기",
    kind: "group",
    path: null,
    prefix: "/report-menu/",
    icon_key: "rate_review",
    tone: "purple",
    audience: "ALL",
    visible: true,
    badge: null,
    children: [
      { key: "refund_requests", label: "환불 요청 내역", default_label: "환불 요청 내역", path: "/refund-requests", visible: true, badge: null },
      { key: "document_suggestions", label: "보고서 개선 건의", default_label: "보고서 개선 건의", path: "/document-suggestions", visible: true, badge: null },
    ],
  },
  {
    key: "profile",
    label: "내 정보",
    default_label: "내 정보",
    kind: "group",
    path: null,
    prefix: "/account/",
    icon_key: "account_circle",
    tone: "slate",
    audience: "ALL",
    visible: true,
    badge: null,
    children: [
      { key: "profile_edit", label: "정보수정·결제", default_label: "정보수정·결제", path: "/profile", visible: true, badge: null },
      { key: "my_coins", label: "내꼬막", default_label: "내꼬막", path: "/my-coins", visible: true, badge: null },
    ],
  },
  {
    key: "boards",
    label: "게시판",
    default_label: "게시판",
    kind: "group",
    path: null,
    prefix: "/boards/",
    icon_key: "article",
    tone: "slate",
    audience: "ALL",
    visible: true,
    badge: null,
    children: [
      { key: "boards_notices", label: "공지사항", default_label: "공지사항", path: "/boards/notices", visible: true, badge: null },
      { key: "boards_industry_news", label: "업계소식", default_label: "업계소식", path: "/boards/industry-news", visible: true, badge: null },
      { key: "boards_insurance_knowledge", label: "보험 지식", default_label: "보험 지식", path: "/boards/insurance-knowledge", visible: true, badge: null },
    ],
  },
  {
    key: "help",
    label: "도움말 센터",
    default_label: "도움말 센터",
    kind: "group",
    path: null,
    prefix: "/help/",
    icon_key: "help_outline",
    tone: "slate",
    audience: "ALL",
    visible: true,
    badge: null,
    children: [
      { key: "help_faq", label: "FAQ", default_label: "FAQ", path: "/help/faq", visible: true, badge: null },
      { key: "help_contact", label: "1:1 문의", default_label: "1:1 문의", path: "/help/contact", visible: true, badge: null },
    ],
  },
  {
    key: "group_manage",
    label: "조직 관리",
    default_label: "조직 관리",
    kind: "item",
    path: "/group",
    prefix: null,
    icon_key: "group",
    tone: "slate",
    audience: "GROUP_LEADER",
    visible: true,
    badge: null,
    children: [],
  },
  {
    key: "group_password",
    label: "비밀번호 변경",
    default_label: "비밀번호 변경",
    kind: "item",
    path: "/group/change-password",
    prefix: null,
    icon_key: "account_circle",
    tone: "slate",
    audience: "GROUP_MEMBER",
    visible: true,
    badge: null,
    children: [],
  },
  {
    key: "talk_download",
    label: "보조개톡 다운로드",
    default_label: "보조개톡 다운로드",
    kind: "item",
    path: "/talk/download",
    prefix: null,
    icon_key: "download",
    tone: "green",
    audience: "ALL",
    visible: true,
    badge: null,
    children: [],
  },
];

const engine = createMenuEngine(DEFAULT_USER_MENU_ITEMS);

export const LEAF_BY_KEY = engine.LEAF_BY_KEY;
export const mergeUserMenuConfig = engine.mergeMenuConfig;
export const toUserMenuPayload = engine.toMenuPayload;
export const moveMenuNode = engine.moveMenuNode;
export const moveUserMenuNodeWithMeta = engine.moveMenuNodeWithMeta;
export const mergeUserMenusIntoGroup = engine.mergeMenusIntoGroup;
export const dissolveUserCustomGroup = engine.dissolveCustomGroup;
export const promoteChildToTop = engine.promoteChildToTop;
export const hasMenuChanges = engine.hasMenuChanges;

export function isChildEligibleForUser(child, user) {
  if (!child?.visible) return false;
  if (child.audience === "GROUP_LEADER") {
    return user?.group_role === "LEADER";
  }
  if (child.audience === "GROUP_MEMBER") {
    return Boolean(user?.group_id);
  }
  return true;
}

export function isMenuEligibleForUser(item, user) {
  if (!item?.visible) return false;
  if (item.kind === "group" && !(item.children || []).some((child) => isChildEligibleForUser(child, user))) {
    return false;
  }
  if (item.audience === "GROUP_LEADER") {
    return user?.group_role === "LEADER";
  }
  if (item.audience === "GROUP_MEMBER") {
    return Boolean(user?.group_id);
  }
  return true;
}
