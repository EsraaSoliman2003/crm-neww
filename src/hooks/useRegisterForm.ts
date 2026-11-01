"use client";

import { useForm, SubmitHandler, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { parsePhoneNumberFromString } from "libphonenumber-js";

import { useAppDispatch, useAppSelector } from "@/rtk/hooks";
import { registerUser } from "@/rtk/slices/authSlice";
import {
  getRegisterSchema,
  RegisterSchemaType,
} from "@/validation/registerSchema";
import { setPhoneData } from "@/rtk/slices/phoneSlice";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface UseRegisterFormReturn extends Pick<
  UseFormReturn<RegisterSchemaType>,
  "register" | "handleSubmit" | "control" | "formState" | "setValue" | "trigger" | "watch"
> {
  onSubmit: SubmitHandler<RegisterSchemaType>;
  loading: boolean;
  t: (key: string) => string;
  openRecoveryModal: boolean;
  setOpenRecoveryModal: React.Dispatch<React.SetStateAction<boolean>>;
  isSubmittedSuccessfully: boolean;
}

export const useRegisterForm = (
  setEmailForRecovery?: (email: string) => void,
): UseRegisterFormReturn => {
  const t = useTranslations();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [isSubmittedSuccessfully, setIsSubmittedSuccessfully] = useState(false);
  const [openRecoveryModal, setOpenRecoveryModal] = useState(false);

  const loading = useAppSelector((state) => state.auth.loading);

  const registerSchema = getRegisterSchema(t);

  const form = useForm<RegisterSchemaType>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
    defaultValues: {
      phone: "",
      role: "SUPPLIER",
      images: [],
    } as Partial<RegisterSchemaType>,
  });

  const onSubmit: SubmitHandler<RegisterSchemaType> = async (data) => {
    const parsedPhone = parsePhoneNumberFromString(data.phone);

    if (!parsedPhone) {
      toast.error("رقم الهاتف غير صحيح");
      return;
    }

    dispatch(
      setPhoneData({
        phoneNumber: parsedPhone.nationalNumber,
        countryCode: parsedPhone.countryCallingCode,
      }),
    );

    const formData = new FormData();

    formData.append("FullName", data.fullName);
    formData.append("Email", data.email);
    formData.append("Password", data.password);
    formData.append("PhoneNumber", parsedPhone.nationalNumber);
    formData.append("CountryCode", `+${parsedPhone.countryCallingCode}`);

    (data.images || []).forEach((file) => {
      formData.append("Images", file);
    });

    formData.append("Role", data.role);

    try {
      const resultAction = await dispatch(registerUser(formData));

      const res:
        | { extra?: { isDeleted: boolean }; email?: string }
        | undefined = resultAction.payload as
        | { extra?: { isDeleted: boolean }; email?: string }
        | undefined;

      const isDeleted = res?.extra?.isDeleted;

      if (isDeleted) {
        setEmailForRecovery?.(res?.email ?? data.email);
        setOpenRecoveryModal(true);
        return;
      }

      if (resultAction.type.endsWith("rejected")) {
        return;
      }

      if (registerUser.fulfilled.match(resultAction)) {
        const { user, requiresPhoneVerification, otpSent } = resultAction.payload;

        // Supplier/company/engineer: verify the phone with the WhatsApp code
        // first. If the code couldn't be sent, the screen offers a resend.
        if (requiresPhoneVerification) {
          if (otpSent) {
            toast.success("تم إنشاء الحساب، أدخل رمز التحقق المرسل على واتساب");
          }
          router.push(`/verify-phone?userId=${user.id}${otpSent ? "&sent=1" : ""}`);
          return;
        }

        toast.success("تم ارسال طلب التسحيل بنجاح");
        setIsSubmittedSuccessfully(true);
        form.reset({
          phone: "",
          role: "SUPPLIER",
          images: [],
        });
      }
    } catch {}
  };

  return {
    register: form.register,
    handleSubmit: form.handleSubmit,
    control: form.control,
    formState: form.formState,
    setValue: form.setValue,
    trigger: form.trigger,
    onSubmit,
    loading,
    t,
    openRecoveryModal,
    setOpenRecoveryModal,
    isSubmittedSuccessfully,
    watch: form.watch
  };
};
