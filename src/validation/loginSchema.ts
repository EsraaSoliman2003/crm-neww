import { z } from "zod";

export const getLoginSchema = (t: (key: string) => string) => {
  void t;

  return z.object({
    email: z.string().email({ message: "البريد الإلكتروني مطلوب" }),
    password: z.string().min(1, { message: "كلمة السر مطلوبة" }),
  });
};

export type LoginSchemaType = z.infer<ReturnType<typeof getLoginSchema>>;