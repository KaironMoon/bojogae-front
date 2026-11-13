export const CUSTOMER_SORTS = {
  updated_desc: "최근 수정일순",
  created_desc: "최근 등록일순",
  updated_asc: "과거 수정일순",
  created_asc: "과거 등록일순",
  name_asc: "이름 가나다순",
  rrn_asc: "주민번호순",
};

export const GROUP_COLORS = {
  green: "🟢 에메랄드 그린",
  violet: "🟣 로열 바이올렛",
  amber: "🟠 앰버 골드",
  blue: "🔵 트러스트 블루",
  rose: "🔴 코랄 레드",
};

export const GROUP_MEMBER_LIMIT = 10000;

export function residentPrefix(value) {
  return typeof value === "string" && /^\d{6}-\d$/.test(value) ? value : "";
}
