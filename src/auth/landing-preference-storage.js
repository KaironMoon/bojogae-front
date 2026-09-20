const SKIP_LANDING_KEY = "bojogae:skip-landing";

function shouldSkipLanding() {
  try {
    return window.localStorage.getItem(SKIP_LANDING_KEY) === "true";
  } catch {
    return false;
  }
}

function skipLandingFromNowOn() {
  try {
    window.localStorage.setItem(SKIP_LANDING_KEY, "true");
  } catch {
    // 저장 불가 환경에서도 현재 로그인 이동은 계속한다.
  }
}

function showLandingFromNowOn() {
  try {
    window.localStorage.removeItem(SKIP_LANDING_KEY);
  } catch {
    // 저장 불가 환경에서는 별도 복구가 필요 없다.
  }
}

export { shouldSkipLanding, showLandingFromNowOn, skipLandingFromNowOn };
