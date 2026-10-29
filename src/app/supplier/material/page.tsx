"use client";
import Button from "@/components/button/Button";
import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/rtk/hooks";
import Loader from "@/components/loader/Loader";
import EmptyState from "@/components/emptyState/EmptyState";
import { card2BG } from "@/assets";
import {
  fetchGlobalSupplierMaterials,
  SupplierMaterialBySupplier,
} from "@/rtk/slices/supplierMaterialSlice";
import { useAuth } from "@/context/AuthContext";
import EditPriceModal from "./_components/EditPriceModal";
import Table from "@/components/table/Table";

export default function Page() {
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const { globalSupplierMaterials, loading } = useAppSelector(
    (s) => s.materialsWithSuppliers,
  );
  useEffect(() => {
    if (user && user.id) {
      dispatch(fetchGlobalSupplierMaterials(Number(user.id)));
    }
  }, [dispatch, user]);

  const [open, setOpen] = useState(false);
  const [selectedItem, setSelectedItem] =
    useState<SupplierMaterialBySupplier>();

  const filteredData = Array.from(
    new Map(
      globalSupplierMaterials
        .slice()
        .reverse()
        .map((item) => [item.id, item]),
    ).values(),
  ).reverse();

  return (
    <div className="min-h-screen space-y-8 p-6 md:p-8">
      <div className="sticky top-[68px] z-30 -mx-6 space-y-6 bg-[#f7f7f7] px-6 pb-4 pt-1 md:-mx-8 md:top-[84px] md:px-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="text-right">
          <h1 className="text-xl md:text-2xl font-bold">الخامات المتاحه</h1>
        </div>

        <div className="flex gap-3">
          <Button text="رفع سعر للكل" onClick={() => setOpen(true)} />
        </div>
      </div>

      </div>

      {loading ? (
        <Loader />
      ) : filteredData.length > 0 ? (
        <Table
          data={filteredData || []}
          getRowKeyAction={(row) => `${row.materialId}-${row.supplierId}`}
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
            },

            {
              key: "subCategoryName",
              header: "تصنيف الخامة",
              className: "text-center",
              filterable: true,
            },

            {
              key: "supplierName",
              header: "المورد",
              className: "text-center",
              filterable: true,
            },

            {
              key: "price",
              header: "السعر",
              className: "text-center font-medium text-gray-800",

              render: (row) => `${row.price} جنيه`,
            },

            {
              key: "actions",
              header: "خيارات",
              className: "text-center",

              render: (row) => (
                <div className="flex items-center gap-3 justify-center">
                  <button
                    onClick={() => {
                      setSelectedItem(row);
                      setOpen(true);
                    }}
                    className="px-4 py-2
              bg-blue-600 text-white font-medium
              hover:bg-blue-700 hover:shadow-md
              active:scale-95
              transition-all duration-200"
                  >
                    رفع سعر
                  </button>
                </div>
              ),
            },
          ]}
        />
      ) : (
        <EmptyState image={card2BG} title="لا يوجد لديك بيانات" />
      )}

      {open && (
        <EditPriceModal
          open={open}
          onCloseAction={() => {
            setSelectedItem(undefined);
            setOpen(false);
          }}
          item={selectedItem}
        />
      )}
    </div>
  );
}
