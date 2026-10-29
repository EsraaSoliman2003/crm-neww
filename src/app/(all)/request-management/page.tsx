"use client";

import { useEffect, useState } from "react";
import { Trash2, Eye, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/rtk/hooks";
import {
  approveOrRejectUser,
  fetchUnApprovedUsers,
} from "@/rtk/slices/adminSlice";
import { toast } from "sonner";
import Loader from "@/components/loader/Loader";
import Table from "@/components/table/Table";

export default function RequestsPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { data, loading } = useAppSelector((s) => s.admin);
  useEffect(() => {
    dispatch(fetchUnApprovedUsers());
  }, [dispatch]);

  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleResponse = async (id: number, isApproved: boolean) => {
    try {
      setLoadingId(String(id));
      await dispatch(
        approveOrRejectUser({
          id,
          isApproved,
        }),
      ).unwrap();

      toast.success("تم الحفظ بنجاح");
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingId(null);
    }
  };
  return (
    <div className="space-y-8">
      <div className="sticky top-0! z-30 -mx-6 space-y-5 rounded-b-3xl border-b border-orange-100/80 bg-linear-to-b from-orange-50/95 via-white/95 to-white/90 px-6 pb-5 pt-4 shadow-[0_10px_30px_-24px_rgba(154,52,18,0.45)] backdrop-blur-xl md:top-24 md:px-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-xl md:text-2xl font-bold">إدارة الطلبات</h1>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <Loader />
      ) : (
        <Table
          data={data || []}
          loading={loading}
          emptyText="لا توجد طلبات"
          getRowKeyAction={(item) => item.id}
          onRowClickAction={(row) =>
            router.push(`/request-management/${row.id}`)
          }
          columns={[
            {
              key: "id",
              header: "#",
              render: (_, index) => index + 1,
            },

            {
              key: "fullName",
              header: "الاسم",
              filterable: true,
            },

            {
              key: "email",
              header: "البريد الإلكترونى",
              render: (row) => row.email || "-",
            },

            {
              key: "role",
              header: "الدور",
              render: (row) => row.role === "COMPANY" ? "الشركة (مدير)" : row.role === "EMPLOYEE" ? "الشركة (مهندس)" : "مورد",
              filterable: true,
            },

            {
              key: "phoneNumber",
              header: "الهاتف",
              render: (row) => row.phoneNumber || "-",
            },

            {
              key: "actions",
              header: "خيارات",
              render: (row) => (
                <div className="flex items-center gap-3">
                  {/* View */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/request-management/${row.id}`);
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <Eye size={18} />
                  </button>

                  {/* Accept */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleResponse(Number(row.id), true);
                    }}
                    disabled={loadingId === row.id}
                    className={`text-green-600 hover:text-green-800 ${loadingId === row.id
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                      }`}
                  >
                    <Check size={18} />
                  </button>

                  {/* Reject */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleResponse(Number(row.id), false);
                    }}
                    disabled={loadingId === row.id}
                    className={`text-red-500 hover:text-red-700 ${loadingId === row.id
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                      }`}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ),
            },
          ]}
        />
      )}
    </div>
  );
}
