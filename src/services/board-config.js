export const BOARD_CONFIG = {
  notices: {
    label: "공지사항",
    adminLabel: "공지사항 관리",
    categories: {
      REPORT_UPDATE: "보고서 업데이트·추가",
      SYSTEM_MAINTENANCE: "시스템 작업",
      OPERATIONS: "운영 공지",
    },
  },
  "industry-news": {
    label: "업계소식",
    adminLabel: "업계소식 관리",
    categories: {
      INSURANCE_NEWS: "보험 뉴스",
      INSURER_NOTICE: "보험사 공지",
      NEW_PRODUCT: "신상품 소개",
    },
  },
  "insurance-knowledge": {
    label: "보험 지식",
    adminLabel: "보험 지식 관리",
    categories: {
      DESIGN_TIPS: "설계 노하우",
      COVERAGE_GUIDE: "보험 담보 설명",
      CLAIM_GUIDE: "보험금 청구 방법",
      POLICY_CHANGE: "법·제도 변화",
      REFERENCE: "참고 정보",
    },
  },
};

export function boardConfig(boardType) {
  return BOARD_CONFIG[boardType] || null;
}

export function categoryLabel(boardType, category) {
  return BOARD_CONFIG[boardType]?.categories[category] || category;
}
