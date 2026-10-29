"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import PhoneInput from "react-phone-number-input";
import"react-phone-number-input/style.css";
import { Controller } from "react-hook-form";

import { useRegisterForm } from "@/hooks/useRegisterForm";
import { logo } from "@/assets";
import SuccessMessage from "./SuccessMessage";

export default function RegisterPage() {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    onSubmit,
    loading,
    setValue,
    isSubmittedSuccessfully,
    watch,
  } = useRegisterForm();
  const role = watch("role");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  type ImageItem = {
    file: File;
    preview: string;
  };

  const [images, setImages] = useState<ImageItem[]>([]);

  return (
    <>
      <div className="min-h-screen flex items-center justify-center">
        {isSubmittedSuccessfully ? (
          <SuccessMessage />
        ) : (
          <div className="bg-white rounded-2xl shadow-lg p-8 w-115 text-center my-20">
            {/* LOGO */}
            <div className="flex justify-center mb-4">
              <Link href="/" className="flex items-center justify-center">
                <Image
                  src={logo}
                  alt="Construction Pricing"
                  width={200}
                  height={100}
                  className="h-auto w-32 object-contain"
                  priority
                />
              </Link>
            </div>

            <h2 className="text-xl font-bold mb-6 text-gray-800">
              إنشاء حساب جديد
            </h2>

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-4 text-right"
            >
              {/* FULL NAME */}
              <div>
                <label className="text-sm text-gray-600 block mb-1">
                  الاسم
                </label>
                <input
                  type="text"
                  placeholder="الاسم"
                  {...register("fullName")}
                  className="mt-1 w-full border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                {errors.fullName && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.fullName.message}
                  </p>
                )}
              </div>

              {/* EMAIL */}
              <div>
                <label className="text-sm text-gray-600 block mb-1">
                  بريد إلكتروني
                </label>
                <input
                  type="email"
                  placeholder="البريد الإلكترونى"
                  {...register("email")}
                  className="mt-1 w-full border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* PHONE */}
              <div>
                <label className="text-sm text-gray-600 block mb-1">
                  رقم الهاتف
                </label>
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => (
                    <PhoneInput
                      defaultCountry="EG"
                      value={field.value}
                      onChange={field.onChange}
                      className="w-full border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  )}
                />
                {errors.phone && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.phone.message}
                  </p>
                )}
              </div>

              {/* ROLE */}
              <div>
                <label className="text-sm text-gray-600 block mb-1">
                  الدور
                </label>
                <select
                  {...register("role")}
                  className="mt-1 w-full border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="SUPPLIER">مورد</option>
                  <option value="COMPANY">{"شركة او مؤسسة "}</option>
                  <option value="EMPLOYEE">
                    {"مهندس"}
                  </option>
                </select>
                {errors.role && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.role.message}
                  </p>
                )}
              </div>

              {/* IMAGES */}
              {role !=="EMPLOYEE" && (
                <div>
                  <label className="text-sm text-gray-600 block mb-2">
                    صور اثبات الهوية
                  </label>

                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-4">
                    {/* GRID */}
                    <div className="grid grid-cols-3 gap-3">
                      {/* EXISTING IMAGES */}
                      {images.map((item, index) => (
                        <div
                          key={index}
                          className="relative rounded-lg overflow-hidden border group h-24"
                        >
                          <Image
                            src={item.preview}
                            alt="preview"
                            className="object-cover"
                            fill
                            sizes="
    (max-width: 640px) 100vw,
    (max-width: 1024px) 50vw,
    25vw"
                          />

                          {/* DELETE BTN */}
                          <button
                            type="button"
                            onClick={() => {
                              const updated = images.filter(
                                (_, i) => i !== index,
                              );
                              setImages(updated);

                              setValue("images",
                                updated.map((img) => img.file),
                                { shouldValidate: true },
                              );
                            }}
                            className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition"
                          >
                            ✕
                          </button>
                        </div>
                      ))}

                      {/* ADD NEW IMAGE BOX */}
                      <label className="cursor-pointer flex flex-col items-center justify-center border border-dashed rounded-lg h-24 text-gray-400 hover:border-red-400 transition">
                        <span className="text-xl">+</span>
                        <span className="text-xs">إضافة</span>

                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (!e.target.files) return;

                            const files = Array.from(e.target.files);

                            const newItems = files.map((file) => ({
                              file,
                              preview: URL.createObjectURL(file),
                            }));

                            const updated = [...images, ...newItems];

                            setImages(updated);

                            setValue("images",
                              updated.map((img) => img.file),
                              {
                                shouldValidate: true,
                                shouldDirty: true,
                              },
                            );
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  {errors.images && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.images.message}
                    </p>
                  )}
                </div>
              )}

              {/* PASSWORD */}
              <div className="relative">
                <label className="text-sm text-gray-600 block mb-1">
                  كلمة المرور
                </label>
                <div className="flex items-center border border-gray-200 rounded-md mt-1 focus-within:ring-2 focus-within:ring-red-500">
                  <input
                    type={showPassword ? "text" :"password"}
                    {...register("password")}
                    className="flex-1 px-3 py-2 focus:outline-none"
                  />
                  <div
                    className="px-3 cursor-pointer text-gray-500"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </div>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* CONFIRM PASSWORD */}
              <div className="relative">
                <label className="text-sm text-gray-600 block mb-1">
                  تأكيد كلمة المرور
                </label>
                <div className="flex items-center border border-gray-200 rounded-md mt-1 focus-within:ring-2 focus-within:ring-red-500">
                  <input
                    type={showConfirm ? "text" :"password"}
                    {...register("confirmPassword")}
                    className="flex-1 px-3 py-2 focus:outline-none"
                  />
                  <div
                    className="px-3 cursor-pointer text-gray-500"
                    onClick={() => setShowConfirm(!showConfirm)}
                  >
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </div>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {/* SUBMIT */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#BC2120] text-white py-2 mt-2 rounded-md hover:bg-[#9c1616] transition disabled:opacity-50"
              >
                {loading ? "جارى التسجيل..." :"تسجيل حساب"}
              </button>
            </form>

            {/* FOOTER */}
            <p className="text-sm text-gray-600 mt-6 text-center">
              لديك حساب بالفعل؟{""}
              <Link href="/login" className="text-[#BC2120] font-semibold">
                تسجيل الدخول
              </Link>
            </p>
          </div>
        )}
      </div>
    </>
  );
}
