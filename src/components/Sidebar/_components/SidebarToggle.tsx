"use client";

import { useAppDispatch } from "@/rtk/hooks";
import { setTrue } from "@/rtk/slices/openMenu";
import { Menu } from "lucide-react";
import { brandMark } from "@/assets";
import Image from "next/image";
import Link from "next/link";

export default function SidebarToggle() {
  const dispatch = useAppDispatch();

  return (
    <div
      className="
        lg:hidden fixed top-0
        flex items-center justify-between
        w-full px-4 py-3
        bg-white/80 backdrop-blur
        border-b border-gray-100
        z-50 bg-dark
      "
    >
      {/* Title */}
      <Link href={"/"}>
        <div className="flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/8 px-2.5 py-2 shadow-[0_12px_24px_rgba(0,0,0,0.14)]">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white ring-1 ring-slate-100/80">
            <Image
              src={brandMark}
              alt="Construction Pricing"
              width={40}
              height={40}
              className="h-8 w-8 object-contain"
            />
          </div>
          <div className="leading-none text-left">
            <p className="text-[0.6rem] font-semibold uppercase tracking-[0.28em] text-white/55">
              Construction
            </p>
            <p className="mt-1 text-sm font-extrabold text-white">Pricing</p>
          </div>
        </div>
      </Link>

      {/* Button */}
      <button
        onClick={() => dispatch(setTrue())}
        className="rounded-xl p-2 transition hover:bg-white/10"
      >
        <Menu size={22} className="text-white" />
      </button>
    </div>
  );
}
