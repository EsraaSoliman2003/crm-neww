"use client";

import Button from "@/components/button/Button";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useAppDispatch, useAppSelector } from "@/rtk/hooks";
import { toast } from "sonner";
import { setSupplierPrice, SupplierMaterialBySupplier } from "@/rtk/slices/supplierMaterialSlice";

type Props = {
    open: boolean;
    onCloseAction: () => void;
    item?: SupplierMaterialBySupplier;
    onSavedAction?: () => void;
};

// yyyy-mm-dd of a date, for <input type="date">
const toDateInput = (date: Date) => {
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 10);
};

/**
 * The supplier sends a new price with its valid-until date. Both go to the
 * admin for approval; the approved price stays in use until then.
 */
export default function EditPriceModal({ open, onCloseAction, item, onSavedAction }: Props) {
    const { user } = useAuth();
    const dispatch = useAppDispatch();

    const { settingPrice } = useAppSelector(
        (s) => s.materialsWithSuppliers
    );

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const minDate = toDateInput(tomorrow);

    const [price, setPrice] = useState<number | "">(item?.pendingPrice || item?.price || "");
    const [validUntil, setValidUntil] = useState("");
    const [error, setError] = useState("");

    /* ===========================
       Lock body scroll
    =========================== */
    useEffect(() => {
        if (open) document.body.style.overflow = "hidden";
        else document.body.style.overflow = "auto";

        return () => {
            document.body.style.overflow = "auto";
        };
    }, [open]);

    /* ===========================
       Validation
    =========================== */
    const validate = () => {
        if (price === "" || Number(price) <= 0) {
            setError("السعر مطلوب ويجب أن يكون أكبر من 0");
            return false;
        }
        if (!validUntil) {
            setError("حدد تاريخ صلاحية السعر (صالح حتى)");
            return false;
        }
        if (validUntil < minDate) {
            setError("تاريخ \"صالح حتى\" يجب أن يكون بعد اليوم");
            return false;
        }

        setError("");
        return true;
    };

    /* ===========================
       Submit
    =========================== */
    const handleSubmit = async () => {
        if (!validate()) return;
        if (!user?.id || !item) {
            toast.error("المستخدم غير موجود");
            return;
        }

        try {
            const result = await dispatch(
                setSupplierPrice({
                    supplierId: Number(user.id),
                    materialId: item.materialId,
                    price: Number(price),
                    validUntil,
                })
            ).unwrap();

            toast.success(result.message);

            setError("");
            onSavedAction?.();
            onCloseAction();
        } catch (error) {
            console.log(error)
        }
    };

    if (!open) return null;

    return (
        <div
            onClick={onCloseAction}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="bg-white p-6 w-full max-w-md space-y-4 shadow-xl"
            >
                {/* Title */}
                <h2 className="text-lg font-bold text-right">
                    رفع سعر: {item?.materialName}
                </h2>

                {/* Price */}
                <label className="block space-y-1 text-right">
                    <span className="text-sm font-semibold text-gray-700">السعر الجديد</span>
                    <input
                        type="number"
                        value={price}
                        onChange={(e) => {
                            const val = e.target.value;
                            setPrice(val === "" ? "" : Number(val));
                        }}
                        className="w-full border border-gray-200 p-2 text-right focus:outline-none focus:ring-2 focus:ring-blue-200"
                        placeholder="ادخل السعر الجديد"
                    />
                </label>

                {/* Valid until */}
                <label className="block space-y-1 text-right">
                    <span className="text-sm font-semibold text-gray-700">صالح حتى</span>
                    <input
                        type="date"
                        min={minDate}
                        value={validUntil}
                        onChange={(e) => setValidUntil(e.target.value)}
                        className="w-full border border-gray-200 p-2 text-right focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                </label>

                <p className="text-xs text-gray-500 text-right">
                    السعر الجديد وتاريخه يظهران بعد موافقة الإدارة، ويظل السعر الحالي معتمدًا حتى ذلك الحين.
                </p>

                {/* Error */}
                {error && (
                    <p className="text-red-500 text-sm text-right">
                        {error}
                    </p>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4">
                    <button
                        onClick={onCloseAction}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 transition-all"
                    >
                        إلغاء
                    </button>

                    <Button
                        text={settingPrice ? "جاري الإرسال..." : "إرسال للمراجعة"}
                        onClick={handleSubmit}
                        disabled={settingPrice}
                    />
                </div>
            </div>
        </div>
    );
}
