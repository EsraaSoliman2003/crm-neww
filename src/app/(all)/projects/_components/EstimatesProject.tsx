import { Project } from "@/utils/dtos";
import React, { useState } from "react";
import ChooseEstimates from "./ChooseEstimates";
import Button from "@/components/button/Button";
import { useAppDispatch, useAppSelector } from "@/rtk/hooks";
import { addEstimates, fetchProjectById } from "@/rtk/slices/projectsSlice";
import { toast } from "sonner";
import EmptyState from "@/components/emptyState/EmptyState";
import { card2BG } from "@/assets";
import Table from "@/components/table/Table";
import Link from "next/link";
import { confirmDelete } from "@/utils/confirmDelete";
import axios from "@/lib/axios";
import { Eye, Trash2 } from "lucide-react";
import Input from "@/components/form/Input";
import Dropdown from "@/components/dropdown/DropDown";
import { formatProjectCost } from "@/lib/formatProjectCost";

type Props = {
  project: Project | null;
};

export default function EstimatesProject({ project }: Props) {
  const [selected, setSelected] = useState<number[]>([]);
  const [openSelector, setOpenSelector] = useState(false);
  const [filters, setFilters] = useState({
    name: "",
    companyName: "",
    projectName: "",
    estimateComplete: "",
    estimateStage: "",
  });

  const dispatch = useAppDispatch();
  const { creating } = useAppSelector((s) => s.projects);

  if (!project) return null;

  const hasEstimates = project.estimates?.length > 0;
  const estimates = (project.estimates || []).filter(Boolean);
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
    estimates.map((estimate) => estimate.companyName),
    "كل الشركات",
  );
  const projectOptions = buildOptions(
    estimates.map((estimate) => estimate.projectName),
    "كل المشاريع",
  );
  const completeOptions = buildOptions(
    estimates.map((estimate) => estimate.estimateComplete?.name),
    "كل مراحل المقايسة",
  );
  const stageOptions = buildOptions(
    estimates.map((estimate) => estimate.estimateStage?.name),
    "كل حالات التمام",
  );
  const filteredEstimates = estimates.filter(
    (estimate) =>
      estimate.name.toLowerCase().includes(filters.name.toLowerCase()) &&
      (filters.companyName === "" ||
        estimate.companyName === filters.companyName) &&
      (filters.projectName === "" ||
        estimate.projectName === filters.projectName) &&
      (filters.estimateComplete === "" ||
        estimate.estimateComplete?.name === filters.estimateComplete) &&
      (filters.estimateStage === "" ||
        estimate.estimateStage?.name === filters.estimateStage),
  );

  const toggle = (id: number) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleAdd = async () => {
    try {
      await dispatch(
        addEstimates({
          projectId: Number(project.id),
          estimateIds: selected,
        }),
      ).unwrap();

      toast.success("تم إضافة المقايسات بنجاح");

      setSelected([]);
      setOpenSelector(false);

      dispatch(fetchProjectById(Number(project.id)));
    } catch {
      toast.error("حدث خطأ أثناء الإضافة");
    }
  };

  // delete estimate
  const handleDelete = async (id: number) => {
    await confirmDelete(id, async (id) => {
      await axios.delete(`project/remove-estimates`, {
        data: {
          projectId: project.id,
          estimateIds: [id],
        },
      });
      dispatch(fetchProjectById(Number(project.id)));
    });
  };

  const handleDeleteAll = async () => {
    await confirmDelete("all-project-estimates", async () => {
      await axios.delete(`project/remove-estimates`, {
        data: {
          projectId: project.id,
          estimateIds: estimates.map((estimate) => estimate.id),
        },
      });
      setSelected([]);
      setFilters({
        name: "",
        companyName: "",
        projectName: "",
        estimateComplete: "",
        estimateStage: "",
      });
      dispatch(fetchProjectById(Number(project.id)));
    });
  };

  return (
    <div className="space-y-4">
      {/* ================= HEADER ================= */}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-700">
          المقايسات
          {hasEstimates && (
            <span className="text-sm text-gray-400 ml-2">
              ({project.estimates.length})
            </span>
          )}
        </h2>

        <div className="flex flex-wrap items-center gap-3">
          {hasEstimates && (
            <button
              type="button"
              onClick={handleDeleteAll}
              className="flex items-center h-12 gap-2 border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
            >
              <Trash2 size={16} />
              حذف كل المقايسات
            </button>
          )}

          <Button
            text={hasEstimates ? "إضافة مقايسات" : "ابدأ بإضافة مقايسات"}
            onClick={() => setOpenSelector(true)}
          />
        </div>
      </div>

      {/* ================= EMPTY STATE ================= */}
      {!hasEstimates && !openSelector && (
        <EmptyState image={card2BG} title="لا يوجد مقايسات" />
      )}

      {/* ================= SELECTOR ================= */}
      {openSelector && (
        <div className="space-y-4">
          <ChooseEstimates
            currentEstimates={project.estimates}
            selectedEstimates={selected}
            setSelectedEstimates={setSelected}
            onToggle={toggle}
          />

          {/* ================= ACTION BAR ================= */}
          <div className="flex items-center justify-between bg-white p-4 shadow">
            <p className="text-sm text-gray-500">
              تم اختيار <b>{selected.length}</b> مقايسة
            </p>

            <div className="flex gap-3">
              <Button text="إلغاء" onClick={() => setOpenSelector(false)} />

              <Button
                text="إضافة"
                onClick={handleAdd}
                disabled={selected.length === 0}
                loading={creating}
              />
            </div>
          </div>
        </div>
      )}

      {/* ================= TABLE ================= */}
      {hasEstimates && (
        <div className="space-y-4">
          <Table
            fillViewport
            filterContent={
              <div className="grid gap-3 md:grid-cols-5">
                <Input
                  name="name"
                  type="text"
                  value={filters.name}
                  placeholder="أدخل اسم المقايسة"
                  onChange={(event) =>
                    setFilters((prev) => ({ ...prev, name: event.target.value }))
                  }
                />
                <Dropdown
                  placeholder="فلتر الشركة"
                  options={companyOptions}
                  selected={filters.companyName}
                  onSelect={(option) =>
                    setFilters((prev) => ({ ...prev, companyName: option.value }))
                  }
                />
                <Dropdown
                  placeholder="فلتر المشروع"
                  options={projectOptions}
                  selected={filters.projectName}
                  onSelect={(option) =>
                    setFilters((prev) => ({ ...prev, projectName: option.value }))
                  }
                />
                <Dropdown
                  placeholder="فلتر مرحلة المقايسة"
                  options={completeOptions}
                  selected={filters.estimateComplete}
                  onSelect={(option) =>
                    setFilters((prev) => ({
                      ...prev,
                      estimateComplete: option.value,
                    }))
                  }
                />
                <Dropdown
                  placeholder="فلتر تمام المقايسة"
                  options={stageOptions}
                  selected={filters.estimateStage}
                  onSelect={(option) =>
                    setFilters((prev) => ({
                      ...prev,
                      estimateStage: option.value,
                    }))
                  }
                />
              </div>
            }
            data={filteredEstimates}
            getRowKeyAction={(item) => item.id}
            columns={[
              {
                key: "id",
                header: "#",
                render: (_, index) => index + 1,
              },

              {
                key: "estimateNumber",
                header: "رقم المقايسة",
              },

              {
                key: "name",
                header: "اسم المقايسة",
                filterable: true,
              },

              {
                key: "companyName",
                header: "اسم الشركة",
                filterable: true,
              },

              {
                key: "projectName",
                header: "اسم المشروع",
                filterable: true,
              },

              {
                key: "estimateComplete",
                header: "مرحلة المقايسة",
                render: (row) => row.estimateComplete?.name || "-",
                filterable: true,
              },

              {
                key: "estimateStage",
                header: "تمام المقايسة",
                render: (row) => row.estimateStage?.name || "-",
                filterable: true,
              },

              {
                key: "totalItemPriceBefore",
                header: "التكلفة",
                render: (row) => formatProjectCost(row.totalItemPriceBefore),
              },

              {
                key: "totalItemPriceAfter",
                header: "التكلفة طبقا للتحليل",
                render: (row) => formatProjectCost(row.totalItemPriceAfter),
              },

              {
                key: "adminOfferPrice",
                header: "عرض المشروع",
                render: (row) => formatProjectCost(row.adminOfferPrice),
              },

              {
                key: "notes",
                header: "الملاحظات",
                render: (row) => (
                  <div className="max-w-62.5 truncate">{row.notes || "-"}</div>
                ),
              },

              {
                key: "actions",
                header: "خيارات",
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
      )}
    </div>
  );
}
