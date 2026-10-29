"use client";

import { default_image } from "@/assets";
import Loader from "@/components/loader/Loader";
import { useAppDispatch, useAppSelector } from "@/rtk/hooks";
import { approveOrRejectUser, getUserDetails } from "@/rtk/slices/adminSlice";
import { CheckCircle, XCircle } from "lucide-react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
export default function UserProfileAdmin() {
  const params = useParams();
  const dispatch = useAppDispatch();
  const router = useRouter();

  const id = Number(params?.id);
  const { selectedUser, loading, approving } = useAppSelector((s) => s.admin);

  useEffect(() => {
    dispatch(getUserDetails(id));
  }, [dispatch, id]);
  const handleResponse = async (isApproved: boolean) => {
    try {
      await dispatch(
        approveOrRejectUser({
          id,
          isApproved,
        }),
      ).unwrap();

      toast.success("تم الحفظ بنجاح");

      router.push("/request-management");
    } catch (error) {
      console.error(error);
    }
  };
  return (
    <div className="min-h-screen">
      {loading ? (
        <Loader />
      ) : selectedUser ? (
        <div className="">
          <div className="flex items-center gap-6 flex-wrap">
            <div className="relative w-28 h-28 rounded-full overflow-hidden border border-gray-200">
              <Image
                src={default_image}
                alt="user"
                fill
                className="object-cover"
              />
            </div>

            <div className="flex-1 text-right">
              <h2 className="text-2xl font-bold text-gray-800">
                {selectedUser.fullName}
              </h2>
              <p className="text-gray-500">{selectedUser.email}</p>
              <p className="text-gray-500">{selectedUser.phoneNumber}</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleResponse(true)}
                disabled={approving}
                className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl disabled:opacity-50"
              >
                <CheckCircle size={18} />
                قبول
              </button>

              <button
                onClick={() => handleResponse(false)}
                disabled={approving}
                className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl disabled:opacity-50"
              >
                <XCircle size={18} />
                رفض
              </button>
            </div>
          </div>

          <div className="my-6 border-t border-gray-200"></div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <InfoItem label="الاسم بالكامل" value={selectedUser.fullName} />
              <InfoItem label="البريد الإلكتروني" value={selectedUser.email} />
              <InfoItem label="رقم الهاتف" value={selectedUser.phoneNumber} />
              <InfoItem
                label="الوظيفة"
                value={
                  selectedUser.role === "COMPANY"
                    ? "الشركة (مدير)"
                    : selectedUser.role === "EMPLOYEE"
                      ? "الشركة (مهندس)"
                      : "مورد"
                }
              />
            </div>
            {Array.isArray(selectedUser?.images) &&
              selectedUser.images.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-700 text-right">
                    صور المستخدم
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedUser?.images?.map((img, index) => (
                      <div
                        key={index}
                        className="relative aspect-4/3 overflow-hidden rounded-xl border border-gray-200"
                      >
                        <Image
                          src={img}
                          alt={`user image ${index + 1}`}
                          fill
                          sizes="(max-width: 640px) 100vw, 50vw"
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        </div>
      ) : (
        <div></div>
      )}
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 p-4 rounded-xl text-right">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="font-medium text-gray-800">{value}</p>
    </div>
  );
}
