"use client";
import Button from "@/components/button/Button";
import React, { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/rtk/hooks";
import Loader from "@/components/loader/Loader";
import EmptyState from "@/components/emptyState/EmptyState";
import { card2BG } from "@/assets";
import { confirmDelete } from "@/utils/confirmDelete";
import ButtonBar from "@/components/buttonBar/ButtonBar";
import { useRouter } from "next/navigation";
import { Eye, Pencil, Trash2, Mail, MessageCircle, Phone } from "lucide-react";
import { deleteSupplier, fetchSuppliers } from "@/rtk/slices/suppliersSlice";
import CategoryFilter from "@/components/categoryFilter/CategoryFilter";
import { fetchSubCategories } from "@/rtk/slices/subCategoriesSlice";
import { SuppliersNumber } from "@/constants/constantsNumbers";
import { useCategoryFilter } from "@/hooks/useCategoryFilter";
import { Supplier } from "@/utils/dtos";
import Table from "@/components/table/Table";

export default function Page() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { data, loading } = useAppSelector((s) => s.suppliers);
  useEffect(() => {
    dispatch(fetchSuppliers());
    dispatch(fetchSubCategories(SuppliersNumber));
  }, [dispatch]);

  const handleDelete = (id: number) => {
    confirmDelete(id, (id) => dispatch(deleteSupplier(Number(id))).unwrap());
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

  const flattenItems = (data: Supplier[]) => {
    return data.map((item) => ({
      id: item.id,
      name: item.name,
      email: item.email,
      phoneNumber: item.phoneNumber,
      password: item.password,
      countryCode: item.countryCode,
      entityCategoryMappingId: item.entityCategoryMappingId,
      categoryName: item.categoryName,
      brand: item.brand,
      materials: item.materials,
    }));
  };

  return (
    <div className="space-y-8">
      <div className=" space-y-5 rounded-b-3xl border-b border-orange-100/80 bg-linear-to-b from-orange-50/95 via-white/95 to-white/90 px-6 pb-5 pt-4 shadow-[0_10px_30px_-24px_rgba(154,52,18,0.45)] md:px-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="text-right">
            <h1 className="text-xl md:text-2xl font-bold">الموردين</h1>
          </div>

          {/* Supplier sub-categories are no longer used, so their management
              page (/suppliers/subcategories) isn't linked from here. */}
          <div className="flex gap-3">
            <Button text="+ اضافة مورد" href={"/suppliers/add-supplier"} />
          </div>
        </div>

        {/* button bar */}
        <ButtonBar title="تقرير الموردين" data={flattenItems(filteredData)} />
      </div>

      {loading ? (
        <Loader />
      ) : data.length > 0 ? (
        <Table
          data={filteredData}
          filterContent={
            <CategoryFilter
              search={search}
              setSearchAction={setSearch}
              selectedCategory={selectedCategory}
              setSelectedCategoryAction={setSelectedCategory}
              selectedSubCategory={selectedSubCategory}
              setSelectedSubCategoryAction={setSelectedSubCategory}
              categories={categoriesWithSubCategories}
              catPlaceHolder="اختر التصنيف العام"
              hideSubCategory
            />
          }
          loading={loading}
          emptyText="لا توجد موردين مطابقين للفلاتر المحددة"
          getRowKeyAction={(item) => item.id}
          onRowClickAction={(row) => router.push(`/suppliers/${row.id}`)}
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
              key: "name",
              header: "المورد",
              width: "auto",
              filterable: true,
            },

            {
              key: "brand",
              header: "المصدر / الماركة",
              filterable: true,
              render: (row) => row.brand || "-",
            },

            {
              key: "email",
              header: "البريد الإلكترونى",
              render: (row) => row.email || "-",
            },

            {
              key: "phoneNumber",
              header: "رقم الهاتف",
              render: (row) => row.phoneNumber || "-",
            },

            {
              key: "contact",
              header: "التواصل",
              render: (row) => {
                const phone = (row.phoneNumber || "").replace(/\D/g, "");
                const whatsappNumber = `${row.countryCode || ""}${phone}`.replace(/\D/g, "");

                return (
                  <div
                    className="flex items-center justify-center gap-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Email */}
                    <a
                      href={row.email ? `mailto:${row.email}` : undefined}
                      onClick={(e) => {
                        if (!row.email) e.preventDefault();
                      }}
                      title="إرسال بريد إلكتروني"
                      aria-label="إرسال بريد إلكتروني"
                      className={`transition-colors ${row.email
                          ? "text-blue-500 hover:text-blue-700"
                          : "cursor-not-allowed text-gray-300"
                        }`}
                    >
                      <Mail size={19} />
                    </a>

                    {/* WhatsApp */}
                    <a
                      href={
                        whatsappNumber
                          ? `https://wa.me/${whatsappNumber}`
                          : undefined
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => {
                        if (!whatsappNumber) e.preventDefault();
                      }}
                      title="مراسلة واتساب"
                      aria-label="مراسلة واتساب"
                      className={`transition-colors ${whatsappNumber
                          ? "text-green-500 hover:text-green-700"
                          : "cursor-not-allowed text-gray-300"
                        }`}
                    >
                      <MessageCircle size={19} />
                    </a>

                    {/* Phone Call */}
                    <a
                      href={
                        whatsappNumber
                          ? `tel:+${whatsappNumber}`
                          : undefined
                      }
                      onClick={(e) => {
                        if (!whatsappNumber) e.preventDefault();
                      }}
                      title="اتصال بالمورد"
                      aria-label="اتصال بالمورد"
                      className={`transition-colors ${whatsappNumber
                          ? "text-orange-500 hover:text-orange-700"
                          : "cursor-not-allowed text-gray-300"
                        }`}
                    >
                      <Phone size={19} />
                    </a>
                  </div>
                );
              },
            },

            {
              key: "actions",
              header: "خيارات",
              render: (row) => (
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(
                        `/suppliers/add-supplier?mode=edit&id=${row.id}`,
                      );
                    }}
                    className="text-blue-500 transition-colors hover:text-blue-700"
                    aria-label="تعديل المورد"
                  >
                    <Pencil size={18} />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/suppliers/${row.id}`);
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <Eye size={18} />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(row.id);
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
      ) : (
        <EmptyState image={card2BG} title="لا يوجد موردين" />
      )}
    </div>
  );
}
