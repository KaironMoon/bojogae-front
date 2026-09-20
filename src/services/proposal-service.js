import apiCaller from "@/services/api-caller";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

function createIdempotencyKey() {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  if (typeof globalThis.crypto?.getRandomValues === "function") {
    const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16));
    return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

async function getPromptOptions() {
  const response = await apiCaller.get("/api/v1/proposals/prompt-options");
  return response.data;
}

async function setPromptFavorite(promptId, isFavorite) {
  const response = await apiCaller.put(`/api/v1/proposals/prompt-options/${promptId}/favorite`, {
    is_favorite: isFavorite,
  });
  return response.data;
}

async function getPointBalance() {
  const response = await apiCaller.get("/api/v1/points/me");
  return response.data;
}

async function createProposal({
  title, promptId, files, idempotencyKey, inputValues = {}, fileFields = [],
  attachedGenerationIds = [], attachedGenerationFields = [], promptVersionId,
}) {
  const form = new FormData();
  form.append("title", title);
  form.append("prompt_id", String(promptId));
  files.forEach((file) => form.append("files", file));
  form.append("input_values", JSON.stringify(inputValues));
  form.append("file_fields", JSON.stringify(fileFields));
  form.append("attached_generation_ids", JSON.stringify(attachedGenerationIds));
  form.append("attached_generation_fields", JSON.stringify(attachedGenerationFields));
  if (promptVersionId) form.append("prompt_version_id", String(promptVersionId));
  const response = await apiCaller.post("/api/v1/proposals", form, {
    headers: { "Idempotency-Key": idempotencyKey },
    timeout: 120000,
  });
  return response.data;
}

async function getProposals(page = 1, pageSize = 10, includeFailed = true) {
  const response = await apiCaller.get("/api/v1/proposals", {
    page,
    page_size: pageSize,
    include_failed: includeFailed,
  });
  return response.data;
}

async function getProposal(id, admin = false) {
  const response = await apiCaller.get(
    admin ? `/api/v1/admin/proposals/${id}` : `/api/v1/proposals/${id}`,
  );
  return response.data;
}

async function cancelProposal(id) {
  const response = await apiCaller.post(`/api/v1/proposals/${id}/cancel`);
  return response.data;
}

async function updateShareSummary(id, summary) {
  const response = await apiCaller.put(`/api/v1/proposals/${id}/share-summary`, { summary });
  return response.data;
}

async function retryProposal(id) {
  const response = await apiCaller.post(`/api/v1/proposals/${id}/retry`, {
    idempotency_key: createIdempotencyKey(),
  });
  return response.data;
}

async function deleteProposal(id, admin = false) {
  await apiCaller.delete(
    admin ? `/api/v1/admin/proposals/${id}` : `/api/v1/proposals/${id}`,
  );
}

async function recoverProposal(id) {
  const response = await apiCaller.post(`/api/v1/admin/proposals/${id}/recover`);
  return response.data;
}

async function rerenderProposalShare(id) {
  const response = await apiCaller.post(`/api/v1/admin/proposals/${id}/share-rerender`);
  return response.data;
}

function proposalEventSource(id) {
  return new EventSource(`${API_BASE_URL}/api/v1/proposals/${id}/events`, {
    withCredentials: true,
  });
}

function proposalFileUrl(id, kind, { fileId, admin = false, download = false } = {}) {
  const prefix = admin ? "/api/v1/admin/proposals" : "/api/v1/proposals";
  const action = download ? "download" : "open";
  if (kind === "input") return `${API_BASE_URL}${prefix}/${id}/files/${fileId}/${action}`;
  return `${API_BASE_URL}${prefix}/${id}/output/${action}`;
}

function proposalRawResponseUrl(id, download = false, admin = true) {
  const action = download ? "download" : "open";
  const prefix = admin ? "admin/proposals" : "proposals";
  return `${API_BASE_URL}/api/v1/${prefix}/${id}/response/${action}`;
}

async function getAdminProposals(params) {
  const response = await apiCaller.get("/api/v1/admin/proposals", params);
  return response.data;
}

async function getUsage(params) {
  const response = await apiCaller.get("/api/v1/admin/usage", params);
  return response.data;
}

async function getProposalSettings() {
  const response = await apiCaller.get("/api/v1/admin/proposal-settings");
  return response.data;
}

async function updateProposalSettings(values) {
  const response = await apiCaller.put("/api/v1/admin/proposal-settings", values);
  return response.data;
}

async function getPromptPointCosts() {
  const response = await apiCaller.get("/api/v1/admin/prompt-point-costs");
  return response.data;
}

async function updatePromptPointCost(promptId, pointCost) {
  const response = await apiCaller.put(`/api/v1/admin/prompt-point-costs/${promptId}`, {
    point_cost: Number(pointCost),
  });
  return response.data;
}

async function decideProposalPoints(id, action, reason) {
  const response = await apiCaller.post(`/api/v1/admin/proposals/${id}/point-decision`, {
    action,
    reason,
  });
  return response.data;
}

export {
  cancelProposal,
  createIdempotencyKey,
  createProposal,
  deleteProposal,
  getAdminProposals,
  getPointBalance,
  getPromptPointCosts,
  getPromptOptions,
  setPromptFavorite,
  getProposal,
  getProposals,
  getProposalSettings,
  getUsage,
  proposalEventSource,
  proposalFileUrl,
  proposalRawResponseUrl,
  recoverProposal,
  retryProposal,
  decideProposalPoints,
  updatePromptPointCost,
  updateProposalSettings,
  updateShareSummary,
  rerenderProposalShare,
};

export async function getPersonalMonthlyPoints() {
  return (await apiCaller.get('/api/v1/admin/personal-monthly-points')).data;
}

export async function updatePersonalMonthlyPoints(amount) {
  return (await apiCaller.put('/api/v1/admin/personal-monthly-points', { amount })).data;
}
