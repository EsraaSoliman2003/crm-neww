"use client";
import Button from "@/components/button/Button";
import Input from "@/components/form/Input";
import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/rtk/hooks";
import Loader from "@/components/loader/Loader";
import EmptyState from "@/components/emptyState/EmptyState";
import { card2BG } from "@/assets";
import { confirmDelete } from "@/utils/confirmDelete";
import { getDailyCategoryName } from "@/utils/getDailyName";
import ButtonBar from "@/components/buttonBar/ButtonBar";
import { SquarePen, Trash2 } from "lucide-react";
import { deleteDaily, fetchDailies } from "@/rtk/slices/dailySlice";
import { useAuth } from "@/context/AuthContext";
import Table from "@/components/table/Table";
import Link from "next/link";
import Dropdown from "@/components/dropdown/DropDown";

type Option = {
  value: string;
  label: string;
};

export default function Page() {
  const { role } = useAuth();
  const dispatch = useAppDispatch();
  const { data: items, loading } = useAppSelector((s) => s.daily);
  useEffect(() => {
    dispatch(fetchDailies({ page: 1, pageSize: 1000 }));
  }, [dispatch]);

  const [name, setName] = useState("");
  const [selectedDailyCategory, setSelectedDailyCategory] = useState<Option>({
    value: "",
    label: "كل تصنيفات اليوميات",
  });

  const dailyCategoryOptions = [
    { value: "", label: "كل تصنيفات اليوميات" },
    ...Array.from(
      new Map(
        (items || []).map((item) => [
          String(item.category),
          {
            value: String(item.category),
            label: getDailyCategoryName(item.category),
          },
        ]),
      ).values(),
    ),
  ];

  const filteredDailies = (items || []).filter(
    (est) =>
      (est?.name ?? "").toLowerCase().includes(name.toLowerCase()) &&
      (selectedDailyCategory.value === "" ||
        String(est.category) === selectedDailyCategory.value),
  );

  const handleDelete = (id: number) => {
    confirmDelete(id, (id) => dispatch(deleteDaily(Number(id))).unwrap());
  };

  const reportData = filteredDailies.map((item) => ({
    id: item.id,
    name: item.name,
    subCategoryName: getDailyCategoryName(item.category),
    pricePerDay: item.pricePerDay,
  }));

  return (
    <div className="space-y-8">
      <div className="space-y-5 rounded-b-3xl border-b border-orange-100/80 bg-linear-to-b from-orange-50/95 via-white/95 to-white/90 px-6 pb-5 pt-4 shadow-[0_10px_30px_-24px_rgba(154,52,18,0.45)] md:px-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="text-right">
            <h1 className="text-xl md:text-2xl font-bold">اليوميات</h1>
          </div>

          <div className="flex gap-3">
            <Button
              text="+ اضافة يومية"
              href={"/daily/add-daily?mode=create"}
            />
          </div>
        </div>

        {/* button bar */}
        <ButtonBar title="تقرير اليوميات" data={reportData} />
      </div>

      {loading ? (
        <Loader />
      ) : items.length > 0 ? (
        <Table
          data={filteredDailies}
          exportTitle="تقرير اليوميات"
          excelImportType="Daily"
          onExcelImportSuccess={async () => {
            dispatch(fetchDailies({ page: 1, pageSize: 1000 }));
          }}
          excelTemplateColumns={[
            { header: "Daily name", condition: "مطلوب" },
            { header: "Category", condition: "مطلوب (عمالة او معدة)" }
          ]}
          filterContent={
            <div className="grid gap-3 md:grid-cols-2">
              <Input
                name="name"
                type="text"
                value={name}
                placeholder="أدخل اسم اليومية"
                onChange={(e) => setName(e.target.value)}
              />
              <Dropdown
                placeholder="فلتر تصنيف اليومية"
                options={dailyCategoryOptions}
                selected={selectedDailyCategory.value}
                onSelect={setSelectedDailyCategory}
              />
            </div>
          }
          tableClassName="xl:table-auto!"
          cellClassName="p-1!"
          headerClassName="[&_th]:p-1!"
          loading={loading}
          emptyText="لا توجد يوميات مطابقة للفلاتر المحددة"
          getRowKeyAction={(item) => item.id}
          columns={[
            {
              key: "id",
              header: "الرقم",
              render: (_, index) => index + 1,
            },

            {
              key: "name",
              header: "اسم اليوميه",
              width: "auto",
              filterable: true,
            },
            {
              key: "category",
              header: "تصنيف اليوميه",
              render: (row) => getDailyCategoryName(row.category),
              filterable: true,
            },

            {
              key: "pricePerDay",
              header: "سعر اليوميه",
            },

            {
              key: "note",
              header: "الملاحظات",
              className: "whitespace-normal! wrap-break-word! overflow-hidden",
              // truncateWords: 10,
              // width:"auto",
              // render: (row) => row.note || "-",
            },

            {
              key: "actions",
              header: "خيارات",
              render: (row) => (
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(Number(row.id));
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={18} />
                  </button>
                  <Link
                    href={`/daily/add-daily?id=${row.id}&mode=edit`}
                    className="text-green-600"
                  >
                    <SquarePen size={18} />
                  </Link>
                </div>
              ),
            },
          ]}
        />
      ) : (
        <EmptyState image={card2BG} title="لا توجد يوميات" />
      )}
    </div>
  );
}
