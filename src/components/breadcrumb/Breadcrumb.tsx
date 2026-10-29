"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import instance from "@/lib/axios";

const routeNames: Record<string, string> = {
  dashboard: "لوحة التحكم",
  categories: "التصنيفات",
  products: "المنتجات",
  orders: "الطلبات",
  settings: "الإعدادات",
  "add-category": "إضافة تصنيف",
  "add-estimate-to-company": "ربط المقايسات بالشركات",
  estimates: "المقايسات",
  "add-estimate": "اضافة مقايسة",
  companies: "الشركات",
  "add-company": "اضافة شركة",
  "request-management": "إدارة الطلبات",
  projects: "المشاريع",
  "add-project": "اضافة مشروع",
  units: "الوحدات",
  "add-unit": "اضافة وحدة",
  suppliers: "الموردين",
  employees: "الموظفين",
  "unapproved-materials": "اعتماد خامات الموردين",
  "add-supplier": "اضافة مورد",
  subcategories: "التصنيفات",
  "add-subcategory": "اضافة تصنيف فرعي",
  material: "الخامات",
  "add-material": "اضافة خامة",
  SuppliersPricesForMaterials: "أسعار الموردين للخامات",
  tests: "الاختبارات",
  "add-test": "اضافة اختبار",
  "added-percentage": "أرباح وضرائب واستقطاعات",
  "rate-categories": "تصنيفات النسب",
  "add-percentage": "اضافة نسبة",
  daily: "اليوميات",
  items: "البنود",
  manufacturers: "المصنعيات",
  "add-daily": "اضافة يومية",
  "add-manufacturer": "اضافة مصنعية",
  "add-item": "اضافة بند",
  analyze: "تحليل",
  "add-material-to-suppliers": "اضافة خامات لموردين",
  "create-similar": "إضافة بند شبيه",
  edit: "تعديل",
};

const detailEndpoints: Record<string, (id: string) => string> = {
  categories: (id) => `/Category/${id}`,
  estimates: (id) => `/Estimate/${id}`,
  items: (id) => `/Item/${id}`,
  projects: (id) => `/Project/${id}`,
  companies: (id) => `/Profile/GetProfile/${id}`,
  suppliers: (id) => `/Profile/GetProfile/${id}`,
  "request-management": (id) => `/Admin/GetUserDetails/${id}`,
};

const getEntityName = (data: Record<string, unknown>) => {
  const value =
    data.name ??
    data.fullName ??
    data.companyName ??
    data.supplierName ??
    data.title;

  return typeof value === "string" && value.trim() ? value : null;
};

export default function Breadcrumb() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const paths = pathname.split("/").filter(Boolean);
  const [dynamicNames, setDynamicNames] = useState<Record<string, string>>({});

  useEffect(() => {
    let isActive = true;
    const currentPaths = pathname.split("/").filter(Boolean);

    const loadDynamicNames = async () => {
      const numericPaths = currentPaths
        .map((path, index) => ({ path, index }))
        .filter(({ path, index }) => /^\d+$/.test(path) && index > 0);

      const entries = await Promise.all(
        numericPaths.map(async ({ path, index }) => {
          const parentPath = currentPaths[index - 1];
          const href = `/${currentPaths.slice(0, index + 1).join("/")}`;

          try {
            if (parentPath === "manufacturers") {
              const response = await instance.get(
                "/Manufacturing?page=1&pageSize=1000",
              );
              const entity = response.data?.items?.find(
                (item: { id?: number }) => item.id === Number(path),
              );
              const name = entity ? getEntityName(entity) : null;
              return [href, name ?? "التفاصيل"] as const;
            }

            const createEndpoint = detailEndpoints[parentPath];
            if (!createEndpoint) {
              return [href, "التفاصيل"] as const;
            }

            const response = await instance.get(createEndpoint(path));
            const name = getEntityName(response.data ?? {});
            return [href, name ?? "التفاصيل"] as const;
          } catch {
            return [href, "التفاصيل"] as const;
          }
        }),
      );

      if (isActive) {
        setDynamicNames(Object.fromEntries(entries));
      }
    };

    void loadDynamicNames();

    return () => {
      isActive = false;
    };
  }, [pathname]);

  const getPathLabel = (path: string, href: string, isLast: boolean) => {
    if (/^\d+$/.test(path)) {
      return dynamicNames[href] ?? "التفاصيل";
    }

    if (isLast && path.startsWith("add-")) {
      return searchParams.get("mode") === "edit" ? "تعديل" : "إضافة";
    }

    return routeNames[path] || path;
  };

  return (
    <div className="p-2">
      <div className="flex flex-wrap items-center gap-2 rounded-3xl border border-rose-200/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.98)_0%,rgba(255,248,249,0.96)_55%,rgba(255,241,243,0.94)_100%)] p-2 text-sm shadow-[0_18px_34px_-24px_rgba(136,19,55,0.18)] backdrop-blur-sm">
        <Link
          href="/"
          className="rounded-full px-2.5 py-1 font-semibold text-slate-700 transition hover:bg-rose-50 hover:text-rose-700"
        >
          الرئيسية
        </Link>

        {paths.map((path, index) => {
          const href = "/" + paths.slice(0, index + 1).join("/");
          const isLast = index === paths.length - 1;
          const label = getPathLabel(path, href, isLast);

          return (
            <div key={href} className="flex items-center gap-2">
              <span className="flex h-5 w-6 items-center justify-center rounded-full border border-rose-200/70 bg-white/80 shadow-sm">
                <ChevronLeft size={14} className="text-rose-500" />
              </span>

              {isLast ? (
                <span className="rounded-full bg-rose-600 px-3 py-1 font-bold text-white shadow-[0_10px_24px_-16px_rgba(190,24,93,0.55)]">
                  {label}
                </span>
              ) : (
                <Link
                  href={href}
                  className="rounded-full px-2.5 py-1 font-semibold text-slate-700 transition hover:bg-rose-50 hover:text-rose-700"
                >
                  {label}
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
