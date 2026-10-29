"use client";
import { logo } from "@/assets";
import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useLoginForm } from "@/hooks/useLoginForm"; // 👈 مهم

export default function Page() {
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    onSubmit,
    formState: { errors },
    loading,
  } = useLoginForm();

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-115 text-center">

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
          سجل الدخول الى حسابك
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-right">

          {/* EMAIL */}
          <div>
            <label className="text-sm text-gray-600 block mb-1">
              بريد إلكتروني
            </label>
            <input
              type="email"
              {...register("email")}
              placeholder="hello@gmail.com"
              className="mt-1 w-full border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
              // value={"admin@gmail.com"}
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* PASSWORD */}
          <div className="relative">
            <label className="text-sm text-gray-600 block mb-1">
              كلمة المرور
            </label>
            <div className="flex items-center border border-gray-200 rounded-md mt-1 focus-within:ring-2 focus-within:ring-red-500">
              <input
                type={showPassword ? "text" :"password"}
                {...register("password")}
                placeholder="********"
                className="flex-1 px-3 py-2 rounded-l-md focus:outline-none"
                // value={"Admin123456_"}
              />
              <div
                className="px-3 cursor-pointer text-gray-500"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </div>
            </div>

            {errors.password && (
              <p className="text-red-500 text-xs mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* <div className="text-left">
            <Link
              href="/forgot-password"
              className="text-sm text-red-600 hover:underline font-semibold"
            >
              نسيت كلمة المرور؟
            </Link>
          </div> */}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#BC2120] text-white py-2 rounded-md hover:bg-[#9c1616] transition disabled:opacity-50"
          >
            {loading ? "جاري تسجيل الدخول..." :"تسجيل الدخول"}
          </button>

          {/* REGISTER LINK */}
          <div className="mt-2 text-center">
            <p className="text-sm text-gray-600">
              ليس لديك حساب؟{""}
              <Link
                href="/register"
                className="text-[#BC2120] font-semibold hover:underline"
              >
                إنشاء حساب
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
