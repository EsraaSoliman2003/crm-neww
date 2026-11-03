import type { AnalyzeItemDetails } from "@/rtk/slices/itemSlice";

// "Convert the estimate to materials, tests and manufacturing": adds up the
// analysis of every item, multiplied by the item's quantity in the estimate.
// Uses the same formulas the API uses to price an item (ItemEntity.CalculateTotalPrice):
//   material      = quantity x price x (1 + waste)
//   test          = unitRatePerTest x costPerUnit
//   manufacturing = totalDailyPrice / performanceRate   (per unit of work)
// so the report's grand total equals the items' cost before the added value.

export type ComponentsInput = {
  itemId: number;
  itemName: string;
  estimateQuantity: number;
  analysis: AnalyzeItemDetails | null;
};

export type MaterialRow = {
  key: number;
  name: string;
  unit: string;
  supplier: string;
  netQuantity: number;
  waste: number;
  quantityWithWaste: number;
  price: number;
  total: number;
  itemCount: number;
};

export type TestRow = {
  key: number;
  name: string;
  count: number;
  costPerUnit: number;
  total: number;
  itemCount: number;
};

export type ManufacturingRow = {
  key: number;
  name: string;
  unit: string;
  workQuantity: number;
  performanceRate: number;
  days: number;
  dailyCost: number;
  total: number;
  itemCount: number;
};

export type DailyRow = {
  key: number;
  name: string;
  type: string;
  workerDays: number;
  pricePerDay: number;
  total: number;
};

export type EstimateComponents = {
  materials: MaterialRow[];
  tests: TestRow[];
  manufacturings: ManufacturingRow[];
  dailies: DailyRow[];
  totals: { materials: number; tests: number; manufacturing: number; all: number };
  itemsWithoutAnalysis: string[];
};

const num = (value: unknown) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const dailyType = (category: unknown) => (num(category) === 1 ? "معدة" : "عمالة");

const byName = <T extends { name: string }>(rows: Iterable<T>) =>
  [...rows].sort((a, b) => a.name.localeCompare(b.name, "ar"));

export function buildEstimateComponents(inputs: ComponentsInput[]): EstimateComponents {
  const materials = new Map<number, MaterialRow & { items: Set<number> }>();
  const tests = new Map<number, TestRow & { items: Set<number> }>();
  const manufacturings = new Map<number, ManufacturingRow & { items: Set<number> }>();
  const dailies = new Map<number, DailyRow>();
  const itemsWithoutAnalysis: string[] = [];

  for (const { itemId, itemName, estimateQuantity, analysis } of inputs) {
    const q = num(estimateQuantity) || 1;
    const supplierMaterials = analysis?.itemSupplierMaterials?.filter((x) => x?.supplierMaterial) ?? [];
    const itemTests = analysis?.itemTests?.filter((x) => x?.test) ?? [];
    const itemManufacturings = analysis?.itemManufacturings?.filter((x) => x?.manufacturing) ?? [];

    if (!supplierMaterials.length && !itemTests.length && !itemManufacturings.length) {
      itemsWithoutAnalysis.push(itemName);
      continue;
    }

    for (const link of supplierMaterials) {
      const sm = link.supplierMaterial;
      // waste entered with the material in this item's analysis
      const waste = num(link.waste ?? sm.materialWaste ?? sm.waste);
      const net = num(link.quantity) * q;
      const withWaste = net * (1 + waste);
      const row = materials.get(sm.id) ?? {
        key: sm.id,
        name: sm.materialName,
        unit: sm.materialUnitValue ?? sm.unitName ?? "-",
        supplier: sm.supplierName ?? "-",
        netQuantity: 0,
        waste,
        quantityWithWaste: 0,
        price: num(sm.price),
        total: 0,
        itemCount: 0,
        items: new Set<number>(),
      };
      row.netQuantity += net;
      row.quantityWithWaste += withWaste;
      row.total += withWaste * num(sm.price);
      row.items.add(itemId);
      materials.set(sm.id, row);
    }

    for (const link of itemTests) {
      const count = num(link.unitRatePerTest) * q;
      const row = tests.get(link.test.id) ?? {
        key: link.test.id,
        name: link.test.name,
        count: 0,
        costPerUnit: num(link.test.costPerUnit),
        total: 0,
        itemCount: 0,
        items: new Set<number>(),
      };
      row.count += count;
      row.total += count * num(link.test.costPerUnit);
      row.items.add(itemId);
      tests.set(link.test.id, row);
    }

    for (const link of itemManufacturings) {
      const m = link.manufacturing;
      const rate = num(m.performanceRate);
      // Same as the API: a manufacturing without a performance rate isn't priced.
      if (rate <= 0) continue;
      const days = q / rate;
      const row = manufacturings.get(m.id) ?? {
        key: m.id,
        name: m.name,
        unit: m.unit?.value ?? "-",
        workQuantity: 0,
        performanceRate: rate,
        days: 0,
        dailyCost: num(m.totalDailyPrice),
        total: 0,
        itemCount: 0,
        items: new Set<number>(),
      };
      row.workQuantity += q;
      row.days += days;
      row.total += days * num(m.totalDailyPrice);
      row.items.add(itemId);
      manufacturings.set(m.id, row);

      for (const d of m.dailies ?? []) {
        if (!d?.daily) continue;
        const workerDays = num(d.quantity) * days;
        const daily = dailies.get(d.daily.id) ?? {
          key: d.daily.id,
          name: d.daily.name,
          type: dailyType(d.daily.category),
          workerDays: 0,
          pricePerDay: num(d.daily.pricePerDay),
          total: 0,
        };
        daily.workerDays += workerDays;
        daily.total += workerDays * num(d.daily.pricePerDay);
        dailies.set(d.daily.id, daily);
      }
    }
  }

  const finish = <T extends { items: Set<number>; itemCount: number }>(row: T) => {
    const { items, ...rest } = row;
    return { ...rest, itemCount: items.size };
  };

  const materialRows = byName([...materials.values()].map(finish));
  const testRows = byName([...tests.values()].map(finish));
  const manufacturingRows = byName([...manufacturings.values()].map(finish));
  // Labour first, then equipment.
  const dailyRows = [...dailies.values()].sort(
    (a, b) => a.type.localeCompare(b.type, "ar") || a.name.localeCompare(b.name, "ar"),
  );

  const sum = (rows: { total: number }[]) => rows.reduce((s, r) => s + r.total, 0);
  const totals = {
    materials: sum(materialRows),
    tests: sum(testRows),
    manufacturing: sum(manufacturingRows),
    all: 0,
  };
  totals.all = totals.materials + totals.tests + totals.manufacturing;

  return {
    materials: materialRows,
    tests: testRows,
    manufacturings: manufacturingRows,
    dailies: dailyRows,
    totals,
    itemsWithoutAnalysis,
  };
}

const escapeHtml = (value: unknown) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const fmt = (value: number, digits = 2) =>
  Number.isFinite(value) ? value.toLocaleString("en-US", { maximumFractionDigits: digits }) : "-";

const table = (headers: string[], rows: (string | number)[][], footer?: (string | number)[]) => `
  <table>
    <thead><tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}</tr></thead>
    <tbody>
      ${
        rows.length
          ? rows.map((r) => `<tr>${r.map((c) => `<td>${escapeHtml(c)}</td>`).join("")}</tr>`).join("")
          : `<tr><td colspan="${headers.length}">لا توجد بيانات</td></tr>`
      }
      ${footer ? `<tr class="total-row">${footer.map((c) => `<td>${escapeHtml(c)}</td>`).join("")}</tr>` : ""}
    </tbody>
  </table>`;

export function buildComponentsReportHtml(
  estimate: { name?: string | null; estimateNumber?: string | null; companyName?: string | null; projectName?: string | null },
  components: EstimateComponents,
  itemCount: number,
) {
  const { materials, tests, manufacturings, dailies, totals, itemsWithoutAnalysis } = components;

  return `
    <h2>${escapeHtml(`تحويل المقايسة إلى خامات واختبارات ومصنعيات - ${estimate.name ?? ""}`)}</h2>
    ${table(
      ["البيان", "القيمة"],
      [
        ["رقم المقايسة", estimate.estimateNumber ?? "-"],
        ["الشركة", estimate.companyName ?? "-"],
        ["المشروع", estimate.projectName ?? "-"],
        ["عدد البنود", itemCount],
        ["إجمالي الخامات", fmt(totals.materials)],
        ["إجمالي الاختبارات", fmt(totals.tests)],
        ["إجمالي المصنعيات", fmt(totals.manufacturing)],
        ["الإجمالي (قبل النسبة المضافة)", fmt(totals.all)],
      ],
    )}

    <h3>الخامات</h3>
    ${table(
      ["#", "الخامة", "الوحدة", "المورد", "الكمية الصافية", "الهالك", "الكمية شاملة الهالك", "سعر الوحدة", "الإجمالي", "عدد البنود"],
      materials.map((r, i) => [
        i + 1, r.name, r.unit, r.supplier, fmt(r.netQuantity, 4), `${fmt(r.waste * 100)}%`,
        fmt(r.quantityWithWaste, 4), fmt(r.price), fmt(r.total), r.itemCount,
      ]),
      materials.length ? ["", "الإجمالي", "", "", "", "", "", "", fmt(totals.materials), ""] : undefined,
    )}

    <h3>الاختبارات</h3>
    ${table(
      ["#", "الاختبار", "عدد الاختبارات", "تكلفة الاختبار", "الإجمالي", "عدد البنود"],
      tests.map((r, i) => [i + 1, r.name, fmt(r.count), fmt(r.costPerUnit), fmt(r.total), r.itemCount]),
      tests.length ? ["", "الإجمالي", "", "", fmt(totals.tests), ""] : undefined,
    )}

    <h3>المصنعيات</h3>
    ${table(
      ["#", "المصنعية", "الوحدة", "كمية الأعمال", "معدل الأداء / يوم", "عدد الأيام", "تكلفة اليوم", "الإجمالي", "عدد البنود"],
      manufacturings.map((r, i) => [
        i + 1, r.name, r.unit, fmt(r.workQuantity), fmt(r.performanceRate), fmt(r.days),
        fmt(r.dailyCost), fmt(r.total), r.itemCount,
      ]),
      manufacturings.length ? ["", "الإجمالي", "", "", "", "", "", fmt(totals.manufacturing), ""] : undefined,
    )}

    <h3>العمالة والمعدات المطلوبة</h3>
    ${table(
      ["#", "اليومية", "النوع", "عدد اليوميات", "سعر اليوم", "الإجمالي"],
      dailies.map((r, i) => [i + 1, r.name, r.type, fmt(r.workerDays), fmt(r.pricePerDay), fmt(r.total)]),
    )}

    ${
      itemsWithoutAnalysis.length
        ? `<h3>بنود غير محللة (غير محسوبة في التقرير)</h3>
           ${table(["#", "اسم البند"], itemsWithoutAnalysis.map((name, i) => [i + 1, name]))}`
        : ""
    }
  `;
}
