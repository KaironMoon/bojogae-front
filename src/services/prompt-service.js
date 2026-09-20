import apiCaller from "@/services/api-caller";

export const MAX_PREVIEW_IMAGES = 20;

function promptPreviewImageUrl(promptId, revision = "", imageId = "") {
  const base = import.meta.env.VITE_API_BASE_URL || "";
  return `${base}/api/v1/prompts/${promptId}/preview-image?revision=${encodeURIComponent(revision || "")}&image_id=${encodeURIComponent(imageId || "")}`;
}

async function uploadPromptPreviewImage(promptId, images, retainedIds = []) {
  const data = new FormData();
  images.forEach((image) => data.append("images", image));
  data.append("retained_ids", JSON.stringify(retainedIds));
  return (await apiCaller.put(`/api/v1/admin/prompts/${promptId}/preview-images`, data)).data;
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

async function setPromptDefaultFavorite(promptId, isDefaultFavorite) {
  const response = await apiCaller.put(`/api/v1/admin/prompts/${promptId}/default-favorite`, {
    is_default_favorite: isDefaultFavorite,
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
  setPromptDefaultFavorite,
  updatePrompt,
  updatePromptCategory,
};
