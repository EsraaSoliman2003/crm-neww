"use client";

import Button from "@/components/button/Button";
import Input from "@/components/form/Input";
import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/rtk/hooks";
import Loader from "@/components/loader/Loader";
import EmptyState from "@/components/emptyState/EmptyState";
import { card2BG, default_image } from "@/assets";
import { confirmDelete } from "@/utils/confirmDelete";
import ButtonBar from "@/components/buttonBar/ButtonBar";
import { Eye, SquarePen, Trash2 } from "lucide-react";
import {
  deleteManufacturing,
  fetchManufacturing,
  Manufacturing,
} from "@/rtk/slices/ManufacturingSlice";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Table from "@/components/table/Table";
import Dropdown from "@/components/dropdown/DropDown";
import Image from "next/image";

type Option = {
  value: string;
  label: string;
};

const getUnitName = (item: Manufacturing) =>
  item.unitName ||
  (typeof item.unit === "string" ? item.unit : item.unit?.value) ||
  "";

const getManufacturingPrice = (item: Manufacturing) => {
  const total = (item.dailies || []).reduce(
    (sum, daily) => sum + daily.quantity * daily.daily.pricePerDay,
    0,
  );

  return item.performanceRate > 0 ? total / item.performanceRate : 0;
};

const createFilterOptions = (values: string[], allLabel: string): Option[] => [
  { value: "", label: allLabel },
  ...Array.from(new Set(values.filter(Boolean))).map((value) => ({
    value,
    label: value,
  })),
];

function ManufacturersPageContent() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const analysisItemId = Number(searchParams.get("analysisItemId"));
  const analysisMode = searchParams.get("analysisMode") === "edit" ? "edit" : "create";
  const { data: items, loading } = useAppSelector((s) => s.manufacturing);
  useEffect(() => {
    dispatch(fetchManufacturing({ page: 1, pageSize: 1000 }));
  }, [dispatch]);

  const [name, setName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Option>({
    value: "",
    label: "كل التصنيفات",
  });

  const categoryOptions = createFilterOptions(
    (items || []).map((item) => item.publicCategory?.name || ""),
    "كل التصنيفات",
  );
  const filteredItems = (items || []).filter((item) => {
    return (
      (item.name || "").toLowerCase().includes(name.trim().toLowerCase()) &&
      (selectedCategory.value === "" ||
        item.publicCategory?.name === selectedCategory.value)
    );
  });

  const handleDelete = (id: number) => {
    confirmDelete(id, (id) =>
      dispatch(deleteManufacturing(Number(id))).unwrap(),
    );
  };
  const chooseForAnalysis = (manufacturingId: number) => {
    const params = new URLSearchParams({
      selectManufacturing: String(manufacturingId),
      ...(analysisMode === "edit" ? { mode: "edit" } : {}),
    });
    router.push(`/items/${analysisItemId}/analyze?${params.toString()}`);
  };

  const flattenManufacturing = (items: Manufacturing[]) => {
    return items.map((item) => {
      const manufacturePrice = getManufacturingPrice(item);

      return {
        id: item.id,
        name: item.name,
        dailiesCount: item.dailies?.length || 0,
        performanceRate: item.performanceRate,
        unit: getUnitName(item) || "-",
        manufacturePrice: Number(manufacturePrice.toFixed(2)),
        notes: item.notes,
      };
    });
  };
  return (
    <div className="space-y-8">
      <div className="space-y-5 rounded-b-3xl border-b border-orange-100/80 bg-linear-to-b from-orange-50/95 via-white/95 to-white/90 px-6 pb-5 pt-4 shadow-[0_10px_30px_-24px_rgba(154,52,18,0.45)] md:px-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="text-right">
            <h1 className="text-xl md:text-2xl font-bold">المصنعيات</h1>
          </div>

          {analysisItemId <= 0 && (
            <div className="flex gap-3">
              <Button
                text="+ اضافة مصنعية"
                href={"/manufacturers/add-manufacturer"}
              />
            </div>
          )}
        </div>

        {/* Search */}

        {/* button bar */}
        <ButtonBar
          title="تقرير المصنعيات"
          data={flattenManufacturing(filteredItems)}
        />
      </div>

      {loading ? (
        <Loader />
      ) : items.length > 0 ? (
        <Table
          data={filteredItems}
          emptyText="لا توجد مصنعيات مطابقة للفلاتر المحددة"
          filterContent={
            <div className="grid gap-3 md:grid-cols-2">
              <Input
                name="name"
                type="text"
                value={name}
                placeholder="ابحث باسم المصنعية"
                onChange={(e) => setName(e.target.value)}
              />
              <Dropdown
                placeholder="اختر التصنيف"
                options={categoryOptions}
                selected={selectedCategory.value}
                onSelect={setSelectedCategory}
              />
            </div>
          }
          exportTitle="تقرير المصنعيات"
          getRowKeyAction={(row) => row.id}
          onRowClickAction={(row) => router.push(`/manufacturers/${row.id}`)}
          tableClassName="min-w-290"
          columns={[
            {
              key: "id",
              header: "#",
              render: (_, index) => index + 1,
              className: "text-center",
            },
            {
              key: "publicCategory",
              header: "التصنيف العام",
              className: "text-center",
              render: (row) => row.publicCategory?.name,
              filterable: true,
            },

            {
              key: "name",
              header: "اسم المصنعيه",
              filterable: true,
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
              width: "320px",
              className: "overflow-hidden",
              render: (row) =>
                row.dailies?.length ? (
                  <div className="max-h-44 min-w-0 space-y-2 overflow-y-auto overflow-x-hidden pe-1">
                    {row.dailies.map((daily) => (
                      <div
                        key={daily.id}
                        className="min-w-0 rounded-lg border border-gray-200 bg-white p-2 text-xs shadow-sm"
                      >
                        <div className="min-w-0 wrap-break-word font-semibold leading-5 text-gray-800">
                          <span title={daily.daily.name}>
                            {daily.daily.name}
                          </span>
                        </div>

                        <div className="mt-2 flex min-w-0 flex-wrap items-center gap-2">
                          <span className="max-w-full rounded-md bg-green-50 px-2 py-1 font-semibold text-green-700 break-all">
                            السعر: {daily.daily.pricePerDay}
                          </span>
                          <span className="max-w-full rounded-md bg-orange-50 px-2 py-1 font-semibold text-orange-700 break-all">
                            العدد: {daily.quantity}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-gray-400">لا توجد يوميات</span>
                ),
              exportValue: (row) =>
                row.dailies
                  ?.map(
                    (daily) =>
                      `${daily.daily.name} - ${daily.daily.pricePerDay}`,
                  )
                  .join(" | "),
            },

            {
              key: "totalDailyPrice",
              header: "الاجمالي",
              className: "text-center",
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
              exportValue: (row) =>
                row.performanceRateImage ?? default_image.src,
              render: (row) => (
                <div className="relative w-20 h-20">
                  <Image
                    src={row.performanceRateImage ?? default_image}
                    alt="manufacture-image"
                    fill
                    sizes="80px"
                    className=" object-cover"
                  />
                </div>
              ),
            },

            {
              key: "manufacturerPrice",
              header: "سعر المصنعية",
              className: "text-center font-semibold",

              render: (row) => {
                const total = row.dailies.reduce(
                  (sum, d) => sum + d.quantity * d.daily.pricePerDay,
                  0,
                );
                const result =
                  row.performanceRate > 0 ? total / row.performanceRate : 0;

                return result.toFixed(2);
              },
              exportValue: (row) => {
                const total = row.dailies.reduce(
                  (sum, d) => sum + d.quantity * d.daily.pricePerDay,
                  0,
                );
                const result =
                  row.performanceRate > 0 ? total / row.performanceRate : 0;

                return result.toFixed(2);
              },
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
                <div className="flex items-center gap-3 justify-center">
                  {analysisItemId > 0 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        chooseForAnalysis(row.id);
                      }}
                      className="whitespace-nowrap text-xs font-semibold text-blue-700 hover:text-blue-900"
                    >
                      استخدام في التحليل
                    </button>
                  )}
                  {analysisItemId <= 0 && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();

                          handleDelete(Number(row.id));
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={18} />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();

                          router.push(`/manufacturers/${row.id}`);
                        }}
                        className="text-green-500 hover:text-green-700"
                      >
                        <Eye size={18} />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();

                          router.push(
                            `/manufacturers/add-manufacturer?id=${row.id}&mode=edit`,
                          );
                        }}
                        className="text-green-600 hover:text-green-700"
                      >
                        <SquarePen size={18} />
                      </button>
                    </>
                  )}
                </div>
              ),
            },
          ]}
        />
      ) : (
        <EmptyState image={card2BG} title="لا يوجد مصنعيات" />
      )}
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<Loader />}>
      <ManufacturersPageContent />
    </Suspense>
  );
}
