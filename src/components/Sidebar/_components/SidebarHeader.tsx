"use client";

import Link from "next/link";
import { useAppDispatch } from "@/rtk/hooks";
import { setFalse } from "@/rtk/slices/openMenu";
import { brandMark } from "@/assets";
import Image from "next/image";

export default function SidebarHeader() {
  const dispatch = useAppDispatch();

  return (
    <div className="relative mb-6 border-b border-white/10 px-4 pb-5 pt-6">
      <div className="absolute top-0 left-5 hidden lg:block">
        {/* <button
          type="button"
          className="block h-5 w-5 text-white/80 transition hover:text-white"
          onClick={() => {
            dispatch(toggle());
          }}
        >
          <X size={22} />
        </button> */}
      </div>
      {/* Logo + Link to Home */}
      <Link
        href="/"
        onClick={() => dispatch(setFalse())}
        className="flex items-center gap-3 rounded-3xl border border-white/10 bg-white/8 px-4 py-3 shadow-[0_18px_35px_rgba(0,0,0,0.14)] backdrop-blur-sm transition hover:bg-white/12"
      >
        <div className="flex h-15 w-15 items-center justify-center rounded-2xl bg-white shadow-[0_14px_28px_rgba(15,23,42,0.18)] ring-1 ring-slate-100/80">
          <Image
            src={brandMark}
            alt="Construction Pricing"
            width={54}
            height={54}
            className="h-11 w-11 object-contain"
            priority
          />
        </div>
        <div className="min-w-0 text-left">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.34em] text-white/55">
            Construction
          </p>
          <p className="text-xl font-extrabold leading-none text-white">
            Pricing
          </p>
          <p className="mt-1 text-xs font-medium text-white/70">
            Management System
          </p>
        </div>
      </Link>
    </div>
  );
}
