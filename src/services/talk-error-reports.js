import api from "@/services/api-caller";

const adminPath = "/api/v1/admin/talk/error-reports";
const apiUrl = path => api.baseUrl.replace(/\/$/, "") + path;

export async function listTalkErrorReports({ page, receiptId, memberName, signal }) {
  const params = { page, receipt_id: receiptId || undefined, member_name: memberName || undefined };
  return (await api.get(adminPath, params, { signal })).data;
}

export function talkErrorLogUrl(id) {
  return apiUrl(`${adminPath}/${id}/log`);
}

export async function listTalkDiagnostics(page, signal) {
  return (await api.get("/api/v1/admin/talk/diagnostics", { page }, { signal })).data;
}
export function talkDiagnosticUrl(id) {
  return apiUrl(`/api/v1/admin/talk/diagnostics/${id}/bundle`);
}
