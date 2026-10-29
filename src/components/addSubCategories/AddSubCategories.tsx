"use client"
import { useAppDispatch, useAppSelector } from '@/rtk/hooks'
import React, { useEffect, useState } from 'react'
import Select from '../form/Select'
import Input from '../form/Input'
import Button from '../button/Button'
import { useRouter } from 'next/navigation'
import { assignSubCategory } from '@/rtk/slices/subCategoriesSlice'
import { fetchCategories } from '@/rtk/slices/categoriesSlice'
import { toast } from 'sonner'

type Props = {
    entityTypeId: number;
    route: string;
}

export default function AddSubCategories({ entityTypeId, route }: Props) {
    const dispatch = useAppDispatch();
    const { data, loading } = useAppSelector((s) => s.categories)
    const { creating } = useAppSelector((s) => s.subCategories)
    const router = useRouter();

    useEffect(() => {
        dispatch(fetchCategories());
    }, [dispatch])

    const [form, setForm] = useState({
        name: "",
        categoryId: data[0]?.id,
    });

    useEffect(() => {
        const load = async () => {
            const res = await dispatch(fetchCategories()).unwrap();

            setForm((prev) => ({
                ...prev,
                categoryId: res?.[0]?.id || 0,
            }));
        };

        load();
    }, [dispatch]);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: name ==="categoryId" ? Number(value) : value,
        }));
    };

    const handleSave = async () => {
        try {
            await dispatch(
                assignSubCategory({
                    entityTypeId: entityTypeId,
                    categoryId: form.categoryId,
                    subCategoryName: form.name,
                })
            ).unwrap();

            toast.success("تم إضافة التصنيف الفرعى بنجاح");

            setForm({
                name: "",
                categoryId: 0,
            });

            router.push(route);
        } catch (error) {
            console.log(error);
            toast.error("حدث خطأ أثناء التنفيذ");
        }
    };
    return (
        <div className="min-h-screen">
            <div className="bg-white rounded-2xl shadow p-6 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Select
                        label="التصنيف العام"
                        name="categoryId"
                        value={form.categoryId ? String(form.categoryId) :""}
                        options={data.map((cat) => ({
                            value: String(cat.id),
                            label: cat.name,
                        }))}
                        onChange={handleChange}
                        loading={loading}
                    />
                    <Input
                        label="اسم التصنيف"
                        name="name"
                        value={form.name}
                        placeholder="ادخل الاسم"
                        onChange={handleChange}
                    />
                </div>

            </div>

            {/* Button */}
            <div className="mt-6 flex justify-end">
                <Button text="+ اضافة تصنيف" onClick={handleSave} loading={creating} />
            </div>
        </div>
    )
}