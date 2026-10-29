"use client";
import Button from "@/components/button/Button";
import React, { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/rtk/hooks";
import Loader from "@/components/loader/Loader";
import EmptyState from "@/components/emptyState/EmptyState";
import { card2BG } from "@/assets";
import { confirmDelete } from "@/utils/confirmDelete";
import ButtonBar from "@/components/buttonBar/ButtonBar";
import { deleteUnit, fetchUnits } from "@/rtk/slices/unitsSlice";
import Table from "@/components/table/Table";
import { Unit } from "@/utils/dtos";
import { Trash2 } from "lucide-react";

export default function Page() {
  const dispatch = useAppDispatch();
  const { data, loading } = useAppSelector((s) => s.units);
  useEffect(() => {
    dispatch(fetchUnits());
  }, [dispatch]);

  const handleDelete = (id: number) => {
    confirmDelete(id, (id) => dispatch(deleteUnit(Number(id))).unwrap());
  };

  const flattenItems = (data: Unit[]) => {
    return data.map((item) => ({
      id: item.id,
      value: item.value,
    }));
  };

  return (
    <div className="space-y-8">
      <div className="sticky top-0! z-30 space-y-5 rounded-b-3xl border-b border-orange-100/80 bg-linear-to-b from-orange-50/95 via-white/95 to-white/90 px-6 pb-5 pt-4 shadow-[0_10px_30px_-24px_rgba(154,52,18,0.45)] backdrop-blur-xl md:top-24 md:px-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl md:text-2xl font-bold">الوحدات</h1>

        <Button text="+ اضافة وحدة" href="/units/add-unit" />
      </div>

      {/* button bar */}
      <ButtonBar title="تقرير الوحدات" data={flattenItems(data)} />

      </div>

      {loading ? (
        <Loader />
      ) : data.length > 0 ? (
        <Table
          data={data}
          loading={loading}
          emptyText="لا توجد بيانات"
          getRowKeyAction={(item) => item.id}
          columns={[
            {
              key: "id",
              header: "#",
              render: (_, index) => index + 1,
            },

            {
              key: "value",
              header: "القيمة",
            },

            {
              key: "actions",
              header: "خيارات",
              render: (row) => (
                <div className="flex items-center gap-3">
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
        <EmptyState image={card2BG} title="لا يوجد لديك وحدات" />
      )}
    </div>
  );
}
