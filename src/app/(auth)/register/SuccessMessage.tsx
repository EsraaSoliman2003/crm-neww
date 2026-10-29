"use client"
import { CheckCircle } from "lucide-react";
import Link from "next/link";


export default function SuccessMessage() {
  return (
    <div className="flex items-center justify-center min-h-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg border border-gray-100 text-center">
        
        <div className="flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
        </div>

        <h2 className="mt-6 text-2xl font-bold text-gray-800">
          تم إرسال طلبك بنجاح
        </h2>

        <p className="mt-3 text-gray-500 leading-7">
          شكرًا لتسجيلك، سيتم مراجعة طلبك والرد عليك في أقرب وقت ممكن.
        </p>

      <Link href="/login" className="block py-3 text-center rounded-lg bg-red-700 text-white mt-6">تسجيل دخول</Link>
      </div>
    </div>
  );
}