import test from "node:test";
import assert from "node:assert/strict";
import { groupPromptCategories } from "../src/services/prompt-category-utils.js";

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
