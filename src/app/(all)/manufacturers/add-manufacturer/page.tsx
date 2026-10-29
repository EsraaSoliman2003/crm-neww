"use client";

import React, { useEffect, useRef, useState } from "react";
import Button from "@/components/button/Button";
import Input from "@/components/form/Input";
import { useAppDispatch, useAppSelector } from "@/rtk/hooks";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import {
  createManufacturing,
  fetchManufacturing,
  updateManufacturing,
} from "@/rtk/slices/ManufacturingSlice";
import { fetchDailies } from "@/rtk/slices/dailySlice";
import DisplayDailies from "./_components/DisplayDailies";
import { Daily } from "@/utils/dtos";
import Textarea from "@/components/form/Textarea";
import Dropdown from "@/components/dropdown/DropDown";
import { cn } from "@/utils/cn";
import { fetchCategories } from "@/rtk/slices/categoriesSlice";
import { fetchUnits } from "@/rtk/slices/unitsSlice";
import Image from "next/image";
import { default_image } from "@/assets";
import { Camera } from "lucide-react";
import InlineCreateDropdownModal, {
  type InlineCreateConfig,
} from "@/components/dropdown/InlineCreateDropdownModal";

type Error = {
  name: string;
  mainCategory: string;
  performanceRate: string;
  unit: string;
  notes: string;
  dailies: string;
};

type RowType = Daily & {
  quantity: number;
};

type DailyItem = {
  dailyId: string;
  quantity: string;
};

type FormState = {
  name: string;
  categoryId: string;
  performanceRate: number | null;
  unit: string;
  notes: string;
  dailies: DailyItem[];
  image: string | null;
};

export default function ManufacturingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const mode = (searchParams.get("mode") as "create" | "edit") || "create";
  const manufacturerId = Number(searchParams.get("id"));
  const isEdit = mode === "edit" && Boolean(manufacturerId);

  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [createConfig, setCreateConfig] = useState<InlineCreateConfig | null>(
    null,
  );

  const {
    creating,
    updating,
    data: manufacturersData,
  } = useAppSelector((s) => s.manufacturing);
  const { data: dailiesData } = useAppSelector((s) => s.daily);
  // main category
  const { data: mainCategory } = useAppSelector((s) => s.categories);
  const { data: unitsData } = useAppSelector((s) => s.units);
  const categoryOptions = mainCategory.map((category) => ({
    value: String(category.id),
    label: category.name,
  }));
  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(fetchUnits());
    dispatch(fetchDailies({ page: 1, pageSize: 1000 }));
    if (isEdit) {
      dispatch(fetchManufacturing({ page: 1, pageSize: 1000 }));
    }
  }, [dispatch, isEdit]);

  const filteredItems =
    selectedCategory === null
      ? dailiesData
      : dailiesData.filter((item) => item.category === selectedCategory);
  const [errors, setErrors] = useState<Error>({
    name: "",
    mainCategory: "",
    performanceRate: "",
    unit: "",
    notes: "",
    dailies: "",
  });

  const [form, setForm] = useState<FormState>({
    name: "",
    categoryId: "",
    performanceRate: null,
    unit: "",
    notes: "",
    dailies: [],
    image: null,
  });

  const [selectedDailyId, setSelectedDailyId] = useState("");
  const [qty, setQty] = useState("");
  const filledFormKeyRef = useRef("");

  /* ================= FILL EDIT DATA ================= */
  useEffect(() => {
    const editFormKey = `${mode}-${manufacturerId}`;

    if (!isEdit || filledFormKeyRef.current === editFormKey) return;

    const manufacturer = manufacturersData.find(
      (item) => item.id === manufacturerId,
    );
    if (!manufacturer) return;

    queueMicrotask(() => {
      setForm({
        name: manufacturer.name || "",
        categoryId: String(manufacturer.publicCategory?.id) || "",
        performanceRate: manufacturer.performanceRate ?? null,
        unit: String(
          manufacturer.unitId ??
            (typeof manufacturer.unit === "object"
              ? manufacturer.unit?.id
              : "") ??
            "",
        ),
        notes: manufacturer.notes || "",
        dailies: manufacturer.dailies.map((daily) => ({
          dailyId: String(daily.daily.id),
          quantity: String(daily.quantity),
        })),
        image: manufacturer.performanceRateImage,
      });
      filledFormKeyRef.current = editFormKey;
    });
  }, [isEdit, manufacturerId, mode, manufacturersData]);

  /* ================= OPTIONS ================= */
  const dailyOptions = filteredItems.map((d) => ({
    value: String(d.id),
    label: d.name,
  }));

  /* ================= VALID ================= */
  const isValid =
    selectedDailyId &&
    qty &&
    Number(qty) > 0 &&
    !form.dailies.some((d) => d.dailyId === selectedDailyId);

  /* ================= ADD ROW ================= */
  const addRow = () => {
    if (!isValid) return;

    setForm((prev) => ({
      ...prev,
      dailies: [...prev.dailies, { dailyId: selectedDailyId, quantity: qty }],
    }));

    setSelectedDailyId("");
    setQty("");
  };

  /* ================= DELETE ================= */
  const handleDeleteRow = (dailyId: string) => {
    setForm((prev) => ({
      ...prev,
      dailies: prev.dailies.filter((d) => d.dailyId !== dailyId),
    }));
  };

  /* ================= CHANGE ================= */
  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    // image input
    const target = e.target;
    if (target instanceof HTMLInputElement && target.type === "file") {
      const file = target.files?.[0];

      if (!file) return;

      setImageFile(file);

      setForm((prev) => ({
        ...prev,
        image: URL.createObjectURL(file),
      }));

      return;
    }
    const { name, value, type } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "number" ? (value === "" ? null : Number(value)) : value,
    }));
  };

  /* ================= VALIDATE ================= */
  const validate = () => {
    const newErrors: Error = {
      name: "",
      mainCategory: "",
      performanceRate: "",
      unit: "",
      notes: "",
      dailies: "",
    };

    if (!form.name.trim()) newErrors.name = "اسم المصنعية مطلوب";
    if (!form.categoryId) {
      newErrors.mainCategory = "التصنيف مطلوب";
    }

    if (form.performanceRate === null || form.performanceRate <= 0) {
      newErrors.performanceRate = "معدل الأداء مطلوب";
    }
    if (!form.unit) newErrors.unit = "الوحدة مطلوبة";

    if (form.dailies.length === 0) {
      newErrors.dailies = "أضف على الأقل يومية واحدة";
    }

    setErrors(newErrors);

    return Object.values(newErrors).every((err) => err === "");
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async () => {
    if (!validate()) return;
    if (form.performanceRate === null) return;
    try {
      const payload = {
        name: form.name,
        categoryId: Number(form.categoryId),
        performanceRate: form.performanceRate,
        unitId: Number(form.unit),
        notes: form.notes,
        dailies: form.dailies.map((d) => ({
          dailyId: Number(d.dailyId),
          quantity: Number(d.quantity),
        })),
        image: imageFile,
      };

      if (isEdit) {
        await dispatch(
          updateManufacturing({
            id: manufacturerId,
            ...payload,
          }),
        ).unwrap();

        toast.success("تم تعديل المصنعية بنجاح");
      } else {
        await dispatch(createManufacturing(payload)).unwrap();

        toast.success("تم إضافة المصنعية بنجاح");
      }

      router.push("/manufacturers");
    } catch (error) {
      console.log(error);
    }
  };

  /* ================= CHOSEN ================= */
  const chosenDailies = form.dailies
    .map((item) => {
      const full = dailiesData.find((d) => String(d.id) === item.dailyId);

      if (!full) return null;

      return {
        ...full,
        quantity: Number(item.quantity),
      };
    })
    .filter((item): item is RowType => item !== null);
  const totalSum = chosenDailies.reduce(
    (acc, item) => acc + item.quantity * item.pricePerDay,
    0,
  );
  return (
    <div className="min-h-screen pt-6">
      <div className="space-y-8">
        <div className="bg-white  shadow-[0_10px_25px_rgba(0,0,0,0.08)] p-6 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Input
                label="اسم المصنعية"
                name="name"
                value={form.name}
                onChange={handleChange}
              />
              {errors.name && <p className="text-red-500">{errors.name}</p>}
            </div>
            <div>
              <Dropdown
                label={"التصنيف العام"}
                placeholder={"اختر التصنيف العام"}
                options={categoryOptions}
                selected={form.categoryId}
                onSelect={(opt) =>
                  setForm((prev) => ({
                    ...prev,
                    categoryId: opt.value,
                  }))
                }
                linkType="button"
                linkText={" + \u0627\u0636\u0627\u0641\u0629 \u062a\u0635\u0646\u064a\u0641 \u0639\u0627\u0645"}
                onAdd={() =>
                  setCreateConfig({
                    kind: "category",
                    onCreated: (category) =>
                      setForm((prev) => ({
                        ...prev,
                        categoryId: String(category.id),
                      })),
                  })
                }
              />
              {errors.mainCategory && (
                <p className="text-red-500 text-sm">{errors.mainCategory}</p>
              )}
            </div>
            <div>
              <Dropdown
                label="الوحدة"
                placeholder="اختر الوحدة"
                options={unitsData.map((unit) => ({
                  value: String(unit.id),
                  label: unit.value,
                }))}
                selected={form.unit}
                onSelect={(option) =>
                  setForm((previous) => ({
                    ...previous,
                    unit: option.value,
                  }))
                }
                linkType="button"
                linkText=" + اضافة وحدة"
                onAdd={() =>
                  setCreateConfig({
                    kind: "unit",
                    onCreated: (unit) =>
                      setForm((previous) => ({
                        ...previous,
                        unit: String(unit.id),
                      })),
                  })
                }
              />
              {errors.unit && (
                <p className="text-sm text-red-500">{errors.unit}</p>
              )}
            </div>
          </div>

          <div>
            {/* INPUT ROW */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* filter */}
              <div className="">
                <span className="font-bold text-gray-700">
                  {"تصنيف اليومية"}
                </span>
                <div className="flex items-center gap-3 mt-3">
                  <button
                    type="button"
                    className={cn(
                      "flex items-center justify-center h-13.75 bg-gray-100  w-full font-medium",
                      selectedCategory === 1 && "bg-red-200",
                    )}
                    onClick={() => {
                      setSelectedCategory(1);
                    }}
                  >
                    {"معدات"}
                  </button>
                  <button
                    type="button"
                    className={cn(
                      "flex items-center justify-center h-13.75 bg-gray-100  w-full font-medium",
                      selectedCategory === 0 && "bg-red-200",
                    )}
                    onClick={() => {
                      setSelectedCategory(0);
                    }}
                  >
                    {"عمالة"}
                  </button>
                  <button
                    type="button"
                    className={cn(
                      "flex items-center justify-center h-13.75 bg-gray-100  w-full font-medium",
                      selectedCategory === null && "bg-red-200",
                    )}
                    onClick={() => {
                      setSelectedCategory(null);
                    }}
                  >
                    {"الكل"}
                  </button>
                </div>
              </div>
              <Dropdown
                label={"اليومية"}
                placeholder={"اختر اليومية"}
                options={dailyOptions}
                selected={selectedDailyId}
                onSelect={(e) => setSelectedDailyId(e.value)}
              />

              <Input
                name=""
                label="عدد اليوميات"
                placeholder=" ادخل عدد اليوميات"
                type="number"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
              />
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={addRow}
                disabled={!isValid}
                className="text-orange-500 transition-all duration-200
                   disabled:text-gray-400 
                   disabled:cursor-not-allowed 
                   disabled:opacity-50 
                   hover:text-orange-600"
              >
                + إضافة اليومية
              </button>
            </div>
            {errors.dailies && <p className="text-red-500">{errors.dailies}</p>}
          </div>
        </div>

        {/* TABLE */}
        <DisplayDailies data={chosenDailies} onDelete={handleDeleteRow} />

        <div className="bg-white  shadow-[0_10px_25px_rgba(0,0,0,0.08)] p-6 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              {/* PERFORMANCE */}
              <Input
                label="معدل الأداء"
                type="number"
                name="performanceRate"
                value={form.performanceRate ?? ""}
                onChange={handleChange}
              />
              {errors.performanceRate && (
                <p className="text-red-500">{errors.performanceRate}</p>
              )}
            </div>
            {/* image */}
            <div>
              <div className="text-gray-700 font-bold mb-3">
                صورة معدل الاداء
              </div>
              <div className="relative h-13.5 w-13.5">
                <Image
                  src={form.image || default_image}
                  alt="material"
                  fill
                  sizes="100px"
                  className="object-cover"
                />

                <label
                  htmlFor="m_img"
                  className="absolute bottom-0 right-0 z-10 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-black/20 text-white shadow"
                >
                  <Camera size={20} />
                </label>

                <input
                  id="m_img"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="">
            <div className="text-gray-700 font-bold">
              سعر المصنعية بعد معدل الاداء
            </div>
            <div className="h-13.75 border border-gray-200  font-medium text-xl px-6 flex items-center mt-4 text-red-600">
              {form.performanceRate
                ? (totalSum / form.performanceRate).toFixed(2)
                : 0}
            </div>
          </div>

          {/* NOTES */}
          <div className="">
            <Textarea
              label="ملاحظات"
              name="notes"
              value={form.notes}
              placeholder="ادخل ملاحظات"
              onChange={handleChange}
            />
          </div>
        </div>
      </div>

      <div className="mt-10 flex justify-end">
        <Button
          text={isEdit ? "تعديل المصنعية" : "إضافة المصنعية"}
          onClick={handleSubmit}
          loading={creating || updating}
        />
      </div>
      <InlineCreateDropdownModal
        config={createConfig}
        onClose={() => setCreateConfig(null)}
      />
    </div>
  );
}
