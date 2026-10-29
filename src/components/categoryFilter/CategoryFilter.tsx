"use client";

import Input from "@/components/form/Input";
import Dropdown from "@/components/dropdown/DropDown";
import { RotateCcw, SlidersHorizontal } from "lucide-react";

type Option = {
  value: string;
  label: string;
};

type Category = {
  categoryId: number;
  categoryName: string;

  subCategories: {
    subCategoryId: number;
    subCategoryName: string;
  }[];
};

type Props = {
  search: string;
  setSearchAction: (value: string) => void;

  selectedCategory: Option;
  setSelectedCategoryAction: (value: Option) => void;

  selectedSubCategory: Option;
  setSelectedSubCategoryAction: (value: Option) => void;

  categories: Category[];

  searchPlaceholder?: string;

  supPlaceHolder?: string;
  catPlaceHolder?: string;
};

export default function CategoryFilter({
  search,
  setSearchAction,

  selectedCategory,
  setSelectedCategoryAction,

  selectedSubCategory,
  setSelectedSubCategoryAction,

  categories,

  searchPlaceholder = "بحث...",

  supPlaceHolder,
  catPlaceHolder,
}: Props) {
  const selectedCategoryData = categories.find(
    (cat) => String(cat.categoryId) === selectedCategory.value,
  );

  const subCategories = selectedCategoryData?.subCategories ?? [];

  const handleReset = () => {
    setSearchAction("");

    setSelectedCategoryAction({
      value: "",
      label: "",
    });

    setSelectedSubCategoryAction({
      value: "",
      label: "",
    });
  };

  return (
    <div className="rounded-2xl border border-orange-100 bg-white/85 p-4 shadow-sm backdrop-blur md:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-700">
            <SlidersHorizontal size={19} />
          </span>
          <div>
            <h2 className="font-black text-gray-900">تصفية النتائج</h2>
            <p className="mt-0.5 text-xs font-semibold text-gray-400">
              ابحث وحدد التصنيف للوصول إلى النتائج بسرعة
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-bold text-gray-600 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700"
        >
          <RotateCcw size={16} />
          مسح الفلاتر
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Input
          name="search"
          type="text"
          value={search}
          placeholder={searchPlaceholder}
          onChange={(e) => setSearchAction(e.target.value)}
          className="rounded-xl border-gray-200 bg-gray-50/70"
        />

        <Dropdown
          placeholder={catPlaceHolder}
          options={categories.map((s) => ({
            value: String(s.categoryId),
            label: s.categoryName,
          }))}
          selected={selectedCategory.value}
          onSelect={(opt) => {
            setSelectedCategoryAction(opt);
            setSelectedSubCategoryAction({ value: "", label: "" });
          }}
        />

        <Dropdown
          placeholder={supPlaceHolder}
          options={subCategories.map((s) => ({
            value: String(s.subCategoryId),
            label: s.subCategoryName,
          }))}
          selected={selectedSubCategory.value}
          onSelect={(opt) => setSelectedSubCategoryAction(opt)}
        />
      </div>
    </div>
  );
}
