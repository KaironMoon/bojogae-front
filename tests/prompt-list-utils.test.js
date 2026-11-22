import test from "node:test";
import assert from "node:assert/strict";
import {
  defaultPromptTab,
  promptsForTab,
  filterPromptCategories,
  selectSingleCategory,
  categoryIdsFromSingle,
} from "../src/services/prompt-list-utils.js";

const options = [
  { id: 1, is_favorite: false, categories: [{ id: 10 }] },
  { id: 2, is_favorite: true, categories: [{ id: 10 }, { id: 20 }] },
  { id: 3, is_favorite: true, categories: [{ id: 20 }] },
];
test("즐겨찾기 유무에 따라 기본 탭을 선택한다", () => {
  assert.equal(defaultPromptTab(options), "favorites");
  assert.equal(defaultPromptTab([options[0]]), "recommended");
  assert.equal(defaultPromptTab([]), "recommended");
});
test("즐겨찾기 카테고리 검색은 즐겨찾기 목록 안에서 모든 조건을 적용한다", () => {
  const favorites = promptsForTab(options, "favorites");
  assert.deepEqual(filterPromptCategories(favorites, [10]).map((p) => p.id), [2]);
  assert.deepEqual(filterPromptCategories(favorites, [10, 20]).map((p) => p.id), [2]);
  assert.deepEqual(filterPromptCategories(favorites, []).map((p) => p.id), [2, 3]);
  assert.deepEqual(filterPromptCategories(favorites, [30]), []);
  assert.deepEqual(promptsForTab(options, "recommended"), options);
});

test("단일 카테고리 라디오 선택은 이전 선택을 대체하고 재클릭 시 전체로 해제한다", () => {
  assert.equal(selectSingleCategory(null, 10), 10);
  assert.equal(selectSingleCategory(10, 20), 20);
  assert.equal(selectSingleCategory(20, 20), null);
  assert.equal(selectSingleCategory(20, null), null);
  assert.deepEqual(
    filterPromptCategories(options, categoryIdsFromSingle(20)).map((p) => p.id),
    [2, 3],
  );
  assert.deepEqual(
    filterPromptCategories(options, categoryIdsFromSingle(null)).map((p) => p.id),
    [1, 2, 3],
  );
});
