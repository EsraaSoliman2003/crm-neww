import Table from "@/components/table/Table";
import { Daily } from "@/utils/dtos";
import { Trash2 } from "lucide-react";
import React from "react";

type RowType = Daily & {
  quantity: number;
};

type Props = {
  data: RowType[];
  onDelete: (dailyId: string) => void;
};

export default function DisplayDailies({ data, onDelete }: Props) {
  return (
    <div className="my-10 mb-12">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          يوميات تم اختيارها
        </h3>
      </div>
      {data && (
        <Table
          data={data}
          getRowKeyAction={(row) => row.id}
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
              key: "name",
              header: "اسم اليومية",
              className: "text-center",
            },

            {
              key: "category",
              header: "تصنيف اليومية",
              className: "text-center",
              filterable: true,
              render: (row) => (row.category === 0 ? "عمالة" : "معدات"),
            },

            {
              key: "pricePerDay",
              header: "سعر اليومية",
              className: "text-center",
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

              render: (row) => row.quantity * row.pricePerDay,
            },

            {
              key: "actions",
              header: "خيارات",
              className: "text-center",

              render: (row) => (
                <button
                  onClick={(e) => {
                    e.stopPropagation();

                    onDelete(String(row.id));
                  }}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 size={18} />
                </button>
              ),
            },
          ]}
        />
      )}
    </div>
  );
}
