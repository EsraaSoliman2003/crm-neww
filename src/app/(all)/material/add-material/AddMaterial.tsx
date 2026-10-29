//

"use client";

import React, { useEffect, useRef, useState } from "react";
import Input from "@/components/form/Input";
import { useAppDispatch, useAppSelector } from "@/rtk/hooks";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  createMaterial,
  createMaterialBySupplier,
  fetchMaterials,
  updateMaterial,
} from "@/rtk/slices/materialsSlice";
import { fetchUnits } from "@/rtk/slices/unitsSlice";
import { fetchSubCategories } from "@/rtk/slices/subCategoriesSlice";
import { MaterialsNumber } from "@/constants/constantsNumbers";
import { fetchSuppliers } from "@/rtk/slices/suppliersSlice";
import Textarea from "@/components/form/Textarea";
import Button from "@/components/btn/Button";
import Dropdown from "@/components/dropdown/DropDown";
import { useSearchParams } from "next/navigation";
import { Camera } from "lucide-react";
import Image from "next/image";
import { default_image } from "@/assets";
import InlineCreateDropdownModal, {
  type InlineCreateConfig,
} from "@/components/dropdown/InlineCreateDropdownModal";

type FormState = {
  name: string;
  mainCategory: string;
  subCategory: string;
  unit: string;
  waste: string;
  supplierId: string;
  price: string;
  validUntil: string;
  note: string;
  image: string;
};

export default function AddMatreial({
  supplierMode = false,
}: {
  supplierMode?: boolean;
}) {
  // Params
  const searchParams = useSearchParams();
  const mode = supplierMode
    ? "create"
    : (searchParams.get("mode") as "create" | "edit") || "create";
  const materialId = Number(searchParams.get("id"));
  // Params

  const router = useRouter();
  const dispatch = useAppDispatch();

  const [loadingBtn, setLoading] = useState<boolean>(false);

  /* ===========================
     Redux Data
  =========================== */

  const { data: materials } = useAppSelector((s) => s.materials);

  const { data: categoriesWithSubCategories } = useAppSelector(
    (s) => s.subCategories,
  );

  const { data: unitsData } = useAppSelector((s) => s.units);

  const { data: suppliersData } = useAppSelector((s) => s.suppliers);
  /* ===========================
     Options
  =========================== */

  const unitOptions = unitsData.map((unit) => ({
    value: String(unit.id),
    label: unit.value,
  }));

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
    unit: "",
    waste: "",
    supplierId: "",
    price: "",
    validUntil: "",
    note: "",
    image: "",
  });

  /* ===========================
     Fetch Data
  =========================== */

  useEffect(() => {
    dispatch(fetchUnits());
    dispatch(fetchSubCategories(MaterialsNumber));
    if (!supplierMode) dispatch(fetchSuppliers());

    if (mode === "edit") {
      dispatch(fetchMaterials());
    }
  }, [dispatch, mode, supplierMode]);

  /* ===========================
     Fill Form In Edit Mode
  =========================== */
  const filledFormKeyRef = useRef("");
  useEffect(() => {
    const editFormKey = `${mode}-${materialId}`;

    if (mode !== "edit") return;
    if (!materialId) return;
    if (!categoriesWithSubCategories.length) return;
    if (filledFormKeyRef.current === editFormKey) return;

    const material = materials.find((m) => m.id === materialId);
    if (!material) return;
    const adminSupplier = material.suppliers?.find((s) => s.isAdmin);
    queueMicrotask(() => {
      setForm({
        name: material.name || "",
        mainCategory: String(material.categoryId || ""),
        subCategory: String(material.subCategoryId || ""),
        unit: String(material.unitId || ""),
        waste: String(material.waste * 100 || ""),
        supplierId: String(adminSupplier?.id || ""),
        price: String(adminSupplier?.price || ""),
        validUntil: "",
        note: material.notes || "",
        image: material.image || "",
      });

      filledFormKeyRef.current = editFormKey;
    });
  }, [mode, materialId, materials, categoriesWithSubCategories]);
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

  const [imageFile, setImageFile] = useState<File | null>(null);
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const target = e.target;

    // image input
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

    const { name, value } = target;

    if (name === "waste") {
      const numericValue = value.replace(/[^0-9]/g, "");

      if (numericValue && Number(numericValue) > 99) {
        return;
      }

      setForm((prev) => ({
        ...prev,
        waste: numericValue,
      }));

      setErrors((prev) => ({
        ...prev,
        waste: undefined,
      }));
      return;
    }

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
      newErrors.name = "اسم الخامه مطلوب";
    }

    if (!form.mainCategory) {
      newErrors.mainCategory = "التصنيف الأساسي مطلوب";
    }

    if (!form.subCategory) {
      newErrors.subCategory = "التصنيف الفرعى مطلوب";
    }

    if (!form.unit) {
      newErrors.unit = "الوحدة مطلوبة";
    }

    if (
      form.waste === null ||
      form.waste === undefined ||
      Number(form.waste) <= 0
    ) {
      newErrors.waste = "الهالك مطلوب ويجب أن يكون أكبر من 0";
    }

    if (!supplierMode && mode !== "edit" && !form.supplierId) {
      newErrors.supplierId = "اختر المورد";
    }

    if (mode !== "edit" && (!form.price || Number(form.price) <= 0)) {
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

    setLoading(true);

    try {
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
        unitId: Number(form.unit),
        waste: Number(form.waste) / 100,
        entityCategoryMappingId,
        price: Number(form.price),
        notes: form.note,
        image: imageFile,
      };

      if (mode === "create") {
        if (supplierMode) {
          await dispatch(
            createMaterialBySupplier({
              ...payload,
              validUntil: form.validUntil
                ? new Date(form.validUntil).toISOString()
                : "",
            }),
          ).unwrap();
        } else {
          await dispatch(
            createMaterial({
              ...payload,
              supplierId: Number(form.supplierId),
            }),
          ).unwrap();
        }

        toast.success("تم إضافة الخامه بنجاح");
      } else {
        await dispatch(
          updateMaterial({
            id: materialId!,
            ...payload,
            supplierId: Number(form.supplierId),
          }),
        ).unwrap();

        toast.success("تم تعديل الخامه بنجاح");
      }

      setForm({
        name: "",
        mainCategory: "",
        subCategory: "",
        unit: "",
        waste: "",
        supplierId: "",
        price: "",
        validUntil: "",
        note: "",
        image: "",
      });

      setErrors({});

      router.push(supplierMode ? "/supplier/material" : "/material");
    } catch (error) {
      console.log(error);
      toast.error("حدث خطأ");
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
      <div className="mt-6 bg-white shadow p-6 space-y-8">
        {/* image */}
        <div className="relative mx-auto h-25 w-25 rounded-full border border-gray-300">
          <Image
            src={form.image || default_image}
            alt="material"
            fill
            sizes="100px"
            className="object-cover rounded-full"
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
        {/* Name */}
        <div className="flex-1">
          <Input
            label="اسم الخامه"
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
                    void dispatch(fetchSubCategories(MaterialsNumber));
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
              linkText={" + \u0627\u0636\u0627\u0641\u0629 \u062a\u0635\u0646\u064a\u0641 \u0641\u0631\u0639\u064a"}
              onAdd={() =>
                setCreateConfig({
                  kind: "subcategory",
                  entityTypeId: MaterialsNumber,
                  defaultCategoryId: Number(form.mainCategory || 0),
                  onCreated: async (subCategory) => {
                    await dispatch(fetchSubCategories(MaterialsNumber)).unwrap();
                    setForm((prev) => ({
                      ...prev,
                      mainCategory: String(subCategory.categoryId),
                      subCategory: String(subCategory.subCategoryId),
                    }));
                  },
                })
              }
            />

            {errors.subCategory && (
              <p className="text-red-500 text-sm">{errors.subCategory}</p>
            )}
          </div>
        </div>

        {/* Supplier + Price + Unit + Waste */}

        {!supplierMode && <div className="flex-1">
          <Dropdown
            label="اختر المورد"
            placeholder="اختر المورد"
            options={suppliersData.map((s) => ({
              value: String(s.id),
              label: s.name,
            }))}
            selected={form.supplierId}
            onSelect={(opt) =>
              setForm((prev) => ({
                ...prev,
                supplierId: opt.value,
              }))
            }
            linkType="button"
            linkText={" + \u0627\u0636\u0627\u0641\u0629 \u0645\u0648\u0631\u062f"}
            onAdd={() =>
              setCreateConfig({
                kind: "supplier",
                onCreated: (supplier) =>
                  setForm((prev) => ({
                    ...prev,
                    supplierId: String(supplier.id),
                  })),
              })
            }
          />

          {errors.supplierId && (
            <p className="text-red-500 text-sm">{errors.supplierId}</p>
          )}
        </div>}
        <div
          className={`grid gap-4 ${
            supplierMode
              ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4"
              : "grid-cols-1 md:grid-cols-3"
          }`}
        >
          <div className="flex-1">
            <Input
              label="السعر"
              type="number"
              name="price"
              value={form.price}
              placeholder="حدد السعر"
              onChange={handleChange}
            />

            {errors.price && (
              <p className="text-red-500 text-sm">{errors.price}</p>
            )}
          </div>

          {supplierMode && (
            <div className="flex-1">
              <Input
                label="السعر صالح حتى"
                type="datetime-local"
                name="validUntil"
                value={form.validUntil}
                onChange={handleChange}
              />
            </div>
          )}

          <div className="flex-1">
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
              linkText={" + \u0627\u0636\u0627\u0641\u0629 \u0648\u062d\u062f\u0629"}
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

          <div className="flex-1">
            <Input
              label="الهالك (%)"
              type="number"
              name="waste"
              value={form.waste}
              placeholder="ادخل كمية الهالك"
              onChange={handleChange}
            />

            {errors.waste && (
              <p className="text-red-500 text-sm">{errors.waste}</p>
            )}
          </div>
        </div>

        {/* Notes */}
        <div>
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
          text={mode === "create" ? "اضافة" : "تعديل"}
          onClick={handleSubmit}
          loading={loadingBtn}
        />
      </div>
      <InlineCreateDropdownModal
        config={createConfig}
        onClose={() => setCreateConfig(null)}
      />
    </>
  );
}
