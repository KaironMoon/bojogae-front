import test from "node:test";
import assert from "node:assert/strict";
import {
  defaultPromptTab,
  promptsForTab,
  filterPromptCategories,
  selectSingleCategory,
  categoryIdsFromSingle,
  buildAdminCategoryGroups,
  filterAdminPrompts,
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

test("buildAdminCategoryGroups는 정렬 순서대로 그룹화하고 빈 카테고리와 미분류를 구분한다", () => {
  const categories = [
    {
      id: 2,
      name: "보험",
      sort_order: 2,
      children: [
        { id: 22, name: "종신", sort_order: 2, parent_id: 2 },
        { id: 21, name: "건강", sort_order: 1, parent_id: 2 },
        { id: 23, name: "빈 소분류", sort_order: 3, parent_id: 2 },
      ],
    },
    {
      id: 1,
      name: "공통",
      sort_order: 1,
      children: [{ id: 11, name: "고지사항", sort_order: 1, parent_id: 1 }],
    },
    {
      id: 3,
      name: "빈 대분류",
      sort_order: 3,
      children: [{ id: 31, name: "미사용", sort_order: 1, parent_id: 3 }],
    },
  ];
  const prompts = [
    { id: 101, title: "건강 분석", categories: [{ id: 21 }] },
    { id: 102, title: "고지 분석", categories: [{ id: 11 }, { id: 22 }] },
    { id: 103, title: "미분류 프롬프트", categories: [] },
  ];

  const { groups, unassigned } = buildAdminCategoryGroups(prompts, categories);
  assert.deepEqual(groups.map((g) => g.id), [1, 2]);
  assert.deepEqual(groups[0].children.map((c) => [c.id, c.count]), [[11, 1]]);
  assert.deepEqual(groups[1].children.map((c) => [c.id, c.count]), [[21, 1], [22, 1]]);
  assert.deepEqual(unassigned.map((p) => p.id), [103]);
});

test("filterAdminPrompts는 전체·미분류·소분류·검색어로 프롬프트를 필터링한다", () => {
  const categories = [
    { id: 1, name: "공통", children: [{ id: 11, name: "고지사항" }] },
    { id: 2, name: "건강", children: [{ id: 21, name: "암" }] },
  ];
  const prompts = [
    { id: 1, title: "알릴의무 체크", description: "고지사항 검토", report_folder: "notice_check", categories: [{ id: 11, name: "고지사항", parent_name: "공통" }] },
    { id: 2, title: "암 보장 비교", description: "진단비 비교", report_folder: "cancer_cmp", categories: [{ id: 21, name: "암", parent_name: "건강" }] },
    { id: 3, title: "초안 보고서", description: "", report_folder: "draft_01", categories: [] },
  ];

  assert.deepEqual(filterAdminPrompts(prompts, categories, null).map((p) => p.id), [1, 2, 3]);
  assert.deepEqual(filterAdminPrompts(prompts, categories, "unassigned").map((p) => p.id), [3]);
  assert.deepEqual(filterAdminPrompts(prompts, categories, 21).map((p) => p.id), [2]);
  assert.deepEqual(filterAdminPrompts(prompts, categories, null, "cancer_cmp").map((p) => p.id), [2]);
  assert.deepEqual(filterAdminPrompts(prompts, categories, 11, "고지사항").map((p) => p.id), [1]);
  assert.deepEqual(filterAdminPrompts(prompts, categories, 11, "진단비"), []);
});
