"use client";

import Link from "next/link";
import {
  Blocks,
  BriefcaseBusiness,
  Building2,
  Calculator,
  ClipboardCheck,
  Factory,
  FileSpreadsheet,
  Files,
  FlaskConical,
  Home,
  Package,
  PackagePlus,
  PackageCheck,
  Ruler,
  Users,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import React from "react";

function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(" ");
}

type GroupKey = "main" | "catalog" | "partners" | "portal";

type MenuItem = {
  name: string;
  icon: React.ReactNode;
  path: string;
  key: GroupKey;
};

const groupStyles: Record<
  GroupKey,
  {
    label: string;
    section: string;
    badge: string;
    item: string;
    itemActive: string;
    icon: string;
    iconActive: string;
  }
> = {
  main: {
    label: "التشغيل والمتابعة",
    section:
      "border border-rose-400/20 bg-gradient-to-br from-rose-500/[0.18] via-red-400/[0.08] to-transparent",
    badge: "border border-rose-300/25 bg-rose-400/10 text-rose-50",
    item: "border-white/[0.06] text-slate-100 hover:border-rose-300/30 hover:bg-rose-400/12 hover:text-white",
    itemActive:
      "border-rose-300/40 bg-gradient-to-r from-rose-500/[0.24] to-red-400/[0.12] text-white shadow-[0_14px_28px_rgba(244,63,94,0.2)]",
    icon: "bg-rose-300/[0.12] text-rose-50 ring-1 ring-rose-200/10",
    iconActive: "bg-rose-300/[0.18] text-rose-50 ring-rose-200/20",
  },
  catalog: {
    label: "التسعير والتحليل",
    section:
      "border border-red-400/18 bg-gradient-to-br from-red-500/[0.16] via-rose-400/[0.08] to-transparent",
    badge: "border border-red-300/25 bg-red-400/10 text-red-50",
    item: "border-white/[0.06] text-slate-100 hover:border-red-300/30 hover:bg-red-400/12 hover:text-white",
    itemActive:
      "border-red-300/40 bg-gradient-to-r from-red-500/[0.24] to-rose-400/[0.12] text-white shadow-[0_14px_28px_rgba(239,68,68,0.2)]",
    icon: "bg-red-300/[0.12] text-red-50 ring-1 ring-red-200/10",
    iconActive: "bg-red-300/[0.18] text-red-50 ring-red-200/20",
  },
  partners: {
    label: "الأطراف والجهات",
    section:
      "border border-pink-400/18 bg-gradient-to-br from-pink-500/[0.16] via-rose-400/[0.08] to-transparent",
    badge: "border border-pink-300/25 bg-pink-400/10 text-pink-50",
    item: "border-white/[0.06] text-slate-100 hover:border-pink-300/30 hover:bg-pink-400/12 hover:text-white",
    itemActive:
      "border-pink-300/40 bg-gradient-to-r from-pink-500/[0.22] to-rose-400/[0.12] text-white shadow-[0_14px_28px_rgba(236,72,153,0.2)]",
    icon: "bg-pink-300/[0.12] text-pink-50 ring-1 ring-pink-200/10",
    iconActive: "bg-pink-300/[0.18] text-pink-50 ring-pink-200/20",
  },
  portal: {
    label: "الوصول السريع",
    section:
      "border border-rose-300/15 bg-gradient-to-br from-rose-500/[0.1] to-white/[0.04]",
    badge: "border border-rose-300/20 bg-rose-400/[0.08] text-rose-50",
    item: "border-white/[0.06] text-slate-100 hover:border-rose-300/25 hover:bg-rose-400/10 hover:text-white",
    itemActive:
      "border-rose-300/30 bg-rose-400/[0.14] text-white shadow-[0_14px_28px_rgba(190,24,93,0.18)]",
      icon: "bg-rose-300/[0.12] text-rose-50 ring-1 ring-rose-200/10",
    iconActive: "bg-rose-300/[0.18] text-white ring-rose-200/20",
  },
};

function isPathActive(pathname: string, itemPath: string) {
  if (itemPath === "/") return pathname === "/";
  if (
    itemPath === "/supplier" ||
    itemPath === "/company" ||
    itemPath === "/supplier/material"
  ) {
    return pathname === itemPath;
  }
  return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
}

function renderGroupedItems(
  items: MenuItem[],
  pathname: string,
  onNavigateAction: () => void
) {
  const orderedGroups: GroupKey[] = ["main", "catalog", "partners", "portal"];

  return orderedGroups
    .map((groupKey) => {
      const groupItems = items.filter((item) => item.key === groupKey);
      if (!groupItems.length) return null;

      const group = groupStyles[groupKey];

      return (
        <section
          key={groupKey}
          className={cn(
            "mb-4 rounded-[26px] px-3 py-3 backdrop-blur-sm",
            group.section
          )}
        >
          <div className="mb-3 flex items-center justify-between px-2">
            <h3 className="text-xs font-bold tracking-[0.18em] text-white/80">
              {group.label}
            </h3>
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-[10px] font-semibold",
                group.badge
              )}
            >
              {groupItems.length}
            </span>
          </div>

          <div className="space-y-2">
            {groupItems.map((item) => {
              const active = isPathActive(pathname, item.path);

              return (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={onNavigateAction}
                  className={cn(
                    "group flex w-full items-center gap-3 rounded-2xl border px-3 py-3 transition duration-200",
                    active ? group.itemActive : group.item
                  )}
                >
                  <span
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition",
                      active ? group.iconActive : group.icon
                    )}
                  >
                    {item.icon}
                  </span>

                  <span className="font-medium leading-5">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </section>
      );
    })
    .filter(Boolean);
}

export default function SidebarMenu({
  pathname,
  onNavigateAction,
}: {
  pathname: string;
  onNavigateAction: () => void;
}) {
  const { role } = useAuth();

  const adminItems: MenuItem[] = [
    {
      name: "الرئيسية",
      icon: <Home size={20} />,
      path: "/",
      key: "main",
    },
    {
      name: "إدارة الطلبات",
      icon: <ClipboardCheck size={20} />,
      path: "/request-management",
      key: "main",
    },
    {
      name: "المشاريع",
      icon: <BriefcaseBusiness size={20} />,
      path: "/projects",
      key: "main",
    },
    {
      name: "المقايسات",
      icon: <FileSpreadsheet size={20} />,
      path: "/estimates",
      key: "main",
    },
    {
      name: "البنود",
      icon: <Files size={20} />,
      path: "/items",
      key: "catalog",
    },
    {
      name: "التصنيفات",
      icon: <Blocks size={20} />,
      path: "/categories",
      key: "catalog",
    },
    {
      name: "الوحدات",
      icon: <Ruler size={20} />,
      path: "/units",
      key: "catalog",
    },
    {
      name: "الخامات",
      icon: <Package size={20} />,
      path: "/material",
      key: "catalog",
    },
    {
      name: "الاختبارات",
      icon: <FlaskConical size={20} />,
      path: "/tests",
      key: "catalog",
    },
    {
      name: "النسبة المضافة",
      icon: <Calculator size={20} />,
      path: "/added-percentage",
      key: "catalog",
    },
    {
      name: "اليوميات",
      icon: <ClipboardCheck size={20} />,
      path: "/daily",
      key: "catalog",
    },
    {
      name: "المصنعيات",
      icon: <Factory size={20} />,
      path: "/manufacturers",
      key: "catalog",
    },
    {
      name: "الشركات",
      icon: <Building2 size={20} />,
      path: "/companies",
      key: "partners",
    },
    {
      name: "الموظفين",
      icon: <Users size={20} />,
      path: "/employees",
      key: "partners",
    },
    {
      name: "الموردين",
      icon: <Users size={20} />,
      path: "/suppliers",
      key: "partners",
    },
    {
      name: "اعتماد خامات الموردين",
      icon: <PackageCheck size={20} />,
      path: "/unapproved-materials",
      key: "partners",
    },
  ];

  const employeeItems: MenuItem[] = [
    {
      name: "الرئيسية",
      icon: <Home size={20} />,
      path: "/",
      key: "main",
    },
    {
      name: "المشاريع",
      icon: <BriefcaseBusiness size={20} />,
      path: "/projects",
      key: "main",
    },
    {
      name: "المقايسات",
      icon: <FileSpreadsheet size={20} />,
      path: "/estimates",
      key: "main",
    },
    {
      name: "البنود",
      icon: <Files size={20} />,
      path: "/items",
      key: "catalog",
    },
    {
      name: "التصنيفات",
      icon: <Blocks size={20} />,
      path: "/categories",
      key: "catalog",
    },
    {
      name: "الوحدات",
      icon: <Ruler size={20} />,
      path: "/units",
      key: "catalog",
    },
    {
      name: "الخامات",
      icon: <Package size={20} />,
      path: "/material",
      key: "catalog",
    },
    {
      name: "الاختبارات",
      icon: <FlaskConical size={20} />,
      path: "/tests",
      key: "catalog",
    },
    {
      name: "النسبة المضافة",
      icon: <Calculator size={20} />,
      path: "/added-percentage",
      key: "catalog",
    },
    {
      name: "اليوميات",
      icon: <ClipboardCheck size={20} />,
      path: "/daily",
      key: "catalog",
    },
    {
      name: "المصنعيات",
      icon: <Factory size={20} />,
      path: "/manufacturers",
      key: "catalog",
    },
  ];

  const supplierItems: MenuItem[] = [
    {
      name: "الرئيسية",
      icon: <Home size={20} />,
      path: "/supplier",
      key: "portal",
    },
    {
      name: "الخامات",
      icon: <Package size={20} />,
      path: "/supplier/material",
      key: "portal",
    },
    {
      name: "إضافة خامة",
      icon: <PackagePlus size={20} />,
      path: "/supplier/material/add-material",
      key: "portal",
    },
  ];

  const companyItems: MenuItem[] = [
    {
      name: "الرئيسية",
      icon: <Home size={20} />,
      path: "/company",
      key: "portal",
    },
    {
      name: "المقايسات",
      icon: <FileSpreadsheet size={20} />,
      path: "/company/estimates",
      key: "portal",
    },
  ];

  const items: MenuItem[] = [
    ...(role?.includes("ADMIN") ? adminItems : []),
    ...(role?.includes("EMPLOYEE") ? employeeItems : []),
    ...(role?.includes("SUPPLIER") ? supplierItems : []),
    ...(role?.includes("COMPANY") ? companyItems : []),
  ];

  return (
    <nav className="flex-1 px-3 pb-2">
      {renderGroupedItems(items, pathname, onNavigateAction)}
    </nav>
  );
}
