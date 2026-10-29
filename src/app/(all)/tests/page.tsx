"use client";

import Button from "@/components/button/Button";
import React, { useEffect } from "react";
import { Suspense } from "react";
import { useAppDispatch, useAppSelector } from "@/rtk/hooks";
import Loader from "@/components/loader/Loader";
import EmptyState from "@/components/emptyState/EmptyState";
import { card2BG } from "@/assets";
import { confirmDelete } from "@/utils/confirmDelete";
import ButtonBar from "@/components/buttonBar/ButtonBar";
import { SquarePen, Trash2 } from "lucide-react";
import { deleteTest, fetchTests } from "@/rtk/slices/testsSlice";
import { useAuth } from "@/context/AuthContext";

import { fetchSubCategories } from "@/rtk/slices/subCategoriesSlice";
import { TestsNumber } from "@/constants/constantsNumbers";
import { useCategoryFilter } from "@/hooks/useCategoryFilter";
import CategoryFilter from "@/components/categoryFilter/CategoryFilter";
import { Test } from "@/utils/dtos";
import Table from "@/components/table/Table";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function TestsPageContent() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const analysisItemId = Number(searchParams.get("analysisItemId"));
  const analysisMode = searchParams.get("analysisMode") === "edit" ? "edit" : "create";
  const { role } = useAuth();
  const { data: items, loading } = useAppSelector((s) => s.tests);
  useEffect(() => {
    dispatch(fetchTests());
    dispatch(fetchSubCategories(TestsNumber));
  }, [dispatch]);

  const handleDelete = (id: number) => {
    confirmDelete(id, (id) => dispatch(deleteTest(Number(id))).unwrap());
  };
  const chooseForAnalysis = (testId: number) => {
    const params = new URLSearchParams({
      selectTest: String(testId),
      ...(analysisMode === "edit" ? { mode: "edit" } : {}),
    });
    router.push(`/items/${analysisItemId}/analyze?${params.toString()}`);
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

  const { data: categoriesWithSubCategories } = useAppSelector(
    (s) => s.subCategories,
  );

  const flattenItems = (items: Test[]) => {
    return items.map((item) => ({
      id: item.id,
      name: item.name,
      costPerUnit: item.costPerUnit,
      note: item.note,
      entityCategoryMappingId: item.entityCategoryMappingId,
      categoryName: item.categoryName,
      subCategoryName: item.subCategoryName,
    }));
  };

  return (
    <div className="space-y-8">
      <div className="-mx-6 space-y-5 rounded-b-3xl border-b border-orange-100/80 bg-linear-to-b from-orange-50/95 via-white/95 to-white/90 px-6 pb-5 pt-4 shadow-[0_10px_30px_-24px_rgba(154,52,18,0.45)] md:-mx-8 md:px-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="text-right">
            <h1 className="text-xl md:text-2xl font-bold">الاختبارات</h1>
          </div>

          {analysisItemId <= 0 && (
            <div className="flex gap-3">
              {role?.includes("ADMIN") && (
                <Button text="التصنيفات" href={"/tests/subcategories"} border />
              )}
              <Button
                text="+ اضافة اختبار"
                href={"/tests/add-test?mode=create"}
              />
            </div>
          )}
        </div>

        {/* Button Bar */}
        <ButtonBar title="تقرير الاختبارات" data={flattenItems(filteredData)} />
      </div>

      {loading ? (
        <Loader />
      ) : items.length > 0 ? (
        <Table
          data={filteredData}
          exportTitle="تقرير الاختبارات"
          excelImportType={analysisItemId <= 0 ? "Test" : undefined}
          onExcelImportSuccess={async () => {
            dispatch(fetchTests());
          }}
          excelTemplateColumns={[
            { header: "Test name", condition: "مطلوب" },
            { header: "Price", condition: "مطلوب رقم" },
            { header: "Note", condition: "اختياري" },
          ]}
          filterContent={
            <CategoryFilter
              search={search}
              setSearchAction={setSearch}
              selectedCategory={selectedCategory}
              setSelectedCategoryAction={setSelectedCategory}
              selectedSubCategory={selectedSubCategory}
              setSelectedSubCategoryAction={setSelectedSubCategory}
              categories={categoriesWithSubCategories}
              supPlaceHolder="اختر تصنيف الاختبار"
              catPlaceHolder="اختر التصنيف العام"
            />
          }
          loading={loading}
          emptyText="لا توجد اختبارات مطابقة للفلاتر المحددة"
          getRowKeyAction={(item) => item.id}
          columns={[
            {
              key: "id",
              header: "الرقم",
              render: (_, index) => index + 1,
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
              filterDependsOn: "categoryName",
            },

            {
              key: "name",
              header: "اسم الاختبار",
              filterable: true,
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
              className:
                "whitespace-normal! min-w-[35vw]",
            },
            {
              key: "actions",
              header: "خيارات",
              printable: false,
              render: (row) => (
                <div className="flex items-center justify-center gap-3">
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
                      <Link
                        href={`/tests/add-test?id=${row.id}&mode=edit`}
                        className="text-green-600"
                      >
                        <SquarePen size={18} />
                      </Link>
                    </>
                  )}
                </div>
              ),
            },
          ]}
        />
      ) : (
        <EmptyState image={card2BG} title="لا يوجد اختبارات" />
      )}
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<Loader />}>
      <TestsPageContent />
    </Suspense>
  );
}
