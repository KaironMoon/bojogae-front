import apiCaller from "./api-caller";
import {
  DEFAULT_USER_MENU_ITEMS,
  mergeUserMenuConfig,
  toUserMenuPayload,
} from "./user-menu-config";

const CACHE_KEY = "bojogae.userMenuCache.v1";
const CHANGE_EVENT = "bojogae.userMenuChanged";

let memoryCache = null;

function readStoredMenu() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? mergeUserMenuConfig(parsed) : null;
  } catch {
    return null;
  }
}

export function getCachedUserMenu() {
  if (memoryCache) return memoryCache;
  const stored = readStoredMenu();
  if (stored) {
    memoryCache = stored;
    return stored;
  }
  return DEFAULT_USER_MENU_ITEMS;
}

export function publishUserMenuCache(items) {
  const normalized = mergeUserMenuConfig(items);
  memoryCache = normalized;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(CACHE_KEY, JSON.stringify(toUserMenuPayload(normalized)));
    } catch {
      // Ignore storage quota or private browsing errors.
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }
  return normalized;
}

export async function getUserMenu() {
  const { data } = await apiCaller.get("/api/v1/user-menu");
  const next = mergeUserMenuConfig(data?.items);
  const currentSerialized = JSON.stringify(toUserMenuPayload(getCachedUserMenu()));
  const nextSerialized = JSON.stringify(toUserMenuPayload(next));
  if (currentSerialized !== nextSerialized) {
    return publishUserMenuCache(next);
  }
  memoryCache = next;
  return next;
}

export async function getAdminUserMenu() {
  const { data } = await apiCaller.get("/api/v1/admin/user-menu");
  return {
    ...data,
    items: mergeUserMenuConfig(data?.items),
  };
}

export async function updateAdminUserMenu(items) {
  const { data } = await apiCaller.put("/api/v1/admin/user-menu", {
    items: toUserMenuPayload(items),
  });
  const normalized = publishUserMenuCache(data?.items);
  return {
    ...data,
    items: normalized,
  };
}

export function subscribeUserMenuChanges(callback) {
  if (typeof window === "undefined") return () => {};
  const handleLocalChange = () => callback(getCachedUserMenu());
  const handleStorageChange = (event) => {
    if (event.key === CACHE_KEY) {
      memoryCache = null;
      callback(getCachedUserMenu());
    }
  };
  window.addEventListener(CHANGE_EVENT, handleLocalChange);
  window.addEventListener("storage", handleStorageChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, handleLocalChange);
    window.removeEventListener("storage", handleStorageChange);
  };
}
