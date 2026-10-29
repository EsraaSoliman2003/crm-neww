"use client"
import { logo } from "@/assets";
import Image from "next/image";
import Link from "next/link";

export default function Page() {

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-115 text-center">

        {/* Logo */}
        <div className="flex justify-center mb-4">
          <Link
            href="/"
            className="flex items-center justify-center"
          >
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


        {/* Title */}
        <h2 className="text-xl font-bold mb-6 text-gray-800">
          سجل الدخول الى حسابك
        </h2>

        {/* Form */}
        <form className="space-y-4 text-right">

          <div>
            <label className="text-sm text-gray-600 block mb-1">
              بريد إلكتروني
            </label>
            <input
              type="email"
              placeholder="hello@gmail.com"
              className="mt-1 w-full border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* Button */}
          <button
            type="submit"
            className="w-full bg-[#BC2120] text-white py-2 rounded-md hover:bg-[#9c1616] transition"
          >
            إرسال رابط إعادة تعيين كلمة المرور
          </button>
        </form>
      </div>
    </div>
  );
}
