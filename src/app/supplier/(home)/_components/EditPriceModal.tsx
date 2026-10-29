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
};

export default function EditPriceModal({ open, onCloseAction, item }: Props) {
    const { user } = useAuth();
    const dispatch = useAppDispatch();

    const { settingPrice } = useAppSelector(
        (s) => s.materialsWithSuppliers
    );

    const [price, setPrice] = useState<number | "">("");
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

        setError("");
        return true;
    };

    /* ===========================
       Submit
    =========================== */
    const handleSubmit = async () => {
        if (!validate()) return;
        if (!user?.id) {
            toast.error("المستخدم غير موجود");
            return;
        }

        try {
            await dispatch(
                setSupplierPrice({
                    supplierId: Number(user.id),
                    materialId: item?.materialId || 0,
                    price: Number(price),
                    isAll: Boolean(!item),
                })
            ).unwrap();

            toast.success("تم تعديل السعر بنجاح");

            setError("");
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
                    {item ? "تعديل السعر" : "تعديل السعر للكل"}
                </h2>

                {/* Input */}
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
                        text={settingPrice ? "جاري الحفظ..." : "حفظ"}
                        onClick={handleSubmit}
                        disabled={settingPrice}
                    />
                </div>
            </div>
        </div>
    );
}