"use client";

import {
  ChevronDown,
  FolderTree,
  Layers3,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Dropdown from "@/components/dropdown/DropDown";
import Loader from "@/components/loader/Loader";
import { useAppDispatch, useAppSelector } from "@/rtk/hooks";
import {
  assignSubCategory,
  deleteSubCategory,
  fetchSubCategories,
  type Item,
} from "@/rtk/slices/subCategoriesSlice";
import { createCategory, fetchCategories } from "@/rtk/slices/categoriesSlice";
import { confirmDelete } from "@/utils/confirmDelete";
import { toast } from "sonner";

type Props = {
  entityTypeId: number;
  entityLabel: string;
  baseRoute: string;
  supText?: string;
  supType?: string;
};

type ModalType = "category" | "subcategory" | null;
type SafeCategory = Item & { matches?: boolean };

const safeText = (value: unknown) =>
  typeof value === "string" ? value : value == null ? "" : String(value);

const safeSubCategories = (value: unknown) =>
  Array.isArray(value) ? value : [];

const safeNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export default function SubCategoriesAccordionPage({
  entityTypeId,
  entityLabel,
  baseRoute,
  supText,
  supType
}: Props) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();

  const { data, loading, deleting, creating } = useAppSelector(
    (state) => state.subCategories,
  );
  const {
    data: categories,
    creating: creatingCategory,
    loading: categoriesLoading,
  } = useAppSelector((state) => state.categories);

  const [search, setSearch] = useState("");
  const [openCategoryId, setOpenCategoryId] = useState<number | null>(null);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [preferredCategoryId, setPreferredCategoryId] = useState<number>(0);
  const [categoryName, setCategoryName] = useState("");
  const [subCategoryName, setSubCategoryName] = useState("");
  const [categoryError, setCategoryError] = useState("");
  const [subCategoryError, setSubCategoryError] = useState("");

  useEffect(() => {
    dispatch(fetchSubCategories(entityTypeId));
    dispatch(fetchCategories());
  }, [dispatch, entityTypeId]);

  useEffect(() => {
    const modal = searchParams.get("modal");
    const categoryId = Number(searchParams.get("categoryId") || 0);

    if (modal === "category") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveModal("category");
      return;
    }

    if (modal === "subcategory") {
      setActiveModal("subcategory");
      if (categoryId) {
        setPreferredCategoryId(categoryId);
        setOpenCategoryId(categoryId);
      }
      return;
    }

    setActiveModal(null);
  }, [searchParams]);

  useEffect(() => {
    if (!preferredCategoryId && categories.length) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPreferredCategoryId(safeNumber(categories[0]?.id));
    }
  }, [categories, preferredCategoryId]);

  const normalizedSearch = search.trim().toLocaleLowerCase("ar");
  const categoryOptions = useMemo(
    () =>
      categories.map((category, index) => {
        const categoryId = safeNumber(category?.id);

        return {
          value: categoryId > 0 ? String(categoryId) : `fallback-${index}`,
          label: safeText(category?.name) || `تصنيف رئيسي ${index + 1}`,
        };
      }),
    [categories],
  );

  const filteredCategories = useMemo(
    () =>
      data
        .map((category) => {
          const categoryName = safeText(category?.categoryName);
          const subCategories = safeSubCategories(category?.subCategories);
          const categoryMatches = categoryName
            .toLocaleLowerCase("ar")
            .includes(normalizedSearch);
          const matchingSubCategories = normalizedSearch
            ? subCategories.filter((subCategory) =>
                safeText(subCategory?.subCategoryName)
                  .toLocaleLowerCase("ar")
                  .includes(normalizedSearch),
              )
            : subCategories;
          return {
            ...category,
            categoryName,
            subCategories: categoryMatches
              ? subCategories
              : matchingSubCategories,
            matches: categoryMatches || matchingSubCategories.length > 0,
          };
        })
        .filter((category) => !normalizedSearch || category.matches),
    [data, normalizedSearch],
  );

  const totalSubCategories = data.reduce(
    (total, category) =>
      total + safeSubCategories(category?.subCategories).length,
    0,
  );

  const resetModalState = () => {
    setCategoryName("");
    setSubCategoryName("");
    setCategoryError("");
    setSubCategoryError("");
  };

  const closeModal = () => {
    setActiveModal(null);
    resetModalState();
    if (searchParams.size) {
      router.replace(baseRoute, { scroll: false });
    }
  };

  const openCategoryModal = () => {
    setActiveModal("category");
  };

  const openSubCategoryModal = (categoryId?: number) => {
    const firstCategoryId = safeNumber(categories[0]?.id);
    setPreferredCategoryId(categoryId || firstCategoryId || 0);
    if (categoryId) {
      setOpenCategoryId(categoryId);
    }
    setSubCategoryError("");
    setActiveModal("subcategory");
  };

  const handleDelete = async (id: number) => {
    await confirmDelete(id, async (confirmedId) => {
      await dispatch(deleteSubCategory(Number(confirmedId))).unwrap();
      await dispatch(fetchSubCategories(entityTypeId)).unwrap();
    });
  };

  const handleCreateCategory = async () => {
    if (!categoryName.trim()) {
      setCategoryError("اسم التصنيف الرئيسي مطلوب");
      return;
    }

    try {
      const created = await dispatch(
        createCategory({ name: categoryName.trim() }),
      ).unwrap();

      toast.success("تم إضافة التصنيف الرئيسي بنجاح");
      await dispatch(fetchCategories()).unwrap();
      await dispatch(fetchSubCategories(entityTypeId)).unwrap();
      setPreferredCategoryId(created?.id || 0);
      closeModal();
    } catch (error) {
      console.log(error);
      toast.error("تعذر إضافة التصنيف الرئيسي");
    }
  };

  const handleCreateSubCategory = async () => {
    if (!categoryOptions.length) {
      setSubCategoryError("أضف تصنيف رئيسي أولًا قبل إضافة تصنيف فرعي");
      return;
    }

    if (!preferredCategoryId) {
      setSubCategoryError("اختر التصنيف الرئيسي أولًا");
      return;
    }

    if (!subCategoryName.trim()) {
      setSubCategoryError("اسم التصنيف الفرعي مطلوب");
      return;
    }

    try {
      await dispatch(
        assignSubCategory({
          entityTypeId,
          categoryId: preferredCategoryId,
          subCategoryName: subCategoryName.trim(),
        }),
      ).unwrap();

      toast.success("تم إضافة التصنيف الفرعي بنجاح");
      await dispatch(fetchSubCategories(entityTypeId)).unwrap();
      setOpenCategoryId(preferredCategoryId);
      closeModal();
    } catch (error) {
      console.log(error);
      toast.error("تعذر إضافة التصنيف الفرعي");
    }
  };

  return (
    <>
      <div className="min-h-screen space-y-7 pb-10 pt-6 md:pt-8">
        <section className="overflow-hidden rounded-3xl bg-linear-to-l from-[#9f0200] via-[#bf0200] to-orange-500 text-white shadow-xl shadow-red-950/15">
          <div className="relative p-6 md:p-8">
            <div className="absolute -left-16 -top-24 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
            <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
              <div>
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white/80">
                  <FolderTree size={18} />
                  إدارة هيكل التصنيفات
                </div>
                <h1 className="text-2xl font-black md:text-3xl">
                  التصنيفات الفرعية — {entityLabel}
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-white/80">
                  اضغط على أي تصنيف رئيسي لعرض تصنيفاته الفرعية وإدارتها في جدول
                  مستقل.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => openSubCategoryModal()}
                  className="flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-bold text-[#bf0200] shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
                >
                  <Plus size={18} />
                  {supText ? supText : "تصنيف فرعي جديد"}
                </button>
                <button
                  type="button"
                  onClick={openCategoryModal}
                  className="flex items-center gap-2 rounded-xl border border-white/35 bg-white/10 px-5 py-3 font-bold text-white backdrop-blur transition hover:bg-white/20"
                >
                  <Layers3 size={18} />
                  تصنيف عام جديد
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <StatCard label="التصنيفات الرئيسية" value={data.length} />
          <StatCard
            label={supType ? supType : "إجمالي التصنيفات الفرعية"}
            value={totalSubCategories}
            accent
          />
        </section>

        <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm md:p-5">
          <div className="relative">
            <Search
              size={20}
              className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="ابحث باسم التصنيف الرئيسي أو الفرعي..."
              className="h-14 w-full rounded-xl border border-gray-200 bg-gray-50 pr-12 pl-4 text-sm outline-none transition focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-100"
            />
          </div>
        </section>

        {loading ? (
          <Loader />
        ) : filteredCategories.length ? (
          <div className="space-y-4">
            {filteredCategories.map((category, index) => (
              <CategoryAccordion
                key={`${safeNumber(category.categoryId) || "category"}-${index}`}
                category={category}
                index={index}
                isOpen={
                  openCategoryId === category.categoryId ||
                  (Boolean(normalizedSearch) && filteredCategories.length === 1)
                }
                deleting={deleting}
                onToggle={() =>
                  setOpenCategoryId((current) =>
                    current === category.categoryId
                      ? null
                      : category.categoryId,
                  )
                }
                onDelete={handleDelete}
                onAddSubCategory={() =>
                  openSubCategoryModal(category.categoryId)
                }
              />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
            <Search size={44} className="mx-auto text-gray-300" />
            <h2 className="mt-4 text-xl font-black text-gray-800">
              لا توجد نتائج مطابقة
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              جرّب البحث باسم مختلف أو أضف تصنيفًا فرعيًا جديدًا.
            </p>
          </div>
        )}
      </div>

      <FancyModal
        open={activeModal === "category"}
        onClose={closeModal}
        icon={<Layers3 size={20} />}
        title="إضافة تصنيف رئيسي"
        subtitle="أضف تصنيفًا رئيسيًا جديدًا من غير ما تخرج من الصفحة."
      >
        <div className="space-y-5">
          <div className="rounded-2xl border border-rose-100 bg-rose-50/60 p-4 text-sm text-rose-800">
            <div className="mb-2 flex items-center gap-2 font-bold">
              <Sparkles size={16} />
              لمسة سريعة
            </div>
            هيظهر التصنيف الجديد فورًا في القوائم بعد الحفظ.
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700">
              اسم التصنيف الرئيسي
            </label>
            <input
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              value={categoryName}
              onChange={(event) => {
                setCategoryName(event.target.value);
                setCategoryError("");
              }}
              placeholder="اكتب اسم التصنيف الرئيسي"
              className="h-13.75 w-full rounded-2xl border border-rose-100 bg-white px-4 text-sm outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
            />
            {categoryError && (
              <p className="text-sm font-medium text-red-500">
                {categoryError}
              </p>
            )}
          </div>

          <div className="flex flex-wrap justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={closeModal}
              className="rounded-2xl border border-gray-200 px-5 py-3 font-bold text-gray-600 transition hover:bg-gray-50"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleCreateCategory}
              disabled={creatingCategory}
              className="rounded-2xl bg-linear-to-r from-[#bf0200] to-[#d13b2f] px-5 py-3 font-bold text-white shadow-lg shadow-red-900/15 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {creatingCategory ? "جاري الإضافة..." : "حفظ التصنيف"}
            </button>
          </div>
        </div>
      </FancyModal>

      <FancyModal
        open={activeModal === "subcategory"}
        onClose={closeModal}
        icon={<FolderTree size={20} />}
        title="إضافة تصنيف فرعي"
        subtitle="اختر التصنيف الرئيسي وبعدها أضف التصنيف الفرعي مباشرة."
      >
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700">
                التصنيف الرئيسي
              </label>
              <Dropdown
                options={categoryOptions}
                selected={
                  preferredCategoryId ? String(preferredCategoryId) : ""
                }
                placeholder={
                  categoriesLoading
                    ? "جاري تحميل التصنيفات..."
                    : "اختر التصنيف الرئيسي"
                }
                disabled={categoriesLoading || !categoryOptions.length}
                showLabel={false}
                onSelect={(option) => {
                  setPreferredCategoryId(safeNumber(option.value));
                  setSubCategoryError("");
                }}
                linkText="إضافة تصنيف رئيسي"
                linkType="button"
                onAdd={() => {
                  setActiveModal("category");
                  setSubCategoryError("");
                }}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700">
                اسم التصنيف الفرعي
              </label>
              <input
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                value={subCategoryName}
                onChange={(event) => {
                  setSubCategoryName(event.target.value);
                  setSubCategoryError("");
                }}
                placeholder="اكتب اسم التصنيف الفرعي"
                className="h-13.75 w-full rounded-2xl border border-rose-100 bg-white px-4 text-sm outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
              />
            </div>
          </div>

          {subCategoryError && (
            <p className="text-sm font-medium text-red-500">
              {subCategoryError}
            </p>
          )}

          <div className="rounded-2xl border border-orange-100 bg-orange-50/60 p-4 text-sm text-orange-900">
            بعد الحفظ، هيتضاف التصنيف تحت القسم اللي اخترته مباشرة.
          </div>

          <div className="flex flex-wrap justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={closeModal}
              className="rounded-2xl border border-gray-200 px-5 py-3 font-bold text-gray-600 transition hover:bg-gray-50"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleCreateSubCategory}
              disabled={creating}
              className="rounded-2xl bg-linear-to-r from-[#bf0200] to-[#d13b2f] px-5 py-3 font-bold text-white shadow-lg shadow-red-900/15 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {creating ? "جاري الإضافة..." : "حفظ التصنيف الفرعي"}
            </button>
          </div>
        </div>
      </FancyModal>
    </>
  );
}

type AccordionProps = {
  category: SafeCategory & { matches: boolean };
  index: number;
  isOpen: boolean;
  deleting: boolean;
  onToggle: () => void;
  onDelete: (id: number) => void;
  onAddSubCategory: () => void;
};

function CategoryAccordion({
  category,
  index,
  isOpen,
  deleting,
  onToggle,
  onDelete,
  onAddSubCategory,
}: AccordionProps) {
  return (
    <section
      className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-300 ${
        isOpen
          ? "border-orange-200 shadow-lg shadow-orange-950/5"
          : "border-gray-100 hover:-translate-y-0.5 hover:border-orange-100 hover:shadow-md"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-4 p-5 text-right md:p-6"
      >
        <div className="flex min-w-0 items-center gap-4">
          <span
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-lg font-black transition ${
              isOpen
                ? "bg-orange-500 text-white shadow-lg shadow-orange-500/25"
                : "bg-orange-50 text-orange-700"
            }`}
          >
            {(index + 1).toLocaleString("ar-EG")}
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-lg font-black text-gray-900 md:text-xl">
              {safeText(category.categoryName) || "بدون اسم"}
            </h2>
            <p className="mt-1 text-sm font-semibold text-gray-400">
              {safeSubCategories(category.subCategories).length.toLocaleString(
                "ar-EG",
              )}{" "}
              تصنيف فرعي
            </p>
          </div>
        </div>
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-50 text-gray-500 transition duration-300 ${
            isOpen ? "rotate-180 bg-orange-50 text-orange-600" : ""
          }`}
        >
          <ChevronDown size={20} />
        </span>
      </button>

      {isOpen && (
        <div className="border-t border-gray-100 bg-gray-50/60 p-3 md:p-5">
          {safeSubCategories(category.subCategories).length ? (
            <SubCategoriesTable
              category={category}
              deleting={deleting}
              onDelete={onDelete}
            />
          ) : (
            <div className="rounded-xl border border-dashed border-orange-200 bg-white px-5 py-10 text-center">
              <FolderTree size={36} className="mx-auto text-orange-300" />
              <p className="mt-3 font-bold text-gray-700">
                لا توجد تصنيفات فرعية داخل هذا التصنيف
              </p>
              <button
                type="button"
                onClick={onAddSubCategory}
                className="mt-4 inline-flex items-center gap-2 font-bold text-orange-600"
              >
                <Plus size={17} />
                أضف أول تصنيف فرعي
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function SubCategoriesTable({
  category,
  deleting,
  onDelete,
}: {
  category: SafeCategory;
  deleting: boolean;
  onDelete: (id: number) => void;
}) {
  const subCategories = safeSubCategories(category.subCategories);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-150 text-right">
          <thead className="bg-gray-900 text-sm text-white">
            <tr>
              <th className="w-24 px-5 py-4 text-center">م</th>
              <th className="px-5 py-4">اسم التصنيف الفرعي</th>
              <th className="w-32 px-5 py-4 text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {subCategories.map((subCategory, subIndex) => (
              <tr
                key={`${safeNumber(subCategory?.subCategoryId) || "subcategory"}-${subIndex}`}
                className="transition hover:bg-orange-50/60"
              >
                <td className="px-5 py-4 text-center font-bold text-gray-400">
                  {(subIndex + 1).toLocaleString("ar-EG")}
                </td>
                <td className="px-5 py-4 font-bold text-gray-800">
                  {safeText(subCategory?.subCategoryName) || "بدون اسم"}
                </td>
                <td className="px-5 py-4 text-center">
                  <button
                    type="button"
                    onClick={() => onDelete(subCategory.subCategoryId)}
                    disabled={deleting}
                    className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                    aria-label={`حذف ${safeText(subCategory?.subCategoryName) || "تصنيف فرعي"}`}
                  >
                    <Trash2 size={17} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FancyModal({
  open,
  onClose,
  icon,
  title,
  subtitle,
  children,
}: {
  open: boolean;
  onClose: () => void;
  icon: ReactNode;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-120 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-visible rounded-4xl border border-white/40 bg-white shadow-[0_40px_100px_-30px_rgba(15,23,42,0.4)]">
        <div className="relative overflow-hidden rounded-t-4xl border-b border-rose-100 bg-[linear-gradient(135deg,rgba(255,250,250,0.96)_0%,rgba(255,241,243,0.92)_100%)] px-6 py-5 md:px-7">
          <div className="absolute -top-14 left-10 h-32 w-32 rounded-full bg-rose-200/40 blur-3xl" />
          <div className="relative flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-[#bf0200] to-[#d13b2f] text-white shadow-lg shadow-red-900/20">
                {icon}
              </span>
              <div>
                <h3 className="text-xl font-black text-[#5f0d13]">{title}</h3>
                <p className="mt-1 text-sm leading-6 text-gray-600">
                  {subtitle}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-rose-100 bg-white text-gray-500 transition hover:bg-rose-50 hover:text-rose-600"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-6 md:p-7">{children}</div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 shadow-sm ${
        accent
          ? "border-orange-100 bg-orange-50/60"
          : "border-gray-100 bg-white"
      }`}
    >
      <p
        className={`text-sm font-semibold ${
          accent ? "text-orange-700" : "text-gray-500"
        }`}
      >
        {label}
      </p>
      <p
        className={`mt-2 text-3xl font-black ${
          accent ? "text-orange-700" : "text-gray-900"
        }`}
      >
        {value.toLocaleString("ar-EG")}
      </p>
    </div>
  );
}
