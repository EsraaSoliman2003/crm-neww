"use client";

/* eslint-disable react-hooks/set-state-in-effect -- The editable draft is hydrated once after the source item requests resolve. */

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import Button from "@/components/button/Button";
import Dropdown from "@/components/dropdown/DropDown";
import Input from "@/components/form/Input";
import Textarea from "@/components/form/Textarea";
import { ItemsNumber } from "@/constants/constantsNumbers";
import { materialsItems } from "@/rtk/fetchSlice/thunks/fetchMaterials";
import { fetchCategories } from "@/rtk/slices/categoriesSlice";
import { useAppDispatch, useAppSelector } from "@/rtk/hooks";
import { fetchManufacturing } from "@/rtk/slices/ManufacturingSlice";
import { fetchAddedValues } from "@/rtk/slices/addedValueSlice";
import {
  createSimilarItem,
  fetchAnalyzeItem,
  fetchItemById,
} from "@/rtk/slices/itemSlice";
import { fetchRows } from "@/rtk/slices/supplierMaterialSlice";
import { fetchSubCategories } from "@/rtk/slices/subCategoriesSlice";
import { fetchTests } from "@/rtk/slices/testsSlice";
import { fetchUnits } from "@/rtk/slices/unitsSlice";
import AppliedPercentAge, {
  type PercentageMode,
} from "../analyze/_components/AppliedPercentAge";
import ChooseManufacturersForm from "../analyze/_components/ChooseManufacturersForm";
import ChooseMaterialsForm from "../analyze/_components/ChooseMaterialsForm";
import ChooseTestsForm from "../analyze/_components/ChooseTestsForm";
import DisplayTotalSection from "../analyze/_components/DisplayTotalSection";
import type { FormType } from "../analyze/page";

type BasicForm = {
  name: string;
  unit: string;
  cost: string;
  costAfterRate: string;
  mainCategory: string;
  subCategory: string;
  note: string;
};

type Errors = {
  basic: Partial<Record<keyof BasicForm, string>>;
};

const emptyBasicForm: BasicForm = {
  name: "",
  unit: "",
  cost: "",
  costAfterRate: "",
  mainCategory: "",
  subCategory: "",
  note: "",
};

function ErrorText({ value }: { value?: string }) {
  return value ? <p className="mt-1 text-sm text-red-500">{value}</p> : null;
}

export default function CreateSimilarItemPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const sourceItemId = Number(params.id);
  const estimateId = Number(searchParams.get("estimateId"));
  const { selectedItem, analyzedItem, creating } = useAppSelector(
    (state) => state.items,
  );
  const units = useAppSelector((state) => state.units.data);
  const categories = useAppSelector((state) => state.subCategories.data);
  const { data: addedValues, loading: addedValuesLoading } = useAppSelector(
    (state) => state.addedValue,
  );
  const [basicForm, setBasicForm] = useState(emptyBasicForm);
  const [analysisForm, setAnalysisForm] = useState<FormType>({
    id: sourceItemId,
    supplierMaterials: [],
    tests: [],
    manufacturings: [],
  });
  const [errors, setErrors] = useState<Errors>({ basic: {} });
  const [basicHydrated, setBasicHydrated] = useState(false);
  const [analysisHydrated, setAnalysisHydrated] = useState(false);
  const [percentageMode, setPercentageMode] =
    useState<PercentageMode>("calculated");
  const [manualPercentage, setManualPercentage] = useState("");
  const [percentageHydrated, setPercentageHydrated] = useState(false);

  useEffect(() => {
    dispatch(fetchItemById(sourceItemId));
    dispatch(fetchCategories());
    // Always load the base item's analysis: the "analyzed" flag is set by hand,
    // so an item can have an analysis without it.
    dispatch(fetchAnalyzeItem(sourceItemId));
    dispatch(fetchUnits());
    dispatch(fetchSubCategories(ItemsNumber));
    dispatch(materialsItems());
    dispatch(fetchRows());
    dispatch(fetchTests());
    dispatch(fetchManufacturing({ page: 1, pageSize: 1000 }));
    dispatch(fetchAddedValues());
  }, [dispatch, sourceItemId]);

  useEffect(() => {
    if (basicHydrated || selectedItem?.id !== sourceItemId) return;
    setBasicForm({
      name: selectedItem.name,
      unit: selectedItem.unit?.id ? String(selectedItem.unit.id) : "",
      cost: String(selectedItem.cost ?? 0),
      costAfterRate: String(selectedItem.costAfterRate ?? 0),
      mainCategory: selectedItem.entityCategoryMapping?.category?.id
        ? String(selectedItem.entityCategoryMapping.category.id)
        : "",
      subCategory: selectedItem.entityCategoryMapping?.subCategory?.id
        ? String(selectedItem.entityCategoryMapping.subCategory.id)
        : "",
      note: selectedItem.note ?? "",
    });
    setBasicHydrated(true);
  }, [basicHydrated, selectedItem, sourceItemId]);

  useEffect(() => {
    if (analysisHydrated || analyzedItem?.id !== sourceItemId) return;
    setAnalysisForm({
      id: sourceItemId,
      supplierMaterials: (analyzedItem.itemSupplierMaterials || [])
        .filter((item) => item?.supplierMaterial)
        .map((item) => ({
          supplierMaterialId: item.supplierMaterial.id,
          quantity: item.quantity,
        })),
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
    setAnalysisHydrated(true);
  }, [analysisHydrated, analyzedItem, sourceItemId]);

  const selectedCategory = categories.find(
    (category) => String(category.categoryId) === basicForm.mainCategory,
  );
  const subCategories = selectedCategory?.subCategories ?? [];
  const calculatedPercentage = Math.min(
    addedValues?.reduce(
      (sum: number, value: { percentage: number }) =>
        sum + (value.percentage || 0),
      0,
    ) || 0,
    100,
  );
  const percent =
    percentageMode === "manual"
      ? Math.min(Math.max(Number(manualPercentage) || 0, 0), 100)
      : calculatedPercentage;

  useEffect(() => {
    if (percentageHydrated || addedValuesLoading) return;
    if (!analyzedItem || analyzedItem.id !== sourceItemId) return;

    const savedMultiplier = analyzedItem?.totalAddedValue;

    if (typeof savedMultiplier === "number") {
      const savedPercentage = Math.min(
        Math.max((savedMultiplier - 1) * 100, 0),
        100,
      );

      if (Math.abs(savedPercentage - calculatedPercentage) > 0.001) {
        setPercentageMode("manual");
        setManualPercentage(String(Number(savedPercentage.toFixed(2))));
      }
    }

    setPercentageHydrated(true);
  }, [
    addedValuesLoading,
    analyzedItem,
    calculatedPercentage,
    percentageHydrated,
    sourceItemId,
  ]);

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

  const setBasicValue = (key: keyof BasicForm, value: string) => {
    setBasicForm((previous) => ({ ...previous, [key]: value }));
  };

  const validate = () => {
    const basic: Errors["basic"] = {};
    if (!basicForm.name.trim()) basic.name = "اسم البند مطلوب";
    if (!basicForm.unit) basic.unit = "الوحدة مطلوبة";
    if (!basicForm.mainCategory)
      basic.mainCategory = "التصنيف العام مطلوب";
    if (!basicForm.subCategory)
      basic.subCategory = "التصنيف الفرعي مطلوب";
    if (basicForm.cost === "" || Number(basicForm.cost) < 0)
      basic.cost = "التكلفة مطلوبة";
    const nextErrors: Errors = { basic };
    setErrors(nextErrors);
    return Object.keys(basic).length === 0;
  };

  const handleSubmit = async () => {
    if (!estimateId) return toast.error("رقم المقايسة غير صحيح");
    if (!validate()) return toast.error("أكمل بيانات البند الأساسية");
    const selectedSubCategory = subCategories.find(
      (subCategory) =>
        String(subCategory.subCategoryId) === basicForm.subCategory,
    );
    if (!selectedSubCategory) return toast.error("اختر تصنيفًا فرعيًا صحيحًا");
    if (percentageMode === "manual" && manualPercentage === "") {
      return toast.error("من فضلك أدخل قيمة النسبة اليدوية");
    }

    try {
      await dispatch(
        createSimilarItem({
          name: basicForm.name.trim(),
          entityCategoryMappingId:
            selectedSubCategory.entityCategoryMappingId,
          unitId: Number(basicForm.unit),
          cost: Number(basicForm.cost),
          costAfterRate: Number(basicForm.costAfterRate || 0),
          note: basicForm.note || null,
          estimateId,
          // Links the similar item to its base item, so a "general" save of
          // the base item's analysis reaches it too.
          sourceItemId,
          totalAddedValue: percent / 100 + 1,
          suppierMaterials: analysisForm.supplierMaterials.length
            ? analysisForm.supplierMaterials
            : undefined,
          tests: analysisForm.tests.length
            ? analysisForm.tests.map((test) => ({
                testId: test.testId,
                unitRatePerTest: test.percentage / 100 + 1,
              }))
            : undefined,
          manufacturings: analysisForm.manufacturings.length
            ? analysisForm.manufacturings
            : undefined,
        }),
      ).unwrap();
      toast.success("تم إنشاء البند الشبيه وإضافته للمقايسة");
      router.push(`/estimates/${estimateId}`);
    } catch {
      // Axios يعرض رسالة الخطأ القادمة من الخادم للمستخدم.
    }
  };

  return (
    <div className="min-h-screen space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">إضافة بند شبيه</h1>
        <p className="mt-1 text-sm text-gray-500">
          عدّل بيانات البند وتحليله، وسيُضاف إلى المقايسة مباشرة بعد الحفظ.
        </p>
      </div>

      <section className="space-y-6 border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="font-bold text-gray-800">البيانات الأساسية</h2>
        <div>
          <Input
            label="اسم البند"
            name="name"
            value={basicForm.name}
            onChange={(event) => setBasicValue("name", event.target.value)}
          />
          <ErrorText value={errors.basic.name} />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <Dropdown
              label="التصنيف العام"
              placeholder="اختر التصنيف العام"
              options={categories.map((category) => ({
                value: String(category.categoryId),
                label: category.categoryName,
              }))}
              selected={basicForm.mainCategory}
              onSelect={(option) => {
                setBasicValue("mainCategory", option.value);
                setBasicValue("subCategory", "");
              }}
            />
            <ErrorText value={errors.basic.mainCategory} />
          </div>
          <div>
            <Dropdown
              label="التصنيف الفرعي"
              placeholder="اختر التصنيف الفرعي"
              options={subCategories.map((subCategory) => ({
                value: String(subCategory.subCategoryId),
                label: subCategory.subCategoryName,
              }))}
              selected={basicForm.subCategory}
              onSelect={(option) => setBasicValue("subCategory", option.value)}
            />
            <ErrorText value={errors.basic.subCategory} />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <Input
              label="التكلفة"
              type="number"
              name="cost"
              value={basicForm.cost}
              onChange={(event) => setBasicValue("cost", event.target.value)}
            />
            <ErrorText value={errors.basic.cost} />
          </div>
          <div>
            <Dropdown
              label="الوحدة"
              placeholder="اختر الوحدة"
              options={units.map((unit) => ({
                value: String(unit.id),
                label: unit.value,
              }))}
              selected={basicForm.unit}
              onSelect={(option) => setBasicValue("unit", option.value)}
            />
            <ErrorText value={errors.basic.unit} />
          </div>
          <Input
            label="التكلفة طبقًا للتحليل"
            type="number"
            name="costAfterRate"
            value={basicForm.costAfterRate}
            onChange={(event) =>
              setBasicValue("costAfterRate", event.target.value)
            }
          />
        </div>
        <Textarea
          label="ملاحظات"
          name="note"
          value={basicForm.note}
          onChange={(event) => setBasicValue("note", event.target.value)}
        />
      </section>

      <ChooseMaterialsForm
        form={analysisForm}
        setFormAction={setAnalysisForm}
      />
      <ChooseTestsForm
        form={analysisForm}
        setFormAction={setAnalysisForm}
      />
      <ChooseManufacturersForm
        form={analysisForm}
        setForm={setAnalysisForm}
      />
      <AppliedPercentAge
        calculatedPercentage={calculatedPercentage}
        mode={percentageMode}
        manualPercentage={manualPercentage}
        loading={addedValuesLoading}
        onModeChange={setPercentageMode}
        onManualPercentageChange={handleManualPercentageChange}
      />
      <DisplayTotalSection form={analysisForm} percentage={percent} />
      <div className="flex justify-end">
        <Button
          text="حفظ وإضافة للمقايسة"
          onClick={handleSubmit}
          loading={creating}
        />
      </div>
    </div>
  );
}
