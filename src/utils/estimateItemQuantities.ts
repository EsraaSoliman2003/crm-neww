"use client";

import axios from "@/lib/axios";

export type EstimateItemQuantityEntry = {
  itemId: number;
  quantity: number;
};

// Item quantities live in the database (estimate.itemQuantities). Older
// versions kept them only in this browser, under this localStorage key; those
// values are moved to the server once and then removed (see below).
const LEGACY_STORAGE_KEY = "estimate-item-quantities";

type LegacyStore = Record<string, EstimateItemQuantityEntry[]>;

const normalizeQuantity = (quantity: number) =>
  Number.isFinite(quantity) && quantity > 0 ? quantity : 1;

/* ===========================
   Server
=========================== */

// One entry per item of the estimate; items without a stored quantity get 1.
export const quantitiesFromEstimate = (estimate: {
  items?: { id: number }[] | null;
  itemQuantities?: EstimateItemQuantityEntry[] | null;
}): EstimateItemQuantityEntry[] => {
  const stored = new Map(
    (estimate.itemQuantities ?? []).map((entry) => [
      entry.itemId,
      normalizeQuantity(Number(entry.quantity)),
    ]),
  );
  return (estimate.items ?? []).map((item) => ({
    itemId: item.id,
    quantity: stored.get(item.id) ?? 1,
  }));
};

// Updates quantities of items already in the estimate; returns all quantities.
export const saveEstimateItemQuantities = async (
  estimateId: number,
  items: EstimateItemQuantityEntry[],
) => {
  const { data } = await axios.put<EstimateItemQuantityEntry[]>(
    `Estimate/${estimateId}/item-quantities`,
    items.map((item) => ({
      itemId: item.itemId,
      quantity: normalizeQuantity(item.quantity),
    })),
  );
  return data;
};

/* ===========================
   One-time move from localStorage
=========================== */

const readLegacyStore = (): LegacyStore => {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as LegacyStore) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

// Server quantities, with this browser's old local quantity used where the
// server still has the default (1). A quantity already set on the server
// (by anyone) always wins.
export const withLegacyQuantities = (
  estimateId: number,
  serverEntries: EstimateItemQuantityEntry[],
): EstimateItemQuantityEntry[] => {
  const local = readLegacyStore()[String(estimateId)];
  if (!Array.isArray(local) || local.length === 0) return serverEntries;

  const localMap = new Map(
    local.map((entry) => [entry.itemId, normalizeQuantity(Number(entry.quantity))]),
  );
  return serverEntries.map((entry) =>
    entry.quantity === 1 && localMap.has(entry.itemId)
      ? { itemId: entry.itemId, quantity: localMap.get(entry.itemId)! }
      : entry,
  );
};

export const hasQuantityChanges = (
  a: EstimateItemQuantityEntry[],
  b: EstimateItemQuantityEntry[],
) => {
  const bMap = new Map(b.map((entry) => [entry.itemId, entry.quantity]));
  return a.some((entry) => bMap.get(entry.itemId) !== entry.quantity);
};

export const clearLegacyQuantities = (estimateId: number) => {
  if (typeof window === "undefined") return;
  try {
    const store = readLegacyStore();
    if (!(String(estimateId) in store)) return;
    delete store[String(estimateId)];
    if (Object.keys(store).length === 0) {
      window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    } else {
      window.localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(store));
    }
  } catch {
    // Storage unavailable: nothing to clean up.
  }
};
