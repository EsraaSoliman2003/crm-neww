"use client";

import { useAuth } from "@/context/AuthContext";
import { cn } from "@/utils/cn";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface Option {
  value: string;
  label: string;
  renderLabel?: React.ReactNode;
}

interface DropdownProps {
  options: Option[];
  placeholder?: string;
  onSelect: (value: Option) => void;
  className?: string;
  selected?: string;
  loading?: boolean;
  showLabel?: boolean;
  label?: string;
  disabled?: boolean;
  link?: string;
  linkText?: string;
  linkType?: string;
  onAdd?: () => void;
}

type MenuPosition = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
};

const toSafeLower = (value: unknown) =>
  String(value ?? "").trim().toLocaleLowerCase("ar");

export default function Dropdown({
  options,
  placeholder = "Select",
  onSelect,
  className,
  selected,
  loading = false,
  showLabel = true,
  label,
  disabled = false,
  link,
  linkText,
  linkType = "link",
  onAdd,
}: DropdownProps) {
  const { role } = useAuth();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter((opt) =>
    toSafeLower(opt?.label).includes(toSafeLower(search)),
  );

  const updateMenuPosition = () => {
    if (!triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const viewportPadding = 8;
    const estimatedMenuHeight = menuRef.current?.offsetHeight || 340;
    const spaceBelow = window.innerHeight - rect.bottom - viewportPadding;
    const spaceAbove = rect.top - viewportPadding;
    const openAbove = spaceBelow < Math.min(estimatedMenuHeight, 240) && spaceAbove > spaceBelow;
    const maxHeight = Math.max(
      160,
      Math.min(estimatedMenuHeight, openAbove ? spaceAbove : spaceBelow),
    );

    setMenuPosition({
      top: openAbove
        ? Math.max(viewportPadding, rect.top - Math.min(estimatedMenuHeight, maxHeight) - 8)
        : rect.bottom + 8,
      left: rect.left,
      width: rect.width,
      maxHeight,
    });
  };

  const closeMenu = () => {
    setOpen(false);
    setSearch("");
  };

  const handleSelect = (value: Option) => {
    onSelect(value);
    closeMenu();
  };

  const handleAdd = () => {
    closeMenu();
    onAdd?.();
  };

  useLayoutEffect(() => {
    if (!open) return;

    updateMenuPosition();
    const animationFrame = window.requestAnimationFrame(updateMenuPosition);

    return () => window.cancelAnimationFrame(animationFrame);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      const insideWrapper = wrapperRef.current?.contains(target);
      const insideMenu = menuRef.current?.contains(target);

      if (!insideWrapper && !insideMenu) {
        closeMenu();
      }
    };

    const handleReposition = () => updateMenuPosition();

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [open]);

  const selectedLabel = options.find((opt) => opt.value === selected)?.label;

  if (loading) {
    return (
      <div className="space-y-2 text-right">
        {label && <label className="font-bold">{label}</label>}
        <div className="mt-3 h-13.75 w-full animate-pulse rounded-md bg-gray-100" />
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className={`relative space-y-2 ${className}`}>
      {showLabel && label && (
        <label className="mb-3 block font-bold text-gray-700">{label}</label>
      )}

      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "flex h-13.75 w-full items-center justify-between rounded-2xl border border-rose-100 bg-white px-4 text-sm outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100",
          open && "border-rose-300 ring-4 ring-rose-100",
          disabled && "cursor-not-allowed bg-gray-100 text-gray-400",
        )}
      >
        <span
          className={cn(
            "text-sm",
            selectedLabel ? "text-gray-800" : "text-gray-400",
          )}
        >
          {selectedLabel || placeholder}
        </span>

        <ChevronDown
          width={16}
          className={`text-gray-500 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {typeof document !== "undefined" &&
        open &&
        menuPosition &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed z-100001 flex flex-col overflow-hidden rounded-2xl border border-rose-100 bg-white shadow-xl shadow-rose-900/15"
            style={{
              top: menuPosition.top,
              left: menuPosition.left,
              width: menuPosition.width,
              maxHeight: menuPosition.maxHeight,
            }}
          >
            <div className="border-b border-rose-100 bg-rose-50/40 p-2">
              <input
                type="text"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                placeholder={"\u0628\u062d\u062b"}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-11 w-full rounded-xl border border-rose-100 bg-white px-3 text-sm outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
              />
            </div>

            <div className="hide-scrollbar min-h-0 flex-1 overflow-y-auto">
              {filteredOptions.length === 0 ? (
                <div className="px-4 py-3 text-center text-sm text-gray-400">
                  {"\u0644\u0627 \u064a\u0648\u062c\u062f"}
                </div>
              ) : (
                filteredOptions.map((item) => (
                  <div
                    key={item.value}
                    onClick={() => handleSelect(item)}
                    className="cursor-pointer px-4 py-3 text-sm transition hover:bg-rose-50"
                  >
                    {item.renderLabel || item.label}
                  </div>
                ))
              )}
            </div>

            {role?.includes("ADMIN") &&
              linkText &&
              (linkType === "link" ? (
                <Link
                  href={link || ""}
                  className="block border-t border-rose-100 bg-rose-50 px-4 py-3 text-end text-sm text-[#bf0200] transition hover:bg-rose-100"
                  onClick={closeMenu}
                >
                  {linkText}
                </Link>
              ) : (
                onAdd && (
                  <button
                    type="button"
                    className="sticky bottom-0 block w-full border-t border-rose-100 bg-rose-50 px-4 py-3 text-end text-sm text-[#bf0200] transition hover:bg-rose-100"
                    onClick={handleAdd}
                  >
                    {linkText}
                  </button>
                )
              ))}
          </div>,
          document.body,
        )}
    </div>
  );
}
