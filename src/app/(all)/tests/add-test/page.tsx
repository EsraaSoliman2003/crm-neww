"use client";

import React, { useEffect, useState } from "react";
import Input from "@/components/form/Input";
import { useAppDispatch, useAppSelector } from "@/rtk/hooks";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { createTest, fetchTests, updateTest } from "@/rtk/slices/testsSlice";
import { fetchSubCategories } from "@/rtk/slices/subCategoriesSlice";
import { TestsNumber } from "@/constants/constantsNumbers";
import Textarea from "@/components/form/Textarea";
import Dropdown from "@/components/dropdown/DropDown";
import Button from "@/components/btn/Button";
import InlineCreateDropdownModal, {
  type InlineCreateConfig,
} from "@/components/dropdown/InlineCreateDropdownModal";

type FormState = {
  name: string;
  mainCategory: string;
  subCategory: string;
  costPerUnit: string;
  note: string;
};

export default function TestForm() {
  const router = useRouter();
  // Params
  const searchParams = useSearchParams();
  const mode = (searchParams.get("mode") as"create" |"edit") || "create";
  const testId = Number(searchParams.get("id"));
  // Params
  const dispatch = useAppDispatch();
  const [loadingBtn, setLoading] = useState<boolean>(false);

  /* ===========================
     Redux Data
  =========================== */
  const { data: tests } = useAppSelector((s) => s.tests);
  const { data: categoriesWithSubCategories } = useAppSelector(
    (s) => s.subCategories,
  );

  /* ===========================
     Form State
  =========================== */

  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [createConfig, setCreateConfig] = useState<InlineCreateConfig | null>(
    null,
  );
  const [form, setForm] = useState<FormState>({
    name: "",
    mainCategory: "",
    subCategory: "",
    costPerUnit: "",
    note: "",
  });

  /* ===========================
     Fetch Data
  =========================== */
  useEffect(() => {
    dispatch(fetchSubCategories(TestsNumber));
    if (mode ==="edit") {
      dispatch(fetchTests());
    }
  }, [dispatch, mode]);
  /* ===========================
     Fill Form In Edit Mode
  =========================== */
  useEffect(() => {
    if (mode ==="edit" && testId && categoriesWithSubCategories.length) {
      const testSingle = tests.find((m) => m.id === testId);

      if (!testSingle) return;

      const mainCategory = categoriesWithSubCategories.find(
        (cat) => cat.categoryName === testSingle.categoryName,
      );

      const subCategory = mainCategory?.subCategories.find(
        (sub) => sub.subCategoryName === testSingle.subCategoryName,
      );
       
      setForm({
        name: testSingle.name || "",
        mainCategory: String(mainCategory?.categoryId || ""),
        subCategory: String(subCategory?.subCategoryId || ""),
        costPerUnit: String(testSingle.costPerUnit || ""),
        note: testSingle.note || "",
      });
    }
  }, [mode, testId, tests, categoriesWithSubCategories]);

  /* ===========================
     Selected Category
  =========================== */

  const selectedCategory = categoriesWithSubCategories.find(
    (cat) => String(cat.categoryId) === form.mainCategory,
  );

  const subCategories = selectedCategory?.subCategories ?? [];

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
      newErrors.name ="اسم الاختبار مطلوب";
    }

    if (!form.mainCategory) {
      newErrors.mainCategory ="التصنيف الأساسي مطلوب";
    }

    if (!form.subCategory) {
      newErrors.subCategory ="التصنيف الفرعي مطلوب";
    }

    if (form.costPerUnit ==="" || Number(form.costPerUnit) <= 0) {
      newErrors.costPerUnit ="السعر مطلوب ويجب أن يكون أكبر من 0";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };
  /* ===========================
     Send Dtat
  =========================== */
  const handleSubmit  = async () => {
    if (!validate()) return;

    try {
      setLoading(true)
      const selectedSub = subCategories.find(
        (sub) => String(sub.subCategoryId) === form.subCategory,
      );

      if (!selectedSub) {
        toast.error("اختر تصنيف صحيح");
        return;
      }

      const entityCategoryMappingId = selectedSub.entityCategoryMappingId;

      const payload = {
        name: form.name,
        costPerUnit: Number(form.costPerUnit),
        note: form.note,
        entityCategoryMappingId: entityCategoryMappingId,
      };
      if (mode ==="create") {
        await dispatch(createTest(payload)).unwrap();

        toast.success("تم إضافة الاختبار بنجاح");
      } else {
        await dispatch(
          updateTest({
            id: testId!,
            ...payload,
          }),
        ).unwrap();

        toast.success("تم تعديل الاختبار بنجاح");
      }

      setForm({
        name: "",
        mainCategory: "",
        subCategory: "",
        costPerUnit: "",
        note: "",
      });

      setErrors({});
      router.push("/tests");
    } catch (error) {
      toast.error("حدث خطأ");
      console.log(error);
    }finally{
      setLoading(false)
    }
  };

  return (
    <>
      <div className="min-h-screen pt-6">
      <div className="bg-white rounded-2xl shadow p-6 space-y-8">
        {/* Name */}
        <div className="flex-1">
          <Input
            label="اسم الاختبار"
            name="name"
            value={form.name}
            placeholder="ادخل الاسم"
            onChange={handleChange}
          />
          {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
        </div>

        {/* Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Dropdown
              label={"التصنيف العام"}
              placeholder={"اختر التصنيف العام"}
              options={categoriesWithSubCategories.map((s) => ({
                value: String(s.categoryId),
                label: s.categoryName,
              }))}
              selected={form.mainCategory}
              onSelect={(opt) =>
                setForm((prev) => ({
                  ...prev,
                  mainCategory: opt.value,
                  subCategory: "",
                }))
              }
              linkType="button"
              linkText={" + \u0627\u0636\u0627\u0641\u0629 \u062a\u0635\u0646\u064a\u0641 \u0639\u0627\u0645"}
              onAdd={() =>
                setCreateConfig({
                  kind: "category",
                  onCreated: (category) => {
                    setForm((prev) => ({
                      ...prev,
                      mainCategory: String(category.id),
                      subCategory: "",
                    }));
                    void dispatch(fetchSubCategories(TestsNumber));
                  },
                })
              }
            />
            {errors.mainCategory && (
              <p className="text-red-500 text-sm">{errors.mainCategory}</p>
            )}
          </div>

          <div>
            <Dropdown
              label={"تصنيف الاختبار"}
              placeholder={"اختر التصنيف الفرعي"}
              options={subCategories.map((s) => ({
                value: String(s.subCategoryId),
                label: s.subCategoryName,
              }))}
              selected={form.subCategory}
              onSelect={(opt) =>
                setForm((prev) => ({
                  ...prev,
                  subCategory: opt.value,
                }))
              }
              linkType="button"
              linkText={" + \u0627\u0636\u0627\u0641\u0629 \u062a\u0635\u0646\u064a\u0641 \u0627\u062e\u062a\u0628\u0627\u0631"}
              onAdd={() =>
                setCreateConfig({
                  kind: "subcategory",
                  entityTypeId: TestsNumber,
                  defaultCategoryId: Number(form.mainCategory || 0),
                  onCreated: (subCategory) =>
                    setForm((prev) => ({
                      ...prev,
                      mainCategory: String(subCategory.categoryId),
                      subCategory: String(subCategory.subCategoryId),
                    })),
                })
              }
            />
            {errors.subCategory && (
              <p className="text-red-500 text-sm">{errors.subCategory}</p>
            )}
          </div>
        </div>

        {/* Cost + Note */}
        <div className="">
          <Input
            label="سعر الإختبار"
            type="number"
            name="costPerUnit"
            value={form.costPerUnit}
            placeholder="ادخل السعر"
            onChange={handleChange}
          />
          {errors.costPerUnit && (
            <p className="text-red-500 text-sm">{errors.costPerUnit}</p>
          )}
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
        <Button
          text={mode ==="create" ? "اضافة" :"تعديل"}
          onClick={handleSubmit }
          loading={loadingBtn}
        />
      </div>
      </div>
      <InlineCreateDropdownModal
        config={createConfig}
        onClose={() => setCreateConfig(null)}
      />
    </>
  );
}
