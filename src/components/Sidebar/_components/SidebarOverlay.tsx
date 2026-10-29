"use client";

import { useAppDispatch, useAppSelector } from "@/rtk/hooks";
import { setFalse } from "@/rtk/slices/openMenu";

export default function SidebarOverlay() {
  const dispatch = useAppDispatch();
  const open = useAppSelector((state) => state.menu.value);

  if (!open) return null;

  return (
    <div
      onClick={() => dispatch(setFalse())}
      className="fixed inset-0 bg-black/40 z-50"
    />
  );
}