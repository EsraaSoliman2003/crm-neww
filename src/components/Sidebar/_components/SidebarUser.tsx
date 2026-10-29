"use client";
import { LogOut } from "lucide-react";
import { useLogout } from "@/hooks/useLogout";
import { useAppSelector } from "@/rtk/hooks";
import { cn } from "@/utils/cn";

interface Props {
  icon?: boolean;
}

export default function SidebarUser({ icon = false }: Props) {
  const { logoutLoading } = useAppSelector((s) => s.auth);
  const logout = useLogout();
  return (
    <div className={cn(!icon && "p-4 mt-4 mb-20 lg:mb-0")}>
      <div
        className={cn(
          !icon &&
            "mt-4 space-y-3 rounded-[24px] border border-white/10 bg-white/[0.06] p-3 shadow-[0_18px_35px_rgba(15,23,42,0.18)] backdrop-blur-sm"
        )}
      >
        <button
          onClick={logout}
          className={cn(
            icon
              ? ""
              : "flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-300/15 bg-gradient-to-r from-rose-500/18 to-orange-400/12 px-4 py-3 text-sm font-semibold text-rose-50 transition hover:border-rose-200/30 hover:from-rose-500/24 hover:to-orange-400/18 disabled:cursor-not-allowed disabled:opacity-50",
          )}
          disabled={logoutLoading}
        >
          {!icon ? (
            <>
              تسجيل الخروج
              <LogOut />
            </>
          ) : (
            <LogOut className="text-red-600 rotate-180" />
          )}
        </button>
      </div>
    </div>
  );
}
