"use client";

import Button from "@/components/button/Button";
import Input from "@/components/form/Input";
import React, { useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/rtk/hooks";
import Loader from "@/components/loader/Loader";
import EmptyState from "@/components/emptyState/EmptyState";
import { card2BG } from "@/assets";
import { deleteEstimate, fetchEstimates } from "@/rtk/slices/estimatesSlice";
import { confirmDelete } from "@/utils/confirmDelete";
import ButtonBar from "@/components/buttonBar/ButtonBar";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Table from "@/components/table/Table";
import { Eye, Sigma, SquarePen, Trash2 } from "lucide-react";
import Dropdown from "@/components/dropdown/DropDown";
import { formatProjectCost } from "@/lib/formatProjectCost";

export default function Page() {
  const router = useRouter();
  const totalsRef = useRef<HTMLElement>(null);
  const dispatch = useAppDispatch();

  const { data, loading } = useAppSelector((s) => s.estimates);

  useEffect(() => {
    dispatch(fetchEstimates());
  }, [dispatch]);

  type FormType = {
    name: string;
    companyName: string;
    projectName: string;
    estimateComplete: string;
    estimateStage: string;
  };

  const [form, setForm] = useState<FormType>({
    name: "",
    companyName: "",
    projectName: "",
    estimateComplete: "",
    estimateStage: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const buildOptions = (
    values: (string | undefined | null)[],
    allLabel: string,
  ) => [
    { value: "", label: allLabel },
    ...Array.from(new Set(values.filter(Boolean) as string[])).map((value) => ({
      value,
      label: value,
    })),
  ];

  const companyOptions = buildOptions(
    data.map((est) => est.companyName),
    "كل الشركات",
  );

  const projectOptions = buildOptions(
    data.map((est) => est.projectName),
    "كل المشاريع",
  );

  const completeOptions = buildOptions(
    data.map((est) => est.estimateComplete?.name),
    "كل مراحل المقايسة",
  );

  const stageOptions = buildOptions(
    data.map((est) => est.estimateStage?.name),
    "كل حالات التمام",
  );

  const filteredEstimates = data.filter(
    (est) =>
      est.name.toLowerCase().includes(form.name.toLowerCase()) &&
      (form.companyName === "" || est.companyName === form.companyName) &&
      (form.projectName === "" || est.projectName === form.projectName) &&
      (form.estimateComplete === "" ||
        est.estimateComplete?.name === form.estimateComplete) &&
      (form.estimateStage === "" ||
        est.estimateStage?.name === form.estimateStage),
  );

  const handleDelete = (id: number) => {
    confirmDelete(id, (id) => dispatch(deleteEstimate(Number(id))).unwrap());
  };

  const totals = filteredEstimates.reduce(
    (sum, estimate) => {
      const cost = Number(estimate.totalItemPriceBefore);
      const analyzed = Number(estimate.totalItemPriceAfter);
      const offer = Number(estimate.adminOfferPrice);

      return {
        cost: sum.cost + (Number.isFinite(cost) ? cost : 0),
        analyzed: sum.analyzed + (Number.isFinite(analyzed) ? analyzed : 0),
        offer: sum.offer + (Number.isFinite(offer) ? offer : 0),
      };
    },
    { cost: 0, analyzed: 0, offer: 0 },
  );

  return (
    <div className="space-y-8">
      <div className="-mx-6 space-y-5 rounded-b-3xl border-b border-orange-100/80 bg-linear-to-b from-orange-50/95 via-white/95 to-white/90 px-6 pb-5 pt-4 shadow-[0_10px_30px_-24px_rgba(154,52,18,0.45)] md:-mx-8 md:px-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold md:text-2xl">المقايسات</h1>

          <div className="flex gap-3">
            <Button
              text="أضف مقايسه الى شركات"
              href="/add-estimate-to-company"
              border
            />
            <Button text="اضافة مقايسة" href="/estimates/add-estimate" />
          </div>
        </div>

        {/* Button Bar */}
        <ButtonBar
          title="تقرير المقايسات"
          data={filteredEstimates as unknown as Record<string, unknown>[]}
        />
      </div>

      {loading ? (
        <Loader />
      ) : data.length > 0 ? (
        <div className="space-y-3">
          <Table
            viewportFooterRef={totalsRef}
            data={filteredEstimates}
            emptyText="لا توجد مقايسات مطابقة للفلاتر المحددة"
            exportTitle="تقرير المقايسات"
            onExcelImportSuccess={async () => {
              dispatch(fetchEstimates());
            }}
            tableClassName="table-fixed!"
            filterContent={
              <div className="grid gap-3 md:grid-cols-5">
                <Input
                  name="name"
                  type="text"
                  value={form.name}
                  placeholder="أدخل اسم المقايسة"
                  onChange={handleChange}
                />

                <Dropdown
                  placeholder="فلتر الشركة"
                  options={companyOptions}
                  selected={form.companyName}
                  onSelect={(option) =>
                    setForm((prev) => ({
                      ...prev,
                      companyName: option.value,
                    }))
                  }
                />

                <Dropdown
                  placeholder="فلتر المشروع"
                  options={projectOptions}
                  selected={form.projectName}
                  onSelect={(option) =>
                    setForm((prev) => ({
                      ...prev,
                      projectName: option.value,
                    }))
                  }
                />

                <Dropdown
                  placeholder="فلتر مرحلة المقايسة"
                  options={completeOptions}
                  selected={form.estimateComplete}
                  onSelect={(option) =>
                    setForm((prev) => ({
                      ...prev,
                      estimateComplete: option.value,
                    }))
                  }
                />

                <Dropdown
                  placeholder="فلتر تمام المقايسة"
                  options={stageOptions}
                  selected={form.estimateStage}
                  onSelect={(option) =>
                    setForm((prev) => ({
                      ...prev,
                      estimateStage: option.value,
                    }))
                  }
                />
              </div>
            }
            getRowKeyAction={(item) => item.id}
            onRowClickAction={(row) => router.push(`/estimates/${row.id}`)}
            columns={[
              {
                key: "id",
                header: "الرقم",
                width: "48px",
                className: "whitespace-normal!",
                render: (_, index) => index + 1,
              },
              {
                key: "estimateNumber",
                header: "رقم المقايسة",
                width: "80px",
                className: "whitespace-normal!",
              },
              {
                key: "name",
                header: "اسم المقايسة",
                width: "300px",
                filterable: true,
              },
              {
                key: "companyName",
                header: "اسم الشركة",
                width: "105px",
                className: "whitespace-normal! wrap-break-word!",
                filterable: true,
              },
              {
                key: "projectName",
                header: "اسم المشروع",
                width: "150px",
                className: "whitespace-normal! wrap-break-word!",
                filterable: true,
              },
              {
                key: "estimateComplete",
                header: "مرحلة المقايسة",
                width: "85px",
                className: "whitespace-normal!",
                render: (row) => row.estimateComplete?.name,
                filterable: true,
              },
              {
                key: "estimateStage",
                header: "تمام المقايسة",
                width: "80px",
                className: "whitespace-normal!",
                render: (row) => row.estimateStage?.name,
                filterable: true,
              },
              {
                key: "totalItemPriceBefore",
                header: "التكلفة",
                width: "80px",
                className: "whitespace-normal!",
                render: (row) => formatProjectCost(row.totalItemPriceBefore),
                showTotal: true,
              },
              {
                key: "totalItemPriceAfter",
                header: "التكلفة طبقا للتحليل",
                width: "100px",
                className: "whitespace-normal!",
                render: (row) => formatProjectCost(row.totalItemPriceAfter),
                showTotal: true,
              },
              {
                key: "adminOfferPrice",
                header: "عرض المشروع",
                width: "80px",
                className: "whitespace-normal!",
                render: (row) => formatProjectCost(row.adminOfferPrice),
                showTotal: true,
              },
              {
                key: "actions",
                header: "خيارات",
                width: "90px",
                render: (row) => (
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/estimates/${row.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-green-500 hover:text-green-700"
                    >
                      <Eye size={18} />
                    </Link>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(
                          `/estimates/add-estimate?id=${row.id}&mode=edit`,
                        );
                      }}
                      className="text-green-600 hover:text-green-700"
                    >
                      <SquarePen size={18} />
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
        </div>
      ) : (
        <EmptyState image={card2BG} title="لا يوجد لديك مقايسات" />
      )}
    </div>
  );
}
