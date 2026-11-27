const STORAGE_KEY_PREFIX = "bojogae_proposals_video_column_hidden:";

function storageKey(userId) {
  return `${STORAGE_KEY_PREFIX}${userId ?? "anon"}`;
}

export function isVideoColumnHidden(userId) {
  try {
    return localStorage.getItem(storageKey(userId)) === "1";
  } catch {
    return false;
  }
}

export function persistVideoColumnHidden(userId, hidden) {
  try {
    if (hidden) {
      localStorage.setItem(storageKey(userId), "1");
    } else {
      localStorage.removeItem(storageKey(userId));
    }
  } catch {
    // Ignore storage access errors cleanly.
  }
}
