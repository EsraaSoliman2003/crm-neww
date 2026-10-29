"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/navbar/Navbar";
import Sidebar from "@/components/Sidebar/Sidebar";

export default function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { role } = useAuth();

  useEffect(() => {
    if (!role || !role.includes("COMPANY")) {
      router.push("/login");
    }
  }, [role, router]);
  return (
    <>
      <main className="flex min-h-screen">
        {/* Sidebar */}
        <Sidebar />

        {/* Content */}
        <section className="flex-1 min-w-0">
          <Navbar />
          <div>{children}</div>
        </section>
      </main>
    </>
  );
}