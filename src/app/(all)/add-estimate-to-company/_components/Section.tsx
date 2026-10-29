import Input from "@/components/form/Input";
import Loader from "@/components/loader/Loader";
import { Company, Estimate } from "@/utils/dtos";
import React from "react";


type FormType = {
  estimateIds: number[];
  companyIds: number[];
};

type FormKey = keyof FormType;

type SearchType = {
  estimates: string;
  companies: string;
};

type SearchKey = keyof SearchType;

type SectionProps = {
  title: string;
  data: Estimate[] | Company[];
  loading: boolean;
  searchKey: SearchKey;
  formKey: FormKey;
  form: FormType;
  search: SearchType;
  setSearch: React.Dispatch<React.SetStateAction<SearchType>>;
  toggleAll: (key: FormKey, ids: number[]) => void;
  toggleItem: (id: number, key: FormKey) => void;
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
}: SectionProps) {
  const filteredData = data.filter((item) => {
    const searchValue = search[searchKey]?.toLowerCase() || "";

    const itemName =
      "companyName" in item && !("estimateNumber" in item)
        ? item.companyName
        : item.name;

    return itemName.toLowerCase().includes(searchValue);
  });

  return (
    <div className="p-6 shadow border border-gray-200 bg-white flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-5">
        <h3 className="font-semibold text-gray-800 text-lg">{title}</h3>

        {filteredData.length > 0 && (
          <button
            onClick={() =>
              toggleAll(
                formKey,
                filteredData.map((i) => i.id)
              )
            }
            className={`
              px-4 py-1.5 text-xs font-medium transition-all duration-200
              ${
                form[formKey].length === filteredData.length
                  ? "bg-red-50 text-red-600 hover:bg-red-100"
                  : "bg-blue-50 text-blue-600 hover:bg-blue-100"
              }
            `}
          >
            {form[formKey].length === filteredData.length
              ? "إلغاء الكل"
              : "تحديد الكل"}
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

      <div className="border-t border-gray-100 mb-4"></div>

      {/* List */}
      {loading ? (
        <Loader />
      ) : (
        <div className="space-y-2 max-h-87.5 overflow-y-auto pr-1">
          {filteredData.map((item) => {
            const checked = form[formKey].includes(item.id);

            const itemName =
              "companyName" in item && !("estimateNumber" in item)
                ? item.companyName
                : item.name;

            return (
              <label
                key={item.id}
                className={`
                  flex items-center justify-between px-4 py-3 cursor-pointer
                  border transition-all duration-200 group
                  ${
                    checked
                      ? "bg-blue-50 border-blue-500 shadow-sm"
                      : "bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }
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
                    {itemName}
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
}