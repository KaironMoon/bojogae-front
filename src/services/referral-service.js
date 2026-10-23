import api from '@/services/api-caller';

export const referralErrors = {
  invalid_referral_alias: '추천용 닉네임은 한글·영문 소문자·숫자·점·밑줄·하이픈으로 2~30자 입력해 주세요.',
  referral_alias_taken: '이미 사용 중인 추천용 닉네임입니다.',
  referrer_not_found: '추천인의 이메일 또는 추천용 닉네임을 확인해 주세요.',
  self_referral_not_allowed: '본인을 추천인으로 등록할 수 없습니다.',
  referral_already_registered: '추천인은 한 번만 등록할 수 있습니다. 이미 등록되었습니다.',
  referral_account_unavailable: '추천인 기능은 이메일이 등록된 활성 개인 회원이 이용할 수 있습니다.',
  referral_schema_required: '추천인 기능의 DB 설정이 아직 적용되지 않았습니다.',
};
export function referralError(error) {
  const code = error.response?.data?.detail;
  return referralErrors[code] || (error.response?.status === 422 ? '입력 형식과 길이를 확인해 주세요.' : '추천인 정보를 처리하지 못했습니다. 다시 시도해 주세요.');
}
export async function getReferral() { return (await api.get('/api/v1/users/me/referral')).data; }
export async function saveReferralAlias(alias) {
  return (await api.axiosInstance.put(`${api.baseUrl}/api/v1/users/me/referral/alias`, { alias: alias.trim() || null })).data;
}
export async function registerReferral(referrer) {
  return (await api.post('/api/v1/users/me/referral', { referrer: referrer.trim() })).data;
}
