"use client";

import Button from "@/components/button/Button";
import Dropdown from "@/components/dropdown/DropDown";
import Input from "@/components/form/Input";
import Textarea from "@/components/form/Textarea";
import FormModal from "@/components/formModal/FormModal";
import Modal from "@/components/modal/Modal";
import axios from "@/lib/axios";
import { useAppDispatch, useAppSelector } from "@/rtk/hooks";
import { createAddedValue } from "@/rtk/slices/addedValueSlice";
import { fetchCategories } from "@/rtk/slices/categoriesSlice";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";

type FormState = {
  name: string;
  percentage: string;
  rateCategoryId: string;
  note: string;
};

interface RateCat {
  id: number;
  name: string;
}

export default function Page() {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const { creating } = useAppSelector((s) => s.addedValue);

  const [errors, setErrors] = useState<Partial<FormState>>({});

  const [form, setForm] = useState<FormState>({
    name: "",
    percentage: "",
    rateCategoryId: "",
    note: "",
  });
  // =========== Add RateCat
  const [addrate, setAddRate] = useState<string>();
  const [openMS, setOpenMS] = useState<boolean>(false);
  const [loadingS, setLoadingS] = useState(false);
  const [rateCategory, setRateCategory] = useState<RateCat[]>([]);

  // featch

  const fetchData = async () => {
    try {
      setLoadingS(true);

      const res = await axios.get("RateCategory");

      setRateCategory(res.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoadingS(false);
    }
  };

  // add

  const addRateCategory = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setLoadingS(true);
      const body = {
        name: addrate,
      };

      const res = await axios.post("RateCategory", body);

      setRateCategory((prev) => [...prev, res.data]);
      setOpenMS(false);
      setAddRate("");
    } catch (error) {
      console.log(error);
    } finally {
      setLoadingS(false);
    }
  };

  /* ===================== */
  useEffect(() => {
    dispatch(fetchCategories());
    fetchData();
  }, [dispatch]);

  /* ===================== */
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

  const handlePercentageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const { value } = e.target;

    if (value === "") {
      setForm((prev) => ({ ...prev, percentage: "" }));
      return;
    }

    const percentage = Number(value);

    if (!Number.isFinite(percentage) || percentage < 1 || percentage > 100) {
      return;
    }

    setForm((prev) => ({ ...prev, percentage: value }));
  };

  /* ===================== */
  const validate = () => {
    const newErrors: Partial<FormState> = {};

    if (!form.name.trim()) {
      newErrors.name ="الاسم مطلوب";
    }

    if (!form.percentage) {
      newErrors.percentage ="النسبة مطلوبة";
    } else if (
      Number(form.percentage) < 1 ||
      Number(form.percentage) > 100
    ) {
      newErrors.percentage = "النسبة يجب أن تكون من 1 إلى 100";
    }

    if (!form.rateCategoryId) {
      newErrors.rateCategoryId ="التصنيف مطلوب";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  /* ===================== */
  const handleSave = async () => {
    if (!validate()) return;

    try {
      await dispatch(
        createAddedValue({
          name: form.name,
          percentage: Number(form.percentage),
          entityTypeId: 4,
          rateCategoryId: Number(form.rateCategoryId),
          notes: form.note,
        }),
      ).unwrap();

      toast.success("تم إضافة القيمة المضافة");

      setForm({
        name: "",
        percentage: "",
        rateCategoryId: "",
        note: "",
      });

      setErrors({});
      router.push("/added-percentage");
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <>
      {/* add complete */}
      <Modal
        open={openMS}
        onClose={() => setOpenMS(false)}
        title="اضافة تصنيف نسبة"
      >
        <FormModal
          value={addrate ?? ""}
          onChange={setAddRate}
          onSubmit={addRateCategory}
          loading={loadingS}
          label="اسم تصنيف النسبة"
          placeholder="ادخل اسم تصنيف النسبة"
          buttonText="حفظ"
        />
      </Modal>
      <div className="min-h-screen pt-6">
        <div className="bg-white shadow p-6 space-y-8">
          {/* Name */}
          <div>
            <Input
              label="اسم النسبه"
              name="name"
              value={form.name}
              placeholder="ادخل الاسم"
              onChange={handleChange}
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Category */}
            <div>
              <Dropdown
                label={"تصنيف النسبة"}
                placeholder={"اختر تصنيف النسبة"}
                options={rateCategory.map((cat) => ({
                  value: String(cat.id),
                  label: cat.name,
                }))}
                selected={form.rateCategoryId}
                onSelect={(opt) =>
                  setForm((prev) => ({
                    ...prev,
                    rateCategoryId: opt.value,
                  }))
                }
                linkType="button"
                linkText=" + اضافة تصنيف"
                onAdd={() => setOpenMS(true)}
                loading={loadingS}
              />

              {errors.rateCategoryId && (
                <p className="text-red-500 text-sm mt-1">{errors.rateCategoryId}</p>
              )}
            </div>

            {/* Percentage */}
            <div>
              <Input
                label="قيمة النسبة"
                type="number"
                name="percentage"
                min={1}
                max={100}
                step="any"
                value={form.percentage}
                placeholder="ادخل قيمة النسبة"
                onChange={handlePercentageChange}
              />
              {errors.percentage && (
                <p className="text-red-500 text-sm mt-1">{errors.percentage}</p>
              )}
            </div>
          </div>

          <div className="">
            <Textarea
              label="ملاحظات"
              name="note"
              value={form.note}
              placeholder="ادخل ملاحظات"
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Submit */}
        <div className="mt-8 flex justify-end">
          <Button text="+ إضافة" onClick={handleSave} loading={creating} />
        </div>
      </div>
    </>
  );
}

