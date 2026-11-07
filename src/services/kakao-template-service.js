import api from "@/services/api-caller";

const path = (collection) => `/api/v1/message-templates/${collection}`;

export async function listTemplates(collection, after, signal) {
  return (await api.get(path(collection), { after }, { signal })).data;
}

export async function getTemplate(collection, id) {
  return (await api.get(`${path(collection)}/${id}`)).data;
}

export async function createTemplate(collection, data) {
  return (await api.post(path(collection), data)).data;
}

export async function updateTemplate(collection, id, data) {
  return (await api.axiosInstance.patch(`${api.baseUrl}${path(collection)}/${id}`, data)).data;
}

export async function deleteTemplate(collection, id) {
  await api.delete(`${path(collection)}/${id}`);
}

export function templateError(error) {
  switch (error.response?.status) {
    case 401: return "로그인 세션이 만료되었습니다. 다시 로그인해 주세요.";
    case 403: return "이 계정으로는 문구를 관리할 수 없습니다.";
    case 404: return "항목을 찾을 수 없습니다. 목록을 새로고침해 주세요.";
    case 422: return "제목과 본문의 입력 내용을 확인해 주세요.";
    case 503: return "문구 저장 기능을 사용할 수 없습니다. 잠시 후 다시 시도해 주세요.";
    default: return "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.";
  }
}
