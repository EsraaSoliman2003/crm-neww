import { z } from "zod";
import { isValidPhoneNumber } from "react-phone-number-input";

export const getRegisterSchema = (t: (key: string) => string) => {
  void t;

  return z
    .object({
      fullName: z
        .string()
        .min(5, { message: "الاسم يجب أن يكون 3 أحرف على الأقل" }),

      email: z.string().email({ message: "من فضلك أدخل بريد إلكتروني صحيح" }),

      phone: z
        .string()
        .min(1, { message: "رقم الهاتف مطلوب" })
        .refine((val) => isValidPhoneNumber(val), {
          message: "رقم الموبايل غير صحيح",
        }),

      password: z
        .string()
        .min(8, { message: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" })
        .regex(/[a-z]/, {
          message: "كلمة المرور يجب أن تحتوي على حرف صغير واحد على الأقل",
        })
        .regex(/[A-Z]/, {
          message: "كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل",
        })
        .regex(/[^a-zA-Z0-9]/, {
          message: "كلمة المرور يجب أن تحتوي على رمز خاص واحد على الأقل",
        }),

      confirmPassword: z.string().min(1, { message: "الحقل مطلوب" }),

      role: z.enum(["SUPPLIER", "COMPANY", "EMPLOYEE"], {
        message: "من فضلك اختر نوع الحساب",
      }),

      images: z.array(z.any()).optional(),
    })

    .superRefine((data, ctx) => {
      if (
        data.role !== "EMPLOYEE" &&
        (!data.images || data.images.length === 0)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["images"],
          message: "يجب رفع صورة واحدة على الأقل",
        });
      }
    })

    .refine((data) => data.password === data.confirmPassword, {
      message: "كلمتا المرور غير متطابقتين",
      path: ["confirmPassword"],
    });
};

export type RegisterSchemaType = z.infer<
  ReturnType<typeof getRegisterSchema>
>;
