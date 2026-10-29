"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import Dropdown from "@/components/dropdown/DropDown";
import Input from "@/components/form/Input";
import Textarea from "@/components/form/Textarea";
import { MaterialsNumber } from "@/constants/constantsNumbers";
import instance from "@/lib/axios";
import type { MaterialWithSuppliers as SupplierMaterialRecord } from "@/utils/dtos";
import type { Material, Supplier } from "@/lib/dtos";
import type { SelectedMaterialItem } from "@/lib/dtos";
import { materialsItems } from "@/rtk/fetchSlice/thunks/fetchMaterials";
import { useAppDispatch, useAppSelector } from "@/rtk/hooks";
import { createMaterial, updateMaterial } from "@/rtk/slices/materialsSlice";
import { fetchSubCategories } from "@/rtk/slices/subCategoriesSlice";
import { fetchSuppliers } from "@/rtk/slices/suppliersSlice";
import { fetchUnits } from "@/rtk/slices/unitsSlice";
import QuickCreateModal from "./QuickCreateModal";

type Props = {
  onClose: () => void;
  onCreated: (material: SelectedMaterialItem) => void;
  editItem?: { material: Material; supplier: Supplier; quantity: number };
};

export default function QuickCreateMaterialModal({
  onClose,
  onCreated,
  editItem,
}: Props) {
  const dispatch = useAppDispatch();
  const categories = useAppSelector((state) => state.subCategories.data);
  const units = useAppSelector((state) => state.units.data);
  const suppliers = useAppSelector((state) => state.suppliers.data);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    mainCategory: "",
    subCategory: "",
    unit: "",
    supplierId: "",
    price: "",
    waste: "",
    quantity: "",
    note: "",
  });

  useEffect(() => {
    dispatch(fetchUnits());
    dispatch(fetchSuppliers());
    dispatch(fetchSubCategories(MaterialsNumber));
  }, [dispatch]);

  useEffect(() => {
    if (!editItem || categories.length === 0) return;
    const category = categories.find((group) =>
      group.subCategories.some(
        (subCategory) =>
          subCategory.entityCategoryMappingId ===
          editItem.material.entityCategoryMappingId,
      ),
    );
    const subCategory = category?.subCategories.find(
      (item) =>
        item.entityCategoryMappingId ===
        editItem.material.entityCategoryMappingId,
    );
    setForm({
      name: editItem.material.name,
      mainCategory: String(category?.categoryId ?? ""),
      subCategory: String(subCategory?.subCategoryId ?? ""),
      unit: String(editItem.material.unitId),
      supplierId: String(editItem.supplier.supplierId),
      price: String(editItem.supplier.price),
      waste: String((editItem.material.waste ?? 0) * 100),
      quantity: String(editItem.quantity),
      note: editItem.material.notes ?? "",
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
      !form.unit ||
      !form.supplierId ||
      Number(form.price) <= 0 ||
      Number(form.waste) <= 0 ||
      Number(form.quantity) <= 0
    ) {
      toast.error("أكمل بيانات الخامة والمورد والسعر والكمية");
      return;
    }

    try {
      setSaving(true);
      const payload = {
          name: form.name.trim(),
          unitId: Number(form.unit),
          waste: Number(form.waste) / 100,
          entityCategoryMappingId:
            selectedSubCategory.entityCategoryMappingId,
          supplierId: Number(form.supplierId),
          price: Number(form.price),
          notes: form.note,
          image: null,
      };
      const created = editItem
        ? await dispatch(updateMaterial({ id: editItem.material.id, ...payload })).unwrap()
        : await dispatch(createMaterial(payload)).unwrap();

      const createdResponse = created as unknown as {
        id?: number;
        supplierMaterialId?: number;
      };
      const selectedSupplier = suppliers.find(
        (supplier) => supplier.id === Number(form.supplierId),
      );
      const { data: supplierMaterialRecords } =
        await instance.get<SupplierMaterialRecord[]>("/SupplierMaterial/Show");
      const normalizedName = form.name.trim().toLocaleLowerCase("ar");
      const price = Number(form.price);
      const supplierId = Number(form.supplierId);
      const supplierMaterialRecord = supplierMaterialRecords.find(
        (record) =>
          record.materialId === Number(createdResponse.id) &&
          (record.supplierId === supplierId ||
            record.supplierName === selectedSupplier?.name) &&
          Math.abs(record.price - price) < 0.001,
      ) ?? supplierMaterialRecords.find(
        (record) =>
          record.materialName.trim().toLocaleLowerCase("ar") ===
            normalizedName &&
          (record.supplierId === supplierId ||
            record.supplierName === selectedSupplier?.name) &&
          Math.abs(record.price - price) < 0.001,
      );
      const supplierMaterialId =
        createdResponse.supplierMaterialId ?? supplierMaterialRecord?.id;

      await dispatch(materialsItems()).unwrap();

      if (!supplierMaterialId) {
        toast.error("تم إنشاء الخامة لكن تعذر تحديد سعر المورد تلقائيًا");
        return;
      }

      const selectedUnit = units.find(
        (unit) => unit.id === Number(form.unit),
      );
      onCreated({
        materialId:
          createdResponse.id ?? supplierMaterialRecord?.materialId ?? 0,
        materialName: form.name.trim(),
        categoryName: selectedCategory?.categoryName ?? "",
        subCategoryName: selectedSubCategory?.subCategoryName ?? "",
        unitName: selectedUnit?.value ?? "",
        waste: Number(form.waste) / 100,
        supplierId,
        supplierName: selectedSupplier?.name ?? "",
        price,
        supplierMaterialId,
        quantity: Number(form.quantity),
        note: form.note,
      });
      toast.success(editItem ? "تم تعديل الخامة الأصلية" : "تم إنشاء الخامة واختيارها");
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <QuickCreateModal
      title={editItem ? "تعديل الخامة الأصلية" : "إضافة خامة جديدة"}
      description={editItem ? "سيتم حفظ التعديل على الخامة وسعر المورد في النظام كله." : "أضف الخامة وسعر المورد والكمية لتدخل في تحليل البند مباشرة."}
      onClose={onClose}
    >
      <div className="space-y-5">
        <Input
          label="اسم الخامة"
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
          <Dropdown
            label="الوحدة"
            placeholder="اختر الوحدة"
            options={units.map((unit) => ({
              value: String(unit.id),
              label: unit.value,
            }))}
            selected={form.unit}
            onSelect={(option) =>
              setForm((previous) => ({ ...previous, unit: option.value }))
            }
          />
          <Dropdown
            label="المورد"
            placeholder="اختر المورد"
            options={suppliers.map((supplier) => ({
              value: String(supplier.id),
              label: supplier.name,
            }))}
            selected={form.supplierId}
            onSelect={(option) =>
              setForm((previous) => ({
                ...previous,
                supplierId: option.value,
              }))
            }
          />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Input
            label="سعر المورد"
            name="price"
            type="number"
            value={form.price}
            onChange={(event) =>
              setForm((previous) => ({
                ...previous,
                price: event.target.value,
              }))
            }
          />
          <Input
            label="الهالك %"
            name="waste"
            type="number"
            value={form.waste}
            onChange={(event) =>
              setForm((previous) => ({
                ...previous,
                waste: event.target.value,
              }))
            }
          />
          <Input
            label="الكمية في التحليل"
            name="quantity"
            type="number"
            value={form.quantity}
            onChange={(event) =>
              setForm((previous) => ({
                ...previous,
                quantity: event.target.value,
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
