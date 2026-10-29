"use client";

import React, { useEffect, useState } from "react";
import { FileText, Mail, Package, Phone, SquarePen } from "lucide-react";
import Images from "./_components/Images";
import { useAuth } from "@/context/AuthContext";
import { useAppDispatch, useAppSelector } from "@/rtk/hooks";
import {
  fetchSupplierMaterialsBySupplier,
  SupplierMaterialBySupplier,
} from "@/rtk/slices/supplierMaterialSlice";
import Loader from "@/components/loader/Loader";
import EmptyState from "@/components/emptyState/EmptyState";
import { card2BG, default_image } from "@/assets";
import EditPriceModal from "./_components/EditPriceModal";
import Button from "@/components/button/Button";
import { ProfileData } from "@/lib/dtos";
import axios from "@/lib/axios";
import Loading from "@/skilton/Loading";
import EditProfileModal from "./_components/EditProfileModal";
import Table from "@/components/table/Table";
import Image from "next/image";

export default function Page() {
  const dispatch = useAppDispatch();
  const { user, setProfileData, profileData } = useAuth();
  const { supplierMaterials, loading: mLoading } = useAppSelector(
    (s) => s.materialsWithSuppliers,
  );
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

    if (user && user.id) {
      dispatch(fetchSupplierMaterialsBySupplier(Number(user.id)));
      getProfile();
    }
  }, [dispatch, setProfileData, user]);

  const [openEdit, setOpenEdit] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedItem, setSelectedItem] =
    useState<SupplierMaterialBySupplier>();
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
        <Images coverImage={profileData?.coverImage} />

        {/* ================= HEADER ================= */}
        <div className="px-6 pt-6 md:px-8">
          <div className="flex flex-col gap-5 border border-gray-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-4 text-right sm:flex-row sm:items-center">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border-4 border-white bg-white shadow-lg">
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
                  <Package size={16} />
                  ملف المورد
                </div>
                <h1 className="text-2xl font-extrabold text-gray-900 md:text-3xl">
                  {profileData?.fullName || "اسم المورد"}
                </h1>
                <p className="mt-2 text-sm text-gray-500">
                  بيانات المورد والخامات المتاحة وأسعارها داخل النظام
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
              <h2 className="text-lg font-bold text-gray-900">عن المورد</h2>
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
              <span className="truncate text-sm font-medium text-gray-700">
                {profileData?.email || "-"}
              </span>
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
              <h1 className="text-xl md:text-2xl font-bold">الخامات المتاحه</h1>
            </div>
            {supplierMaterials.length !== 0 && (
              <div className="flex gap-3">
                <Button
                  text="تعديل سعر الكل"
                  onClick={() => setOpen(true)}
                  disabled={supplierMaterials.length === 0}
                />
              </div>
            )}
          </div>

          {mLoading ? (
            <Loader />
          ) : supplierMaterials.length > 0 ? (
            <Table
              data={supplierMaterials || []}
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
                },

                {
                  key: "subCategoryName",
                  header: "تصنيف الخامة",
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
                        className="border border-blue-600 px-4 py-2 font-medium text-blue-600 transition hover:bg-blue-50"
                      >
                        تعديل السعر
                      </button>
                    </div>
                  ),
                },
              ]}
            />
          ) : (
            <EmptyState image={card2BG} title="لا يوجد لديك بيانات" />
          )}
        </div>

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
    </>
  );
}
