"use client";

import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { setCookie } from "cookies-next";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useAppDispatch, useAppSelector } from "@/rtk/hooks";
import { loginUser } from "@/rtk/slices/authSlice";
import { getLoginSchema, LoginSchemaType } from "@/validation/loginSchema";
import { useAuth } from "@/context/AuthContext";

export const useLoginForm = () => {
  const t = useTranslations();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { setToken, setRole, setUser } = useAuth();

  const { loading } = useAppSelector((state) => state.auth);

  const loginSchema = getLoginSchema(t);

  const form = useForm<LoginSchemaType>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
  });

  const onSubmit: SubmitHandler<LoginSchemaType> = async (data) => {
    try {
      const resultAction = await dispatch(loginUser(data));
      if (loginUser.fulfilled.match(resultAction)) {
        const { user, token, roles } = resultAction.payload;

        setCookie("token", token, { maxAge: 60 * 60 * 24 * 7, path: "/" });
        setCookie("user", JSON.stringify(user), {
          maxAge: 60 * 60 * 24 * 7,
          path: "/",
        });
        setCookie("roles", JSON.stringify(roles), {
          maxAge: 60 * 60 * 24 * 7,
          path: "/",
        });

        setToken(token);
        setRole(roles);
        setUser(user);
        toast.success("تم تسجيل الدخول بنجاح", { id: "login-success" });
        if (roles.includes("ADMIN")) {
          router.replace("/");
        } else if (roles.includes("SUPPLIER")) {
          router.replace("/supplier");
        } else if (roles.includes("COMPANY")) {
          router.replace("/company");
        } else if (roles.includes("EMPLOYEE")) {
          router.replace("/");
        } else {
          router.replace("/login");
        }
      } else {
        console.log("Invalid credentials");
      }
    } catch {
      console.log("An unexpected error occurred");
    }
  };

  return {
    ...form,
    onSubmit,
    loading,
    t,
  };
};
