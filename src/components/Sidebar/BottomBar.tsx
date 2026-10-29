"use client";

import Link from "next/link";
import {
  Home,
  Users,
  Box,
  FlaskConical,
  Calculator,
  FileText,
  Building2,
  ClipboardList,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import React from "react";

function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(" ");
}

type MenuItem = {
  name: string;
  icon: React.ReactNode;
  path: string;
};

export default function BottomBar({ pathname }: { pathname: string }) {
  const { role } = useAuth();

  const items: MenuItem[] = [
    ...(role?.includes("ADMIN")
      ? [
          {
            name: "الرئيسية",
            icon: <Home className="text-xl" />,
            path: "/",
          },
          {
            name: "إدارة الطلبات",
            icon: <Home className="text-xl" />,
            path: "/request-management",
          },
          {
            name: "المشاريع",
            icon: <ClipboardList className="text-xl" />,
            path: "/projects",
          },
          {
            name: "المقايسات",
            icon: <ClipboardList className="text-xl" />,
            path: "/estimates",
          },
          {
            name: "التصنيفات",
            icon: <ClipboardList className="text-xl" />,
            path: "/categories",
          },
          {
            name: "الوحدات",
            icon: <ClipboardList className="text-xl" />,
            path: "/units",
          },
          {
            name: "الشركات",
            icon: <Users className="text-xl" />,
            path: "/companies",
          },
          {
            name: "الموظفين",
            icon: <Users className="text-xl" />,
            path: "/employees",
          },
          {
            name: "الموردين",
            icon: <Users className="text-xl" />,
            path: "/suppliers",
          },
          {
            name: "اعتماد خامات الموردين",
            icon: <Box className="text-xl" />,
            path: "/unapproved-materials",
          },
          {
            name: "الخامات",
            icon: <Box className="text-xl" />,
            path: "/material",
          },
          {
            name: "أسعار الموردين للخامات",
            icon: <Box className="text-xl" />,
            path: "/SuppliersPricesForMaterials",
          },
          {
            name: "الاختبارات",
            icon: <FlaskConical className="text-xl" />,
            path: "/tests",
          },
          {
            name: "النسبة المضافة",
            icon: <Calculator className="text-xl" />,
            path: "/added-percentage",
          },
          {
            name: "اليوميات",
            icon: <ClipboardList className="text-xl" />,
            path: "/daily",
          },
          {
            name: "المصنعيات",
            icon: <Building2 className="text-xl" />,
            path: "/manufacturers",
          },
          {
            name: "البنود",
            icon: <FileText className="text-xl" />,
            path: "/items",
          },
        ]
      : []),
    ...(role?.includes("EMPLOYEE")
      ? [
          {
            name: "الخامات",
            icon: <Box className="text-xl" />,
            path: "/material",
          },
          {
            name: "الاختبارات",
            icon: <FlaskConical className="text-xl" />,
            path: "/tests",
          },
          {
            name: "اليوميات",
            icon: <ClipboardList className="text-xl" />,
            path: "/daily",
          },
          {
            name: "المصنعيات",
            icon: <Building2 className="text-xl" />,
            path: "/manufacturers",
          },
          {
            name: "النسبة المضافة",
            icon: <Calculator className="text-xl" />,
            path: "/added-percentage",
          },
          {
            name: "المقايسات",
            icon: <ClipboardList className="text-xl" />,
            path: "/estimates",
          },
          {
            name: "المشاريع",
            icon: <ClipboardList className="text-xl" />,
            path: "/projects",
          },
        ]
      : []),

    ...(role?.includes("SUPPLIER")
      ? [
          {
            name: "الرئيسية",
            icon: <Home className="text-xl" />,
            path: "/supplier",
          },
          {
            name: "الخامات",
            icon: <Box className="text-xl" />,
            path: "/supplier/material",
          },
        ]
      : []),

    ...(role?.includes("COMPANY")
      ? [
          {
            name: "الرئيسية",
            icon: <Home className="text-xl" />,
            path: "/company",
          },
          {
            name: "المقايسات",
            icon: <Box className="text-xl" />,
            path: "/company/estimates",
          },
        ]
      : []),
  ];

  return (
 <div className="fixed bottom-0 left-0 z-50 w-full bg-gray-700 border-t border-white/10 shadow-[0_-4px_10px_rgba(0,0,0,0.2)]">
  <div className="flex gap-2 p-2 overflow-x-auto touch-pan-x">
    {items.map((item) => {
      const isActive = pathname === item.path;

      return (
        <Link
          key={item.path}
          href={item.path}
          className={cn(
            "flex-1 min-w-fit px-4 py-2 text-sm text-center whitespace-nowrap rounded-md transition",
            isActive
              ? "bg-gray-600 text-white"
              : "text-gray-300 hover:bg-gray-600/40"
          )}
        >
          {item.name}
        </Link>
      );
    })}
  </div>
</div>
  );
}
