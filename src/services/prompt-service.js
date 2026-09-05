import apiCaller from "@/services/api-caller";

async function getPrompts(includeDeleted = false, page = 1, pageSize = 20) {
  const response = await apiCaller.get("/api/v1/admin/prompts", {
    include_deleted: includeDeleted,
    page,
    page_size: pageSize,
  });
  return response.data;
}

async function getPrompt(promptId) {
  const response = await apiCaller.get(`/api/v1/admin/prompts/${promptId}`);
  return response.data;
}

async function createPrompt(title, body) {
  const response = await apiCaller.post("/api/v1/admin/prompts", { title, body });
  return response.data;
}

async function updatePrompt(promptId, title, body) {
  const response = await apiCaller.put(`/api/v1/admin/prompts/${promptId}`, {
    title,
    body,
  });
  return response.data;
}

async function deletePrompt(promptId) {
  await apiCaller.delete(`/api/v1/admin/prompts/${promptId}`);
}

async function recoverPrompt(promptId) {
  const response = await apiCaller.post(`/api/v1/admin/prompts/${promptId}/recover`);
  return response.data;
}

async function getPromptVersions(promptId, includeDeleted = false) {
  const response = await apiCaller.get(`/api/v1/admin/prompts/${promptId}/versions`, {
    include_deleted: includeDeleted,
  });
  return response.data;
}

async function restorePromptVersion(promptId, versionId) {
  const response = await apiCaller.post(
    `/api/v1/admin/prompts/${promptId}/versions/${versionId}/restore`,
  );
  return response.data;
}

async function deletePromptVersion(promptId, versionId) {
  await apiCaller.delete(`/api/v1/admin/prompts/${promptId}/versions/${versionId}`);
}

async function recoverPromptVersion(promptId, versionId) {
  const response = await apiCaller.post(
    `/api/v1/admin/prompts/${promptId}/versions/${versionId}/recover`,
  );
  return response.data;
}

export {
  createPrompt,
  deletePrompt,
  deletePromptVersion,
  getPrompt,
  getPrompts,
  getPromptVersions,
  recoverPrompt,
  recoverPromptVersion,
  restorePromptVersion,
  updatePrompt,
};
