"use client";

import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import Loader from "@/components/loader/Loader";
import {
  CompanyEstimatePricingDetails,
  formatChange,
  formatMoney,
  getCompanyEstimatePricing,
} from "@/lib/companyPricing";

/** One company's offer on one estimate: every item with system and company price. */
export default function EstimatePricesModal({
  companyId,
  estimateId,
  companyName,
  onCloseAction,
}: {
  companyId: number;
  estimateId: number;
  /** shown in the title so it's clear whose offer this is */
  companyName?: string;
  onCloseAction: () => void;
}) {
  const [details, setDetails] = useState<CompanyEstimatePricingDetails>();

  useEffect(() => {
    getCompanyEstimatePricing(companyId, estimateId).then(setDetails).catch(console.log);
  }, [companyId, estimateId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCloseAction();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onCloseAction]);

  return (
    <div
      onClick={onCloseAction}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 md:p-6"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-full w-full max-w-5xl flex-col bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 p-4">
          <div>
            <h3 className="text-lg font-bold">
              {details?.estimateName ?? "تفاصيل المقايسة"}
              {companyName && <span className="text-[#bf0200]"> — عرض {companyName}</span>}
            </h3>
            {details && (
              <p className="mt-1 text-sm text-gray-500">
                قبل الرفع {formatMoney(details.systemTotal)} • بعد الرفع{" "}
                <span className="font-semibold text-[#bf0200]">{formatMoney(details.companyTotal)}</span>
                {" "}({formatChange(details.systemTotal, details.companyTotal)})
              </p>
            )}
          </div>
          <button onClick={onCloseAction} className="p-1 text-gray-500 hover:text-gray-900">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto p-4">
          {!details ? (
            <Loader />
          ) : (
            // fits the modal width: item name wraps, numbers stay on one line
            <table className="w-full table-auto text-right text-sm">
              <thead className="sticky top-0 bg-gray-50 text-gray-700">
                <tr>
                  <th className="px-2 py-2">#</th>
                  <th className="w-full px-2 py-2">اسم البند</th>
                  <th className="px-2 py-2 whitespace-nowrap">الكمية</th>
                  <th className="px-2 py-2 whitespace-nowrap">سعر المنظومة</th>
                  <th className="px-2 py-2 whitespace-nowrap">سعر الشركة</th>
                  <th className="px-2 py-2 whitespace-nowrap">قبل الرفع</th>
                  <th className="px-2 py-2 whitespace-nowrap">بعد الرفع</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {details.items.map((item, i) => (
                  <tr key={item.itemId} className={item.companyPrice != null ? "bg-red-50/40" : undefined}>
                    <td className="px-2 py-2 text-gray-500">{i + 1}</td>
                    <td className="px-2 py-2 leading-6">{item.itemName}</td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      {Number(item.quantity).toLocaleString("en-US", { maximumFractionDigits: 3 })} {item.unitName ?? ""}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">{formatMoney(item.systemPrice)}</td>
                    <td className="px-2 py-2 whitespace-nowrap font-semibold text-[#bf0200]">
                      {item.companyPrice != null ? formatMoney(item.companyPrice) : "-"}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">{formatMoney(item.systemTotal)}</td>
                    <td className="px-2 py-2 whitespace-nowrap font-semibold">{formatMoney(item.finalTotal)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 font-bold">
                <tr>
                  <td className="px-2 py-2" colSpan={5}>الإجمالي</td>
                  <td className="px-2 py-2 whitespace-nowrap">{formatMoney(details.systemTotal)}</td>
                  <td className="px-2 py-2 whitespace-nowrap text-[#bf0200]">{formatMoney(details.companyTotal)}</td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
