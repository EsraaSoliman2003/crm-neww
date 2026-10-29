"use client";

import React, { useEffect, useState } from "react";
import Input from "@/components/form/Input";
import { useAppDispatch, useAppSelector } from "@/rtk/hooks";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import {
  createDaily,
  fetchDailies,
  updateDaily,
} from "@/rtk/slices/dailySlice";
import { fetchCategories } from "@/rtk/slices/categoriesSlice";
import Textarea from "@/components/form/Textarea";
import Dropdown from "@/components/dropdown/DropDown";
import Button from "@/components/btn/Button";

type FormState = {
  name: string;
  dailyCategory: string;
  price: string;
  note: string;
};

export default function MaterialForm() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [loadingBtn, setLoading] = useState<boolean>(false);
  /* ===========================
            Params
  =========================== */
  const searchParams = useSearchParams();
  const mode = (searchParams.get("mode") as "create" | "edit") || "create";
  const dailyId = Number(searchParams.get("id"));
  /* ===========================
        Data From Redux
  =========================== */
  const { data: dailies } = useAppSelector((s) => s.daily);
  useEffect(() => {
    dispatch(fetchCategories());
    if (mode === "edit") {
      dispatch(fetchDailies({ page: 1, pageSize: 1000 }));
    }
  }, [dispatch, mode]);
  /* ===========================
        From State
  =========================== */
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [form, setForm] = useState<FormState>({
    name: "",
    dailyCategory: "",
    price: "",
    note: "",
  });
  /* ===========================
     Fill Form In Edit Mode
  =========================== */
  useEffect(() => {
    if (mode === "edit" && dailyId) {
      const daily = dailies.find((d) => d.id === dailyId);
      if (!daily) return;

      setForm({
        name: daily.name || "",
        dailyCategory: String(daily.category),
        price: String(daily.pricePerDay || ""),
        note: daily.note || "",
      });
    }
  }, [mode, dailyId, dailies]);

  /* ===========================
     Handle Change
  =========================== */

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /* ===========================
          Validation
  =========================== */

  const validate = () => {
    const newErrors: Partial<FormState> = {};

    if (!form.name.trim()) {
      newErrors.name = "اسم اليوميه مطلوب";
    }

    if (!form.dailyCategory) {
      newErrors.dailyCategory = "تصنيف اليوميه مطلوب";
    }

    if (!form.price || Number(form.price) <= 0) {
      newErrors.price = "السعر مطلوب ويجب أن يكون أكبر من 0";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  /* ===========================
           Submit
  =========================== */

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      setLoading(true);
      if (mode === "create") {
        await dispatch(
          createDaily({
            name: form.name,
            category: Number(form.dailyCategory),
            pricePerDay: Number(form.price),
            note: form.note,
          }),
        ).unwrap();

        toast.success("تم إضافة اليوميه بنجاح");
      } else {
        await dispatch(
          updateDaily({
            id: dailyId,
            name: form.name,
            category: Number(form.dailyCategory),
            pricePerDay: Number(form.price),
            note: form.note,
          }),
        ).unwrap();

        toast.success("تم تعديل اليوميه بنجاح");
      }

      setForm({
        name: "",
        dailyCategory: "",
        price: "",
        note: "",
      });

      setErrors({});
      router.push("/daily");
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen pt-6">
      <div className="bg-white shadow p-6 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Input
              label="اسم اليوميه"
              name="name"
              value={form.name}
              placeholder="ادخل الاسم"
              onChange={handleChange}
            />
            {errors.name && (
              <p className="text-red-500 text-sm">{errors.name}</p>
            )}
          </div>
          <div>
            <Dropdown
              label={"تصنيف اليومية"}
              placeholder={"اختر تصنيف اليومية"}
              options={[
                { value: "0", label: "عمالة" },
                { value: "1", label: "معدة" },
              ]}
              selected={form.dailyCategory}
              onSelect={(opt) =>
                setForm((prev) => ({
                  ...prev,
                  dailyCategory: opt.value,
                }))
              }
            />
            {errors.dailyCategory && (
              <p className="text-red-500 text-sm">{errors.dailyCategory}</p>
            )}
          </div>
        </div>

        <div className="flex-1">
          <Input
            label="سعر اليوميه"
            type="number"
            name="price"
            value={form.price}
            placeholder="ادخل السعر"
            onChange={handleChange}
          />
          {errors.price && (
            <p className="text-red-500 text-sm">{errors.price}</p>
          )}
        </div>

        <div className="flex-1">
          <Textarea
            label="الملاحظات"
            name="note"
            value={form.note}
            placeholder="ادخل ملاحظاتك"
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <Button
          text={mode === "create" ? "اضافة" : "تعديل"}
          onClick={handleSubmit}
          loading={loadingBtn}
        />
      </div>
    </div>
  );
}
