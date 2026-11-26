import test from "node:test";
import assert from "node:assert/strict";
import {
  getDismissedAnnouncementIds,
  getUnseenAnnouncements,
  hasUnseenAnnouncements,
  markAnnouncementsDismissed,
  PROPOSAL_FEATURE_ANNOUNCEMENTS,
} from "../src/services/proposal-feature-announcements.js";

function createMemoryStorage() {
  const map = new Map();
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, String(value)),
  };
}

test("unseen announcements show once per user and reopen only when new announcement ids are added", () => {
  const storage = createMemoryStorage();
  assert.equal(PROPOSAL_FEATURE_ANNOUNCEMENTS.length >= 1, true);
  assert.equal(PROPOSAL_FEATURE_ANNOUNCEMENTS[0].steps.length, 3);
  assert.deepEqual(
    PROPOSAL_FEATURE_ANNOUNCEMENTS[0].steps.map((step) => step.demoKey),
    ["customer-ai-fill", "customer-docs-box", "auto-contract-apply"],
  );
  assert.equal(hasUnseenAnnouncements(8, PROPOSAL_FEATURE_ANNOUNCEMENTS, storage), true);

  markAnnouncementsDismissed(8, undefined, storage);
  assert.deepEqual(
    getDismissedAnnouncementIds(8, storage),
    PROPOSAL_FEATURE_ANNOUNCEMENTS.map((item) => item.id),
  );
  assert.equal(hasUnseenAnnouncements(8, PROPOSAL_FEATURE_ANNOUNCEMENTS, storage), false);
  assert.equal(hasUnseenAnnouncements(9, PROPOSAL_FEATURE_ANNOUNCEMENTS, storage), true);

  const extended = [
    { id: "future-feature-2026-12", title: "새 기능" },
    ...PROPOSAL_FEATURE_ANNOUNCEMENTS,
  ];
  assert.equal(hasUnseenAnnouncements(8, extended, storage), true);
  assert.deepEqual(
    getUnseenAnnouncements(8, extended, storage).map((item) => item.id),
    ["future-feature-2026-12"],
  );
});
