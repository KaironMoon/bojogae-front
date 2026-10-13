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

async function createPrompt(title, body, categoryIds = [], inputSchema = [], description = "", commonPromptIds = []) {
  const response = await apiCaller.post("/api/v1/admin/prompts", {
    title,
    body,
    category_ids: categoryIds,
    input_schema: inputSchema,
    description: description || null,
    common_prompt_ids: commonPromptIds,
  });
  return response.data;
}

async function updatePrompt(promptId, title, body, categoryIds = [], inputSchema = [], description = "", commonPromptIds = []) {
  const response = await apiCaller.put(`/api/v1/admin/prompts/${promptId}`, {
    title,
    body,
    category_ids: categoryIds,
    input_schema: inputSchema,
    description: description || null,
    common_prompt_ids: commonPromptIds,
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

export async function getCommonPrompts() {
  return (await apiCaller.get("/api/v1/admin/prompts/common")).data;
}

export async function saveCommonPrompt(values, id = null) {
  const url = `/api/v1/admin/prompts/common${id ? `/${id}` : ""}`;
  return (await (id ? apiCaller.put(url, values) : apiCaller.post(url, values))).data;
}

export async function deleteCommonPrompt(id) {
  await apiCaller.delete(`/api/v1/admin/prompts/common/${id}`);
}

export function commonPromptError(error) {
  return {
    common_prompt_schema_required: "공통 프롬프트 DB 설정이 필요합니다. 059_common_prompts.sql 적용 후 다시 시도해 주세요.",
    common_prompt_limit_reached: "공통 프롬프트는 최대 5개까지 만들 수 있습니다.",
    common_prompt_not_available: "사용할 수 없는 공통 프롬프트가 있습니다. 적용 목록에서 제외하고 다시 저장해 주세요.",
    common_prompt_in_use: "적용 중인 공통 프롬프트입니다. 각 프롬프트의 적용 목록에서 제외하고 저장한 뒤 삭제해 주세요.",
    common_prompt_not_found: "공통 프롬프트를 찾을 수 없습니다. 목록을 새로고침해 주세요.",
  }[error.response?.data?.detail] || "공통 프롬프트 처리에 실패했습니다. 다시 시도해 주세요.";
}
