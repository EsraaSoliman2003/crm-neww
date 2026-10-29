"use client";

import React, { useState } from "react";
import axios from "@/lib/axios";
import Image from "next/image";
import { X, Camera, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ProfileData } from "@/lib/dtos";
import { toast } from "sonner";
import { default_image } from "@/assets";

type Props = {
  open: boolean;
  onCloseAction: (value: boolean) => void;
};

export default function EditProfileModal({ open, onCloseAction }: Props) {
  const { setProfileData, profileData } = useAuth();

  const [loadingType, setLoadingType] = useState("");

  const [fullName, setFullName] = useState(profileData?.fullName || "");
  const [aboutMe, setAboutMe] = useState(profileData?.aboutMe || "");
  const [email, setEmail] = useState(profileData?.email || "");
  const [phone, setPhone] = useState(profileData?.phone || "");

  if (!open) return null;

  /* =========================
        UPDATE STATE
  ========================= */

  const updateProfileState = (data: Partial<ProfileData>) => {
    if (!profileData) return;

    setProfileData({
      ...profileData,
      ...data,
    });
  };

  const handleRequest = async ({
    type,
    endpoint,
    body,
    successMessage,
  }: {
    type: string;
    endpoint: string;
    body: object | FormData;
    successMessage: string;
  }) => {
    try {
      setLoadingType(type);

      const res = await axios.put<ProfileData>(endpoint, body);

      updateProfileState(res.data);

      toast.success(successMessage);
    } catch (error) {
      console.log(error);
      toast.error("حدث خطأ ما");
    } finally {
      setLoadingType("");
    }
  };

  /* =========================
        ACTIONS
  ========================= */

  const updateName = () =>
    handleRequest({
      type: "name",
      endpoint: "/profile/name",
      body: { fullName },
      successMessage: "تم تحديث الاسم",
    });

  const updateAbout = () =>
    handleRequest({
      type: "about",
      endpoint: "/profile/about",
      body: { aboutMe },
      successMessage: "تم تحديث النبذة",
    });

  const updateEmail = () =>
    handleRequest({
      type: "email",
      endpoint: "/profile/email",
      body: { newEmail: email },
      successMessage: "تم تحديث الإيميل",
    });

  const updatePhone = () =>
    handleRequest({
      type: "phone",
      endpoint: "/profile/phone",
      body: { newCountryCode: "+20", newPhone: phone },
      successMessage: "تم تحديث الهاتف",
    });

  const updateImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("ImageUrl", file);

    handleRequest({
      type: "image",
      endpoint: "/profile/image",
      body: formData,
      successMessage: "تم تحديث الصورة",
    });
  };

  const updateCover = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log(file);
    if (!file) return;

    const formData = new FormData();
    formData.append("CoverImage", file);

    handleRequest({
      type: "cover",
      endpoint: "/profile/cover",
      body: formData,
      successMessage: "تم تحديث الغلاف",
    });
  };

  const btn =
    "min-w-[90px] h-11 bg-[#bf0200] hover:bg-[#9e0200] text-white flex items-center justify-center transition disabled:opacity-50";

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in">
        {/* ================= COVER ================= */}
        <div className="relative h-44 w-full bg-gray-100">
          <Image
            src={profileData?.coverImage || default_image}
            alt="cover"
            fill
            className="object-cover"
            sizes="100vw"
          />

          <button
            onClick={() => onCloseAction(false)}
            className="absolute top-3 right-3 bg-black/40 hover:bg-black/60 text-white p-2 "
          >
            <X size={18} />
          </button>

          {/* PROFILE IMAGE */}
          <div className="absolute -bottom-14 left-6">
            <div className="relative w-28 h-28">
              <Image
                src={profileData?.imageUrl || default_image}
                alt="profile"
                fill
                className=" object-cover border-4 border-white shadow-lg"
                sizes="112px"
              />

              <label className="absolute bottom-1 right-1 bg-[#bf0200] hover:bg-[#9e0200] p-2 cursor-pointer">
                <input type="file" hidden onChange={updateImage} />
                {loadingType === "image" ? (
                  <Loader2 className="animate-spin text-white" size={14} />
                ) : (
                  <Camera size={14} className="text-white" />
                )}
              </label>
            </div>
          </div>
        </div>

        {/* ================= CONTENT ================= */}
        <div className="pt-20 p-6 space-y-6 max-h-[70vh] overflow-y-auto hide-scrollbar">
          {/* NAME */}
          <Field
            label="الاسم"
            value={fullName}
            setValue={setFullName}
            loading={loadingType === "name"}
            onSave={updateName}
            btn={btn}
          />

          {/* ABOUT */}
          <FieldTextArea
            label="نبذة عني"
            value={aboutMe}
            setValue={setAboutMe}
            loading={loadingType === "about"}
            onSave={updateAbout}
            btn={btn}
          />

          {/* EMAIL */}
          <Field
            label="الإيميل"
            value={email}
            setValue={setEmail}
            loading={loadingType === "email"}
            onSave={updateEmail}
            btn={btn}
            type="email"
          />

          {/* PHONE */}
          <Field
            label="الهاتف"
            value={phone}
            setValue={setPhone}
            loading={loadingType === "phone"}
            onSave={updatePhone}
            btn={btn}
          />

          {/* COVER UPLOAD */}
          <label className="h-28 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-[#bf0200] transition">
            <input type="file" hidden onChange={updateCover} />
            {loadingType === "cover" ? (
              <Loader2 className="animate-spin text-[#bf0200]" />
            ) : (
              <>
                <Camera className="text-[#bf0200] mb-2" />
                <span className="text-sm text-gray-500">تغيير صورة الغلاف</span>
              </>
            )}
          </label>
        </div>
      </div>
    </div>
  );
}

/* =========================
      SMALL COMPONENTS
========================= */

interface FieldProps {
  label: string;
  value: string;
  setValue: (value: string) => void;
  onSave: () => void;
  loading: boolean;
  btn: string;
  type?: string;
}

function Field({
  label,
  value,
  setValue,
  onSave,
  loading,
  btn,
  type,
}: FieldProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm text-gray-600 font-bold">{label}</label>

      <div className="flex gap-3 mt-3">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="flex-1 h-11 border border-gray-200 px-4 focus:border-[#bf0200] focus:ring-2 focus:ring-[#bf0200]/20 outline-none transition"
          type={type}
        />

        <button onClick={onSave} disabled={loading} className={btn}>
          {loading ? <Loader2 className="animate-spin" /> : "حفظ"}
        </button>
      </div>
    </div>
  );
}

function FieldTextArea({
  label,
  value,
  setValue,
  onSave,
  loading,
  btn,
}: FieldProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm text-gray-600 font-bold">{label}</label>

      <div className="flex gap-3 mt-3">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="flex-1 h-28 border border-gray-200 p-3 resize-none focus:border-[#bf0200] focus:ring-2 focus:ring-[#bf0200]/20 outline-none transition"
        />

        <button onClick={onSave} disabled={loading} className={btn}>
          {loading ? <Loader2 className="animate-spin" /> : "حفظ"}
        </button>
      </div>
    </div>
  );
}
