import api from '@/services/api-caller';
const base = '/api/v1';
export const searchGroups = async (q) => (await api.get(`${base}/groups/search`, { q })).data;
export const listGroups = async (q = '') => (await api.get(`${base}/admin/groups`, { q })).data;
export const createGroup = async (data) => (await api.post(`${base}/admin/groups`, data)).data;
export const getGroup = async (id) => (await api.get(`${base}/groups/${id}`)).data;
export const renameGroup = async (id, name) => (await api.put(`${base}/groups/${id}/name`, { name })).data;
export const addMember = async (id, data) => (await api.post(`${base}/groups/${id}/members`, data)).data;
export const editMember = async (id, member, data) => (await api.put(`${base}/groups/${id}/members/${member}`, data)).data;
export const setMemberStatus = async (id, member, active) => (await api.put(`${base}/groups/${id}/members/${member}/status`, { active })).data;
export const resetMemberPassword = async (id, member) => api.post(`${base}/groups/${id}/members/${member}/password-reset`);
export const transferPoints = async (id, member, data) => (await api.post(`${base}/groups/${id}/members/${member}/points`, data)).data;
export const requestPurchase = async (id, data) => (await api.post(`${base}/groups/${id}/purchases`, data)).data;
export const decidePurchase = async (id, purchase, data) => (await api.post(`${base}/admin/groups/${id}/purchases/${purchase}/decision`, data)).data;
export const groupLogin = async (data) => (await api.post(`${base}/auth/group-login`, data)).data;
export const changeGroupPassword = async (data) => api.post(`${base}/auth/group-password`, data);
export const requestPasswordReset = async (data) => api.post(`${base}/auth/group-password-reset`, data);
export const completePasswordReset = async (data) => api.post(`${base}/auth/group-password-reset/complete`, data);
const messages = {
  invalid_transfer_target: '지급 대상은 같은 그룹의 활성 구성원이어야 합니다. 회수 대상을 다시 확인해 주세요.',
  group_schema_required: '그룹 기능의 DB 변경 SQL을 먼저 적용해 주세요.',
  group_or_account_duplicate: '그룹명·사번·이메일이 이미 등록되어 있습니다.',
  group_name_duplicate: '이미 사용 중인 그룹명입니다.',
  account_duplicate: '이미 등록된 사번 또는 이메일입니다.',
  email_duplicate: '이미 등록된 이메일입니다.',
  insufficient_points: '지급할 유료 코인이 부족합니다.',
  invalid_group_credentials: '그룹·사번·비밀번호를 확인해 주세요.',
  password_must_differ: '기존 비밀번호와 다른 비밀번호를 입력해 주세요.',
  invalid_current_password: '현재 비밀번호를 확인해 주세요.',
  reset_expired: '재설정 링크가 만료되었습니다. 다시 요청해 주세요.',
  leader_unavailable: '지급 가능한 활성 리더가 없습니다.',
  idempotency_conflict: '이전 요청과 입력 내용이 다릅니다. 새 지급 창에서 다시 확인해 주세요.',
  payment_reference_duplicate: '이미 처리된 결제 확인 번호입니다.',
  invalid_expiration_date: '기본 코인의 만료일을 확인해 주세요.',
  group_account_use_group_management: '그룹 계정은 그룹 관리에서 변경해 주세요.',
};
export const groupErrorMessage = (error) => messages[error.response?.data?.detail] || '요청을 처리하지 못했습니다. 다시 시도해 주세요.';

export const setMonthlyPoints = async (id, amount) => (await api.put(`${base}/admin/groups/${id}/monthly-points`, { monthly_basic_points: amount })).data;

export const bulkPoints = async (id, data) => (await api.post(`${base}/groups/${id}/points/bulk`, data)).data;

export const getGroupIdentity = async (id) => (await api.get(`${base}/groups/${id}/identity`)).data;

export const directPurchase = async (id, data) => (await api.post(`${base}/admin/groups/${id}/purchases/direct`, data)).data;
