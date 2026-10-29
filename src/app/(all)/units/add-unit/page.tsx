"use client";

import Button from "@/components/button/Button";
import Input from "@/components/form/Input";
import { useAppDispatch, useAppSelector } from "@/rtk/hooks";
import { createUnit } from "@/rtk/slices/unitsSlice";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function Page() {
    const dispatch = useAppDispatch();
    const { creating } = useAppSelector((s) => s.units);
    const router = useRouter();

    const [name, setName] = useState("");
    const [error, setError] = useState("");

    /* ===================== */
    const validate = () => {
        if (!name.trim()) {
            setError("القيمة مطلوبه");
            return false;
        }

        setError("");
        return true;
    };

    /* ===================== */
    const handleSave = async () => {
        if (!validate()) return;

        try {
            await dispatch(
                createUnit(name)
            ).unwrap();

            toast.success("تم إضافة القيمة بنجاح");

            setName("");
            setError("");

            router.push("/units");
        } catch (error) {
            console.log(error);
        }
    };

    return (
        <div className="min-h-screen mt-10">
            <div className="bg-white border border-gray-300 shadow p-6 space-y-8 h-125">

                {/* Name */}
                <div>
                    <Input
                        label="القيمة"
                        name="name"
                        value={name}
                        placeholder="ادخل القيمة"
                        onChange={(e) => setName(e.target.value)}
                    />

                    {error && (
                        <p className="text-red-500 text-sm mt-1">{error}</p>
                    )}
                </div>

            </div>

            {/* Button */}
            <div className="mt-6 flex justify-end">
                <Button
                    text="+ اضافة الوحده"
                    onClick={handleSave}
                    loading={creating}
                />
            </div>
        </div>
    );
}