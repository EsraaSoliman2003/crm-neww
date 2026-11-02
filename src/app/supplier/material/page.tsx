"use client";
import Button from "@/components/button/Button";
import React, { useCallback, useEffect, useState } from "react";
import { useAppDispatch } from "@/rtk/hooks";
import Loader from "@/components/loader/Loader";
import EmptyState from "@/components/emptyState/EmptyState";
import { card2BG } from "@/assets";
import {
  fetchSupplierMaterialsBySupplier,
  SupplierMaterialBySupplier,
} from "@/rtk/slices/supplierMaterialSlice";
import { useAuth } from "@/context/AuthContext";
import instance from "@/lib/axios";
import EditPriceModal from "./_components/EditPriceModal";
import {
  openPriceInvoiceWindow,
  printPriceInvoice,
} from "./_components/printPriceInvoice";
import Table from "@/components/table/Table";

// every material in the system, with the lowest approved price and this supplier's own price
type SystemMaterial = {
  materialId: number;
  materialName: string;
  materialImage: string | null;
  brand: string | null;
  categoryName: string | null;
  subCategoryName: string | null;
  unitName: string | null;
  lowestPrice: number | null;
  myPrice: number | null;
  myPriceIsApproved: boolean | null;
  myPriceValidUntil: string | null;
};

export default function Page() {
  const dispatch = useAppDispatch();
  const { user } = useAuth();

  const [materials, setMaterials] = useState<SystemMaterial[]>([]);
  const [loading, setLoading] = useState(false);

  const loadMaterials = useCallback(async () => {
    try {
      setLoading(true);
      const res = await instance.get<SystemMaterial[]>(
        "SupplierMaterial/system-materials",
      );
      setMaterials(res.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user && user.id) void loadMaterials();
  }, [user, loadMaterials]);

  const [open, setOpen] = useState(false);
  const [printing, setPrinting] = useState(false);

  // invoice = the supplier's own current prices (approved and pending)
  const handlePrintInvoice = async () => {
    if (!user?.id) return;
    const printWindow = openPriceInvoiceWindow();
    if (!printWindow) return;
    try {
      setPrinting(true);
      const rows = await dispatch(
        fetchSupplierMaterialsBySupplier(Number(user.id)),
      ).unwrap();
      printPriceInvoice(
        printWindow,
        rows[0]?.supplierName || user.fullName,
        rows,
      );
    } catch (error) {
      console.log(error);
      printWindow.close();
    } finally {
      setPrinting(false);
    }
  };
  const [selectedItem, setSelectedItem] =
    useState<SupplierMaterialBySupplier>();

  const formatPrice = (price: number | null) =>
    price == null
      ? "-"
      : `${price.toLocaleString("en-US", { maximumFractionDigits: 2 })} جنيه`;

  return (
    <div className="min-h-screen space-y-8 p-6 md:p-8">
      <div className="sticky top-[68px] z-30 -mx-6 space-y-6 bg-[#f7f7f7] px-6 pb-4 pt-1 md:-mx-8 md:top-[84px] md:px-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="text-right">
          <h1 className="text-xl md:text-2xl font-bold">خامات المنظومة</h1>
          <p className="mt-1 text-sm text-gray-500">
            ارفع سعرك لأي خامة تريد توريدها
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            text="طباعة الفاتورة"
            onClick={handlePrintInvoice}
            loading={printing}
          />
        </div>
      </div>

      </div>

      {loading ? (
        <Loader />
      ) : materials.length > 0 ? (
        <Table
          data={materials}
          getRowKeyAction={(row) => `${row.materialId}`}
          tableClassName="min-w-290"
          emptyText="لا يوجد بيانات"
          columns={[
            {
              key: "index",
              header: "#",
              className: "text-center",
              render: (_row, index) => index + 1,
            },

            {
              key: "materialName",
              header: "اسم الخامة",
              className: "text-center",
            },

            {
              key: "categoryName",
              header: "التصنيف العام",
              className: "text-center",
              filterable: true,
              render: (row) => row.categoryName || "-",
            },

            {
              key: "subCategoryName",
              header: "تصنيف الخامة",
              className: "text-center",
              filterable: true,
              render: (row) => row.subCategoryName || "-",
            },

            {
              key: "unitName",
              header: "الوحدة",
              className: "text-center",
              render: (row) => row.unitName || "-",
            },

            {
              key: "brand",
              header: "المصدر / الماركة",
              className: "text-center",
              render: (row) => row.brand || "-",
            },

            {
              key: "lowestPrice",
              header: "أقل سعر بالمنظومة",
              className: "text-center font-medium text-gray-800",
              render: (row) => formatPrice(row.lowestPrice),
            },

            {
              key: "myPrice",
              header: "سعري",
              className: "text-center",
              render: (row) =>
                row.myPrice == null ? (
                  <span className="text-gray-400">لم تسعّر بعد</span>
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <span className="font-medium text-gray-800">
                      {formatPrice(row.myPrice)}
                    </span>
                    {row.myPriceIsApproved === false && (
                      <span className="rounded bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
                        في انتظار الموافقة
                      </span>
                    )}
                  </div>
                ),
            },

            {
              key: "actions",
              header: "خيارات",
              className: "text-center",

              render: (row) => (
                <div className="flex items-center gap-3 justify-center">
                  <button
                    onClick={() => {
                      setSelectedItem({
                        materialId: row.materialId,
                        materialName: row.materialName,
                        price: row.myPrice ?? 0,
                        categoryName: row.categoryName ?? "",
                        subCategoryName: row.subCategoryName ?? "",
                      });
                      setOpen(true);
                    }}
                    className="px-4 py-2
              bg-blue-600 text-white font-medium
              hover:bg-blue-700 hover:shadow-md
              active:scale-95
              transition-all duration-200"
                  >
                    {row.myPrice == null ? "رفع سعر" : "تعديل سعري"}
                  </button>
                </div>
              ),
            },
          ]}
        />
      ) : (
        <EmptyState image={card2BG} title="لا توجد خامات في المنظومة" />
      )}

      {open && (
        <EditPriceModal
          open={open}
          onCloseAction={() => {
            setSelectedItem(undefined);
            setOpen(false);
          }}
          onSavedAction={loadMaterials}
          item={selectedItem}
        />
      )}
    </div>
  );
}
