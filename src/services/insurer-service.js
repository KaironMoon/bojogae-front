import apiCaller from "@/services/api-caller";

export async function getInsurers(query, signal) {
  return (await apiCaller.get("/api/v1/insurers", { q: query }, { signal })).data;
}
