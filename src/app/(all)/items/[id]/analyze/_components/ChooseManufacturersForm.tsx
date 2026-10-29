"use client";

import { useAppSelector } from "@/rtk/hooks";
import React, { useEffect, useMemo, useState } from "react";
import { FormType } from "../page";
import DisplayManufacturers from "./DisplayManufacturers";
import Dropdown from "@/components/dropdown/DropDown";
import Input from "@/components/form/Input";
import { Manufacturing } from "@/rtk/slices/ManufacturingSlice";
import QuickCreateManufacturingModal from "./QuickCreateManufacturingModal";

/* ================= TYPES ================= */

type Props = {
  form: FormType;
  setForm: React.Dispatch<React.SetStateAction<FormType>>;
  error?: string;
  onChooseFromMaster?: () => void;
};

const getManufacturingValue = (item: Manufacturing) => {
  const totalDailyPrice = (item.dailies || []).reduce(
    (total, daily) =>
      total + (daily.quantity ?? 0) * (daily.daily?.pricePerDay ?? 0),
    0,
  );

  return item.performanceRate > 0
    ? totalDailyPrice / item.performanceRate
    : 0;
};

export default function ChooseManufacturersForm({
  form,
  setForm,
  error,
  onChooseFromMaster,
}: Props) {
  const { data: items = [], loading } = useAppSelector((s) => s.manufacturing);
  const generalCategories = useAppSelector((state) => state.categories.data);

  const [selectedId, setSelectedId] = useState("");
  const [nameFilter, setNameFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [editingItem, setEditingItem] = useState<Manufacturing | null>(null);

  const categoryOptions = useMemo(
    () =>
      generalCategories.map((category) => ({
        value: category.name,
        label: category.name,
      })),
    [generalCategories],
  );
  const filteredItems = useMemo(
    () =>
      items.filter((item: Manufacturing) => {
        const matchesName = (item.name || "")
          .toLowerCase()
          .includes(nameFilter.trim().toLowerCase());
        const matchesCategory =
          !categoryFilter || item.publicCategory?.name === categoryFilter;

        return matchesName && matchesCategory;
      }),
    [categoryFilter, items, nameFilter],
  );

  const clearFilters = () => {
    setNameFilter("");
    setCategoryFilter("");
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedId("");
  }, [categoryFilter, nameFilter]);

  /* ================= ADD ================= */

  const handleAdd = () => {
    if (!selectedId) return;

    const exists = form.manufacturings.some(
      (m) => m.manufacturingId === Number(selectedId),
    );

    if (exists) return;

    setForm((prev) => ({
      ...prev,
      manufacturings: [
        ...prev.manufacturings,
        { manufacturingId: Number(selectedId) },
      ],
    }));

    setSelectedId("");
  };

  /* ================= DELETE ================= */

  const handleDelete = (id: number) => {
    setForm((prev) => ({
      ...prev,
      manufacturings: prev.manufacturings.filter(
        (m) => m.manufacturingId !== id,
      ),
    }));
  };

  /* ================= OPTIONS ================= */

  const options = filteredItems.map((item: Manufacturing) => {
    const manufacturingValue = getManufacturingValue(item);

    return {
      value: String(item.id),
      label: item.name,
      renderLabel: (
        <div className="flex items-center justify-between gap-3">
          <span>{item.name}</span>
          <span className="text-xs font-semibold text-green-700">
            قيمة المصنعية {manufacturingValue.toLocaleString("en-US", {
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
      ),
    };
  });
  /* ================= DISPLAY ================= */

  const selectedManufacturers = form.manufacturings
    .map((m) => items.find((i: Manufacturing) => i.id === m.manufacturingId))
    .filter(Boolean) as Manufacturing[];

  return (
    <>
      <div className="space-y-5 border border-gray-200 bg-white p-5 shadow-sm">
        <div className="rounded-lg border border-red-100 bg-red-50/40 p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-gray-900">فلترة المصنعيات</h3>
              <p className="mt-1 text-xs font-semibold text-gray-500">
                ظاهر {filteredItems.length} من {items.length} مصنعية
              </p>
            </div>
            <button
              type="button"
              onClick={clearFilters}
              className="border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50"
            >
              مسح الفلاتر
            </button>
          </div>

          <div className="grid items-end gap-3 md:grid-cols-2">
            <Input
              label="اسم المصنعية"
              name="manufacturingNameFilter"
              type="text"
              value={nameFilter}
              placeholder="ابحث باسم المصنعية"
              onChange={(event) => setNameFilter(event.target.value)}
            />
            <Dropdown
              label="التصنيف"
              placeholder="كل التصنيفات"
              options={categoryOptions}
              selected={categoryFilter}
              onSelect={(e) => setCategoryFilter(e.value)}
            />
          </div>
        </div>

        <Dropdown
          label={"المصنعية"}
          placeholder={"اختر المصنعية"}
          options={options}
          selected={selectedId}
          onSelect={(e) => setSelectedId(e.value)}
          loading={loading}
        />

        <div className="flex flex-wrap justify-end gap-3">
          {onChooseFromMaster && (
            <button
              type="button"
              onClick={onChooseFromMaster}
              className="rounded-lg border border-blue-200 bg-blue-50 px-5 py-2 font-semibold text-blue-700 transition hover:bg-blue-100"
            >
              اختيار مصنعية من البيانات الأساسية
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowQuickCreate(true)}
            className="rounded-lg border border-orange-200 bg-orange-50 px-5 py-2 font-semibold text-orange-700 transition hover:bg-orange-100"
          >
            + إضافة مصنعية جديدة غير موجودة
          </button>
          <button
            type="button"
            onClick={handleAdd}
            disabled={!selectedId}
            className={`px-6 py-2 transition
              ${selectedId ? "text-red-600 hover:text-red-700" : "text-gray-400 cursor-not-allowed"}
            `}
          >
            + إضافة
          </button>
        </div>
        {error && (
          <p className="mt-2 text-sm font-semibold text-red-600">{error}</p>
        )}
      </div>
      {/* TABLE */}
      <DisplayManufacturers
        data={selectedManufacturers}
        onDelete={handleDelete}
        onEdit={setEditingItem}
      />
      {(showQuickCreate || editingItem) && (
        <QuickCreateManufacturingModal
          editItem={editingItem ?? undefined}
          onClose={() => { setShowQuickCreate(false); setEditingItem(null); }}
          onCreated={(manufacturingId) =>
            setForm((previous) => ({
              ...previous,
              manufacturings: previous.manufacturings.some(
                (item) => item.manufacturingId === manufacturingId,
              )
                ? previous.manufacturings
                : [...previous.manufacturings, { manufacturingId }],
            }))
          }
        />
      )}
    </>
  );
}
