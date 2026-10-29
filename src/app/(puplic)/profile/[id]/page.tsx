"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import axios from "@/lib/axios"; // لو عندك axios مباشرة غيّرها لـ "axios"
import { FileText, Mail, MessageCircle, Package, Phone, UserRound } from "lucide-react";
import { toast } from "sonner";
import { ProfileData } from "@/lib/dtos";
import { default_image } from "@/assets";
import Loading from "@/skilton/Loading";

const escapeHtml = (value: string | number | null | undefined) =>
  String(value ?? "-")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const buildReportTable = (
  title: string,
  headers: string[],
  rows: (string | number)[][],
) => `
  <h2>${escapeHtml(title)}</h2>
  <table>
    <thead>
      <tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr>
    </thead>
    <tbody>
      ${rows.length
    ? rows
      .map(
        (row) =>
          `<tr>${row
            .map((cell) => `<td>${escapeHtml(cell)}</td>`)
            .join("")}</tr>`,
      )
      .join("")
    : `<tr><td colspan="${headers.length}">لا توجد بيانات</td></tr>`
  }
    </tbody>
  </table>
`;

export default function Page() {
  const params = useParams();
  const id = Number(params?.id);

  const [loading, setLoading] = useState<boolean>(false);
  const [profileData, setProfileData] = useState<ProfileData>();

  useEffect(() => {
    const getProfile = async () => {
      try {
        setLoading(true);
        const res = await axios.get<ProfileData>(`Profile/GetProfile/${id}`);
        setProfileData(res.data);
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };
    if (id) {
      getProfile();
    }
  }, [id]);

  const profilePhone = profileData?.phone
    ? profileData.phone.startsWith("+")
      ? profileData.phone
      : `${profileData.countryCode || ""}${profileData.phone}`
    : "-";

  const handleExportPdf = () => {
    if (!profileData) {
      toast.error("بيانات الملف غير متاحة للتصدير");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("تعذر فتح نافذة التصدير، يرجى السماح بالنوافذ المنبثقة");
      return;
    }

    const profileDetails = buildReportTable(
      "بيانات الملف الشخصي",
      ["البيان", "التفاصيل"],
      [
        ["الاسم", profileData.fullName || "-"],
        ["البريد الإلكتروني", profileData.email || "-"],
        ["رقم الهاتف", profilePhone],
        ["نبذة", profileData.aboutMe || "لا توجد نبذة مضافة"],
      ],
    );

    printWindow.document.write(`
    <!doctype html>
    <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8" />
        <title>${escapeHtml(`الملف الشخصي - ${profileData.fullName}`)}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
          h1 { margin: 0 0 24px; text-align: center; }
          h2 { margin: 28px 0 12px; break-after: avoid; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
          th, td { border: 1px solid #d1d5db; padding: 9px; text-align: right; }
          th { background: #f3f4f6; }
          tr { break-inside: avoid; }
          @page { size: A4 landscape; margin: 12mm; }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(`الملف الشخصي - ${profileData.fullName}`)}</h1>
        ${profileDetails}
      </body>
    </html>
  `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f6f8]">
        <Loading />
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="flex min-h-[90vh] items-center justify-center bg-[#f5f6f8] px-4">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white px-6 py-10 text-center sm:px-10">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
            <UserRound size={30} strokeWidth={1.5} />
          </div>

          <h2 className="text-xl font-bold text-gray-900">
            لا توجد بيانات للملف الشخصي
          </h2>

          <p className="mx-auto mt-3 max-w-xs text-sm leading-7 text-gray-500">
            لم نتمكن من العثور على بيانات هذا المستخدم. يرجى التأكد من صحة البيانات والمحاولة مرة أخرى.
          </p>

          <div className="mx-auto mt-6 h-1 w-12 rounded-full bg-[#bf0200]" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ================= COVER ================= */}
      <div className="relative h-56 w-full overflow-hidden md:h-72">
        {profileData?.coverImage && (
          <Image
            src={profileData.coverImage}
            alt="cover"
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
      </div>

      {/* ================= HEADER ================= */}
      <div className="relative z-10 -mt-14 px-6 md:px-8">
        <div className="border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 text-right sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
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
                  الملف الشخصي
                </div>

                <h1 className="text-2xl font-extrabold text-gray-900 md:text-3xl">
                  {profileData?.fullName || "اسم المستخدم"}
                </h1>

                <p className="mt-2 text-sm text-gray-500">
                  بيانات الملف الشخصي وطرق التواصل داخل النظام
                </p>
              </div>
            </div>

            <div className="flex shrink-0 justify-start sm:justify-end">
              <button
                type="button"
                onClick={handleExportPdf}
                disabled={!profileData}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-all duration-200 hover:border-gray-400 hover:bg-gray-50 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                <FileText size={16} />
                تصدير الملف PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ================= CONTENT ================= */}
      <div className="grid gap-6 p-6 md:grid-cols-3 md:p-8">
        {/* ABOUT CARD */}
        <div className="border border-gray-200 bg-white p-6 shadow-sm md:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">نبذة</h2>
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
          {profileData?.email ? (
            <a
              href={`mailto:${profileData.email}`}
              className="flex items-center gap-3 border border-gray-100 bg-gray-50 p-3 transition-colors hover:border-blue-200 hover:bg-blue-50"
            >
              <Mail size={18} className="shrink-0 text-blue-500" />
              <div className="min-w-0 flex-1 text-right">
                <p className="text-xs text-gray-400">البريد الإلكتروني</p>
                <p className="truncate text-sm font-medium text-gray-700">
                  {profileData.email}
                </p>
              </div>
            </a>
          ) : (
            <div className="flex items-center gap-3 border border-gray-100 bg-gray-50 p-3">
              <Mail size={18} className="shrink-0 text-blue-500" />
              <div className="min-w-0 flex-1 text-right">
                <p className="text-xs text-gray-400">البريد الإلكتروني</p>
                <p className="text-sm font-medium text-gray-400">-</p>
              </div>
            </div>
          )}

          {/* WhatsApp + Phone */}
          {profileData?.phone ? (
            <>
              <a
                href={`https://wa.me/${profilePhone.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 border border-gray-100 bg-gray-50 p-3 transition-colors hover:border-green-200 hover:bg-green-50"
              >
                <MessageCircle size={18} className="shrink-0 text-green-500" />
                <div className="min-w-0 flex-1 text-right">
                  <p className="text-xs text-gray-400">واتساب</p>
                  <p className="truncate text-sm font-medium text-gray-700">
                    {profilePhone}
                  </p>
                </div>
              </a>

              <a
                href={`tel:${profilePhone.replace(/\s/g, "")}`}
                className="flex items-center gap-3 border border-gray-100 bg-gray-50 p-3 transition-colors hover:border-orange-200 hover:bg-orange-50"
              >
                <Phone size={18} className="shrink-0 text-orange-500" />
                <div className="min-w-0 flex-1 text-right">
                  <p className="text-xs text-gray-400">اتصال هاتفي</p>
                  <p className="truncate text-sm font-medium text-gray-700">
                    {profilePhone}
                  </p>
                </div>
              </a>
            </>
          ) : (
            <div className="flex items-center gap-3 border border-gray-100 bg-gray-50 p-3">
              <Phone size={18} className="shrink-0 text-gray-400" />
              <div className="min-w-0 flex-1 text-right">
                <p className="text-xs text-gray-400">رقم الهاتف</p>
                <p className="text-sm font-medium text-gray-400">-</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}