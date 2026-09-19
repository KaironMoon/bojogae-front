import apiCaller from "@/services/api-caller";

const baseUrl = import.meta.env.VITE_API_BASE_URL || "";

export async function getDashboard() {
  return (await apiCaller.get("/api/v1/dashboard")).data;
}

export function dashboardBannerImageUrl(bannerId, revision = "") {
  return `${baseUrl}/api/v1/dashboard-banners/${bannerId}/image?revision=${encodeURIComponent(revision)}`;
}

export async function listDashboardBanners() {
  return (await apiCaller.get("/api/v1/admin/dashboard-banners")).data;
}

function bannerForm(values) {
  const form = new FormData();
  form.append("title", values.title.trim());
  form.append("description", values.description.trim());
  form.append("link_url", values.linkUrl.trim());
  if (values.startsAt) form.append("starts_at", new Date(values.startsAt).toISOString());
  if (values.endsAt) form.append("ends_at", new Date(values.endsAt).toISOString());
  form.append("sort_order", String(values.sortOrder || 0));
  form.append("is_active", String(values.isActive));
  if (values.image) form.append("image", values.image);
  return form;
}

export async function saveDashboardBanner(values, bannerId = null) {
  const path = `/api/v1/admin/dashboard-banners${bannerId ? `/${bannerId}` : ""}`;
  const form = bannerForm(values);
  const response = bannerId
    ? await apiCaller.put(path, form, { timeout: 120000 })
    : await apiCaller.post(path, form, { timeout: 120000 });
  return response.data;
}

export async function deleteDashboardBanner(bannerId) {
  await apiCaller.delete(`/api/v1/admin/dashboard-banners/${bannerId}`);
}

export function dashboardError(error) {
  const messages = {
    dashboard_schema_required: "대시보드 DB 설정이 필요합니다.",
    invalid_banner: "배너 제목을 입력해 주세요.",
    invalid_banner_link: "연결 주소는 http 또는 https 주소여야 합니다.",
    invalid_banner_period: "종료 시각은 시작 시각보다 뒤여야 합니다.",
    invalid_banner_image_type: "JPG, PNG, WebP 이미지만 등록할 수 있습니다.",
    banner_image_too_large: "배너 이미지는 최대 5MB까지 가능합니다.",
    banner_image_required: "배너 이미지를 선택해 주세요.",
    empty_banner_image: "빈 이미지는 등록할 수 없습니다.",
    banner_not_found: "배너를 찾을 수 없습니다.",
  };
  return messages[error.response?.data?.detail] || "요청을 처리하지 못했습니다. 다시 시도해 주세요.";
}
