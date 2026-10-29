"use client";

import { usePathname } from "next/navigation";
import React, { useMemo } from "react";

// Map routes to titles
const routeTitles: Record<string, string> = {
    "/": "لوحة التحكم",
    "/categories": "التصنيفات",
    "/categories/add-category": "اضافة تصنيف عام",
    "/added-percentage": "النسبة المضافة",
    "/added-percentage/rate-categories": "تصنيفات النسب",
    "/added-percentage/add-percentage": "اضافة نسبة",
    "/daily": "اليوميات",
    "/daily/add-daily": "اضافة يومية",
    "/items": "البنود",
    "/items/add-item": "اضافة بند",
    "/items/:id/analyze": "تحليل البند",
    "/manufacturers": "المصنعيات",
    "/manufacturers/add-manufacturer": "اضافة مصنعية",
    "/material": "الخامات",
    "/material/add-material": "اضافة خامة",
    "/products": "البنود",
    "/settings": "الإعدادات",
    "/suppliers": "الموردين",
    "/employees": "الموظفين",
    "/unapproved-materials": "اعتماد خامات الموردين",
    "/tests": "الإختبارات",
    "/tests/add-test": "اضافة اختبار",
    "/estimates":"المقايسات",
    "/estimates/add-estimate":"اضافة مقايسة",
    "/projects":"المشاريع",
    "/projects/add-project":"اضافة مشروع"
};

const NavbarTitle: React.FC = () => {
    const pathname = usePathname();

    // Pick title based on current URL
const title = useMemo(() => {
    // ✅ dynamic route (items/:id/analyze)
    if (/^\/items\/[^/]+\/analyze$/.test(pathname)) {
        return "تحليل البند";
    }

    // ✅ static routes
    if (routeTitles[pathname]) return routeTitles[pathname];

    // fallback
    const lastSegment = pathname.split("/").filter(Boolean).pop();
    if (!lastSegment) return "Dashboard";

    return lastSegment
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
}, [pathname]);

    return (
        <h1 className="text-lg md:text-2xl font-semibold text-gray-800 tracking-wide drop-shadow-sm">
            {title}
        </h1>
    );
};

export default NavbarTitle;
