const KEY = 'bojogae:last-group-id';
const LEGACY_KEY = 'bojogae:last-group';

export function getSavedGroupId() {
  try {
    const raw = window.localStorage.getItem(KEY);
    const id = raw === null ? JSON.parse(window.localStorage.getItem(LEGACY_KEY) || 'null')?.id : Number(raw);
    return Number.isSafeInteger(id) && id > 0 ? id : null;
  } catch {
    return null;
  }
}

export function saveGroupId(id) {
  try {
    if (Number.isSafeInteger(id) && id > 0) window.localStorage.setItem(KEY, String(id));
    else window.localStorage.removeItem(KEY);
    window.localStorage.removeItem(LEGACY_KEY);
  } catch {
    // 저장소를 사용할 수 없어도 그룹 선택과 로그인은 진행합니다.
  }
}


export function getSavedEmployeeNumber(groupId) {
  if (!Number.isSafeInteger(groupId) || groupId <= 0) return '';
  try {
    return window.localStorage.getItem(`bojogae:group-employee:${groupId}`) || '';
  } catch {
    return '';
  }
}

export function saveEmployeeNumber(groupId, employeeNumber) {
  if (!Number.isSafeInteger(groupId) || groupId <= 0) return;
  try {
    const key = `bojogae:group-employee:${groupId}`;
    const value = employeeNumber.trim();
    if (value) window.localStorage.setItem(key, value);
    else window.localStorage.removeItem(key);
  } catch {
    // 저장소를 사용할 수 없어도 사번 입력과 로그인은 진행합니다.
  }
}
