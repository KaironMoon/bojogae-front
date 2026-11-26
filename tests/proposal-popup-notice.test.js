import test from "node:test";
import assert from "node:assert/strict";
import {
  filterVisibleTodayNotices,
  getHiddenTodayNoticeIds,
  hideNoticesForToday,
} from "../src/services/proposal-popup-notice-storage.js";

function createMemoryStorage() {
  const store = new Map();
  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
  };
}

test("hideNoticesForToday hides notices only for the matching day", () => {
  const storage = createMemoryStorage();
  const notices = [
    { id: 1, title: "업데이트 1" },
    { id: 2, title: "업데이트 2" },
  ];

  assert.equal(filterVisibleTodayNotices(8, notices, "2026-11-26", storage).length, 2);

  hideNoticesForToday(8, [1], "2026-11-26", storage);
  assert.deepEqual([...getHiddenTodayNoticeIds(8, "2026-11-26", storage)], ["1"]);
  assert.deepEqual(
    filterVisibleTodayNotices(8, notices, "2026-11-26", storage).map((n) => n.id),
    [2],
  );

  // Next day resets daily dismissal cleanly
  assert.equal(filterVisibleTodayNotices(8, notices, "2026-11-27", storage).length, 2);
});
