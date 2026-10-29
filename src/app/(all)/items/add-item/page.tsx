"use client";

import React, { useEffect, useState } from "react";
import Button from "@/components/button/Button";
import Input from "@/components/form/Input";

import { useAppDispatch, useAppSelector } from "@/rtk/hooks";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { createItem } from "@/rtk/slices/itemSlice";
import { fetchUnits } from "@/rtk/slices/unitsSlice";
import { fetchSubCategories } from "@/rtk/slices/subCategoriesSlice";
import { ItemsNumber } from "@/constants/constantsNumbers";
import Textarea from "@/components/form/Textarea";
import Dropdown from "@/components/dropdown/DropDown";
import InlineCreateDropdownModal, {
  type InlineCreateConfig,
} from "@/components/dropdown/InlineCreateDropdownModal";

type FormState = {
  name: string;
  unit: string;
  cost: string;
  priceAfterCost: string;
  mainCategory: string;
  subCategory: string;
  note: string;
};

export default function ItemForm() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const { creating } = useAppSelector((s) => s.items);
  const { data: categoriesWithSubCategories } = useAppSelector(
    (s) => s.subCategories,
  );
  const { data: units } = useAppSelector((s) => s.units);

  const unitOptions = units.map((unit) => ({
    value: String(unit.id),
    label: unit.value,
  }));

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
    note: "",
  });

  const selectedCategory = categoriesWithSubCategories.find(
    (cat) => String(cat.categoryId) === form.mainCategory,
  );

  const subCategories = selectedCategory?.subCategories ?? [];

  useEffect(() => {
    dispatch(fetchUnits());
    dispatch(fetchSubCategories(ItemsNumber));
  }, [dispatch]);

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

  const validate = () => {
    const newErrors: Partial<FormState> = {};

    if (!form.name.trim()) newErrors.name ="اسم الصنف مطلوب";
    if (!form.unit) newErrors.unit ="الوحدة مطلوبة";
    if (!form.mainCategory) {
      newErrors.mainCategory ="التصنيف الأساسي مطلوب";
    }

    if (!form.subCategory) {
      newErrors.subCategory ="التصنيف الفرعى مطلوب";
    }
    if (!form.cost || Number(form.cost) < 0) newErrors.cost ="التكلفة مطلوبة";

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const addItem = async () => {
    if (!validate()) return;

    try {
      const selectedSub = subCategories.find(
        (sub) => String(sub.subCategoryId) === form.subCategory,
      );

      if (!selectedSub) {
        toast.error("اختر تصنيف صحيح");
        return;
      }

      const entityCategoryMappingId = selectedSub.entityCategoryMappingId;
      await dispatch(
        createItem({
          name: form.name,
          unitId: Number(form.unit),
          cost: Number(form.cost),
          costAfterRate: Number(form.priceAfterCost),
          entityCategoryMappingId: entityCategoryMappingId,
          note: form.note,
        }),
      ).unwrap();

      toast.success("تم إضافة الصنف بنجاح");

      setForm({
        name: "",
        unit: "",
        cost: "",
        priceAfterCost: "",
        mainCategory: "",
        subCategory: "",
        note: "",
      });

      setErrors({});
      router.push("/items");
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <>
    <div className="min-h-screen pt-6">
      <div className="bg-white rounded-2xl shadow p-6 space-y-8">
        {/* Name */}
        <div>
          <Input
            label="اسم البند"
            name="name"
            value={form.name}
            placeholder="ادخل اسم البند"
            onChange={handleChange}
          />
          {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
        </div>

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
              linkText=" + اضافة تصنيف عام"
              onAdd={() =>
                setCreateConfig({
                  kind: "category",
                  onCreated: (category) => {
                    setForm((prev) => ({
                      ...prev,
                      mainCategory: String(category.id),
                      subCategory: "",
                    }));
                    dispatch(fetchSubCategories(ItemsNumber));
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
              label={"التصنيف الفرعي"}
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
              linkText=" + اضافة تصنيف فرعي"
              onAdd={() =>
                setCreateConfig({
                  kind: "subcategory",
                  entityTypeId: ItemsNumber,
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

        {/* Cost + Price */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Input
              label="الفئة"
              type="number"
              name="cost"
              value={form.cost}
              placeholder="ادخل الفئة"
              onChange={handleChange}
            />
            {errors.cost && (
              <p className="text-red-500 text-sm">{errors.cost}</p>
            )}
          </div>

          <div>
            <Dropdown
              label="الوحدة"
              placeholder="اختر الوحدة"
              options={unitOptions}
              selected={form.unit}
              onSelect={(opt) =>
                setForm((prev) => ({
                  ...prev,
                  unit: opt.value,
                }))
              }
              linkType="button"
              linkText=" + اضافة وحدة"
              onAdd={() =>
                setCreateConfig({
                  kind: "unit",
                  onCreated: (unit) =>
                    setForm((prev) => ({
                      ...prev,
                      unit: String(unit.id),
                    })),
                })
              }
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
              placeholder="ادخل فئة البند طبقا للتحليل"
              onChange={handleChange}
            />
            {errors.priceAfterCost && (
              <p className="text-red-500 text-sm">{errors.priceAfterCost}</p>
            )}
          </div> */}
        </div>

        {/* Notes */}
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
        <Button text="إضافة بند" onClick={addItem} loading={creating} />
      </div>
    </div>
      <InlineCreateDropdownModal
        config={createConfig}
        onClose={() => setCreateConfig(null)}
      />
    </>
  );
}
