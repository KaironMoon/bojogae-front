import test from "node:test";
import assert from "node:assert/strict";
import {
  BASE_PREVIEW_PAGE_WIDTH,
  MAX_PREVIEW_ZOOM,
  MIN_PREVIEW_ZOOM,
  clampPreviewZoom,
  resolveActivePreviewPage,
} from "../src/services/preview-carousel-utils.js";

test("clampPreviewZoom은 허용 배율 범위(50%~200%)로 정규화한다", () => {
  assert.equal(BASE_PREVIEW_PAGE_WIDTH, 1080);
  assert.equal(clampPreviewZoom(0.1), MIN_PREVIEW_ZOOM);
  assert.equal(clampPreviewZoom(3.5), MAX_PREVIEW_ZOOM);
  assert.equal(clampPreviewZoom(1.254), 1.25);
  assert.equal(clampPreviewZoom(Number.NaN), 1);
});

test("resolveActivePreviewPage는 스크롤 위치와 최하단 도달 여부에 따라 활성 페이지를 계산한다", () => {
  const pages = [
    { top: 24, height: 1400 },
    { top: 1448, height: 1400 },
    { top: 2872, height: 1400 },
    { top: 4296, height: 1400 },
  ];

  assert.equal(resolveActivePreviewPage([], 0, 800, 800), 0);
  assert.equal(resolveActivePreviewPage(pages, 0, 800, 5720), 0);
  // clientHeight=800 -> anchor = scrollTop + 224 -> 1448 - 224 = 1224
  assert.equal(resolveActivePreviewPage(pages, 1200, 800, 5720), 0);
  assert.equal(resolveActivePreviewPage(pages, 1250, 800, 5720), 1);
  assert.equal(resolveActivePreviewPage(pages, 2700, 800, 5720), 2);
  // 맨 아래 도달 시 마지막 페이지로 전환된다
  assert.equal(resolveActivePreviewPage(pages, 4915, 800, 5720), 3);
});
