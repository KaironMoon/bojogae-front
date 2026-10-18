import apiCaller from "@/services/api-caller";

const endpoint = (admin) => `/api/v1/${admin ? "admin/" : ""}help-inquiries`;

export async function listHelpInquiries(admin, page, status) {
  return (await apiCaller.get(endpoint(admin), { page, ...(admin && status ? { status } : {}) })).data;
}

export async function getHelpInquiry(admin, id) {
  return (await apiCaller.get(`${endpoint(admin)}/${id}`)).data;
}

export async function createHelpInquiry(values) {
  return (await apiCaller.post(endpoint(false), {
    title: values.title.trim(), content: values.content.trim(), reply_email: values.email.trim() || null,
  })).data;
}

export async function answerHelpInquiry(id, answer) {
  return (await apiCaller.post(`${endpoint(true)}/${id}/answer`, { answer: answer.trim() })).data;
}

export async function retryHelpInquiryEmail(id) {
  return (await apiCaller.post(`${endpoint(true)}/${id}/retry-email`)).data;
}

export function helpInquiryError(error) {
  const detail = error.response?.data?.detail;
  const messages = {
    help_inquiries_schema_required: "문의 기능을 준비 중입니다. 1:1 카카오톡 문의를 이용해 주세요.",
    inquiry_not_found: "문의 내역을 찾을 수 없습니다.",
    inquiry_already_answered: "이미 답변이 등록되었습니다. 새로고침해 주세요.",
    inquiry_rate_limited: "방금 문의가 접수되었습니다. 잠시 후 다시 시도해 주세요.",
    inquiry_account_unavailable: "현재 계정으로 문의를 등록할 수 없습니다.",
    inquiry_email_retry_unavailable: "이미 발송되었거나 발송 중입니다. 잠시 후 상태를 확인해 주세요.",
  };
  if (Array.isArray(detail)) return "제목·내용과 이메일 형식을 확인해 주세요.";
  return messages[detail] || "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.";
}
