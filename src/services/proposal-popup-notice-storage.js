const hiddenTodayKey = (userId) => `bojogae:proposal-popup-hidden-today:v1:${userId}`;

function resolveStorage(storage) {
  if (storage) return storage;
  if (typeof window !== "undefined" && window.localStorage) return window.localStorage;
  return null;
}

/** Return the current YYYY-MM-DD date string in Asia/Seoul. */
export function seoulTodayString(now = new Date()) {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);
  } catch {
    return now.toISOString().slice(0, 10);
  }
}

/** Read notice IDs dismissed for `todayStr` for `userId`. */
export function getHiddenTodayNoticeIds(userId, todayStr = seoulTodayString(), storage) {
  if (!userId) return new Set();
  const store = resolveStorage(storage);
  if (!store) return new Set();
  try {
    const raw = store.getItem(hiddenTodayKey(userId));
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return new Set();
    return new Set(
      Object.entries(parsed)
        .filter(([, dateStr]) => dateStr === todayStr)
        .map(([noticeId]) => String(noticeId)),
    );
  } catch {
    return new Set();
  }
}

/** Filter active notices to those not dismissed for `todayStr`. */
export function filterVisibleTodayNotices(userId, notices = [], todayStr = seoulTodayString(), storage) {
  const hidden = getHiddenTodayNoticeIds(userId, todayStr, storage);
  return notices.filter((notice) => notice?.id != null && !hidden.has(String(notice.id)));
}

/** Persist today's dismissal map for the given notice IDs in localStorage. */
export function hideNoticesForToday(userId, ids = [], todayStr = seoulTodayString(), storage) {
  if (!userId) return {};
  const store = resolveStorage(storage);
  const next = {};
  if (store) {
    try {
      const raw = store.getItem(hiddenTodayKey(userId));
      const parsed = raw ? JSON.parse(raw) : {};
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        for (const [k, v] of Object.entries(parsed)) {
          if (v === todayStr) next[String(k)] = v;
        }
      }
    } catch {
      // Ignore corrupt storage entries and overwrite cleanly.
    }
  }
  for (const id of ids) {
    if (id != null) next[String(id)] = todayStr;
  }
  if (store) {
    try {
      store.setItem(hiddenTodayKey(userId), JSON.stringify(next));
    } catch {
      // Closing without persistent storage still succeeds gracefully.
    }
  }
  return next;
}
