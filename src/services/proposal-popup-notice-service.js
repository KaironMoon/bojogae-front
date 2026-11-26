import apiCaller from "@/services/api-caller";

export async function getActivePopupNotices() {
  return (await apiCaller.get("/api/v1/proposals/popup-notices")).data;
}

export async function listAdminPopupNotices() {
  return (await apiCaller.get("/api/v1/admin/proposal-popup-notices")).data;
}

export async function createAdminPopupNotice(payload) {
  return (await apiCaller.post("/api/v1/admin/proposal-popup-notices", payload)).data;
}

export async function updateAdminPopupNotice(id, payload) {
  return (await apiCaller.put(`/api/v1/admin/proposal-popup-notices/${id}`, payload)).data;
}

export async function deleteAdminPopupNotice(id) {
  await apiCaller.delete(`/api/v1/admin/proposal-popup-notices/${id}`);
}

export {
  filterVisibleTodayNotices,
  getHiddenTodayNoticeIds,
  hideNoticesForToday,
  seoulTodayString,
} from "./proposal-popup-notice-storage.js";
