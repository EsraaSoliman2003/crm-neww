"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import axios from "@/lib/axios";
import Input from "@/components/form/Input";
import Textarea from "@/components/form/Textarea";
import Dropdown from "@/components/dropdown/DropDown";
import Button from "@/components/btn/Button";
import Loader from "@/components/loader/Loader";
import {
  CompanyCatalogItem,
  createCompanyEstimate,
  formatMoney,
  getItemsCatalog,
} from "@/lib/companyPricing";

type Option = { id: number; name: string };

type FormState = {
  name: string;
  estimateNumber: string;
  stageId: string;
  completeId: string;
  notes: string;
};

/** A company creates its own estimate from the items in the system (active right away). */
export default function AddCompanyEstimatePage() {
  const router = useRouter();

  const [form, setForm] = useState<FormState>({
    name: "",
    estimateNumber: "",
    stageId: "",
    completeId: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState | "items", string>>>({});
  const [stages, setStages] = useState<Option[]>([]);
  const [completes, setCompletes] = useState<Option[]>([]);
  const [catalog, setCatalog] = useState<CompanyCatalogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // chosen items: itemId -> quantity typed
  const [selected, setSelected] = useState<Record<number, string>>({});
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [stagesRes, completesRes, items] = await Promise.all([
          axios.get<Option[]>("EstimateStage"),
          axios.get<Option[]>("EstimateComplete"),
          getItemsCatalog(),
        ]);
        setStages(stagesRes.data);
        setCompletes(completesRes.data);
        setCatalog(items);
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const categories = useMemo(
    () => Array.from(new Set(catalog.map((i) => i.categoryName).filter(Boolean))) as string[],
    [catalog],
  );

  const normalizedSearch = search.trim().toLowerCase();
  const available = catalog.filter(
    (item) =>
      selected[item.itemId] === undefined &&
      (!category || item.categoryName === category) &&
      (!normalizedSearch || item.itemName.toLowerCase().includes(normalizedSearch)),
  );
  const chosen = catalog.filter((item) => selected[item.itemId] !== undefined);
  const total = chosen.reduce(
    (sum, item) => sum + item.systemPrice * (Number(selected[item.itemId]) || 0),
    0,
  );

  const setField = (name: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const addItem = (itemId: number) => {
    setSelected((prev) => ({ ...prev, [itemId]: "1" }));
    setErrors((prev) => ({ ...prev, items: undefined }));
  };

  const removeItem = (itemId: number) =>
    setSelected((prev) => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });

  const validate = () => {
    const next: typeof errors = {};
    if (!form.name.trim()) next.name = "اسم المقايسة مطلوب";
    if (!form.stageId) next.stageId = "اختر مرحلة المقايسة";
    if (!form.completeId) next.completeId = "اختر تمام المقايسة";
    if (chosen.length === 0) next.items = "اختر بندًا واحدًا على الأقل";
    else if (chosen.some((item) => !(Number(selected[item.itemId]) > 0)))
      next.items = "كمية كل بند يجب أن تكون أكبر من صفر";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      setSaving(true);
      const created = await createCompanyEstimate({
        name: form.name.trim(),
        estimateNumber: form.estimateNumber.trim() || undefined,
        estimateStageId: Number(form.stageId),
        estimateCompleteId: Number(form.completeId),
        notes: form.notes.trim() || undefined,
        items: chosen.map((item) => ({
          itemId: item.itemId,
          quantity: Number(selected[item.itemId]),
        })),
      });
      toast.success("تم إنشاء المقايسة بنجاح");
      router.push(`/company/estimates/${created.estimateId}`);
    } catch (error) {
      console.log(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen space-y-6 p-6 md:p-8">
      <div className="sticky top-[68px] z-30 -mx-6 bg-[#f7f7f7] px-6 pb-4 pt-1 text-right md:-mx-8 md:top-[84px] md:px-8">
        <h1 className="text-xl font-bold md:text-2xl">إضافة مقايسة</h1>
        <p className="mt-1 text-sm text-gray-500">
          اختر البنود من بنود المنظومة وحدد كمية كل بند، ثم ارفع أسعارك من صفحة المقايسة.
        </p>
      </div>

      {/* Estimate data */}
      <div className="space-y-6 bg-white p-6 shadow">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <Input
              label="اسم المقايسة"
              name="name"
              value={form.name}
              placeholder="ادخل اسم المقايسة"
              onChange={(e) => setField("name", e.target.value)}
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
          </div>
          <div>
            <Input
              label="رقم المقايسة (اختياري)"
              name="estimateNumber"
              value={form.estimateNumber}
              placeholder="يُنشأ تلقائيًا إذا تُرك فارغًا"
              onChange={(e) => setField("estimateNumber", e.target.value)}
            />
          </div>
          <div>
            <Dropdown
              label="مرحلة المقايسة"
              placeholder="اختر المرحلة"
              options={stages.map((s) => ({ value: String(s.id), label: s.name }))}
              selected={form.stageId}
              onSelect={(opt) => setField("stageId", opt.value)}
            />
            {errors.stageId && <p className="text-sm text-red-500">{errors.stageId}</p>}
          </div>
          <div>
            <Dropdown
              label="تمام المقايسة"
              placeholder="اختر التمام"
              options={completes.map((c) => ({ value: String(c.id), label: c.name }))}
              selected={form.completeId}
              onSelect={(opt) => setField("completeId", opt.value)}
            />
            {errors.completeId && <p className="text-sm text-red-500">{errors.completeId}</p>}
          </div>
        </div>
        <Textarea
          label="ملاحظات"
          name="notes"
          value={form.notes}
          placeholder="ادخل ملاحظات"
          onChange={(e) => setField("notes", e.target.value)}
        />
      </div>

      {/* Item picker */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3 bg-white p-6 shadow">
          <h2 className="font-bold">بنود المنظومة</h2>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث باسم البند"
                className="h-10 w-full border border-gray-200 pr-9 pl-3 outline-none focus:border-[#bf0200]"
              />
            </div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-10 border border-gray-200 bg-white px-2 outline-none focus:border-[#bf0200] sm:w-48"
            >
              <option value="">كل التصنيفات</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <ul className="max-h-[420px] divide-y divide-gray-100 overflow-auto border border-gray-100">
            {available.length === 0 ? (
              <li className="p-4 text-center text-sm text-gray-500">لا توجد بنود مطابقة</li>
            ) : (
              available.map((item) => (
                <li key={item.itemId} className="flex items-center justify-between gap-3 p-3">
                  <div className="min-w-0">
                    <p className="font-medium leading-6">{item.itemName}</p>
                    <p className="text-xs text-gray-500">
                      {[item.categoryName, item.subCategoryName].filter(Boolean).join(" / ") || "بدون تصنيف"}
                      {" • "}
                      {formatMoney(item.systemPrice)} / {item.unitName || "وحدة"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => addItem(item.itemId)}
                    className="flex shrink-0 items-center gap-1 border border-blue-600 px-3 py-1.5 text-sm text-blue-700 hover:bg-blue-50"
                  >
                    <Plus size={14} />
                    إضافة
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="space-y-3 bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">بنود المقايسة ({chosen.length})</h2>
            <p className="text-sm">
              إجمالي المنظومة: <span className="font-bold">{formatMoney(total)}</span>
            </p>
          </div>
          {errors.items && <p className="text-sm text-red-500">{errors.items}</p>}
          <ul className="max-h-[420px] divide-y divide-gray-100 overflow-auto border border-gray-100">
            {chosen.length === 0 ? (
              <li className="p-4 text-center text-sm text-gray-500">لم يتم اختيار بنود بعد</li>
            ) : (
              chosen.map((item) => {
                const qty = selected[item.itemId];
                return (
                  <li key={item.itemId} className="flex items-center gap-3 p-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium leading-6">{item.itemName}</p>
                      <p className="text-xs text-gray-500">
                        {formatMoney(item.systemPrice)} × {qty || 0} ={" "}
                        {formatMoney(item.systemPrice * (Number(qty) || 0))}
                      </p>
                    </div>
                    <label className="flex shrink-0 items-center gap-1 text-xs text-gray-500">
                      الكمية ({item.unitName || "وحدة"})
                      <input
                        type="number"
                        min={0}
                        step="any"
                        value={qty}
                        onChange={(e) =>
                          setSelected((prev) => ({ ...prev, [item.itemId]: e.target.value }))
                        }
                        className="w-24 border border-gray-300 px-2 py-1 text-right text-sm text-gray-900 outline-none focus:border-[#bf0200]"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => removeItem(item.itemId)}
                      title="حذف البند"
                      className="shrink-0 p-1 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      </div>

      <div className="flex justify-end">
        <Button text="إنشاء المقايسة" onClick={handleSubmit} loading={saving} />
      </div>
    </div>
  );
}
