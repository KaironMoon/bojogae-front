// 개인 요금제 정의. 가격·월 지급 포인트를 바꾸면 백엔드 services/personal_plans.py도 함께 수정한다.
export const PLAN_INFO = {
  FREE: { code: "FREE", name: "무료체험", price: "0원", priceUnit: "30일", monthlyPoints: null, summary: "가입 승인 시 20P 1회 지급 (30일간 사용)" },
  BASIC: { code: "BASIC", name: "베이직", price: "19,000원", priceUnit: "월", monthlyPoints: 30, summary: "매월 30P 지급" },
  STANDARD: { code: "STANDARD", name: "스탠다드", price: "29,000원", priceUnit: "월", monthlyPoints: 50, summary: "매월 50P 지급" },
  PRO: { code: "PRO", name: "프로", price: "49,000원", priceUnit: "월", monthlyPoints: null, summary: "준비 중", comingSoon: true },
};

export const SIGNUP_PLAN_CODES = ["FREE", "BASIC", "STANDARD"];
export const PAID_PLAN_CODES = ["BASIC", "STANDARD"];
export const PLAN_RANK = { FREE: 0, BASIC: 1, STANDARD: 2, PRO: 3 };

export function planName(code) {
  return PLAN_INFO[code]?.name || PLAN_INFO.FREE.name;
}

export function isSignupPlan(code) {
  return SIGNUP_PLAN_CODES.includes(code);
}
