import Table from "@/components/table/Table";
import { SelectedMaterialItem } from "@/lib/dtos";
import { Pencil, Trash2 } from "lucide-react";
import React from "react";

type RowType = SelectedMaterialItem & {
  quantity: number;
};

type Props = {
  data: RowType[];
  onDelete: (
    materialId: number,
    supplierId: number,
    supplierMaterialId: number,
  ) => void;
  onEdit: (item: RowType) => void;
};

export default function DisplayMaterials({ data, onDelete, onEdit }: Props) {

  return (
    <div>
      <h3 className="text-xl font-bold mb-4">{"خامات تم اختيارها"}</h3>

      <Table
        data={data}
        getRowKeyAction={(row) =>
          `${row.materialId}-${row.supplierId}-${row.supplierMaterialId}`
        }
        emptyText="لا يوجد بيانات"
        columns={[
          {
            key: "materialId",
            header: "الرقم",
            render: (_row, index) => index + 1,
          },

          {
            key: "categoryName",
            header: "التصنيف العام",
            render: (row) => row.categoryName || "-",
            filterable: true,
          },

          {
            key: "subCategoryName",
            header: "تصنيف الخامة",
            render: (row) => row.subCategoryName || "-",
            filterable: true,
          },

          {
            key: "materialName",
            header: "اسم الخامة",
            filterable: true,
          },

          {
            key: "unitName",
            header: "الوحدة",
            render: (row) => row.unitName || "-",
            filterable: true,
          },

          {
            key: "supplierName",
            header: "المورد",
            filterable: true,
          },

          {
            key: "price",
            header: "الفئة",
          },

          {
            key: "waste",
            header: "الهالك",
            render: (row) => `${row.waste * 100}%`,
          },

          {
            key: "note",
            header: "الملاحظات",
            render: (row) => row.note || "-",
            className: "whitespace-normal! min-w-[20vw]",
          },

          {
            key: "quantity",
            header: "المعدل",
          },

          {
            key: "totalPrice",
            header: "الفئة الاجمالية",
            className: "font-semibold",
            showTotal: true,
            totalValue: (rows) =>
              rows.reduce(
                (total, row) =>
                  total +
                  (row?.quantity ?? 0) *
                  (row?.price ?? 0),
                0,
              ),
            render: (row) => row.price * row.quantity,
          },

          {
            key: "totalAfterWaste",
            header: "المعدل بعد الهالك",
            className: "font-semibold",
            render: (row) =>
              ((row.waste + 1) * row.quantity).toLocaleString(
                "en-US",
                {
                  maximumFractionDigits: 2,
                },
              ),
          },
          {
            key: "endTotalAfterWaste",
            header: "الفئة النهائية",
            className: "font-semibold",
            showTotal: true,
            totalValue: (rows) =>
              rows.reduce(
                (total, row) =>
                  total +
                  ((row.waste ?? 0) + 1) *
                  (row.quantity ?? 0) *
                  (row.price ?? 0),
                0,
              ),
            render: (row) =>
              ((row.waste + 1) * row.quantity * row.price).toLocaleString(
                "en-US",
                {
                  maximumFractionDigits: 2,
                },
              ),
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
                  title="تعديل الخامة الأصلية"
                >
                  <Pencil size={18} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(row.materialId, row.supplierId, row.supplierMaterialId);
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
