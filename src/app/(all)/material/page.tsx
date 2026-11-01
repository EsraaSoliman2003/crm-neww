"use client";
import Button from "@/components/button/Button";
import { Suspense, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/rtk/hooks";
import Loader from "@/components/loader/Loader";
import EmptyState from "@/components/emptyState/EmptyState";
import { card2BG, default_image } from "@/assets";
import { confirmDelete } from "@/utils/confirmDelete";
import ButtonBar from "@/components/buttonBar/ButtonBar";
import { SquarePen, Trash2 } from "lucide-react";
import { deleteMaterial, fetchMaterials } from "@/rtk/slices/materialsSlice";
import { useAuth } from "@/context/AuthContext";
import { fetchSubCategories } from "@/rtk/slices/subCategoriesSlice";
import { MaterialsNumber } from "@/constants/constantsNumbers";
import { useCategoryFilter } from "@/hooks/useCategoryFilter";
import CategoryFilter from "@/components/categoryFilter/CategoryFilter";
import { Material } from "@/utils/dtos";
import Table from "@/components/table/Table";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { materialsItems } from "@/rtk/fetchSlice/thunks/fetchMaterials";

type MaterialTableRow = Material & {
  analysisSupplierMaterialId?: number;
  analysisSupplierName?: string;
  analysisSupplierPrice?: number;
};

function MaterialPageContent() {
  const { role } = useAuth();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const analysisItemId = Number(searchParams.get("analysisItemId"));
  const analysisMode = searchParams.get("analysisMode") === "edit" ? "edit" : "create";
  const { data, loading } = useAppSelector((s) => s.materials);
  const {
    data: materialsWithSuppliers,
    loading: supplierMaterialsLoading,
    error: supplierMaterialsError,
  } = useAppSelector((state) => state.matrialsItems);
  useEffect(() => {
    dispatch(fetchSubCategories(MaterialsNumber));
    dispatch(fetchMaterials());
    if (analysisItemId > 0) dispatch(materialsItems());
  }, [analysisItemId, dispatch]);
  const handleDelete = (id: number) => {
    confirmDelete(id, (id) => dispatch(deleteMaterial(Number(id))).unwrap());
  };
  const chooseForAnalysis = (materialId: number, supplierMaterialId: number) => {
    const params = new URLSearchParams({
      selectMaterial: String(materialId),
      selectSupplierMaterial: String(supplierMaterialId),
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
  } = useCategoryFilter(data || [], "name", "categoryName", "subCategoryName");

  const { data: categoriesWithSubCategories } = useAppSelector(
    (s) => s.subCategories,
  );

  const flattenItems = (data: Material[]) => {
    return data.map((item) => ({
      id: item.id,
      name: item.name,
      waste: item.waste,
      unitId: item.unitId,
      unitName: item.unitName,
      entityCategoryMappingId: item.entityCategoryMappingId,
      categoryName: item.categoryName,
      subCategoryName: item.subCategoryName,
      notes: item.notes,
    }));
  };
  const tableData: MaterialTableRow[] =
    analysisItemId > 0
      ? filteredData.flatMap((material) => {
        const suppliers =
          materialsWithSuppliers.find(
            (entry) => entry.material.id === material.id,
          )?.suppliers ?? [];
        if (!suppliers.length) return [material];

        return suppliers.map((supplier) => ({
          ...material,
          analysisSupplierMaterialId: supplier.supplierMaterialId,
          analysisSupplierName: supplier.name,
          analysisSupplierPrice: supplier.price,
        }));
      })
      : filteredData;
  return (
    <div className=" space-y-8 rounded-t-4xl bg-[#fff7f8] px-6 pt-4 shadow-[0_-8px_24px_-20px_rgba(127,29,29,0.24)] md:px-8 md:pt-5">
      <div className="space-y-5 rounded-b-3xl border-b border-orange-100/80 bg-linear-to-b from-orange-50/95 via-white/95 to-white/90 pb-5 pt-4 px-4 shadow-[0_10px_30px_-24px_rgba(154,52,18,0.45)]">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="text-right">
            <h1 className="text-xl md:text-2xl font-bold">الخامات</h1>
          </div>

          {analysisItemId <= 0 && (
            <div className="flex flex-wrap justify-end gap-3">
              {data.length > 0 && (
                <Button
                  text="إضافة خامات لموردين"
                  href={"/add-material-to-suppliers"}
                  border
                  className="px-4 md:px-5"
                />
              )}

              {role?.includes("ADMIN") && (
                <Button
                  text="التصنيفات"
                  href={"/material/subcategories"}
                  border
                />
              )}

              <Button
                text="+ اضافة خامة"
                href={"/material/add-material?mode=create"}
              />
            </div>
          )}
        </div>

        {/* button bar */}
        <ButtonBar title="تقرير الخامات" data={flattenItems(filteredData)} />
      </div>

      {analysisItemId > 0 && supplierMaterialsError && (
        <p role="alert" className="text-sm font-semibold text-red-600">
          تعذر تحميل ارتباطات الخامات بالموردين: {supplierMaterialsError}
        </p>
      )}

      {loading ? (
        <Loader />
      ) : data.length > 0 ? (
        <Table
          data={tableData}
          loading={loading || (analysisItemId > 0 && supplierMaterialsLoading)}
          exportTitle="تقرير الخامات"
          excelImportType={analysisItemId <= 0 ? "Material" : undefined}
          onExcelImportSuccess={async () => {
            await dispatch(fetchMaterials());
          }}
          excelTemplateColumns={[
            { header: "Material name", condition: "مطلوب" },
            { header: "Price", condition: "مطلوب رقم" },
            { header: "Waste rate", condition: "مطلوب رقم" },
            { header: "Notes", condition: "اختياري" },
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
              supPlaceHolder="اختر تصنيف الخامة"
              catPlaceHolder="اختر التصنيف العام"
            />
          }
          emptyText="لا توجد خامات مطابقة للفلاتر المحددة"
          getRowKeyAction={(item) =>
            `material-${item.id}-supplier-${item.analysisSupplierMaterialId ?? "none"}`
          }
          columns={[
            {
              key: "id",
              header: "الرقم",
              render: (_, index) => index + 1,
            },

            {
              key: "categoryName",
              header: "التصنيف العام",
              filterable: true,
            },

            {
              key: "subCategoryName",
              header: "تصنيف الخامة",
              render: (row) => row.subCategoryName || "-",
              filterable: true,
              filterDependsOn: "categoryName",
            },

            {
              key: "image",
              header: "صورة الخامة",
              printable: false,
              render: (row) => (
                <div className="relative w-20 h-20">
                  <Image
                    src={row.image ?? default_image}
                    alt="matrial-image"
                    fill
                    sizes="80px"
                    className=" object-cover"
                  />
                </div>
              ),
            },
            {
              key: "name",
              header: "اسم الخامة",
              filterable: true,
            },

            {
              key: "brand",
              header: "المصدر / الماركة",
              render: (row) => row.brand || "-",
              filterable: true,
            },

            {
              key: "unitName",
              header: "الوحدة",
              render: (row) => row.unitName || "-",
              filterable: true,
            },
            {
              key: "suppliers",
              header: "أسعار الموردين للوحدة",
              render: (row) => {
                if (analysisItemId > 0) {
                  if (!row.analysisSupplierMaterialId) {
                    return <span className="text-gray-400">لا يوجد مورد</span>;
                  }
                  return (
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <span className="font-medium">
                        {row.analysisSupplierName}
                      </span>
                      <span className="font-semibold text-green-700">
                        {row.analysisSupplierPrice}
                      </span>
                    </div>
                  );
                }

                const suppliers = row.suppliers || [];

                if (!suppliers.length)
                  return <span className="text-gray-400">-</span>;

                const visible = suppliers.slice(0, 3);

                const prices = suppliers.map((s) => s.price);
                const minPrice = Math.min(...prices);
                const maxPrice = Math.max(...prices);

                return (
                  <div className="flex flex-col gap-1">
                    {visible.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between gap-3 text-xs border-b border-gray-100 pb-1"
                      >
                        {/* الاسم + علامة الادمن */}
                        <div className="flex items-center gap-1">
                          <span className="font-medium">{s.supplierName}</span>

                          {!s.isAdmin && (
                            <span
                              title="Admin Supplier"
                              className="text-blue-600 text-[10px]"
                            >
                              ⭐
                            </span>
                          )}
                        </div>

                        {/* السعر مع تمييز */}
                        <span
                          className={`font-semibold ${s.price === minPrice
                            ? "text-green-600"
                            : s.price === maxPrice
                              ? "text-red-500"
                              : "text-gray-700"
                            }`}
                        >
                          {s.price}
                        </span>
                      </div>
                    ))}

                    {/* لو في أكتر من 3 */}
                    {suppliers.length > 3 && (
                      <span className="text-[10px] text-gray-400">
                        +{suppliers.length - 3} آخرين
                      </span>
                    )}
                  </div>
                );
              },
              exportValue: (row) => {
                if (analysisItemId > 0) {
                  return row.analysisSupplierMaterialId
                    ? `${row.analysisSupplierName} - ${row.analysisSupplierPrice}`
                    : "لا يوجد مورد";
                }
                const suppliers = row.suppliers || [];

                return suppliers
                  .slice(0, 3)
                  .map((s) => {
                    const admin = s.isAdmin ? "(Admin)" : "";
                    return `${s.supplierName}${admin} - ${s.price}`;
                  })
                  .join(" | ");
              },
            },

            {
              key: "waste",
              header: "الهالك",
              render: (row) => {
                const value = Number(row.waste) || 0;
                return `${(value * 100)}%`;
              },
            },

            {
              key: "notes",
              header: "الملاحظات",
              render: (row) => row.notes || "-",
              className:
                "whitespace-normal! min-w-[20vw]",
            },

            {
              key: "actions",
              printable: false,
              header: "خيارات",
              render: (row) => (
                <div className="flex items-center justify-center gap-3">
                  {analysisItemId > 0 && (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        if (row.analysisSupplierMaterialId) {
                          chooseForAnalysis(
                            row.id,
                            row.analysisSupplierMaterialId,
                          );
                        }
                      }}
                      className="whitespace-nowrap text-xs font-semibold text-blue-700 hover:text-blue-900 disabled:cursor-not-allowed disabled:text-gray-400"
                      disabled={
                        supplierMaterialsLoading ||
                        !row.analysisSupplierMaterialId
                      }
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
                        href={`/material/add-material?id=${row.id}&mode=edit`}
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
        <EmptyState image={card2BG} title="لا يوجد لديك خامات" />
      )}
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<Loader />}>
      <MaterialPageContent />
    </Suspense>
  );
}
