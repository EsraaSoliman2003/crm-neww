"use client";

import { useState } from "react";
import { Check, Loader2, Pencil, X } from "lucide-react";
import { toast } from "sonner";
import axios from "@/lib/axios";

/** "الكمية" in the estimates table: the value with an inline edit, no page change. */
export default function EstimateQuantityCell({
  estimateId,
  quantity,
  onSavedAction,
}: {
  estimateId: number;
  quantity: number;
  onSavedAction: (quantity: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(quantity ?? 0));
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const next = Number(value);
    if (!Number.isFinite(next) || next < 0) {
      toast.error("الكمية يجب أن تكون رقمًا لا يقل عن صفر");
      return;
    }
    try {
      setSaving(true);
      const res = await axios.put<{ quantity: number }>(`Estimate/${estimateId}/quantity`, { quantity: next });
      onSavedAction(res.data.quantity);
      toast.success("تم تعديل الكمية");
      setEditing(false);
    } catch (error) {
      console.log(error);
    } finally {
      setSaving(false);
    }
  };

  // clicks inside the cell must not open the estimate (row click)
  const stop = (e: React.MouseEvent) => e.stopPropagation();

  if (!editing) {
    return (
      <div className="flex items-center justify-center gap-2" onClick={stop}>
        <span className="tabular-nums">
          {Number(quantity ?? 0).toLocaleString("en-US", { maximumFractionDigits: 3 })}
        </span>
        <button
          type="button"
          title="تعديل الكمية"
          onClick={() => {
            setValue(String(quantity ?? 0));
            setEditing(true);
          }}
          className="text-green-600 hover:text-green-700"
        >
          <Pencil size={15} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-1" onClick={stop}>
      <input
        type="number"
        min={0}
        step="any"
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") void save();
          if (e.key === "Escape") setEditing(false);
        }}
        className="w-20 border border-gray-300 px-1.5 py-0.5 text-right text-sm focus:outline-none focus:ring-2 focus:ring-green-200"
      />
      <button type="button" title="حفظ" onClick={save} disabled={saving} className="text-green-600 hover:text-green-700 disabled:opacity-50">
        {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
      </button>
      <button type="button" title="إلغاء" onClick={() => setEditing(false)} disabled={saving} className="text-gray-500 hover:text-red-600">
        <X size={15} />
      </button>
    </div>
  );
}
