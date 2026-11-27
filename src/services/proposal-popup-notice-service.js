import apiCaller from "@/services/api-caller";

export const POPUP_TARGET_PAGE_OPTIONS = [
  { value: "proposals", label: "보고서 만들기" },
  { value: "plans", label: "요금 안내" },
  { value: "home", label: "홈" },
  { value: "profile", label: "내 정보 · 결제" },
  { value: "claims", label: "보험금 청구" },
  { value: "crm", label: "고객관리 (CRM)" },
  { value: "insurers", label: "보험사 정보" },
  { value: "boards", label: "게시판" },
  { value: "all", label: "전체 페이지" },
];

const POPUP_TARGET_PAGE_MAP = Object.fromEntries(
  POPUP_TARGET_PAGE_OPTIONS.map((opt) => [opt.value, opt.label]),
);

export function popupTargetPageLabel(key) {
  return POPUP_TARGET_PAGE_MAP[key] || key;
}

export function resolvePopupPageKey(pathname = "") {
  if (!pathname || pathname.startsWith("/admin")) return null;
  if (pathname === "/proposals" || pathname.startsWith("/proposals/")) return "proposals";
  if (pathname === "/plans") return "plans";
  if (pathname === "/home") return "home";
  if (
    pathname === "/profile"
    || pathname === "/my-coins"
    || pathname === "/payment-methods"
    || pathname === "/payment-history"
  ) {
    return "profile";
  }
  if (pathname.startsWith("/claims")) return "claims";
  if (pathname.startsWith("/crm")) return "crm";
  if (pathname === "/insurers") return "insurers";
  if (pathname.startsWith("/boards")) return "boards";
  return null;
}

export async function getActivePopupNotices(page = null) {
  return (await apiCaller.get("/api/v1/proposals/popup-notices", page ? { page } : undefined)).data;
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
