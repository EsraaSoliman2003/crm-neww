"use client";

import Link from "next/link";
import { LoaderCircle } from "lucide-react";
import React from "react";

type ButtonBase = {
  text: string;
  className?: string;
  disabled?: boolean;
  border?: boolean;
  loading?: boolean;
};

type ButtonAsLink = ButtonBase & {
  href: string;
  onClick?: never;
};

type ButtonAsButton = ButtonBase & {
  onClick: () => void;
  href?: never;
};

type Props = ButtonAsLink | ButtonAsButton;

export default function Button(props: Props) {
  const isDisabled = props.disabled || props.loading;

  const baseStyle = `
    inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg px-4 py-2
    text-sm font-bold shadow-sm transition duration-200 ease-in-out
    ${
      isDisabled
        ? "pointer-events-none cursor-not-allowed border border-gray-200 bg-gray-100 text-gray-400 shadow-none"
        : props.border
          ? "border border-[#bf0200] bg-white text-[#bf0200]! hover:bg-red-50"
          : "border border-[#bf0200] bg-[#bf0200] text-white hover:bg-[#9f0200] hover:shadow-md"
    }
    ${props.className || ""}
  `;

  const content = props.loading ? (
    <>
      <LoaderCircle size={15} className="animate-spin" />
      جاري الحفظ...
    </>
  ) : (
    props.text
  );

  if ("onClick" in props) {
    return (
      <button
        type="button"
        onClick={props.onClick}
        disabled={isDisabled}
        className={baseStyle}
      >
        {content}
      </button>
    );
  }

  if (isDisabled) {
    return (
      <span className={baseStyle} aria-disabled="true">
        {content}
      </span>
    );
  }

  return (
    <Link href={props.href} className={baseStyle}>
      {content}
    </Link>
  );
}