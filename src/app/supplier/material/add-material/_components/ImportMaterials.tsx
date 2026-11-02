"use client";

import React, { useRef, useState } from "react";
import { Download, FileSpreadsheet, Upload } from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import instance from "@/lib/axios";
import { useAppSelector } from "@/rtk/hooks";

type ImportResult = {
  totalRows: number;
  importedRows: number;
  errors: { rowNumber: number; message: string }[];
};

const columns = [
  { header: "اسم الخامة", condition: "مطلوب - غير مكرر", example: "أسمنت بورتلاندي" },
  { header: "السعر", condition: "مطلوب - رقم أكبر من صفر", example: 3500 },
  { header: "الوحدة", condition: "مطلوب - من قائمة الوحدات", example: "طن" },
  { header: "التصنيف", condition: "مطلوب - من قائمة التصنيفات", example: "مواد بناء" },
  { header: "التصنيف الفرعي", condition: "اختياري - تابع للتصنيف", example: "أسمنت" },
  { header: "المصدر / الماركة", condition: "اختياري", example: "أسمنت السويس" },
  { header: "ملاحظات", condition: "اختياري", example: "شكارة 50 كجم" },
  { header: "صالح حتى", condition: "اختياري - تاريخ بعد اليوم (yyyy-mm-dd)", example: "2026-12-31" },
];

export default function ImportMaterials({
  onImportedAction,
}: {
  onImportedAction?: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const { data: units } = useAppSelector((s) => s.units);
  const { data: categories } = useAppSelector((s) => s.subCategories);

  const handleDownloadTemplate = () => {
    // first sheet is the one that gets imported, so it only holds the headers
    const materialsSheet = XLSX.utils.aoa_to_sheet([
      columns.map((c) => c.header),
    ]);
    materialsSheet["!cols"] = columns.map(() => ({ wch: 22 }));

    const instructionsSheet = XLSX.utils.aoa_to_sheet([
      ["العمود", "الشرط", "مثال"],
      ...columns.map((c) => [c.header, c.condition, c.example]),
      [],
      ["ملاحظة: الأسعار المضافة تظهر بعد موافقة الإدارة"],
    ]);
    instructionsSheet["!cols"] = [{ wch: 20 }, { wch: 40 }, { wch: 22 }];

    const unitsSheet = XLSX.utils.aoa_to_sheet([
      ["الوحدات المتاحة"],
      ...units.map((u) => [u.value]),
    ]);
    unitsSheet["!cols"] = [{ wch: 25 }];

    const categoriesSheet = XLSX.utils.aoa_to_sheet([
      ["التصنيف", "التصنيف الفرعي"],
      ...categories.flatMap((cat) =>
        cat.subCategories.length
          ? cat.subCategories.map((sub) => [cat.categoryName, sub.subCategoryName])
          : [[cat.categoryName, ""]],
      ),
    ]);
    categoriesSheet["!cols"] = [{ wch: 25 }, { wch: 25 }];

    const workbook = XLSX.utils.book_new();
    workbook.Workbook = { Views: [{ RTL: true }] };
    XLSX.utils.book_append_sheet(workbook, materialsSheet, "الخامات");
    XLSX.utils.book_append_sheet(workbook, instructionsSheet, "تعليمات");
    XLSX.utils.book_append_sheet(workbook, unitsSheet, "الوحدات");
    XLSX.utils.book_append_sheet(workbook, categoriesSheet, "التصنيفات");
    XLSX.writeFile(workbook, "قالب_استيراد_الخامات.xlsx");
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const formData = new FormData();
    formData.append("excelFile", file);

    try {
      setImporting(true);
      setResult(null);
      const res = await instance.post<ImportResult>(
        "ExcelImport/supplier-materials",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      setResult(res.data);

      if (res.data.importedRows > 0) {
        toast.success(`تم إضافة ${res.data.importedRows} خامة بنجاح`);
        onImportedAction?.();
      } else {
        toast.error("لم يتم إضافة أي خامة، راجع الأخطاء");
      }
    } catch (error) {
      console.log(error);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-4 bg-white p-6 shadow">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="text-green-700" size={22} />
          <div>
            <h2 className="font-bold">إضافة عدة خامات من ملف Excel</h2>
            <p className="text-sm text-gray-500">
              حمّل القالب، املأه ثم ارفعه. الأسعار تظهر بعد موافقة الإدارة.
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xlsm"
            className="hidden"
            onChange={handleImport}
          />
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="flex items-center gap-1 rounded-md border border-blue-600 bg-white px-3 py-2 text-sm text-blue-700 transition hover:bg-blue-50"
          >
            <Download size={16} />
            تحميل Template
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="flex items-center gap-1 rounded-md border border-green-600 bg-green-600 px-3 py-2 text-sm text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Upload size={16} />
            {importing ? "جاري الاستيراد..." : "Import"}
          </button>
        </div>
      </div>

      {result && (
        <div className="space-y-2 border-t border-gray-100 pt-3 text-sm">
          <p className="font-semibold">
            تم إضافة {result.importedRows} من {result.totalRows} صف
          </p>
          {result.errors.length > 0 && (
            <ul className="max-h-60 space-y-1 overflow-auto rounded border border-red-200 bg-red-50 p-3 text-red-700">
              {result.errors.map((e) => (
                <li key={`${e.rowNumber}-${e.message}`}>
                  صف {e.rowNumber}: {e.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
