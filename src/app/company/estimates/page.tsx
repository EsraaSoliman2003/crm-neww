"use client";
import Button from "@/components/button/Button";
import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/rtk/hooks";
import Loader from "@/components/loader/Loader";
import EmptyState from "@/components/emptyState/EmptyState";
import { card2BG } from "@/assets";
import { useAuth } from "@/context/AuthContext";
import { CompanyEstimate, fetchCompanyGlobalEstimates } from "@/rtk/slices/companiesSlice";
import Table from "@/components/table/Table";
import EditPriceModal from "./_components/EditPriceModal";

export default function Page() {
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const { globalEstimates, globalEstimatesLoading } = useAppSelector(
    (s) => s.companies,
  );
  useEffect(() => {
    if (user && user.id) {
      dispatch(fetchCompanyGlobalEstimates(Number(user.id)));
    }
  }, [dispatch, user]);

  const [open, setOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CompanyEstimate | undefined>(undefined);


  return (
    <div className="min-h-screen space-y-8 p-6 md:p-8">
      <div className="sticky top-[68px] z-30 -mx-6 space-y-6 bg-[#f7f7f7] px-6 pb-4 pt-1 md:-mx-8 md:top-[84px] md:px-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="text-right">
          <h1 className="text-xl md:text-2xl font-bold">المقايسات المتاحه</h1>
        </div>

        <div className="flex gap-3">
          <Button text="رفع سعر للكل" onClick={() => setOpen(true)} />
        </div>
      </div>

      </div>

      {globalEstimatesLoading ? (
        <Loader />
      ) : globalEstimates.length > 0 ? (
        <Table
          data={globalEstimates || []}
          getRowKeyAction={(row) => `${row.companyId}-${row.estimateId}`}
          tableClassName="min-w-290"
          emptyText="لا يوجد بيانات"
          columns={[
            { key: "id", header: "#", render: (_, index) => index + 1 },
            { key: "estimateName", header: "اسم المقايسة" },

            {
              key: "estimateComplete",
              header: "مرحلة المقايسة",
              render: (row) => row?.stageName,
              filterable: true,
            },

            {
              key: "estimateStage",
              header: "تمام المقايسة",
              render: (row) => row?.completeName,
              filterable: true,
            },
            {
              key: "price",
              header: "السعر",
            },
            {
              key: "actions",
              header: "خيارات",
              className: "text-center",

              render: (row) => (
                <div className="flex items-center gap-3 justify-center">
                  <button
                    onClick={() => {
                      setOpen(true);
                      setSelectedItem(row);
                    }}
                    className="
              px-4 py-2 
              bg-blue-600 text-white font-medium
              hover:bg-blue-700 hover:shadow-md
              active:scale-95
              disabled:bg-gray-300 disabled:cursor-not-allowed
              transition-all duration-200
            "
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
