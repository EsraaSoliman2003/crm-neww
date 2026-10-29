export const formatProjectCost = (cost: number) =>
  new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(cost);
