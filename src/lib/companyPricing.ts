import instance from "@/lib/axios";

// A company raises prices per item inside an estimate. The system price of an
// item is its price after added value (CostAfterRate); items the company did
// not raise keep the system price.

export type CompanyEstimatePricing = {
  estimateId: number;
  estimateName: string;
  stageName: string | null;
  completeName: string | null;
  projectName: string | null;
  itemsCount: number;
  raisedItemsCount: number;
  systemTotal: number;
  companyTotal: number;
};

export type CompanyEstimateItemPricing = {
  itemId: number;
  itemName: string;
  categoryName: string | null;
  subCategoryName: string | null;
  unitName: string | null;
  quantity: number;
  systemPrice: number;
  companyPrice: number | null;
  finalPrice: number;
  systemTotal: number;
  finalTotal: number;
};

export type CompanyEstimatePricingDetails = CompanyEstimatePricing & {
  items: CompanyEstimateItemPricing[];
};

export type CompanyRaisedItem = CompanyEstimateItemPricing & {
  estimateId: number;
  estimateName: string;
  updatedAt: string;
};

export type CompanyRaisedItems = {
  items: CompanyRaisedItem[];
  systemTotal: number;
  companyTotal: number;
};

export const getCompanyEstimatesPricing = async (companyId: number) =>
  (await instance.get<CompanyEstimatePricing[]>(`Company/${companyId}/estimates-pricing`)).data;

export const getCompanyEstimatePricing = async (companyId: number, estimateId: number) =>
  (
    await instance.get<CompanyEstimatePricingDetails>(
      `Company/${companyId}/estimates/${estimateId}/pricing`,
    )
  ).data;

export const setCompanyItemPrice = async (estimateId: number, itemId: number, price: number) =>
  (
    await instance.put<CompanyEstimatePricingDetails>(
      `Company/estimates/${estimateId}/items/${itemId}/price`,
      { price },
    )
  ).data;

/** Puts the item back on the system price. */
export const resetCompanyItemPrice = async (estimateId: number, itemId: number) =>
  (
    await instance.delete<CompanyEstimatePricingDetails>(
      `Company/estimates/${estimateId}/items/${itemId}/price`,
    )
  ).data;

export const getCompanyRaisedItems = async (companyId: number) =>
  (await instance.get<CompanyRaisedItems>(`Company/${companyId}/raised-items`)).data;

export const formatMoney = (value: number | null | undefined) =>
  value == null || !Number.isFinite(Number(value))
    ? "-"
    : `${Number(value).toLocaleString("en-US", { maximumFractionDigits: 2 })} جنيه`;

/** "+12.5%" style change between the system and the company price. */
export const formatChange = (before: number, after: number) => {
  if (!before) return "-";
  const percent = ((after - before) / before) * 100;
  const sign = percent > 0 ? "+" : "";
  return `${sign}${percent.toLocaleString("en-US", { maximumFractionDigits: 2 })}%`;
};
