import Table from "@/components/table/Table";
import Dropdown from "@/components/dropdown/DropDown";
import Input from "@/components/form/Input";
import { useAppDispatch, useAppSelector } from "@/rtk/hooks";
import { fetchItems, Item } from "@/rtk/slices/itemSlice";

import { useEffect, useState } from "react";
import { CopyPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatProjectCost } from "@/lib/formatProjectCost";

type Option = {
  value: string;
  label: string;
};

type Props = {
  selectedItems: number[];
  setSelectedItems: React.Dispatch<React.SetStateAction<number[]>>;
  onToggle: (id: number) => void;
  selectedQuantities: Record<number, number>;
  onQuantityChange: (id: number, quantity: number) => void;
  currentItems: Item[];
  estimateId: number;
};

export default function ChooseItems({
  selectedItems,
  setSelectedItems,
  onToggle,
  selectedQuantities,
  onQuantityChange,
  currentItems,
  estimateId,
}: Props) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { data, loading } = useAppSelector((s) => s.items);
  const [filters, setFilters] = useState({
    search: "",
    category: "",
    subCategory: "",
  });
  const [selectedAnalysisStatus, setSelectedAnalysisStatus] = useState<Option>({
    value: "",
    label: "كل حالات التحليل",
  });

  // fetch items
  useEffect(() => {
    dispatch(fetchItems({ page: 1, pageSize: 1000 }));
  }, [dispatch]);

  // sync selected from current
  useEffect(() => {
    const ids = currentItems
      ?.filter((item) => item != null)
      .map((item) => item.id);

    setSelectedItems(ids);
  }, [currentItems, setSelectedItems]);

  const items = data.filter(Boolean);
  const categoryOptions = [
    { value: "", label: "كل التصنيفات العامة" },
    ...Array.from(
      new Map(
        items
          .map((item) => item.entityCategoryMapping?.category)
          .filter(Boolean)
          .map((category) => [
            String(category?.id),
            {
              value: String(category?.id),
              label: category?.name ?? "",
            },
          ]),
      ).values(),
    ),
  ];
  const subCategoryOptions = [
    { value: "", label: "كل التصنيفات الفرعية" },
    ...Array.from(
      new Map(
        items
          .filter(
            (item) =>
              filters.category === "" ||
              String(item.entityCategoryMapping?.category?.id) ===
              filters.category,
          )
          .map((item) => item.entityCategoryMapping?.subCategory)
          .filter(Boolean)
          .map((subCategory) => [
            String(subCategory?.id),
            {
              value: String(subCategory?.id),
              label: subCategory?.name ?? "",
            },
          ]),
      ).values(),
    ),
  ];
  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(filters.search.toLowerCase()) &&
      (filters.category === "" ||
        String(item.entityCategoryMapping?.category?.id) ===
        filters.category) &&
      (filters.subCategory === "" ||
        String(item.entityCategoryMapping?.subCategory?.id) ===
        filters.subCategory) &&
      (selectedAnalysisStatus.value === "" ||
        (selectedAnalysisStatus.value === "analyzed" && item.isAnalyzed) ||
        (selectedAnalysisStatus.value === "not-analyzed" && !item.isAnalyzed)),
  );
  const currentItemIds = new Set(currentItems.map((item) => item.id));
  const selectableItems = filteredItems.filter(
    (item) => !currentItemIds.has(item.id),
  );
  const selectedNewItemsCount = selectableItems.filter((item) =>
    selectedItems.includes(item.id),
  ).length;
  const displayedItems = [...selectableItems].sort(
    (first, second) =>
      Number(selectedItems.includes(second.id)) -
      Number(selectedItems.includes(first.id)),
  );

  return (
    <div className="space-y-4">
      <section className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 px-1">
          <div>
            <h3 className="font-bold text-gray-900">البنود المتاحة للاختيار</h3>
            <p className="text-xs text-gray-500">
              اختر البنود التي تريد إضافتها إلى المقايسة
            </p>
          </div>
          <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-700">
            {selectedNewItemsCount > 0
              ? `${selectedNewItemsCount} محدد من ${selectableItems.length}`
              : `${selectableItems.length} بند`}
          </span>
        </div>

        <Table
          fillViewport
          filterContent={
            <div className="grid gap-3 md:grid-cols-4">
              <Input
                name="search"
                type="text"
                value={filters.search}
                placeholder="بحث باسم البند"
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, search: event.target.value }))
                }
              />
              <Dropdown
                placeholder="اختر التصنيف العام"
                options={categoryOptions}
                selected={filters.category}
                onSelect={(option) =>
                  setFilters((prev) => ({
                    ...prev,
                    category: option.value,
                    subCategory: "",
                  }))
                }
              />
              <Dropdown
                placeholder="اختر التصنيف الفرعي"
                options={subCategoryOptions}
                selected={filters.subCategory}
                onSelect={(option) =>
                  setFilters((prev) => ({ ...prev, subCategory: option.value }))
                }
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
          }
          data={displayedItems}
          loading={loading}
          emptyText="لا توجد بنود أخرى متاحة للاختيار"
          getRowKeyAction={(item) => item.id}
          columns={[
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
                    checked={selectedItems.includes(row.id)}
                    onChange={() => onToggle(row.id)}
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
              render: (row) =>
                row.entityCategoryMapping?.category?.name || "-",
              filterable: true,
            },
            {
              key: "subCategory",
              header: "التصنيف الفرعي",
              width: "50px",
              className: "whitespace-normal! wrap-break-word! overflow-hidden",
              render: (row) =>
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
                const isSelected = selectedItems.includes(row.id);
                const quantity = selectedQuantities[row.id] ?? 1;

                return (
                  <div className="flex justify-center">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={isSelected ? quantity : ""}
                      disabled={!isSelected}
                      onChange={(event) =>
                        onQuantityChange(
                          row.id,
                          Number(event.target.value || 0),
                        )
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
                const quantity = selectedQuantities[row.id] ?? 0;
                const total = Number(row.cost ?? 0) * quantity;

                return (
                  <span className="font-semibold text-orange-700">
                    {formatProjectCost(total)}
                  </span>
                );
              },
            },
            {
              key: "isAnalyzed",
              header: "الحالة",
              width: "100px",
              className: "whitespace-nowrap!",
              render: (row) =>
                row.isAnalyzed ? (
                  <span className="font-medium text-green-600">
                    تم التحليل
                  </span>
                ) : (
                  <span className="font-medium text-orange-600">
                    لم يتم التحليل
                  </span>
                ),
            },
            {
              key: "similar",
              header: "بند شبيه",
              printable: false,
              render: (row) => (
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      `/items/${row.id}/create-similar?estimateId=${estimateId}&sourceAnalyzed=${row.isAnalyzed}`,
                    )
                  }
                  className="mx-auto flex min-w-fit items-center justify-center gap-2 rounded-lg border! border-orange-600 bg-orange-500! px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-orange-600 hover:shadow-md active:translate-y-0 active:scale-[0.98]"
                >
                  <CopyPlus size={17} strokeWidth={2.25} />
                  إضافة بند شبيه
                </button>
              ),
            },
          ]}
        />
      </section>
    </div>
  );
}
