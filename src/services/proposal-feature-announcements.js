export const PROPOSAL_FEATURE_ANNOUNCEMENTS = [
  {
    id: "customer-link-and-auto-contract-2026-11",
    publishedAt: "2026.11",
    badge: "NEW 기능",
    title: "고객 연결부터 청약 자동 입력까지",
    subtitle: "세 단계만 따라 하면 제안서 관리와 계약 등록이 훨씬 편해집니다.",
    steps: [
      {
        key: "customer-ai-fill",
        tabLabel: "1. 고객 간편 등록",
        demoKey: "customer-ai-fill",
        title: "먼저 고객을 10초 만에 등록해 두세요",
        description:
          "제공받은 고객 DB 텍스트를 붙여넣거나 이미지를 첨부하기만 하면 AI가 이름·연락처·생년월일을 알아서 정리해 등록해 줘요. 일일이 입력할 필요가 없어요.",
        highlight: "내고객 > 고객 추가 > AI 자동 채우기",
      },
      {
        key: "customer-docs-box",
        tabLabel: "2. 고객별 모아보기",
        demoKey: "customer-docs-box",
        title: "보고서 만들 때 고객만 선택하면, 고객별로 쏙 모여요",
        description:
          "보고서 만들기에서 '연결할 고객'만 골라 두면 리스트에 고객 이름표가 붙고, '고객 문서함'을 누르면 그 고객의 제안서·보고서만 한눈에 모아 볼 수 있어요.",
        highlight: "보고서 만들기 > 연결할 고객 선택 > 고객 문서함",
      },
      {
        key: "auto-contract-apply",
        tabLabel: "3. 청약 자동 입력",
        demoKey: "auto-contract-apply",
        title: "계약 진행 시 '청약' 버튼 한 번이면 자동 입력 끝!",
        description:
          "고객이 연결된 제안서에서는 '청약' 버튼이 켜져요. 버튼을 누르면 보험사·상품명·보험료·만기·계약자 정보까지 '내 계약' 창에 자동으로 채워집니다.",
        highlight: "보고서 리스트 > 청약 버튼 > 내 계약 자동 입력",
      },
    ],
  },
];

const dismissedKey = (userId) => `bojogae:proposal-announcements:dismissed:v1:${userId}`;

function resolveStorage(storage) {
  if (storage) return storage;
  if (typeof window !== "undefined" && window.localStorage) return window.localStorage;
  return null;
}

export function getDismissedAnnouncementIds(userId, storage) {
  if (!userId) return [];
  const store = resolveStorage(storage);
  if (!store) return [];
  try {
    const raw = store.getItem(dismissedKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export function getUnseenAnnouncements(
  userId,
  announcements = PROPOSAL_FEATURE_ANNOUNCEMENTS,
  storage,
) {
  if (!userId) return [];
  const dismissed = new Set(getDismissedAnnouncementIds(userId, storage));
  return announcements.filter((item) => item?.id && !dismissed.has(item.id));
}

export function hasUnseenAnnouncements(
  userId,
  announcements = PROPOSAL_FEATURE_ANNOUNCEMENTS,
  storage,
) {
  return getUnseenAnnouncements(userId, announcements, storage).length > 0;
}

export function markAnnouncementsDismissed(
  userId,
  ids = PROPOSAL_FEATURE_ANNOUNCEMENTS.map((item) => item.id),
  storage,
) {
  if (!userId) return [];
  const store = resolveStorage(storage);
  const existing = getDismissedAnnouncementIds(userId, store);
  const merged = [...new Set([...existing, ...ids.filter((id) => typeof id === "string" && id)])];
  if (!store) return merged;
  try {
    store.setItem(dismissedKey(userId), JSON.stringify(merged));
  } catch {
    // Dialog dismissal still works cleanly if localStorage quota or mode blocks writes.
  }
  return merged;
}
