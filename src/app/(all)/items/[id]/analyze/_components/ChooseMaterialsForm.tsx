"use client";

import Input from "@/components/form/Input";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/rtk/hooks";
import DisplayMaterials from "./DisplayMaterials";
import { FormType } from "../page";
import Dropdown from "@/components/dropdown/DropDown";
import { SelectedMaterialItem, Supplier } from "@/lib/dtos";
import QuickCreateMaterialModal from "./QuickCreateMaterialModal";
import { fetchMaterials } from "@/rtk/slices/materialsSlice";
import { fetchSuppliers } from "@/rtk/slices/suppliersSlice";

type Props = {
  form: FormType;
  setFormAction: React.Dispatch<React.SetStateAction<FormType>>;
  error?: string;
  selectedMasterMaterialId?: string | null;
  selectedMasterSupplierMaterialId?: string | null;
  onChooseFromMaster?: () => void;
};

const normalizeName = (value: string | null | undefined) =>
  (value ?? "").trim().toLocaleLowerCase("ar");

export default function ChooseMaterialsForm({
  form,
  setFormAction,
  error,
  selectedMasterMaterialId,
  selectedMasterSupplierMaterialId,
  onChooseFromMaster,
}: Props) {
  const dispatch = useAppDispatch();
  const { data: items, loading: matrialLoding } = useAppSelector(
    (s) => s.matrialsItems,
  );
  const allMaterials = useAppSelector((state) => state.materials.data);
  const allSuppliers = useAppSelector((state) => state.suppliers.data);
  const generalCategories = useAppSelector((state) => state.categories.data);
  const [selectedMaterialId, setSelectedMaterialId] = useState(
    selectedMasterMaterialId ?? "",
  );
  const [selectedSupplierMaterialId, setSelectedSupplierMaterialId] =
    useState(selectedMasterSupplierMaterialId ?? "");
  const [qty, setQty] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [subCategoryFilter, setSubCategoryFilter] = useState("");
  const [unitFilter, setUnitFilter] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("");
  const previousFilters = useRef({
    categoryFilter,
    subCategoryFilter,
    supplierFilter,
    unitFilter,
  });
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [editingItem, setEditingItem] = useState<{
    material: (typeof items)[number]["material"];
    supplier: Supplier;
    quantity: number;
  } | null>(null);

  useEffect(() => {
    dispatch(fetchMaterials());
    dispatch(fetchSuppliers());
  }, [dispatch]);

  const availableItems = useMemo(() => {
    const groupedByMaterialId = new Map(
      items.map((item) => [item.material.id, item] as const),
    );

    const materialIds = new Set(allMaterials.map((material) => material.id));
    const masterMaterials = allMaterials.map((material) => {
      const existingGroup = groupedByMaterialId.get(material.id);
      return (
        existingGroup ?? {
          material: {
            id: material.id,
            name: material.name,
            waste: material.waste,
            unitId: material.unitId,
            unitName: material.unitName,
            entityCategoryMappingId: material.entityCategoryMappingId,
            categoryName: material.categoryName ?? "",
            subCategoryName: material.subCategoryName ?? "",
            notes: material.notes ?? "",
          },
          suppliers: [],
        }
      );
    });

    return [
      ...masterMaterials,
      ...items.filter((item) => !materialIds.has(item.material.id)),
    ];
  }, [allMaterials, items]);

  const toOptions = (values: string[]) =>
    Array.from(new Set(values.filter(Boolean))).map((value) => ({
      value,
      label: value,
    }));

  const categoryOptions = useMemo(
    () => toOptions(generalCategories.map((category) => category.name)),
    [generalCategories],
  );
  const subCategoryOptions = useMemo(
    () =>
      categoryFilter
        ? toOptions(
          availableItems
            .filter(
              (item) =>
                normalizeName(item.material.categoryName) ===
                normalizeName(categoryFilter),
            )
            .map((item) => item.material.subCategoryName),
        )
        : [],
    [availableItems, categoryFilter],
  );
  const unitOptions = useMemo(
    () => toOptions(allMaterials.map((material) => material.unitName)),
    [allMaterials],
  );
  const supplierFilterOptions = useMemo(
    () => toOptions(allSuppliers.map((supplier) => supplier.name)),
    [allSuppliers],
  );
  const filteredItems = useMemo(
    () =>
      availableItems.filter((item) => {
        const matchesCategory =
          !categoryFilter ||
          normalizeName(item.material.categoryName) ===
          normalizeName(categoryFilter);
        const matchesSubCategory =
          !subCategoryFilter ||
          normalizeName(item.material.subCategoryName) ===
          normalizeName(subCategoryFilter);
        const matchesUnit =
          !unitFilter || item.material.unitName === unitFilter;
        const matchesSupplier =
          !supplierFilter ||
          item.suppliers.some((supplier) => supplier.name === supplierFilter);

        return (
          matchesCategory &&
          matchesSubCategory &&
          matchesUnit &&
          matchesSupplier
        );
      }),
    [
      availableItems,
      categoryFilter,
      subCategoryFilter,
      supplierFilter,
      unitFilter,
    ],
  );

  const clearFilters = () => {
    setCategoryFilter("");
    setSubCategoryFilter("");
    setUnitFilter("");
    setSupplierFilter("");
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSubCategoryFilter("");
  }, [categoryFilter]);

  useEffect(() => {
    const filtersChanged =
      previousFilters.current.categoryFilter !== categoryFilter ||
      previousFilters.current.subCategoryFilter !== subCategoryFilter ||
      previousFilters.current.supplierFilter !== supplierFilter ||
      previousFilters.current.unitFilter !== unitFilter;
    previousFilters.current = {
      categoryFilter,
      subCategoryFilter,
      supplierFilter,
      unitFilter,
    };
    if (!filtersChanged) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedMaterialId("");
    setSelectedSupplierMaterialId("");
  }, [categoryFilter, subCategoryFilter, supplierFilter, unitFilter]);

  const selectedItems = useMemo(
    () =>
      form.supplierMaterials.map((selected): SelectedMaterialItem => {
        const materialGroup = availableItems.find((item) =>
          item.suppliers.some(
            (supplier) =>
              supplier.supplierMaterialId === selected.supplierMaterialId,
          ),
        );
        const masterMaterial = allMaterials.find(
          (material) =>
            material.id ===
            (selected.materialId ?? materialGroup?.material.id),
        );
        const supplier = materialGroup?.suppliers.find(
          (currentSupplier) =>
            currentSupplier.supplierMaterialId ===
            selected.supplierMaterialId,
        );

        return {
          materialId:
            selected.materialId ??
            materialGroup?.material.id ??
            selected.supplierMaterialId,
          materialName:
            selected.materialName ??
            materialGroup?.material.name ??
            "خامة غير متاحة",
          categoryName:
            masterMaterial?.categoryName ??
            selected.categoryName ??
            materialGroup?.material.categoryName,
          subCategoryName:
            masterMaterial?.subCategoryName ??
            selected.subCategoryName ??
            materialGroup?.material.subCategoryName,
          unitName:
            masterMaterial?.unitName ??
            selected.unitName ??
            materialGroup?.material.unitName ??
            "",
          waste:
            masterMaterial?.waste ??
            materialGroup?.material.waste ??
            selected.waste ??
            0,
          supplierId:
            selected.supplierId ?? supplier?.supplierId ?? 0,
          supplierName:
            selected.supplierName ?? supplier?.name ?? "مورد غير متاح",
          price: selected.price ?? supplier?.price ?? 0,
          supplierMaterialId: selected.supplierMaterialId,
          quantity: selected.quantity,
          note:
            masterMaterial?.notes ??
            selected.note ??
            materialGroup?.material.notes,
        };
      }),
    [allMaterials, availableItems, form.supplierMaterials],
  );

  const materialSupplierOptions = filteredItems.flatMap((item) =>
    item.suppliers.map((supplier) => ({
      value: String(supplier.supplierMaterialId),
      materialId: item.material.id,
      supplierMaterialId: supplier.supplierMaterialId,
      label: `${item.material.name} — ${item.material.unitName || "بدون وحدة"} — ${supplier.name} — ${supplier.price} EGP`,
      renderLabel: (
        <div className="grid w-full gap-1 text-sm md:grid-cols-4 md:items-center md:gap-3">
          <span className="font-semibold">{item.material.name}</span>
          <span className="text-gray-600">
            الوحدة: {item.material.unitName || "غير محددة"}
          </span>
          <span>{supplier.name}</span>
          <span className="font-semibold text-red-600">
            {supplier.price} EGP
          </span>
        </div>
      ),
    })),
  );

  const handleSelectMaterialSupplier = (supplierMaterialId: string) => {
    const selectedOption = materialSupplierOptions.find(
      (option) => option.value === supplierMaterialId,
    );
    if (!selectedOption) return;

    setSelectedMaterialId(String(selectedOption.materialId));
    setSelectedSupplierMaterialId(
      String(selectedOption.supplierMaterialId),
    );
  };

  const selectedMaterial = availableItems.find(
    (item) =>
      item.material.id === Number(selectedMaterialId) &&
      item.suppliers.some(
        (supplier) =>
          supplier.supplierMaterialId === Number(selectedSupplierMaterialId),
      ),
  );
  const selectedSupplier = selectedMaterial?.suppliers.find(
    (supplier) =>
      supplier.supplierMaterialId === Number(selectedSupplierMaterialId),
  );
  // --------------new-------------
  const onAdded = () => {
    if (
      !selectedMaterial ||
      !selectedSupplier ||
      !qty ||
      !Number.isFinite(Number(qty)) ||
      Number(qty) <= 0
    ) {
      return;
    }

    setFormAction((prev) => ({
      ...prev,
      supplierMaterials: [
        ...prev.supplierMaterials.filter(
          (item) =>
            item.supplierMaterialId !== selectedSupplier.supplierMaterialId,
        ),
        {
          materialId: selectedMaterial.material.id,
          materialName: selectedMaterial.material.name,
          categoryName: selectedMaterial.material.categoryName,
          subCategoryName: selectedMaterial.material.subCategoryName,
          unitName: selectedMaterial.material.unitName,
          waste: selectedMaterial.material.waste,
          supplierId: selectedSupplier.supplierId,
          supplierName: selectedSupplier.name,
          price: selectedSupplier.price,
          supplierMaterialId: selectedSupplier.supplierMaterialId,
          quantity: Number(qty),
          note: selectedMaterial.material.notes,
        },
      ],
    }));
    setSelectedMaterialId("");
    setSelectedSupplierMaterialId("");
    setQty("");
  };
  // delete
  const handleDeleteItem = (
    _materialId: number,
    _supplierId: number,
    supplierMaterialId: number,
  ) => {
    setFormAction((prev) => ({
      ...prev,
      supplierMaterials: prev.supplierMaterials.filter(
        (item) => item.supplierMaterialId !== supplierMaterialId,
      ),
    }));
  };
  const isValid =
    !selectedMaterial ||
    !selectedSupplier ||
    !qty ||
    !Number.isFinite(Number(qty)) ||
    Number(qty) <= 0;
  return (
    <>
      <div className="space-y-6 border border-gray-200 bg-white p-5 shadow-sm">
        <div className="rounded-lg border border-red-100 bg-red-50/40 p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-gray-900">فلترة الخامات</h3>
              <p className="mt-1 text-xs font-semibold text-gray-500">
                ظاهر {filteredItems.length} من {availableItems.length} خامة
              </p>
            </div>
            <button
              type="button"
              onClick={clearFilters}
              className="border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50"
            >
              مسح الفلاتر
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <Dropdown
              label="التصنيف"
              placeholder="كل التصنيفات"
              options={categoryOptions}
              selected={categoryFilter}
              onSelect={(e) => {
                setCategoryFilter(e.value);
                setSubCategoryFilter("");
              }}
            />
            <Dropdown
              label="التصنيف الفرعي"
              placeholder="كل التصنيفات الفرعية"
              options={subCategoryOptions}
              selected={subCategoryFilter}
              onSelect={(e) => setSubCategoryFilter(e.value)}
              disabled={!categoryFilter}
            />
            <Dropdown
              label="الوحدة"
              placeholder="كل الوحدات"
              options={unitOptions}
              selected={unitFilter}
              onSelect={(e) => setUnitFilter(e.value)}
            />
            <Dropdown
              label="المورد"
              placeholder="كل الموردين"
              options={supplierFilterOptions}
              selected={supplierFilter}
              onSelect={(e) => setSupplierFilter(e.value)}
            />
          </div>
        </div>

        <div>
          <div className="grid gap-4 md:grid-cols-2">
            <Dropdown
              label="الخامة والوحدة والمورد والسعر"
              placeholder="اختر الخامة والوحدة والمورد والسعر"
              options={materialSupplierOptions}
              selected={
                selectedSupplier ? selectedSupplierMaterialId : ""
              }
              onSelect={(option) =>
                handleSelectMaterialSupplier(option.value)
              }
              loading={matrialLoding}
            />
            <div className="flex-1">
              <Input
                name="الكمية"
                label="المعدل"
                placeholder="المعدل"
                type="number"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
              />
            </div>
          </div>
          <div className="mt-3 flex flex-wrap justify-end gap-3">
            {onChooseFromMaster && (
              <button
                type="button"
                onClick={onChooseFromMaster}
                className="rounded-lg border border-blue-200 bg-blue-50 px-5 py-2 font-semibold text-blue-700 transition hover:bg-blue-100"
              >
                اختيار خامة من البيانات الأساسية
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowQuickCreate(true)}
              className="rounded-lg border border-orange-200 bg-orange-50 px-5 py-2 font-semibold text-orange-700 transition hover:bg-orange-100"
            >
              + إضافة خامة جديدة غير موجودة
            </button>
            <button
              type="button"
              onClick={onAdded}
              disabled={isValid}
              className={`w-full md:w-auto px-6 py-2 transition me-0 ms-auto block
            ${!isValid ? "text-red-600 hover:text-red-700" : "text-gray-400 cursor-not-allowed"}
          `}
            >
              + إضافة الخامة
            </button>
          </div>
          {error && (
            <p className="mt-2 text-sm font-semibold text-red-600">{error}</p>
          )}
        </div>
      </div>
      {/* LIST */}
      <DisplayMaterials
        data={selectedItems}
        onDelete={handleDeleteItem}
        onEdit={(selected) => {
          const group = availableItems.find((item) => item.material.id === selected.materialId);
          const supplier = group?.suppliers.find(
            (item) => item.supplierMaterialId === selected.supplierMaterialId,
          );
          if (group && supplier) {
            setEditingItem({ material: group.material, supplier, quantity: selected.quantity });
          }
        }}
      />
      {(showQuickCreate || editingItem) && (
        <QuickCreateMaterialModal
          editItem={editingItem ?? undefined}
          onClose={() => { setShowQuickCreate(false); setEditingItem(null); }}
          onCreated={(material) =>
            setFormAction((previous) => ({
              ...previous,
              supplierMaterials: [
                ...previous.supplierMaterials.filter(
                  (item) =>
                    item.supplierMaterialId !== material.supplierMaterialId,
                ),
                material,
              ],
            }))
          }
        />
      )}
    </>
  );
}
