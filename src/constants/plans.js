// 개인 요금제 정의. 꼬막 수량은 백엔드 personal_plans와 personal_monthly_service를 따른다.
export const PLAN_INFO = {
  FREE: { code: "FREE", name: "무료체험", price: "0원", priceUnit: "30일", monthlyPoints: null, trialPoints: 200, summary: "카드 등록 없이 30일 무료체험" },
  BASIC: { code: "BASIC", name: "베이직", price: "19,000원", priceUnit: "월", monthlyPoints: 300, summary: "보험 제안서 분석·보고서 생성 월간 구독권" },
  STANDARD: { code: "STANDARD", name: "스탠다드", price: "29,000원", priceUnit: "월", monthlyPoints: 500, summary: "보험 제안서 분석·보고서 생성 월간 구독권" },
  PRO: { code: "PRO", name: "프로", price: "49,000원", priceUnit: "월", monthlyPoints: 1000, summary: "보험 제안서 분석·보고서 생성 월간 구독권" },
};

export const SIGNUP_PLAN_CODES = ["FREE", "BASIC", "STANDARD", "PRO"];
export const PAID_PLAN_CODES = ["BASIC", "STANDARD", "PRO"];
export const PLAN_RANK = { FREE: 0, BASIC: 1, STANDARD: 2, PRO: 3 };
export const PLAN_COCKLE_NOTE = "꼬막은 보험 제안서 분석·보고서 생성에 사용하는 이용량입니다. 월 지급 꼬막은 이용기간이 끝나면 만료됩니다.";

export const PLAN_DOCUMENT_ESTIMATES = {
  FREE: "30일간 약 20번 문서 생성 가능",
  BASIC: "월 약 30번 문서 생성 가능",
  STANDARD: "월 약 50번 문서 생성 가능",
  PRO: "월 약 100번 문서 생성 가능",
};

export const PLAN_USAGE_NOTE = "문서 생성 횟수는 기본 기준에 따른 예상치입니다. 월 이용량은 이용기간이 끝나면 만료됩니다.";

export function planCockleAllowance(code) {
  const plan = PLAN_INFO[code];
  return code === "FREE"
    ? `${plan.priceUnit}간 ${plan.trialPoints.toLocaleString("ko-KR")}꼬막`
    : `매월 ${plan.monthlyPoints.toLocaleString("ko-KR")}꼬막`;
}

export function planName(code) {
  return PLAN_INFO[code]?.name || PLAN_INFO.FREE.name;
}

export function isSignupPlan(code) {
  return SIGNUP_PLAN_CODES.includes(code);
}
