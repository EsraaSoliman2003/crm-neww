"use client";

import { closeX, menu } from "@/assets";
import { useAppDispatch, useAppSelector } from "@/rtk/hooks";
import { toggle } from "@/rtk/slices/openMenu";
import Image from "next/image";

const BtnMenu = () => {
  const dispatch = useAppDispatch();
  const status = useAppSelector((state) => state.menu.value);

  const image = status ? closeX : menu;

  return (
    <button
      type="button"
      className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.08] shadow-[0_10px_24px_rgba(0,0,0,0.18)] transition hover:bg-white/[0.14]"
      onClick={() => dispatch(toggle())}
    >
      <Image
        src={image}
        alt="menu icon"
        fill
        loading="lazy"
        className="scale-[0.55] object-contain"
        sizes="44px"
      />
    </button>
  );
};

export default BtnMenu;
