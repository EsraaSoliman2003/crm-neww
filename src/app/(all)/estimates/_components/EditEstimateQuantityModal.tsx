"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Estimate } from "@/lib/dtos";
import { saveEstimateItemQuantities } from "@/utils/estimateItemQuantities";
import { toast } from "sonner";

type Props = {
    estimate: Estimate | undefined;
    isOpen: boolean;
    itemId: number;
    quantity: number;
    itemName: string;
    onSave: (quantity: number) => void;
    onClose: () => void;
};

export default function EditEstimateQuantityModal({
    estimate,
    isOpen,
    itemId,
    quantity,
    itemName,
    onSave,
    onClose,
}: Props) {
    const [value, setValue] = useState(String(quantity));
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setValue(String(quantity));
        }
    }, [isOpen, quantity]);

    if (!isOpen) return null;

    const handleSave = () => {
        const parsedQuantity = Number(value);

        if (
            !value.trim() ||
            !Number.isFinite(parsedQuantity) ||
            parsedQuantity <= 0
        ) {
            toast.error("أدخل كمية صحيحة");
            return;
        }

        if (!estimate?.id || !itemId) {
            toast.error("بيانات المقايسة أو البند غير مكتملة");
            return;
        }

        try {
            setSaving(true);

            saveEstimateItemQuantities(estimate.id, [
                {
                    itemId,
                    quantity: parsedQuantity,
                },
            ]);

            onSave(parsedQuantity);

            toast.success("تم تعديل الكمية بنجاح");
            onClose();
        } catch (error) {
            console.error(error);
            toast.error("تعذر تعديل الكمية");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={onClose}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="edit-quantity-title"
                className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="mb-5 flex items-center justify-between">
                    <h2
                        id="edit-quantity-title"
                        className="text-lg font-semibold text-gray-900"
                    >
                        تعديل الكمية
                    </h2>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="إغلاق"
                        className="rounded-lg p-1 text-gray-500 transition hover:bg-gray-100"
                    >
                        <X size={20} />
                    </button>
                </div>

                <p className="mb-4 text-sm leading-6 text-gray-600">
                    {itemName}
                </p>

                <label
                    htmlFor="estimate-quantity"
                    className="mb-2 block text-sm font-medium text-gray-700"
                >
                    الكمية
                </label>

                <input
                    id="estimate-quantity"
                    type="number"
                    min="0.01"
                    step="any"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                    autoFocus
                />

                <div className="mt-6 flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                    >
                        إلغاء
                    </button>

                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={
                            saving ||
                            !value.trim() ||
                            !Number.isFinite(Number(value)) ||
                            Number(value) <= 0
                        }
                        className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {saving ? "جارٍ الحفظ..." : "حفظ التعديل"}
                    </button>
                </div>
            </div>
        </div>
    );
}