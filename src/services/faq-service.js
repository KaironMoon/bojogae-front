import apiCaller from "@/services/api-caller";

export async function listFaqs(query = "") {
  return (await apiCaller.get("/api/v1/faqs", { q: query })).data;
}

export async function listAdminFaqs() {
  return (await apiCaller.get("/api/v1/admin/faqs")).data;
}

export async function saveFaq(item) {
  const payload = { question: item.question.trim(), answer: item.answer.trim(), is_visible: item.is_visible };
  return item.id
    ? (await apiCaller.put(`/api/v1/admin/faqs/${item.id}`, { ...payload, version: item.version })).data
    : (await apiCaller.post("/api/v1/admin/faqs", payload)).data;
}

export async function deleteFaq(item) {
  await apiCaller.delete(`/api/v1/admin/faqs/${item.id}`, { version: item.version });
}

export async function reorderFaqs(ids, items) {
  return (await apiCaller.put("/api/v1/admin/faqs/order", {
    ids, versions: Object.fromEntries(items.map((item) => [item.id, item.version])),
  })).data;
}

export function faqError(error, admin = false) {
  const detail = error.response?.data?.detail;
  const messages = {
    faqs_schema_required: admin ? "FAQ 관리 설정이 필요합니다. SQL 067 적용 여부를 확인해 주세요." : "FAQ를 준비 중입니다. 잠시 후 다시 확인하거나 1:1 문의를 이용해 주세요.",
    faq_not_found: "삭제되었거나 찾을 수 없는 FAQ입니다. 목록을 새로고침해 주세요.",
    faq_changed: "다른 관리자가 FAQ를 변경했습니다. 편집 창을 닫고 최신 목록에서 다시 열어 주세요.",
  };
  if (Array.isArray(detail)) return "질문과 답변의 내용·길이를 확인해 주세요.";
  return messages[detail] || "FAQ를 불러오거나 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.";
}
