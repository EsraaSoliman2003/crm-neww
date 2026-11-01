"use client";

import Table from "@/components/table/Table";
import axios from "@/lib/axios";
import { Estimate } from "@/lib/dtos";
import type { MaterialWithSuppliers } from "@/utils/dtos";
import { formatDateTime } from "@/lib/formatDateTime";
import Loading from "@/skilton/Loading";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import ChooseItems from "./ChooseItems";
import Button from "@/components/button/Button";
import { toast } from "sonner";
import Input from "@/components/form/Input";
import Dropdown from "@/components/dropdown/DropDown";
import { confirmDelete } from "@/utils/confirmDelete";
import { Download, FileText, Trash2 } from "lucide-react";
import * as XLSX from "xlsx";
import type { AnalyzeItemDetails } from "@/rtk/slices/itemSlice";
import {
  saveEstimateItemQuantities,
  syncEstimateItemQuantities,
  type EstimateItemQuantityEntry,
} from "@/utils/estimateItemQuantities";
import { formatProjectCost } from "@/lib/formatProjectCost";
import EditEstimateQuantityModal from "../_components/EditEstimateQuantityModal";

type Option = {
  value: string;
  label: string;
};

type EstimateItemWithMetrics = Estimate["items"][number] & {
  estimateQuantity: number;
  estimateTotal: number;
};

const NO_DATA = "لا توجد بيانات";

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
    : `<tr><td colspan="${headers.length}">${NO_DATA}</td></tr>`
  }
    </tbody>
  </table>
`;

// Styles for the printed / PDF estimate report only (the on-screen table is
// untouched). An item is one table row, and a row is never split across two
// pages: if it doesn't fit, it moves whole to the next page, and the column
// headers repeat at the top of every page.
const ESTIMATE_PRINT_STYLES = `
  body { font-family: Arial, sans-serif; padding: 20px; color: #111827; }
  h2 { margin: 0 0 16px; }
  h3 { margin: 24px 0 10px; break-after: avoid; page-break-after: avoid; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  /* break-word only breaks a word longer than its column, so column widths
     stay as before (anywhere would let numbers break digit by digit). */
  th, td {
    border: 1px solid #d1d5db; padding: 10px; text-align: right; vertical-align: top;
    overflow-wrap: break-word;
  }
  th { background-color: #f3f4f6; font-weight: 700; }
  thead { display: table-header-group; }
  /* On the row only: on cells too it makes Chrome leave empty rows behind. */
  tr { break-inside: avoid; page-break-inside: avoid; }
  @media print {
    body { padding: 0; }
    th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
`;

const buildEstimateReportHtml = (
  estimate: Estimate,
  estimateItemsWithMetrics: EstimateItemWithMetrics[],
) => {
  const summaryRows = [
    ["رقم المقايسة", estimate.estimateNumber],
    ["اسم المقايسة", estimate.name],
    ["الشركة", estimate.companyName],
    ["المشروع", estimate.projectName],
    ["مرحلة المقايسة", estimate.estimateStage?.name],
    ["تمام المقايسة", estimate.estimateComplete?.name],
    ["عرض الإدارة", estimate.adminOfferPrice],
    ["قيمة البنود قبل النسبة", estimate.totalItemPriceBefore],
    ["قيمة البنود بعد النسبة", estimate.totalItemPriceAfter],
    ["الإجمالي", estimate.totalPrice],
    ["تاريخ الإنشاء", formatDateTime(estimate.createdAt)],
    ["ملاحظات", estimate.notes],
  ];

  const itemRows = estimateItemsWithMetrics.map((item, index) => [
    index + 1,
    item.name,
    item.unit?.value,
    item.entityCategoryMapping?.category?.name || item.categoryName,
    item.entityCategoryMapping?.subCategory?.name || item.subCategoryName,
    item.estimateQuantity,
    item.cost,
    item.estimateTotal,
    item.costAfterRate,
    item.isAnalyzed ? "تم التحليل" : "لم يتم التحليل",
    item.note,
  ]);

  return `
    <h2>${escapeHtml(`تقرير المقايسة - ${estimate.name}`)}</h2>
    ${buildSection("بيانات المقايسة", ["البند", "القيمة"], summaryRows)}
    ${buildSection(
    "بنود المقايسة",
    [
      "#",
      "اسم البند",
      "الوحدة",
      "التصنيف",
      "التصنيف الفرعي",
      "الكمية",
      "التكلفة",
      "الإجمالي",
      "السعر بعد التكلفة",
      "حالة التحليل",
      "ملاحظات",
    ],
    itemRows,
  )}
  `;
};

export default function EstimateDetailsUI() {
  const router = useRouter();
  const totalsRef = useRef<HTMLElement>(null);
  const params = useParams();
  const id = params.id;
  const [itemQuantities, setItemQuantities] = useState<
    EstimateItemQuantityEntry[]
  >([]);
  const [estimateD, setEstimateD] = useState<Estimate>();
  const [loading, setLoading] = useState<boolean>(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [itemFilters, setItemFilters] = useState({
    search: "",
    category: "",
    subCategory: "",
  });
  const [selectedAnalysisStatus, setSelectedAnalysisStatus] = useState<Option>({
    value: "",
    label: "كل حالات التحليل",
  });
  const [quantityModalOpen, setQuantityModalOpen] = useState(false);
  const [selectedQuantityItem, setSelectedQuantityItem] =
    useState<EstimateItemWithMetrics | null>(null);

  // Get Estimate By Id
  const fetchEstimate = useCallback(async (id: string) => {
    try {
      setLoading(true);
      const { data } = await axios.get<Estimate>(`/Estimate/${id}`);
      const syncedItemQuantities = syncEstimateItemQuantities(
        data.id,
        (data.items || []).map((item) => item.id),
      );
      setItemQuantities(syncedItemQuantities);
      setEstimateD(data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    if (!id) return;
    fetchEstimate(String(id));
  }, [id, fetchEstimate]);
  // Add Items
  const [openSelector, setOpenSelector] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);
  const [selectedQuantities, setSelectedQuantities] = useState<
    Record<number, number>
  >({});
  const [addingItems, setAddingItems] = useState(false);
  const toggle = (id: number) => {
    const isSelected = selected.includes(id);

    setSelected((prev) =>
      isSelected ? prev.filter((x) => x !== id) : [...prev, id],
    );
    setSelectedQuantities((quantities) => {
      const nextQuantities = { ...quantities };

      if (isSelected) {
        delete nextQuantities[id];
      } else {
        nextQuantities[id] = quantities[id] ?? 1;
      }

      return nextQuantities;
    });
  };
  const changeSelectedItemQuantity = (itemId: number, quantity: number) => {
    setSelectedQuantities((prev) => ({
      ...prev,
      [itemId]: Number.isFinite(quantity) ? quantity : 0,
    }));
  };
  const hasItems = (estimateD?.items?.length ?? 0) > 0;
  const currentItemIds = new Set((estimateD?.items ?? []).map((item) => item.id));
  const newSelectedItemsCount = selected.filter(
    (itemId) => !currentItemIds.has(itemId),
  ).length;
  const addItemsToEstimate = async (payload: {
    estimateId: number;
    itemIds: number[];
  }) => {
    const { data } = await axios.post(
      `Estimate/Assign?isUpdate=${true}`,
      payload,
    );

    return data;
  };
  const handleAdd = async () => {
    setAddingItems(true);
    try {
      await addItemsToEstimate({
        estimateId: Number(id),
        itemIds: selected,
      });

      const currentQuantityMap = new Map(
        itemQuantities.map((item) => [item.itemId, item.quantity]),
      );
      saveEstimateItemQuantities(
        Number(id),
        selected.map((itemId) => ({
          itemId,
          quantity:
            selectedQuantities[itemId] ?? currentQuantityMap.get(itemId) ?? 1,
        })),
      );

      toast.success("تم إضافة البنود بنجاح");
      fetchEstimate(String(id));
      setSelected([]);
      setSelectedQuantities({});
      setOpenSelector(false);
    } catch (err) {
      console.log(err);
    } finally {
      setAddingItems(false);
    }
  };

  const updateEstimateItems = async (itemIds: number[]) => {
    await addItemsToEstimate({
      estimateId: Number(id),
      itemIds,
    });
    setSelected(itemIds);
    fetchEstimate(String(id));
  };

  const handleRemoveItem = async (itemId: number) => {
    await confirmDelete(itemId, async (id) => {
      const nextItemIds = (estimateD?.items ?? [])
        .filter((item) => item.id !== Number(id))
        .map((item) => item.id);

      await updateEstimateItems(nextItemIds);
    });
  };

  const handleRemoveAllItems = async () => {
    await confirmDelete("all-estimate-items", async () => {
      await updateEstimateItems([]);
      setItemFilters({
        search: "",
        category: "",
        subCategory: "",
      });
      setSelectedAnalysisStatus({
        value: "",
        label: "كل حالات التحليل",
      });
    });
  };
  // Add Items
  if (loading) return <Loading />;
  const estimateItems = estimateD?.items ?? [];
  const itemQuantityMap = new Map(
    itemQuantities.map((item) => [item.itemId, item.quantity]),
  );
  const estimateItemsWithMetrics: EstimateItemWithMetrics[] = estimateItems.map(
    (item) => {
      const estimateQuantity = itemQuantityMap.get(item.id) ?? 1;

      return {
        ...item,
        estimateQuantity,
        estimateTotal: Number(item.cost ?? 0) * estimateQuantity,
      };
    },
  );
  const categoryOptions = [
    { value: "", label: "كل التصنيفات العامة" },
    ...Array.from(
      new Map(
        estimateItems
          .map((item) => item.entityCategoryMapping?.category)
          .filter(Boolean)
          .map((category) => [
            String(category?.id),
            {
              value: String(category?.id),
              label: category?.name ?? "",
            },
          ]),
      ).values(),
    ),
  ];
  const subCategoryOptions = [
    { value: "", label: "كل التصنيفات الفرعية" },
    ...Array.from(
      new Map(
        estimateItems
          .filter(
            (item) =>
              itemFilters.category === "" ||
              String(item.entityCategoryMapping?.category?.id) ===
              itemFilters.category,
          )
          .map((item) => item.entityCategoryMapping?.subCategory)
          .filter(Boolean)
          .map((subCategory) => [
            String(subCategory?.id),
            {
              value: String(subCategory?.id),
              label: subCategory?.name ?? "",
            },
          ]),
      ).values(),
    ),
  ];
  const filteredItems = estimateItemsWithMetrics.filter(
    (item) =>
      item.name.toLowerCase().includes(itemFilters.search.toLowerCase()) &&
      (itemFilters.category === "" ||
        String(item.entityCategoryMapping?.category?.id) ===
        itemFilters.category) &&
      (itemFilters.subCategory === "" ||
        String(item.entityCategoryMapping?.subCategory?.id) ===
        itemFilters.subCategory) &&
      (selectedAnalysisStatus.value === "" ||
        (selectedAnalysisStatus.value === "analyzed" && item.isAnalyzed) ||
        (selectedAnalysisStatus.value === "not-analyzed" && !item.isAnalyzed)),
  );

  const totals = filteredItems.reduce(
    (sum, item) => {
      const quantity = Number(item.estimateQuantity);
      const cost = Number(item.cost);
      const estimateTotal = Number(item.estimateTotal);
      const costAfterRate = Number(item.costAfterRate);

      return {
        quantity: sum.quantity + (Number.isFinite(quantity) ? quantity : 0),
        cost: sum.cost + (Number.isFinite(cost) ? cost : 0),
        estimateTotal:
          sum.estimateTotal +
          (Number.isFinite(estimateTotal) ? estimateTotal : 0),
        costAfterRate:
          sum.costAfterRate +
          (Number.isFinite(costAfterRate) ? costAfterRate : 0),
      };
    },
    {
      quantity: 0,
      cost: 0,
      estimateTotal: 0,
      costAfterRate: 0,
    },
  );

  const reportTitle = `تقرير المقايسة - ${estimateD?.name ?? ""}`;
  const reportHtml = estimateD
    ? buildEstimateReportHtml(estimateD, estimateItemsWithMetrics)
    : "";

  const handleExportPdf = () => {
    if (!estimateD) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <meta charset="UTF-8" />
          <title>${escapeHtml(reportTitle)}</title>
          <style>${ESTIMATE_PRINT_STYLES}</style>
        </head>
        <body>${reportHtml}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleExportExcel = async () => {
    if (!estimateD) return;

    setExportingExcel(true);

    try {
      const analyzedItems = (estimateD.items || []).filter(
        (item) => item.isAnalyzed,
      );
      const loadedAnalyses = await Promise.all(
        analyzedItems.map(async (item) => {
          try {
            const { data } = await axios.get<AnalyzeItemDetails>(
              `/Item/analyze/${item.id}`,
            );
            return { item, analysis: data };
          } catch (error) {
            console.error(`Failed to load analysis for item ${item.id}`, error);
            return null;
          }
        }),
      );
      const analyses = loadedAnalyses.filter(
        (result): result is NonNullable<typeof result> => result !== null,
      );
      let supplierLookupFailed = false;
      let supplierNames = new Map<number, string>();
      try {
        const { data: materialGroups } = await axios.get<
          MaterialWithSuppliers[]
        >("/SupplierMaterial/Show");
        supplierNames = new Map(
          materialGroups.map(
            (supplierMaterial) =>
              [supplierMaterial.id, supplierMaterial.supplierName] as const,
          ),
        );
      } catch (error) {
        supplierLookupFailed = true;
        console.error("Failed to load supplier names", error);
      }

      const summaryData: (string | number)[][] = [
        ["البيان", "القيمة"],
        ["رقم المقايسة", estimateD.estimateNumber ?? ""],
        ["اسم المقايسة", estimateD.name ?? ""],
        ["الشركة", estimateD.companyName ?? ""],
        ["المشروع", estimateD.projectName ?? ""],
        ["مرحلة المقايسة", estimateD.estimateStage?.name ?? ""],
        ["تمام المقايسة", estimateD.estimateComplete?.name ?? ""],
        ["الكمية", estimateD.quantity ?? 0],
        ["سعر الوحدة", estimateD.pricePerUnit ?? 0],
        ["عرض إدارة", estimateD.isAdminOffer ? "نعم" : "لا"],
        ["قيمة عرض الإدارة", estimateD.adminOfferPrice ?? 0],
        ["قيمة البنود قبل النسبة", estimateD.totalItemPriceBefore ?? 0],
        ["قيمة البنود بعد النسبة", estimateD.totalItemPriceAfter ?? 0],
        ["الإجمالي", estimateD.totalPrice ?? 0],
        ["تاريخ الإنشاء", formatDateTime(estimateD.createdAt)],
        ["ملاحظات", estimateD.notes ?? ""],
      ];

      const itemsData: (string | number)[][] = [
        [
          "رقم البند",
          "اسم البند",
          "الوحدة",
          "التصنيف",
          "التصنيف الفرعي",
          "الكمية",
          "التكلفة",
          "الإجمالي",
          "السعر بعد التكلفة",
          "حالة التحليل",
          "ملاحظات",
        ],
        ...estimateItemsWithMetrics.map((item) => [
          item.id,
          item.name ?? "",
          item.unit?.value ?? "",
          item.entityCategoryMapping?.category?.name ?? item.categoryName ?? "",
          item.entityCategoryMapping?.subCategory?.name ??
          item.subCategoryName ??
          "",
          item.estimateQuantity,
          item.cost ?? 0,
          item.estimateTotal ?? 0,
          item.costAfterRate ?? 0,
          item.isAnalyzed ? "تم التحليل" : "لم يتم التحليل",
          item.note ?? "",
        ]),
      ];

      const analysisSummaryData: (string | number)[][] = [
        [
          "رقم البند",
          "اسم البند",
          "تكلفة البند",
          "السعر بعد التكلفة",
          "إجمالي الخامات",
          "إجمالي الاختبارات",
          "إجمالي المصنعيات",
          "إجمالي التحليل",
          "ملاحظات البند",
        ],
        ...analyses.map(({ item, analysis }) => [
          item.id,
          item.name,
          analysis.cost ?? 0,
          analysis.costAfterRate ?? 0,
          analysis.totalMaterialPrice ?? 0,
          analysis.totalTestPrice ?? 0,
          analysis.totalManufacturingPrice ?? 0,
          analysis.totalPrice ?? 0,
          analysis.note ?? "",
        ]),
      ];

      const workbook = XLSX.utils.book_new();
      workbook.Props = {
        Title: reportTitle,
        Subject: "المقايسة وبنودها وتحليل البنود",
        Author: "Construction Pricing",
        CreatedDate: new Date(),
      };
      workbook.Workbook = { Views: [{ RTL: true }] };

      const appendSection = (
        reportData: (string | number)[][],
        sectionTitleRows: number[],
        title: string,
        data: (string | number)[][],
      ) => {
        if (reportData.length > 0) reportData.push([]);
        sectionTitleRows.push(reportData.length);
        reportData.push([title], ...data);
      };

      const createReportSheet = (
        reportData: (string | number)[][],
        sectionTitleRows: number[],
        columnWidths: number[],
      ) => {
        const sheet = XLSX.utils.aoa_to_sheet(reportData);
        const maxColumns = Math.max(...reportData.map((row) => row.length));
        sheet["!cols"] = Array.from({ length: maxColumns }, (_, column) => ({
          wch: columnWidths[column] ?? 22,
        }));
        sheet["!merges"] = sectionTitleRows.map((row) => ({
          s: { r: row, c: 0 },
          e: { r: row, c: maxColumns - 1 },
        }));
        sheet["!rows"] = Array.from({ length: reportData.length }, (_, row) =>
          sectionTitleRows.includes(row) ? { hpt: 24 } : {},
        );

        const range = sheet["!ref"] ? XLSX.utils.decode_range(sheet["!ref"]) : null;
        if (range) {
          for (let row = range.s.r; row <= range.e.r; row += 1) {
            for (let column = range.s.c; column <= range.e.c; column += 1) {
              const cell = sheet[XLSX.utils.encode_cell({ r: row, c: column })];
              if (cell?.t === "n") {
                cell.z = Number.isInteger(cell.v) ? "#,##0" : "#,##0.00";
              }
            }
          }
        }

        return sheet;
      };

      const summaryReportData: (string | number)[][] = [];
      const summarySectionTitleRows: number[] = [];
      appendSection(
        summaryReportData,
        summarySectionTitleRows,
        "بيانات المقايسة",
        summaryData,
      );
      appendSection(
        summaryReportData,
        summarySectionTitleRows,
        "بنود المقايسة",
        itemsData,
      );
      if (analysisSummaryData.length > 1) {
        appendSection(
          summaryReportData,
          summarySectionTitleRows,
          "ملخص تحليل البنود",
          analysisSummaryData,
        );
      }

      XLSX.utils.book_append_sheet(
        workbook,
        createReportSheet(
          summaryReportData,
          summarySectionTitleRows,
          [38, 38, 20, 28, 20, 28, 20, 28, 22, 20, 22],
        ),
        "ملخص المقايسة",
      );

      const analysisByItemId = new Map(
        analyses.map(({ item, analysis }) => [item.id, analysis]),
      );
      for (const item of estimateItemsWithMetrics) {
        const analysis = analysisByItemId.get(item.id);
        const itemData: (string | number)[][] = [];
        const itemSectionTitleRows: number[] = [];

        appendSection(itemData, itemSectionTitleRows, "بيانات البند", [
          ["البيان", "القيمة"],
          ["رقم البند", item.id],
          ["اسم البند", item.name ?? ""],
          ["الوحدة", item.unit?.value ?? ""],
          [
            "التصنيف",
            item.entityCategoryMapping?.category?.name ??
              item.categoryName ??
              "",
          ],
          [
            "التصنيف الفرعي",
            item.entityCategoryMapping?.subCategory?.name ??
              item.subCategoryName ??
              "",
          ],
          ["الكمية", item.estimateQuantity],
          ["التكلفة", item.cost ?? 0],
          ["الإجمالي", item.estimateTotal ?? 0],
          ["السعر بعد التكلفة", item.costAfterRate ?? 0],
          ["حالة التحليل", item.isAnalyzed ? "تم التحليل" : "لم يتم التحليل"],
          ["ملاحظات", item.note ?? ""],
        ]);

        appendSection(itemData, itemSectionTitleRows, "ملخص التحليل", [
          ["البيان", "القيمة"],
          ...(analysis
            ? [
                ["تكلفة البند", analysis.cost ?? 0],
                ["السعر بعد التكلفة", analysis.costAfterRate ?? 0],
                ["إجمالي الخامات", analysis.totalMaterialPrice ?? 0],
                ["إجمالي الاختبارات", analysis.totalTestPrice ?? 0],
                ["إجمالي المصنعيات", analysis.totalManufacturingPrice ?? 0],
                ["إجمالي التحليل", analysis.totalPrice ?? 0],
                ["ملاحظات البند", analysis.note ?? ""],
              ]
            : [
                [
                  "حالة التحليل",
                  item.isAnalyzed ? "تعذر تحميل التحليل" : "لم يتم التحليل",
                ],
              ]),
        ]);

        if (analysis) {
          const materials = (analysis.itemSupplierMaterials || []).map(
            (material) => [
              material.supplierMaterial?.materialName ?? "",
              supplierNames.get(material.supplierMaterial?.id ?? 0) ?? "",
              material.supplierMaterial?.price ?? 0,
              material.quantity ?? 0,
              (material.supplierMaterial?.price ?? 0) *
                (material.quantity ?? 0),
            ],
          );
          appendSection(itemData, itemSectionTitleRows, "خامات البند", [
            ["الخامة", "المورد", "سعر الوحدة", "الكمية", "الإجمالي"],
            ...(materials.length > 0 ? materials : [["لا توجد بيانات"]]),
          ]);

          const tests = (analysis.itemTests || []).map((test) => [
            test.test?.name ?? "",
            test.test?.costPerUnit ?? 0,
            test.unitRatePerTest ?? 0,
            (test.test?.costPerUnit ?? 0) * (test.unitRatePerTest ?? 0),
          ]);
          appendSection(itemData, itemSectionTitleRows, "اختبارات البند", [
            ["الاختبار", "تكلفة الوحدة", "معدل الاختبار", "الإجمالي"],
            ...(tests.length > 0 ? tests : [["لا توجد بيانات"]]),
          ]);

          const manufacturings = (analysis.itemManufacturings || []).map(
            (manufacturing) => [
              manufacturing.manufacturing?.name ?? "",
              manufacturing.manufacturing?.performanceRate ?? 0,
              manufacturing.manufacturing?.totalDailyPrice ?? 0,
              manufacturing.manufacturing?.notes ?? "",
            ],
          );
          appendSection(itemData, itemSectionTitleRows, "مصنعيات البند", [
            ["المصنعية", "معدل الأداء", "إجمالي اليوميات", "ملاحظات"],
            ...(manufacturings.length > 0
              ? manufacturings
              : [["لا توجد بيانات"]]),
          ]);

          const dailies = (analysis.itemManufacturings || []).flatMap(
            (manufacturing) =>
              (manufacturing.manufacturing?.dailies || []).map((daily) => [
                manufacturing.manufacturing?.name ?? "",
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
          );
          appendSection(itemData, itemSectionTitleRows, "يوميات المصنعيات", [
            [
              "المصنعية",
              "اليومية",
              "التصنيف",
              "سعر اليومية",
              "الكمية",
              "الإجمالي",
            ],
            ...(dailies.length > 0 ? dailies : [["لا توجد بيانات"]]),
          ]);
        }

        const safeItemName =
          (item.name || "بند")
            .replace(/[\\/?*[\]:]/g, "-")
            .replace(/[\u0000-\u001f]/g, " ")
            .replace(/^'+|'+$/g, "")
            .trim() || "بند";
        const sheetName = `${item.id}-${safeItemName}`
          .slice(0, 31)
          .replace(/'+$/g, "");
        XLSX.utils.book_append_sheet(
          workbook,
          createReportSheet(itemData, itemSectionTitleRows, [
            38, 38, 20, 28, 20, 28,
          ]),
          sheetName,
        );
      }

      const safeFileName =
        reportTitle.replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-").trim() ||
        "تقرير المقايسة";
      XLSX.writeFile(workbook, `${safeFileName}.xlsx`, { compression: true });

      if (analyses.length < analyzedItems.length) {
        toast.warning("تم التصدير، لكن تعذر تحميل تحليل بعض البنود");
      } else if (supplierLookupFailed) {
        toast.warning("تم التصدير، لكن تعذر تحميل أسماء بعض الموردين");
      }
    } catch (error) {
      console.error(error);
      toast.error("تعذر إنشاء ملف Excel");
    } finally {
      setExportingExcel(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* ================= CARD ================= */}
      <div className="bg-white border border-gray-300 shadow p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-xl font-bold text-gray-800">{estimateD?.name}</h2>

          <div className="flex items-center gap-3 flex-wrap">
            {estimateD?.isAdminOffer && (
              <span className="bg-green-100 h-12  text-green-700 px-3 py-1 flex items-center justify-center text-sm">
                عرض الإدارة
              </span>
            )}

            <button
              type="button"
              onClick={handleExportPdf}
              className="flex h-12 items-center gap-2 border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
            >
              <FileText size={16} />
              PDF
            </button>
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={exportingExcel}
              className="flex h-12 items-center gap-2 border border-green-600 bg-white px-4 py-2 text-sm font-semibold text-green-700 transition hover:bg-green-50 disabled:cursor-wait disabled:opacity-60"
            >
              <Download size={16} />
              {exportingExcel ? "جاري تجهيز Excel..." : "Excel"}
            </button>
            <Button
              text="تعديل المقايسة"
              href={`/estimates/add-estimate?id=${id}&mode=edit`}
              className="grow text-center"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-700">
          <Info label="رقم المقايسة" value={estimateD?.estimateNumber ?? ""} />
          <Info label="الشركة" value={estimateD?.companyName ?? ""} />
          <Info
            label="مرحله المقايسه"
            value={estimateD?.estimateStage.name ?? ""}
          />
          <Info
            label="تمام المقايسه"
            value={estimateD?.estimateComplete.name ?? ""}
          />
          <Info
            label="عرض المشروع"
            value={estimateD?.adminOfferPrice.toLocaleString() ?? ""}
          />
          <div className="grid grid-cols-2 gap-2">
            <Info
              label="تاريخ الإنشاء"
              value={formatDateTime(estimateD?.createdAt ?? "")}
            />
            <Info
              label="تاريخ التعديل"
              value={formatDateTime(estimateD?.updatedAt ?? "")}
            />
          </div>
        </div>

        {estimateD?.notes && (
          <p className="text-sm text-gray-600">{estimateD?.notes}</p>
        )}
      </div>

      <div className="space-y-3">
        <Table
          data={filteredItems}
          viewportFooterRef={totalsRef}
          filterContent={
            hasItems ? (
              <div className="grid gap-3 md:grid-cols-4">
                <Input
                  name="search"
                  type="text"
                  value={itemFilters.search}
                  placeholder="بحث باسم البند"
                  onChange={(event) =>
                    setItemFilters((prev) => ({
                      ...prev,
                      search: event.target.value,
                    }))
                  }
                />

                <Dropdown
                  placeholder="اختر التصنيف العام"
                  options={categoryOptions}
                  selected={itemFilters.category}
                  onSelect={(option) =>
                    setItemFilters((prev) => ({
                      ...prev,
                      category: option.value,
                      subCategory: "",
                    }))
                  }
                />

                <Dropdown
                  placeholder="اختر التصنيف الفرعي"
                  options={subCategoryOptions}
                  selected={itemFilters.subCategory}
                  onSelect={(option) =>
                    setItemFilters((prev) => ({
                      ...prev,
                      subCategory: option.value,
                    }))
                  }
                />

                <Dropdown
                  placeholder="فلتر حالة التحليل"
                  options={[
                    { value: "", label: "كل حالات التحليل" },
                    { value: "analyzed", label: "تم التحليل" },
                    { value: "not-analyzed", label: "لم يتم التحليل" },
                  ]}
                  selected={selectedAnalysisStatus.value}
                  onSelect={setSelectedAnalysisStatus}
                />
              </div>
            ) : undefined
          }
          loading={loading}
          emptyText="لا توجد بيانات"
          getRowKeyAction={(item) => item.id}
          onRowClickAction={(row) => router.push(`/items/${row.id}`)}
          columns={[
            {
              key: "id",
              header: "الرقم",
              width: "10px",
              className: "whitespace-nowrap!",
              render: (_, index) => index + 1,
            },
            {
              key: "category",
              header: "التصنيف",
              width: "50px",
              className: "whitespace-normal! wrap-break-word! overflow-hidden",
              render: (row) =>
                row.entityCategoryMapping?.category?.name || "-",
              filterable: true,
            },
            {
              key: "subCategory",
              header: "التصنيف الفرعي",
              width: "50px",
              className: "whitespace-normal! wrap-break-word! overflow-hidden",
              render: (row) =>
                row.entityCategoryMapping?.subCategory?.name || "-",
              filterable: true,
              filterDependsOn: "category",
            },
            {
              key: "name",
              header: "اسم البند",
              width: "auto",
              filterable: true,
            },
            {
              key: "unit",
              header: "الوحدة",
              width: "50px",
              className: "whitespace-nowrap!",
              render: (row) => row.unit?.value || "-",
              filterable: true,
            },
            {
              key: "cost",
              header: "فئة البند (الشركة)",
              width: "100px",
              className: "whitespace-nowrap!",
              render: (row) => formatProjectCost(row.cost),
              showTotal: true,
            },
            {
              key: "costAfterRate",
              header: "فئة البند (طبقا للتحليل و شاملة النسبة)",
              width: "150px",
              className: "whitespace-normal!",
              render: (row) => (
                <span className="font-semibold">
                  {formatProjectCost(row.costAfterRate)}
                </span>
              ),
              showTotal: true,
            },
            {
              key: "note",
              header: "ملاحظات",
              width: "100px",
              className: "whitespace-normal! wrap-break-word! overflow-hidden",
              truncateWords: 4,
              render: (row) => row.note || "-",
            },
            {
              key: "estimateQuantity",
              header: "الكمية",
              width: "100px",
              className: "whitespace-nowrap!",
              render: (row) => (
                <div className="flex">
                  <span>
                    {row.estimateQuantity ?? 1}
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedQuantityItem(row);
                      setQuantityModalOpen(true);
                    }}
                    className="block mx-auto w-fit bg-orange-500 px-2 py-1 text-xs text-white transition hover:bg-orange-600"
                  >
                    تعديل الكمية
                  </button>
                </div>
              ),
              showTotal: true,
            },
            {
              key: "estimateTotal",
              header: "الإجمالي",
              width: "110px",
              className: "whitespace-nowrap!",
              render: (row) => (
                <span className="font-semibold text-orange-700">
                  {formatProjectCost(row.estimateTotal)}
                </span>
              ),
              showTotal: true,
            },
            {
              key: "analysis",
              header: "تحليل",
              width: "100px",
              className: "whitespace-nowrap!",
              // Opened in edit mode with this estimate, so the analysis page
              // loads any existing analysis and offers "this item only" vs
              // "general" saving.
              render: (row) => (
                <div className="flex flex-col items-center gap-1">
                  {row.isAnalyzed && (
                    <div className="bg-green-100 text-green-600 px-3 py-1 text-xs w-fit">
                      تم التحليل
                    </div>
                  )}
                  <Link
                    href={`/items/${row.id}/analyze?mode=edit&estimateId=${id}`}
                    onClick={(e) => e.stopPropagation()}
                    className={`${
                      row.isAnalyzed
                        ? "border border-orange-500 text-orange-600 hover:bg-orange-50"
                        : "bg-orange-500 text-white hover:bg-orange-600"
                    } px-3 py-1 text-xs transition block w-fit`}
                  >
                    {row.isAnalyzed ? "تعديل التحليل" : "تحليل البند"}
                  </Link>
                </div>
              ),
            },
            {
              key: "actions",
              header: "حذف",
              width: "1%",
              className: "whitespace-nowrap!",
              printable: false,
              render: (row) => (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleRemoveItem(row.id);
                  }}
                  className="mx-auto flex h-9 w-9 items-center justify-center border border-red-100 bg-red-50 text-red-600 transition hover:bg-red-100"
                  aria-label="حذف البند من المقايسة"
                >
                  <Trash2 size={17} />
                </button>
              ),
            },
          ]}
        />
      </div>

      {/* ================= HEADER ================= */}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-700">
          البنود
          {hasItems && (
            <span className="text-sm text-gray-400 ml-2">
              ({estimateD?.items.length})
            </span>
          )}
        </h2>
        <div className="flex items-center gap-3">
          {hasItems && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleRemoveAllItems}
                className="flex items-center h-12 gap-2 border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
              >
                <Trash2 size={16} />
                حذف كل البنود
              </button>
            </div>
          )}
          <Button
            text={hasItems ? "إضافة بنود" : "ابدأ بإضافة بنود"}
            onClick={() => setOpenSelector(true)}
          />
        </div>
      </div>

      {/* ================= SELECTOR ================= */}
      {openSelector && (
        <>
          <div className="space-y-4">
            <ChooseItems
              currentItems={estimateD?.items ?? []}
              selectedItems={selected}
              setSelectedItems={setSelected}
              onToggle={toggle}
              selectedQuantities={selectedQuantities}
              onQuantityChange={changeSelectedItemQuantity}
              estimateId={Number(id)}
            />
          </div>
          {/* ================= ACTION BAR ================= */}
          <div className="flex items-center justify-between bg-white p-4 shadow border border-gray-300">
            <p className="text-sm text-gray-500">
              تم اختيار <b>{newSelectedItemsCount}</b> بند جديد
            </p>

            <div className="flex gap-3">
              <Button
                text="إلغاء"
                onClick={() => {
                  setOpenSelector(false);
                  setSelectedQuantities({});
                }}
              />

              <Button
                text="حفظ الاختيارات"
                onClick={handleAdd}
                disabled={newSelectedItemsCount === 0}
                loading={addingItems}
              />
            </div>
          </div>
        </>
      )}

      {/* ================= ITEMS TABLE ================= */}
      {false && hasItems && (
        <div className="border border-gray-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-4">
            <Input
              name="search"
              type="text"
              value={itemFilters.search}
              placeholder="بحث باسم البند"
              onChange={(event) =>
                setItemFilters((prev) => ({
                  ...prev,
                  search: event.target.value,
                }))
              }
            />
            <Dropdown
              placeholder="اختر التصنيف العام"
              options={categoryOptions}
              selected={itemFilters.category}
              onSelect={(option) =>
                setItemFilters((prev) => ({
                  ...prev,
                  category: option.value,
                  subCategory: "",
                }))
              }
            />
            <Dropdown
              placeholder="اختر التصنيف الفرعي"
              options={subCategoryOptions}
              selected={itemFilters.subCategory}
              onSelect={(option) =>
                setItemFilters((prev) => ({
                  ...prev,
                  subCategory: option.value,
                }))
              }
            />
            <Dropdown
              placeholder="فلتر حالة التحليل"
              options={[
                { value: "", label: "كل حالات التحليل" },
                { value: "analyzed", label: "تم التحليل" },
                { value: "not-analyzed", label: "لم يتم التحليل" },
              ]}
              selected={selectedAnalysisStatus.value}
              onSelect={setSelectedAnalysisStatus}
            />
          </div>
        </div>
      )}



      <EditEstimateQuantityModal
        itemId={selectedQuantityItem?.id ?? 0}
        estimate={estimateD}
        isOpen={quantityModalOpen}
        quantity={selectedQuantityItem?.estimateQuantity ?? 1}
        itemName={selectedQuantityItem?.name ?? ""}
        onSave={(quantity) => {
          if (!selectedQuantityItem) return;

          setItemQuantities((prev) => {
            const exists = prev.some(
              (item) => item.itemId === selectedQuantityItem.id
            );

            if (exists) {
              return prev.map((item) =>
                item.itemId === selectedQuantityItem.id
                  ? { ...item, quantity }
                  : item
              );
            }

            return [
              ...prev,
              {
                itemId: selectedQuantityItem.id,
                quantity,
              },
            ];
          });
        }}
        onClose={() => {
          setQuantityModalOpen(false);
          setSelectedQuantityItem(null);
        }}
      />

    </div>
  );
}

/* reusable */
function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 p-3 border border-gray-200">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-medium text-gray-800">{value}</p>
    </div>
  );
}
