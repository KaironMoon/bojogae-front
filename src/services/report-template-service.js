import apiCaller from "@/services/api-caller";

const base = "/api/v1/admin/prompts";

export async function listReportShells() {
  return (await apiCaller.get(`${base}/report-shells`)).data;
}

export async function getReportShell(versionId) {
  return (await apiCaller.get(`${base}/report-shells/${versionId}`)).data;
}

export async function createReportShell(shell) {
  return (await apiCaller.post(`${base}/report-shells`, shell)).data;
}

export async function previewReportTemplate(title, template) {
  return (await apiCaller.post(`${base}/report-template-preview`, { title, template })).data;
}

export function reportTemplateError(error, fallback) {
  const detail = error.response?.data?.detail;
  if (detail === "report_shell_schema_required") return "공통 HTML을 사용하려면 DB 설정을 적용해야 합니다.";
  if (Array.isArray(detail)) return detail.map((entry) => entry.msg).join(" / ");
  return typeof detail === "string" ? detail : fallback;
}
