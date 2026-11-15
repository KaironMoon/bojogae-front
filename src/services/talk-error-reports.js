import api from "@/services/api-caller";

const adminPath = "/api/v1/admin/talk/error-reports";
const apiUrl = path => api.baseUrl.replace(/\/$/, "") + path;

export async function listTalkErrorReports({ page, receiptId, signal }) {
  const params = { page, receipt_id: receiptId || undefined };
  return (await api.get(adminPath, params, { signal })).data;
}

export function talkErrorLogUrl(id) {
  return apiUrl(`${adminPath}/${id}/log`);
}
