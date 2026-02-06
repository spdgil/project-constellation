/**
 * Local-only deal overrides and constraint event log — PRD §6.6, §7.1
 * Persists to localStorage; no backend. For tests, inject a custom storage.
 */

import type { Deal, ConstraintEvent } from "./types";

const STORAGE_KEY_DEALS = "project-constellation:deals";
const STORAGE_KEY_EVENTS = "project-constellation:constraint-events";

function getStorage(): Storage {
  if (typeof window === "undefined") {
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      key: () => null,
      length: 0,
    };
  }
  return window.localStorage;
}

/** Get deal with local overrides merged (local wins). */
export function getDealWithLocalOverrides(
  dealId: string,
  baseDeal: Deal,
  storage: Storage = getStorage()
): Deal {
  const raw = storage.getItem(STORAGE_KEY_DEALS);
  if (!raw) return baseDeal;
  try {
    const map = JSON.parse(raw) as Record<string, Deal>;
    const local = map[dealId];
    return local ?? baseDeal;
  } catch {
    return baseDeal;
  }
}

/** Get all deals with local overrides merged (for lists/aggregations). */
export function getDealsWithLocalOverrides(
  baseDeals: Deal[],
  storage: Storage = getStorage()
): Deal[] {
  return baseDeals.map((d) => getDealWithLocalOverrides(d.id, d, storage));
}

/** Check if deal has local overrides. */
export function hasLocalDealOverrides(
  dealId: string,
  storage: Storage = getStorage()
): boolean {
  const raw = storage.getItem(STORAGE_KEY_DEALS);
  if (!raw) return false;
  try {
    const map = JSON.parse(raw) as Record<string, Deal>;
    return dealId in map;
  } catch {
    return false;
  }
}

/** Save deal to localStorage (full deal; overwrites for this id). */
export function saveDealLocally(deal: Deal, storage: Storage = getStorage()): void {
  const raw = storage.getItem(STORAGE_KEY_DEALS);
  const map = raw ? (JSON.parse(raw) as Record<string, Deal>) : {};
  map[deal.id] = deal;
  try {
    storage.setItem(STORAGE_KEY_DEALS, JSON.stringify(map));
  } catch (error) {
    if (
      error instanceof DOMException &&
      (error.name === "QuotaExceededError" ||
        error.code === DOMException.QUOTA_EXCEEDED_ERR)
    ) {
      console.warn("localStorage quota exceeded — deal override not saved.");
      return;
    }
    throw error;
  }
}

/** Load constraint events from localStorage. */
export function getConstraintEvents(
  storage: Storage = getStorage()
): ConstraintEvent[] {
  const raw = storage.getItem(STORAGE_KEY_EVENTS);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as ConstraintEvent[];
  } catch {
    return [];
  }
}

/** Append a constraint event and persist. */
export function appendConstraintEvent(
  event: Omit<ConstraintEvent, "id">,
  storage: Storage = getStorage()
): ConstraintEvent {
  const id =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `evt-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const full: ConstraintEvent = { ...event, id };
  const events = getConstraintEvents(storage);
  events.push(full);
  try {
    storage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(events));
  } catch (error) {
    if (
      error instanceof DOMException &&
      (error.name === "QuotaExceededError" ||
        error.code === DOMException.QUOTA_EXCEEDED_ERR)
    ) {
      console.warn("localStorage quota exceeded — constraint event not saved.");
      return full;
    }
    throw error;
  }
  return full;
}
