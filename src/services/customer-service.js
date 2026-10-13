import apiCaller from "@/services/api-caller";

export async function getCustomerDetail(id) {
  return (await apiCaller.get(`/api/v1/admin/users/${id}/detail`)).data;
}
export async function getCustomerRecords(id, kind, page = 1) {
  return (await apiCaller.get(`/api/v1/admin/users/${id}/records`, { kind, page })).data;
}
export async function startImpersonation(id) {
  return (await apiCaller.post(`/api/v1/admin/users/${id}/impersonate`)).data;
}
export async function stopImpersonation() {
  return (await apiCaller.post("/api/v1/auth/impersonation/stop")).data;
}
export function signalIdentityChange() {
  localStorage.setItem("bojogae.identityChanged", String(Date.now()));
}
export function customerError(error) {
  return {
    impersonation_schema_required: "대리 접속을 위한 DB 설정이 필요합니다.",
    customer_audit_schema_required: "로그인·감사 기록을 위한 DB 설정이 필요합니다.",
    impersonation_target_unavailable: "활성 상태의 일반 고객에게만 대리 접속할 수 있습니다.",
    impersonation_already_active: "대리 접속을 종료한 뒤 다른 고객에게 접속해 주세요.",
    impersonation_expired: "대리 접속이 종료되었거나 만료되었습니다. 관리자 화면으로 복귀해 주세요.",
    impersonation_audit_unavailable: "감사 기록을 남길 수 없어 대리 접속 요청을 처리하지 못했습니다.",
    customer_not_found: "고객을 찾을 수 없습니다.",
  }[error.response?.data?.detail] || "고객 정보를 처리하지 못했습니다. 다시 시도해 주세요.";
}
