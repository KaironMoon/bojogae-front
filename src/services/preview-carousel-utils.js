export const BASE_PREVIEW_PAGE_WIDTH = 1080;
export const MIN_PREVIEW_ZOOM = 0.5;
export const MAX_PREVIEW_ZOOM = 2;
export const PREVIEW_ZOOM_STEP = 0.25;

export function clampPreviewZoom(value) {
  if (!Number.isFinite(value)) return 1;
  return Math.min(MAX_PREVIEW_ZOOM, Math.max(MIN_PREVIEW_ZOOM, Number(value.toFixed(2))));
}

export function resolveActivePreviewPage(pageMetrics, scrollTop, clientHeight, scrollHeight) {
  if (!Array.isArray(pageMetrics) || pageMetrics.length === 0) return 0;
  if (scrollHeight > clientHeight && scrollTop + clientHeight >= scrollHeight - 8) {
    return pageMetrics.length - 1;
  }
  const anchor = scrollTop + Math.min(Math.max(clientHeight * 0.28, 80), 260);
  let active = 0;
  for (let index = 0; index < pageMetrics.length; index += 1) {
    const metric = pageMetrics[index];
    if (!metric) continue;
    if (metric.top <= anchor) active = index;
    else break;
  }
  return active;
}
