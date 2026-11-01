"use client";

import { useParams } from "next/navigation";
import { type ReactNode, useEffect, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/rtk/hooks";
import Loader from "@/components/loader/Loader";
import EmptyState from "@/components/emptyState/EmptyState";
import { card2BG, default_image } from "@/assets";
import {
  fetchAnalyzeItem,
  fetchItemById,
  type AnalyzeItemDetails,
} from "@/rtk/slices/itemSlice";
import Table from "@/components/table/Table";
import Button from "@/components/button/Button";
import { Download, FileText } from "lucide-react";
import { getDailyCategoryName } from "@/utils/getDailyName";
import * as XLSX from "xlsx";
import { fetchRows } from "@/rtk/slices/supplierMaterialSlice";
import { fetchMaterials } from "@/rtk/slices/materialsSlice";
import {
  fetchManufacturing,
  type Manufacturing,
} from "@/rtk/slices/ManufacturingSlice";
import Image from "next/image";

const NO_DATA = "لا توجد بيانات";

function displayValue(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return NO_DATA;
  if (typeof value === "number") return value.toLocaleString();
  return value;
}

function Box({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="border border-gray-200 bg-white p-4 shadow-sm transition hover:border-red-100 hover:shadow-md">
      <p className="text-xs font-semibold text-gray-500">{label}</p>
      <p className="mt-2 text-xl font-bold text-gray-900">
        {displayValue(value)}
      </p>
    </div>
  );
}

function SectionCard({
  title,
  count,
  children,
}: {
  title: string;
  count?: number;
  children: ReactNode;
}) {
  return (
    <section className="border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 bg-gray-50 px-5 py-4">
        <h3 className="font-bold text-gray-800">{title}</h3>
        {typeof count === "number" && (
          <span className="bg-white px-3 py-1 text-xs font-semibold text-gray-500">
            {count} عنصر
          </span>
        )}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function NoDataBox() {
  return (
    <div className="border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm font-semibold text-gray-400">
      {NO_DATA}
    </div>
  );
}

const formatValue = (value: number | string | null | undefined) =>
  value === null || value === undefined || value === "" ? NO_DATA : value;

const escapeHtml = (value: unknown) =>
  String(formatValue(value as number | string | null | undefined))
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const buildRows = (rows: (string | number | null | undefined)[][]) =>
  rows
    .map(
      (row) => `
        <tr>
          ${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}
        </tr>
      `,
    )
    .join("");

const buildSection = (
  title: string,
  headers: string[],
  rows: (string | number | null | undefined)[][],
) => `
  <h3>${escapeHtml(title)}</h3>
  <table>
    <thead>
      <tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr>
    </thead>
    <tbody>
      ${rows.length
    ? buildRows(rows)
    : `<tr><td colspan="${headers.length}">لا توجد بيانات</td></tr>`
  }
    </tbody>
  </table>
`;

const buildAnalyzedItemReportHtml = (
  item: AnalyzeItemDetails,
  supplierNames: Map<number, string>,
  manufacturingsById: Map<number, Manufacturing>,
) => {
  const summaryRows = [
    ["اسم البند", item.name],
    ["إجمالي الخامات", item.totalMaterialPrice],
    ["إجمالي الاختبارات", item.totalTestPrice],
    ["إجمالي المصنعيات", item.totalManufacturingPrice],
    ["الإجمالي الكلي غير شامل النسبة", item.cost],
    ["الإجمالي الكلي شامل النسبة", item.costAfterRate],
    ["ملاحظات", item.note],
  ];

  const manufacturingRows = (item.itemManufacturings || [])
    .filter((entry) => entry?.manufacturing)
    .map((entry, index) => {
      const manufacturing = entry.manufacturing;
      const masterManufacturing = manufacturingsById.get(manufacturing.id);
      const dailies = manufacturing.dailies || [];
      const totalDailyPrice = dailies.reduce(
        (total, dailyEntry) =>
          total +
          (dailyEntry.quantity ?? 0) * (dailyEntry.daily?.pricePerDay ?? 0),
        0,
      );
      const unitName =
        masterManufacturing?.unitName ||
        (typeof masterManufacturing?.unit === "string"
          ? masterManufacturing.unit
          : masterManufacturing?.unit?.value);

      return [
        index + 1,
        manufacturing.name,
        masterManufacturing?.publicCategory?.name ?? NO_DATA,
        unitName ?? NO_DATA,
        dailies.length
          ? dailies
            .map((dailyEntry, dailyIndex) => {
              const dailyTotal =
                (dailyEntry.quantity ?? 0) *
                (dailyEntry.daily?.pricePerDay ?? 0);
              return `${dailyIndex + 1}. ${dailyEntry.daily?.name ?? NO_DATA} - ${getDailyCategoryName(dailyEntry.daily?.category)} - السعر: ${dailyEntry.daily?.pricePerDay ?? 0} - الكمية: ${dailyEntry.quantity ?? 0} - الإجمالي: ${dailyTotal}`;
            })
            .join(" | ")
          : "لا توجد يوميات",
        totalDailyPrice,
        manufacturing.performanceRate,
        manufacturing.performanceRate > 0
          ? totalDailyPrice / manufacturing.performanceRate
          : 0,
        manufacturing.notes,
      ];
    });

  const materialsRows = (item.itemSupplierMaterials || [])
    .filter((entry) => entry?.supplierMaterial)
    .map((entry, index) => [
      index + 1,
      entry.supplierMaterial.materialName,
      supplierNames.get(entry.supplierMaterial.id) ?? NO_DATA,
      entry.supplierMaterial.price,
      entry.quantity,
      (entry.quantity ?? 0) * (entry.supplierMaterial.price ?? 0),
      entry.supplierMaterial.note,
    ]);

  const testsRows = (item.itemTests || [])
    .filter((entry) => entry?.test)
    .map((entry, index) => [
      index + 1,
      entry.test.name,
      entry.test.costPerUnit,
      entry.unitRatePerTest,
      (entry.test.costPerUnit ?? 0) * (entry.unitRatePerTest ?? 0),
      entry.test.note,
    ]);

  return `
    ${buildSection("ملخص البند", ["البند", "القيمة"], summaryRows)}
    ${buildSection(
    "المصنعيات",
    ["الرقم", "اسم المصنعية", "التصنيف العام", "الوحدة", "اليوميات", "إجمالي اليوميات", "معدل الأداء", "سعر المصنعية", "ملاحظات"],
    manufacturingRows,
  )}
    ${buildSection("الخامات", ["#", "الخامة", "المورد", "الفئة", "المعدل", "الإجمالي", "الملاحظات"], materialsRows)}
    ${buildSection("الاختبارات", ["#", "الاختبار", "التكلفة", "المعدل", "الإجمالي", "الملاحظات"], testsRows)}
  `;
};

export default function ManufacturingDetailsPage() {
  const params = useParams();
  const dispatch = useAppDispatch();
  const id = Number(params?.id);
  const { analyzedItem, analyzing, selectedItem, loading } = useAppSelector(
    (s) => s.items,
  );
  const { data: manufacturingData } = useAppSelector(
    (state) => state.manufacturing,
  );
  const manufacturingsById = useMemo(
    () =>
      new Map(
        manufacturingData.map(
          (manufacturing) => [manufacturing.id, manufacturing] as const,
        ),
      ),
    [manufacturingData],
  );
  const materialGroups = useAppSelector(
    (state) => state.materialsWithSuppliers.data,
  );
  const masterMaterials = useAppSelector((state) => state.materials.data);
  const masterMaterialsById = useMemo(
    () => new Map(masterMaterials.map((material) => [material.id, material])),
    [masterMaterials],
  );
  const getMaterialWaste = (
    row: AnalyzeItemDetails["itemSupplierMaterials"][number],
  ) => {
    const supplierMaterial = row.supplierMaterial;
    return (
      supplierMaterial.waste ??
      masterMaterialsById.get(supplierMaterial.materialId ?? 0)?.waste
    );
  };
  const supplierNames = useMemo(
    () =>
      new Map(
        materialGroups.map(
          (supplierMaterial) =>
            [supplierMaterial.id, supplierMaterial.supplierName] as const,
        ),
      ),
    [materialGroups],
  );

  useEffect(() => {
    dispatch(fetchItemById(id));
    dispatch(fetchAnalyzeItem(id));
    dispatch(fetchRows());
    dispatch(fetchMaterials());
    dispatch(fetchManufacturing({ page: 1, pageSize: 1000000 }));
  }, [dispatch, id]);

  if (analyzing || loading) return <Loader />;

  if (!selectedItem) {
    return <EmptyState image={card2BG} title={NO_DATA} />;
  }

  if (!selectedItem.isAnalyzed) {
    return (
      <div className="min-h-screen">
        <EmptyState
          image={card2BG}
          title="لم يتم تحليل هذا البند"
          actionText="حلل هذا البند الان"
          href={`/items/${id}/analyze`}
        />
      </div>
    );
  }

  if (!analyzedItem) {
    return <EmptyState image={card2BG} title={NO_DATA} />;
  }

  const reportTitle = `تقرير تحليل البند - ${analyzedItem.name}`;
  const reportHtml = buildAnalyzedItemReportHtml(
    analyzedItem,
    supplierNames,
    manufacturingsById,
  );

  const handleExportPdf = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <meta charset="UTF-8" />
          <title>${escapeHtml(reportTitle)}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #111827; }
            h2 { margin: 0 0 16px; }
            h3 { margin: 24px 0 10px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
            th, td { border: 1px solid #d1d5db; padding: 10px; text-align: right; }
            th { background-color: #f3f4f6; font-weight: 700; }
          </style>
        </head>
        <body>${reportHtml}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleExportExcel = () => {
    const summaryData: (string | number)[][] = [
      ["البيان", "القيمة"],
      ["اسم البند", analyzedItem.name],
      ["إجمالي الخامات", analyzedItem.totalMaterialPrice ?? 0],
      ["إجمالي الاختبارات", analyzedItem.totalTestPrice ?? 0],
      ["إجمالي المصنعيات", analyzedItem.totalManufacturingPrice ?? 0],
      ["الإجمالي الكلي غير شامل النسبة", analyzedItem.cost ?? 0],
      ["الإجمالي الكلي شامل النسبة", analyzedItem.costAfterRate ?? 0],
      ["ملاحظات", analyzedItem.note ?? ""],
    ];

    const manufacturingsData: (string | number)[][] = [
      [
        "الرقم",
        "المصنعية",
        "قيمة المصنعية",
        "معدل الأداء",
        "إجمالي اليوميات",
        "ملاحظات",
      ],
      ...(analyzedItem.itemManufacturings || [])
        .filter((entry) => entry?.manufacturing)
        .map((entry, index) => [
          index + 1,
          entry.manufacturing.name ?? "",
          (entry.manufacturing.performanceRate ?? 0) > 0
            ? (entry.manufacturing.totalDailyPrice ?? 0) /
            entry.manufacturing.performanceRate
            : 0,
          entry.manufacturing.performanceRate ?? 0,
          entry.manufacturing.totalDailyPrice ?? 0,
          entry.manufacturing.notes ?? "",
        ]),
    ];

    const dailiesData: (string | number)[][] = [
      [
        "المصنعية",
        "الرقم",
        "اليومية",
        "التصنيف",
        "سعر اليومية",
        "الكمية",
        "الإجمالي",
      ],
      ...(analyzedItem.itemManufacturings || []).flatMap((entry) =>
        (entry.manufacturing?.dailies || []).map((daily, index) => [
          entry.manufacturing?.name ?? "",
          index + 1,
          daily.daily?.name ?? "",
          daily.daily?.category === 0
            ? "عمالة"
            : daily.daily?.category === 1
              ? "معدة"
              : "",
          daily.daily?.pricePerDay ?? 0,
          daily.quantity ?? 0,
          (daily.daily?.pricePerDay ?? 0) * (daily.quantity ?? 0),
        ]),
      ),
    ];

    const materialsData: (string | number)[][] = [
      [
        "الرقم",
        "الخامة",
        "المورد",
        "الفئة",
        "المعدل",
        "الإجمالي",
        "الملاحظات",
      ],
      ...(analyzedItem.itemSupplierMaterials || [])
        .filter((entry) => entry?.supplierMaterial)
        .map((entry, index) => [
          index + 1,
          entry.supplierMaterial.materialName ?? "",
          supplierNames.get(entry.supplierMaterial.id) ?? "",
          entry.supplierMaterial.price ?? 0,
          entry.quantity ?? 0,
          (entry.supplierMaterial.price ?? 0) * (entry.quantity ?? 0),
          entry.supplierMaterial.note ?? "",
        ]),
    ];

    const testsData: (string | number)[][] = [
      ["الرقم", "الاختبار", "التكلفة", "المعدل", "الإجمالي", "الملاحظات"],
      ...(analyzedItem.itemTests || [])
        .filter((entry) => entry?.test)
        .map((entry, index) => [
          index + 1,
          entry.test.name ?? "",
          entry.test.costPerUnit ?? 0,
          entry.unitRatePerTest ?? 0,
          (entry.test.costPerUnit ?? 0) * (entry.unitRatePerTest ?? 0),
          entry.test.note ?? "",
        ]),
    ];

    const reportData: (string | number)[][] = [];
    const sectionTitleRows: number[] = [];
    const appendSection = (
      title: string,
      data: (string | number)[][],
    ) => {
      if (reportData.length > 0) reportData.push([]);
      sectionTitleRows.push(reportData.length);
      reportData.push([title], ...data);
    };

    appendSection("ملخص البند", summaryData);
    appendSection("المصنعيات", manufacturingsData);
    appendSection("اليوميات", dailiesData);
    appendSection("الخامات", materialsData);
    appendSection("الاختبارات", testsData);

    const worksheet = XLSX.utils.aoa_to_sheet(reportData);
    const maxColumns = Math.max(...reportData.map((row) => row.length));
    const columnWidths = [28, 34, 28, 22, 22, 18, 22];
    worksheet["!cols"] = Array.from({ length: maxColumns }, (_, column) => ({
      wch: columnWidths[column] ?? 22,
    }));
    worksheet["!merges"] = sectionTitleRows.map((row) => ({
      s: { r: row, c: 0 },
      e: { r: row, c: maxColumns - 1 },
    }));
    worksheet["!rows"] = Array.from(
      { length: reportData.length },
      (_, row) => (sectionTitleRows.includes(row) ? { hpt: 24 } : {}),
    );

    const range = worksheet["!ref"]
      ? XLSX.utils.decode_range(worksheet["!ref"])
      : null;
    if (range) {
      for (let row = range.s.r; row <= range.e.r; row += 1) {
        for (let column = range.s.c; column <= range.e.c; column += 1) {
          const cell = worksheet[XLSX.utils.encode_cell({ r: row, c: column })];
          if (cell?.t === "n") {
            cell.z = Number.isInteger(cell.v) ? "#,##0" : "#,##0.00";
          }
        }
      }
    }

    const workbook = XLSX.utils.book_new();
    workbook.Props = {
      Title: reportTitle,
      Subject: "تفاصيل تحليل البند",
      Author: "Construction Pricing",
      CreatedDate: new Date(),
    };
    workbook.Workbook = { Views: [{ RTL: true }] };
    XLSX.utils.book_append_sheet(workbook, worksheet, "تفاصيل تحليل البند");

    const safeFileName =
      `${selectedItem.id}-${selectedItem.subCategoryName}` ||
      "تقرير تحليل البند";
    XLSX.writeFile(workbook, `${safeFileName}.xlsx`, { compression: true });
  };

  const manufacturingItems = (analyzedItem.itemManufacturings || []).filter(
    (item) => item?.manufacturing,
  );
  const materialItems = (analyzedItem.itemSupplierMaterials || []).filter(
    (item) => item?.supplierMaterial,
  );
  const testItems = (analyzedItem.itemTests || []).filter((item) => item?.test);

  return (
    <div dir="rtl" className="space-y-8">
      {/* ================= HEADER ================= */}
      <div className="overflow-hidden border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 bg-linear-to-l from-red-50 to-white p-6">
          <div>
            <p className="mb-1 text-xs font-semibold text-[#bf0200]">
              تحليل البند
            </p>
            <h2 className="text-2xl font-bold text-gray-900">
              {displayValue(analyzedItem.name)}
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              ملخص كامل للتكلفة والخامات والاختبارات والمصنعيات.
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <button
              type="button"
              onClick={handleExportPdf}
              className="flex items-center h-12.5 gap-2 border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
            >
              <FileText size={16} />
              PDF
            </button>
            <button
              type="button"
              onClick={handleExportExcel}
              className="flex items-center h-12.5 gap-2 border border-green-600 bg-white px-4 py-2 text-sm font-semibold text-green-700 transition hover:bg-green-50"
            >
              <Download size={16} />
              Excel
            </button>
            <Button
              border
              text="تعديل التحليل"
              href={`/items/${id}/analyze?mode=edit`}
            />
            <Button text="تعديل البند" href={`/items/${id}/edit`} />
          </div>
        </div>

        <div className="grid gap-4 p-6 text-sm md:grid-cols-5">
          <Box label="إجمالي الخامات" value={analyzedItem.totalMaterialPrice} />
          <Box label="إجمالي الاختبارات" value={analyzedItem.totalTestPrice} />
          <Box
            label="إجمالي المصنعية"
            value={analyzedItem.totalManufacturingPrice}
          />
          <Box
            label="الإجمالي الكلي غير شامل النسبة"
            value={analyzedItem.cost}
          />
          <Box
            label="الإجمالي الكلي شامل النسبة"
            value={analyzedItem.costAfterRate}
          />
        </div>
        <div className="border-t border-gray-100 px-6 py-4">
          <p className="text-xs font-semibold text-gray-500">الملاحظات</p>
          <p className="mt-2 whitespace-pre-wrap text-sm text-gray-800">
            {displayValue(analyzedItem.note)}
          </p>
        </div>
      </div>

      {/* ================= MANUFACTURING ================= */}
      <SectionCard title="المصنعيات" count={manufacturingItems.length}>
        {manufacturingItems.length > 0 ? (
          <Table
            data={manufacturingItems.map((item) => item.manufacturing)}
            getRowKeyAction={(row) => row.id}
            emptyText={NO_DATA}
            columns={[
              {
                key: "id",
                header: "الرقم",
                render: (_, index) => index + 1,
              },
              {
                key: "publicCategory",
                header: "التصنيف العام",
                render: (row) =>
                  displayValue(
                    manufacturingsById.get(row.id)?.publicCategory?.name,
                  ),
              },
              {
                key: "name",
                header: "اسم المصنعية",
              },
              {
                key: "unit",
                header: "الوحدة",
                render: (row) => {
                  const manufacturing = manufacturingsById.get(row.id);
                  return displayValue(
                    manufacturing?.unitName ||
                    (typeof manufacturing?.unit === "string"
                      ? manufacturing.unit
                      : manufacturing?.unit?.value),
                  );
                },
              },
              {
                key: "dailies",
                header: "اليوميات",
                width: "320px",
                className: "overflow-hidden",
                render: (row) =>
                  row.dailies?.length ? (
                    <div className="max-h-44 min-w-0 space-y-2 overflow-y-auto overflow-x-hidden pe-1">
                      {row.dailies.map((daily, index) => (
                        <div
                          key={daily.id ?? index}
                          className="min-w-0 rounded-lg border border-gray-200 bg-white p-2 text-xs shadow-sm"
                        >
                          <div className="min-w-0 wrap-break-word font-semibold leading-5 text-gray-800">
                            {daily.daily?.name || NO_DATA}
                          </div>
                          <div className="mt-2 flex min-w-0 flex-wrap items-center gap-2">
                            <span className="max-w-full rounded-md bg-blue-50 px-2 py-1 font-semibold text-blue-700 break-all">
                              التصنيف:{" "}
                              {getDailyCategoryName(daily.daily?.category)}
                            </span>
                            <span className="max-w-full rounded-md bg-green-50 px-2 py-1 font-semibold text-green-700 break-all">
                              السعر: {displayValue(daily.daily?.pricePerDay)}
                            </span>
                            <span className="max-w-full rounded-md bg-orange-50 px-2 py-1 font-semibold text-orange-700 break-all">
                              الكمية: {daily.quantity}
                            </span>
                            <span className="max-w-full rounded-md bg-gray-100 px-2 py-1 font-semibold text-gray-700 break-all">
                              الإجمالي:{" "}
                              {(daily.quantity ?? 0) *
                                (daily.daily?.pricePerDay ?? 0)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-400">لا توجد يوميات</span>
                  ),
                exportValue: (row) =>
                  row.dailies
                    ?.map(
                      (daily) =>
                        `${daily.daily?.name ?? ""} - ${daily.daily?.pricePerDay ?? 0} - ${daily.quantity ?? 0}`,
                    )
                    .join(" | "),
              },
              {
                key: "totalDailyPrice",
                header: "إجمالي اليوميات",
                render: (row) =>
                  (row.dailies || []).reduce(
                    (total, daily) =>
                      total +
                      (daily.quantity ?? 0) *
                      (daily.daily?.pricePerDay ?? 0),
                    0,
                  ),
                showTotal: true,
                totalValue: (rows) =>
                  rows.reduce(
                    (total, row) =>
                      total +
                      (row.dailies || []).reduce(
                        (dailyTotal, daily) =>
                          dailyTotal +
                          (daily.quantity ?? 0) *
                          (daily.daily?.pricePerDay ?? 0),
                        0,
                      ),
                    0,
                  ),
              },
              {
                key: "performanceRate",
                header: "معدل الأداء",
              },
              {
                key: "performanceRateImage",
                header: "صورة معدل الأداء",
                printable: false,
                render: (row) => {
                  const image =
                    manufacturingsById.get(row.id)?.performanceRateImage;
                  return (
                    <div className="relative h-20 w-20">
                      <Image
                        src={image || default_image}
                        alt="manufacturing performance rate"
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    </div>
                  );
                },
              },
              {
                key: "manufacturingPrice",
                header: "سعر المصنعية",
                className: "font-semibold",
                render: (row) => {
                  const total = (row.dailies || []).reduce(
                    (sum, daily) =>
                      sum +
                      (daily.quantity ?? 0) *
                      (daily.daily?.pricePerDay ?? 0),
                    0,
                  );
                  return row.performanceRate > 0
                    ? (total / row.performanceRate).toFixed(2)
                    : "0.00";
                },
                showTotal: true,
                totalValue: (rows) =>
                  rows.reduce((sum, row) => {
                    const totalDailyPrice = (row.dailies || []).reduce(
                      (dailyTotal, daily) =>
                        dailyTotal +
                        (daily.quantity ?? 0) *
                          (daily.daily?.pricePerDay ?? 0),
                      0,
                    );

                    return (
                      sum +
                      (row.performanceRate > 0
                        ? totalDailyPrice / row.performanceRate
                        : 0)
                    );
                  }, 0),
              },
              {
                key: "notes",
                header: "ملاحظات",
                render: (row) => row.notes || "-",
              },
            ]}
          />
        ) : (
          <NoDataBox />
        )}
      </SectionCard>

      {/* ================= MATERIALS ================= */}
      <SectionCard title="الخامات" count={materialItems.length}>
        <Table
          data={materialItems}
          getRowKeyAction={(item, index) =>
            item?.supplierMaterial?.id
              ? `item-${item.supplierMaterial.id}`
              : `item-${index}`
          }
          emptyText={NO_DATA}
          columns={[
            {
              key: "index",
              header: "الرقم",
              render: (_row, index) => index + 1,
            },
            {
              key: "categoryName",
              header: "التصنيف العام",
              render: (row) => {
                const supplierMaterial = row?.supplierMaterial;
                const masterMaterial = masterMaterialsById.get(
                  supplierMaterial?.materialId ?? 0,
                );
                return displayValue(
                  supplierMaterial?.categoryName ??
                  masterMaterial?.categoryName,
                );
              },
              filterable: true,
            },
            {
              key: "subCategoryName",
              header: "تصنيف الخامة",
              render: (row) => {
                const supplierMaterial = row?.supplierMaterial;
                const masterMaterial = masterMaterialsById.get(
                  supplierMaterial?.materialId ?? 0,
                );
                return displayValue(
                  supplierMaterial?.subCategoryName ??
                  masterMaterial?.subCategoryName,
                );
              },
              filterable: true,
            },
            {
              key: "materialName",
              header: "اسم الخامة",
              render: (row) =>
                displayValue(row?.supplierMaterial?.materialName),
              filterable: true,
            },
            {
              key: "unitName",
              header: "الوحدة",
              render: (row) => {
                const supplierMaterial = row?.supplierMaterial;
                const masterMaterial = masterMaterialsById.get(
                  supplierMaterial?.materialId ?? 0,
                );
                return displayValue(
                  supplierMaterial?.unitName ?? masterMaterial?.unitName,
                );
              },
              filterable: true,
            },
            {
              key: "supplierName",
              header: "المورد",
              render: (row) =>
                displayValue(
                  supplierNames.get(row?.supplierMaterial?.id ?? 0),
                ),
              filterable: true,
            },
            {
              key: "price",
              header: "الفئة",
              render: (row) => displayValue(row?.supplierMaterial?.price),
            },
            {
              key: "waste",
              header: "الهالك",
              render: (row) => {
                const waste = getMaterialWaste(row);
                return waste === undefined
                  ? NO_DATA
                  : `${(Number(waste) || 0) * 100}%`;
              },
            },
            {
              key: "note",
              header: "الملاحظات",
              render: (row) => displayValue(row?.supplierMaterial?.note),
              className: "whitespace-normal! min-w-[20vw]",
            },
            {
              key: "quantity",
              header: "المعدل",
            },
            {
              key: "total",
              header: "الفئة الاجمالية",
              className: "font-semibold",
              showTotal: true,
              totalValue: (rows) =>
                rows.reduce(
                  (total, row) =>
                    total +
                    (row?.quantity ?? 0) *
                    (row?.supplierMaterial?.price ?? 0),
                  0,
                ),
              render: (row) =>
                (row?.quantity ?? 0) * (row?.supplierMaterial?.price ?? 0),
            },
            {
              key: "quantityAfterWaste",
              header: "المعدل بعد الهالك",
              showTotal: true,
              totalValue: (rows) =>
                rows.reduce((total, row) => {
                  const waste = getMaterialWaste(row) ?? 0;
                  return total + (row?.quantity ?? 0) * (1 + waste);
                }, 0),
              render: (row) => {
                const waste = getMaterialWaste(row) ?? 0;
                return (
                  (row?.quantity ?? 0) *
                  (1 + waste)
                ).toLocaleString("en-US", { maximumFractionDigits: 2 });
              },
            },
            {
              key: "finalPrice",
              header: "الفئة النهائية",
              className: "font-semibold",
              showTotal: true,
              totalValue: (rows) =>
                rows.reduce((total, row) => {
                  const waste = getMaterialWaste(row) ?? 0;
                  return (
                    total +
                    (row?.quantity ?? 0) *
                    (1 + waste) *
                    (row?.supplierMaterial?.price ?? 0)
                  );
                }, 0),
              render: (row) => {
                const waste = getMaterialWaste(row) ?? 0;
                return (
                  (row?.quantity ?? 0) *
                  (1 + waste) *
                  (row?.supplierMaterial?.price ?? 0)
                ).toLocaleString("en-US", { maximumFractionDigits: 2 });
              },
            },
          ]}
        />
      </SectionCard>

      {/* ================= TESTS ================= */}
      <SectionCard title="الاختبارات" count={testItems.length}>
        <Table
          fillViewport
          data={testItems}
          getRowKeyAction={(row, index) =>
            row?.test?.id ? `${row.test.id}` : `test-${index}`
          }
          emptyText={NO_DATA}
          columns={[
            {
              key: "index",
              header: "الرقم",
              className: "text-center",
              render: (_row, index) => index + 1,
            },
            {
              key: "testName",
              header: "الاختبار",
              className: "text-center",
              render: (row) => displayValue(row?.test?.name),
            },
            {
              key: "costPerUnit",
              header: "التكلفة",
              className: "text-center",
              render: (row) => displayValue(row?.test?.costPerUnit),
            },
            {
              key: "unitRatePerTest",
              header: "المعدل",
              className: "text-center",
            },
            {
              key: "total",
              header: "الإجمالي",
              className: "text-center font-semibold",
              showTotal: true,
              totalValue: (rows) =>
                rows.reduce(
                  (total, row) =>
                    total +
                    (row?.test?.costPerUnit ?? 0) *
                      (row?.unitRatePerTest ?? 0),
                  0,
                ),
              render: (row) =>
                (row?.test?.costPerUnit ?? 0) * (row?.unitRatePerTest ?? 0),
            },
            {
              key: "note",
              header: "الملاحظات",
              render: (row) => displayValue(row?.test?.note),
            },
          ]}
        />
      </SectionCard>
    </div>
  );
}
