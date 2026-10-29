"use client";

export type EstimateItemQuantityEntry = {
  itemId: number;
  quantity: number;
};

const STORAGE_KEY = "estimate-item-quantities";

type EstimateItemQuantitiesStore = Record<string, EstimateItemQuantityEntry[]>;

const normalizeQuantity = (quantity: number) =>
  Number.isFinite(quantity) && quantity > 0 ? quantity : 1;

const canUseStorage = () => typeof window !== "undefined";

const readStore = (): EstimateItemQuantitiesStore => {
  if (!canUseStorage()) return {};

  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY);
    if (!rawValue) return {};

    const parsed = JSON.parse(rawValue) as EstimateItemQuantitiesStore;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

const writeStore = (store: EstimateItemQuantitiesStore) => {
  if (!canUseStorage()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
};

export const getEstimateItemQuantities = (
  estimateId: number,
): EstimateItemQuantityEntry[] => {
  const store = readStore();
  return Array.isArray(store[String(estimateId)]) ? store[String(estimateId)] : [];
};

export const getEstimateItemQuantityMap = (estimateId: number) =>
  new Map(
    getEstimateItemQuantities(estimateId).map((entry) => [
      entry.itemId,
      normalizeQuantity(entry.quantity),
    ]),
  );

export const saveEstimateItemQuantities = (
  estimateId: number,
  items: EstimateItemQuantityEntry[],
) => {
  const store = readStore();
  store[String(estimateId)] = items.map((item) => ({
    itemId: item.itemId,
    quantity: normalizeQuantity(item.quantity),
  }));
  writeStore(store);
};

export const syncEstimateItemQuantities = (
  estimateId: number,
  itemIds: number[],
  fallbackQuantity = 1,
) => {
  const currentMap = getEstimateItemQuantityMap(estimateId);
  const nextItems = itemIds.map((itemId) => ({
    itemId,
    quantity: currentMap.get(itemId) ?? normalizeQuantity(fallbackQuantity),
  }));

  saveEstimateItemQuantities(estimateId, nextItems);
  return nextItems;
};
