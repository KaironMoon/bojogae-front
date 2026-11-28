import apiCaller from "./api-caller";
import {
  DEFAULT_ADMIN_MENU_ITEMS,
  mergeAdminMenuConfig,
  toAdminMenuPayload,
} from "./admin-menu-config";

const CACHE_KEY = "bojogae.adminMenuCache.v1";
const CHANGE_EVENT = "bojogae.adminMenuChanged";

let memoryCache = null;

function readStoredMenu() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? mergeAdminMenuConfig(parsed) : null;
  } catch {
    return null;
  }
}

export function getCachedAdminMenu() {
  if (memoryCache) return memoryCache;
  const stored = readStoredMenu();
  if (stored) {
    memoryCache = stored;
    return stored;
  }
  return DEFAULT_ADMIN_MENU_ITEMS;
}

export function publishAdminMenuCache(items) {
  const normalized = mergeAdminMenuConfig(items);
  memoryCache = normalized;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(CACHE_KEY, JSON.stringify(toAdminMenuPayload(normalized)));
    } catch {
      // Ignore storage quota errors
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }
  return normalized;
}

export async function getAdminMenu() {
  const { data } = await apiCaller.get("/api/v1/admin/admin-menu");
  const next = mergeAdminMenuConfig(data?.items);
  const currentSerialized = JSON.stringify(toAdminMenuPayload(getCachedAdminMenu()));
  const nextSerialized = JSON.stringify(toAdminMenuPayload(next));
  if (currentSerialized !== nextSerialized) {
    publishAdminMenuCache(next);
  } else {
    memoryCache = next;
  }
  return {
    ...data,
    items: next,
  };
}

export async function updateAdminMenu(items) {
  const { data } = await apiCaller.put("/api/v1/admin/admin-menu", {
    items: toAdminMenuPayload(items),
  });
  const normalized = publishAdminMenuCache(data?.items);
  return {
    ...data,
    items: normalized,
  };
}

export function subscribeAdminMenuChanges(callback) {
  if (typeof window === "undefined") return () => {};
  const handleLocalChange = () => callback(getCachedAdminMenu());
  const handleStorageChange = (event) => {
    if (event.key === CACHE_KEY) {
      memoryCache = null;
      callback(getCachedAdminMenu());
    }
  };
  window.addEventListener(CHANGE_EVENT, handleLocalChange);
  window.addEventListener("storage", handleStorageChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, handleLocalChange);
    window.removeEventListener("storage", handleStorageChange);
  };
}
