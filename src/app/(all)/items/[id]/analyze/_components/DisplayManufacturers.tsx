import Table from "@/components/table/Table";
import { Manufacturing } from "@/rtk/slices/ManufacturingSlice";
import { Pencil, Trash2 } from "lucide-react";
import React from "react";
import Image from "next/image";
import { default_image } from "@/assets";

type Props = {
  data: Manufacturing[];
  onDelete: (ManufacturerlId: number) => void;
  onEdit: (manufacturing: Manufacturing) => void;
};
export default function DisplayManufacturers({ data, onDelete, onEdit }: Props) {
  return (
    <div>
      <h3 className="text-xl font-bold mb-4">{"مصنعيات تم اختيارها"}</h3>
      <Table
        fillViewport
        data={data || []}
        getRowKeyAction={(row) => `${row.id}-${row.name}`}
        tableClassName="min-w-225"
        emptyText="لا يوجد بيانات"
        columns={[
          {
            key: "index",
            header: "#",
            className: "text-center",
            render: (_row, index) => index + 1,
          },

          {
            key: "publicCategory",
            header: "التصنيف العام",
            className: "text-center",
            render: (row) => row.publicCategory?.name || "-",
          },

          {
            key: "name",
            header: "اسم المصنعيه",
          },

          {
            key: "unit",
            header: "الوحدة",
            className: "text-center",
            render: (row) =>
              row.unitName ||
              (typeof row.unit === "string" ? row.unit : row.unit?.value) ||
              "-",
            filterable: true,
          },

          {
            key: "dailies",
            header: "اليوميات",
            render: (row) =>
              row.dailies?.length ? (
                <div className="flex flex-col gap-1">
                  {row.dailies.map((daily) => (
                    <div
                      key={daily.id}
                      className="flex items-center justify-between py-1 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {daily.daily.name}
                        </span>
                        -
                        <span className="text-green-600 font-semibold">
                          {daily.daily.pricePerDay}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {"العدد"}
                        </span>
                        -
                        <span className="text-green-600 font-semibold">
                          {daily.quantity}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-gray-400">لا توجد يوميات</span>
              ),
          },

          {
            key: "totalDailyPrice",
            header: "إجمالي اليوميات",
            className: "text-center",
            render: (row) =>
              (row.dailies || []).reduce(
                (sum, daily) =>
                  sum + daily.quantity * daily.daily.pricePerDay,
                0,
              ),
            showTotal: true,
            totalValue: (rows) =>
              rows.reduce(
                (total, row) =>
                  total +
                  (row.dailies || []).reduce(
                    (dailyTotal, daily) =>
                      dailyTotal + daily.quantity * daily.daily.pricePerDay,
                    0,
                  ),
                0,
              ),
          },
          {
            key: "performanceRate",
            header: "معدل الأداء",
            className: "text-center",
          },

          {
            key: "performanceRateImage",
            header: "صورة معدل الاداء",
            printable: false,
            render: (row) => (
              <div className="relative h-20 w-20">
                <Image
                  src={row.performanceRateImage ?? default_image}
                  alt="manufacture-image"
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </div>
            ),
          },

          {
            key: "manufacturingPrice",
            header: "سعر المصنعية",
            className: "text-center font-semibold",

            render: (row) => {
              const total = (row.dailies || []).reduce(
                (sum, d) => sum + d.quantity * d.daily.pricePerDay,
                0,
              );

              const result =
                row.performanceRate > 0 ? total / row.performanceRate : 0;

              return result.toFixed(2);
            },
            showTotal: true,
            totalValue: (rows) =>
              rows.reduce((sum, row) => {
                const totalDailyPrice = (row.dailies || []).reduce(
                  (dailyTotal, daily) =>
                    dailyTotal + daily.quantity * daily.daily.pricePerDay,
                  0,
                );

                return (
                  sum +
                  (row.performanceRate > 0
                    ? totalDailyPrice / row.performanceRate
                    : 0)
                );
              }, 0),
          },

          {
            key: "notes",
            header: "ملاحظات",
            className: "text-center",

            render: (row) => row.notes || "-",
          },

          {
            key: "actions",
            header: "خيارات",
            className: "text-center",

            render: (row) => (
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => onEdit(row)}
                  className="text-green-600 hover:text-green-700"
                  title="تعديل المصنعية الأصلية"
                >
                  <Pencil size={18} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(row.id);
                  }}
                  className="text-red-500 hover:text-red-700 transition"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
