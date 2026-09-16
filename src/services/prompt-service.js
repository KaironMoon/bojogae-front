import apiCaller from "@/services/api-caller";

function promptPreviewImageUrl(promptId, revision = "") {
  const base = import.meta.env.VITE_API_BASE_URL || "";
  return `${base}/api/v1/prompts/${promptId}/preview-image?revision=${encodeURIComponent(revision || "")}`;
}

async function uploadPromptPreviewImage(promptId, image) {
  const data = new FormData();
  data.append("image", image);
  return (await apiCaller.put(`/api/v1/admin/prompts/${promptId}/preview-image`, data)).data;
}

async function deletePromptPreviewImage(promptId) {
  return (await apiCaller.delete(`/api/v1/admin/prompts/${promptId}/preview-image`)).data;
}

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

async function createPrompt(title, body, categoryIds = [], inputSchema = []) {
  const response = await apiCaller.post("/api/v1/admin/prompts", {
    title,
    body,
    category_ids: categoryIds,
    input_schema: inputSchema,
  });
  return response.data;
}

async function updatePrompt(promptId, title, body, categoryIds = [], inputSchema = []) {
  const response = await apiCaller.put(`/api/v1/admin/prompts/${promptId}`, {
    title,
    body,
    category_ids: categoryIds,
    input_schema: inputSchema,
  });
  return response.data;
}

async function getPromptCategories() {
  const response = await apiCaller.get("/api/v1/admin/prompt-categories");
  return response.data;
}

async function createPromptCategory(values) {
  const response = await apiCaller.post("/api/v1/admin/prompt-categories", values);
  return response.data;
}

async function updatePromptCategory(categoryId, values) {
  const response = await apiCaller.put(
    `/api/v1/admin/prompt-categories/${categoryId}`,
    values,
  );
  return response.data;
}

async function deletePromptCategory(categoryId) {
  await apiCaller.delete(`/api/v1/admin/prompt-categories/${categoryId}`);
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
  promptPreviewImageUrl,
  uploadPromptPreviewImage,
  deletePromptPreviewImage,
  createPrompt,
  createPromptCategory,
  deletePrompt,
  deletePromptCategory,
  deletePromptVersion,
  getPrompt,
  getPromptCategories,
  getPrompts,
  getPromptVersions,
  recoverPrompt,
  recoverPromptVersion,
  restorePromptVersion,
  updatePrompt,
  updatePromptCategory,
};
