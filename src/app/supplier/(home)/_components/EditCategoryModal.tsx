"use client";

import Button from "@/components/button/Button";
import Dropdown from "@/components/dropdown/DropDown";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import instance from "@/lib/axios";
import { useAppDispatch, useAppSelector } from "@/rtk/hooks";
import { fetchSubCategories } from "@/rtk/slices/subCategoriesSlice";
import { MaterialsNumber } from "@/constants/constantsNumbers";
import { SupplierMaterialBySupplier } from "@/rtk/slices/supplierMaterialSlice";

type Props = {
  item: SupplierMaterialBySupplier;
  onCloseAction: () => void;
  onSavedAction: () => void;
};

/** Supplier changes the category of a material they added themselves. */
export default function EditCategoryModal({
  item,
  onCloseAction,
  onSavedAction,
}: Props) {
  const dispatch = useAppDispatch();
  const { data: categories } = useAppSelector((s) => s.subCategories);

  const [categoryId, setCategoryId] = useState(String(item.categoryId ?? ""));
  const [subCategoryId, setSubCategoryId] = useState(
    String(item.subCategoryId ?? ""),
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    dispatch(fetchSubCategories(MaterialsNumber));
  }, [dispatch]);

  const subCategories =
    categories.find((c) => String(c.categoryId) === categoryId)
      ?.subCategories ?? [];

  const handleSubmit = async () => {
    const mapping = subCategories.find(
      (s) => String(s.subCategoryId) === subCategoryId,
    );
    if (!categoryId || !mapping) {
      setError("اختر التصنيف العام والتصنيف الفرعي");
      return;
    }

    try {
      setSaving(true);
      await instance.put(`Material/${item.materialId}/category`, {
        entityCategoryMappingId: mapping.entityCategoryMappingId,
      });
      toast.success("تم تعديل التصنيف بنجاح");
      onSavedAction();
      onCloseAction();
    } catch (error) {
      console.log(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      onClick={onCloseAction}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md space-y-4 bg-white p-6 shadow-xl"
      >
        <h2 className="text-right text-lg font-bold">
          تعديل تصنيف: {item.materialName}
        </h2>

        <Dropdown
          label="التصنيف العام"
          placeholder="اختر التصنيف العام"
          options={categories.map((c) => ({
            value: String(c.categoryId),
            label: c.categoryName,
          }))}
          selected={categoryId}
          onSelect={(opt) => {
            setCategoryId(opt.value);
            setSubCategoryId("");
            setError("");
          }}
        />

        <Dropdown
          label="التصنيف الفرعي"
          placeholder="اختر التصنيف الفرعي"
          options={subCategories.map((s) => ({
            value: String(s.subCategoryId),
            label: s.subCategoryName,
          }))}
          selected={subCategoryId}
          onSelect={(opt) => {
            setSubCategoryId(opt.value);
            setError("");
          }}
        />

        {error && <p className="text-right text-sm text-red-500">{error}</p>}

        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={onCloseAction}
            className="bg-gray-100 px-4 py-2 transition-all hover:bg-gray-200"
          >
            إلغاء
          </button>
          <Button
            text={saving ? "جاري الحفظ..." : "حفظ"}
            onClick={handleSubmit}
            disabled={saving}
          />
        </div>
      </div>
    </div>
  );
}
