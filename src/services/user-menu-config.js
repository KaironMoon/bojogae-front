export const BADGE_TONES = [
  { key: "green", label: "초록" },
  { key: "rose", label: "빨강" },
  { key: "purple", label: "보라" },
  { key: "blue", label: "파랑" },
  { key: "amber", label: "주황" },
  { key: "slate", label: "회색" },
];

const VALID_BADGE_TONES = new Set(BADGE_TONES.map((t) => t.key));

export const BADGE_PRESETS = [
  { text: "NEW", tone: "green" },
  { text: "HOT", tone: "rose" },
  { text: "BETA", tone: "purple" },
  { text: "UP", tone: "blue" },
  { text: "PRO", tone: "amber" },
  { text: "추천", tone: "blue" },
];

export function normalizeMenuBadge(rawBadge) {
  if (!rawBadge || typeof rawBadge !== "object") return null;
  const text = typeof rawBadge.text === "string" ? rawBadge.text.trim().slice(0, 10) : "";
  if (!text) return null;
  const tone = VALID_BADGE_TONES.has(rawBadge.tone) ? rawBadge.tone : "green";
  return { text, tone };
}

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
      { key: "document_suggestions", label: "문서 개선 건의", default_label: "문서 개선 건의", path: "/document-suggestions", visible: true, badge: null },
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

const DEFAULT_BY_KEY = Object.fromEntries(DEFAULT_USER_MENU_ITEMS.map((item) => [item.key, item]));

function cloneChild(spec, savedChild) {
  const rawLabel = typeof savedChild?.label === "string" ? savedChild.label.trim() : "";
  return {
    key: spec.key,
    label: (rawLabel || spec.default_label).slice(0, 40),
    default_label: spec.default_label,
    path: spec.path,
    visible: typeof savedChild?.visible === "boolean" ? savedChild.visible : true,
    badge: normalizeMenuBadge(savedChild?.badge ?? spec.badge),
  };
}

function cloneItem(spec, savedItem) {
  const rawLabel = typeof savedItem?.label === "string" ? savedItem.label.trim() : "";
  let children = [];
  if (spec.kind === "group") {
    const childSpecs = Object.fromEntries(spec.children.map((child) => [child.key, child]));
    const seenChildren = new Set();
    if (Array.isArray(savedItem?.children)) {
      for (const rawChild of savedItem.children) {
        const childKey = rawChild?.key;
        if (!childKey || !childSpecs[childKey] || seenChildren.has(childKey)) continue;
        seenChildren.add(childKey);
        children.push(cloneChild(childSpecs[childKey], rawChild));
      }
    }
    for (const childSpec of spec.children) {
      if (!seenChildren.has(childSpec.key)) {
        children.push(cloneChild(childSpec, null));
      }
    }
  }
  return {
    key: spec.key,
    label: (rawLabel || spec.default_label).slice(0, 40),
    default_label: spec.default_label,
    kind: spec.kind,
    path: spec.path,
    prefix: spec.prefix,
    icon_key: spec.icon_key,
    tone: spec.tone,
    audience: spec.audience,
    visible: typeof savedItem?.visible === "boolean" ? savedItem.visible : true,
    badge: normalizeMenuBadge(savedItem?.badge ?? spec.badge),
    children,
  };
}

export function mergeUserMenuConfig(savedItems) {
  const merged = [];
  const seen = new Set();
  if (Array.isArray(savedItems)) {
    for (const savedItem of savedItems) {
      const key = savedItem?.key;
      if (!key || !DEFAULT_BY_KEY[key] || seen.has(key)) continue;
      seen.add(key);
      merged.push(cloneItem(DEFAULT_BY_KEY[key], savedItem));
    }
  }
  for (const spec of DEFAULT_USER_MENU_ITEMS) {
    if (!seen.has(spec.key)) {
      merged.push(cloneItem(spec, null));
    }
  }
  return merged;
}

export function toUserMenuPayload(items) {
  return (items || []).map((item) => {
    const label = typeof item.label === "string" && item.label.trim() ? item.label.trim() : item.default_label;
    const entry = {
      key: item.key,
      label: label.slice(0, 40),
      visible: Boolean(item.visible),
      badge: normalizeMenuBadge(item.badge),
    };
    if (item.kind === "group") {
      entry.children = (item.children || []).map((child) => {
        const childLabel = typeof child.label === "string" && child.label.trim()
          ? child.label.trim()
          : child.default_label;
        return {
          key: child.key,
          label: childLabel.slice(0, 40),
          visible: Boolean(child.visible),
          badge: normalizeMenuBadge(child.badge),
        };
      });
    }
    return entry;
  });
}

export function moveItemByDrop(list, draggedKey, targetKey, position = "before") {
  if (!Array.isArray(list) || !draggedKey || !targetKey || draggedKey === targetKey) {
    return list;
  }
  const fromIndex = list.findIndex((item) => item.key === draggedKey);
  if (fromIndex < 0) return list;

  const next = [...list];
  const [moved] = next.splice(fromIndex, 1);
  const targetIndex = next.findIndex((item) => item.key === targetKey);
  if (targetIndex < 0) return list;

  const insertIndex = position === "after" ? targetIndex + 1 : targetIndex;
  next.splice(insertIndex, 0, moved);
  return next;
}

export function moveItemByOffset(list, index, delta) {
  if (!Array.isArray(list)) return list;
  const targetIndex = index + delta;
  if (index < 0 || index >= list.length || targetIndex < 0 || targetIndex >= list.length) {
    return list;
  }
  const next = [...list];
  const [moved] = next.splice(index, 1);
  next.splice(targetIndex, 0, moved);
  return next;
}

export function isMenuEligibleForUser(item, user) {
  if (!item?.visible) return false;
  if (item.kind === "group" && !(item.children || []).some((child) => child.visible)) {
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

export function hasMenuChanges(currentItems, baselineItems) {
  return JSON.stringify(toUserMenuPayload(currentItems)) !== JSON.stringify(toUserMenuPayload(baselineItems));
}
