"use client";

import Button from "@/components/button/Button";
import Input from "@/components/form/Input";
import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/rtk/hooks";
import Loader from "@/components/loader/Loader";
import EmptyState from "@/components/emptyState/EmptyState";
import { card2BG } from "@/assets";
import { confirmDelete } from "@/utils/confirmDelete";
import ButtonBar from "@/components/buttonBar/ButtonBar";
import {
  AddedValue,
  deleteAddedValue,
  fetchAddedValues,
  updateAddedValue,
} from "@/rtk/slices/addedValueSlice";
import Table from "@/components/table/Table";
import { Pencil, Trash2 } from "lucide-react";
import Dropdown from "@/components/dropdown/DropDown";
import Textarea from "@/components/form/Textarea";
import Modal from "@/components/modal/Modal";
import instance from "@/lib/axios";
import { toast } from "sonner";

type RateCategory = {
  id: number;
  name: string;
};

type EditForm = {
  name: string;
  percentage: string;
  rateCategoryId: string;
  notes: string;
};

export default function Page() {
  const dispatch = useAppDispatch();
  const { data, loading, updating } = useAppSelector((s) => s.addedValue);
  const [rateCategories, setRateCategories] = useState<RateCategory[]>([]);
  const [editingItem, setEditingItem] = useState<AddedValue | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    name: "",
    percentage: "",
    rateCategoryId: "",
    notes: "",
  });
  const [editErrors, setEditErrors] = useState<Partial<EditForm>>({});

  useEffect(() => {
    dispatch(fetchAddedValues());
    instance
      .get<RateCategory[]>("/RateCategory")
      .then((response) => setRateCategories(response.data || []))
      .catch(() => undefined);
  }, [dispatch]);

  const [name, setName] = useState("");

  const filtered = (data || []).filter((item) =>
    (item?.name ?? "").toLowerCase().includes(name.toLowerCase()),
  );

  const handleDelete = (id: number) => {
    confirmDelete(id, (id) => dispatch(deleteAddedValue(Number(id))).unwrap());
  };

  const openEditModal = (item: AddedValue) => {
    const rateCategoryId =
      item.rateCategoryId ??
      rateCategories.find((category) => category.name === item.rateCategoryName)
        ?.id;
    setEditingItem(item);
    setEditForm({
      name: item.name ?? "",
      percentage: String(item.percentage ?? ""),
      rateCategoryId: rateCategoryId ? String(rateCategoryId) : "",
      notes: item.notes ?? "",
    });
    setEditErrors({});
  };

  const closeEditModal = () => {
    setEditingItem(null);
    setEditErrors({});
  };

  const handleUpdate = async () => {
    if (!editingItem) return;
    const errors: Partial<EditForm> = {};
    if (!editForm.name.trim()) errors.name = "الاسم مطلوب";
    if (!editForm.percentage || Number(editForm.percentage) <= 0)
      errors.percentage = "النسبة مطلوبة";
    if (!editForm.rateCategoryId) errors.rateCategoryId = "التصنيف مطلوب";
    setEditErrors(errors);
    if (Object.keys(errors).length) return;

    const rateCategory = rateCategories.find(
      (category) => category.id === Number(editForm.rateCategoryId),
    );

    try {
      await dispatch(
        updateAddedValue({
          id: editingItem.id,
          data: {
            name: editForm.name.trim(),
            percentage: Number(editForm.percentage),
            rateCategoryId: Number(editForm.rateCategoryId),
            rateCategoryName: rateCategory?.name ?? "",
            notes: editForm.notes.trim(),
          },
        }),
      ).unwrap();
      toast.success("تم تعديل النسبة المضافة بنجاح");
      closeEditModal();
    } catch {
      // Axios يعرض رسالة الخطأ القادمة من الخادم للمستخدم.
    }
  };

  const flattenItems = (data: AddedValue[]) => {
    return data.map((item) => ({
      id: item.id,
      name: item.name,
      percentage: item.percentage,
      entityTypeId: item.entityTypeId,
      categoryId: item.categoryId,
      rateCategoryName: item.rateCategoryName,
      notes: item.notes,
    }));
  };
  return (
    <>
      <div className="space-y-8">
        <div className="-mx-6 space-y-5 rounded-b-3xl border-b border-orange-100/80 bg-linear-to-b from-orange-50/95 via-white/95 to-white/90 px-6 pb-5 pt-4 shadow-[0_10px_30px_-24px_rgba(154,52,18,0.45)] md:-mx-8 md:px-8">
          {/* Header */}
          <div className="flex justify-between items-center">
            <h1 className="text-xl md:text-2xl font-bold">أرباح وضرائب واستقطاعات</h1>

            <div className="flex gap-3">
              <Button
                text="تصنيفات النسبة"
                href="/added-percentage/rate-categories"
                border
              />
              <Button
                text="اضافة نسبة"
                href="/added-percentage/add-percentage"
              />
            </div>
          </div>

          {/* Button Bar */}
          <ButtonBar title="تقرير أرباح وضرائب واستقطاعات" data={flattenItems(data)} />
        </div>

        {/* Table */}
        {loading ? (
          <Loader />
        ) : data.length > 0 ? (
          <Table
            data={filtered}
            filterContent={
              <Input
                name="name"
                type="text"
                value={name}
                placeholder="ابحث باسم القيمة"
                onChange={(e) => setName(e.target.value)}
              />
            }
            loading={loading}
            emptyText="لا توجد قيم مضافة مطابقة للفلتر المحدد"
            getRowKeyAction={(item) => item.id}
            columns={[
              {
                key: "id",
                header: "الرقم",
                render: (_, index) => index + 1,
              },

              {
                key: "name",
                header: "الاسم",
                width: "200px",
                filterable: true,
              },

              {
                key: "percentage",
                header: "النسبة %",
                render: (row) => (
                  <span className="font-semibold text-green-600">
                    {row.percentage}%
                  </span>
                ),
              },

              {
                key: "rateCategoryName",
                header: "التصنيف",
                render: (row) => row.rateCategoryName || "-",
                filterable: true,
              },

              {
                key: "notes",
                header: "الملاحظات",
                render: (row) => row.notes || "-",
                className: "whitespace-normal! min-w-[150px] max-w-[250px]",
              },

              {
                key: "actions",
                header: "خيارات",
                render: (row) => (
                  <div className="flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(row);
                      }}
                      className="text-green-500 hover:text-green-700"
                      title="تعديل النسبة"
                      aria-label={`تعديل ${row.name}`}
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(row.id);
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ),
              },
            ]}
          />
        ) : (
          <EmptyState image={card2BG} title="لا يوجد بيانات" />
        )}
      </div>
      <Modal
        open={Boolean(editingItem)}
        onClose={closeEditModal}
        title="تعديل النسبة المضافة"
      >
        <div className="space-y-5">
          <div>
            <Input
              label="اسم النسبة"
              name="editAddedValueName"
              value={editForm.name}
              placeholder="اكتب اسم النسبة"
              onChange={(event) =>
                setEditForm((previous) => ({
                  ...previous,
                  name: event.target.value,
                }))
              }
            />
            {editErrors.name && (
              <p className="mt-1 text-sm text-red-500">{editErrors.name}</p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Dropdown
                label="تصنيف النسبة"
                placeholder="اختر تصنيف النسبة"
                options={rateCategories.map((category) => ({
                  value: String(category.id),
                  label: category.name,
                }))}
                selected={editForm.rateCategoryId}
                onSelect={(option) =>
                  setEditForm((previous) => ({
                    ...previous,
                    rateCategoryId: option.value,
                  }))
                }
              />
              {editErrors.rateCategoryId && (
                <p className="mt-1 text-sm text-red-500">
                  {editErrors.rateCategoryId}
                </p>
              )}
            </div>
            <div>
              <Input
                label="قيمة النسبة"
                name="editAddedValuePercentage"
                type="number"
                value={editForm.percentage}
                placeholder="اكتب قيمة النسبة"
                onChange={(event) =>
                  setEditForm((previous) => ({
                    ...previous,
                    percentage: event.target.value,
                  }))
                }
              />
              {editErrors.percentage && (
                <p className="mt-1 text-sm text-red-500">
                  {editErrors.percentage}
                </p>
              )}
            </div>
          </div>

          <Textarea
            label="ملاحظات"
            name="editAddedValueNotes"
            value={editForm.notes}
            placeholder="اكتب الملاحظات"
            onChange={(event) =>
              setEditForm((previous) => ({
                ...previous,
                notes: event.target.value,
              }))
            }
          />

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={closeEditModal}
              className="rounded-2xl border border-gray-200 px-5 py-3 font-bold text-gray-600 transition hover:bg-gray-50"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleUpdate}
              disabled={updating}
              className="rounded-2xl bg-[#bf0200] px-5 py-3 font-bold text-white transition hover:bg-[#9f0200] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {updating ? "جاري الحفظ..." : "حفظ التعديل"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
