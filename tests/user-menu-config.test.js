import test from "node:test";
import assert from "node:assert/strict";

import {
  DEFAULT_USER_MENU_ITEMS,
  isMenuEligibleForUser,
  mergeUserMenuConfig,
  moveItemByDrop,
  moveItemByOffset,
} from "../src/services/user-menu-config.js";

test("mergeUserMenuConfig preserves saved order/labels/visibility and appends missing items", () => {
  const merged = mergeUserMenuConfig([
    { key: "plans", label: "요금표", visible: false },
    { key: "unknown_menu", label: "무시됨", visible: true },
    {
      key: "claims",
      label: "청구하기",
      visible: true,
      children: [{ key: "claims_history", label: "접수내역", visible: false }],
    },
  ]);

  assert.equal(merged.length, DEFAULT_USER_MENU_ITEMS.length);
  assert.equal(merged[0].key, "plans");
  assert.equal(merged[0].label, "요금표");
  assert.equal(merged[0].visible, false);

  assert.equal(merged[1].key, "claims");
  assert.equal(merged[1].label, "청구하기");
  assert.deepEqual(
    merged[1].children.map((c) => [c.key, c.label, c.visible]),
    [
      ["claims_history", "접수내역", false],
      ["claims_new", "청구", true],
    ],
  );

  assert.equal(merged[2].key, "proposals");
});

test("moveItemByDrop reorders items accurately for before and after positions", () => {
  const list = [{ key: "a" }, { key: "b" }, { key: "c" }, { key: "d" }];

  assert.deepEqual(
    moveItemByDrop(list, "d", "b", "before").map((x) => x.key),
    ["a", "d", "b", "c"],
  );
  assert.deepEqual(
    moveItemByDrop(list, "a", "c", "after").map((x) => x.key),
    ["b", "c", "a", "d"],
  );
  assert.deepEqual(
    moveItemByOffset(list, 1, -1).map((x) => x.key),
    ["b", "a", "c", "d"],
  );
});

test("isMenuEligibleForUser respects visibility, group children, and audience rules", () => {
  const normalUser = { id: 1, group_id: null, group_role: null };
  const memberUser = { id: 2, group_id: 10, group_role: "MEMBER" };
  const leaderUser = { id: 3, group_id: 10, group_role: "LEADER" };

  const leaderItem = DEFAULT_USER_MENU_ITEMS.find((i) => i.key === "group_manage");
  const memberItem = DEFAULT_USER_MENU_ITEMS.find((i) => i.key === "group_password");
  const claimsGroup = DEFAULT_USER_MENU_ITEMS.find((i) => i.key === "claims");

  assert.equal(isMenuEligibleForUser(leaderItem, normalUser), false);
  assert.equal(isMenuEligibleForUser(leaderItem, memberUser), false);
  assert.equal(isMenuEligibleForUser(leaderItem, leaderUser), true);

  assert.equal(isMenuEligibleForUser(memberItem, normalUser), false);
  assert.equal(isMenuEligibleForUser(memberItem, memberUser), true);
  assert.equal(isMenuEligibleForUser(memberItem, leaderUser), true);

  const hiddenChildrenGroup = {
    ...claimsGroup,
    children: claimsGroup.children.map((c) => ({ ...c, visible: false })),
  };
  assert.equal(isMenuEligibleForUser(hiddenChildrenGroup, normalUser), false);
});
