const KEY = 'bojogae:last-login-method';

export function getLastLoginMethod() {
  try {
    const method = window.localStorage.getItem(KEY);
    return method === 'personal' ? 'personal' : 'group';
  } catch {
    return 'group';
  }
}

export function setLastLoginMethod(method) {
  if (!['group', 'personal'].includes(method)) return;
  try {
    window.localStorage.setItem(KEY, method);
  } catch {
    // 저장소를 사용할 수 없어도 탭 전환과 로그인은 진행합니다.
  }
}
