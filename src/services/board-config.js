export const BOARD_ORDER = ["notices", "industry-news", "insurance-knowledge"];

export const BOARD_CONFIG = {
  notices: {
    label: "공지사항",
    adminLabel: "공지사항 관리",
    badgeText: "NOTICE",
    tone: "emerald",
    description: "서비스 업데이트, 시스템 점검 및 주요 운영 안내를 한눈에 확인하세요.",
    adminDescription: "설계사에게 전달할 공지사항과 업데이트 소식을 작성·고정 관리합니다.",
    categories: {
      REPORT_UPDATE: "보고서 업데이트·추가",
      SYSTEM_MAINTENANCE: "시스템 작업",
      OPERATIONS: "운영 공지",
    },
    categoryTones: {
      REPORT_UPDATE: "emerald",
      SYSTEM_MAINTENANCE: "amber",
      OPERATIONS: "blue",
    },
  },
  "industry-news": {
    label: "업계소식",
    adminLabel: "업계소식 관리",
    badgeText: "INDUSTRY NEWS",
    tone: "blue",
    description: "보험업계 핵심 동향과 정책 변화를 요약과 원문 링크로 빠르게 확인하세요.",
    adminDescription: "최신 보험업계 소식 요약과 원문 링크·썸네일을 발행하고 관리합니다.",
    categories: {
      INSURANCE_NEWS: "보험 뉴스",
      INSURER_NOTICE: "보험사·당국 공지",
      NEW_PRODUCT: "신상품 소개",
    },
    categoryTones: {
      INSURANCE_NEWS: "blue",
      INSURER_NOTICE: "indigo",
      NEW_PRODUCT: "emerald",
    },
  },
  "insurance-knowledge": {
    label: "보험 지식",
    adminLabel: "보험 지식 관리",
    badgeText: "KNOWLEDGE BASE",
    tone: "violet",
    description: "현장 설계 노하우, 담보 해설, 청구 가이드와 제도 변화를 깊이 있게 정리했습니다.",
    adminDescription: "현장 상담에 활용하는 보험 지식·교육 자료를 작성하고 관리합니다.",
    categories: {
      DESIGN_TIPS: "설계 노하우",
      COVERAGE_GUIDE: "보험 담보 설명",
      CLAIM_GUIDE: "보험금 청구 방법",
      POLICY_CHANGE: "법·제도 변화",
      REFERENCE: "참고 정보",
    },
    categoryTones: {
      DESIGN_TIPS: "violet",
      COVERAGE_GUIDE: "blue",
      CLAIM_GUIDE: "emerald",
      POLICY_CHANGE: "amber",
      REFERENCE: "slate",
    },
  },
};

export function boardConfig(boardType) {
  return BOARD_CONFIG[boardType] || null;
}

export function categoryLabel(boardType, category) {
  return BOARD_CONFIG[boardType]?.categories[category] || category;
}

export function categoryTone(boardType, category) {
  return BOARD_CONFIG[boardType]?.categoryTones?.[category] || "slate";
}

export function formatBoardDate(value) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  const yyyy = parsed.getFullYear();
  const mm = String(parsed.getMonth() + 1).padStart(2, "0");
  const dd = String(parsed.getDate()).padStart(2, "0");
  return `${yyyy}.${mm}.${dd}`;
}

export function formatBoardDateTime(value) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function isRecentPost(value, days = 7) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return false;
  const diff = Date.now() - parsed.getTime();
  return diff >= 0 && diff <= days * 24 * 60 * 60 * 1000;
}

export function extractDomain(url) {
  if (!url) return "";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function formatFileSize(bytes) {
  if (typeof bytes !== "number" || Number.isNaN(bytes) || bytes < 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
