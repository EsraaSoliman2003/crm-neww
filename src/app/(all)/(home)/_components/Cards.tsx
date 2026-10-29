"use client";
import axios from "@/lib/axios";
import {
  ArrowUpLeft,
  BrickWall,
  Building2,
  ClipboardList,
  FolderKanban,
  StretchHorizontal,
  TrendingUpDown,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface Statistical {
  projectsCount: number;
  companiesCount: number;
  suppliersCount: number;
  itemsCount: number;
  estimatesCount: number;
  materialsCount: number;
}

export default function Cards() {
  const [data, setdata] = useState<Statistical>();
  const [loading, setloading] = useState<boolean>();
  useEffect(() => {
    const getData = async () => {
      try {
        setloading(true);
        const res = await axios.get("Home");
        setdata(res.data.statistical);
      } catch (error) {
        console.log(error);
      } finally {
        setloading(false);
      }
    };
    getData();
  }, []);
  const cardsData = [
    {
      title: "المشاريع",
      value: data?.projectsCount,
      icon: FolderKanban,
      href: "/projects",
      color: "text-sky-600",
      bg: "bg-sky-50",
    },
    {
      title: "المقايسات",
      value: data?.estimatesCount,
      icon: TrendingUpDown,
      href: "/estimates",
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      title: "الشركات",
      value: data?.companiesCount,
      icon: Building2,
      href: "/companies",
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      title: "الموردين",
      value: data?.suppliersCount,
      icon: Users,
      href: "/suppliers",
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      title: "البنود",
      value: data?.itemsCount,
      icon: StretchHorizontal,
      href: "/items",
      color: "text-rose-600",
      bg: "bg-rose-50",
    },
    {
      title: "الخامات",
      value: data?.materialsCount,
      icon: BrickWall,
      href: "/material",
      color: "text-teal-600",
      bg: "bg-teal-50",
    },
  ];

  const quickActions = [
    {
      title: "إضافة مشروع",
      href: "/projects/add-project",
      icon: FolderKanban,
    },
    {
      title: "إضافة مقايسة",
      href: "/estimates/add-estimate",
      icon: ClipboardList,
    },
    {
      title: "إضافة بند",
      href: "/items/add-item",
      icon: StretchHorizontal,
    },
    {
      title: "إضافة خامة",
      href: "/material/add-material",
      icon: BrickWall,
    },
    {
      title: "إضافة مورد",
      href: "/suppliers/add-supplier",
      icon: Users,
    },
    {
      title: "إضافة شركة",
      href: "/companies/add-company",
      icon: Building2,
    },
  ];

  return (
    <div className="space-y-8">
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">ملخص النظام</h2>
            <p className="mt-1 text-sm text-gray-500">
              نظرة عامة على الأرقام الحالية داخل النظام
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cardsData.map((card) => {
            const Icon = card.icon;

            return (
              <Link
                key={card.title}
                href={card.href}
                className="group border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-500">
                      {card.title}
                    </p>
                    <div className="mt-3 h-11">
                      {loading ? (
                        <div className="h-9 w-20 animate-pulse bg-gray-100" />
                      ) : (
                        <h3 className="text-3xl font-bold text-gray-900">
                          {card.value ?? 0}
                        </h3>
                      )}
                    </div>
                  </div>

                  <div className={`p-3 ${card.bg} ${card.color}`}>
                    <Icon size={28} />
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4 text-sm font-semibold text-gray-500">
                  <span>عرض التفاصيل</span>
                  <ArrowUpLeft
                    size={16}
                    className="transition group-hover:-translate-x-1 group-hover:translate-y-1"
                  />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="bg-white border border-gray-200 p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-gray-900">إجراءات سريعة</h2>
          <p className="mt-1 text-sm text-gray-500">
            اختصارات للعمليات الأكثر استخداما
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {quickActions.map((action) => {
            const Icon = action.icon;

            return (
              <Link
                key={action.title}
                href={action.href}
                className="flex items-center justify-between border border-gray-200 px-4 py-3 text-gray-700 transition hover:border-[#bf0200] hover:bg-red-50 hover:text-[#bf0200]"
              >
                <span className="font-semibold">{action.title}</span>
                <Icon size={20} />
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
