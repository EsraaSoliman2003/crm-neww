"use client";

import { default_image, card2BG } from "@/assets";
import CategoryFilter from "@/components/categoryFilter/CategoryFilter";
import EmptyState from "@/components/emptyState/EmptyState";
import Loader from "@/components/loader/Loader";
import Table from "@/components/table/Table";
import { MaterialsNumber } from "@/constants/constantsNumbers";
import { useAuth } from "@/context/AuthContext";
import { useCategoryFilter } from "@/hooks/useCategoryFilter";
import { useAppDispatch, useAppSelector } from "@/rtk/hooks";
import {
  approveMaterial,
  fetchUnapprovedMaterials,
} from "@/rtk/slices/materialsSlice";
import { fetchSubCategories } from "@/rtk/slices/subCategoriesSlice";
import { Check, LoaderCircle } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

const formatValidUntil = (date?: string | null) => {
  if (!date) return "-";

  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return "-";

  return parsedDate.toLocaleString("ar-EG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    // hour: "2-digit",
    // minute: "2-digit",
  });
};

export default function UnapprovedMaterialsPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { role } = useAuth();
  const { unapprovedData, unapprovedLoading, approvingId } = useAppSelector(
    (state) => state.materials,
  );
  const { data: categoriesWithSubCategories } = useAppSelector(
    (state) => state.subCategories,
  );

  useEffect(() => {
    if (role && !role.includes("ADMIN")) {
      router.replace("/");
      return;
    }

    if (role?.includes("ADMIN")) {
      dispatch(fetchSubCategories(MaterialsNumber));
      dispatch(fetchUnapprovedMaterials());
    }
  }, [dispatch, role, router]);
  const {
    search,
    setSearch,
    selectedCategory,
    setSelectedCategory,
    selectedSubCategory,
    setSelectedSubCategory,
    filteredData,
  } = useCategoryFilter(
    unapprovedData || [],
    "name",
    "categoryName",
    "subCategoryName",
  );

  const handleApprove = async (id: number) => {
    try {
      await dispatch(approveMaterial(id)).unwrap();
      toast.success("تم اعتماد الخامة بنجاح");
    } catch {
      toast.error("تعذر اعتماد الخامة، حاول مرة أخرى");
    }
  };

  if (!role?.includes("ADMIN")) return null;

  return (
    <div className="space-y-8 rounded-t-4xl bg-[#fff7f8] px-6 pt-4 shadow-[0_-8px_24px_-20px_rgba(127,29,29,0.24)] md:px-8 md:pt-5">
      <div className="space-y-2 rounded-b-3xl border-b border-orange-100/80 bg-linear-to-b from-orange-50/95 via-white/95 to-white/90 px-4 pb-5 pt-4 shadow-[0_10px_30px_-24px_rgba(154,52,18,0.45)]">
        <h1 className="text-xl font-bold md:text-2xl">اعتماد خامات الموردين</h1>
        <p className="text-sm text-gray-500">
          راجع الخامات التي أضافها الموردون واعتمد المناسب منها.
        </p>
      </div>

      {unapprovedLoading ? (
        <Loader />
      ) : unapprovedData.length ? (
        <Table
          data={filteredData}
          loading={unapprovedLoading}
          exportTitle="تقرير خامات الموردين غير المعتمدة"
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
          getRowKeyAction={(item) => `material-${item.id}`}
          columns={[
            {
              key: "id",
              header: "الرقم",
              render: (_, index) => index + 1,
            },
            {
              key: "image",
              header: "صورة الخامة",
              printable: false,
              render: (row) => (
                <div className="relative h-20 w-20 overflow-hidden rounded-lg">
                  <Image
                    src={row.image ?? default_image}
                    alt="صورة الخامة"
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </div>
              ),
            },
            { key: "name", header: "اسم الخامة" },
            { key: "supplierName", header: "المورد", render: (row) => row.supplierName || "-", filterable: true, },
            { key: "categoryName", header: "التصنيف العام", render: (row) => row.categoryName || "-", filterable: true, },
            { key: "subCategoryName", header: "تصنيف الخامة", render: (row) => row.subCategoryName || "-", filterable: true, filterDependsOn: "categoryName", },
            { key: "unitName", header: "الوحدة", render: (row) => row.unitName || "-", filterable: true, },
            { key: "price", header: "السعر", render: (row) => row.price ?? "-" },
            {
              key: "waste",
              header: "الهالك",
              render: (row) => `1.${((Number(row.waste) || 0) * 100).toFixed(0)}%`,
            },
            { key: "notes", header: "الملاحظات", render: (row) => row.notes || "-" },
            {
              key: "validUntil",
              header: "مدة الصلاحية",
              width: "180px",
              render: (row) => formatValidUntil(row.validUntil),
              exportValue: (row) => formatValidUntil(row.validUntil),
            },
            {
              key: "actions",
              header: "خيارات",
              printable: false,
              render: (row) => {
                const isApproving = approvingId === row.id;
                return (
                  <button
                    type="button"
                    onClick={() => handleApprove(row.id)}
                    disabled={isApproving}
                    className="inline-flex min-w-24 items-center justify-center gap-2 rounded-lg border border-green-600 bg-white px-4 py-2 text-sm font-bold text-green-600 transition hover:bg-green-50 hover:text-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isApproving ? (
                      <LoaderCircle size={17} className="animate-spin" />
                    ) : (
                      <Check size={17} />
                    )}
                    قبول
                  </button>
                );
              },
            },
          ]}
        />
      ) : (
        <EmptyState image={card2BG} title="لا توجد خامات في انتظار الاعتماد" />
      )}
    </div>
  );
}
