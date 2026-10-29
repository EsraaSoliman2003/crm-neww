import Table from "@/components/table/Table";
import Dropdown from "@/components/dropdown/DropDown";
import Input from "@/components/form/Input";
import { useAppDispatch, useAppSelector } from "@/rtk/hooks";
import { fetchEstimates } from "@/rtk/slices/estimatesSlice";
import { Estimate } from "@/utils/dtos";
import { formatProjectCost } from "@/lib/formatProjectCost";

import { useEffect, useState } from "react";

type Props = {
  selectedEstimates: number[];
  setSelectedEstimates: React.Dispatch<React.SetStateAction<number[]>>;
  onToggle: (id: number) => void;
  currentEstimates: Estimate[];
};

export default function ChooseEstimates({
  selectedEstimates,
  onToggle,
  currentEstimates,
  setSelectedEstimates,
}: Props) {
  const dispatch = useAppDispatch();
  const { data, loading } = useAppSelector((s) => s.estimates);
  const [filters, setFilters] = useState({
    name: "",
    companyName: "",
    projectName: "",
    estimateComplete: "",
    estimateStage: "",
  });

  useEffect(() => {
    dispatch(fetchEstimates());
  }, [dispatch]);
  useEffect(() => {
    const ids = currentEstimates
      ?.filter((item) => item != null)
      .map((item) => item.id);

    setSelectedEstimates(ids);
  }, [currentEstimates, setSelectedEstimates]);

  const estimates = data.filter(Boolean);
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

  return (
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
        loading={loading}
        emptyText="لا توجد مقايسات"
        getRowKeyAction={(item) => item.id}
        columns={[
          {
            key: "select",
            header: "اختيار",

            render: (row) => (
              <input
                type="checkbox"
                checked={selectedEstimates.includes(row.id)}
                onChange={() => onToggle(row.id)}
                className="w-4 h-4 accent-orange-500"
              />
            ),
          },

          {
            key: "id",
            header: "الرقم",
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
        ]}
      />
    </div>
  );
}
