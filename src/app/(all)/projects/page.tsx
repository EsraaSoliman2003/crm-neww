"use client";
import Button from "@/components/button/Button";
import Input from "@/components/form/Input";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/rtk/hooks";
import { deleteProject, fetchProjects } from "@/rtk/slices/projectsSlice";
import EmptyState from "@/components/emptyState/EmptyState";
import { card2BG } from "@/assets";
import Loader from "@/components/loader/Loader";
import Link from "next/link";
import { confirmDelete } from "@/utils/confirmDelete";
import ButtonBar from "@/components/buttonBar/ButtonBar";
import { useRouter } from "next/navigation";
import Table from "@/components/table/Table";
import { Eye, SquarePen, Trash2 } from "lucide-react";
import { formatProjectCost } from "@/lib/formatProjectCost";

const formatProjectDate = (date: string) => {
  const parsedDate = new Date(date);

  if (!date || Number.isNaN(parsedDate.getTime())) return "-";

  return parsedDate.toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// const formatProjectCost = (cost: number) =>
//   new Intl.NumberFormat("en-US", {
//     maximumFractionDigits: 2,
//   }).format(cost);

export default function Page() {
  const router = useRouter();
  const totalsRef = useRef<HTMLElement>(null);
  const dispatch = useAppDispatch();
  const { data, loading } = useAppSelector((s) => s.projects);

  const [term, setTerm] = useState("");
  const [filteredProjects, setFilteredProjects] = useState(data);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setTerm(e.target.value);
  };

  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

  const searchedProjects = useMemo(
    () =>
      data.filter((project) =>
        project.name.toLowerCase().includes(term.toLowerCase()),
      ),
    [data, term],
  );

  const totalInvestmentCost = filteredProjects.reduce((total, project) => {
    const cost = Number(project.investmentCost);

    return total + (Number.isFinite(cost) ? cost : 0);
  }, 0);

  const handleDelete = (id: number) => {
    confirmDelete(id, (id) => dispatch(deleteProject(Number(id))).unwrap());
  };

  return (
    <div className="space-y-8">
      <div className="space-y-5 rounded-b-3xl border-b border-orange-100/80 bg-linear-to-b from-orange-50/95 via-white/95 to-white/90 px-6 pb-5 pt-4 shadow-[0_10px_30px_-24px_rgba(154,52,18,0.45)] md:px-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold md:text-2xl">المشاريع</h1>

          <Button text="اضافة مشروع" href="/projects/add-project" />
        </div>

        {/* button bar */}
        <ButtonBar title="تقرير المشاريع" data={filteredProjects} />
      </div>

      {loading ? (
        <Loader />
      ) : data.length > 0 ? (
        <div className="space-y-3">
          <Table
            viewportFooterRef={totalsRef}
            tableClassName="min-w-[1100px]! table-fixed!"
            data={searchedProjects}
            emptyText="لا توجد مشاريع مطابقة للفلاتر المحددة"
            exportTitle="تقرير المشاريع"
            onFilteredDataChange={setFilteredProjects}
            excelImportType="Projects"
            onExcelImportSuccess={async () => {
              dispatch(fetchProjects());
            }}
            excelTemplateColumns={[
              { header: "Project name", condition: "مطلوب" },
              { header: "Location", condition: "مطلوب" },
              { header: "Sector", condition: "مطلوب" },
              { header: "Start date", condition: "مطلوب (2026-10-13)" },
              { header: "Project type", condition: "مطلوب" },
              { header: "Investment cost", condition: "مطلوب رقم" },
              { header: "Description", condition: "اختياري" },
            ]}
            filterContent={
              <div className="grid gap-3 md:grid-cols-4">
                <Input
                  name="name"
                  type="text"
                  value={term}
                  placeholder="أدخل اسم المشروع"
                  onChange={handleChange}
                />
              </div>
            }
            getRowKeyAction={(item) => item.id}
            onRowClickAction={(row) => router.push(`/projects/${row.id}`)}
            columns={[
              {
                key: "id",
                header: "الرقم",
                width: "48px",
                render: (_, index) => index + 1,
              },

              {
                key: "name",
                header: "اسم المشروع",
                filterable: true,
                width: "150px",
                className:
                  "whitespace-normal! wrap-break-word! overflow-hidden",
              },

              {
                key: "location",
                header: "الموقع",
                filterable: true,
                width: "105px",
                className:
                  "whitespace-normal! wrap-break-word! overflow-hidden",
              },

              {
                key: "sector",
                header: "الجهه",
                filterable: true,
                width: "105px",
                className:
                  "whitespace-normal! wrap-break-word! overflow-hidden",
              },

              {
                key: "startDate",
                header: "تاريخ البدايه",
                width: "135px",
                className: "overflow-hidden",
                render: (row) => formatProjectDate(row.startDate),
                exportValue: (row) => formatProjectDate(row.startDate),
              },

              {
                key: "projectType",
                header: "نوع المشروع",
                filterable: true,
                width: "110px",
                className:
                  "whitespace-normal! wrap-break-word! overflow-hidden",
              },

              {
                key: "investmentCost",
                header: "التكلفه",
                width: "140px",
                className:
                  "overflow-hidden text-ellipsis font-semibold tabular-nums",
                render: (row) => formatProjectCost(row.investmentCost),
                exportValue: (row) => row.investmentCost,
                showTotal: true,
              },

              {
                key: "description",
                header: "الملاحظات",
                width: "100px",
                className:
                  "whitespace-normal! wrap-break-word! overflow-hidden",
                truncateWords: 4,
              },

              {
                key: "actions",
                header: "خيارات",
                width: "90px",
                render: (row) => (
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/projects/${row.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-green-500 hover:text-green-700"
                    >
                      <Eye size={18} />
                    </Link>

                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();

                        router.push(
                          `/projects/add-project?id=${row.id}&mode=edit`,
                        );
                      }}
                      className="text-green-600 hover:text-green-700"
                    >
                      <SquarePen size={18} />
                    </button>

                    <button
                      onClick={(e) => {
                        e.preventDefault();
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
        </div>
      ) : (
        <EmptyState image={card2BG} title="لا يوجد لديك مشاريع" />
      )}
    </div>
  );
}