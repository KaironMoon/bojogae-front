import test from "node:test";
import assert from "node:assert/strict";

import { BOARD_CONFIG, boardConfig, categoryLabel } from "../src/services/board-config.js";


test("three boards expose the agreed categories", () => {
  assert.deepEqual(Object.keys(BOARD_CONFIG), ["notices", "industry-news", "insurance-knowledge"]);
  assert.equal(categoryLabel("notices", "REPORT_UPDATE"), "보고서 업데이트·추가");
  assert.equal(categoryLabel("industry-news", "NEW_PRODUCT"), "신상품 소개");
  assert.equal(categoryLabel("insurance-knowledge", "REFERENCE"), "참고 정보");
});

test("unknown board and category remain safe for rendering", () => {
  assert.equal(boardConfig("unknown"), null);
  assert.equal(categoryLabel("notices", "UNKNOWN"), "UNKNOWN");
});
