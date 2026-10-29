"use client";

import React, { useEffect, useState } from "react";
import Button from "@/components/button/Button";
import { useAppDispatch, useAppSelector } from "@/rtk/hooks";
import { fetchMaterials } from "@/rtk/slices/materialsSlice";
import { fetchSuppliers } from "@/rtk/slices/suppliersSlice";
import { assignMaterialToDisplay } from "@/rtk/slices/supplierMaterialSlice";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { MaterialsNumber, SuppliersNumber } from "@/constants/constantsNumbers";
import { fetchSubCategories as fetchMainSubCategories } from "@/rtk/slices/subCategoriesSlice";
import { fetchAnotherSubCategories as fetchAnotherSubCategories } from "@/rtk/slices/anotherSubCategories";
import Section from "./_components/Section";

type FormType = {
    materialIds: number[];
    supplierIds: number[];
};

type FormKey = keyof FormType;

type SearchType = {
    materials: string;
    suppliers: string;
};

/* ================= MAIN ================= */

export default function AddMaterialsToSuppliers() {
    const dispatch = useAppDispatch();
    const router = useRouter();

    const { data: materials, loading: materialsLoading } = useAppSelector((s) => s.materials);
    const { data: suppliers, loading: suppliersLoading } = useAppSelector((s) => s.suppliers);
    const { assigning } = useAppSelector((s) => s.materialsWithSuppliers);

    const { data: materialsCategoriesWithSub, loading: materialsCategoriesWithSubLoading } =
        useAppSelector((s) => s.subCategories);

    const { data: suppliersCategoriesWithSub, loading: suppliersCategoriesWithSubLoading } =
        useAppSelector((s) => s.anotherSubCategories);

    const [form, setForm] = useState<FormType>({
        materialIds: [],
        supplierIds: [],
    });

    const [search, setSearch] = useState<SearchType>({
        materials: "",
        suppliers: "",
    });

    useEffect(() => {
        dispatch(fetchMaterials());
        dispatch(fetchSuppliers());
        dispatch(fetchMainSubCategories(MaterialsNumber));
        dispatch(fetchAnotherSubCategories(SuppliersNumber));
    }, [dispatch]);

    const toggleItem = (id: number, key: FormKey) => {
        setForm((prev) => {
            const exists = prev[key].includes(id);
            return {
                ...prev,
                [key]: exists
                    ? prev[key].filter((i) => i !== id)
                    : [...prev[key], id],
            };
        });
    };

    const toggleAll = (key: FormKey, ids: number[]) => {
        setForm((prev) => {
            const isAllSelected = prev[key].length === ids.length;
            return {
                ...prev,
                [key]: isAllSelected ? [] : ids,
            };
        });
    };

    const handleSubmit = async () => {
        try {
            await dispatch(
                assignMaterialToDisplay({
                    materialIds: form.materialIds,
                    supplierIds: form.supplierIds,
                })
            ).unwrap();

            toast.success("تم الحفظ بنجاح");
            router.push("/material");

        } catch (err) {
            console.log(err);
        }
    };

    return (
        <div className="flex justify-center">

            <div className="w-full space-y-8">

                {/* Header */}
                <div className="flex justify-between items-center pb-4">
                    <h2 className="text-2xl font-bold text-gray-800">
                        اضافة خامات للموردين
                    </h2>
                </div>

                {/* SIDE BY SIDE */}
                <div className="grid md:grid-cols-2 gap-6">
                    <Section
                        title="الخامات"
                        data={materials}
                        loading={materialsLoading}
                        searchKey="materials"
                        formKey="materialIds"
                        form={form}
                        search={search}
                        setSearch={setSearch}
                        toggleAll={toggleAll}
                        toggleItem={toggleItem}
                        categoryData={materialsCategoriesWithSub}
                        categoryDataLoading={materialsCategoriesWithSubLoading}
                    />

                    <Section
                        title="الموردين"
                        data={suppliers}
                        loading={suppliersLoading}
                        searchKey="suppliers"
                        formKey="supplierIds"
                        form={form}
                        search={search}
                        setSearch={setSearch}
                        toggleAll={toggleAll}
                        toggleItem={toggleItem}
                        categoryData={suppliersCategoriesWithSub}
                        categoryDataLoading={suppliersCategoriesWithSubLoading}
                    />
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end mt-8">

                    <Button
                        text={assigning ? "جاري الحفظ..." : "حفظ البيانات"}
                        onClick={handleSubmit}
                        disabled={assigning}
                    />
                </div>
            </div>
        </div>
    );
}