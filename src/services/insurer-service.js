import apiCaller from "@/services/api-caller";

export async function getInsurers(query, signal, kind = "all") {
  return (await apiCaller.get("/api/v1/insurers", { q: query, ...(kind !== "all" ? { kind } : {}) }, { signal })).data;
}

export async function getAdminInsurers() {
  return (await apiCaller.get("/api/v1/admin/insurers")).data;
}

export async function saveInsurer(insurer) {
  return (await apiCaller.put(`/api/v1/admin/insurers/${insurer.id}`, insurer)).data;
}

export function insurerError(error) {
  const detail = error?.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map(item => `${item.loc.slice(1).join(" · ")}: ${item.msg}`).join(" / ");
  return "보험사 정보를 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.";
}
