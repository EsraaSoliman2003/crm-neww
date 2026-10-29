"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import {
  parsePhoneNumber,
  parsePhoneNumberFromString,
} from "libphonenumber-js";
import { toast } from "sonner";
import Button from "@/components/button/Button";
import Input from "@/components/form/Input";
import { useAppDispatch, useAppSelector } from "@/rtk/hooks";
import {
  createCompany,
  fetchCompanies,
  updateCompany,
} from "@/rtk/slices/companiesSlice";
import { validatePassword } from "@/utils/validatePassword ";

type FormState = {
  name: string;
  email: string;
  password: string;
  countryCode: string;
  phone: string;
};

const emptyForm: FormState = {
  name: "",
  email: "",
  password: "",
  countryCode: "",
  phone: "",
};

const toInternationalPhone = (phone: string, countryCode: string) => {
  if (!phone) return "";

  if (phone.startsWith("+")) {
    return phone;
  }

  const code = countryCode || "+20";

  return `${code}${phone.startsWith("0") ? phone.slice(1) : phone}`;
};

export default function CompanyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const { creating, updating, data } = useAppSelector(
    (state) => state.companies,
  );
  const isEdit = searchParams.get("mode") === "edit";
  const companyId = Number(searchParams.get("id"));
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [form, setForm] = useState<FormState>(emptyForm);

  useEffect(() => {
    if (isEdit && data.length === 0) dispatch(fetchCompanies());
  }, [data.length, dispatch, isEdit]);

  useEffect(() => {
    if (!isEdit || !companyId) return;
    const company = data.find((item) => item.id === companyId);
    if (!company) return;
    queueMicrotask(() =>
      setForm({
        name: company.companyName ?? "",
        email: company.email ?? "",
        password: "",
        countryCode: company.countryCode ?? "+20",
        phone: company.phoneNumber ?? "",
      }),
    );
  }, [companyId, data, isEdit]);

  const validate = () => {
    const nextErrors: Partial<FormState> = {};
    if (!form.name.trim()) nextErrors.name = "اسم الشركة مطلوب";
    if (!form.email.trim()) nextErrors.email = "البريد الإلكتروني مطلوب";
    if (!isEdit) {
      const passwordError = validatePassword(form.password);
      if (passwordError) nextErrors.password = passwordError;
    }
    if (!form.phone.trim()) nextErrors.phone = "رقم الهاتف مطلوب";
    const fullPhone = toInternationalPhone(form.phone, form.countryCode);

    if (form.phone && !isValidPhoneNumber(fullPhone)) {
      nextErrors.phone = "رقم الهاتف غير صحيح";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const saveCompany = async () => {
    if (!validate()) return;
    const fullPhone = toInternationalPhone(form.phone, form.countryCode);

    const parsed = parsePhoneNumber(fullPhone);
    try {
      if (isEdit) {
        await dispatch(
          updateCompany({
            id: companyId,
            companyName: form.name.trim(),
            email: form.email.trim(),
            countryCode: form.countryCode,
            phoneNumber: parsed?.nationalNumber || "",
          }),
        ).unwrap();
        toast.success("تم تعديل الشركة بنجاح");
      } else {
        await dispatch(
          createCompany({
            companyName: form.name.trim(),
            email: form.email.trim(),
            password: form.password,
            countryCode: form.countryCode,
            phoneNumber: parsed?.nationalNumber || "",
          }),
        ).unwrap();
        toast.success("تم إضافة الشركة بنجاح");
      }
      router.push("/companies");
    } catch (error) {
      console.log(error);
    }
  };

  const fullPhone = toInternationalPhone(form.phone, form.countryCode);

  const isValid = Boolean(
    form.name &&
    form.email &&
    (isEdit || form.password) &&
    form.phone &&
    isValidPhoneNumber(fullPhone),
  );

  return (
    <div className="min-h-screen space-y-6 pt-6">
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-7 border-b border-gray-100 pb-5">
          <h1 className="text-2xl font-black text-gray-900">
            {isEdit ? "تعديل بيانات الشركة" : "إضافة شركة جديدة"}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            أدخل بيانات التواصل الأساسية الخاصة بالشركة.
          </p>
        </div>
        <div className="space-y-6">
          <div>
            <Input
              label="اسم الشركة"
              name="name"
              value={form.name}
              placeholder="ادخل اسم الشركة"
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  name: event.target.value,
                }))
              }
            />
            {errors.name && <ErrorText>{errors.name}</ErrorText>}
          </div>
          <div
            className={`grid gap-5 ${isEdit ? "md:grid-cols-1" : "md:grid-cols-2"}`}
          >
            <div>
              <Input
                label="البريد الإلكتروني"
                name="email"
                value={form.email}
                placeholder="ادخل البريد الإلكتروني"
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    email: event.target.value,
                  }))
                }
              />
              {errors.email && <ErrorText>{errors.email}</ErrorText>}
            </div>
            {!isEdit && (
              <div>
                <Input
                  label="كلمة المرور"
                  name="password"
                  value={form.password}
                  placeholder="ادخل كلمة المرور"
                  type="password"
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      password: event.target.value,
                    }))
                  }
                />
                {errors.password && <ErrorText>{errors.password}</ErrorText>}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <label className="block font-bold text-gray-700">رقم الهاتف</label>
            <PhoneInput
              international={false}
              defaultCountry="EG"
              value={toInternationalPhone(form.phone, form.countryCode)}
              onChange={(value) => {
                const phone = value || "";
                const parsedPhone = parsePhoneNumberFromString(phone);

                setForm((previous) => ({
                  ...previous,
                  phone: parsedPhone?.nationalNumber || "",
                  countryCode: parsedPhone
                    ? `+${parsedPhone.countryCallingCode}`
                    : previous.countryCode,
                }));
              }}
              className="h-13.75! rounded-xl!"
            />
            {errors.phone && <ErrorText>{errors.phone}</ErrorText>}
          </div>
        </div>
      </div>
      <div className="flex justify-end">
        <Button
          text={isEdit ? "حفظ تعديل الشركة" : "إضافة الشركة"}
          onClick={saveCompany}
          disabled={!isValid}
          loading={creating || updating}
        />
      </div>
    </div>
  );
}

function ErrorText({ children }: { children: string }) {
  return <p className="mt-1 text-sm text-red-500">{children}</p>;
}
