"use client";

import React, { useEffect, useState } from "react";
import Loader from "@/components/loader/Loader";
import Table from "@/components/table/Table";
import {
  CompanyRaisedItems,
  formatChange,
  formatMoney,
  getCompanyRaisedItems,
} from "@/lib/companyPricing";

/** Admin review of every item whose price this company raised, before and after. */
export default function RaisedItemsSection({ companyId }: { companyId: number }) {
  const [data, setData] = useState<CompanyRaisedItems>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!companyId) return;
    const load = async () => {
      try {
        setLoading(true);
        setData(await getCompanyRaisedItems(companyId));
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [companyId]);

  return (
    <div className="px-6 pb-10 md:px-8">
      <h2 className="mb-4 text-right text-xl font-bold">البنود المرفوع سعرها</h2>

      {loading ? (
        <Loader />
      ) : !data || data.items.length === 0 ? (
        <p className="border border-gray-200 bg-white p-6 text-center text-gray-500">
          لم ترفع الشركة سعر أي بند حتى الآن
        </p>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-gray-500">الإجمالي قبل الرفع</p>
              <p className="mt-1 text-xl font-bold">{formatMoney(data.systemTotal)}</p>
            </div>
            <div className="border-2 border-[#bf0200] bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-[#bf0200]">الإجمالي بعد الرفع</p>
              <p className="mt-1 text-2xl font-extrabold">{formatMoney(data.companyTotal)}</p>
            </div>
            <div className="border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-gray-500">الفرق</p>
              <p className="mt-1 text-xl font-bold">
                {formatMoney(data.companyTotal - data.systemTotal)}{" "}
                <span className="text-sm font-medium">
                  ({formatChange(data.systemTotal, data.companyTotal)})
                </span>
              </p>
              <p className="mt-1 text-xs text-gray-500">{data.items.length} بند</p>
            </div>
          </div>

          <Table
            data={data.items}
            getRowKeyAction={(row) => `${row.estimateId}-${row.itemId}`}
            tableClassName="min-w-290"
            exportTitle="البنود المرفوع سعرها"
            columns={[
              { key: "index", header: "#", render: (_row, index) => index + 1 },
              { key: "estimateName", header: "المقايسة", filterable: true },
              { key: "itemName", header: "البند" },
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
                header: "السعر قبل الرفع",
                render: (row) => formatMoney(row.systemPrice),
              },
              {
                key: "companyPrice",
                header: "السعر بعد الرفع",
                className: "font-semibold text-[#bf0200]",
                render: (row) => formatMoney(row.companyPrice),
              },
              {
                key: "change",
                header: "نسبة التغيير",
                className: "text-center",
                render: (row) => formatChange(row.systemPrice, row.finalPrice),
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
                className: "font-bold",
                showTotal: true,
                render: (row) => formatMoney(row.finalTotal),
              },
            ]}
          />
        </div>
      )}
    </div>
  );
}
