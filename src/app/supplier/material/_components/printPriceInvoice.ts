import { toast } from "sonner";
import { formatDateTime } from "@/lib/formatDateTime";
import type { SupplierMaterialBySupplier } from "@/rtk/slices/supplierMaterialSlice";

const escapeHtml = (value: unknown) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const statusOf = (row: SupplierMaterialBySupplier) =>
  row.isAdminPrice
    ? "سعر الإدارة"
    : row.isApproved
      ? "معتمد"
      : "في انتظار الموافقة";

const formatDate = (date?: string | null) =>
  date
    ? new Date(date).toLocaleDateString("ar-EG", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "-";

/**
 * Opens the print window right away (inside the click) so popup blockers allow it;
 * call the returned function once the prices are loaded.
 */
export function openPriceInvoiceWindow() {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    toast.error("تعذر فتح نافذة الطباعة، يرجى السماح بالنوافذ المنبثقة");
    return null;
  }
  printWindow.document.write(`<p dir="rtl" style="font-family:Arial">جاري تجهيز الفاتورة...</p>`);
  return printWindow;
}

/** Prints the supplier's current prices with the print date clearly shown. */
export function printPriceInvoice(
  printWindow: Window,
  supplierName: string,
  rows: SupplierMaterialBySupplier[],
) {
  printWindow.document.open();
  const printedAt = formatDateTime(new Date());
  const body = rows
    .map(
      (row, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${escapeHtml(row.materialName)}</td>
          <td>${escapeHtml(row.materialUnitValue || "-")}</td>
          <td>${escapeHtml(row.materialBrand || "-")}</td>
          <td>${escapeHtml(row.categoryName || "-")}${row.subCategoryName ? ` / ${escapeHtml(row.subCategoryName)}` : ""}</td>
          <td class="num">${Number(row.price).toLocaleString("en-US", { maximumFractionDigits: 2 })} جنيه</td>
          <td>${statusOf(row)}</td>
          <td>${formatDate(row.validUntil)}</td>
        </tr>`,
    )
    .join("");

  printWindow.document.write(`
    <!doctype html>
    <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8" />
        <title>${escapeHtml(`فاتورة أسعار - ${supplierName}`)}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
          .head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px;
                  border-bottom: 2px solid #bf0200; padding-bottom: 12px; margin-bottom: 18px; }
          h1 { margin: 0 0 6px; font-size: 24px; }
          .supplier { font-size: 16px; color: #374151; }
          .date { border: 1px solid #bf0200; color: #bf0200; padding: 8px 14px; font-weight: bold;
                  font-size: 15px; white-space: nowrap; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #d1d5db; padding: 8px; text-align: right; overflow-wrap: break-word; }
          th { background: #f3f4f6; }
          td.num { white-space: nowrap; }
          tr { break-inside: avoid; }
          thead { display: table-header-group; }
          .foot { margin-top: 14px; font-size: 13px; color: #4b5563; }
          @page { size: A4 landscape; margin: 12mm; }
        </style>
      </head>
      <body>
        <div class="head">
          <div>
            <h1>فاتورة أسعار الخامات</h1>
            <div class="supplier">المورد: ${escapeHtml(supplierName)}</div>
          </div>
          <div class="date">تاريخ الطباعة: ${escapeHtml(printedAt)}</div>
        </div>
        <table>
          <thead>
            <tr>
              <th>#</th><th>الخامة</th><th>الوحدة</th><th>المصدر / الماركة</th>
              <th>التصنيف</th><th>السعر</th><th>الحالة</th><th>صالح حتى</th>
            </tr>
          </thead>
          <tbody>${body || `<tr><td colspan="8" style="text-align:center">لا توجد أسعار</td></tr>`}</tbody>
        </table>
        <div class="foot">عدد الخامات: ${rows.length}</div>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}
