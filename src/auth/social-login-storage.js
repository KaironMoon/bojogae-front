const LAST_SOCIAL_LOGIN_PROVIDER_KEY = "bojoge:last-social-login-provider";
const PENDING_SOCIAL_LOGIN_PROVIDER_KEY = "bojoge:pending-social-login-provider";
const SOCIAL_LOGIN_PROVIDERS = new Set(["google", "kakao", "naver"]);

function isSocialLoginProvider(provider) {
  return SOCIAL_LOGIN_PROVIDERS.has(provider);
}

function getLastSocialLoginProvider() {
  try {
    const provider = window.localStorage.getItem(LAST_SOCIAL_LOGIN_PROVIDER_KEY);
    return isSocialLoginProvider(provider) ? provider : null;
  } catch {
    return null;
  }
}

function setPendingSocialLoginProvider(provider) {
  if (!isSocialLoginProvider(provider)) return;
  try {
    window.sessionStorage.setItem(PENDING_SOCIAL_LOGIN_PROVIDER_KEY, provider);
  } catch {
    // 저장소를 사용할 수 없어도 로그인 자체는 계속 진행한다.
  }
}

function clearPendingSocialLoginProvider() {
  try {
    window.sessionStorage.removeItem(PENDING_SOCIAL_LOGIN_PROVIDER_KEY);
  } catch {
    // 저장소를 사용할 수 없어도 로그인 자체는 계속 진행한다.
  }
}

function commitPendingSocialLoginProvider() {
  try {
    const provider = window.sessionStorage.getItem(PENDING_SOCIAL_LOGIN_PROVIDER_KEY);
    if (!isSocialLoginProvider(provider)) return null;

    window.localStorage.setItem(LAST_SOCIAL_LOGIN_PROVIDER_KEY, provider);
    window.sessionStorage.removeItem(PENDING_SOCIAL_LOGIN_PROVIDER_KEY);
    return provider;
  } catch {
    return null;
  }
}

export {
  clearPendingSocialLoginProvider,
  commitPendingSocialLoginProvider,
  getLastSocialLoginProvider,
  setPendingSocialLoginProvider,
};
