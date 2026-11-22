import test from "node:test";
import assert from "node:assert/strict";
import { groupPromptCategories, isCompactCategoryGroup } from "../src/services/prompt-category-utils.js";

test("groups categories by configured parent and child order", () => {
  const promptOptions = [
    {
      id: 1,
      title: "가 프롬프트",
      categories: [
        { id: 22, name: "두 번째 소분류", sort_order: 2, parent_id: 20, parent_name: "두 번째 대분류", parent_sort_order: 2 },
      ],
    },
    {
      id: 2,
      title: "나 프롬프트",
      categories: [
        { id: 12, name: "두 번째 항목", sort_order: 2, parent_id: 10, parent_name: "첫 번째 대분류", parent_sort_order: 1 },
        { id: 11, name: "첫 번째 항목", sort_order: 1, parent_id: 10, parent_name: "첫 번째 대분류", parent_sort_order: 1 },
        { id: 21, name: "첫 번째 소분류", sort_order: 1, parent_id: 20, parent_name: "두 번째 대분류", parent_sort_order: 2 },
      ],
    },
  ];

  const groups = groupPromptCategories(promptOptions);

  assert.deepEqual(groups.map((group) => group.id), [10, 20]);
  assert.deepEqual(groups[0].children.map((child) => child.id), [11, 12]);
  assert.deepEqual(groups[1].children.map((child) => child.id), [21, 22]);
});

test("소분류 개수와 길이에 따라 2열 배치 대상 여부를 판별한다", () => {
  assert.equal(isCompactCategoryGroup({ children: [{ name: "고지사항" }] }), true);
  assert.equal(isCompactCategoryGroup({ children: [{ name: "종신" }, { name: "연금" }] }), true);
  assert.equal(isCompactCategoryGroup({ children: [{ name: "태아/어린이 건강" }, { name: "태아 비교" }] }), true);
  assert.equal(
    isCompactCategoryGroup({
      children: [
        { name: "보장분석" },
        { name: "가격 및 담보 비교" },
        { name: "신규 가입 보험들 1장으로 요약" },
        { name: "리모델링 종합" },
      ],
    }),
    false,
  );
  assert.equal(
    isCompactCategoryGroup({
      children: [{ name: "긴 카테고리 이름이 열두 글자를 넘을 때" }],
    }),
    false,
  );
});
