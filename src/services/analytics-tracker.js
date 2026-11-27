const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

const VISITOR_KEY = "bojogae.analytics.visitorId";
const SESSION_ID_KEY = "bojogae.analytics.sessionId";
const SESSION_TS_KEY = "bojogae.analytics.sessionLastAt";
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

function generateUuid() {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  if (typeof globalThis.crypto?.getRandomValues === "function") {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function getVisitorId() {
  try {
    let vid = window.localStorage.getItem(VISITOR_KEY);
    if (!vid) {
      vid = generateUuid();
      window.localStorage.setItem(VISITOR_KEY, vid);
    }
    return vid;
  } catch {
    return generateUuid();
  }
}

function getSessionId() {
  const now = Date.now();
  try {
    const existing = window.sessionStorage.getItem(SESSION_ID_KEY);
    const lastAt = Number(window.sessionStorage.getItem(SESSION_TS_KEY) || 0);
    if (existing && lastAt && now - lastAt <= SESSION_TIMEOUT_MS) {
      window.sessionStorage.setItem(SESSION_TS_KEY, String(now));
      return existing;
    }
    const nextId = generateUuid();
    window.sessionStorage.setItem(SESSION_ID_KEY, nextId);
    window.sessionStorage.setItem(SESSION_TS_KEY, String(now));
    return nextId;
  } catch {
    return generateUuid();
  }
}

function readUtmParams() {
  try {
    const params = new URLSearchParams(window.location.search || "");
    return {
      utm_source: params.get("utm_source") || null,
      utm_medium: params.get("utm_medium") || null,
      utm_campaign: params.get("utm_campaign") || null,
    };
  } catch {
    return { utm_source: null, utm_medium: null, utm_campaign: null };
  }
}

function measureScrollPct() {
  try {
    const doc = document.documentElement;
    const body = document.body;
    const scrollTop = window.scrollY || doc.scrollTop || body?.scrollTop || 0;
    const scrollHeight = Math.max(doc.scrollHeight || 0, body?.scrollHeight || 0);
    const clientHeight = doc.clientHeight || window.innerHeight || 0;
    if (scrollHeight <= clientHeight) return 100;
    return Math.min(100, Math.max(0, Math.round(((scrollTop + clientHeight) / scrollHeight) * 100)));
  } catch {
    return 0;
  }
}

function sendCollect(payload) {
  try {
    const url = `${API_BASE_URL}/api/v1/analytics/collect`;
    fetch(url, {
      method: "POST",
      credentials: "include",
      keepalive: true,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => {});
  } catch {
    // Ignore telemetry network errors completely
  }
}

export function createPageSessionTracker() {
  const visitorId = getVisitorId();
  let current = null;
  let visibleSince = null;
  let accumulatedVisibleMs = 0;
  let maxScrollPct = 0;

  function flushVisibleElapsed() {
    if (visibleSince !== null) {
      accumulatedVisibleMs += Math.max(0, Date.now() - visibleSince);
      visibleSince = document.visibilityState === "visible" ? Date.now() : null;
    }
    const deltaSeconds = Math.min(120, Math.floor(accumulatedVisibleMs / 1000));
    accumulatedVisibleMs -= deltaSeconds * 1000;
    return deltaSeconds;
  }

  function updateScroll() {
    if (!current) return;
    const pct = measureScrollPct();
    if (pct > maxScrollPct) maxScrollPct = pct;
  }

  function startPageView(path, pageTitle, referrerPath) {
    if (!path || path.startsWith("/admin")) {
      current = null;
      visibleSince = null;
      accumulatedVisibleMs = 0;
      return;
    }
    if (current) {
      leavePageView();
    }
    const sessionId = getSessionId();
    const pageViewId = generateUuid();
    const utm = readUtmParams();
    maxScrollPct = measureScrollPct();
    accumulatedVisibleMs = 0;
    visibleSince = document.visibilityState === "visible" ? Date.now() : null;

    current = {
      session_id: sessionId,
      visitor_id: visitorId,
      page_view_id: pageViewId,
      path,
      page_title: (pageTitle || "").slice(0, 200) || null,
      referrer_path: referrerPath || null,
    };

    sendCollect({
      event_type: "page_view",
      session_id: sessionId,
      visitor_id: visitorId,
      page_view_id: pageViewId,
      path,
      page_title: current.page_title,
      referrer: document.referrer || null,
      referrer_path: referrerPath || null,
      ...utm,
      delta_seconds: 0,
      max_scroll_pct: maxScrollPct,
      screen_resolution: typeof window.screen !== "undefined" ? `${window.screen.width}x${window.screen.height}` : null,
      timezone: Intl.DateTimeFormat?.().resolvedOptions?.().timeZone || null,
    });
  }

  function heartbeat() {
    if (!current) return;
    updateScroll();
    const deltaSeconds = flushVisibleElapsed();
    if (deltaSeconds <= 0 && maxScrollPct === 0) return;
    try {
      window.sessionStorage.setItem(SESSION_TS_KEY, String(Date.now()));
    } catch {
      // ignore
    }
    sendCollect({
      event_type: "heartbeat",
      session_id: current.session_id,
      visitor_id: current.visitor_id,
      page_view_id: current.page_view_id,
      path: current.path,
      page_title: current.page_title,
      delta_seconds: deltaSeconds,
      max_scroll_pct: maxScrollPct,
    });
  }

  function leavePageView() {
    if (!current) return;
    updateScroll();
    const deltaSeconds = flushVisibleElapsed();
    const snap = current;
    current = null;
    visibleSince = null;
    sendCollect({
      event_type: "page_leave",
      session_id: snap.session_id,
      visitor_id: snap.visitor_id,
      page_view_id: snap.page_view_id,
      path: snap.path,
      page_title: snap.page_title,
      delta_seconds: deltaSeconds,
      max_scroll_pct: maxScrollPct,
    });
  }

  function handleVisibilityChange() {
    if (!current) return;
    if (document.visibilityState === "hidden") {
      updateScroll();
      const deltaSeconds = flushVisibleElapsed();
      visibleSince = null;
      if (deltaSeconds > 0 || maxScrollPct > 0) {
        sendCollect({
          event_type: "heartbeat",
          session_id: current.session_id,
          visitor_id: current.visitor_id,
          page_view_id: current.page_view_id,
          path: current.path,
          page_title: current.page_title,
          delta_seconds: deltaSeconds,
          max_scroll_pct: maxScrollPct,
        });
      }
    } else if (visibleSince === null) {
      visibleSince = Date.now();
    }
  }

  return {
    startPageView,
    heartbeat,
    leavePageView,
    handleVisibilityChange,
    updateScroll,
  };
}
