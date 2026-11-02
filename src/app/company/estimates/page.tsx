"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import Loader from "@/components/loader/Loader";
import EmptyState from "@/components/emptyState/EmptyState";
import { card2BG } from "@/assets";
import { useAuth } from "@/context/AuthContext";
import Table from "@/components/table/Table";
import {
  CompanyEstimatePricing,
  formatMoney,
  getCompanyEstimatesPricing,
} from "@/lib/companyPricing";

export default function Page() {
  const { user } = useAuth();
  const [estimates, setEstimates] = useState<CompanyEstimatePricing[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    const load = async () => {
      try {
        setLoading(true);
        setEstimates(await getCompanyEstimatesPricing(Number(user.id)));
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [user]);

  return (
    <div className="min-h-screen space-y-8 p-6 md:p-8">
      <div className="sticky top-[68px] z-30 -mx-6 space-y-6 bg-[#f7f7f7] px-6 pb-4 pt-1 md:-mx-8 md:top-[84px] md:px-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="text-right">
          <h1 className="text-xl md:text-2xl font-bold">المقايسات المتاحه</h1>
          <p className="mt-1 text-sm text-gray-500">
            افتح المقايسة لرفع سعر كل بند على حدة
          </p>
        </div>
      </div>

      </div>

      {loading ? (
        <Loader />
      ) : estimates.length > 0 ? (
        <Table
          data={estimates}
          getRowKeyAction={(row) => `${row.estimateId}`}
          tableClassName="min-w-290"
          emptyText="لا يوجد بيانات"
          columns={[
            { key: "id", header: "#", render: (_, index) => index + 1 },
            { key: "estimateName", header: "اسم المقايسة" },

            {
              key: "stageName",
              header: "مرحلة المقايسة",
              render: (row) => row.stageName || "-",
              filterable: true,
            },

            {
              key: "completeName",
              header: "تمام المقايسة",
              render: (row) => row.completeName || "-",
              filterable: true,
            },
            {
              key: "raisedItemsCount",
              header: "البنود المرفوع سعرها",
              className: "text-center",
              render: (row) => `${row.raisedItemsCount} من ${row.itemsCount}`,
            },
            {
              key: "systemTotal",
              header: "إجمالي المنظومة",
              render: (row) => formatMoney(row.systemTotal),
            },
            {
              key: "companyTotal",
              header: "الإجمالي بعد الرفع",
              className: "font-bold text-gray-900",
              render: (row) => formatMoney(row.companyTotal),
            },
            {
              key: "actions",
              header: "خيارات",
              className: "text-center",

              render: (row) => (
                <div className="flex items-center gap-3 justify-center">
                  <Link
                    href={`/company/estimates/${row.estimateId}`}
                    className="px-4 py-2 bg-blue-600 text-white font-medium hover:bg-blue-700 hover:shadow-md active:scale-95 transition-all duration-200"
                  >
                    تفاصيل المقايسة
                  </Link>
                </div>
              ),
            },
          ]}
        />
      ) : (
        <EmptyState image={card2BG} title="لا يوجد لديك بيانات" />
      )}
    </div>
  );
}
