"use client";

import { X } from "lucide-react";
import { type ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";

type Props = {
  title: string;
  description: string;
  children: ReactNode;
  onClose: () => void;
};

export default function QuickCreateModal({
  title,
  description,
  children,
  onClose,
}: Props) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-99999 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="scrollbar-hide max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-gray-100 bg-white px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
            <p className="mt-1 text-sm text-gray-500">{description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition hover:bg-red-50 hover:text-red-600"
            aria-label="إغلاق"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
