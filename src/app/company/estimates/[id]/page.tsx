"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowRight, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import Loader from "@/components/loader/Loader";
import EmptyState from "@/components/emptyState/EmptyState";
import Table from "@/components/table/Table";
import { card2BG } from "@/assets";
import { useAuth } from "@/context/AuthContext";
import {
  CompanyEstimatePricingDetails,
  formatChange,
  formatMoney,
  getCompanyEstimatePricing,
  resetCompanyItemPrice,
  setCompanyItemPrice,
} from "@/lib/companyPricing";

export default function CompanyEstimateDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const estimateId = Number(id);
  const { user } = useAuth();

  const [details, setDetails] = useState<CompanyEstimatePricingDetails>();
  const [loading, setLoading] = useState(false);
  // price typed in each row, keyed by item id
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [savingItemId, setSavingItemId] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!user?.id || !estimateId) return;
    try {
      setLoading(true);
      setDetails(await getCompanyEstimatePricing(Number(user.id), estimateId));
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }, [user, estimateId]);

  useEffect(() => {
    void load();
  }, [load]);

  const clearDraft = (itemId: number) =>
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });

  const draftOf = (itemId: number, companyPrice: number | null) =>
    drafts[itemId] ?? (companyPrice != null ? String(companyPrice) : "");

  const savePrice = async (itemId: number, companyPrice: number | null) => {
    const price = Number(draftOf(itemId, companyPrice));
    if (!Number.isFinite(price) || price <= 0) {
      toast.error("السعر يجب أن يكون أكبر من صفر");
      return;
    }
    try {
      setSavingItemId(itemId);
      setDetails(await setCompanyItemPrice(estimateId, itemId, price));
      clearDraft(itemId);
      toast.success("تم حفظ سعر البند");
    } catch (error) {
      console.log(error);
    } finally {
      setSavingItemId(null);
    }
  };

  const resetPrice = async (itemId: number) => {
    try {
      setSavingItemId(itemId);
      setDetails(await resetCompanyItemPrice(estimateId, itemId));
      clearDraft(itemId);
      toast.success("تم إرجاع البند لسعر المنظومة");
    } catch (error) {
      console.log(error);
    } finally {
      setSavingItemId(null);
    }
  };

  if (loading && !details) return <Loader />;

  const difference = details ? details.companyTotal - details.systemTotal : 0;
  // nothing raised yet: "after raise" values stay empty instead of repeating the system price
  const hasRaise = (details?.raisedItemsCount ?? 0) > 0;

  return (
    // no min-h-screen / bottom padding: the table fills the rest of the screen and scrolls itself
    <div className="space-y-6 px-6 pt-6 md:px-8 md:pt-8">
      {/* Header */}
      <div className="sticky top-[68px] z-30 -mx-6 bg-[#f7f7f7] px-6 pb-4 pt-1 md:-mx-8 md:top-[84px] md:px-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="text-right">
          <h1 className="text-xl md:text-2xl font-bold">
            {details?.estimateName ?? "تفاصيل المقايسة"}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {[details?.projectName, details?.stageName, details?.completeName]
              .filter(Boolean)
              .join(" • ")}
          </p>
        </div>
        <Link
          href="/company/estimates"
          className="flex items-center gap-1 border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          <ArrowRight size={16} />
          رجوع للمقايسات
        </Link>
      </div>
      </div>

      {details && (
        <>
          {/* Totals */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">إجمالي المنظومة (قبل الرفع)</p>
              <p className="mt-2 text-2xl font-bold text-gray-800">
                {formatMoney(details.systemTotal)}
              </p>
            </div>
            <div className="border-2 border-[#bf0200] bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-[#bf0200]">
                إجمالي المقايسة بعد الرفع
              </p>
              {hasRaise ? (
                <p className="mt-2 text-3xl font-extrabold text-gray-900">
                  {formatMoney(details.companyTotal)}
                </p>
              ) : (
                <p className="mt-3 text-sm text-gray-400">لم يتم رفع أي سعر بعد</p>
              )}
            </div>
            <div className="border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">الفرق</p>
              {hasRaise ? (
                <p
                  className={`mt-2 text-2xl font-bold ${
                    difference > 0
                      ? "text-green-700"
                      : difference < 0
                        ? "text-red-600"
                        : "text-gray-800"
                  }`}
                >
                  {formatMoney(difference)}{" "}
                  <span className="text-base font-medium">
                    ({formatChange(details.systemTotal, details.companyTotal)})
                  </span>
                </p>
              ) : (
                <p className="mt-3 text-sm text-gray-400">-</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                {details.raisedItemsCount} من {details.itemsCount} بند مرفوع سعره
              </p>
            </div>
          </div>

          {details.items.length > 0 ? (
            <Table
              data={details.items}
              getRowKeyAction={(row) => `${row.itemId}`}
              // scrolls inside its own area (sticky header + totals row) instead of the whole page
              fillViewport
              fitToScreen
              tableClassName="min-w-[1050px]"
              emptyText="لا توجد بنود"
              columns={[
                { key: "index", header: "#", width: "40px", render: (_row, index) => index + 1 },
                {
                  key: "itemName",
                  header: "البند",
                  width: "220px",
                  // long item names wrap instead of widening the table
                  render: (row) => (
                    <div className="w-[220px] whitespace-normal wrap-break-word leading-6">{row.itemName}</div>
                  ),
                },
                {
                  key: "categoryName",
                  header: "التصنيف",
                  width: "150px",
                  filterable: true,
                  render: (row) => (
                    <div className="w-[150px] whitespace-normal wrap-break-word text-xs leading-5">
                      {[row.categoryName, row.subCategoryName].filter(Boolean).join(" / ") || "-"}
                    </div>
                  ),
                },
                { key: "unitName", header: "الوحدة", render: (row) => row.unitName || "-" },
                {
                  key: "quantity",
                  header: "الكمية",
                  className: "text-center",
                  render: (row) =>
                    Number(row.quantity).toLocaleString("en-US", { maximumFractionDigits: 3 }),
                },
                {
                  key: "systemPrice",
                  header: "سعر المنظومة",
                  render: (row) => formatMoney(row.systemPrice),
                },
                {
                  key: "companyPrice",
                  header: "السعر بعد الرفع",
                  render: (row) => {
                    const draft = draftOf(row.itemId, row.companyPrice);
                    const changed =
                      draft !== "" && Number(draft) !== (row.companyPrice ?? NaN);
                    const busy = savingItemId === row.itemId;
                    return (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          step="any"
                          value={draft}
                          placeholder={String(row.systemPrice)}
                          onChange={(e) =>
                            setDrafts((prev) => ({ ...prev, [row.itemId]: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && changed) void savePrice(row.itemId, row.companyPrice);
                          }}
                          className="w-28 border border-gray-300 px-2 py-1 text-right focus:outline-none focus:ring-2 focus:ring-blue-200"
                        />
                        <button
                          onClick={() => savePrice(row.itemId, row.companyPrice)}
                          disabled={!changed || busy}
                          className="bg-blue-600 px-3 py-1 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                        >
                          {busy ? "..." : "حفظ"}
                        </button>
                        {row.companyPrice != null && (
                          <button
                            onClick={() => resetPrice(row.itemId)}
                            disabled={busy}
                            title="إرجاع لسعر المنظومة"
                            className="p-1 text-gray-500 hover:text-red-600 disabled:opacity-50"
                          >
                            <RotateCcw size={16} />
                          </button>
                        )}
                      </div>
                    );
                  },
                },
                {
                  key: "systemTotal",
                  header: "الإجمالي قبل الرفع",
                  showTotal: true,
                  render: (row) => formatMoney(row.systemTotal),
                },
                {
                  key: "finalTotal",
                  header: "الإجمالي بعد الرفع",
                  className: "font-bold text-gray-900",
                  // totals row = estimate total after raise, only once something is raised
                  showTotal: hasRaise,
                  // empty for items still on the system price
                  render: (row) =>
                    row.companyPrice != null ? (
                      <span className="text-[#bf0200]">{formatMoney(row.finalTotal)}</span>
                    ) : null,
                },
              ]}
            />
          ) : (
            <EmptyState image={card2BG} title="لا توجد بنود في هذه المقايسة" />
          )}
        </>
      )}
    </div>
  );
}
