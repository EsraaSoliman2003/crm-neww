import Input from '@/components/form/Input';
import Select from '@/components/form/Select';
import Loader from '@/components/loader/Loader';
import { Material, Supplier } from '@/utils/dtos';
import React, { useState } from 'react'
import { Item as categoriesForm } from "@/rtk/slices/subCategoriesSlice";

type FormType = {
    materialIds: number[];
    supplierIds: number[];
};

type FormKey = keyof FormType;

type SearchType = {
    materials: string;
    suppliers: string;
};

type SearchKey = keyof SearchType;

type SectionProps = {
    title: string;
    data: Material[] | Supplier[];
    loading: boolean;
    searchKey: SearchKey;
    formKey: FormKey;
    form: FormType;
    search: SearchType;
    setSearch: React.Dispatch<React.SetStateAction<SearchType>>;
    toggleAll: (key: FormKey, ids: number[]) => void;
    toggleItem: (id: number, key: FormKey) => void;
    categoryData: categoriesForm[];
    categoryDataLoading: boolean;
};

export default function Section({
    title,
    data,
    loading,
    searchKey,
    formKey,
    form,
    search,
    setSearch,
    toggleAll,
    toggleItem,
    categoryData,
    categoryDataLoading
}: SectionProps) {

    const [mainCategory, setMainCategory] = useState("");
    const [subCategory, setSubCategory] = useState("");

    const selectedCategory = categoryData.find(
        (cat) => String(cat.categoryName) === mainCategory
    );

    const subCategories = selectedCategory?.subCategories ?? [];

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;

        if (name === "mainCategory") {
            setMainCategory(value);
            setSubCategory(""); // reset sub
        } else if (name === "subCategory") {
            setSubCategory(value);
        }
    };

    /* ================= FILTER ================= */

    const filteredData = data.filter((m: Material | Supplier) => {
        const searchValue = search[searchKey]?.toLowerCase() || "";

        const matchesSearch =
            m.name?.toLowerCase().includes(searchValue);

        const matchesMainCategory =
            !mainCategory || String(m.categoryName) === mainCategory;

        const matchesSubCategory =
            !subCategory || String(m.subCategoryName) === subCategory;

        return matchesSearch && matchesMainCategory && matchesSubCategory;
    });

    return (
        <div className="p-6 shadow border border-gray-200 bg-white flex flex-col">

            {/* Header */}
            <div className="flex justify-between items-center mb-5">
                <h3 className="font-semibold text-gray-800 text-lg">
                    {title}
                </h3>

                {filteredData.length > 0 && (
                    <button
                        onClick={() => toggleAll(formKey, filteredData.map((i) => i.id))}
                        className={`
                    px-4 py-1.5 text-xs font-medium transition-all duration-200
                    ${form[formKey].length === filteredData.length
                                ? "bg-red-50 text-red-600 hover:bg-red-100"
                                : "bg-blue-50 text-blue-600 hover:bg-blue-100"}
                `}
                    >
                        {form[formKey].length === filteredData.length ? "إلغاء الكل" : "تحديد الكل"}
                    </button>
                )}
            </div>

            {/* Search */}
            <div className="mb-5">
                <Input
                    name=""
                    label="بحث"
                    type="text"
                    placeholder={`بحث في ${title}...`}
                    value={search[searchKey]}
                    onChange={(e) =>
                        setSearch((prev) => ({
                            ...prev,
                            [searchKey]: e.target.value,
                        }))
                    }
                    className="h-11! text-sm"
                />
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                <Select
                    label="التصنيف العام"
                    name="mainCategory"
                    value={mainCategory}
                    options={[
                        { value: "", label: "الكل" },
                        ...categoryData.map((cat) => ({
                            value: String(cat.categoryName),
                            label: cat.categoryName,
                        }))
                    ]}
                    onChange={handleChange}
                    loading={categoryDataLoading}
                    className="h-11! text-sm"
                />

                <Select
                    label="التصنيف الفرعي"
                    name="subCategory"
                    value={subCategory}
                    options={[
                        { value: "", label: "الكل" },
                        ...subCategories.map((sub) => ({
                            value: String(sub.subCategoryName),
                            label: sub.subCategoryName,
                        }))
                    ]}
                    onChange={handleChange}
                    disabled={!mainCategory}
                    loading={categoryDataLoading}
                    className="h-11! text-sm"
                />
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100 mb-4"></div>

            {/* List */}
            {loading ? (
                <Loader />
            ) : (
                <div className="space-y-2 max-h-87.5 overflow-y-auto pr-1">

                    {filteredData.map((item) => {
                        const checked = form[formKey].includes(item.id);

                        return (
                            <label
                                key={item.id}
                                className={`
                            flex items-center justify-between px-4 py-3 cursor-pointer
                            border transition-all duration-200 group
                            ${checked
                                        ? "bg-blue-50 border-blue-500 shadow-sm"
                                        : "bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50"}
                        `}
                            >
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => toggleItem(item.id, formKey)}
                                        className="accent-blue-600 w-4 h-4"
                                    />

                                    <span className="text-sm text-gray-700 group-hover:text-gray-900 transition">
                                        {item.name}
                                    </span>
                                </div>

                                {checked && (
                                    <span className="text-blue-500 text-xs font-semibold">
                                        ✓
                                    </span>
                                )}
                            </label>
                        );
                    })}

                    {!filteredData.length && (
                        <div className="flex flex-col items-center justify-center py-10 text-gray-400 text-sm">
                            لا يوجد نتائج
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};