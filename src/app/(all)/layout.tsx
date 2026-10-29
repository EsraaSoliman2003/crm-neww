"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";
import Navbar from "@/components/navbar/Navbar";
import Sidebar from "@/components/Sidebar/Sidebar";
import Breadcrumb from "@/components/breadcrumb/Breadcrumb";

export default function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { role } = useAuth();

  useEffect(() => {
    if (
      !role?.length ||
      (!role.includes("ADMIN") && !role.includes("EMPLOYEE"))
    ) {
      router.replace("/login");
    }
  }, [role, router]);

  return (
    <main className="app-shell flex min-h-screen">
      <Sidebar />
      <section className="app-content flex-1 min-w-0 mb-8">
        <div className="app-header-shell">
          <Navbar />
          <Breadcrumb />
        </div>
        <div className="app-theme p-4">{children}</div>
      </section>
    </main>
  );
}
