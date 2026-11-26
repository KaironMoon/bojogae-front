import test from "node:test";
import assert from "node:assert/strict";

import {
  BADGE_PRESETS,
  DEFAULT_USER_MENU_ITEMS,
  hasMenuChanges,
  isChildEligibleForUser,
  isMenuEligibleForUser,
  mergeUserMenuConfig,
  moveItemByDrop,
  moveItemByOffset,
  moveMenuNode,
  normalizeMenuBadge,
  promoteChildToTop,
  toUserMenuPayload,
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

test("normalizeMenuBadge and menu config preserve and detect top-level and child badge updates", () => {
  assert.equal(normalizeMenuBadge(null), null);
  assert.equal(normalizeMenuBadge({ text: "   ", tone: "green" }), null);
  assert.deepEqual(normalizeMenuBadge({ text: " BETA_1234567 ", tone: "unknown" }), {
    text: "BETA_12345",
    tone: "green",
  });
  assert.ok(BADGE_PRESETS.some((p) => p.text === "BETA" && p.tone === "purple"));

  const merged = mergeUserMenuConfig([
    { key: "insurers", label: "보험사 정보·링크", visible: true, badge: { text: "NEW", tone: "green" } },
    {
      key: "claims",
      label: "보험금 청구",
      visible: true,
      badge: { text: "BETA", tone: "purple" },
      children: [{ key: "claims_new", label: "청구", visible: true, badge: { text: "HOT", tone: "rose" } }],
    },
    { key: "home", label: "Home", visible: true, badge: { text: "  ", tone: "blue" } },
  ]);

  assert.deepEqual(merged.find((i) => i.key === "insurers").badge, { text: "NEW", tone: "green" });
  const claims = merged.find((i) => i.key === "claims");
  assert.deepEqual(claims.badge, { text: "BETA", tone: "purple" });
  assert.deepEqual(claims.children.find((c) => c.key === "claims_new").badge, { text: "HOT", tone: "rose" });
  assert.equal(merged.find((i) => i.key === "home").badge, null);

  assert.equal(hasMenuChanges(merged, DEFAULT_USER_MENU_ITEMS), true);
  assert.equal(hasMenuChanges(merged, mergeUserMenuConfig(toUserMenuPayload(merged))), false);
});

test("mergeUserMenuConfig, moveMenuNode, promoteChildToTop, and isChildEligibleForUser handle 1st-to-2nd nesting", () => {
  let tree = mergeUserMenuConfig([]);

  // 1차 leaf (crm_tasks) -> group-inside (customers)
  tree = moveMenuNode(tree, { scope: "top", key: "crm_tasks" }, { kind: "group-inside", groupKey: "customers" });
  assert.equal(tree.some((i) => i.key === "crm_tasks"), false);
  const customers = tree.find((i) => i.key === "customers");
  assert.deepEqual(customers.children.map((c) => c.key), ["crm_customers", "crm_contracts", "crm_tasks"]);

  // 1차 leaf (insurers) -> before specific child inside claims
  tree = moveMenuNode(
    tree,
    { scope: "top", key: "insurers" },
    { kind: "child", groupKey: "claims", key: "claims_history", position: "before" },
  );
  assert.equal(tree.some((i) => i.key === "insurers"), false);
  const claims = tree.find((i) => i.key === "claims");
  assert.deepEqual(claims.children.map((c) => c.key), ["claims_new", "insurers", "claims_history"]);

  // 1차 group (boards) cannot nest into another group
  const unchanged = moveMenuNode(tree, { scope: "top", key: "boards" }, { kind: "group-inside", groupKey: "customers" });
  assert.equal(unchanged.some((i) => i.key === "boards"), true);

  // 2차 child -> another group
  tree = moveMenuNode(
    tree,
    { scope: "child", groupKey: "claims", key: "claims_new" },
    { kind: "group-inside", groupKey: "customers" },
  );
  assert.deepEqual(tree.find((i) => i.key === "claims").children.map((c) => c.key), ["insurers", "claims_history"]);
  assert.deepEqual(tree.find((i) => i.key === "customers").children.map((c) => c.key), [
    "crm_customers",
    "crm_contracts",
    "crm_tasks",
    "claims_new",
  ]);

  // Promote 2차 child back out to 1차
  tree = promoteChildToTop(tree, "customers", "crm_tasks");
  const idxCustomers = tree.findIndex((i) => i.key === "customers");
  assert.equal(tree[idxCustomers + 1].key, "crm_tasks");
  assert.equal(tree[idxCustomers + 1].kind, "item");
  assert.equal(tree[idxCustomers + 1].path, "/crm/tasks");

  // Save payload -> merge round-trip preserves nested insurers & claims_new without duplication
  const rehydrated = mergeUserMenuConfig(toUserMenuPayload(tree));
  assert.equal(rehydrated.filter((i) => i.key === "insurers").length, 0);
  assert.deepEqual(rehydrated.find((i) => i.key === "claims").children.map((c) => c.key), ["insurers", "claims_history"]);
  assert.deepEqual(rehydrated.find((i) => i.key === "customers").children.map((c) => c.key), [
    "crm_customers",
    "crm_contracts",
    "claims_new",
  ]);

  // Audience check inside nested children (group_manage inside group)
  let leaderNested = moveMenuNode(
    mergeUserMenuConfig([]),
    { scope: "top", key: "group_manage" },
    { kind: "group-inside", groupKey: "profile" },
  );
  const profile = leaderNested.find((i) => i.key === "profile");
  const nestedLeaderChild = profile.children.find((c) => c.key === "group_manage");
  assert.equal(isChildEligibleForUser(nestedLeaderChild, { group_role: null }), false);
  assert.equal(isChildEligibleForUser(nestedLeaderChild, { group_role: "LEADER" }), true);
});

test("any childless 1st-level item can host 2nd-level children while depth stays capped at 2", () => {
  let tree = mergeUserMenuConfig([]);

  // Nest 1차 leaf (plans) under childless 1차 leaf (insurers)
  tree = moveMenuNode(tree, { scope: "top", key: "plans" }, { kind: "group-inside", groupKey: "insurers" });
  assert.equal(tree.some((i) => i.key === "plans"), false);
  const insurers = tree.find((i) => i.key === "insurers");
  assert.deepEqual(insurers.children.map((c) => c.key), ["plans"]);

  // Now insurers has children, so it cannot be nested under another 1차 menu (depth <= 2)
  const blocked = moveMenuNode(tree, { scope: "top", key: "insurers" }, { kind: "group-inside", groupKey: "home" });
  assert.equal(blocked.some((i) => i.key === "insurers"), true);
  assert.deepEqual(blocked.find((i) => i.key === "home").children, []);

  // Reordering insurers at top level preserves its nested children
  const insurersIdx = tree.findIndex((i) => i.key === "insurers");
  tree = moveMenuNode(tree, { scope: "top", key: "insurers" }, { kind: "top", key: tree[insurersIdx - 1].key, position: "before" });
  assert.deepEqual(tree.find((i) => i.key === "insurers").children.map((c) => c.key), ["plans"]);

  // Save payload -> merge round-trip preserves children on non-group 1차 items
  const rehydrated = mergeUserMenuConfig(toUserMenuPayload(tree));
  assert.equal(rehydrated.some((i) => i.key === "plans"), false);
  assert.deepEqual(rehydrated.find((i) => i.key === "insurers").children.map((c) => c.key), ["plans"]);

  // Promote plans back out; insurers becomes childless and nestable again
  tree = promoteChildToTop(rehydrated, "insurers", "plans");
  assert.equal(tree.some((i) => i.key === "plans"), true);
  assert.deepEqual(tree.find((i) => i.key === "insurers").children, []);
  const nowNestable = moveMenuNode(tree, { scope: "top", key: "insurers" }, { kind: "group-inside", groupKey: "home" });
  assert.equal(nowNestable.some((i) => i.key === "insurers"), false);
  assert.deepEqual(nowNestable.find((i) => i.key === "home").children.map((c) => c.key), ["insurers"]);
});
