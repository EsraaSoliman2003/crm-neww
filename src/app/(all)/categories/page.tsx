"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Layers3, Pencil, Sparkles, Trash2, X } from "lucide-react";
import { card2BG } from "@/assets";
import EmptyState from "@/components/emptyState/EmptyState";
import Loader from "@/components/loader/Loader";
import { useAppDispatch, useAppSelector } from "@/rtk/hooks";
import {
  createCategory,
  deleteCategory,
  fetchCategories,
  updateCategory,
} from "@/rtk/slices/categoriesSlice";
import type { Category } from "@/rtk/slices/categoriesSlice";
import { confirmDelete } from "@/utils/confirmDelete";
import { toast } from "sonner";

export default function CategoriesPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data, loading, creating, updating } = useAppSelector(
    (s) => s.categories,
  );
  const [openModal, setOpenModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  useEffect(() => {
    if (searchParams.get("modal") === "category") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpenModal(true);
    } else {
      setOpenModal(false);
    }
  }, [searchParams]);

  const closeModal = () => {
    setOpenModal(false);
    setEditingCategory(null);
    setName("");
    setError("");
    if (searchParams.size) {
      router.replace(pathname, { scroll: false });
    }
  };

  const handleDelete = (id: number) => {
    confirmDelete(id, (confirmedId) =>
      dispatch(deleteCategory(Number(confirmedId))).unwrap(),
    );
  };

  const openCreateModal = () => {
    setEditingCategory(null);
    setName("");
    setError("");
    setOpenModal(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setName(category.name);
    setError("");
    setOpenModal(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError("اسم التصنيف مطلوب");
      return;
    }

    try {
      if (editingCategory) {
        await dispatch(
          updateCategory({ id: editingCategory.id, name: name.trim() }),
        ).unwrap();
        toast.success("تم تعديل التصنيف بنجاح");
      } else {
        await dispatch(createCategory({ name: name.trim() })).unwrap();
        toast.success("تم إضافة التصنيف بنجاح");
      }
      closeModal();
    } catch (error) {
      console.log(error);
      toast.error(
        editingCategory ? "تعذر تعديل التصنيف" : "تعذر إضافة التصنيف",
      );
    }
  };

  return (
    <>
      <div>
        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-gray-700 text-xl md:text-2xl font-bold">
            التصنيفات
          </h2>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#bf0200] bg-[#bf0200] px-6 py-3 text-sm font-bold text-white shadow-sm transition duration-200 ease-in-out hover:-translate-y-0.5 hover:bg-[#9f0200] hover:shadow-md md:px-8 md:text-base"
          >
            + اضافة تصنيف
          </button>
        </div>

        {loading ? (
          <Loader />
        ) : data.length === 0 ? (
          <EmptyState
            image={card2BG}
            title="لا يوجد تصنيفات حتى الآن"
            actionText="+ أضف جديد"
            href="/categories?modal=category"
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {data.map((category) => (
              <div
                key={category.id}
                className="bg-white shadow-[0_10px_25px_rgba(0,0,0,0.08)] p-6 flex justify-between gap-3 text-center hover:shadow-md hover:border-gray-300 transition-all duration-200"
              >
                <h3 className="text-xl font-semibold text-gray-700">
                  {category.name}
                </h3>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEditModal(category)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 transition hover:bg-amber-100 hover:text-amber-700"
                    aria-label={`تعديل ${category.name}`}
                    title="تعديل التصنيف"
                  >
                    <Pencil size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(category.id)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-500 transition hover:bg-red-100 hover:text-red-700"
                    aria-label={`حذف ${category.name}`}
                    title="حذف التصنيف"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {openModal && (
        <div className="fixed inset-0 z-120 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl overflow-hidden rounded-4xl border border-white/40 bg-white shadow-[0_40px_100px_-30px_rgba(15,23,42,0.4)]">
            <div className="relative overflow-hidden border-b border-rose-100 bg-[linear-gradient(135deg,rgba(255,250,250,0.96)_0%,rgba(255,241,243,0.92)_100%)] px-6 py-5 md:px-7">
              <div className="absolute -top-14 left-10 h-32 w-32 rounded-full bg-rose-200/40 blur-3xl" />
              <div className="relative flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-[#bf0200] to-[#d13b2f] text-white shadow-lg shadow-red-900/20">
                    <Layers3 size={20} />
                  </span>
                  <div>
                    <h3 className="text-xl font-black text-[#5f0d13]">
                      {editingCategory
                        ? "تعديل التصنيف الرئيسي"
                        : "إضافة تصنيف رئيسي"}
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-gray-600">
                      {editingCategory
                        ? "عدّل اسم التصنيف وسيظهر التغيير فور الحفظ."
                        : "مودال سريع ومرتب بدل صفحة منفصلة."}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-rose-100 bg-white text-gray-500 transition hover:bg-rose-50 hover:text-rose-600"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="p-6 md:p-7">
              <div className="space-y-5">
                <div className="rounded-2xl border border-rose-100 bg-rose-50/60 p-4 text-sm text-rose-800">
                  <div className="mb-2 flex items-center gap-2 font-bold">
                    <Sparkles size={16} />
                    لمسة سريعة
                  </div>
                  {editingCategory
                    ? "بعد الحفظ، هيظهر الاسم المعدل فورًا في القائمة."
                    : "بعد الحفظ، هيظهر التصنيف الجديد فورًا في القائمة."}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700">
                    اسم التصنيف
                  </label>
                  <input
                    value={name}
                    onChange={(event) => {
                      setName(event.target.value);
                      setError("");
                    }}
                    placeholder="اكتب اسم التصنيف"
                    className="h-13.75 w-full rounded-2xl border border-rose-100 bg-white px-4 text-sm outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
                  />
                  {error && (
                    <p className="text-sm font-medium text-red-500">{error}</p>
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
                    onClick={handleSave}
                    disabled={creating || updating}
                    className="rounded-2xl bg-linear-to-r from-[#bf0200] to-[#d13b2f] px-5 py-3 font-bold text-white shadow-lg shadow-red-900/15 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {creating || updating
                      ? "جاري الحفظ..."
                      : editingCategory
                        ? "حفظ التعديل"
                        : "حفظ التصنيف"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
