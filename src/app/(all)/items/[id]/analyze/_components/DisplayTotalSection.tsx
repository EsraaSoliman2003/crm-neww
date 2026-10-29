import { FormType } from "../page";
import { useAppSelector } from "@/rtk/hooks";

type Props = {
  form: FormType;
  percentage?: number;
};

export default function DisplayTotalSection({ form, percentage }: Props) {
  const { data: materialRecords } = useAppSelector(
    (s) => s.materialsWithSuppliers,
  );
  const { data: masterMaterials } = useAppSelector((s) => s.materials);
  const { data: testsData } = useAppSelector((s) => s.tests);
  const { data: manufacturersData } = useAppSelector((s) => s.manufacturing);
  const { data: addedValues } = useAppSelector((s) => s.addedValue);
  const materialRecordsById = new Map(
    materialRecords.map((material) => [material.id, material] as const),
  );
  const masterMaterialsById = new Map(
    masterMaterials.map((material) => [material.id, material] as const),
  );
  const matrialTotal = form.supplierMaterials.reduce((total, material) => {
    const currentRecord = materialRecordsById.get(
      material.supplierMaterialId,
    );
    const materialId = material.materialId ?? currentRecord?.materialId;
    const currentMaterial = masterMaterialsById.get(materialId ?? 0);
    const base =
      (material.price ?? currentRecord?.price ?? 0) * material.quantity;
    return (
      total +
      base *
        (1 +
          (currentMaterial?.waste ??
            currentRecord?.waste ??
            material.waste ??
            0))
    );
  }, 0);
  // test with percentage
  const formTests = testsData
    ?.map((t) => {
      const match = form.tests.find((ft) => ft.testId === t.id);

      if (!match) return null;

      return {
        ...t,
        percentage: match.percentage,
      };
    })
    .filter(Boolean);

  // selected manufacturers with price
  const formManufacturers = manufacturersData
    ?.filter((m) =>
      form.manufacturings.some((sm) => sm.manufacturingId === m.id),
    )
    .map((item) => {
      const total =
        item.dailies?.reduce(
          (sum, d) => sum + d.quantity * d.daily.pricePerDay,
          0,
        ) ?? 0;

      const result =
        item.performanceRate > 0 ? total / item.performanceRate : 0;

      return {
        ...item,
        totalPrice: result,
      };
    });

  const totalTests =
    formTests?.reduce((sum, t) => {
      if (!t) return sum;

      const cost = t.costPerUnit ?? 0;
      const percent = (t.percentage ?? 0) / 100;

      return sum + cost * (1 + percent);
    }, 0) ?? 0;

  const totalManufacturers =
    formManufacturers?.reduce((sum, t) => {
      if (!t) return sum;
      return sum + t.totalPrice;
    }, 0) ?? 0;

  const total = totalManufacturers + totalTests + matrialTotal;

  const storedPercentage = Math.min(
    addedValues.reduce((sum, item) => sum + (item.percentage || 0), 0),
    100,
  );
  const effectivePercentage = percentage ?? storedPercentage;
  const finalTotal = total * (1 + effectivePercentage / 100);
  return (
    <div className="bg-white p-8 pb-6 shadow flex flex-col md:flex-row gap-4 border border-gray-300">
      {/* Materials */}
      <div className="flex-1">
        <p className="text-gray-500">إجمالي قيمة الخامات</p>
        <p className="text-xl font-bold text-black">
          {matrialTotal.toFixed(2)}
        </p>
      </div>

      {/* Tests */}
      <div className="flex-1">
        <p className="text-gray-500">إجمالي قيمة الاختبارات</p>
        <p className="text-xl font-bold text-black">{totalTests.toFixed(2)}</p>
      </div>

      {/* Manufacturers */}
      <div className="flex-1">
        <p className="text-gray-500">إجمالي قيمة المصنعية</p>
        <p className="text-xl font-bold text-black">
          {totalManufacturers.toFixed(2)}
        </p>
      </div>
      {/* items */}
      <div className="flex-1">
        <p className="text-gray-500">إجمالي قيمة البند غير شامل النسبة</p>
        <p className="text-xl font-bold text-black">
          {(totalManufacturers + totalTests + matrialTotal).toFixed(2)}
        </p>
      </div>
      {/* items */}
      <div className="flex-1">
        <p className="text-gray-500">إجمالي قيمة البند شامل النسبة</p>
        <p className="text-xl font-bold text-black">{finalTotal.toFixed(2)}</p>
      </div>
    </div>
  );
}
