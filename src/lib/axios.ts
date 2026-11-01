import { navigate } from "@/utils/navigate";
import axios from "axios";
import { deleteCookie, getCookie } from "cookies-next";
import { toast } from "sonner";

// `silent: true` on a request skips the error toast, for background requests
// such as notification polling that would otherwise toast every interval.
declare module "axios" {
  interface AxiosRequestConfig {
    silent?: boolean;
  }
}

let isLoggingOut = false;

const instance = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL}/api/`,
  headers: {
    Accept: "application/json",
  },
  withCredentials: true,
});

// =========================
// Request Interceptor
// =========================
instance.interceptors.request.use(
  (config) => {
    const token = getCookie("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const lang = getCookie("NEXT_LOCALE") || "en";
    config.headers["Accept-Language"] = lang;

    return config;
  },
  (error) => Promise.reject(error),
);

// =========================
// Response Interceptor
// =========================
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;

      const isLoginRequest = error.config?.url?.includes("/login");

      if (status === 401 && !isLoginRequest) {
        if (isLoggingOut) return Promise.reject(error);

        isLoggingOut = true;

        deleteCookie("token");
        deleteCookie("user");

        navigate("/login");

        return Promise.reject(error);
      }

      if (error.config?.silent) return Promise.reject(error);

      const message =
        error.response?.data?.title ||
        error.response?.data?.message ||
        "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى لاحقًا.";

      toast.error(message);
    } else {
      toast.error("حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى لاحقًا.");
    }

    return Promise.reject(error);
  },
);

export default instance;
