import type { SupplierMaterialBySupplier } from "@/rtk/slices/supplierMaterialSlice";

// Approved price / valid-until, plus the supplier's request waiting for the admin.
// Used on the supplier's "خاماتي" and the admin supplier page "خاماته".

export const formatDate = (date?: string | null) =>
  date
    ? new Date(date).toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" })
    : "-";

const money = (value?: number | null) =>
  value == null ? "-" : `${Number(value).toLocaleString("en-US", { maximumFractionDigits: 2 })} جنيه`;

/** Never-approved row: its price/date are themselves the request. */
const isFirstRequest = (row: SupplierMaterialBySupplier) => row.isApproved === false;

const PendingBadge = () => (
  <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[11px] font-semibold text-amber-700">
    في انتظار الموافقة
  </span>
);

export function SupplierPriceCell({ row }: { row: SupplierMaterialBySupplier }) {
  if (isFirstRequest(row)) {
    return (
      <div className="flex flex-col items-center gap-1">
        <span className="font-medium text-gray-800">{money(row.price)}</span>
        <PendingBadge />
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="font-medium text-gray-800">{money(row.price)}</span>
      {row.pendingPrice != null && (
        <span className="text-[11px] text-amber-700">
          جديد: {money(row.pendingPrice)} <PendingBadge />
        </span>
      )}
    </div>
  );
}

export function SupplierValidUntilCell({ row }: { row: SupplierMaterialBySupplier }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span>{formatDate(row.validUntil)}</span>
      {!isFirstRequest(row) && row.pendingPrice != null && (
        <span className="text-[11px] text-amber-700">جديد: {formatDate(row.pendingValidUntil)}</span>
      )}
    </div>
  );
}
