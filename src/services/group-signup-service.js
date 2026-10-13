import api from '@/services/api-caller';
import { groupDisplayName } from '@/services/group-display-name';
const base = '/api/v1';
export const startGroupApplication = async (data) => (await api.post(`${base}/group-signups`, { ...data, group_name: groupDisplayName(data) })).data;
export const resendGroupApplication = (token) => api.post(`${base}/group-signups/resend`, { token });
export const verifyGroupApplication = async (token, code) => (await api.post(`${base}/group-signups/verify-code`, { token, code })).data;
export const verifyGroupApplicationLink = async (token) => (await api.post(`${base}/group-signups/verify-link`, { token })).data;
export const getGroupApplicationStatus = async (token) => (await api.post(`${base}/group-signups/status`, { token })).data;
export const listGroupApplications = async (q, status) => (await api.get(`${base}/admin/group-signups`, { q, status: status || undefined })).data;
export const reviewGroupApplication = async (id, data) => (await api.put(`${base}/admin/group-signups/${id}`, data)).data;
export const openGroupApplication = async (id, data) => (await api.post(`${base}/admin/group-signups/${id}/open`, data)).data;
export const groupApplicationStatuses = { UNVERIFIED: '이메일 인증 대기', REVIEW: '관리자 확인 대기', CONTACTING: '상담 중', PAYMENT_PENDING: '결제 대기', ACTIVE: '개통 완료' };
const messages = {
  group_identity_duplicate: '같은 GA 소속·지점명의 단체가 이미 등록되어 있거나 신청 중입니다.',
  group_branch_required: '단체 지점명 또는 활동 지역이 필요합니다. 신청 정보를 확인해 주세요.',
  signup_schema_required: '단체 가입 신청이 아직 준비되지 않았습니다. 잠시 후 다시 시도해 주세요.',
  application_expired: '신청 확인 정보가 만료되었습니다. 관리자에게 문의해 주세요.',
  application_duplicate: '이 이메일로 접수된 신청이 있습니다. 기존 신청 화면이나 인증메일에서 확인해 주세요.',
  application_email_in_use: '이미 가입된 이메일입니다. 단체 담당자용 이메일을 사용하거나 관리자에게 문의해 주세요.',
  application_rate_limited: '잠시 후 다시 신청해 주세요.',
  application_already_verified: '이미 이메일 인증을 완료했습니다. 신청 현황을 새로고침해 주세요.',
  application_not_found: '인증된 신청서를 찾을 수 없습니다.',
  invalid_verification_code: '인증번호가 올바르지 않습니다.',
  verification_locked: '인증 시도 횟수를 초과했습니다. 인증메일을 다시 받아 주세요.',
  verification_expired: '인증이 만료되었습니다. 인증메일을 다시 받아 주세요.',
  email_resend_too_soon: '인증메일은 60초 후 다시 보낼 수 있습니다.',
  email_delivery_failed: '인증메일을 보내지 못했습니다. 잠시 후 다시 시도해 주세요.',
  group_already_open: '이미 개통된 단체입니다.',
  group_or_account_duplicate: '이미 등록된 단체명·사번·이메일입니다.',
};
export const groupSignupError = (error) => {
  const detail = error.response?.data?.detail;
  return Array.isArray(detail) ? '필수 입력 항목과 전화번호·이메일 형식을 확인해 주세요.' : messages[detail] || '요청을 처리하지 못했습니다. 다시 시도해 주세요.';
};
