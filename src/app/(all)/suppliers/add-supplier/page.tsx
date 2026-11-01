"use client";

import { type ReactNode, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { parsePhoneNumber, parsePhoneNumberFromString } from "libphonenumber-js";
import { toast } from "sonner";
import Button from "@/components/button/Button";
import Dropdown from "@/components/dropdown/DropDown";
import InlineCreateDropdownModal, {
  type InlineCreateConfig,
} from "@/components/dropdown/InlineCreateDropdownModal";
import Input from "@/components/form/Input";
import { SuppliersNumber } from "@/constants/constantsNumbers";
import { useAppDispatch, useAppSelector } from "@/rtk/hooks";
import { fetchSubCategories } from "@/rtk/slices/subCategoriesSlice";
import {
  createSupplier,
  fetchSuppliers,
  updateSupplier,
} from "@/rtk/slices/suppliersSlice";
import { validatePassword } from "@/utils/validatePassword ";

// Suppliers only have a general category now; sub-categories are not used.
type FormState = {
  name: string;
  mainCategory: string;
  brand: string;
  email: string;
  countryCode: string;
  phone: string;
  password: string;
};

const emptyForm: FormState = {
  name: "",
  mainCategory: "",
  brand: "",
  email: "",
  countryCode: "",
  phone: "",
  password: "",
};

export default function AddSupplierPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const { creating, updating, data: suppliers } = useAppSelector(
    (state) => state.suppliers,
  );
  const { data: categories, loading } = useAppSelector(
    (state) => state.subCategories,
  );
  const isEdit = searchParams.get("mode") === "edit";
  const supplierId = Number(searchParams.get("id"));
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [form, setForm] = useState<FormState>(emptyForm);
  const [createConfig, setCreateConfig] = useState<InlineCreateConfig | null>(
    null,
  );

  useEffect(() => {
    dispatch(fetchSubCategories(SuppliersNumber));
    if (isEdit && suppliers.length === 0) dispatch(fetchSuppliers());
  }, [dispatch, isEdit, suppliers.length]);

  useEffect(() => {
    if (!isEdit || !supplierId || categories.length === 0) return;
    const supplier = suppliers.find((item) => item.id === supplierId);
    if (!supplier) return;
    const category =
      categories.find((item) => item.categoryId === supplier.categoryId) ??
      categories.find((item) => item.categoryName === supplier.categoryName);
    const supplierPhone = supplier.phoneNumber ?? "";
    const fullPhone = supplierPhone.startsWith("+")
      ? supplierPhone
      : supplier.countryCode
        ? `${supplier.countryCode}${supplierPhone}`
        : supplierPhone;
    const parsedSupplierPhone = parsePhoneNumberFromString(fullPhone);
    queueMicrotask(() =>
      setForm({
        name: supplier.name ?? "",
        mainCategory: String(category?.categoryId ?? ""),
        brand: supplier.brand ?? "",
        email: supplier.email ?? "",
        countryCode: parsedSupplierPhone
          ? `+${parsedSupplierPhone.countryCallingCode}`
          : supplier.countryCode ?? "",
        phone: fullPhone,
        password: "",
      }),
    );
  }, [categories, isEdit, supplierId, suppliers]);

  const validate = () => {
    const nextErrors: Partial<FormState> = {};
    if (!form.name.trim()) nextErrors.name = "اسم المورد مطلوب";
    if (!form.email.trim()) nextErrors.email = "البريد الإلكتروني مطلوب";
    if (!isEdit) {
      const passwordError = validatePassword(form.password);
      if (passwordError) nextErrors.password = passwordError;
    }
    if (!form.phone.trim()) nextErrors.phone = "رقم الهاتف مطلوب";
    if (!form.mainCategory) nextErrors.mainCategory = "التصنيف العام مطلوب";
    if (form.phone && !isValidPhoneNumber(form.phone)) {
      nextErrors.phone = "رقم الهاتف غير صحيح";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const saveSupplier = async () => {
    if (!validate()) return;
    const selectedCategory = categories.find(
      (category) => String(category.categoryId) === form.mainCategory,
    );
    if (!selectedCategory) return toast.error("اختر تصنيفًا صحيحًا");
    const parsed = parsePhoneNumber(form.phone);
    const commonData = {
      name: form.name.trim(),
      email: form.email.trim(),
      phoneNumber: parsed?.nationalNumber || "",
      countryCode: parsed ? `+${parsed.countryCallingCode}` : form.countryCode,
      categoryId: selectedCategory.categoryId,
      categoryName: selectedCategory.categoryName,
      brand: form.brand.trim() || null,
    };
    try {
      if (isEdit) {
        await dispatch(updateSupplier({ id: supplierId, ...commonData })).unwrap();
        toast.success("تم تعديل المورد بنجاح");
      } else {
        await dispatch(
          createSupplier({ ...commonData, password: form.password }),
        ).unwrap();
        toast.success("تم إضافة المورد بنجاح");
      }
      router.push("/suppliers");
    } catch {
      // Axios يعرض رسالة الخطأ القادمة من الخادم للمستخدم.
    }
  };

  return (
    <div className="min-h-screen space-y-6 pt-6">
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-7 border-b border-gray-100 pb-5">
          <h1 className="text-2xl font-black text-gray-900">
            {isEdit ? "تعديل بيانات المورد" : "إضافة مورد جديد"}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            بيانات المورد وتصنيفه ووسائل التواصل الخاصة به.
          </p>
        </div>
        <div className="space-y-6">
          <FieldError error={errors.name}>
            <Input
              label="اسم المورد"
              name="name"
              value={form.name}
              onChange={(event) => setForm((previous) => ({ ...previous, name: event.target.value }))}
            />
          </FieldError>
          <div className="grid gap-5 md:grid-cols-2">
            <FieldError error={errors.mainCategory}>
              <Dropdown
                label="التصنيف العام"
                placeholder="اختر التصنيف العام"
                options={categories.map((category) => ({ value: String(category.categoryId), label: category.categoryName }))}
                selected={form.mainCategory}
                loading={loading}
                onSelect={(option) => setForm((previous) => ({ ...previous, mainCategory: option.value }))}
                linkType="button"
                linkText=" + اضافة تصنيف عام"
                onAdd={() =>
                  setCreateConfig({
                    kind: "category",
                    onCreated: (category) => {
                      setForm((previous) => ({
                        ...previous,
                        mainCategory: String(category.id),
                      }));
                      dispatch(fetchSubCategories(SuppliersNumber));
                    },
                  })
                }
              />
            </FieldError>
            <Input
              label="المصدر / الماركة"
              placeholder="مثال: حديد عز"
              name="brand"
              value={form.brand}
              onChange={(event) => setForm((previous) => ({ ...previous, brand: event.target.value }))}
            />
          </div>
          <div className={`grid gap-5 ${isEdit ? "md:grid-cols-1" : "md:grid-cols-2"}`}>
            <FieldError error={errors.email}>
              <Input
                label="البريد الإلكتروني"
                placeholder="البريد الإلكتروني"
                name="email"
                value={form.email}
                onChange={(event) => setForm((previous) => ({ ...previous, email: event.target.value }))}
              />
            </FieldError>
            {!isEdit && (
              <FieldError error={errors.password}>
                <Input
                  label="كلمة المرور"
                  placeholder="كلمة المرور"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={(event) => setForm((previous) => ({ ...previous, password: event.target.value }))}
                />
              </FieldError>
            )}
          </div>
          <div className="space-y-2">
            <label className="block font-bold text-gray-700">رقم الهاتف</label>
            <PhoneInput
              international={false}
              defaultCountry="EG"
              value={form.phone}
              onChange={(value) => {
                const phone = value || "";
                const parsedPhone = parsePhoneNumberFromString(phone);
                setForm((previous) => ({ ...previous, phone, countryCode: parsedPhone ? `+${parsedPhone.countryCallingCode}` : "" }));
              }}
              className="h-13.75! rounded-xl!"
            />
            {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
          </div>
        </div>
      </div>
      <div className="flex justify-end">
        <Button
          text={isEdit ? "حفظ تعديل المورد" : "إضافة المورد"}
          onClick={saveSupplier}
          loading={creating || updating}
        />
      </div>
      <InlineCreateDropdownModal
        config={createConfig}
        onClose={() => setCreateConfig(null)}
      />
    </div>
  );
}

function FieldError({ children, error }: { children: ReactNode; error?: string }) {
  return <div>{children}{error && <p className="mt-1 text-sm text-red-500">{error}</p>}</div>;
}
