import apiCaller from "@/services/api-caller";

async function getAnalyticsOverview(params) {
  const response = await apiCaller.get("/api/v1/admin/analytics/overview", params);
  return response.data;
}

async function getAnalyticsTraffic(params) {
  const response = await apiCaller.get("/api/v1/admin/analytics/traffic", params);
  return response.data;
}

async function getAnalyticsCompanies(params) {
  const response = await apiCaller.get("/api/v1/admin/analytics/companies", params);
  return response.data;
}

async function upsertCompanyAlias(rawLabel, canonicalName) {
  const response = await apiCaller.put("/api/v1/admin/analytics/company-aliases", {
    raw_label: rawLabel,
    canonical_name: canonicalName,
  });
  return response.data;
}

async function deleteCompanyAlias(aliasId) {
  const response = await apiCaller.delete(`/api/v1/admin/analytics/company-aliases/${aliasId}`);
  return response.data;
}

async function getAnalyticsKkomak(params) {
  const response = await apiCaller.get("/api/v1/admin/analytics/kkomak", params);
  return response.data;
}

async function getAnalyticsSegments(params) {
  const response = await apiCaller.get("/api/v1/admin/analytics/segments", params);
  return response.data;
}

async function downloadAnalyticsSegmentsExport(params) {
  const response = await apiCaller.get("/api/v1/admin/analytics/segments/export", params, {
    responseType: "blob",
    timeout: 60000,
  });
  const disposition = response.headers?.["content-disposition"] || "";
  const match = disposition.match(/filename="?([^"]+)"?/i);
  const ext = params?.format === "csv" ? "csv" : "xlsx";
  const filename = match?.[1] || `bojogae_marketing_${params?.segment || "unused"}.${ext}`;
  const blobUrl = URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
}

async function triggerAnalyticsRollup(mode = "incremental", resolveGeoLimit = 20) {
  const response = await apiCaller.post(
    "/api/v1/admin/analytics/rollup",
    { mode, resolve_geo_limit: resolveGeoLimit },
    { timeout: 60000 },
  );
  return response.data;
}

async function backfillAnalyticsGeo(limit = 30) {
  const response = await apiCaller.post(`/api/v1/admin/analytics/geo/backfill?limit=${limit}`, {}, {
    timeout: 60000,
  });
  return response.data;
}

async function upsertIpGeoOverride(payload) {
  const response = await apiCaller.put("/api/v1/admin/analytics/geo/override", payload, {
    timeout: 60000,
  });
  return response.data;
}

async function deleteIpGeoOverride(ipAddress) {
  const response = await apiCaller.delete("/api/v1/admin/analytics/geo/override", { ip_address: ipAddress }, {
    timeout: 60000,
  });
  return response.data;
}

export {
  backfillAnalyticsGeo,
  deleteCompanyAlias,
  deleteIpGeoOverride,
  downloadAnalyticsSegmentsExport,
  getAnalyticsCompanies,
  getAnalyticsKkomak,
  getAnalyticsOverview,
  getAnalyticsSegments,
  getAnalyticsTraffic,
  triggerAnalyticsRollup,
  upsertCompanyAlias,
  upsertIpGeoOverride,
};
