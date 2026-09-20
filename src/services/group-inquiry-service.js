import apiCaller from "@/services/api-caller";


export async function createGroupInquiry(values) {
  return (await apiCaller.post("/api/v1/group-inquiries", {
    organization_name: values.organizationName.trim(),
    contact_name: values.contactName.trim(),
    phone: values.phone.trim(),
    email: values.email.trim(),
    privacy_agreed: values.privacyAgreed,
    website: values.website || "",
  })).data;
}

export async function listGroupInquiries(page = 1, status = "") {
  return (await apiCaller.get("/api/v1/admin/group-inquiries", {
    page,
    ...(status ? { status } : {}),
  })).data;
}

export async function updateGroupInquiry(inquiryId, status, adminNote) {
  return (await apiCaller.put(`/api/v1/admin/group-inquiries/${inquiryId}`, {
    status,
    admin_note: adminNote,
  })).data;
}

export function groupInquiryError(error) {
  const messages = {
    group_inquiries_schema_required: "단체 문의 DB 설정이 필요합니다.",
    group_inquiry_already_submitted: "동일한 연락처로 접수된 문의가 있습니다. 잠시 후 다시 시도해 주세요.",
    privacy_agreement_required: "개인정보 수집 및 이용에 동의해 주세요.",
    invalid_group_inquiry: "입력 내용을 확인해 주세요.",
    group_inquiry_not_found: "문의 내역을 찾을 수 없습니다.",
  };
  return messages[error.response?.data?.detail] || "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.";
}
