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

async function createProposal({ title, promptId, files, idempotencyKey }) {
  const form = new FormData();
  form.append("title", title);
  form.append("prompt_id", String(promptId));
  files.forEach((file) => form.append("files", file));
  const response = await apiCaller.post("/api/v1/proposals", form, {
    headers: { "Idempotency-Key": idempotencyKey },
    timeout: 120000,
  });
  return response.data;
}

async function getProposals(page = 1, pageSize = 10) {
  const response = await apiCaller.get("/api/v1/proposals", {
    page,
    page_size: pageSize,
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

function proposalRawResponseUrl(id, download = false) {
  const action = download ? "download" : "open";
  return `${API_BASE_URL}/api/v1/admin/proposals/${id}/response/${action}`;
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

export {
  cancelProposal,
  createIdempotencyKey,
  createProposal,
  deleteProposal,
  getAdminProposals,
  getPromptOptions,
  getProposal,
  getProposals,
  getProposalSettings,
  getUsage,
  proposalEventSource,
  proposalFileUrl,
  proposalRawResponseUrl,
  recoverProposal,
  retryProposal,
  updateProposalSettings,
};
