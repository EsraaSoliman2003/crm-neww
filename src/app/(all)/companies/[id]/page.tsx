"use client";

import React, { useEffect, useState } from "react";
import { Building2, FileText, Mail, Phone, MessageCircle } from "lucide-react";
import Loader from "@/components/loader/Loader";
import EmptyState from "@/components/emptyState/EmptyState";
import { card2BG, default_image } from "@/assets";
import { useAppDispatch, useAppSelector } from "@/rtk/hooks";
import { useParams } from "next/navigation";
import {
  CompanyEstimate,
  fetchCompanyEstimates,
  fetchCompanyGlobalEstimates,
} from "@/rtk/slices/companiesSlice";
import { ProfileData } from "@/lib/dtos";
import axios from "@/lib/axios";
import Loading from "@/skilton/Loading";
import Images from "@/app/supplier/(home)/_components/Images";
import Table from "@/components/table/Table";
import Image from "next/image";
import { toast } from "sonner";
import QRCode from "qrcode";

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
      <tr>
        ${headers
    .map((header) => `<th>${escapeHtml(header)}</th>`)
    .join("")}
      </tr>
    </thead>

    <tbody>
      ${rows.length
    ? rows
      .map(
        (row) =>
          `<tr>
                    ${row
            .map((cell) => `<td>${escapeHtml(cell)}</td>`)
            .join("")}
                  </tr>`,
      )
      .join("")
    : `<tr>
              <td colspan="${headers.length}">لا توجد بيانات</td>
            </tr>`
  }
    </tbody>
  </table>
`;

export default function Page() {
  const params = useParams();
  const id = Number(params?.id);
  const dispatch = useAppDispatch();

  const {
    globalEstimates,
    estimates,
    globalEstimatesLoading,
    estimatesLoading,
  } = useAppSelector((s) => s.companies);

  const [loading, setLoading] = useState<boolean>(false);
  const [profileData, setProfileData] = useState<ProfileData>();
  const [qrCodeImage, setQrCodeImage] = useState("");
  const [filteredCompanyEstimatesForPdf, setFilteredCompanyEstimatesForPdf] =
    useState<CompanyEstimate[] | null>(null);
  const [filteredAvailableEstimatesForPdf, setFilteredAvailableEstimatesForPdf] =
    useState<CompanyEstimate[] | null>(null);

  useEffect(() => {
    if (!id) return;

    let isCurrent = true;
    const profileUrl = `https://crm-psi-jet.vercel.app//profile/${id}`;

    QRCode.toDataURL(profileUrl, {
      width: 200,
      margin: 2,
      errorCorrectionLevel: "H",
    })
      .then((image) => {
        if (isCurrent) setQrCodeImage(image);
      })
      .catch((error: unknown) => {
        console.error("Failed to generate company profile QR code", error);
        if (isCurrent) {
          toast.error("تعذر تجهيز رمز QR لملف الشركة");
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [id]);

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
      dispatch(fetchCompanyGlobalEstimates(Number(id)));
      dispatch(fetchCompanyEstimates(Number(id)));
      getProfile();
    }
  }, [dispatch, id]);

  const supplierPhone = profileData?.phone
    ? profileData.phone.startsWith("+")
      ? profileData.phone
      : `${profileData.countryCode || ""}${profileData.phone}`
    : "-";

  const handleExportPdf = async () => {
    if (!profileData) {
      toast.error("بيانات الشركة غير متاحة للتصدير");
      return;
    }
    if (!qrCodeImage) {
      toast.error("رمز QR لم يجهز بعد، حاول مرة أخرى");
      return;
    }

    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      toast.error(
        "تعذر فتح نافذة التصدير، يرجى السماح بالنوافذ المنبثقة",
      );
      return;
    }

    const companyDetails = buildReportTable(
      "بيانات الشركة",
      ["البيان", "التفاصيل"],
      [
        ["اسم الشركة", profileData.fullName || "-"],
        ["البريد الإلكتروني", profileData.email || "-"],
        ["رقم الهاتف", supplierPhone],
        [
          "نبذة عن الشركة",
          profileData.aboutMe || "لا توجد نبذة مضافة",
        ],
      ],
    );

    const companyEstimatesReport = buildReportTable(
      "مقايسات الشركة",
      ["#", "اسم المقايسة", "عرض المشروع", "نوع العرض"],
      (filteredCompanyEstimatesForPdf ?? estimates).map((item, index) => [
        index + 1,
        item.estimateName || "-",
        item.price,
        item.isAdminPrice ? "إدارى" : "شركة",
      ]),
    );

    const availableEstimatesReport = buildReportTable(
      "المقايسات المتاحة",
      ["#", "اسم المقايسة", "عرض المشروع", "نوع العرض"],
      (filteredAvailableEstimatesForPdf ?? globalEstimates).map((item, index) => [
        index + 1,
        item.estimateName || "-",
        item.price,
        item.isAdminPrice ? "إدارى" : "شركة",
      ]),
    );

    printWindow.document.write(`
      <!doctype html>

      <html lang="ar" dir="rtl">
        <head>
          <meta charset="UTF-8" />

          <title>
            ${escapeHtml(`ملف الشركة - ${profileData.fullName}`)}
          </title>

          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 24px;
              color: #111827;
            }

            h1 {
              margin: 0 0 24px;
              text-align: center;
            }

            h2 {
              margin: 28px 0 12px;
              break-after: avoid;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 24px;
            }

            th,
            td {
              border: 1px solid #d1d5db;
              padding: 9px;
              text-align: right;
            }

            th {
              background: #f3f4f6;
            }

            tr {
              break-inside: avoid;
            }

            @page {
              size: A4 landscape;
              margin: 12mm;
            }

            .header-section {
              display: flex;
              flex-direction: row;
              align-items: center;
              justify-content: flex-start;
              gap: 20px;
              margin-bottom: 24px;
              padding: 12px;
              border: 1px solid #e5e7eb;
              background: #f9fafb;
              direction: rtl;
            }

            .header-section h1 {
              margin: 0;
              text-align: right;
              font-size: 24px;
              font-weight: bold;
              color: #111827;
            }

            .qr-section {
              flex-shrink: 0;
              width: 110px;
              text-align: center;
              margin: 0;
            }

            .qr-section img {
              width: 90px;
              height: 90px;
              display: block;
              margin: 0 auto;
            }

            .qr-section p {
              margin: 6px 0 0;
              font-size: 10px;
              color: #4b5563;
            }

          </style>
        </head>

        <body>
          <div class="header-section">
            <div class="qr-section">
              <img src="${qrCodeImage}" alt="QR Code" />
              <p>امسح الكود لعرض ملف المورد</p>
            </div>

            <h1> ${escapeHtml(`ملف الشركة - ${profileData.fullName}`)}</h1>
          </div>

          ${companyDetails}
          ${companyEstimatesReport}
          ${availableEstimatesReport}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    const printQrImage = printWindow.document.querySelector<HTMLImageElement>(
      'img[alt="QR Code"]',
    );
    if (!printQrImage) {
      printWindow.close();
      toast.error("تعذر تجهيز رمز QR للطباعة");
      return;
    }

    try {
      await printQrImage.decode();
    } catch (error) {
      console.error("Failed to load company QR code in print window", error);
      printWindow.close();
      toast.error("تعذر تجهيز رمز QR للطباعة");
      return;
    }

    printWindow.print();
  };

  const renderEstimateColumns = () => [
    {
      key: "estimateId" as const,
      header: "#",
      className: "text-center",
      render: (_row: CompanyEstimate, index: number) => index + 1,
    },
    {
      key: "estimateName" as const,
      header: "اسم المقايسة",
      className: "text-center",
      filterable: true,
    },
    {
      key: "price" as const,
      header: "عرض المشروع",
      className: "text-center font-medium",
      filterable: true,
    },
    {
      key: "isAdminPrice" as const,
      header: "نوع العرض",
      className: "text-center",
      render: (row: CompanyEstimate) =>
        row.isAdminPrice ? "إدارى" : "شركة",
      filterable: true,
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 -mx-8">
      {/* ================= COVER ================= */}
      <Images coverImage={profileData?.coverImage} />

      {/* ================= HEADER ================= */}
      <div className="px-6 pt-6 md:px-8">
        <div className="border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 text-right sm:flex-row sm:items-center sm:justify-between">
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
                  <Building2 size={16} />
                  ملف الشركة
                </div>

                <h1 className="text-2xl font-extrabold text-gray-900 md:text-3xl">
                  {profileData?.fullName || "اسم الشركة"}
                </h1>

                <p className="mt-2 text-sm text-gray-500">
                  بيانات الشركة والمقايسات المرتبطة والمتاحة لها داخل
                  النظام
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-4 justify-start sm:justify-end">
              <button
                type="button"
                onClick={handleExportPdf}
                disabled={
                  !profileData ||
                  estimatesLoading ||
                  globalEstimatesLoading ||
                  !qrCodeImage
                }
                className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-all duration-200 hover:border-gray-400 hover:bg-gray-50 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                <FileText size={16} />
                تصدير ملف الشركة PDF
              </button>

              {qrCodeImage && (
                <div className="flex flex-col items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-2">
                  <Image
                    src={qrCodeImage}
                    alt="رمز QR لملف الشركة"
                    width={80}
                    height={80}
                    unoptimized
                  />
                  <span className="text-xs text-gray-500">ملف الشركة</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ================= CONTENT ================= */}
      <div className="grid gap-6 p-6 md:grid-cols-3 md:p-8">
        {/* ABOUT CARD */}
        <div className="border border-gray-200 bg-white p-6 shadow-sm md:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">
              عن الشركة
            </h2>

            <FileText size={20} className="text-gray-400" />
          </div>

          <p className="min-h-24 text-right leading-8 text-gray-600">
            {profileData?.aboutMe ||
              "لا توجد نبذة مضافة حتى الآن."}
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
              className="flex items-center justify-between gap-3 border border-gray-100 bg-gray-50 p-3 transition-colors hover:border-blue-200 hover:bg-blue-50"
            >
              <Mail size={18} className="shrink-0 text-blue-500" />

              <span className="truncate text-sm font-medium text-gray-700">
                {profileData.email}
              </span>
            </a>
          ) : (
            <div className="flex items-center justify-between gap-3 border border-gray-100 bg-gray-50 p-3">
              <Mail size={18} className="shrink-0 text-blue-500" />

              <span className="text-sm font-medium text-gray-400">
                -
              </span>
            </div>
          )}

          {/* WhatsApp & Phone Call */}
          {profileData?.phone ? (
            <>
              {/* WhatsApp */}
              <a
                href={`https://wa.me/${supplierPhone.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-3 border border-gray-100 bg-gray-50 p-3 transition-colors hover:border-green-200 hover:bg-green-50"
              >
                <MessageCircle size={18} className="shrink-0 text-green-500" />

                <span className="truncate text-sm font-medium text-gray-700">
                  {supplierPhone}
                </span>
              </a>

              {/* Direct Call */}
              <a
                href={`tel:${supplierPhone.replace(/[^\d+]/g, "")}`}
                className="flex items-center justify-between gap-3 border border-gray-100 bg-gray-50 p-3 transition-colors hover:border-orange-200 hover:bg-orange-50"
              >
                <Phone size={18} className="shrink-0 text-orange-500" />

                <span className="truncate text-sm font-medium text-gray-700">
                  {supplierPhone}
                </span>
              </a>
            </>
          ) : (
            <div className="flex items-center justify-between gap-3 border border-gray-100 bg-gray-50 p-3">
              <Phone size={18} className="shrink-0 text-gray-400" />

              <span className="text-sm font-medium text-gray-400">-</span>
            </div>
          )}
        </div>
      </div>

      {/* ================= ESTIMATES ================= */}
      <div className="px-6 pb-10 md:px-8">
        <h2 className="mb-4 text-right text-xl font-bold">
          مقايساته
        </h2>

        {estimatesLoading ? (
          <Loader />
        ) : estimates.length > 0 ? (
          <Table
            fillViewport
            data={estimates}
            onFilteredDataChange={setFilteredCompanyEstimatesForPdf}
            getRowKeyAction={(row) => row.estimateId}
            tableClassName="min-w-290"
            emptyText="لا يوجد بيانات"
            columns={renderEstimateColumns()}
          />
        ) : (
          <EmptyState
            image={card2BG}
            title="لا يوجد لديك بيانات"
          />
        )}
      </div>

      {/* ================= GLOBAL ESTIMATES ================= */}
      <div className="px-6 pb-10 md:px-8">
        <h2 className="mb-4 text-right text-xl font-bold">
          المقايسات المتاحه
        </h2>

        {globalEstimatesLoading ? (
          <Loader />
        ) : globalEstimates.length > 0 ? (
          <Table
            fillViewport
            data={globalEstimates}
            onFilteredDataChange={setFilteredAvailableEstimatesForPdf}
            getRowKeyAction={(row) => row.estimateId}
            tableClassName="min-w-290"
            emptyText="لا يوجد بيانات"
            columns={renderEstimateColumns()}
          />
        ) : (
          <EmptyState
            image={card2BG}
            title="لا يوجد لديك بيانات"
          />
        )}
      </div>
    </div>
  );
}
