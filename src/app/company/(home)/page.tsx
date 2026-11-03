"use client";

import { useEffect, useState } from "react";
import { Building2, FileText, Mail, Phone, SquarePen } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import Loader from "@/components/loader/Loader";
import EmptyState from "@/components/emptyState/EmptyState";
import { card2BG, default_image } from "@/assets";
import {
  CompanyEstimatePricing,
  formatMoney,
  getCompanyEstimatesPricing,
} from "@/lib/companyPricing";
import { ProfileData } from "@/lib/dtos";
import axios from "@/lib/axios";
import Loading from "@/skilton/Loading";
import EditProfileModal from "./_components/EditProfileModal";
import Images from "@/app/supplier/(home)/_components/Images";
import Table from "@/components/table/Table";
import Image from "next/image";
import EmailVerification from "@/components/emailVerification/EmailVerification";

export default function Page() {
  const { user, setProfileData, profileData } = useAuth();
  // "مقايساتي" = estimates the company created + shared ones where it raised an item
  const [myEstimates, setMyEstimates] = useState<CompanyEstimatePricing[]>([]);
  const [estimatesLoading, setEstimatesLoading] = useState(false);
  // Get profile data
  const [loading, setLoading] = useState<boolean>(false);
  useEffect(() => {
    const getProfile = async () => {
      try {
        setLoading(true);

        const res = await axios.get<ProfileData>(`Profile`);
        setProfileData(res.data);
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };
    const getEstimates = async (companyId: number) => {
      try {
        setEstimatesLoading(true);
        const all = await getCompanyEstimatesPricing(companyId);
        setMyEstimates(all.filter((e) => e.isOwn || e.raisedItemsCount > 0));
      } catch (error) {
        console.log(error);
      } finally {
        setEstimatesLoading(false);
      }
    };
    if (user && user.id) {
      void getEstimates(Number(user.id));
      getProfile();
    }
  }, [user, setProfileData]);

  const [openEdit, setOpenEdit] = useState(false);
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading />
      </div>
    );
  }
  return (
    <>
      <EditProfileModal open={openEdit} onCloseAction={setOpenEdit} />
      <div className="min-h-screen bg-gray-50">
        {/* ================= COVER ================= */}
        <Images coverImage={profileData?.coverImage || ""} />

        {/* ================= HEADER ================= */}
        <div className="px-6 pt-6 md:px-8">
          <div className="flex flex-col gap-5 border border-gray-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-4 text-right sm:flex-row sm:items-center">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden border-4 border-white bg-white shadow-lg">
                <Image
                  src={profileData?.imageUrl || default_image}
                  alt="profile"
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              </div>
              <div>
                <div className="mb-3 inline-flex items-center gap-2 border border-red-100 bg-red-50 px-3 py-1 text-sm font-semibold text-[#bf0200]">
                  <Building2 size={16} />
                  ملف الشركة
                </div>
                <h1 className="text-2xl font-extrabold text-gray-900 md:text-3xl">
                  {profileData?.fullName || "اسم الشركة"}
                </h1>
                <p className="mt-2 text-sm text-gray-500">
                  بيانات الشركة ومقايساتها المتاحة داخل النظام
                </p>
              </div>
            </div>

            <button
              onClick={() => setOpenEdit(true)}
              className="flex w-fit items-center gap-2 border border-green-600 px-4 py-2 font-semibold text-green-600 transition hover:bg-green-50"
            >
              <SquarePen size={18} />
              تعديل البيانات
            </button>
          </div>
        </div>

        {/* ================= CONTENT ================= */}
        <div className="grid gap-6 p-6 md:grid-cols-3 md:p-8">
          {/* ABOUT CARD */}
          <div className="border border-gray-200 bg-white p-6 shadow-sm md:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">عن الشركة</h2>
              <FileText size={20} className="text-gray-400" />
            </div>
            <p className="min-h-24 text-right leading-8 text-gray-600">
              {profileData?.aboutMe || "لا توجد نبذة مضافة حتى الآن."}
            </p>
          </div>

          {/* CONTACT CARD */}
          <div className="space-y-4 border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-2 text-right text-lg font-bold text-gray-900">
              بيانات التواصل
            </h2>

            {/* email */}
            <div className="flex items-center justify-between gap-3 border border-gray-100 bg-gray-50 p-3">
              <Mail size={18} className="shrink-0 text-blue-500" />
              <div className="flex min-w-0 items-center gap-2">
                <span className="truncate text-sm font-medium text-gray-700">
                  {profileData?.email || "-"}
                </span>
                <EmailVerification />
              </div>
            </div>

            {/* phone */}
            <div className="flex items-center justify-between gap-3 border border-gray-100 bg-gray-50 p-3">
              <Phone size={18} className="shrink-0 text-green-500" />
              <span className="text-sm font-medium text-gray-700">
                {profileData?.phone || "-"}
              </span>
            </div>
          </div>
        </div>

        {/* ================= MATERIALS ================= */}
        <div className="space-y-8 p-6 md:p-8">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div className="text-right">
              <h1 className="text-xl md:text-2xl font-bold">مقايساتى</h1>
            </div>
          </div>

          {estimatesLoading ? (
            <Loader />
          ) : myEstimates.length > 0 ? (
            <Table
              data={myEstimates}
              getRowKeyAction={(row) => row.estimateId}
              tableClassName="min-w-[700px]"
              emptyText="لا يوجد بيانات"
              columns={[
                { key: "id", header: "#", render: (_, index) => index + 1 },
                { key: "estimateName", header: "اسم المقايسة" },
                {
                  key: "systemTotal",
                  header: "عرض المنظومة",
                  render: (row) => formatMoney(row.systemTotal),
                },
                {
                  key: "companyTotal",
                  header: "العرض بعد رفع البنود",
                  className: "font-bold text-gray-900",
                  // empty until at least one item is raised
                  render: (row) => (row.raisedItemsCount > 0 ? formatMoney(row.companyTotal) : null),
                },
                {
                  key: "actions",
                  header: "خيارات",
                  className: "text-center",
                  render: (row) => (
                    <div className="flex items-center justify-center gap-3">
                      <Link
                        href={`/company/estimates/${row.estimateId}`}
                        className="border border-blue-600 px-4 py-2 font-medium text-blue-600 transition hover:bg-blue-50"
                      >
                        تفاصيل المقايسة
                      </Link>
                    </div>
                  ),
                },
              ]}
            />
          ) : (
            <div className="space-y-4 text-center">
              <EmptyState image={card2BG} title="لا توجد مقايسات بعد" />
              <Link
                href="/company/estimates/add"
                className="inline-block bg-[#bf0200] px-4 py-2 font-semibold text-white hover:bg-[#9f0200]"
              >
                + إضافة مقايسة
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
