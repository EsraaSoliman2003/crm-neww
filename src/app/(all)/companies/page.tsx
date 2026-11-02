"use client";

import {
  Eye,
  Pencil,
  Trash2,
  Mail,
  MessageCircle,
  Phone,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import Button from "@/components/button/Button";
import { useAppDispatch, useAppSelector } from "@/rtk/hooks";
import { useEffect, useState } from "react";
import { deleteCompany, fetchCompanies } from "@/rtk/slices/companiesSlice";
import { confirmDelete } from "@/utils/confirmDelete";
import ButtonBar from "@/components/buttonBar/ButtonBar";
import { useRouter } from "next/navigation";
import Table from "@/components/table/Table";
import { Company } from "@/utils/dtos";
import Input from "@/components/form/Input";
import Loader from "@/components/loader/Loader";
import EmptyState from "@/components/emptyState/EmptyState";
import { card2BG } from "@/assets";

const SELF_REGISTERED = "تسجيل ذاتي";
const ADDED_BY_ADMIN = "أضافها الأدمن";

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" });

export default function CompaniesPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { data, loading } = useAppSelector((s) => s.companies);
  const [search, setSearch] = useState("");

  useEffect(() => {
    dispatch(fetchCompanies());
  }, [dispatch]);

  const handleDelete = (id: number) => {
    confirmDelete(id, (id) => dispatch(deleteCompany(Number(id))).unwrap());
  };
  const normalizedSearch = search.trim().toLowerCase();
  // registrationSource is a plain text copy so the column can be filtered and exported
  const filteredData = (data || [])
    .map((company) => ({
      ...company,
      registrationSource: company.isSelfRegistered ? SELF_REGISTERED : ADDED_BY_ADMIN,
    }))
    .filter((company) =>
      [company.companyName, company.email, company.phoneNumber]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedSearch)),
    );
  const flattenItems = (data: (Company & { registrationSource: string })[]) => {
    return data.map((item) => ({
      id: item.id,
      companyName: item.companyName,
      email: item.email,
      password: item.password,
      countryCode: item.countryCode,
      phoneNumber: item.phoneNumber,
      registrationSource: item.registrationSource,
    }));
  };
  return (
    <div className="space-y-8">
      <div className="space-y-5 rounded-b-3xl border-b border-orange-100/80 bg-linear-to-b from-orange-50/95 via-white/95 to-white/90 px-6 pb-5 pt-4 shadow-[0_10px_30px_-24px_rgba(154,52,18,0.45)] md:px-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="text-right">
            <h1 className="text-xl md:text-2xl font-bold">الشركات</h1>
          </div>

          <Button text="+ اضافة شركة" href={"/companies/add-company"} />
        </div>

        {/* button bar */}
        <ButtonBar
          title={"تقرير الشركات"}
          data={flattenItems(filteredData)}
        />
      </div>

      {/* Table */}
      {loading ? (
        <Loader />
      ) : data.length > 0 ? (
        <Table
          data={filteredData}
          filterContent={
            <Input
              name="companySearch"
              type="text"
              value={search}
              placeholder="ابحث باسم الشركة أو البريد الإلكتروني أو رقم الهاتف"
              onChange={(event) => setSearch(event.target.value)}
            />
          }
          loading={loading}
          emptyText="لا توجد شركات مطابقة للفلاتر المحددة"
          getRowKeyAction={(item) => item.id}
          onRowClickAction={(row) => router.push(`/companies/${row.id}`)}
          columns={[
            {
              key: "id",
              header: "الرقم",
              render: (_, index) => index + 1,
            },

            {
              key: "companyName",
              header: "اسم الشركة",
              filterable: true,
            },

            {
              key: "registrationSource",
              header: "مصدر التسجيل",
              filterable: true,
              render: (row) =>
                row.isSelfRegistered ? (
                  <div className="flex flex-col items-start gap-0.5">
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-700 ring-1 ring-green-200">
                      <UserCheck size={13} />
                      {SELF_REGISTERED}
                    </span>
                    <span className="text-[11px] text-gray-500">
                      تم القبول والاعتماد من الأدمن
                      {row.approvedAt ? ` • ${formatDate(row.approvedAt)}` : ""}
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-start gap-0.5">
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-blue-200">
                      <ShieldCheck size={13} />
                      {ADDED_BY_ADMIN}
                    </span>
                    {row.createdAt && (
                      <span className="text-[11px] text-gray-500">
                        {formatDate(row.createdAt)}
                      </span>
                    )}
                  </div>
                ),
            },

            {
              key: "email",
              header: "البريد الإلكتروني",
              render: (row) => row.email || "-",
            },

            {
              key: "phoneNumber",
              header: "رقم الهاتف",
              render: (row) => row.phoneNumber || "-",
            },

            {
              key: "contact",
              header: "التواصل",
              render: (row) => {
                const phone = (row.phoneNumber || "").replace(/\D/g, "");
                const whatsappNumber = `${phone}`.replace(/\D/g, "");

                return (
                  <div
                    className="flex items-center justify-center gap-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Email */}
                    <a
                      href={row.email ? `mailto:${row.email}` : undefined}
                      onClick={(e) => {
                        if (!row.email) e.preventDefault();
                      }}
                      title="إرسال بريد إلكتروني"
                      aria-label="إرسال بريد إلكتروني"
                      className={
                        row.email
                          ? "text-blue-500 transition-colors hover:text-blue-700"
                          : "cursor-not-allowed text-gray-300"
                      }
                    >
                      <Mail size={19} />
                    </a>

                    {/* WhatsApp */}
                    <a
                      href={
                        whatsappNumber
                          ? `https://wa.me/${whatsappNumber}`
                          : undefined
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => {
                        if (!whatsappNumber) e.preventDefault();
                      }}
                      title="مراسلة واتساب"
                      aria-label="مراسلة واتساب"
                      className={
                        whatsappNumber
                          ? "text-green-500 transition-colors hover:text-green-700"
                          : "cursor-not-allowed text-gray-300"
                      }
                    >
                      <MessageCircle size={19} />
                    </a>

                    {/* Phone Call */}
                    <a
                      href={whatsappNumber ? `tel:+${whatsappNumber}` : undefined}
                      onClick={(e) => {
                        if (!whatsappNumber) e.preventDefault();
                      }}
                      title="اتصال بالشركة"
                      aria-label="اتصال بالشركة"
                      className={
                        whatsappNumber
                          ? "text-orange-500 transition-colors hover:text-orange-700"
                          : "cursor-not-allowed text-gray-300"
                      }
                    >
                      <Phone size={19} />
                    </a>
                  </div>
                );
              },
            },

            {
              key: "actions",
              header: "خيارات",
              render: (row) => (
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/companies/add-company?mode=edit&id=${row.id}`);
                    }}
                    className="text-blue-500 transition-colors hover:text-blue-700"
                    aria-label="تعديل الشركة"
                  >
                    <Pencil size={18} />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/companies/${row.id}`);
                    }}
                    className="text-green-500 hover:text-green-700"
                  >
                    <Eye size={18} />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(row.id);
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ),
            },
          ]}
        />
      ) : (
        <EmptyState image={card2BG} title="لا يوجد شركات" />
      )}
    </div>
  );
}
