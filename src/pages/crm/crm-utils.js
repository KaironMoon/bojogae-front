export const STAGES = {
  UNCONTACTED: "미접촉",
  CONTACTING: "연락 중",
  CONSULTING: "상담 중",
  PROPOSING: "제안 중",
  HOLD: "보류",
  CLOSED: "상담 종료",
};
export const PROGRESS = {
  DRAFT: "작성 중",
  APPLIED: "청약 접수",
  REVIEW: "심사 중",
  SUPPLEMENT: "보완 요청",
  ESTABLISHED: "성립",
  DECLINED: "미성립",
  WITHDRAWN: "청약 철회",
};
export const MAINTENANCE = {
  UNKNOWN: "미확인",
  ACTIVE: "정상 유지",
  LAPSED: "실효",
  TERMINATED: "해지",
  MATURED: "만기",
};
export const CYCLES = {
  UNKNOWN: "미확인",
  MONTHLY: "월납",
  QUARTERLY: "분기납",
  HALF_YEARLY: "반기납",
  YEARLY: "연납",
  SINGLE: "일시납",
  PAID_UP: "완납",
};
export const KINDS = {
  CALL: "재통화",
  VISIT: "방문",
  DOCUMENT: "서류·자료",
  REVIEW: "심사 확인",
  OTHER: "기타",
};
export const RESULTS = {
  CONNECTED: "연결",
  ABSENT: "부재",
  CALLBACK: "재통화 요청",
  REFUSED: "거절",
  WRONG_NUMBER: "번호 오류",
};
export const METHODS = {
  PHONE: "전화",
  VISIT: "방문",
  MESSAGE: "메시지",
  OTHER: "기타",
};
export const TASK_STATUS = { PENDING: "예정", DONE: "완료", CANCELLED: "취소" };
export const ACCURACY = {
  NONE: "위치 미등록",
  APPROXIMATE: "대략 위치",
  EXACT: "확인된 위치",
};
export const money = (value) => Number(value || 0).toLocaleString("ko-KR");
export function formatPhone(value) {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (/^1[568]/.test(digits) && digits.length <= 8) {
    return digits.length > 4 ? `${digits.slice(0, 4)}-${digits.slice(4)}` : digits;
  }
  const prefixLength = digits.startsWith("02") ? 2 : digits.startsWith("0505") ? 4 : 3;
  const number = digits.slice(0, prefixLength + 8);
  if (number.length <= prefixLength) return number;
  const rest = number.slice(prefixLength);
  const middleLength = rest.length > 7 ? 4 : 3;
  return `${number.slice(0, prefixLength)}-${rest.slice(0, middleLength)}${rest.length > middleLength ? `-${rest.slice(middleLength)}` : ""}`;
}
export const dateTime = (value) =>
  value
    ? new Date(value).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })
    : "—";
export const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
export function localDateTime(value = new Date()) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(new Date(value))
    .replace(" ", "T");
}
export function hasLocation(location) {
  return (
    location &&
    location.lat !== null &&
    location.lat !== undefined &&
    location.lng !== null &&
    location.lng !== undefined &&
    Number.isFinite(Number(location.lat)) &&
    Number.isFinite(Number(location.lng)) &&
    Number(location.lat) >= 31.43 &&
    Number(location.lat) <= 44.35 &&
    Number(location.lng) >= 122.37 &&
    Number(location.lng) <= 132
  );
}
export function naverLinks(
  destination,
  mode = "car",
  origin,
  appname = "https://bojogae.net",
) {
  if (!hasLocation(destination) || !["car", "walk", "public"].includes(mode))
    throw new Error("목적지 위치를 먼저 확인해 주세요.");
  const params = new URLSearchParams({
    dlat: String(destination.lat),
    dlng: String(destination.lng),
    dname: "방문 장소",
    appname,
  });
  if (hasLocation(origin)) {
    params.set("slat", String(origin.lat));
    params.set("slng", String(origin.lng));
    params.set("sname", "출발 위치");
  }
  const path = `route/${mode}?${params}`;
  return {
    app: `nmap://${path}`,
    android: `intent://${path}#Intent;scheme=nmap;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;package=com.nhn.android.nmap;end`,
    androidStore:
      "https://play.google.com/store/apps/details?id=com.nhn.android.nmap",
    iosStore: "https://apps.apple.com/app/id311867728",
  };
}
let loader;
export function loadNaver(key) {
  if (window.naver?.maps) return Promise.resolve(window.naver.maps);
  if (loader) return loader;
  loader = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    let settled = false;
    const fail = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      script.remove();
      reject(
        new Error("지도 인증 또는 연결에 실패했습니다. 네이버 콘솔의 Web 서비스 URL과 API 키를 확인해 주세요."),
      );
    };
    const timer = setTimeout(fail, 15000);
    window.navermap_authFailure = fail;
    // The SDK may invoke its query callback before assigning window.naver.
    // The script load event runs after evaluation and namespace assignment.
    script.onload = () => {
      if (settled) return;
      if (!window.naver?.maps) { fail(); return; }
      settled = true;
      clearTimeout(timer);
      resolve(window.naver.maps);
    };
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${encodeURIComponent(key)}`;
    script.onerror = fail;
    document.head.append(script);
  });
  // Failures are sticky for this page: no retry loop that could repeatedly consume calls.
  return loader;
}
