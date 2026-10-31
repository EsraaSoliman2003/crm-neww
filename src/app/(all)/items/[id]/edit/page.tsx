"use client";

import React, { useEffect, useState } from "react";
import Button from "@/components/button/Button";
import Input from "@/components/form/Input";
import Select from "@/components/form/Select";
import Dropdown from "@/components/dropdown/DropDown";
import InlineCreateDropdownModal, {
  type InlineCreateConfig,
} from "@/components/dropdown/InlineCreateDropdownModal";
import { useAppDispatch, useAppSelector } from "@/rtk/hooks";
import { toast } from "sonner";
import { useRouter, useParams } from "next/navigation";

import {
  fetchItemById,
  updateItemBasicInfo,
} from "@/rtk/slices/itemSlice";
import { fetchUnits } from "@/rtk/slices/unitsSlice";
import { fetchSubCategories } from "@/rtk/slices/subCategoriesSlice";
import { ItemsNumber } from "@/constants/constantsNumbers";
import Loader from "@/components/loader/Loader";
import Textarea from "@/components/form/Textarea";

type FormState = {
  name: string;
  unit: string;
  cost: string;
  priceAfterCost: string;
  mainCategory: string;
  subCategory: string;
  notes: string;
};

export default function EditItemPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params?.id);

  const dispatch = useAppDispatch();

  const { selectedItem, loading, creating } = useAppSelector(
    (s) => s.items
  );
  const { data: categoriesWithSubCategories, loading: catLoading } =
    useAppSelector((s) => s.subCategories);
  const { data: units } = useAppSelector((s) => s.units);

  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [createConfig, setCreateConfig] = useState<InlineCreateConfig | null>(
    null,
  );

  const [form, setForm] = useState<FormState>({
    name: "",
    unit: "",
    cost: "",
    priceAfterCost: "",
    mainCategory: "",
    subCategory: "",
    notes: "",
  });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm((prev) => ({
      ...prev,
      subCategory: "",
    }));
  }, [form.mainCategory]);

  /* ================= Fetch ================= */
  useEffect(() => {
    if (!id) return;

    dispatch(fetchItemById(id));
    dispatch(fetchUnits());
    dispatch(fetchSubCategories(ItemsNumber));
  }, [dispatch, id]);

  /* ================= Prefill ================= */
  useEffect(() => {
    if (!selectedItem || selectedItem.id !== id) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm({
      name: selectedItem.name,
      unit: selectedItem.unit ? String(selectedItem.unit.id) : "",
      cost: String(selectedItem.cost),
      priceAfterCost: String(selectedItem.costAfterRate),
      mainCategory: String(
        selectedItem.entityCategoryMapping?.category.id ?? "",
      ),
      subCategory: String(
        selectedItem.entityCategoryMapping?.subCategory.id ?? "",
      ),
      notes: selectedItem.note || "",
    });
  }, [id, selectedItem]);

  /* ================= Helpers ================= */
  const unitOptions = units.map((unit) => ({
    value: String(unit.id),
    label: unit.value,
  }));

  const selectedCategory = categoriesWithSubCategories.find(
    (cat) => String(cat.categoryId) === form.mainCategory
  );

  const subCategories = selectedCategory?.subCategories ?? [];

  /* ================= Handlers ================= */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validate = () => {
    const newErrors: Partial<FormState> = {};

    if (!form.name.trim()) newErrors.name = "اسم الصنف مطلوب";
    if (!form.unit) newErrors.unit = "الوحدة مطلوبة";
    if (!form.mainCategory) newErrors.mainCategory = "التصنيف الأساسي مطلوب";
    if (!form.subCategory) newErrors.subCategory = "التصنيف الفرعى مطلوب";

    if (!form.cost || Number(form.cost) < 0)
      newErrors.cost = "التكلفة مطلوبة";

    if (!form.priceAfterCost || Number(form.priceAfterCost) < 0)
      newErrors.priceAfterCost = "السعر مطلوب";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* ================= Submit ================= */
  const handleUpdate = async () => {
    if (!validate()) return;

    try {
      const selectedSub = subCategories.find(
        (sub) => String(sub.subCategoryId) === form.subCategory
      );

      if (!selectedSub) {
        toast.error("اختر تصنيف صحيح");
        return;
      }

      await dispatch(
        updateItemBasicInfo({
          id,
          data: {
            id,
            name: form.name,
            unitId: Number(form.unit),
            cost: Number(form.cost),
            costAfterRate: Number(form.priceAfterCost),
            entityCategoryMappingId:
              selectedSub.entityCategoryMappingId,
            note: form.notes,
          },
        })
      ).unwrap();

      toast.success("تم تعديل الصنف بنجاح");
      router.push("/items");
    } catch (err) {
      console.log(err);
    }
  };

  /* ================= UI ================= */
  if (loading) {
    return <Loader />;
  }

  return (
    <div className="min-h-screen pt-6">
      <div className="bg-white rounded-2xl shadow p-6 space-y-8">

        <div>
          <Input
            label="اسم البند"
            name="name"
            value={form.name}
            onChange={handleChange}
          />
          {errors.name && (
            <p className="text-red-500 text-sm">{errors.name}</p>
          )}
        </div>

        {/* Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Dropdown
              label="التصنيف العام"
              placeholder="اختر التصنيف العام"
              options={categoriesWithSubCategories.map((cat) => ({
                value: String(cat.categoryId),
                label: cat.categoryName,
              }))}
              selected={form.mainCategory}
              onSelect={(option) =>
                setForm((previous) => ({
                  ...previous,
                  mainCategory: option.value,
                  subCategory: "",
                }))
              }
              loading={catLoading}
              linkType="button"
              linkText=" + اضافة تصنيف عام"
              onAdd={() =>
                setCreateConfig({
                  kind: "category",
                  onCreated: (category) => {
                    setForm((previous) => ({
                      ...previous,
                      mainCategory: String(category.id),
                      subCategory: "",
                    }));
                    dispatch(fetchSubCategories(ItemsNumber));
                  },
                })
              }
            />
            {errors.mainCategory && (
              <p className="text-red-500 text-sm">
                {errors.mainCategory}
              </p>
            )}
          </div>

          <div>
            <Dropdown
              label="التصنيف الفرعي"
              placeholder="اختر التصنيف الفرعي"
              options={subCategories.map((sub) => ({
                value: String(sub.subCategoryId),
                label: sub.subCategoryName,
              }))}
              selected={form.subCategory}
              onSelect={(option) =>
                setForm((previous) => ({
                  ...previous,
                  subCategory: option.value,
                }))
              }
              loading={catLoading}
              linkType="button"
              linkText=" + اضافة تصنيف فرعي"
              onAdd={() =>
                setCreateConfig({
                  kind: "subcategory",
                  entityTypeId: ItemsNumber,
                  defaultCategoryId: Number(form.mainCategory || 0),
                  onCreated: (subCategory) =>
                    setForm((previous) => ({
                      ...previous,
                      mainCategory: String(subCategory.categoryId),
                      subCategory: String(subCategory.subCategoryId),
                    })),
                })
              }
            />
            {errors.subCategory && (
              <p className="text-red-500 text-sm">
                {errors.subCategory}
              </p>
            )}
          </div>
        </div>

        {/* Cost */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Input
              label="الفئه طبقا للشركه"
              type="number"
              name="cost"
              value={form.cost}
              onChange={handleChange}
            />
            {errors.cost && (
              <p className="text-red-500 text-sm">{errors.cost}</p>
            )}
          </div>

          <div>
            <Select
              label="الوحدة"
              name="unit"
              value={form.unit}
              options={unitOptions}
              onChange={handleChange}
            />
            {errors.unit && (
              <p className="text-red-500 text-sm">{errors.unit}</p>
            )}
          </div>

          {/* <div>
            <Input
              label="فئة البند طبقا للتحليل"
              type="number"
              name="priceAfterCost"
              value={form.priceAfterCost}
              onChange={handleChange}
            />
            {errors.priceAfterCost && (
              <p className="text-red-500 text-sm">
                {errors.priceAfterCost}
              </p>
            )}
          </div> */}
        </div>

        {/* Notes */}
        <div>
          <Textarea
            label="ملاحظات"
            name="notes"
            value={form.notes}
            placeholder="ادخل ملاحظات"
            onChange={handleChange}
          />
        </div>
      </div>

      {/* Submit */}
      <div className="mt-6 flex justify-end">
        <Button
          text="حفظ التعديلات"
          onClick={handleUpdate}
          loading={creating}
        />
      </div>
      <InlineCreateDropdownModal
        config={createConfig}
        onClose={() => setCreateConfig(null)}
      />
    </div>
  );
}
