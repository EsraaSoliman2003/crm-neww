"use client";

import { card2BG } from "@/assets";
import EmptyState from "@/components/emptyState/EmptyState";
import Input from "@/components/form/Input";
import Loader from "@/components/loader/Loader";
import Table from "@/components/table/Table";
import instance from "@/lib/axios";
import { confirmDelete } from "@/utils/confirmDelete";
import { Pencil, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type RateCategory = {
  id: number;
  name: string;
};

export default function RateCategoriesPage() {
  const [categories, setCategories] = useState<RateCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [editingCategory, setEditingCategory] =
    useState<RateCategory | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await instance.get<RateCategory[]>("/RateCategory");
        setCategories(response.data || []);
      } finally {
        setLoading(false);
      }
    };

    void fetchCategories();
  }, []);

  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(search.trim().toLowerCase()),
  );

  const openEditModal = (category: RateCategory) => {
    setEditingCategory(category);
    setName(category.name);
    setError("");
  };

  const closeModal = () => {
    setEditingCategory(null);
    setName("");
    setError("");
  };

  const handleUpdate = async () => {
    if (!editingCategory) return;
    if (!name.trim()) {
      setError("اسم التصنيف مطلوب");
      return;
    }

    try {
      setSaving(true);
      await instance.put("/RateCategory", {
        id: editingCategory.id,
        name: name.trim(),
      });
      setCategories((previous) =>
        previous.map((category) =>
          category.id === editingCategory.id
            ? { ...category, name: name.trim() }
            : category,
        ),
      );
      toast.success("تم تعديل تصنيف النسبة بنجاح");
      closeModal();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: number) => {
    confirmDelete(id, async (confirmedId) => {
      await instance.delete(`/RateCategory/${confirmedId}`);
      setCategories((previous) =>
        previous.filter((category) => category.id !== Number(confirmedId)),
      );
    });
  };

  return (
    <>
      <div className="space-y-8">
        <div className="-mx-6 rounded-b-3xl border-b border-orange-100/80 bg-linear-to-b from-orange-50/95 via-white/95 to-white/90 px-6 pb-5 pt-4 shadow-[0_10px_30px_-24px_rgba(154,52,18,0.45)] md:-mx-8 md:px-8">
          <h1 className="text-xl font-bold md:text-2xl">تصنيفات النسب المضافة</h1>
          <p className="mt-1 text-sm text-gray-500">
            تعديل وحذف التصنيفات المستخدمة مع القيم المضافة.
          </p>
        </div>

        {loading ? (
          <Loader />
        ) : categories.length ? (
          <Table
            data={filteredCategories}
            emptyText="لا توجد تصنيفات مطابقة للبحث"
            filterContent={
              <Input
                name="rateCategorySearch"
                value={search}
                placeholder="ابحث باسم التصنيف"
                onChange={(event) => setSearch(event.target.value)}
              />
            }
            exportTitle="تقرير تصنيفات النسب المضافة"
            getRowKeyAction={(category) => category.id}
            columns={[
              { key: "id", header: "#", render: (_, index) => index + 1, },
              { key: "name", header: "اسم التصنيف" },
              {
                key: "actions",
                header: "خيارات",
                printable: false,
                render: (category) => (
                  <div className="flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => openEditModal(category)}
                      className="text-green-500 transition hover:text-green-700"
                      title="تعديل التصنيف"
                      aria-label={`تعديل ${category.name}`}
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(category.id)}
                      className="text-red-500 transition hover:text-red-700"
                      title="حذف التصنيف"
                      aria-label={`حذف ${category.name}`}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ),
              },
            ]}
          />
        ) : (
          <EmptyState image={card2BG} title="لا توجد تصنيفات للنسب المضافة" />
        )}
      </div>

      {editingCategory && (
        <div className="fixed inset-0 z-12220 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-white/40 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-rose-100 bg-rose-50/60 px-6 py-5">
              <div>
                <h2 className="text-xl font-black text-gray-900">
                  تعديل تصنيف النسبة
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  عدّل الاسم وسيظهر التغيير فور الحفظ.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-500 transition hover:text-red-600"
                aria-label="إغلاق"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-5 p-6">
              <Input
                label="اسم التصنيف"
                name="rateCategoryName"
                value={name}
                placeholder="اكتب اسم التصنيف"
                onChange={(event) => {
                  setName(event.target.value);
                  setError("");
                }}
              />
              {error && <p className="text-sm text-red-500">{error}</p>}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-2xl border border-gray-200 px-5 py-3 font-bold text-gray-600 transition hover:bg-gray-50"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleUpdate}
                  disabled={saving}
                  className="rounded-2xl bg-[#bf0200] px-5 py-3 font-bold text-white transition hover:bg-[#9f0200] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "جاري الحفظ..." : "حفظ التعديل"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
