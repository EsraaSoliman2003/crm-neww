"use client";

import { useEffect, useState } from "react";
import ChooseMaterialsForm from "./_components/ChooseMaterialsForm";
import ChooseTestsForm from "./_components/ChooseTestsForm";
import ChooseManufacturersForm from "./_components/ChooseManufacturersForm";

import { fetchRows } from "@/rtk/slices/supplierMaterialSlice";
import { fetchTests } from "@/rtk/slices/testsSlice";
import { fetchManufacturing } from "@/rtk/slices/ManufacturingSlice";
import { fetchAddedValues } from "@/rtk/slices/addedValueSlice";

import { useAppDispatch, useAppSelector } from "@/rtk/hooks";
import { useParams, useRouter, useSearchParams } from "next/navigation";

import Button from "@/components/button/Button";
import {
  analyzeItem,
  fetchAnalyzeItem,
  fetchItemById,
  updateItemAnalyze,
} from "@/rtk/slices/itemSlice";
import { toast } from "sonner";
import AppliedPercentAge, {
  type PercentageMode,
} from "./_components/AppliedPercentAge";
import DisplayTotalSection from "./_components/DisplayTotalSection";
import { materialsItems } from "@/rtk/fetchSlice/thunks/fetchMaterials";
import { fetchCategories } from "@/rtk/slices/categoriesSlice";
import { SelectedMaterialItem } from "@/lib/dtos";

/* ================= TYPES ================= */

export type FormSupplierMaterial = Partial<SelectedMaterialItem> & {
  supplierMaterialId: number;
  quantity: number;
};

export type FormType = {
  id: number;

  supplierMaterials: FormSupplierMaterial[];

  tests: {
    testId: number;
    percentage: number;
  }[];

  manufacturings: {
    manufacturingId: number;
  }[];
};

type ValidationErrors = {
  supplierMaterials?: string;
  tests?: string;
  manufacturings?: string;
};

const isFormType = (value: unknown): value is FormType => {
  if (!value || typeof value !== "object") return false;

  const form = value as Partial<FormType>;
  return (
    typeof form.id === "number" &&
    Array.isArray(form.supplierMaterials) &&
    form.supplierMaterials.every(
      (item) =>
        typeof item?.supplierMaterialId === "number" &&
        typeof item?.quantity === "number" &&
        (item.price === undefined || typeof item.price === "number") &&
        (item.waste === undefined || typeof item.waste === "number"),
    ) &&
    Array.isArray(form.tests) &&
    form.tests.every(
      (item) =>
        typeof item?.testId === "number" &&
        typeof item?.percentage === "number",
    ) &&
    Array.isArray(form.manufacturings) &&
    form.manufacturings.every(
      (item) => typeof item?.manufacturingId === "number",
    )
  );
};

export default function ItemsPage() {
  // Loading
  const [loading, setLoading] = useState<boolean>(false);
  // Loading
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const id = Number(params?.id);
  const isEditMode = searchParams.get("mode") === "edit";
  // Opened from an estimate: offer saving for this estimate's item only, or
  // for the item in general.
  const estimateId = Number(searchParams.get("estimateId")) || null;
  const selectedMasterManufacturingId = Number(
    searchParams.get("selectManufacturing"),
  );
  const selectedMasterMaterialId = searchParams.get("selectMaterial");
  const selectedMasterSupplierMaterialId = searchParams.get(
    "selectSupplierMaterial",
  );
  const selectedMasterTestId = searchParams.get("selectTest");
  const dispatch = useAppDispatch();
  const { analyzedItem, analyzing, selectedItem } = useAppSelector(
    (s) => s.items,
  );
  const { data: supplierMaterialData, loading: supplierMaterialsLoading } =
    useAppSelector((s) => s.materialsWithSuppliers);
  useEffect(() => {
    dispatch(fetchItemById(id));
    dispatch(fetchCategories());
    dispatch(materialsItems());
    dispatch(fetchRows());
    dispatch(fetchTests());
    dispatch(fetchManufacturing({ page: 1, pageSize: 1000000 }));
    dispatch(fetchAddedValues());
  }, [dispatch, id]);

  useEffect(() => {
    if (isEditMode && id) {
      dispatch(fetchAnalyzeItem(id));
    }
  }, [dispatch, id, isEditMode]);

  const [form, setForm] = useState<FormType>({
    id,
    supplierMaterials: [],
    tests: [],
    manufacturings: [],
  });
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {},
  );
  const [hasHydratedForm, setHasHydratedForm] = useState(false);
  const [draftChecked, setDraftChecked] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
  const draftKey = `item-analysis-draft:${id}:${isEditMode ? "edit" : "create"}`;
  const draftReturnKey = `item-analysis-draft-return:${id}:${isEditMode ? "edit" : "create"}`;
  const selectedSection =
    selectedMasterMaterialId || selectedMasterSupplierMaterialId
      ? "analysis-materials"
      : selectedMasterTestId
        ? "analysis-tests"
        : selectedMasterManufacturingId > 0
          ? "analysis-manufacturers"
          : null;

  useEffect(() => {
    if (!selectedSection) return;

    let frame = 0;
    frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => {
        document.getElementById(selectedSection)?.scrollIntoView({
          block: "start",
          behavior: "auto",
        });
      });
    });

    return () => cancelAnimationFrame(frame);
  }, [selectedSection]);

  // percent

  const { data, loading: addedValuesLoading } = useAppSelector(
    (s) => s.addedValue,
  );

  const totalPercentage = data?.reduce(
    (sum: number, e: { percentage: number }) => sum + (e.percentage || 0),
    0,
  );

  const calculatedPercentage = Math.min(totalPercentage || 0, 100);
  const [percentageMode, setPercentageMode] =
    useState<PercentageMode>("calculated");
  const [manualPercentage, setManualPercentage] = useState("");
  const percent =
    percentageMode === "manual"
      ? Math.min(Math.max(Number(manualPercentage) || 0, 0), 100)
      : calculatedPercentage;

  const handleManualPercentageChange = (value: string) => {
    if (value === "") {
      setManualPercentage("");
      return;
    }

    const parsedValue = Number(value);
    if (!Number.isFinite(parsedValue) || parsedValue < 0 || parsedValue > 100) {
      return;
    }

    setManualPercentage(value);
  };

  useEffect(() => {
    setHasHydratedForm(false);
    setDraftChecked(false);
    setDraftRestored(false);
    setPercentageMode("calculated");
    setManualPercentage("");
  }, [id, isEditMode]);

  useEffect(() => {
    try {
      const returningFromMaster =
        selectedSection !== null &&
        sessionStorage.getItem(draftReturnKey) === draftKey;
      if (!returningFromMaster) return;

      sessionStorage.removeItem(draftReturnKey);
      const savedDraft = sessionStorage.getItem(draftKey);
      if (savedDraft) {
        const parsedDraft: unknown = JSON.parse(savedDraft);
        if (isFormType(parsedDraft) && parsedDraft.id === id) {
          const uniqueMaterials = new Map(
            parsedDraft.supplierMaterials.map((material) => [
              material.supplierMaterialId,
              material,
            ]),
          );
          setForm({
            ...parsedDraft,
            supplierMaterials: Array.from(uniqueMaterials.values()),
          });
          setDraftRestored(true);
          setHasHydratedForm(true);
        } else {
          toast.error("تعذر استعادة مسودة التحليل المحفوظة");
        }
      }
    } catch (error) {
      console.error("Failed to restore item analysis draft", error);
      toast.error("تعذر استعادة مسودة التحليل المحفوظة");
    } finally {
      setDraftChecked(true);
    }
  }, [draftKey, draftReturnKey, id, selectedSection]);

  useEffect(() => {
    if (
      !draftChecked ||
      draftRestored ||
      !isEditMode ||
      !analyzedItem ||
      supplierMaterialsLoading ||
      hasHydratedForm
    )
      return;

    setForm({
      id,
      supplierMaterials: (analyzedItem.itemSupplierMaterials || [])
        .filter((item) => item?.supplierMaterial)
        .map((item) => {
          const selected = item.supplierMaterial;
          const currentRecord = supplierMaterialData.find(
            (record) => record.id === selected.id,
          );

          return {
            supplierMaterialId: selected.id,
            materialId: selected.materialId ?? currentRecord?.materialId,
            materialName: selected.materialName ?? currentRecord?.materialName,
            categoryName: selected.categoryName ?? currentRecord?.categoryName,
            subCategoryName:
              selected.subCategoryName ?? currentRecord?.subCategoryName,
            unitName: selected.unitName ?? currentRecord?.unitName,
            waste: selected.waste ?? currentRecord?.waste,
            supplierId: selected.supplierId ?? currentRecord?.supplierId,
            supplierName:
              selected.supplierName ?? currentRecord?.supplierName,
            price: selected.price ?? currentRecord?.price,
            note: selected.note ?? undefined,
            quantity: item.quantity,
          };
        }),
      tests: (analyzedItem.itemTests || [])
        .filter((item) => item?.test)
        .map((item) => ({
          testId: item.test.id,
          percentage: Math.max(0, ((item.unitRatePerTest ?? 1) - 1) * 100),
        })),
      manufacturings: (analyzedItem.itemManufacturings || [])
        .filter((item) => item?.manufacturing)
        .map((item) => ({
          manufacturingId: item.manufacturing.id,
        })),
    });
    setHasHydratedForm(true);
  }, [
    analyzedItem,
    draftChecked,
    draftRestored,
    hasHydratedForm,
    id,
    isEditMode,
    supplierMaterialData,
    supplierMaterialsLoading,
  ]);

  useEffect(() => {
    if (
      !Number.isInteger(selectedMasterManufacturingId) ||
      selectedMasterManufacturingId <= 0 ||
      !draftChecked ||
      (isEditMode && !hasHydratedForm)
    ) {
      return;
    }

    setForm((previous) =>
      previous.manufacturings.some(
        (item) => item.manufacturingId === selectedMasterManufacturingId,
      )
        ? previous
        : {
            ...previous,
            manufacturings: [
              ...previous.manufacturings,
              { manufacturingId: selectedMasterManufacturingId },
            ],
          },
    );
  }, [
    draftChecked,
    hasHydratedForm,
    isEditMode,
    selectedMasterManufacturingId,
  ]);

  const navigateToMasterData = (type: "material" | "test" | "manufacturing") => {
    try {
      sessionStorage.setItem(draftKey, JSON.stringify(form));
      sessionStorage.setItem(draftReturnKey, draftKey);
    } catch (error) {
      console.error("Failed to save item analysis draft", error);
      toast.error("تعذر حفظ مسودة التحليل؛ لم يتم الانتقال");
      return;
    }

    const page =
      type === "material"
        ? "/material"
        : type === "test"
          ? "/tests"
          : "/manufacturers";
    const query = new URLSearchParams({
      analysisItemId: String(id),
      analysisMode: isEditMode ? "edit" : "create",
    });
    router.push(`${page}?${query.toString()}`);
  };

  useEffect(() => {
    setValidationErrors((prev) => ({
      ...prev,
      supplierMaterials: form.supplierMaterials.length
        ? undefined
        : prev.supplierMaterials,
      tests: form.tests.length ? undefined : prev.tests,
      manufacturings: form.manufacturings.length
        ? undefined
        : prev.manufacturings,
    }));
  }, [
    form.supplierMaterials.length,
    form.tests.length,
    form.manufacturings.length,
  ]);

  // const validateForm = () => {
  //   const errors: ValidationErrors = {};

  //   if (form.supplierMaterials.length === 0) {
  //     errors.supplierMaterials = "يجب اختيار خامة واحدة على الأقل";
  //   }

  //   if (form.tests.length === 0) {
  //     errors.tests = "يجب اختيار اختبار واحد على الأقل";
  //   }

  //   if (form.manufacturings.length === 0) {
  //     errors.manufacturings = "يجب اختيار مصنعية واحدة على الأقل";
  //   }

  //   setValidationErrors(errors);
  //   return Object.keys(errors).length === 0;
  // };

  const handleSubmit = async (saveForCurrentOnly = false) => {
    // if (!validateForm()) {
    //   toast.error("من فضلك أكمل بيانات تحليل البند");
    //   return;
    // }

    if (percentageMode === "manual" && manualPercentage === "") {
      toast.error("من فضلك أدخل قيمة النسبة اليدوية");
      return;
    }

    try {
      setLoading(true)
      const payload = {
        id: form.id,
        suppierMaterials: form.supplierMaterials.map(
          ({ supplierMaterialId, quantity }) => ({
            supplierMaterialId,
            quantity,
          }),
        ),
        tests: form.tests.map((t) => ({
          testId: t.testId,
          unitRatePerTest: t.percentage / 100 + 1,
        })),
        manufacturings: form.manufacturings,
        totalAddedValue: percent / 100 + 1,
        ...(estimateId ? { estimateId, saveForCurrentOnly } : {}),
      };

      await dispatch(
        isEditMode ? updateItemAnalyze(payload) : analyzeItem(payload),
      ).unwrap();
      try {
        sessionStorage.removeItem(draftKey);
      } catch (error) {
        console.error("Failed to clear item analysis draft", error);
        toast.error("تم حفظ التحليل، لكن تعذر حذف المسودة المحلية");
      }

      toast.success(
        estimateId
          ? saveForCurrentOnly
            ? "تم حفظ التحليل لهذا البند في المقايسة فقط"
            : "تم حفظ التحليل بشكل عام للبند والبنود الشبيهة"
          : isEditMode
            ? "تم تعديل تحليل البند بنجاح"
            : "تم تحليل البند بنجاح",
      );

      if (!isEditMode) {
        setForm({
          id,
          supplierMaterials: [],
          tests: [],
          manufacturings: [],
        });
      }

      if (estimateId) {
        router.push(`/estimates/${estimateId}`);
      } else {
        router.push(isEditMode ? `/items/${id}` : "/items");
      }
    } catch (error) {
      console.log(error);
    }finally{
      setLoading(false)
    }
  };
  if (isEditMode && analyzing && !hasHydratedForm) {
    return <div className="min-h-screen" />;
  }

  return (
    <div className="min-h-screen space-y-8">
      <div className="border border-red-100 bg-linear-to-l from-red-50 to-white px-6 py-5 shadow-sm">
        <p className="text-xs font-semibold text-[#bf0200]">
          {isEditMode ? "تعديل تحليل البند" : "تحليل البند"}
        </p>
        <h1 className="mt-1 text-2xl font-bold text-gray-900">
          {selectedItem?.name || analyzedItem?.name || "البند"}
        </h1>
      </div>
      <div id="analysis-materials" className="scroll-mt-28">
        <ChooseMaterialsForm
          key={`${selectedMasterMaterialId ?? ""}:${selectedMasterSupplierMaterialId ?? ""}`}
          form={form}
          setFormAction={setForm}
          error={validationErrors.supplierMaterials}
          selectedMasterMaterialId={selectedMasterMaterialId}
          selectedMasterSupplierMaterialId={selectedMasterSupplierMaterialId}
          onChooseFromMaster={() => navigateToMasterData("material")}
        />
      </div>
      <div id="analysis-tests" className="scroll-mt-28">
        <ChooseTestsForm
          form={form}
          setFormAction={setForm}
          error={validationErrors.tests}
          selectedMasterTestId={selectedMasterTestId}
          onChooseFromMaster={() => navigateToMasterData("test")}
        />
      </div>
      <div id="analysis-manufacturers" className="scroll-mt-28">
        <ChooseManufacturersForm
          form={form}
          setForm={setForm}
          error={validationErrors.manufacturings}
          onChooseFromMaster={() => navigateToMasterData("manufacturing")}
        />
      </div>
      <AppliedPercentAge
        calculatedPercentage={calculatedPercentage}
        mode={percentageMode}
        manualPercentage={manualPercentage}
        loading={addedValuesLoading}
        onModeChange={setPercentageMode}
        onManualPercentageChange={handleManualPercentageChange}
      />
      <DisplayTotalSection form={form} percentage={percent} />

      {estimateId ? (
        <div className="mt-6 flex flex-col items-end gap-3">
          <div className="flex flex-wrap justify-end gap-3">
            <Button
              text="حفظ التحليل للبند الحالي فقط"
              border
              onClick={() => handleSubmit(true)}
              loading={loading}
            />
            <Button
              text="حفظ التحليل بشكل عام للبند"
              onClick={() => handleSubmit(false)}
              loading={loading}
            />
          </div>
          <p className="max-w-xl text-right text-xs leading-6 text-gray-500">
            <span className="font-semibold">للبند الحالي فقط:</span> يُحفظ لهذا
            البند في هذه المقايسة فقط دون التأثير على أي بنود أخرى.{" "}
            <span className="font-semibold">بشكل عام:</span> يُحفظ كتحليل عام
            للبند ويُطبق تلقائيًا على البنود الشبيهة له.
          </p>
        </div>
      ) : (
        <div className="flex justify-end mt-6">
          <Button
            text={isEditMode ? "تعديل تحليل البند" : "تحليل البند"}
            onClick={() => handleSubmit()}
            loading={loading}
          />
        </div>
      )}
    </div>
  );
}
