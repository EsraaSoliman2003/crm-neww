"use client";

import React, { useEffect, useState } from "react";
import { Eye } from "lucide-react";
import Loader from "@/components/loader/Loader";
import {
  CompanyEstimatePricing,
  formatChange,
  formatMoney,
  getCompanyEstimatesPricing,
} from "@/lib/companyPricing";
import EstimatePricesModal from "@/components/companyPricing/EstimatePricesModal";

/**
 * Admin review of the company's raised prices: one compact row per estimate
 * (totals before/after), and the item prices in a modal so the page stays short.
 */
export default function RaisedItemsSection({ companyId }: { companyId: number }) {
  const [estimates, setEstimates] = useState<CompanyEstimatePricing[]>([]);
  const [loading, setLoading] = useState(false);
  const [openEstimateId, setOpenEstimateId] = useState<number | null>(null);

  useEffect(() => {
    if (!companyId) return;
    const load = async () => {
      try {
        setLoading(true);
        const all = await getCompanyEstimatesPricing(companyId);
        setEstimates(all.filter((e) => e.raisedItemsCount > 0));
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [companyId]);

  const systemTotal = estimates.reduce((s, e) => s + e.systemTotal, 0);
  const companyTotal = estimates.reduce((s, e) => s + e.companyTotal, 0);

  return (
    <div className="px-6 pb-10 md:px-8">
      <h2 className="mb-4 text-right text-xl font-bold">أسعار الشركة على البنود</h2>

      {loading ? (
        <Loader />
      ) : estimates.length === 0 ? (
        <p className="border border-gray-200 bg-white p-6 text-center text-gray-500">
          لم ترفع الشركة سعر أي بند حتى الآن
        </p>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-gray-500">إجمالي المقايسات قبل الرفع</p>
              <p className="mt-1 text-xl font-bold">{formatMoney(systemTotal)}</p>
            </div>
            <div className="border-2 border-[#bf0200] bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-[#bf0200]">إجمالي المقايسات بعد الرفع</p>
              <p className="mt-1 text-2xl font-extrabold">{formatMoney(companyTotal)}</p>
            </div>
            <div className="border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-gray-500">الفرق</p>
              <p className="mt-1 text-xl font-bold">
                {formatMoney(companyTotal - systemTotal)}{" "}
                <span className="text-sm font-medium">({formatChange(systemTotal, companyTotal)})</span>
              </p>
            </div>
          </div>

          <div className="overflow-hidden border border-gray-200 bg-white shadow-sm">
            <table className="w-full table-auto text-right text-sm">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  <th className="px-3 py-2">المقايسة</th>
                  <th className="px-3 py-2 whitespace-nowrap">البنود المرفوعة</th>
                  <th className="px-3 py-2 whitespace-nowrap">قبل الرفع</th>
                  <th className="px-3 py-2 whitespace-nowrap">بعد الرفع</th>
                  <th className="px-3 py-2 whitespace-nowrap">التغيير</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {estimates.map((e) => (
                  <tr key={e.estimateId}>
                    <td className="px-3 py-2 font-medium">{e.estimateName}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {e.raisedItemsCount} من {e.itemsCount}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">{formatMoney(e.systemTotal)}</td>
                    <td className="px-3 py-2 whitespace-nowrap font-semibold text-[#bf0200]">
                      {formatMoney(e.companyTotal)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">{formatChange(e.systemTotal, e.companyTotal)}</td>
                    <td className="px-3 py-2 text-left">
                      <button
                        type="button"
                        onClick={() => setOpenEstimateId(e.estimateId)}
                        className="inline-flex items-center gap-1 whitespace-nowrap border border-blue-600 px-3 py-1 text-blue-700 hover:bg-blue-50"
                      >
                        <Eye size={14} />
                        التفاصيل
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {openEstimateId != null && (
        <EstimatePricesModal
          companyId={companyId}
          estimateId={openEstimateId}
          onCloseAction={() => setOpenEstimateId(null)}
        />
      )}
    </div>
  );
}
