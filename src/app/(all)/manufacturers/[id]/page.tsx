"use client";

import { useParams } from "next/navigation";
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/rtk/hooks";
import Loader from "@/components/loader/Loader";
import EmptyState from "@/components/emptyState/EmptyState";
import { card2BG } from "@/assets";
import { fetchManufacturing } from "@/rtk/slices/ManufacturingSlice";
import Table from "@/components/table/Table";
import Button from "@/components/button/Button";

export default function ManufacturingDetailsPage() {
  const params = useParams();
  const dispatch = useAppDispatch();

  const id = Number(params?.id);
  const { data, loading } = useAppSelector((s) => s.manufacturing);

  useEffect(() => {
    dispatch(fetchManufacturing({ page: 1, pageSize: 1000 }));
  }, [dispatch]);

  const item = data.find((d) => d.id === id);

  if (loading) return <Loader />;

  if (!item) {
    return <EmptyState image={card2BG} title="لا يوجد بيانات" />;
  }

  const totalDailies = item.dailies.reduce(
    (sum, d) => sum + d.quantity * d.daily.pricePerDay,
    0,
  );

  const manufacturePrice =
    item.performanceRate > 0 ? totalDailies / item.performanceRate : 0;

  return (
    <div className="min-h-screen space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="text-right">
          <h1 className="text-xl md:text-2xl font-bold">تفاصيل المصنعيه</h1>
        </div>

        <Button
          text="تعديل المصنعية"
          href={`/manufacturers/add-manufacturer?id=${item.id}&mode=edit`}
        />
      </div>

      {/* Info Card */}
      <div className="bg-white shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
          <div className="bg-gray-100  p-4">
            <p className="text-gray-500 text-sm mb-1">اسم المصنعيه</p>
            <p className="font-semibold text-lg">{item.name}</p>
          </div>

          <div className="bg-gray-100  p-4">
            <p className="text-gray-500 text-sm mb-1">إجمالي اليوميات</p>
            <p className="font-semibold text-lg">{totalDailies}</p>
          </div>

          <div className="bg-gray-100  p-4">
            <p className="text-gray-500 text-sm mb-1">معدل الأداء</p>
            <p className="font-semibold text-lg">{item.performanceRate}</p>
          </div>

          <div className="bg-gray-100  p-4">
            <p className="text-gray-500 text-sm mb-1">سعر المصنعية</p>
            <p className="font-semibold text-lg text-green-600">
              {manufacturePrice.toFixed(2)}
            </p>
          </div>

          <div className="bg-gray-100  p-4 md:col-span-4">
            <p className="text-gray-500 text-sm mb-1">ملاحظات</p>
            <p className="font-semibold text-lg wrap-break-word">
              {item.notes || "-"}
            </p>
          </div>
        </div>
      </div>
      {/* Dailies Table */}
      {item.dailies.length > 0 ? (
        <Table
          data={item.dailies || []}
          getRowKeyAction={(row) => row.id}
          emptyText="لا يوجد بيانات"
          columns={[
            {
              key: "id",
              header: "الرقم",
              className: "text-center",
              render: (_row, index) => index + 1,
            },

            {
              key: "dailyName",
              header: "اسم اليوميه",
              className: "text-center",
              render: (row) => row.daily.name,
              filterable: true,
            },

            // {
            //   key: "category",
            //   header: "تصنيف اليوميه",
            //   className: "text-center",
            //   render: (row) => row.daily.publicCategory?.name || "-",
            //   filterable: true,
            // },

            {
              key: "pricePerDay",
              header: "سعر اليوميه",
              className: "text-center",
              render: (row) => row.daily.pricePerDay,
            },

            {
              key: "note",
              header: "الملاحظات",
              className: "whitespace-normal! wrap-break-word! overflow-hidden",
              render: (row) => row.daily.note || "-",
            },

            {
              key: "quantity",
              header: "الكمية",
              className: "text-center",
            },

            {
              key: "total",
              header: "الإجمالى",
              className: "text-center font-semibold",
              render: (row) => row.quantity * row.daily.pricePerDay,
            },
          ]}
        />
      ) : (
        <EmptyState image={card2BG} title="لا توجد يوميات" />
      )}
    </div>
  );
}
