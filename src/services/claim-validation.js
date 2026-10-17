export function isFormattedClaimField(key) {
  return key === 'insured_id' || key === 'beneficiary_id' || key.endsWith('_phone');
}

export function formatClaimInput(key, value) {
  if (!isFormattedClaimField(key)) return value;
  const digits = String(value || '').replace(/\D/g, '');
  if (key.endsWith('_id')) {
    const identity = digits.slice(0, 13);
    return identity.length > 6 ? `${identity.slice(0, 6)}-${identity.slice(6)}` : identity;
  }
  const phone = digits.slice(0, digits.startsWith('02') ? 10 : 11);
  const prefixLength = phone.startsWith('02') ? 2 : 3;
  if (phone.length <= prefixLength) return phone;
  const prefix = phone.slice(0, prefixLength);
  const rest = phone.slice(prefixLength);
  if (rest.length <= 4) return `${prefix}-${rest}`;
  const middleLength = rest.length > 7 ? 4 : 3;
  return `${prefix}-${rest.slice(0, middleLength)}-${rest.slice(middleLength)}`;
}

export function formatClaimInputEdit(key, value, previousValue, caret, inputType = '') {
  let digits = value.replace(/\D/g, '');
  let digitCaret = value.slice(0, caret).replace(/\D/g, '').length;
  // Deleting an automatic separator should delete the adjacent digit, not trap the caret.
  if (digits === previousValue.replace(/\D/g, '') && value !== previousValue) {
    if (inputType === 'deleteContentBackward' && digitCaret > 0) {
      digits = digits.slice(0, digitCaret - 1) + digits.slice(digitCaret);
      digitCaret -= 1;
    } else if (inputType === 'deleteContentForward') {
      digits = digits.slice(0, digitCaret) + digits.slice(digitCaret + 1);
    }
  }
  const formatted = formatClaimInput(key, digits);
  let selectionStart = 0;
  let seen = 0;
  while (selectionStart < formatted.length && seen < digitCaret) {
    if (/\d/.test(formatted[selectionStart])) seen += 1;
    selectionStart += 1;
  }
  return { value: formatted, selectionStart };
}

export function claimAgeFromIdentity(value, today = new Date()) {
  const match = /^(\d{2})(\d{2})(\d{2})-?([0-9])\d{0,6}$/.exec(String(value || ''));
  if (!match) return null;
  const century = { 0: 1800, 1: 1900, 2: 1900, 3: 2000, 4: 2000, 5: 1900, 6: 1900, 7: 2000, 8: 2000, 9: 1800 }[match[4]];
  const year = century + Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const birth = new Date(year, month - 1, day);
  if (birth.getFullYear() !== year || birth.getMonth() !== month - 1 || birth.getDate() !== day || birth > today) return null;
  const birthdayPending = today.getMonth() + 1 < month || (today.getMonth() + 1 === month && today.getDate() < day);
  return today.getFullYear() - year - Number(birthdayPending);
}

export function claimNeedsGuardian(value, today = new Date()) {
  const age = claimAgeFromIdentity(value, today);
  return age !== null && age < 14;
}

export function claimHasGuardian(payload, party, today = new Date()) {
  return Boolean(payload[`${party}_guardian_enabled`]) || claimNeedsGuardian(payload[`${party}_id`], today);
}

export function validClaimPhone(value) {
  const raw = String(value || '').trim();
  if (!/^[0-9-]+$/.test(raw)) return false;
  const digits = raw.replaceAll('-', '');
  return /^(?:02[0-9]{7,8}|0[0-9]{9,10})$/.test(digits);
}

export function claimInputErrors(p, stage = 2, today = new Date()) {
  const errors = {};
  const text = (key, label, max) => {
    const value = String(p[key] || '');
    if (!value.trim()) errors[key] = `${label}: 필수 입력 항목입니다.`;
    else if (value.length > max) errors[key] = `${label}: ${max}자 이내로 입력해 주세요.`;
    else if (Array.from(value).some(c => c.charCodeAt(0) < 32 && c !== '\n' && c !== '\t')) {
      errors[key] = `${label}에 사용할 수 없는 문자가 있습니다.`;
    }
  };
  const phone = (key, label) => {
    if (!validClaimPhone(p[key])) errors[key] = `${label}를 확인해 주세요. 휴대전화는 010-1234-5678 형식으로 입력해 주세요.`;
  };
  const identity = (key, label) => {
    if (!/^[0-9]{6}-?[0-9]{7}$/.test(p[key] || '')) errors[key] = `${label}는 숫자 13자리로 입력해 주세요.`;
    else if (claimAgeFromIdentity(p[key], today) === null) errors[key] = `${label}의 생년월일을 확인해 주세요.`;
  };
  const guardian = (party, label) => {
    if (!claimHasGuardian(p, party, today)) return;
    text(`${party}_guardian_name`, `${label} 법정대리인 성명`, 40);
    text(`${party}_guardian_relationship`, `${label} 법정대리인 관계`, 30);
    phone(`${party}_guardian_phone`, `${label} 법정대리인 연락처`);
    if (!p[`${party}_guardian_signature`]) errors[`${party}_guardian_signature`] = `${label} 법정대리인 서명을 입력하거나 업로드해 주세요.`;
  };
  text('insured_name', '피보험자 이름', 40);
  identity('insured_id', '피보험자 주민등록번호');
  phone('insured_phone', '피보험자 연락처');
  if (!p.insured_signature && !claimNeedsGuardian(p.insured_id, today)) errors.insured_signature = '피보험자 서명을 입력하거나 업로드해 주세요.';
  guardian('insured', '피보험자');
  if (!p.beneficiary_same) {
    text('beneficiary_name', '수익자 이름', 40);
    identity('beneficiary_id', '수익자 주민등록번호');
    phone('beneficiary_phone', '수익자 연락처');
    if (!p.beneficiary_signature && !claimNeedsGuardian(p.beneficiary_id, today)) errors.beneficiary_signature = '수익자 서명을 입력하거나 업로드해 주세요.';
    guardian('beneficiary', '수익자');
  }
  if (p.notice_target === 'planner') {
    text('planner_name', '설계사 이름', 40);
    phone('planner_phone', '설계사 연락처');
  }
  if (stage === 1) return errors;
  if (!['질병', '상해', '교통사고'].includes(p.accident_type)) errors.accident_type = '사고 유형을 선택해 주세요.';
  const date = p.accident_date || '';
  const parsed = new Date(`${date}T00:00:00`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(parsed.getTime()) ||
      parsed.getFullYear() !== Number(date.slice(0, 4)) || parsed.getMonth() + 1 !== Number(date.slice(5, 7)) ||
      parsed.getDate() !== Number(date.slice(8, 10))) errors.accident_date = '사고일 / 최초 진료일을 올바르게 입력해 주세요.';
  else if (parsed > today) errors.accident_date = '사고일은 미래 날짜일 수 없습니다.';
  text('accident_description', '사고 경위', 500);
  text('bank_name', '은행명', 30);
  text('account_number', '계좌번호', 30);
  if (!errors.account_number && (!/^[0-9 -]+$/.test(p.account_number) || !/[0-9]/.test(p.account_number))) {
    errors.account_number = '계좌번호는 숫자와 구분기호만 입력해 주세요.';
  }
  text('account_holder', '예금주', 40);
  if (!p.consent) errors.consent = '선택한 보험사의 필수 동의서를 확인해 주세요.';
  return errors;
}

const DETAILS = new Set(['accident_type', 'accident_date', 'accident_description', 'bank_name', 'account_number', 'account_holder', 'consent']);
export function claimErrorStep(errors) {
  return Object.keys(errors).some(key => !DETAILS.has(key)) ? 1 : 2;
}

export function activeClaimPayload(payload, today = new Date()) {
  const inactiveGuardians = {};
  for (const party of ['insured', 'beneficiary']) {
    if ((party === 'beneficiary' && payload.beneficiary_same) || !claimHasGuardian(payload, party, today)) {
      for (const field of ['name', 'relationship', 'phone', 'signature']) inactiveGuardians[`${party}_guardian_${field}`] = '';
    }
  }
  const { insured_guardian_enabled: _insuredEnabled, beneficiary_guardian_enabled: _beneficiaryEnabled, ...data } = payload;
  void _insuredEnabled; void _beneficiaryEnabled;
  return { ...data,
    ...inactiveGuardians,
    ...(payload.beneficiary_same ? { beneficiary_name: '', beneficiary_id: '', beneficiary_phone: '', beneficiary_signature: '' } : {}),
    ...(payload.notice_target === 'insured' ? { planner_name: '', planner_phone: '' } : {}) };
}
