"use client";

import React, { useRef, useState } from "react";
import { Download, FileSpreadsheet, Upload } from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import instance from "@/lib/axios";
import { useAppDispatch, useAppSelector } from "@/rtk/hooks";
import { fetchUnits } from "@/rtk/slices/unitsSlice";
import { fetchSubCategories } from "@/rtk/slices/subCategoriesSlice";
import { MaterialsNumber } from "@/constants/constantsNumbers";

type ImportResult = {
  totalRows: number;
  importedRows: number;
  errors: { rowNumber: number; message: string }[];
  createdLookups?: string[];
};

// Column order matters: the API reads the first sheet by position (A..H).
// Unit, category and sub-category are plain text: an existing one is matched
// by name (spaces and letter case ignored), a new one is created.
const columns = [
  { header: "اسم الخامة", required: "مطلوب", type: "نص", rule: "غير مكرر في الملف ولا موجود مسبقًا في المنظومة", example: "أسمنت بورتلاندي" },
  { header: "السعر", required: "مطلوب", type: "رقم", rule: "أكبر من صفر، بدون كلمة جنيه أو فواصل", example: 3500 },
  { header: "الوحدة", required: "مطلوب", type: "نص", rule: "اكتب اسم الوحدة؛ لو موجودة تُستخدم ولو جديدة تُنشأ (راجع شيت الوحدات)", example: "طن" },
  { header: "التصنيف", required: "مطلوب", type: "نص", rule: "التصنيف العام؛ لو موجود يُستخدم ولو جديد يُنشأ (راجع شيت التصنيفات)", example: "مواد بناء" },
  { header: "التصنيف الفرعي", required: "اختياري", type: "نص", rule: "يتبع التصنيف العام في نفس الصف؛ لو غير موجود تحته يُنشأ", example: "أسمنت" },
  { header: "المصدر / الماركة", required: "اختياري", type: "نص", rule: "", example: "أسمنت السويس" },
  { header: "ملاحظات", required: "اختياري", type: "نص", rule: "", example: "شكارة 50 كجم" },
  { header: "صالح حتى", required: "اختياري", type: "تاريخ", rule: "بالصيغة yyyy-mm-dd أو خلية تاريخ، ويجب أن يكون بعد اليوم", example: "2026-12-31" },
];

const describe = (c: (typeof columns)[number]) =>
  [`${c.required} - ${c.type}`, c.rule, `مثال: ${c.example}`].filter(Boolean).join("\n");

export default function ImportMaterials({
  onImportedAction,
}: {
  onImportedAction?: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const dispatch = useAppDispatch();
  const { data: units } = useAppSelector((s) => s.units);
  const { data: categories } = useAppSelector((s) => s.subCategories);

  const handleDownloadTemplate = () => {
    // First sheet is the one that gets imported, so it only holds the headers
    // (an example row would be imported too). Each header carries a comment
    // with its format, shown when hovering the cell in Excel.
    const materialsSheet = XLSX.utils.aoa_to_sheet([
      columns.map((c) => c.header),
    ]);
    columns.forEach((c, i) => {
      const cell = materialsSheet[XLSX.utils.encode_cell({ r: 0, c: i })];
      cell.c = [{ a: "ConstrPricing", t: describe(c) }];
      cell.c.hidden = true;
    });
    materialsSheet["!cols"] = columns.map(() => ({ wch: 22 }));

    const instructionsSheet = XLSX.utils.aoa_to_sheet([
      ["طريقة ملء الملف"],
      ["املأ شيت (الخامات) فقط: صف لكل خامة بداية من الصف الثاني، ولا تغيّر ترتيب الأعمدة أو العناوين."],
      ["الوحدة والتصنيف والتصنيف الفرعي تُكتب نصًا: لو الاسم موجود يُستخدم، ولو جديد يُنشأ تلقائيًا (المسافات وحالة الأحرف لا تفرق)."],
      ["الأسعار المضافة تظهر بعد موافقة الإدارة."],
      [],
      ["العمود", "مطلوب؟", "نوع البيانات", "الشرط", "مثال"],
      ...columns.map((c) => [c.header, c.required, c.type, c.rule || "-", c.example]),
      [],
      ["أمثلة لصفوف صحيحة (للتوضيح فقط، لا تنسخها في هذا الشيت)"],
      columns.map((c) => c.header),
      ["أسمنت بورتلاندي", 3500, "طن", "مواد بناء", "أسمنت", "أسمنت السويس", "شكارة 50 كجم", "2026-12-31"],
      ["رمل مغسول", 250, "م3", "مواد بناء", "رمل", "", "", ""],
      ["رولات عزل بيتومين", 300, "رول", "عزل", "", "", "تصنيف جديد بدون تصنيف فرعي", ""],
    ]);
    instructionsSheet["!cols"] = [{ wch: 22 }, { wch: 12 }, { wch: 14 }, { wch: 55 }, { wch: 22 }, { wch: 18 }, { wch: 24 }, { wch: 14 }];

    const unitsSheet = XLSX.utils.aoa_to_sheet([
      ["الوحدات الموجودة حاليًا (يمكنك كتابة وحدة جديدة وسيتم إنشاؤها)"],
      ...units.map((u) => [u.value]),
    ]);
    unitsSheet["!cols"] = [{ wch: 55 }];

    const categoriesSheet = XLSX.utils.aoa_to_sheet([
      ["التصنيفات الموجودة حاليًا (يمكنك كتابة تصنيف أو تصنيف فرعي جديد وسيتم إنشاؤه)"],
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
      // new units / categories from the file show up in the form's dropdowns
      if (res.data.createdLookups?.length) {
        void dispatch(fetchUnits());
        void dispatch(fetchSubCategories(MaterialsNumber));
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
            <p className="text-xs text-gray-500">
              الوحدة والتصنيف والتصنيف الفرعي تُكتب نصًا: الموجود يُستخدم والجديد يُنشأ تلقائيًا.
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
          {(result.createdLookups?.length ?? 0) > 0 && (
            <div className="rounded border border-blue-200 bg-blue-50 p-3 text-blue-800">
              <p className="mb-1 font-semibold">تم إنشاء قيم جديدة:</p>
              <ul className="list-inside list-disc space-y-0.5">
                {result.createdLookups!.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}
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
