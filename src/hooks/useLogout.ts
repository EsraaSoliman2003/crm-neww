"use client";

import { deleteCookie } from "cookies-next";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/rtk/hooks";
import { logoutUser } from "@/rtk/slices/authSlice";
import { useAuth } from "@/context/AuthContext";
import { setFalse } from "@/rtk/slices/openMenu";

export const useLogout = () => {
  const router = useRouter();
  const { setToken, setRole, setUser } = useAuth();
  const dispatch = useAppDispatch();

  const logout = async () => {
    try {
      await dispatch(logoutUser());
    } catch (error) {
      console.log(error);
    } finally {
      deleteCookie("roles");
      deleteCookie("token");
      deleteCookie("user");

      setToken(null);
      setRole(null);
      setUser(null);
      router.replace("/login");
      dispatch(setFalse());
    }
  };

  return logout;
};
