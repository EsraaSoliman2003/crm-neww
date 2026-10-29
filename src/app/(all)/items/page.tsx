"use client";

import Button from "@/components/button/Button";
import React, { useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/rtk/hooks";
import Loader from "@/components/loader/Loader";
import EmptyState from "@/components/emptyState/EmptyState";
import { card2BG } from "@/assets";
import { confirmDelete } from "@/utils/confirmDelete";
import ButtonBar from "@/components/buttonBar/ButtonBar";
import { Check, Percent, SquarePen, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";

import {
  deleteItem,
  fetchItems,
  Item,
  setItemAnalyzed,
} from "@/rtk/slices/itemSlice";
import { toast } from "sonner";
import Link from "next/link";
import { fetchSubCategories } from "@/rtk/slices/subCategoriesSlice";
import { ItemsNumber } from "@/constants/constantsNumbers";
import { useCategoryFilter } from "@/hooks/useCategoryFilter";
import CategoryFilter from "@/components/categoryFilter/CategoryFilter";
import Table from "@/components/table/Table";
import Dropdown from "@/components/dropdown/DropDown";
import { formatProjectCost } from "@/lib/formatProjectCost";
import Modal from "@/components/modal/Modal";

type Option = {
  value: string;
  label: string;
};

type RateControlPosition = {
  left: number;
  top?: number;
  bottom?: number;
};

function RateAdjustmentControl({
  percentage,
  onApply,
  onReset,
}: {
  percentage: number | null;
  onApply: (value: number) => void;
  onReset: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [position, setPosition] = useState<RateControlPosition>({ left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (
        target instanceof Node &&
        !triggerRef.current?.contains(target) &&
        !dropdownRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    const closeOnScroll = () => setOpen(false);
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", closeOnScroll, true);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", closeOnScroll, true);
    };
  }, [open]);

  const toggleDropdown = () => {
    if (open) {
      setOpen(false);
      return;
    }

    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const width = Math.min(256, window.innerWidth - 16);
    const height = 170;
    const left = Math.min(
      Math.max(8, rect.right - width),
      window.innerWidth - width - 8,
    );
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    setPosition(
      spaceBelow < height && spaceAbove > spaceBelow
        ? { left, bottom: window.innerHeight - rect.top + 8 }
        : { left, top: rect.bottom + 8 },
    );
    setOpen(true);
  };

  const parsedDraft = draft.trim() === "" ? NaN : Number(draft);
  const canApply = Number.isFinite(parsedDraft) && parsedDraft >= 0;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={
          percentage === null
            ? "إضافة نسبة لسعر البند"
            : `تعديل النسبة المضافة: ${percentage}%`
        }
        aria-expanded={open}
        title={
          percentage === null
            ? "إضافة نسبة لسعر البند"
            : `النسبة المضافة: ${percentage}%`
        }
        onClick={toggleDropdown}
        className={`relative !m-0.5 !h-7 !w-7 !min-h-0 !min-w-0 !shrink-0 !flex-none !p-0 flex items-center justify-center rounded-lg border transition-all ${
          percentage === null
            ? "border-gray-300 bg-white text-gray-500 hover:border-main/30 hover:bg-white hover:text-main"
            : "border-main/30 bg-main/10 text-main"
        }`}
      >
        <Percent size={15} strokeWidth={2.2} aria-hidden="true" />
      </button>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: "fixed",
              left: position.left,
              ...(position.top !== undefined
                ? { top: position.top }
                : { bottom: position.bottom }),
            }}
            className="z-[9999] w-64 max-w-[calc(100vw-16px)] rounded-xl border border-gray-200 bg-white p-3 text-right text-sm font-normal text-gray-800 shadow-xl"
          >
            <label
              htmlFor="item-cost-percentage"
              className="mb-2 block font-medium"
            >
              النسبة المضافة (%)
            </label>
            <input
              id="item-cost-percentage"
              type="number"
              min="0"
              step="any"
              inputMode="decimal"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="مثال: 20"
              className="h-10 w-full rounded-lg border border-gray-300 px-3 text-right outline-none focus:border-main focus:ring-2 focus:ring-main/15"
            />
            <div className="mt-3 flex items-center justify-between gap-2">
              {percentage !== null ? (
                <button
                  type="button"
                  onClick={() => {
                    setDraft("");
                    onReset();
                    setOpen(false);
                  }}
                  className="rounded-lg px-3 py-2 text-red-600 transition hover:bg-red-50"
                >
                  مسح النسبة
                </button>
              ) : (
                <span />
              )}
              <button
                type="button"
                disabled={!canApply}
                onClick={() => {
                  if (!canApply) return;
                  setDraft(String(parsedDraft));
                  onApply(parsedDraft);
                  setOpen(false);
                }}
                className="rounded-lg bg-main px-4 py-2 text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                تطبيق
              </button>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

export default function Page() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const totalsRef = useRef<HTMLElement>(null);
  const [appliedPercentage, setAppliedPercentage] = useState<number | null>(
    null,
  );

  const {
    data: items,
    loading,
    updatingAnalysisIds,
  } = useAppSelector((s) => s.items);
  const [analysisItemId, setAnalysisItemId] = useState<number | null>(null);
  const analysisItem = items.find((item) => item.id === analysisItemId);
  const isUpdatingAnalysis =
    analysisItemId !== null && updatingAnalysisIds.includes(analysisItemId);

  const closeAnalysisModal = () => {
    if (!isUpdatingAnalysis) setAnalysisItemId(null);
  };

  useEffect(() => {
    dispatch(fetchItems({ page: 1, pageSize: 1000 }));
    dispatch(fetchSubCategories(ItemsNumber));
  }, [dispatch]);

  const handleDelete = (id: number) => {
    confirmDelete(id, (id) => dispatch(deleteItem(Number(id))).unwrap());
  };

  const handleAnalysisStatusChange = async (item: Item) => {
    const result = await dispatch(
      setItemAnalyzed({ id: item.id, isAnalyzed: !item.isAnalyzed }),
    );
    if (setItemAnalyzed.fulfilled.match(result)) {
      setAnalysisItemId(null);
      toast.success(
        result.payload.isAnalyzed
          ? "تم تعيين البند كمحلل"
          : "تم تغيير حالة البند إلى غير محلل",
      );
    }
  };

  const {
    search,
    setSearch,
    selectedCategory,
    setSelectedCategory,
    selectedSubCategory,
    setSelectedSubCategory,
    filteredData,
  } = useCategoryFilter(items || [], "name", "categoryName", "subCategoryName");
  const [selectedAnalysisStatus, setSelectedAnalysisStatus] = useState<Option>({
    value: "",
    label: "كل حالات التحليل",
  });

  const { data: categoriesWithSubCategories } = useAppSelector(
    (s) => s.subCategories,
  );

  const filteredItems = filteredData.filter(
    (item) =>
      selectedAnalysisStatus.value === "" ||
      (selectedAnalysisStatus.value === "analyzed" && item.isAnalyzed) ||
      (selectedAnalysisStatus.value === "not-analyzed" && !item.isAnalyzed),
  );

  const getDisplayedCostAfterRate = (item: Item) => {
    if (appliedPercentage === null) return item.costAfterRate;

    const cost = Number(item.cost);
    return Number.isFinite(cost)
      ? cost * (1 + appliedPercentage / 100)
      : item.costAfterRate;
  };

  const flattenItems = (items: Item[]) => {
    return items.map((item) => ({
      id: item.id,
      name: item.name,
      unitName: item.unit?.value,
      categoryName: item.entityCategoryMapping?.category.name,
      subCategoryName: item.entityCategoryMapping?.subCategory.name,
      cost: item.cost,
      priceAfterCost: item.costAfterRate,
      note: item.note,
    }));
  };
  return (
    <div className="space-y-2">
      <div className=" space-y-1 border-b border-orange-100 bg-white px-6 py-1  md:px-8">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold">البنود</h1>

          <div className="flex gap-2">
            <Button text="التصنيفات" href="/items/subcategories" border />
            <Button text="+ اضافة بند" href="/items/add-item" />
          </div>
        </div>

        <ButtonBar title="تقرير الأصناف" data={flattenItems(filteredItems)} />
      </div>

      {loading ? (
        <Loader />
      ) : items.length > 0 ? (
        <div className="space-y-3">
          <Table
            viewportFooterRef={totalsRef}
            data={filteredItems}
            exportTitle="تقرير البنود"
            excelImportType="Item"
            onExcelImportSuccess={async () => {
              dispatch(fetchItems({ page: 1, pageSize: 500000 }));
            }}
            excelTemplateColumns={[
              { header: "Item name", condition: "مطلوب" },
              { header: "Cost", condition: "مطلوب رقم" },
              { header: "Cost after rate", condition: "مطلوب رقم" },
              { header: "Note", condition: "اختياري" },
            ]}
            filterContent={
              <div className="space-y-4">
                <CategoryFilter
                  search={search}
                  setSearchAction={setSearch}
                  selectedCategory={selectedCategory}
                  setSelectedCategoryAction={setSelectedCategory}
                  selectedSubCategory={selectedSubCategory}
                  setSelectedSubCategoryAction={setSelectedSubCategory}
                  categories={categoriesWithSubCategories}
                  catPlaceHolder="اختر التصنيف العام"
                  supPlaceHolder="اختر التصنيف الفرعي"
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
            loading={loading}
            emptyText="لا توجد بنود مطابقة للفلاتر المحددة"
            tableClassName="xl:table-auto!"
            cellClassName="p-1!"
            headerClassName="[&_th]:p-1!"
            getRowKeyAction={(item) => item.id}
            onRowClickAction={(row) => router.push(`/items/${row.id}`)}
            columns={[
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
                className:
                  "whitespace-normal! wrap-break-word! overflow-hidden",
                render: (row) =>
                  row.entityCategoryMapping?.category?.name || "-",
                exportValue: (row) =>
                  row.entityCategoryMapping?.category?.name || "-",
                filterable: true,
              },

              {
                key: "subCategory",
                header: "التصنيف الفرعي",
                width: "50px",
                className:
                  "whitespace-normal! wrap-break-word! overflow-hidden",
                render: (row) =>
                  row.entityCategoryMapping?.subCategory?.name || "-",
                exportValue: (row) =>
                  row.entityCategoryMapping?.subCategory?.name || "-",
                filterable: true,
                filterDependsOn: "category" as const,
              },
              {
                key: "name",
                header: "اسم البند",
                width: "auto",
                filterable: true,
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
                showTotal: true
              },

              {
                key: "costAfterRate",
                header: "فئة البند (طبقا للتحليل و شاملة النسبة)",
                width: "150px",
                className: "whitespace-normal!",
                headerAction: (
                  <RateAdjustmentControl
                    percentage={appliedPercentage}
                    onApply={setAppliedPercentage}
                    onReset={() => setAppliedPercentage(null)}
                  />
                ),
                render: (row) => (
                  <span className="font-semibold">
                    {formatProjectCost(getDisplayedCostAfterRate(row))}
                  </span>
                ),
                exportValue: (row) => getDisplayedCostAfterRate(row),
                showTotal: true,
                totalValue: (rows) =>
                  rows.reduce((total, row) => {
                    const value = Number(getDisplayedCostAfterRate(row));
                    return Number.isFinite(value) ? total + value : total;
                  }, 0),
              },

              {
                key: "note",
                header: "ملاحظات",
                width: "100px",
                className:
                  "whitespace-normal! wrap-break-word! overflow-hidden",
                truncateWords: 4,
              },

              {
                key: "analysis",
                header: "تحليل",
                width: "100px",
                className: "whitespace-nowrap!",
                printable: false,
                render: (row) => (
                  <div className="flex items-center justify-center gap-1.5">
                    <span
                      role="img"
                      aria-label={
                        row.isAnalyzed ? "تم التحليل" : "لم يتم التحليل"
                      }
                      title={row.isAnalyzed ? "تم التحليل" : "لم يتم التحليل"}
                      className={
                        row.isAnalyzed ? "text-green-600" : "text-orange-600"
                      }
                    >
                      {row.isAnalyzed ? (
                        <Check size={18} aria-hidden="true" />
                      ) : (
                        <X size={18} aria-hidden="true" />
                      )}
                    </span>
                    <button
                      type="button"
                      aria-haspopup="dialog"
                      aria-label={`تغيير حالة التحليل: ${row.name}`}
                      title="تغيير حالة التحليل"
                      onClick={(event) => {
                        event.stopPropagation();
                        setAnalysisItemId(row.id);
                      }}
                      className="rounded p-1 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500"
                    >
                      <SquarePen size={16} aria-hidden="true" />
                    </button>
                  </div>
                ),
              },

              {
                key: "actions",
                header: "خيارات",
                width: "1%",
                className: "whitespace-nowrap!",
                printable: false,
                render: (row) => (
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/items/${row.id}/edit`);
                      }}
                      className="text-green-600 hover:text-green-700"
                    >
                      <SquarePen size={18} />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(Number(row.id));
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
      ) : (
        <EmptyState image={card2BG} title="لا يوجد أصناف" />
      )}
      <Modal
        open={Boolean(analysisItem)}
        onClose={closeAnalysisModal}
        title="حالة تحليل البند"
      >
        {analysisItem && (
          <div
            className="space-y-5"
            role="dialog"
            aria-modal="true"
            aria-label="حالة تحليل البند"
          >
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <p className="max-h-24 overflow-y-auto break-words text-sm font-semibold text-gray-800">
                {analysisItem.name}
              </p>
              <div className="mt-3 flex items-center gap-2 text-xs">
                <span className="text-gray-500">الحالة الحالية</span>
                <span
                  className={`rounded-full px-2.5 py-1 font-medium ${analysisItem.isAnalyzed
                    ? "bg-green-100 text-green-700"
                    : "bg-orange-100 text-orange-700"
                    }`}
                >
                  {analysisItem.isAnalyzed ? "تم التحليل" : "لم يتم التحليل"}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                text="إغلاق"
                border
                disabled={isUpdatingAnalysis}
                onClick={closeAnalysisModal}
              />
              <Button
                text={analysisItem.isAnalyzed ? "إلغاء التحليل" : "تعيين كمحلل"}
                loading={isUpdatingAnalysis}
                onClick={() => {
                  void handleAnalysisStatusChange(analysisItem);
                }}
              />
            </div>
            {!analysisItem.isAnalyzed && !isUpdatingAnalysis && (
              <div className="border-t border-gray-100 pt-3 text-center">
                <Link
                  href={`/items/${analysisItem.id}/analyze`}
                  className="text-sm font-medium text-orange-600 underline-offset-4 hover:text-orange-700 hover:underline"
                >
                  فتح صفحة تحليل البند
                </Link>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
