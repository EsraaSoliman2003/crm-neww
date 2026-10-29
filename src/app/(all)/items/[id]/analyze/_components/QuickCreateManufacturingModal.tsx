"use client";

import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import Dropdown from "@/components/dropdown/DropDown";
import Input from "@/components/form/Input";
import Textarea from "@/components/form/Textarea";
import { useAppDispatch, useAppSelector } from "@/rtk/hooks";
import {
  createManufacturing,
  fetchManufacturing,
  type Manufacturing,
  updateManufacturing,
} from "@/rtk/slices/ManufacturingSlice";
import { fetchCategories } from "@/rtk/slices/categoriesSlice";
import { fetchDailies } from "@/rtk/slices/dailySlice";
import QuickCreateModal from "./QuickCreateModal";

type Props = {
  onClose: () => void;
  onCreated: (manufacturingId: number) => void;
  editItem?: Manufacturing;
};

type SelectedDaily = {
  dailyId: number;
  quantity: number;
};

export default function QuickCreateManufacturingModal({
  onClose,
  onCreated,
  editItem,
}: Props) {
  const dispatch = useAppDispatch();
  const categories = useAppSelector((state) => state.categories.data);
  const dailies = useAppSelector((state) => state.daily.data);
  const [saving, setSaving] = useState(false);
  const [selectedDailyId, setSelectedDailyId] = useState("");
  const [dailyQuantity, setDailyQuantity] = useState("");
  const [form, setForm] = useState({
    name: "",
    categoryId: "",
    performanceRate: "",
    notes: "",
    dailies: [] as SelectedDaily[],
  });

  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(fetchDailies({ page: 1, pageSize: 1000 }));
  }, [dispatch]);

  useEffect(() => {
    if (!editItem) return;
    setForm({
      name: editItem.name,
      categoryId: String(editItem.categoryId ?? editItem.publicCategory?.id ?? ""),
      performanceRate: String(editItem.performanceRate),
      notes: editItem.notes ?? "",
      dailies: (editItem.dailies || []).map((entry) => ({
        dailyId: entry.daily.id,
        quantity: entry.quantity,
      })),
    });
  }, [editItem]);

  const addDaily = () => {
    const dailyId = Number(selectedDailyId);
    const quantity = Number(dailyQuantity);
    if (!dailyId || quantity <= 0) return;
    setForm((previous) => ({
      ...previous,
      dailies: previous.dailies.some((daily) => daily.dailyId === dailyId)
        ? previous.dailies
        : [...previous.dailies, { dailyId, quantity }],
    }));
    setSelectedDailyId("");
    setDailyQuantity("");
  };

  const submit = async () => {
    if (
      !form.name.trim() ||
      !form.categoryId ||
      Number(form.performanceRate) <= 0 ||
      form.dailies.length === 0
    ) {
      toast.error("أكمل بيانات المصنعية وأضف يومية واحدة على الأقل");
      return;
    }

    try {
      setSaving(true);
      const payload = {
          name: form.name.trim(),
          categoryId: Number(form.categoryId),
          performanceRate: Number(form.performanceRate),
          notes: form.notes,
          dailies: form.dailies,
          image: null,
      };
      const saved = editItem
        ? await dispatch(updateManufacturing({ id: editItem.id, ...payload })).unwrap()
        : await dispatch(createManufacturing(payload)).unwrap();
      await dispatch(fetchManufacturing({ page: 1, pageSize: 1000000 })).unwrap();
      onCreated(editItem?.id ?? saved.id);
      toast.success(editItem ? "تم تعديل المصنعية الأصلية" : "تم إنشاء المصنعية واختيارها");
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <QuickCreateModal
      title={editItem ? "تعديل المصنعية الأصلية" : "إضافة مصنعية جديدة"}
      description={editItem ? "سيتم حفظ التعديل على المصنعية في النظام كله." : "أنشئ المصنعية وأضف يومياتها لتدخل في تحليل البند مباشرة."}
      onClose={onClose}
    >
      <div className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="اسم المصنعية"
            name="name"
            value={form.name}
            onChange={(event) =>
              setForm((previous) => ({
                ...previous,
                name: event.target.value,
              }))
            }
          />
          <Dropdown
            label="التصنيف"
            placeholder="اختر التصنيف"
            options={categories.map((category) => ({
              value: String(category.id),
              label: category.name,
            }))}
            selected={form.categoryId}
            onSelect={(option) =>
              setForm((previous) => ({
                ...previous,
                categoryId: option.value,
              }))
            }
          />
        </div>

        <div className="rounded-xl border border-orange-100 bg-orange-50/50 p-4">
          <h3 className="mb-4 font-bold text-gray-800">يوميات المصنعية</h3>
          <div className="grid gap-4 md:grid-cols-[1fr_180px_auto] md:items-end">
            <Dropdown
              label="اليومية"
              placeholder="اختر اليومية"
              options={dailies.map((daily) => ({
                value: String(daily.id),
                label: `${daily.name} - ${daily.category === 0 ? "عمالة" : "معدة"}`,
              }))}
              selected={selectedDailyId}
              onSelect={(option) => setSelectedDailyId(option.value)}
            />
            <Input
              label="الكمية"
              name="dailyQuantity"
              type="number"
              value={dailyQuantity}
              onChange={(event) => setDailyQuantity(event.target.value)}
            />
            <button
              type="button"
              onClick={addDaily}
              className="h-13 rounded-lg border border-orange-200 bg-white px-5 font-semibold text-orange-700 transition hover:bg-orange-100"
            >
              إضافة اليومية
            </button>
          </div>

          {form.dailies.length > 0 && (
            <div className="mt-4 space-y-2">
              {form.dailies.map((selectedDaily) => {
                const daily = dailies.find(
                  (item) => item.id === selectedDaily.dailyId,
                );
                return (
                  <div
                    key={selectedDaily.dailyId}
                    className="flex items-center justify-between rounded-lg border border-orange-100 bg-white px-4 py-3"
                  >
                    <span className="font-semibold text-gray-700">
                      {daily?.name} — كمية {selectedDaily.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setForm((previous) => ({
                          ...previous,
                          dailies: previous.dailies.filter(
                            (item) =>
                              item.dailyId !== selectedDaily.dailyId,
                          ),
                        }))
                      }
                      className="text-red-500 hover:text-red-700"
                      aria-label="حذف اليومية"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <Input
          label="معدل الأداء"
          name="performanceRate"
          type="number"
          value={form.performanceRate}
          onChange={(event) =>
            setForm((previous) => ({
              ...previous,
              performanceRate: event.target.value,
            }))
          }
        />
        <Textarea
          label="ملاحظات"
          name="notes"
          value={form.notes}
          onChange={(event) =>
            setForm((previous) => ({ ...previous, notes: event.target.value }))
          }
        />
        <div className="flex justify-end gap-3 border-t border-gray-100 pt-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-5 py-2.5 font-semibold text-gray-600"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={saving}
            className="rounded-lg bg-orange-500 px-5 py-2.5 font-semibold text-white transition hover:bg-orange-600 disabled:opacity-60"
          >
            {saving ? "جاري الحفظ..." : editItem ? "حفظ التعديل" : "إضافة واختيار"}
          </button>
        </div>
      </div>
    </QuickCreateModal>
  );
}
