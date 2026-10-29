"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import Dropdown from "@/components/dropdown/DropDown";
import Input from "@/components/form/Input";
import Textarea from "@/components/form/Textarea";
import { TestsNumber } from "@/constants/constantsNumbers";
import { useAppDispatch, useAppSelector } from "@/rtk/hooks";
import { fetchSubCategories } from "@/rtk/slices/subCategoriesSlice";
import { createTest, fetchTests, updateTest } from "@/rtk/slices/testsSlice";
import type { Test } from "@/utils/dtos";
import QuickCreateModal from "./QuickCreateModal";

type Props = {
  onClose: () => void;
  onCreated: (testId: number, percentage: number) => void;
  editItem?: Test & { percentage: number };
};

export default function QuickCreateTestModal({ onClose, onCreated, editItem }: Props) {
  const dispatch = useAppDispatch();
  const categories = useAppSelector((state) => state.subCategories.data);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    mainCategory: "",
    subCategory: "",
    costPerUnit: "",
    percentage: "",
    note: "",
  });

  useEffect(() => {
    dispatch(fetchSubCategories(TestsNumber));
  }, [dispatch]);

  useEffect(() => {
    if (!editItem || categories.length === 0) return;
    const category = categories.find(
      (item) => item.categoryName === editItem.categoryName,
    );
    const subCategory = category?.subCategories.find(
      (item) => item.subCategoryName === editItem.subCategoryName,
    );
    setForm({
      name: editItem.name,
      mainCategory: String(category?.categoryId ?? ""),
      subCategory: String(subCategory?.subCategoryId ?? ""),
      costPerUnit: String(editItem.costPerUnit),
      percentage: String(editItem.percentage),
      note: editItem.note ?? "",
    });
  }, [categories, editItem]);

  const selectedCategory = categories.find(
    (category) => String(category.categoryId) === form.mainCategory,
  );
  const subCategories = selectedCategory?.subCategories ?? [];

  const submit = async () => {
    const selectedSubCategory = subCategories.find(
      (subCategory) =>
        String(subCategory.subCategoryId) === form.subCategory,
    );
    if (
      !form.name.trim() ||
      !selectedSubCategory ||
      Number(form.costPerUnit) <= 0 ||
      Number(form.percentage) <= 0
    ) {
      toast.error("أكمل بيانات الاختبار ونسبة التحليل");
      return;
    }

    try {
      setSaving(true);
      const payload = {
          name: form.name.trim(),
          costPerUnit: Number(form.costPerUnit),
          note: form.note,
          entityCategoryMappingId:
            selectedSubCategory.entityCategoryMappingId,
      };
      const saved = editItem
        ? await dispatch(updateTest({ id: editItem.id, ...payload })).unwrap()
        : await dispatch(createTest(payload)).unwrap();
      await dispatch(fetchTests()).unwrap();
      onCreated(editItem?.id ?? saved.id, Number(form.percentage));
      toast.success(editItem ? "تم تعديل الاختبار الأصلي" : "تم إنشاء الاختبار واختياره");
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <QuickCreateModal
      title={editItem ? "تعديل الاختبار الأصلي" : "إضافة اختبار جديد"}
      description={editItem ? "سيتم حفظ التعديل على الاختبار في النظام كله." : "أنشئ الاختبار وحدد نسبته ليُضاف إلى تحليل البند مباشرة."}
      onClose={onClose}
    >
      <div className="space-y-5">
        <Input
          label="اسم الاختبار"
          name="name"
          value={form.name}
          onChange={(event) =>
            setForm((previous) => ({ ...previous, name: event.target.value }))
          }
        />
        <div className="grid gap-4 md:grid-cols-2">
          <Dropdown
            label="التصنيف العام"
            placeholder="اختر التصنيف العام"
            options={categories.map((category) => ({
              value: String(category.categoryId),
              label: category.categoryName,
            }))}
            selected={form.mainCategory}
            onSelect={(option) =>
              setForm((previous) => ({
                ...previous,
                mainCategory: option.value,
                subCategory: "",
              }))
            }
          />
          <Dropdown
            label="التصنيف الفرعي"
            placeholder="اختر التصنيف الفرعي"
            options={subCategories.map((subCategory) => ({
              value: String(subCategory.subCategoryId),
              label: subCategory.subCategoryName,
            }))}
            selected={form.subCategory}
            onSelect={(option) =>
              setForm((previous) => ({
                ...previous,
                subCategory: option.value,
              }))
            }
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="تكلفة الوحدة"
            name="costPerUnit"
            type="number"
            value={form.costPerUnit}
            onChange={(event) =>
              setForm((previous) => ({
                ...previous,
                costPerUnit: event.target.value,
              }))
            }
          />
          <Input
            label="نسبة الاختبار %"
            name="percentage"
            type="number"
            value={form.percentage}
            onChange={(event) =>
              setForm((previous) => ({
                ...previous,
                percentage: event.target.value,
              }))
            }
          />
        </div>
        <Textarea
          label="ملاحظات"
          name="note"
          value={form.note}
          onChange={(event) =>
            setForm((previous) => ({ ...previous, note: event.target.value }))
          }
        />
        <div className="flex justify-end gap-3 border-t border-gray-100 pt-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-5 py-2.5 font-semibold text-gray-600"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={saving}
            className="rounded-lg bg-orange-500 px-5 py-2.5 font-semibold text-white transition hover:bg-orange-600 disabled:opacity-60"
          >
            {saving ? "جاري الحفظ..." : editItem ? "حفظ التعديل" : "إضافة واختيار"}
          </button>
        </div>
      </div>
    </QuickCreateModal>
  );
}
