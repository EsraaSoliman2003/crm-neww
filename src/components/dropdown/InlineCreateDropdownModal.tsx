"use client";

import { X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Dropdown from "@/components/dropdown/DropDown";
import Input from "@/components/form/Input";
import { SuppliersNumber } from "@/constants/constantsNumbers";
import { useAppDispatch, useAppSelector } from "@/rtk/hooks";
import { createCategory, fetchCategories } from "@/rtk/slices/categoriesSlice";
import { assignSubCategory } from "@/rtk/slices/subCategoriesSlice";
import { createSupplier, fetchSuppliers } from "@/rtk/slices/suppliersSlice";
import { createUnit, fetchUnits } from "@/rtk/slices/unitsSlice";
import { toast } from "sonner";
import instance from "@/lib/axios";

type CategoryPayload = { id: number; name: string };
type UnitPayload = { id: number; value: string };
type SubCategoryPayload = {
  categoryId: number;
  subCategoryId: number;
  subCategoryName: string;
};
type SupplierPayload = { id: number; name: string };
type SubCategoryGroup = {
  categoryId: number;
  categoryName: string;
  subCategories: {
    subCategoryId: number;
    subCategoryName: string;
    entityCategoryMappingId: number;
  }[];
};

const fetchSubCategoryGroups = async (entityTypeId: number) => {
  const response = await instance.get<SubCategoryGroup[]>(
    `/EntityCategoryMapping/entity/${entityTypeId}/categories`,
  );
  return response.data;
};

export type InlineCreateConfig =
  | {
      kind: "category";
      onCreated: (value: CategoryPayload) => void;
    }
  | {
      kind: "subcategory";
      entityTypeId: number;
      defaultCategoryId?: number;
      onCreated: (value: SubCategoryPayload) => void;
    }
  | {
      kind: "unit";
      onCreated: (value: UnitPayload) => void;
    }
  | {
      kind: "supplier";
      onCreated: (value: SupplierPayload) => void;
    };

type Props = {
  config: InlineCreateConfig | null;
  onClose: () => void;
};

const safeNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalize = (value: unknown) =>
  String(value ?? "").trim().toLocaleLowerCase("ar");

const AR = {
  addCategory: "\u0625\u0636\u0627\u0641\u0629 \u062a\u0635\u0646\u064a\u0641 \u0639\u0627\u0645",
  addSubcategory:
    "\u0625\u0636\u0627\u0641\u0629 \u062a\u0635\u0646\u064a\u0641 \u0641\u0631\u0639\u064a",
  addUnit: "\u0625\u0636\u0627\u0641\u0629 \u0648\u062d\u062f\u0629",
  addSupplier: "\u0625\u0636\u0627\u0641\u0629 \u0645\u0648\u0631\u062f",
  categoryHint:
    "\u0623\u0636\u0641 \u0627\u0644\u062a\u0635\u0646\u064a\u0641 \u0627\u0644\u0639\u0627\u0645 \u0645\u0646 \u0646\u0641\u0633 \u0627\u0644\u0635\u0641\u062d\u0629 \u0648\u0633\u064a\u062a\u0645 \u0627\u062e\u062a\u064a\u0627\u0631\u0647 \u062a\u0644\u0642\u0627\u0626\u064a\u064b\u0627.",
  subcategoryHint:
    "\u0623\u0636\u0641 \u0627\u0644\u062a\u0635\u0646\u064a\u0641 \u0627\u0644\u0641\u0631\u0639\u064a \u0645\u0646 \u0646\u0641\u0633 \u0627\u0644\u0635\u0641\u062d\u0629 \u0648\u0633\u064a\u062a\u0645 \u0627\u062e\u062a\u064a\u0627\u0631\u0647 \u062a\u0644\u0642\u0627\u0626\u064a\u064b\u0627.",
  unitHint:
    "\u0623\u0636\u0641 \u0627\u0644\u0648\u062d\u062f\u0629 \u0645\u0646 \u0646\u0641\u0633 \u0627\u0644\u0635\u0641\u062d\u0629 \u0648\u0633\u064a\u062a\u0645 \u0627\u062e\u062a\u064a\u0627\u0631\u0647\u0627 \u0645\u0628\u0627\u0634\u0631\u0629.",
  supplierHint:
    "\u0623\u0636\u0641 \u0627\u0644\u0645\u0648\u0631\u062f \u0645\u0646 \u0646\u0641\u0633 \u0627\u0644\u0635\u0641\u062d\u0629 \u0648\u0633\u064a\u062a\u0645 \u0627\u062e\u062a\u064a\u0627\u0631\u0647 \u0645\u0628\u0627\u0634\u0631\u0629.",
  categoryName: "\u0627\u0633\u0645 \u0627\u0644\u062a\u0635\u0646\u064a\u0641 \u0627\u0644\u0639\u0627\u0645",
  categoryLabel: "\u0627\u0644\u062a\u0635\u0646\u064a\u0641 \u0627\u0644\u0639\u0627\u0645",
  categoryPlaceholder:
    "\u0627\u062e\u062a\u0631 \u0627\u0644\u062a\u0635\u0646\u064a\u0641 \u0627\u0644\u0639\u0627\u0645",
  subcategoryName:
    "\u0627\u0633\u0645 \u0627\u0644\u062a\u0635\u0646\u064a\u0641 \u0627\u0644\u0641\u0631\u0639\u064a",
  subcategoryLabel:
    "\u0627\u0644\u062a\u0635\u0646\u064a\u0641 \u0627\u0644\u0641\u0631\u0639\u064a",
  subcategoryPlaceholder:
    "\u0627\u062e\u062a\u0631 \u0627\u0644\u062a\u0635\u0646\u064a\u0641 \u0627\u0644\u0641\u0631\u0639\u064a",
  unitName: "\u0627\u0633\u0645 \u0627\u0644\u0648\u062d\u062f\u0629",
  supplierName: "\u0627\u0633\u0645 \u0627\u0644\u0645\u0648\u0631\u062f",
  email: "\u0627\u0644\u0628\u0631\u064a\u062f \u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a",
  password: "\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631",
  countryCode: "\u0643\u0648\u062f \u0627\u0644\u062f\u0648\u0644\u0629",
  phone: "\u0631\u0642\u0645 \u0627\u0644\u0647\u0627\u062a\u0641",
  cancel: "\u0625\u0644\u063a\u0627\u0621",
  saveChoose: "\u062d\u0641\u0638 \u0648\u0627\u062e\u062a\u064a\u0627\u0631",
  saving: "\u062c\u0627\u0631\u064a \u0627\u0644\u062d\u0641\u0638...",
  writeCategory: "\u0627\u0643\u062a\u0628 \u0627\u0633\u0645 \u0627\u0644\u062a\u0635\u0646\u064a\u0641 \u0627\u0644\u0639\u0627\u0645",
  createdCategory:
    "\u062a\u0645\u062a \u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u062a\u0635\u0646\u064a\u0641 \u0627\u0644\u0639\u0627\u0645",
  chooseCategoryAndWriteSubcategory:
    "\u0627\u062e\u062a\u0631 \u0627\u0644\u062a\u0635\u0646\u064a\u0641 \u0627\u0644\u0639\u0627\u0645 \u0648\u0627\u0643\u062a\u0628 \u0627\u0633\u0645 \u0627\u0644\u062a\u0635\u0646\u064a\u0641 \u0627\u0644\u0641\u0631\u0639\u064a",
  failedSelectSubcategory:
    "\u062a\u0645\u062a \u0627\u0644\u0625\u0636\u0627\u0641\u0629 \u0644\u0643\u0646 \u062a\u0639\u0630\u0631 \u062a\u062d\u062f\u064a\u062f \u0627\u0644\u062a\u0635\u0646\u064a\u0641 \u0627\u0644\u0641\u0631\u0639\u064a \u062a\u0644\u0642\u0627\u0626\u064a\u064b\u0627",
  createdSubcategory:
    "\u062a\u0645\u062a \u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u062a\u0635\u0646\u064a\u0641 \u0627\u0644\u0641\u0631\u0639\u064a",
  writeUnit: "\u0627\u0643\u062a\u0628 \u0627\u0633\u0645 \u0627\u0644\u0648\u062d\u062f\u0629",
  createdUnit: "\u062a\u0645\u062a \u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u0648\u062d\u062f\u0629",
  completeSupplier:
    "\u0623\u0643\u0645\u0644 \u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0645\u0648\u0631\u062f \u0623\u0648\u0644\u0627\u064b",
  failedSelectSupplier:
    "\u062a\u0645\u062a \u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u0645\u0648\u0631\u062f \u0644\u0643\u0646 \u062a\u0639\u0630\u0631 \u0627\u062e\u062a\u064a\u0627\u0631\u0647 \u062a\u0644\u0642\u0627\u0626\u064a\u064b\u0627",
  createdSupplier: "\u062a\u0645\u062a \u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u0645\u0648\u0631\u062f",
} as const;

export default function InlineCreateDropdownModal({ config, onClose }: Props) {
  const dispatch = useAppDispatch();
  const cachedCategories = useAppSelector((state) => state.categories.data);
  const cachedCategoriesRef = useRef(cachedCategories);
  cachedCategoriesRef.current = cachedCategories;
  const [mounted, setMounted] = useState(false);
  const [subCategoryGroups, setSubCategoryGroups] = useState<
    SubCategoryGroup[]
  >([]);
  const [categories, setCategories] = useState<CategoryPayload[]>([]);
  const [saving, setSaving] = useState(false);
  const [supplierCreateConfig, setSupplierCreateConfig] =
    useState<InlineCreateConfig | null>(null);

  const [categoryName, setCategoryName] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [subCategoryName, setSubCategoryName] = useState("");
  const [unitValue, setUnitValue] = useState("");
  const [supplierForm, setSupplierForm] = useState({
    name: "",
    email: "",
    password: "",
    countryCode: "+20",
    phoneNumber: "",
    mainCategory: "",
    subCategory: "",
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!config) return;

    setCategoryName("");
    setSelectedCategoryId(
      config.kind === "subcategory" && config.defaultCategoryId
        ? String(config.defaultCategoryId)
        : "",
    );
    setSubCategoryName("");
    setUnitValue("");
    setSupplierForm({
      name: "",
      email: "",
      password: "",
      countryCode: "+20",
      phoneNumber: "",
      mainCategory: "",
      subCategory: "",
    });
    setSubCategoryGroups([]);
    setCategories(cachedCategoriesRef.current);
    setSupplierCreateConfig(null);

    const load = async () => {
      try {
        if (config.kind === "category") {
          const fetched = await dispatch(fetchCategories()).unwrap();
          setCategories(fetched);
          return;
        }

        if (config.kind === "subcategory") {
          const [fetchedCategories, fetchedGroups] = await Promise.all([
            dispatch(fetchCategories()).unwrap(),
            fetchSubCategoryGroups(config.entityTypeId),
          ]);
          setCategories(fetchedCategories);
          setSubCategoryGroups(fetchedGroups);
          return;
        }

        if (config.kind === "unit") {
          await dispatch(fetchUnits()).unwrap();
          return;
        }

        if (config.kind === "supplier") {
          const [fetchedSupplierGroups] = await Promise.all([
            fetchSubCategoryGroups(SuppliersNumber),
            dispatch(fetchSuppliers()).unwrap(),
          ]);
          setSubCategoryGroups(fetchedSupplierGroups);
        }
      } catch {
        // Axios يعرض الخطأ، ونحتفظ بالبيانات المحفوظة بدل إفراغ القوائم.
      }
    };

    void load();
  }, [config, dispatch]);

  useEffect(() => {
    if (!config) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [config, onClose]);

  const categoryOptions = useMemo(
    () =>
      categories.map((category) => ({
        value: String(category.id),
        label: category.name,
      })),
    [categories],
  );

  const supplierMainCategoryOptions = useMemo(
    () =>
      subCategoryGroups.map((category) => ({
        value: String(category.categoryId),
        label: category.categoryName,
      })),
    [subCategoryGroups],
  );

  const selectedSupplierCategory = subCategoryGroups.find(
    (category) => String(category.categoryId) === supplierForm.mainCategory,
  );

  const selectedSupplierSubCategory =
    selectedSupplierCategory?.subCategories.find(
      (subCategory) =>
        String(subCategory.subCategoryId) === supplierForm.subCategory,
    );

  const supplierSubCategoryOptions = (
    selectedSupplierCategory?.subCategories ?? []
  ).map((subCategory) => ({
    value: String(subCategory.subCategoryId),
    label: subCategory.subCategoryName,
  }));

  const refreshSupplierGroups = async () => {
    const refreshed = await fetchSubCategoryGroups(SuppliersNumber);
    setSubCategoryGroups(refreshed);
    return refreshed;
  };

  const submit = async () => {
    if (!config) return;

    try {
      setSaving(true);

      if (config.kind === "category") {
        if (!categoryName.trim()) {
          toast.error(AR.writeCategory);
          return;
        }

        const created = await dispatch(
          createCategory({ name: categoryName.trim() }),
        ).unwrap();
        await dispatch(fetchCategories()).unwrap();

        config.onCreated({
          id: safeNumber(created?.id),
          name: created?.name ?? categoryName.trim(),
        });

        toast.success(AR.createdCategory);
        onClose();
        return;
      }

      if (config.kind === "subcategory") {
        if (!selectedCategoryId || !subCategoryName.trim()) {
          toast.error(AR.chooseCategoryAndWriteSubcategory);
          return;
        }

        await dispatch(
          assignSubCategory({
            entityTypeId: config.entityTypeId,
            categoryId: Number(selectedCategoryId),
            subCategoryName: subCategoryName.trim(),
          }),
        ).unwrap();

        const refreshed = await fetchSubCategoryGroups(config.entityTypeId);

        const parent = refreshed.find(
          (category) =>
            safeNumber(category.categoryId) === Number(selectedCategoryId),
        );

        const createdSubCategory = [...(parent?.subCategories ?? [])]
          .reverse()
          .find(
            (subCategory) =>
              normalize(subCategory.subCategoryName) ===
              normalize(subCategoryName),
          );

        if (!createdSubCategory) {
          toast.error(AR.failedSelectSubcategory);
          return;
        }

        config.onCreated({
          categoryId: Number(selectedCategoryId),
          subCategoryId: createdSubCategory.subCategoryId,
          subCategoryName: createdSubCategory.subCategoryName,
        });

        toast.success(AR.createdSubcategory);
        onClose();
        return;
      }

      if (config.kind === "unit") {
        if (!unitValue.trim()) {
          toast.error(AR.writeUnit);
          return;
        }

        const created = await dispatch(createUnit(unitValue.trim())).unwrap();
        await dispatch(fetchUnits()).unwrap();

        config.onCreated({
          id: safeNumber(created?.id),
          value: created?.value ?? unitValue.trim(),
        });

        toast.success(AR.createdUnit);
        onClose();
        return;
      }

      if (config.kind === "supplier") {
        if (
          !supplierForm.name.trim() ||
          !supplierForm.email.trim() ||
          !supplierForm.password.trim() ||
          !supplierForm.countryCode.trim() ||
          !supplierForm.phoneNumber.trim() ||
          !supplierForm.mainCategory ||
          !supplierForm.subCategory ||
          !selectedSupplierSubCategory
        ) {
          toast.error(AR.completeSupplier);
          return;
        }

        await dispatch(
          createSupplier({
            name: supplierForm.name.trim(),
            email: supplierForm.email.trim(),
            password: supplierForm.password.trim(),
            countryCode: supplierForm.countryCode.trim(),
            phoneNumber: supplierForm.phoneNumber.trim(),
            entityCategoryMappingId:
              selectedSupplierSubCategory.entityCategoryMappingId,
          }),
        ).unwrap();

        const refreshedSuppliers = await dispatch(fetchSuppliers()).unwrap();
        const createdSupplier = refreshedSuppliers.find(
          (supplier) =>
            normalize(supplier.email) === normalize(supplierForm.email),
        );

        if (!createdSupplier) {
          toast.error(AR.failedSelectSupplier);
          return;
        }

        config.onCreated({
          id: createdSupplier.id,
          name: createdSupplier.name,
        });

        toast.success(AR.createdSupplier);
        onClose();
      }
    } catch {
      // Axios يعرض رسالة الخطأ القادمة من الخادم للمستخدم.
    } finally {
      setSaving(false);
    }
  };

  if (!mounted || !config) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100000] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-3xl overflow-hidden rounded-[32px] border border-white/40 bg-white shadow-[0_40px_100px_-30px_rgba(15,23,42,0.4)]">
        <div className="relative overflow-hidden border-b border-rose-100 bg-[linear-gradient(135deg,rgba(255,250,250,0.96)_0%,rgba(255,241,243,0.92)_100%)] px-6 py-5 md:px-7">
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-black text-[#5f0d13]">
                {config.kind === "category" && AR.addCategory}
                {config.kind === "subcategory" && AR.addSubcategory}
                {config.kind === "unit" && AR.addUnit}
                {config.kind === "supplier" && AR.addSupplier}
              </h3>
              <p className="mt-1 text-sm leading-6 text-gray-600">
                {config.kind === "category" && AR.categoryHint}
                {config.kind === "subcategory" && AR.subcategoryHint}
                {config.kind === "unit" && AR.unitHint}
                {config.kind === "supplier" && AR.supplierHint}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-rose-100 bg-white text-gray-500 transition hover:bg-rose-50 hover:text-rose-600"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="max-h-[85vh] overflow-y-auto p-6 md:p-7">
          {config.kind === "category" && (
            <div className="space-y-5">
              <Input
                label={AR.categoryName}
                name="categoryName"
                value={categoryName}
                onChange={(event) => setCategoryName(event.target.value)}
              />
            </div>
          )}

          {config.kind === "subcategory" && (
            <div className="grid gap-4 md:grid-cols-2">
              <Dropdown
                label={AR.categoryLabel}
                options={categoryOptions}
                selected={selectedCategoryId}
                placeholder={AR.categoryPlaceholder}
                onSelect={(option) => setSelectedCategoryId(option.value)}
              />
              <Input
                label={AR.subcategoryName}
                name="subCategoryName"
                value={subCategoryName}
                onChange={(event) => setSubCategoryName(event.target.value)}
              />
            </div>
          )}

          {config.kind === "unit" && (
            <div className="space-y-5">
              <Input
                label={AR.unitName}
                name="unitValue"
                value={unitValue}
                onChange={(event) => setUnitValue(event.target.value)}
              />
            </div>
          )}

          {config.kind === "supplier" && (
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label={AR.supplierName}
                  name="supplierName"
                  value={supplierForm.name}
                  onChange={(event) =>
                    setSupplierForm((previous) => ({
                      ...previous,
                      name: event.target.value,
                    }))
                  }
                />
                <Input
                  label={AR.email}
                  name="supplierEmail"
                  value={supplierForm.email}
                  onChange={(event) =>
                    setSupplierForm((previous) => ({
                      ...previous,
                      email: event.target.value,
                    }))
                  }
                />
                <Input
                  label={AR.password}
                  type="password"
                  name="supplierPassword"
                  value={supplierForm.password}
                  onChange={(event) =>
                    setSupplierForm((previous) => ({
                      ...previous,
                      password: event.target.value,
                    }))
                  }
                />
                <div className="grid grid-cols-[140px_1fr] gap-4">
                  <Input
                    label={AR.countryCode}
                    name="countryCode"
                    value={supplierForm.countryCode}
                    onChange={(event) =>
                      setSupplierForm((previous) => ({
                        ...previous,
                        countryCode: event.target.value,
                      }))
                    }
                  />
                  <Input
                    label={AR.phone}
                    name="phoneNumber"
                    value={supplierForm.phoneNumber}
                    onChange={(event) =>
                      setSupplierForm((previous) => ({
                        ...previous,
                        phoneNumber: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Dropdown
                  label={AR.categoryLabel}
                  options={supplierMainCategoryOptions}
                  selected={supplierForm.mainCategory}
                  placeholder={AR.categoryPlaceholder}
                  onSelect={(option) =>
                    setSupplierForm((previous) => ({
                      ...previous,
                      mainCategory: option.value,
                      subCategory: "",
                    }))
                  }
                  linkType="button"
                  linkText=" + اضافة تصنيف عام"
                  onAdd={() =>
                    setSupplierCreateConfig({
                      kind: "category",
                      onCreated: (category) => {
                        setSubCategoryGroups((previous) =>
                          previous.some(
                            (item) => item.categoryId === category.id,
                          )
                            ? previous
                            : [
                                ...previous,
                                {
                                  categoryId: category.id,
                                  categoryName: category.name,
                                  subCategories: [],
                                },
                              ],
                        );
                        setSupplierForm((previous) => ({
                          ...previous,
                          mainCategory: String(category.id),
                          subCategory: "",
                        }));
                      },
                    })
                  }
                />
                <Dropdown
                  label={AR.subcategoryLabel}
                  options={supplierSubCategoryOptions}
                  selected={supplierForm.subCategory}
                  placeholder={AR.subcategoryPlaceholder}
                  onSelect={(option) =>
                    setSupplierForm((previous) => ({
                      ...previous,
                      subCategory: option.value,
                    }))
                  }
                  linkType="button"
                  linkText=" + اضافة تصنيف فرعي"
                  onAdd={() =>
                    setSupplierCreateConfig({
                      kind: "subcategory",
                      entityTypeId: SuppliersNumber,
                      defaultCategoryId: Number(
                        supplierForm.mainCategory || 0,
                      ),
                      onCreated: (subCategory) => {
                        void refreshSupplierGroups();
                        setSupplierForm((previous) => ({
                          ...previous,
                          mainCategory: String(subCategory.categoryId),
                          subCategory: String(subCategory.subCategoryId),
                        }));
                      },
                    })
                  }
                />
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-gray-200 px-5 py-3 font-bold text-gray-600 transition hover:bg-gray-50"
            >
              {AR.cancel}
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={saving}
              className="rounded-2xl bg-linear-to-r from-[#bf0200] to-[#d13b2f] px-5 py-3 font-bold text-white shadow-lg shadow-red-900/15 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? AR.saving : AR.saveChoose}
            </button>
          </div>
        </div>
      </div>
      {supplierCreateConfig && (
        <InlineCreateDropdownModal
          config={supplierCreateConfig}
          onClose={() => setSupplierCreateConfig(null)}
        />
      )}
    </div>,
    document.body,
  );
}
