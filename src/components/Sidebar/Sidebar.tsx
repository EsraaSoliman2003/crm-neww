"use client";

import { usePathname } from "next/navigation";

import SidebarOverlay from "./_components/SidebarOverlay";
import SidebarHeader from "./_components/SidebarHeader";
import SidebarMenu from "./_components/SidebarMenu";
import SidebarUser from "./_components/SidebarUser";

import { cn } from "@/utils/cn";
import { useAppSelector, useAppDispatch } from "@/rtk/hooks";
import { setFalse } from "@/rtk/slices/openMenu";

export default function Sidebar() {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const open = useAppSelector((state) => state.menu.value);

  return (
    <>
      <SidebarOverlay />

      <aside
        className={cn(
          `
          fixed top-0 inset-s-0
          w-64 lg:w-72
          h-screen
          bg-[#18070b]
          transition-all duration-300
          z-60
          overflow-y-auto
          hide-scrollbar
          border-e border-white/10
          shadow-[0_24px_60px_rgba(2,8,23,0.48)]

          `,
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(248,113,113,0.22),_transparent_28%),linear-gradient(180deg,_#2b0d12_0%,_#17070b_42%,_#0c0406_100%)]" />
          <div className="absolute -top-16 right-[-18%] h-40 w-40 rounded-full bg-rose-400/12 blur-3xl" />
          <div className="absolute bottom-24 left-[-18%] h-40 w-40 rounded-full bg-red-500/12 blur-3xl" />
        </div>

        <div className="relative z-10 flex min-h-full flex-col">
          <SidebarHeader />

          <SidebarMenu
            pathname={pathname}
            onNavigateAction={() => dispatch(setFalse())}
          />

          <SidebarUser />
        </div>
      </aside>
    </>
  );
}
