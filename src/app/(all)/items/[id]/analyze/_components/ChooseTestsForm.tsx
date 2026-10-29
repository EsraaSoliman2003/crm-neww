"use client";

import Input from "@/components/form/Input";
import { useAppSelector } from "@/rtk/hooks";
import React, { useEffect, useMemo, useRef, useState } from "react";
import DisplayTests from "./DisplayTests";
import { FormType } from "../page";
import { Test } from "@/utils/dtos";
import Dropdown from "@/components/dropdown/DropDown";
import QuickCreateTestModal from "./QuickCreateTestModal";

/* ================= PROPS ================= */

type Props = {
  form: FormType;
  setFormAction: React.Dispatch<React.SetStateAction<FormType>>;
  error?: string;
  selectedMasterTestId?: string | null;
  onChooseFromMaster?: () => void;
};

const normalizeName = (value: string | null | undefined) =>
  (value ?? "").trim().toLocaleLowerCase("ar");

export default function ChooseTestsForm({
  form,
  setFormAction,
  error,
  selectedMasterTestId,
  onChooseFromMaster,
}: Props) {
  const { data: items = [], loading } = useAppSelector((s) => s.tests);
  const generalCategories = useAppSelector((state) => state.categories.data);

  const [testId, setTestId] = useState(selectedMasterTestId ?? "");
  const [percentage, setPercentage] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [subCategoryFilter, setSubCategoryFilter] = useState("");
  const previousFilters = useRef({ categoryFilter, subCategoryFilter });
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [editingItem, setEditingItem] = useState<(Test & { percentage: number }) | null>(null);

  const isValid = testId && percentage && Number(percentage) > 0;
  const toOptions = (values: string[]) =>
    Array.from(new Set(values.filter(Boolean))).map((value) => ({
      value,
      label: value,
    }));

  const categoryOptions = useMemo(
    () => toOptions(generalCategories.map((category) => category.name)),
    [generalCategories],
  );
  const subCategoryOptions = useMemo(
    () =>
      categoryFilter
        ? toOptions(
          items
            .filter(
              (item: Test) =>
                normalizeName(item.categoryName) ===
                normalizeName(categoryFilter),
            )
            .map((item: Test) => item.subCategoryName),
        )
        : [],
    [categoryFilter, items],
  );
  const filteredItems = useMemo(
    () =>
      items.filter((item: Test) => {
        const matchesCategory =
          !categoryFilter ||
          normalizeName(item.categoryName) === normalizeName(categoryFilter);
        const matchesSubCategory =
          !subCategoryFilter ||
          normalizeName(item.subCategoryName) ===
          normalizeName(subCategoryFilter);
        return matchesCategory && matchesSubCategory;
      }),
    [categoryFilter, items, subCategoryFilter],
  );

  const clearFilters = () => {
    setCategoryFilter("");
    setSubCategoryFilter("");
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSubCategoryFilter("");
  }, [categoryFilter]);

  useEffect(() => {
    const filtersChanged =
      previousFilters.current.categoryFilter !== categoryFilter ||
      previousFilters.current.subCategoryFilter !== subCategoryFilter;
    previousFilters.current = { categoryFilter, subCategoryFilter };
    if (!filtersChanged) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTestId("");
  }, [categoryFilter, subCategoryFilter]);

  /* ================= ADD ================= */

  const handleAdd = () => {
    if (!isValid) return;

    setFormAction((prev) => ({
      ...prev,
      tests: [
        ...prev.tests,
        {
          testId: Number(testId),
          percentage: Number(percentage),
        },
      ],
    }));

    setTestId("");
    setPercentage("");
  };

  /* ================= DELETE (FIXED) ================= */

  const handleDelete = (testId: number) => {
    setFormAction((prev) => ({
      ...prev,
      tests: prev.tests.filter((t) => t.testId !== testId),
    }));
  };

  /* ================= OPTIONS ================= */

  const options = filteredItems.map((t: Test) => ({
    value: String(t.id),
    label: t.name,
    renderLabel: (
      <div className="grid w-full gap-1 text-sm md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:items-center md:gap-3">
        <span className="font-semibold">{t.name}</span>
        <span className="w-fit whitespace-nowrap rounded-full bg-red-50 px-2 py-1 text-xs font-semibold text-red-600">
          {t.costPerUnit} EGP
        </span>
        <span className="text-gray-600">{t.note || "لا توجد ملاحظات"}</span>
      </div>
    ),
  }));

  /* ================= DISPLAY DATA ================= */

  const displayData = form.tests
    .map((item) => {
      const full = items.find((t: Test) => t.id === item.testId);
      if (!full) return null;

      return {
        ...full,
        percentage: item.percentage,
      };
    })
    .filter(Boolean) as (Test & { percentage: number })[];

  return (
    <>
      <div className="space-y-5 border border-gray-200 bg-white p-5 shadow-sm">
        <div className="rounded-lg border border-red-100 bg-red-50/40 p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-gray-900">فلترة الاختبارات</h3>
              <p className="mt-1 text-xs font-semibold text-gray-500">
                ظاهر {filteredItems.length} من {items.length} اختبار
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

          <div className="grid gap-3 md:grid-cols-2">
            <Dropdown
              label="التصنيف"
              placeholder="كل التصنيفات"
              options={categoryOptions}
              selected={categoryFilter}
              onSelect={(e) => {
                setCategoryFilter(e.value);
                setSubCategoryFilter("");
              }}
            />
            <Dropdown
              label="التصنيف الفرعي"
              placeholder="كل التصنيفات الفرعية"
              options={subCategoryOptions}
              selected={subCategoryFilter}
              onSelect={(e) => setSubCategoryFilter(e.value)}
              disabled={!categoryFilter}
            />
          </div>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col md:flex-row gap-4 flex-1">
            <div className="w-full md:w-1/2">
              <Dropdown
                label={"الاختبار"}
                placeholder={"اختر الاختبار"}
                options={options}
                selected={testId}
                onSelect={(e) => setTestId(e.value)}
                loading={loading}
              />
            </div>

            <div className="w-full md:w-1/2">
              <Input
                name=""
                label="نسبة الوحدة من الاختبار"
                type="number"
                value={percentage}
                onChange={(e) => setPercentage(e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-3">
          {onChooseFromMaster && (
            <button
              type="button"
              onClick={onChooseFromMaster}
              className="rounded-lg border border-blue-200 bg-blue-50 px-5 py-2 font-semibold text-blue-700 transition hover:bg-blue-100"
            >
              اختيار اختبار من البيانات الأساسية
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowQuickCreate(true)}
            className="rounded-lg border border-orange-200 bg-orange-50 px-5 py-2 font-semibold text-orange-700 transition hover:bg-orange-100"
          >
            + إضافة اختبار جديد غير موجود
          </button>
          <button
            type="button"
            onClick={handleAdd}
            disabled={!isValid}
            className={`px-6 py-2 transition
              ${isValid ? "text-red-600 hover:text-red-700" : "text-gray-400 cursor-not-allowed"}
            `}
          >
            + إضافة
          </button>
        </div>
        {error && (
          <p className="mt-2 text-sm font-semibold text-red-600">{error}</p>
        )}
      </div>
      <DisplayTests data={displayData} onDelete={handleDelete} onEdit={setEditingItem} />
      {(showQuickCreate || editingItem) && (
        <QuickCreateTestModal
          editItem={editingItem ?? undefined}
          onClose={() => { setShowQuickCreate(false); setEditingItem(null); }}
          onCreated={(createdTestId, createdPercentage) =>
            setFormAction((previous) => ({
              ...previous,
              tests: previous.tests.some((test) => test.testId === createdTestId)
                ? previous.tests.map((test) => test.testId === createdTestId ? { ...test, percentage: createdPercentage } : test)
                : [
                  ...previous.tests,
                  {
                    testId: createdTestId,
                    percentage: createdPercentage,
                  },
                ],
            }))
          }
        />
      )}
    </>
  );
}
