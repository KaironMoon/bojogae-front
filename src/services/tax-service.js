import api from "@/services/api-caller";

export const TAX_DISCLAIMER =
  "본 자료는 사용자의 장부 정리를 돕는 참고용이며, 최종 신고 내용과 세무적 책임은 사용자 본인에게 있습니다.";

export function formatKrw(value) {
  const num = Number(value || 0);
  return `${num.toLocaleString("ko-KR")}원`;
}

export function extractTaxError(error, fallback = "요청 처리 중 오류가 발생했습니다.") {
  return error?.response?.data?.detail || error?.message || fallback;
}

async function downloadBlob(url, params, fallbackFilename) {
  const response = await api.get(url, params, { responseType: "blob", timeout: 60000 });
  const disposition = response.headers?.["content-disposition"] || "";
  const match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  const filename = match ? decodeURIComponent(match[1]) : fallbackFilename;
  const blobUrl = URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(blobUrl);
}

export const agentTaxApi = {
  getOverview: (params) => api.get("/api/v1/tax/overview", params).then((r) => r.data),
  listProfiles: () => api.get("/api/v1/tax/profiles").then((r) => r.data.items),
  createProfile: (body) => api.post("/api/v1/tax/profiles", body).then((r) => r.data),
  updateProfile: (id, body) => api.patch(`/api/v1/tax/profiles/${id}`, body).then((r) => r.data),
  deleteProfile: (id) => api.delete(`/api/v1/tax/profiles/${id}`),

  listTransactions: (params) => api.get("/api/v1/tax/transactions", params).then((r) => r.data.items),
  createTransaction: (body) => api.post("/api/v1/tax/transactions", body).then((r) => r.data),
  updateTransaction: (id, body) => api.patch(`/api/v1/tax/transactions/${id}`, body).then((r) => r.data),
  deleteTransaction: (id) => api.delete(`/api/v1/tax/transactions/${id}`),
  bulkReview: (body) => api.post("/api/v1/tax/transactions/bulk-review", body).then((r) => r.data),
  classify: (body) => api.post("/api/v1/tax/transactions/classify", body, { timeout: 60000 }).then((r) => r.data),

  importSpreadsheet: (file, profileId, defaultDirection = "EXPENSE") => {
    const form = new FormData();
    form.append("file", file);
    if (profileId) form.append("profile_id", String(profileId));
    form.append("default_direction", defaultDirection);
    return api.upload("/api/v1/tax/import/spreadsheet", form).then((r) => r.data);
  },

  listWithholding: (params) => api.get("/api/v1/tax/withholding", params).then((r) => r.data.items),
  createWithholding: (body) => api.post("/api/v1/tax/withholding", body).then((r) => r.data),
  uploadWithholdingPdf: (file, profileId, password = "") => {
    const form = new FormData();
    form.append("file", file);
    if (profileId) form.append("profile_id", String(profileId));
    if (password) form.append("password", password);
    return api.upload("/api/v1/tax/withholding/upload-pdf", form).then((r) => r.data);
  },
  deleteWithholding: (id) => api.delete(`/api/v1/tax/withholding/${id}`),

  listConnectors: () => api.get("/api/v1/tax/connectors").then((r) => r.data.items),
  createConnector: (body) => api.post("/api/v1/tax/connectors", body).then((r) => r.data),
  deleteConnector: (id) => api.delete(`/api/v1/tax/connectors/${id}`),
  syncBankConnector: (id, body) => api.post(`/api/v1/tax/connectors/${id}/sync-bank`, body, { timeout: 35000 }).then((r) => r.data),

  rotateWebhookToken: (profileId) => api.post("/api/v1/tax/webhook/rotate-token", {}, { params: profileId ? { profile_id: profileId } : {} }).then((r) => r.data),
  testCardSms: (body) => api.post("/api/v1/tax/webhook/test", body).then((r) => r.data),

  listHometaxJobs: () => api.get("/api/v1/tax/hometax/jobs").then((r) => r.data.items),
  createHometaxJob: (body) => api.post("/api/v1/tax/hometax/jobs", body).then((r) => r.data),
  downloadAgentScript: () => downloadBlob("/api/v1/tax/hometax/agent-script", {}, "bojogae_hometax_agent.py"),

  downloadLedgerXlsx: (taxYear) => downloadBlob("/api/v1/tax/exports/ledger.xlsx", { tax_year: taxYear }, `보조개_간편장부_${taxYear}.xlsx`),
  getDoubleEntry: (params) => api.get("/api/v1/tax/double-entry", params).then((r) => r.data),
  downloadDoubleEntryXlsx: (taxYear) =>
    downloadBlob("/api/v1/tax/exports/double-entry.xlsx", { tax_year: taxYear }, `보조개_복식부기_표준재무제표_${taxYear}.xlsx`),
  downloadSummaryPdf: (taxYear) => downloadBlob("/api/v1/tax/exports/summary.pdf", { tax_year: taxYear }, `보조개_세무요약_${taxYear}.pdf`),
  listPartnerExports: () => api.get("/api/v1/tax/partner-exports").then((r) => r.data.items),
  createPartnerExport: (body) => api.post("/api/v1/tax/partner-exports", body).then((r) => r.data),
};

export const adminTaxApi = {
  getOverview: (params) => api.get("/api/v1/admin/tax/overview", params).then((r) => r.data),
  updateProfile: (body) => api.patch("/api/v1/admin/tax/profile", body).then((r) => r.data),

  listTransactions: (params) => api.get("/api/v1/admin/tax/transactions", params).then((r) => r.data.items),
  createTransaction: (body) => api.post("/api/v1/admin/tax/transactions", body).then((r) => r.data),
  updateTransaction: (id, body) => api.patch(`/api/v1/admin/tax/transactions/${id}`, body).then((r) => r.data),
  deleteTransaction: (id) => api.delete(`/api/v1/admin/tax/transactions/${id}`),
  bulkReview: (body) => api.post("/api/v1/admin/tax/transactions/bulk-review", body).then((r) => r.data),
  classify: (body) => api.post("/api/v1/admin/tax/transactions/classify", body, { timeout: 60000 }).then((r) => r.data),

  syncPgPayments: (body) => api.post("/api/v1/admin/tax/sync/pg-payments", body, { timeout: 30000 }).then((r) => r.data),
  importSpreadsheet: (file, profileId, defaultDirection = "EXPENSE") => {
    const form = new FormData();
    form.append("file", file);
    if (profileId) form.append("profile_id", String(profileId));
    form.append("default_direction", defaultDirection);
    return api.upload("/api/v1/admin/tax/import/spreadsheet", form).then((r) => r.data);
  },

  listConnectors: () => api.get("/api/v1/admin/tax/connectors").then((r) => r.data.items),
  createConnector: (body) => api.post("/api/v1/admin/tax/connectors", body).then((r) => r.data),
  deleteConnector: (id) => api.delete(`/api/v1/admin/tax/connectors/${id}`),
  syncBankConnector: (id, body) => api.post(`/api/v1/admin/tax/connectors/${id}/sync-bank`, body, { timeout: 35000 }).then((r) => r.data),

  listHometaxJobs: () => api.get("/api/v1/admin/tax/hometax/jobs").then((r) => r.data.items),
  createHometaxJob: (body) => api.post("/api/v1/admin/tax/hometax/jobs", body).then((r) => r.data),
  downloadAgentScript: () => downloadBlob("/api/v1/admin/tax/hometax/agent-script", {}, "bojogae_hometax_agent.py"),

  downloadVatXlsx: (taxYear, periodCode) =>
    downloadBlob("/api/v1/admin/tax/exports/vat-ledger.xlsx", { tax_year: taxYear, period_code: periodCode }, `마음AI_부가세_매입매출장_${taxYear}_${periodCode}.xlsx`),
  downloadSummaryPdf: (taxYear, periodCode) =>
    downloadBlob("/api/v1/admin/tax/exports/summary.pdf", { tax_year: taxYear, period_code: periodCode }, `마음AI_세무요약_${taxYear}_${periodCode}.pdf`),
  listPartnerExports: () => api.get("/api/v1/admin/tax/partner-exports").then((r) => r.data.items),
  createPartnerExport: (body) => api.post("/api/v1/admin/tax/partner-exports", body).then((r) => r.data),
};
