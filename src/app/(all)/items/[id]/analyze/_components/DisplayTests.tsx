import Table from "@/components/table/Table";
import { Test } from "@/utils/dtos";
import { Pencil, Trash2 } from "lucide-react";
import React from "react";

type Props = {
  data: (Test & { percentage: number })[];
  onDelete: (testId: number) => void;
  onEdit: (test: Test & { percentage: number }) => void;
};

export default function DisplayTests({ data, onDelete, onEdit }: Props) {
  return (
    <div>
      <h3 className="text-xl font-bold mb-4">{"اختبارات تم اختيارها"}</h3>
      <Table
        data={data || []}
        getRowKeyAction={(row) => `${row.id}`}
        emptyText="لا يوجد بيانات"
        columns={[
          {
            key: "id",
            header: "الرقم",
            render: (_row, index) => index + 1,
          },

          {
            key: "categoryName",
            header: "التصنيف",
            filterable: true,
          },

          {
            key: "subCategoryName",
            header: "تصنيف الإختبار",
            filterable: true,
          },

          {
            key: "name",
            header: "اسم الاختبار",
          },

          {
            key: "costPerUnit",
            header: "السعر",
            render: (row) => (
              <span className="font-semibold">{row.costPerUnit}</span>
            ),
          },

          {
            key: "note",
            header: "ملاحظات",
            className: "whitespace-normal! min-w-[35vw]",
          },

          {
            key: "percentage",
            header: "نسبة الوحدة من الاختبار",
            className: "font-bold",
            render: (row) => `${row.percentage}%`,
          },

          {
            key: "priceAfterPercentage",
            header: "سعر الوحدة من الاختبار",
            className: "font-bold",
            showTotal: true,
            totalValue: (rows) =>
              rows.reduce(
                (total, row) =>
                  total +
                  row.costPerUnit * (1 + row.percentage / 100),
                0,
              ),
            render: (row) =>
              Number(row.costPerUnit * (1 + row.percentage / 100)).toFixed(2),
          },

          {
            key: "actions",
            header: "خيارات",
            render: (row) => (
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => onEdit(row)}
                  className="text-green-600 hover:text-green-700"
                  title="تعديل الاختبار الأصلي"
                >
                  <Pencil size={18} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(row.id);
                  }}
                  className="text-red-500 hover:text-red-700"
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
