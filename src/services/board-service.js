import apiCaller from "@/services/api-caller";


const baseUrl = import.meta.env.VITE_API_BASE_URL || "";

export async function listBoardPosts(boardType, { page = 1, category = "", q = "", admin = false } = {}) {
  const prefix = admin ? "/api/v1/admin/boards" : "/api/v1/boards";
  return (await apiCaller.get(`${prefix}/${boardType}`, {
    page,
    ...(category ? { category } : {}),
    ...(q ? { q } : {}),
  })).data;
}

export async function getPublicBoardPost(postId) {
  return (await apiCaller.get(`/api/v1/board-posts/${postId}`)).data;
}

export async function getAdminBoardPost(boardType, postId) {
  return (await apiCaller.get(`/api/v1/admin/boards/${boardType}/${postId}`)).data;
}

function postForm({ category, title, content, contentFormat = "TEXT", isPinned, files, keptFileIds }) {
  const form = new FormData();
  form.append("category", category);
  form.append("title", title);
  form.append("content", content);
  form.append("content_format", contentFormat);
  form.append("is_pinned", String(isPinned));
  if (keptFileIds) form.append("kept_file_ids", JSON.stringify(keptFileIds));
  files.forEach(file => form.append("files", file));
  return form;
}

export async function saveBoardPost(boardType, values, postId = null) {
  const path = `/api/v1/admin/boards/${boardType}${postId ? `/${postId}` : ""}`;
  const form = postForm(values);
  const response = postId
    ? await apiCaller.put(path, form, { timeout: 120000 })
    : await apiCaller.post(path, form, { timeout: 120000 });
  return response.data;
}

export async function uploadBoardImage(file) {
  const form = new FormData();
  form.append("file", file);
  const response = await apiCaller.post("/api/v1/admin/boards/images", form, { timeout: 120000 });
  return { ...response.data, url: `${baseUrl}${response.data.url}` };
}

export async function deleteBoardPost(boardType, postId) {
  await apiCaller.delete(`/api/v1/admin/boards/${boardType}/${postId}`);
}

export function boardAttachmentUrl(postId, fileId) {
  return `${baseUrl}/api/v1/board-posts/${postId}/files/${fileId}/download`;
}

export function boardError(error) {
  const messages = {
    board_not_found: "게시판을 찾을 수 없습니다.",
    board_post_not_found: "게시글을 찾을 수 없거나 삭제되었습니다.",
    board_file_not_found: "첨부파일을 찾을 수 없습니다.",
    invalid_board_category: "게시판에 맞는 분류를 선택해주세요.",
    invalid_board_post: "제목과 내용을 입력해주세요.",
    invalid_board_attachments: "첨부파일은 기존 파일을 포함해 최대 5개까지 가능합니다.",
    invalid_board_file_type: "허용되지 않는 첨부파일 형식입니다.",
    invalid_board_image_type: "PNG, JPG, WEBP, GIF 이미지만 올릴 수 있습니다.",
    board_image_too_large: "이미지는 파일당 5MB 이하만 올릴 수 있습니다.",
    empty_board_image: "빈 이미지 파일은 올릴 수 없습니다.",
    board_file_too_large: "첨부파일은 파일당 최대 10MB까지 가능합니다.",
    empty_board_file: "빈 파일은 첨부할 수 없습니다.",
    board_schema_required: "게시판 DB 설정이 필요합니다. 관리자에게 문의해주세요.",
  };
  return messages[error.response?.data?.detail] || "게시판 요청을 처리하지 못했습니다. 다시 시도해주세요.";
}
