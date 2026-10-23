// 개인 요금제 정의. 가격·월 지급 꼬막을 바꾸면 백엔드 services/personal_plans.py도 함께 수정한다.
export const PLAN_INFO = {
  FREE: { code: "FREE", name: "무료체험", price: "0원", priceUnit: "30일", monthlyPoints: null, summary: "카드 등록 없이 30일 무료체험" },
  BASIC: { code: "BASIC", name: "베이직", price: "19,000원", priceUnit: "월", monthlyPoints: 300, summary: "보험 제안서 분석·보고서 생성 월간 구독권" },
  STANDARD: { code: "STANDARD", name: "스탠다드", price: "29,000원", priceUnit: "월", monthlyPoints: 500, summary: "보험 제안서 분석·보고서 생성 월간 구독권" },
  PRO: { code: "PRO", name: "프로", price: "49,000원", priceUnit: "월", monthlyPoints: 1000, summary: "보험 제안서 분석·보고서 생성 월간 구독권" },
};

export const SIGNUP_PLAN_CODES = ["FREE", "BASIC", "STANDARD", "PRO"];
export const PAID_PLAN_CODES = ["BASIC", "STANDARD", "PRO"];
export const PLAN_RANK = { FREE: 0, BASIC: 1, STANDARD: 2, PRO: 3 };

export function planName(code) {
  return PLAN_INFO[code]?.name || PLAN_INFO.FREE.name;
}

export function isSignupPlan(code) {
  return SIGNUP_PLAN_CODES.includes(code);
}
