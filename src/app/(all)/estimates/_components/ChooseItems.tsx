import Input from "@/components/form/Input";
import Dropdown from "@/components/dropdown/DropDown";
import Table, { type Column } from "@/components/table/Table";
import { ItemsNumber } from "@/constants/constantsNumbers";
import { useAppDispatch, useAppSelector } from "@/rtk/hooks";
import { fetchItems, type Item } from "@/rtk/slices/itemSlice";
import { fetchSubCategories } from "@/rtk/slices/subCategoriesSlice";
import { RotateCcw, SlidersHorizontal } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { formatProjectCost } from "@/lib/formatProjectCost";

type SelectedEstimateItem = {
  itemId: number;
  quantity: number;
};

type Props = {
  selectedItems: SelectedEstimateItem[];
  onToggle: (id: number) => void;
  onQuantityChange: (id: number, quantity: number) => void;
};

type Option = {
  value: string;
  label: string;
};

const emptyOption: Option = { value: "", label: "" };

export default function ChooseItems({
  selectedItems,
  onToggle,
  onQuantityChange,
}: Props) {
  const dispatch = useAppDispatch();
  const { data: items, loading } = useAppSelector((s) => s.items);
  const { data: categories } = useAppSelector((s) => s.subCategories);

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Option>(emptyOption);
  const [selectedSubCategory, setSelectedSubCategory] =
    useState<Option>(emptyOption);
  const [selectedAnalysisStatus, setSelectedAnalysisStatus] =
    useState<Option>({
      value: "",
      label: "كل حالات التحليل",
    });

  useEffect(() => {
    dispatch(fetchItems({ page: 1, pageSize: 1000 }));
    dispatch(fetchSubCategories(ItemsNumber));
  }, [dispatch]);

  const selectedCategoryData = categories.find(
    (category) => String(category.categoryId) === selectedCategory.value,
  );

  const subCategoryOptions = (selectedCategoryData?.subCategories ?? []).map(
    (subCategory) => ({
      value: String(subCategory.subCategoryId),
      label: subCategory.subCategoryName,
    }),
  );

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (!item) return false;

      const itemName = String(item.name ?? "").toLocaleLowerCase("ar");
      const categoryName = String(
        item.entityCategoryMapping?.category?.name ?? "",
      );
      const subCategoryName = String(
        item.entityCategoryMapping?.subCategory?.name ?? "",
      );

      const matchesSearch =
        !search.trim() ||
        itemName.includes(search.trim().toLocaleLowerCase("ar"));
      const matchesCategory =
        !selectedCategory.value ||
        String(item.entityCategoryMapping?.category?.id ?? "") ===
        selectedCategory.value ||
        categoryName === selectedCategory.label;
      const matchesSubCategory =
        !selectedSubCategory.value ||
        String(item.entityCategoryMapping?.subCategory?.id ?? "") ===
        selectedSubCategory.value ||
        subCategoryName === selectedSubCategory.label;
      const matchesAnalysisStatus =
        selectedAnalysisStatus.value === "" ||
        (selectedAnalysisStatus.value === "analyzed" && item.isAnalyzed) ||
        (selectedAnalysisStatus.value === "not-analyzed" && !item.isAnalyzed);

      return (
        matchesSearch &&
        matchesCategory &&
        matchesSubCategory &&
        matchesAnalysisStatus
      );
    });
  }, [
    items,
    search,
    selectedAnalysisStatus.value,
    selectedCategory.label,
    selectedCategory.value,
    selectedSubCategory.label,
    selectedSubCategory.value,
  ]);

  const selectedItemMap = useMemo(
    () =>
      new Map(
        selectedItems.map((item) => [
          item.itemId,
          Math.max(item.quantity || 0, 0),
        ]),
      ),
    [selectedItems],
  );

  const selectedItemsData = useMemo(
    () => items.filter((item) => selectedItemMap.has(item.id)),
    [items, selectedItemMap],
  );
  const availableItems = useMemo(
    () => filteredItems.filter((item) => !selectedItemMap.has(item.id)),
    [filteredItems, selectedItemMap],
  );
  const selectedItemsTotal = selectedItemsData.reduce(
    (total, item) =>
      total + Number(item.cost ?? 0) * (selectedItemMap.get(item.id) ?? 0),
    0,
  );

  const itemColumns: Column<Item>[] = [
    {
      key: "select",
      header: "اختيار",
      width: "60px",
      printable: false,
      className: "whitespace-nowrap!",
      render: (row) => (
        <div className="flex items-center justify-center">
          <input
            type="checkbox"
            checked={selectedItemMap.has(row.id)}
            aria-label={
              selectedItemMap.has(row.id)
                ? `إزالة ${row.name} من البنود المختارة`
                : `إضافة ${row.name} إلى البنود المختارة`
            }
            onChange={() => onToggle(row.id)}
            onClick={(event) => event.stopPropagation()}
            className="h-4 w-4 accent-orange-500"
          />
        </div>
      ),
    },
    {
      key: "id",
      header: "الرقم",
      width: "10px",
      className: "whitespace-nowrap!",
      render: (_, index) => index + 1,
    },
    {
      key: "category",
      header: "التصنيف",
      width: "50px",
      className: "whitespace-normal! wrap-break-word! overflow-hidden",
      render: (row) => row.entityCategoryMapping?.category?.name || "-",
      exportValue: (row) => row.entityCategoryMapping?.category?.name || "-",
      filterable: true,
    },
    {
      key: "subCategory",
      header: "التصنيف الفرعي",
      width: "50px",
      className: "whitespace-normal! wrap-break-word! overflow-hidden",
      render: (row) => row.entityCategoryMapping?.subCategory?.name || "-",
      exportValue: (row) =>
        row.entityCategoryMapping?.subCategory?.name || "-",
      filterable: true,
      filterDependsOn: "category",
    },
    {
      key: "name",
      header: "اسم البند",
      width: "auto",
    },
    {
      key: "unit",
      header: "الوحدة",
      width: "50px",
      className: "whitespace-nowrap!",
      render: (row) => row.unit?.value || "-",
      filterable: true,
    },
    {
      key: "cost",
      header: "فئة البند (الشركة)",
      width: "100px",
      className: "whitespace-nowrap!",
      render: (row) => formatProjectCost(row.cost),
    },
    {
      key: "costAfterRate",
      header: "فئة البند (طبقا للتحليل و شاملة النسبة)",
      width: "150px",
      className: "whitespace-normal!",
      render: (row) => (
        <span className="font-semibold">
          {formatProjectCost(row.costAfterRate)}
        </span>
      ),
    },
    {
      key: "note",
      header: "ملاحظات",
      width: "100px",
      className: "whitespace-normal! wrap-break-word! overflow-hidden",
      truncateWords: 4,
      render: (row) => row.note || "-",
    },
    {
      key: "quantity",
      header: "الكمية",
      width: "100px",
      printable: false,
      className: "whitespace-nowrap!",
      render: (row) => {
        const isSelected = selectedItemMap.has(row.id);
        const quantity = selectedItemMap.get(row.id) ?? 0;

        return (
          <div className="flex justify-center">
            <input
              type="number"
              min="0"
              step="0.01"
              value={quantity || ""}
              disabled={!isSelected}
              aria-label={`كمية ${row.name}`}
              onChange={(event) =>
                onQuantityChange(row.id, Number(event.target.value || 0))
              }
              onClick={(event) => event.stopPropagation()}
              className="h-9 w-24 rounded-lg border border-gray-200 bg-white px-2 text-center text-sm outline-none transition focus:border-orange-400 focus:ring-1 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-gray-100"
              placeholder="0"
            />
          </div>
        );
      },
    },
    {
      key: "total",
      header: "الإجمالي",
      width: "110px",
      className: "whitespace-nowrap!",
      render: (row) => {
        const quantity = selectedItemMap.get(row.id) ?? 0;
        const total = Number(row.cost ?? 0) * quantity;

        return (
          <span className="font-semibold text-orange-700">
            {formatProjectCost(total)}
          </span>
        );
      },
    },
    {
      key: "status",
      header: "الحالة",
      width: "100px",
      className: "whitespace-nowrap!",
      render: (row) =>
        row.isAnalyzed ? (
          <span className="font-medium text-green-600">تم التحليل</span>
        ) : (
          <span className="font-medium text-orange-600">لم يتم التحليل</span>
        ),
    },
  ];

  const resetFilters = () => {
    setSearch("");
    setSelectedCategory(emptyOption);
    setSelectedSubCategory(emptyOption);
    setSelectedAnalysisStatus({
      value: "",
      label: "كل حالات التحليل",
    });
  };

  return (
    <div className="mt-6 space-y-5">
      {false && <div className="rounded-[28px] border border-rose-100/80 bg-white p-5 shadow-[0_22px_42px_-30px_rgba(136,19,55,0.28)]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-700">
              <SlidersHorizontal size={19} />
            </span>
            <div>
              <h2 className="font-black text-gray-900">اختيار البنود</h2>
              <p className="mt-0.5 text-xs font-semibold text-gray-400">
                فلتر البنود وحدد الكمية المطلوبة لكل بند داخل المقايسة
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={resetFilters}
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-bold text-gray-600 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700"
          >
            <RotateCcw size={16} />
            مسح الفلاتر
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Input
            name="item-search"
            type="text"
            value={search}
            placeholder="ابحث باسم البند..."
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-xl border-gray-200 bg-gray-50/70"
          />

          <Dropdown
            placeholder="اختر التصنيف العام"
            options={categories.map((category) => ({
              value: String(category.categoryId),
              label: category.categoryName,
            }))}
            selected={selectedCategory.value}
            onSelect={(option) => {
              setSelectedCategory(option);
              setSelectedSubCategory(emptyOption);
            }}
          />

          <Dropdown
            placeholder="اختر التصنيف الفرعي"
            options={subCategoryOptions}
            selected={selectedSubCategory.value}
            onSelect={setSelectedSubCategory}
            disabled={!selectedCategory.value}
          />

          <Dropdown
            placeholder="فلتر حالة التحليل"
            options={[
              { value: "", label: "كل حالات التحليل" },
              { value: "analyzed", label: "تم التحليل" },
              { value: "not-analyzed", label: "لم يتم التحليل" },
            ]}
            selected={selectedAnalysisStatus.value}
            onSelect={setSelectedAnalysisStatus}
          />
        </div>
      </div>}

      <section className="space-y-4 rounded-[28px] border border-emerald-100 bg-white p-5 shadow-[0_22px_42px_-30px_rgba(16,185,129,0.18)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-gray-900">البنود المختارة</h2>
            <p className="mt-1 text-xs font-semibold text-gray-500">
              عدّل الكمية أو أزل البند من المقايسة مباشرة من الجدول
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
              {selectedItemsData.length} بند
            </span>
            <span className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-700">
              الإجمالي: {formatProjectCost(selectedItemsTotal)}
            </span>
          </div>
        </div>

        <Table
          data={selectedItemsData}
          loading={loading}
          emptyText="لم يتم اختيار أي بنود بعد"
          getRowKeyAction={(item) => item.id}
          filterStateId="estimate-selected-items"
          exportTitle="البنود المختارة في المقايسة"
          tableClassName="min-w-[1450px]"
          columns={itemColumns}
        />
      </section>

      <div className="rounded-[28px] border border-rose-100/80 bg-white p-4 shadow-[0_22px_42px_-30px_rgba(136,19,55,0.28)]">
        <div className="mb-3 flex items-center justify-between gap-3 px-1">
          <h3 className="text-base font-black text-gray-900">
            بنود أخرى متاحة
          </h3>
          <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700">
            {availableItems.length} بند
          </span>
        </div>

        <div className="rounded-2xl border border-gray-200">
          <Table
          fillViewport
            data={availableItems}
            filterContent={
              <div className="space-y-4">
                <div className="flex justify-end">
                  <button type="button" onClick={resetFilters} className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-bold text-gray-600 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700">
                    <RotateCcw size={16} />
                    مسح الفلاتر
                  </button>
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                  <Input name="item-search" type="text" value={search} placeholder="ابحث باسم البند..." onChange={(e) => setSearch(e.target.value)} className="rounded-xl border-gray-200 bg-gray-50/70" />
                  <Dropdown placeholder="اختر التصنيف العام" options={categories.map((category) => ({ value: String(category.categoryId), label: category.categoryName }))} selected={selectedCategory.value} onSelect={(option) => { setSelectedCategory(option); setSelectedSubCategory(emptyOption); }} />
                  <Dropdown placeholder="اختر التصنيف الفرعي" options={subCategoryOptions} selected={selectedSubCategory.value} onSelect={setSelectedSubCategory} disabled={!selectedCategory.value} />
                  <Dropdown placeholder="فلتر حالة التحليل" options={[{ value: "", label: "كل حالات التحليل" }, { value: "analyzed", label: "تم التحليل" }, { value: "not-analyzed", label: "لم يتم التحليل" }]} selected={selectedAnalysisStatus.value} onSelect={setSelectedAnalysisStatus} />
                </div>
              </div>
            }
            loading={loading}
            emptyText="لا توجد بنود"
            getRowKeyAction={(item) => item.id}
            tableClassName="min-w-[1450px]"
            filterStateId="estimate-available-items"
            exportTitle="البنود الأخرى المتاحة للمقايسة"
            columns={itemColumns}
          />
        </div>
      </div>
    </div>
  );
}
